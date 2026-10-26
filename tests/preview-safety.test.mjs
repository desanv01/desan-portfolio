import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  writeFile,
  rm,
  symlink,
  lstat,
} from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const workspace = process.cwd();
const packager = resolve('scripts/package-preview.mjs');

async function fixture(
  t,
  extraPath,
  content = 'private fixture',
  env = {},
  privateEnv,
  setup,
) {
  const parent = resolve(workspace, 'tmp');
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(resolve(parent, 'preview-safety-'));
  t.after(async () => {
    const within = relative(parent, root);
    assert.ok(within && !within.startsWith('..') && !isAbsolute(within));
    await rm(root, { recursive: true, force: true });
  });
  await mkdir(resolve(root, '.next/standalone'), { recursive: true });
  await mkdir(resolve(root, '.next/static'), { recursive: true });
  await writeFile(
    resolve(root, '.next/standalone/server.js'),
    '// Synthetic package fixture',
  );
  if (privateEnv) await writeFile(resolve(root, '.env.local'), privateEnv);
  if (extraPath) {
    const target = resolve(root, extraPath);
    await mkdir(resolve(target, '..'), { recursive: true });
    await writeFile(target, content);
  }
  if (setup) await setup(root);
  return spawnSync(process.execPath, [packager], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    timeout: 20000,
  });
}

test('clean synthetic preview package succeeds', async (t) => {
  const result = await fixture(t);
  assert.equal(result.status, 0, result.stderr);
});

test('preview materializes internal runtime junctions as portable directories', async (t) => {
  let packagedLink;
  const result = await fixture(
    t,
    undefined,
    undefined,
    {},
    undefined,
    async (root) => {
      const target = resolve(root, '.next/standalone/node_modules/synthetic');
      const link = resolve(root, '.next/standalone/runtime-alias');
      await mkdir(target, { recursive: true });
      await writeFile(resolve(target, 'index.js'), '// synthetic runtime');
      await symlink(target, link, 'junction');
      packagedLink = resolve(root, 'tmp/phase2-preview/runtime-alias');
    },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal((await lstat(packagedLink)).isSymbolicLink(), false);
});

test('preview refuses runtime junctions escaping the generated tree', async (t) => {
  const result = await fixture(
    t,
    undefined,
    undefined,
    {},
    undefined,
    async (root) => {
      const target = resolve(root, 'private-source');
      await mkdir(target);
      await symlink(
        target,
        resolve(root, '.next/standalone/escape'),
        'junction',
      );
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /link escapes the generated tree/);
});

for (const assetRoot of ['public', '.next/static']) {
  test(`preview refuses ${assetRoot} links to private source directories`, async (t) => {
    const result = await fixture(
      t,
      undefined,
      undefined,
      {},
      undefined,
      async (root) => {
        const target = resolve(root, 'private-source');
        await mkdir(target);
        await writeFile(
          resolve(target, 'record.txt'),
          'synthetic private source',
        );
        await mkdir(resolve(root, assetRoot), { recursive: true });
        await symlink(
          target,
          resolve(root, assetRoot, 'innocent-name'),
          'junction',
        );
      },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Preview asset links are not allowed/);
  });
}

for (const path of [
  '.next/standalone/.env.local',
  '.next/standalone/nested/phase3-recovery/message.json',
  '.next/standalone/tmp/private-record.json',
  'public/.env.production',
]) {
  test(`preview refuses private path ${path}`, async (t) => {
    const result = await fixture(t, path);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /private environment or runtime files/);
  });
}

test('preview refuses embedded runtime secret without printing it', async (t) => {
  const secret = 'synthetic-secret-fixture-40-characters';
  const result = await fixture(t, '.next/standalone/config.js', secret, {
    PAYLOAD_SECRET: secret,
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /configured private runtime value/);
  assert.ok(!result.stderr.includes(secret));
});

test('preview refuses an alternate configured private media directory', async (t) => {
  const result = await fixture(
    t,
    '.next/standalone/custom-private-media/upload.dat',
    'synthetic private upload',
    {
      MEDIA_DIRECTORY: 'custom-private-media',
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /private environment or runtime files/);
});

test('direct packager invocation loads private env for embedded-value detection', async (t) => {
  const secret = 'synthetic-local-env-value-40-characters';
  const result = await fixture(
    t,
    '.next/standalone/config.js',
    secret,
    {},
    `OWNER_PASSWORD=${secret}`,
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /configured private runtime value/);
  assert.ok(!result.stderr.includes(secret));
});

test('preview refuses an alternate configured private recovery directory', async (t) => {
  const result = await fixture(
    t,
    '.next/standalone/custom-recovery/message.json',
    'synthetic reset token',
    {
      RECOVERY_SPOOL_DIRECTORY: 'custom-recovery',
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /private environment or runtime files/);
});
