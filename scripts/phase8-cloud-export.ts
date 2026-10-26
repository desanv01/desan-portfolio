import { mkdir, writeFile, readFile, lstat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  storageConfig,
  readPrivateObject,
  type StorageConfig,
} from '../src/cms/media-storage';
import { canonicalProspective, inside, sha256 } from './phase8-backup.mjs';

type Entry = {
  bucket: 'media' | 'cache';
  path: string;
  bytes: number;
  sha256: string;
};
function safePath(path: string) {
  return (
    path.length <= 512 &&
    path
      .split('/')
      .every(
        (part) =>
          /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,254}$/.test(part) &&
          !['.', '..'].includes(part),
      )
  );
}
function auth(config: StorageConfig) {
  return {
    apikey: config.key,
    ...(!config.key.startsWith('sb_secret_')
      ? { Authorization: `Bearer ${config.key}` }
      : {}),
  };
}
async function list(
  bucket: string,
  prefix: string,
  config: StorageConfig,
  request: typeof fetch,
): Promise<string[]> {
  if (prefix && (!safePath(prefix) || prefix.split('/').length > 4))
    throw new Error('Unsafe object prefix');
  const output: string[] = [];
  for (let offset = 0; offset <= 100000; offset += 100) {
    const response = await request(
      `${config.url}/storage/v1/object/list/${bucket}`,
      {
        method: 'POST',
        headers: { ...auth(config), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix,
          limit: 100,
          offset,
          sortBy: { column: 'name', order: 'asc' },
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) throw new Error('Private object listing failed');
    const raw = await response.text();
    if (Buffer.byteLength(raw) > 1024 * 1024)
      throw new Error('Object listing exceeded bound');
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows) || rows.length > 100)
      throw new Error('Invalid object listing');
    for (const row of rows) {
      if (
        typeof row.name !== 'string' ||
        !safePath(row.name) ||
        row.name.includes('/')
      )
        throw new Error('Unsafe object name');
      const path = prefix ? `${prefix}/${row.name}` : row.name;
      if (row.id === null)
        output.push(...(await list(bucket, path, config, request)));
      else if (typeof row.id === 'string') output.push(path);
      else throw new Error('Invalid object identity');
      if (output.length > 100000)
        throw new Error('Too many objects for one reviewed export');
    }
    if (rows.length < 100) return output;
  }
  throw new Error('Object listing did not terminate');
}
export async function cloudExport(
  directory: string,
  quiesced: boolean,
  options: {
    config?: StorageConfig;
    fetch?: typeof fetch;
    read?: typeof readPrivateObject;
  } = {},
) {
  if (!directory || !quiesced)
    throw new Error(
      'Use a NEW private directory and explicit --quiesced confirmation',
    );
  const root = resolve(directory),
    canonical = await canonicalProspective(root);
  if (
    canonical === dirname(canonical) ||
    canonical === (await canonicalProspective('.')) ||
    inside(await canonicalProspective('public'), canonical)
  )
    throw new Error(
      'Cloud export cannot be served or written at workspace/root',
    );
  const config = options.config || storageConfig(),
    request = options.fetch || fetch,
    read = options.read || readPrivateObject;
  await mkdir(root, { recursive: false, mode: 0o700 });
  const files: Entry[] = [];
  for (const [label, bucket] of [
    ['media', config.mediaBucket],
    ['cache', config.cacheBucket],
  ] as const) {
    const objects = await list(bucket, '', config, request);
    await mkdir(resolve(root, label), { mode: 0o700 });
    for (const path of objects) {
      const bytes = await read(
        bucket,
        path,
        label === 'media' ? 4 * 1024 * 1024 : 1024 * 1024,
        { config, fetch: request },
      );
      const filename = resolve(root, label, path);
      if (!inside(resolve(root, label), filename))
        throw new Error('Object path escaped export root');
      await mkdir(dirname(filename), { recursive: true, mode: 0o700 });
      await writeFile(filename, bytes, { flag: 'wx', mode: 0o600 });
      files.push({
        bucket: label,
        path,
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
    }
    if (
      JSON.stringify(objects.sort()) !==
      JSON.stringify((await list(bucket, '', config, request)).sort())
    )
      throw new Error('Object inventory changed; keep writers stopped');
  }
  const manifest = {
    format: 'desan-private-storage-export',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    projectURL: config.url,
    quiesced: true,
    files,
    note: 'Private bytes only; no keys/credentials included. Pair with the same quiesced public-schema database dump and separate secret escrow. This command never modifies the live bucket.',
  };
  await writeFile(
    resolve(root, 'cloud-storage-manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    { flag: 'wx', mode: 0o600 },
  );
  await verifyCloudExport(root);
  return manifest;
}
export async function verifyCloudExport(directory: string) {
  const root = resolve(directory),
    info = await lstat(root);
  if (!info.isDirectory() || info.isSymbolicLink())
    throw new Error('Invalid export root');
  const filename = resolve(root, 'cloud-storage-manifest.json'),
    metadata = await lstat(filename);
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.size > 20 * 1024 * 1024
  )
    throw new Error('Invalid cloud export manifest');
  const manifest = JSON.parse(await readFile(filename, 'utf8'));
  if (
    manifest.format !== 'desan-private-storage-export' ||
    manifest.schemaVersion !== 1 ||
    manifest.quiesced !== true ||
    !Array.isArray(manifest.files) ||
    manifest.files.length > 100000
  )
    throw new Error('Invalid cloud export manifest');
  const seen = new Set<string>();
  for (const file of manifest.files) {
    const id = `${file.bucket}/${file.path}`;
    if (
      !['media', 'cache'].includes(file.bucket) ||
      !safePath(file.path) ||
      seen.has(id) ||
      !Number.isSafeInteger(file.bytes) ||
      file.bytes < 0 ||
      !/^[a-f0-9]{64}$/.test(file.sha256)
    )
      throw new Error('Unsafe or duplicate cloud export entry');
    seen.add(id);
    const path = resolve(root, file.bucket, file.path);
    if (
      !inside(
        await canonicalProspective(root),
        await canonicalProspective(path),
      )
    )
      throw new Error('Export path escaped root');
    const stat = await lstat(path);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      stat.size !== file.bytes ||
      (await sha256(path)) !== file.sha256
    )
      throw new Error('Cloud export checksum mismatch');
  }
  return manifest;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const action = process.argv[2],
    directory = process.argv[process.argv.indexOf('--directory') + 1];
  try {
    if (!process.argv.includes('--directory'))
      throw new Error('Explicit directory required');
    const result =
      action === 'export'
        ? await cloudExport(directory, process.argv.includes('--quiesced'))
        : action === 'verify'
          ? await verifyCloudExport(directory)
          : null;
    if (!result) throw new Error('Use export or verify');
    console.log(
      JSON.stringify({ action, verified: true, files: result.files.length }),
    );
  } catch {
    console.error(
      'Private cloud export failed. Preserve partial data and verify the operator configuration; no live objects were modified.',
    );
    process.exitCode = 1;
  }
}
