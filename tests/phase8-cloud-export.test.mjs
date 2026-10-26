import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import {
  cloudExport,
  verifyCloudExport,
} from '../scripts/phase8-cloud-export.ts';

test('cloud export captures both private buckets with checksum inventory and rejects tampered/traversing entries', async (t) => {
  await mkdir(resolve('tmp'), { recursive: true });
  const parent = await mkdtemp(resolve('tmp/phase8-cloud-export-'));
  t.after(async () => {
    assert.equal(dirname(parent), resolve('tmp'));
    await rm(parent, { recursive: true, force: true });
  });
  const config = {
    url: 'https://' + 'a'.repeat(20) + '.supabase.co',
    key: 'synthetic-private-key',
    mediaBucket: 'desan-media',
    cacheBucket: 'desan-cache',
  };
  const request = async (url, init) => {
    const { prefix } = JSON.parse(init.body);
    assert.equal(init.method, 'POST');
    assert.equal(init.redirect, 'error');
    if (url.endsWith('/desan-media'))
      return Response.json([{ name: 'resource.png', id: 'one' }]);
    return Response.json(
      prefix
        ? [{ name: 'cache.json', id: 'two' }]
        : [{ name: 'github', id: null }],
    );
  };
  const root = join(parent, 'export');
  const result = await cloudExport(root, true, {
    config,
    fetch: request,
    read: async (_bucket, path) => Buffer.from(path),
  });
  assert.deepEqual(
    result.files.map((file) => `${file.bucket}/${file.path}`),
    ['media/resource.png', 'cache/github/cache.json'],
  );
  assert.ok(!JSON.stringify(result).includes(config.key));
  const filename = join(root, 'cloud-storage-manifest.json'),
    original = await readFile(filename, 'utf8');
  const corrupt = JSON.parse(original);
  corrupt.files[0].path = '../../escape';
  await writeFile(filename, JSON.stringify(corrupt));
  await assert.rejects(verifyCloudExport(root), /Unsafe/);
  await writeFile(filename, original);
  await writeFile(join(root, 'media/resource.png'), 'tampered');
  await assert.rejects(verifyCloudExport(root), /checksum/);
});
