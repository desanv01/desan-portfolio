import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mkdir,
  mkdtemp,
  writeFile,
  readFile,
  rm,
  symlink,
} from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import {
  backup,
  verifyBackup,
  restore,
  pgCommand,
  databaseTarget,
  filteredRestoreTOC,
} from '../scripts/phase8-backup.mjs';

async function fixture(t) {
  await mkdir(resolve('tmp'), { recursive: true });
  const root = await mkdtemp(resolve('tmp/phase8-backup-test-'));
  t.after(async () => {
    assert.equal(dirname(root), resolve('tmp'));
    await rm(root, { recursive: true, force: true });
  });
  const media = join(root, 'live-media');
  await mkdir(media);
  await writeFile(join(media, 'synthetic.png'), new Uint8Array([1, 2, 3]));
  const receipt = {
    revision: 'synthetic-publication',
    payloadMD5: 'a'.repeat(32),
  };
  const calls = [];
  const runner = async (tool, target, options) => {
    calls.push({ tool, target: target.name, args: options.args });
    if (tool === 'pg_dump') {
      await writeFile(options.output, 'SYNTHETIC-CUSTOM-DUMP');
      return '';
    }
    if (tool === 'psql')
      return options.args.at(-1).includes('pg_class')
        ? '0\n'
        : JSON.stringify(receipt);
    return options.args.includes('--list')
      ? '; Archive created for synthetic test\n4; 2615 2200 SCHEMA - public pg_database_owner\n9; 0 0 COMMENT - SCHEMA public pg_database_owner\n10; 0 1 TABLE public data owner\n'
      : '';
  };
  return { root, media, runner, calls };
}
const uri = 'postgresql://owner:PRIVATE-PASSWORD@127.0.0.1:55433/desan_dev';

test('restore TOC excludes only default public schema creation/comment, retaining user objects', () => {
  const filtered = filteredRestoreTOC(
    '; Archive created for test\n4; 2615 2200 SCHEMA - public owner\n5; 0 0 COMMENT - SCHEMA public owner\n6; 0 0 TABLE public records owner\n7; 0 0 FUNCTION public retained() owner\n8; 0 0 TABLE DATA public records owner\n',
  );
  assert.doesNotMatch(filtered, /SCHEMA - public|COMMENT - SCHEMA public/);
  assert.match(filtered, /TABLE public records/);
  assert.match(filtered, /FUNCTION public retained/);
  assert.match(filtered, /TABLE DATA public records/);
});

test('backup verifies binary/media hashes and isolated restore verifies publication parity without secret argv', async (t) => {
  const f = await fixture(t),
    directory = join(f.root, 'backup');
  const manifest = await backup({
    directory,
    mediaDirectory: f.media,
    uri,
    quiesced: true,
    runner: f.runner,
  });
  assert.equal(manifest.media.length, 1);
  assert.equal((await verifyBackup(directory)).id, manifest.id);
  assert.ok(!JSON.stringify(manifest).includes('PRIVATE-PASSWORD'));
  const command = pgCommand('pg_restore', databaseTarget(uri));
  assert.ok(!command.args.join(' ').includes('PRIVATE-PASSWORD'));
  assert.equal(command.env.PGPASSWORD, 'PRIVATE-PASSWORD');
  assert.ok(command.args.includes('--dbname'));
  const result = await restore({
    directory,
    mediaDirectory: join(f.root, 'restored-media'),
    uri: uri.replace('/desan_dev', '/desan_restore'),
    sourceURI: uri,
    confirm: true,
    runner: f.runner,
  });
  assert.equal(result.restored, true);
  assert.deepEqual(result.publication, manifest.publication);
  assert.deepEqual(
    [...(await readFile(join(f.root, 'restored-media/synthetic.png')))],
    [1, 2, 3],
  );
  assert.ok(
    f.calls.every(
      (call) =>
        !call.args.includes('--clean') && !call.args.includes('--create'),
    ),
  );
  await assert.rejects(
    restore({
      directory,
      mediaDirectory: join(f.root, 'forbidden'),
      uri,
      sourceURI: uri,
      confirm: true,
      runner: f.runner,
    }),
    /separate/,
  );
});

test('traversal, tampered bytes and nonempty restore targets are refused', async (t) => {
  const f = await fixture(t),
    directory = join(f.root, 'backup');
  await backup({
    directory,
    mediaDirectory: f.media,
    uri,
    quiesced: true,
    runner: f.runner,
  });
  await assert.rejects(
    restore({
      directory,
      mediaDirectory: join(f.root, 'restore'),
      uri: uri.replace('/desan_dev', '/desan_restore'),
      confirm: true,
      runner: async () => '2',
    }),
    /not empty/,
  );
  const filename = join(directory, 'manifest.json'),
    original = await readFile(filename, 'utf8');
  const manifest = JSON.parse(original);
  manifest.media[0].path = '../outside';
  await writeFile(filename, JSON.stringify(manifest));
  await assert.rejects(verifyBackup(directory), /Invalid/);
  await writeFile(filename, original);
  await writeFile(join(directory, 'media/synthetic.png'), 'changed');
  await assert.rejects(verifyBackup(directory), /integrity/);
});

test('restore rejects an ancestor symlink/junction alias into live media before any target query/write', async (t) => {
  const f = await fixture(t),
    directory = join(f.root, 'backup');
  await backup({
    directory,
    mediaDirectory: f.media,
    uri,
    quiesced: true,
    runner: f.runner,
  });
  const alias = join(f.root, 'alias');
  await symlink(
    f.media,
    alias,
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  const previous = process.env.MEDIA_DIRECTORY;
  process.env.MEDIA_DIRECTORY = f.media;
  try {
    let called = false;
    await assert.rejects(
      restore({
        directory,
        mediaDirectory: join(alias, 'new/subdirectory'),
        uri: uri.replace('/desan_dev', '/desan_restore'),
        confirm: true,
        runner: async () => {
          called = true;
          return '0';
        },
      }),
      /separate NEW/,
    );
    assert.equal(called, false);
  } finally {
    if (previous === undefined) delete process.env.MEDIA_DIRECTORY;
    else process.env.MEDIA_DIRECTORY = previous;
  }
});
