import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import {
  mkdir,
  lstat,
  readdir,
  readFile,
  writeFile,
  copyFile,
  rename,
  stat,
  realpath,
  unlink,
} from 'node:fs/promises';
import {
  basename,
  dirname,
  isAbsolute,
  resolve,
  relative,
  sep,
} from 'node:path';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

export function databaseTarget(uri) {
  let url;
  try {
    url = new URL(uri);
  } catch {
    throw new Error('A private PostgreSQL URI is required');
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !/^\/[a-zA-Z0-9_]+$/.test(url.pathname) ||
    !url.hostname ||
    url.hash ||
    [...url.searchParams.keys()].some((key) => key !== 'sslmode') ||
    (url.searchParams.has('sslmode') &&
      url.searchParams.get('sslmode') !== 'verify-full')
  )
    throw new Error(
      'Use a PostgreSQL URI with verified TLS (optional sslmode=verify-full)',
    );
  return {
    name: url.pathname.slice(1),
    host: url.hostname,
    port: url.port || '5432',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    sslMode:
      url.searchParams.get('sslmode') ||
      (['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
        ? 'prefer'
        : 'verify-full'),
  };
}
export function inside(parent, child) {
  const path = relative(resolve(parent), resolve(child));
  return (
    path === '' ||
    (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path))
  );
}
/** Resolve the nearest existing ancestor, including Windows junctions, then
 * append only the not-yet-existing suffix. Lexical checks alone miss aliases. */
export async function canonicalProspective(filename) {
  let ancestor = resolve(filename);
  const suffix = [];
  while (true) {
    try {
      return resolve(await realpath(ancestor), ...suffix);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = dirname(ancestor);
      if (parent === ancestor) throw new Error('Path has no existing ancestor');
      suffix.unshift(basename(ancestor));
      ancestor = parent;
    }
  }
}
export function safeName(name) {
  return (
    typeof name === 'string' &&
    name.length <= 255 &&
    /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name) &&
    name !== '.' &&
    name !== '..'
  );
}
export async function sha256(filename) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}
export function pgCommand(tool, target, container) {
  if (!['pg_dump', 'pg_restore', 'psql'].includes(tool))
    throw new Error('Unsupported database tool');
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([name]) =>
      [
        'PATH',
        'HOME',
        'USERPROFILE',
        'SYSTEMROOT',
        'WINDIR',
        'TEMP',
        'TMP',
        'LANG',
        'LC_ALL',
        'PGSSLROOTCERT',
      ].includes(name.toUpperCase()),
    ),
  );
  Object.assign(env, {
    PGDATABASE: target.name,
    PGUSER: target.user,
    PGPASSWORD: target.password,
    PGHOST: target.host,
    PGPORT: target.port,
    PGSSLMODE: target.sslMode,
    PGCONNECT_TIMEOUT: '10',
  });
  // Explicit local container uses its Unix socket. Credentials never enter argv.
  if (container) {
    if (
      !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(container) ||
      !['127.0.0.1', 'localhost', '[::1]'].includes(target.host)
    )
      throw new Error(
        'Container adapter requires an explicit local container and loopback source URI',
      );
    return {
      command: 'docker',
      args: [
        'exec',
        '-i',
        container,
        tool,
        '--username',
        target.user,
        '--dbname',
        target.name,
      ],
      env,
    };
  }
  return { command: tool, args: ['--dbname', target.name], env };
}
/** Binary pipes, no shell or URI arguments. Never log raw tool errors/credentials. */
export async function runPG(
  tool,
  target,
  {
    container,
    args = [],
    output,
    input,
    timeoutMs = 300000,
    maxOutputBytes = 65536,
  } = {},
) {
  const command = pgCommand(tool, target, container);
  const child = spawn(command.command, [...command.args, ...args], {
    env: command.env,
    shell: false,
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let stderr = 0;
  child.stderr.on('data', (chunk) => {
    stderr += chunk.length;
  });
  const timer = setTimeout(() => child.kill('SIGTERM'), timeoutMs);
  const exited = new Promise((resolveExit, reject) => {
    child.once('error', () =>
      reject(new Error('Database tool could not start')),
    );
    child.once('close', (code) =>
      code === 0
        ? resolveExit()
        : reject(
            new Error(
              'Database tool failed; verify target, credentials, client version and operator permissions',
            ),
          ),
    );
  });
  const chunks = [];
  let size = 0;
  if (!output)
    child.stdout.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxOutputBytes) child.kill('SIGTERM');
      else chunks.push(chunk);
    });
  try {
    await Promise.all([
      exited,
      output
        ? pipeline(
            child.stdout,
            createWriteStream(output, { flags: 'wx', mode: 0o600 }),
          )
        : Promise.resolve(),
      input
        ? pipeline(createReadStream(input), child.stdin)
        : (child.stdin.end(), Promise.resolve()),
    ]);
    if (size > maxOutputBytes || stderr > 1024 * 1024)
      throw new Error('Database tool output exceeded its diagnostic bound');
    return Buffer.concat(chunks).toString('utf8');
  } finally {
    clearTimeout(timer);
    if (child.exitCode === null) child.kill('SIGTERM');
  }
}
export function filteredRestoreTOC(text) {
  if (
    !text.includes('; Archive created') &&
    !/^\d+;\s+\d+\s+\d+\s+/m.test(text)
  )
    throw new Error('Invalid restore table of contents');
  return (
    text
      .split('\n')
      .filter(
        (line) =>
          !/^\d+;\s+\d+\s+\d+\s+SCHEMA\s+-\s+public\s/.test(line) &&
          !/^\d+;\s+\d+\s+\d+\s+COMMENT\s+-\s+SCHEMA\s+public(?:\s|$)/.test(
            line,
          ),
      )
      .join('\n') + '\n'
  );
}
async function dockerFile(args) {
  const child = spawn('docker', args, {
    shell: false,
    windowsHide: true,
    stdio: 'ignore',
  });
  const timer = setTimeout(() => child.kill('SIGTERM'), 30000);
  try {
    await new Promise((done, reject) => {
      child.once('error', () =>
        reject(new Error('Private restore list transfer failed')),
      );
      child.once('exit', (code) =>
        code === 0
          ? done()
          : reject(new Error('Private restore list transfer failed')),
      );
    });
  } finally {
    clearTimeout(timer);
  }
}
export async function mediaFiles(directory) {
  const root = resolve(directory);
  const canonical = await canonicalProspective(root);
  if (
    !(await lstat(root)).isDirectory() ||
    root === dirname(root) ||
    canonical === (await canonicalProspective('.')) ||
    inside(await canonicalProspective('public'), canonical)
  )
    throw new Error(
      'Use a private media directory, not a workspace/public root',
    );
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isFile() || entry.isSymbolicLink() || !safeName(entry.name))
      throw new Error(
        'Media backup rejects directories, links and unsafe names',
      );
    files.push(entry.name);
  }
  return files.sort();
}
export async function publicationReceipt(target, container, runner = runPG) {
  const raw = await runner('psql', target, {
    container,
    args: [
      '-X',
      '-A',
      '-t',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      "SELECT json_build_object('revision',s.revision,'payloadMD5',md5(p.payload::text))::text FROM publication_state s LEFT JOIN publication_snapshots p ON p.id=s.snapshot_id WHERE s.singleton=1;",
    ],
  });
  const value = raw.trim()
    ? JSON.parse(raw.trim())
    : { revision: null, payloadMD5: null };
  if (
    !(
      value.revision === null ||
      (typeof value.revision === 'string' && value.revision.length <= 100)
    ) ||
    !(value.payloadMD5 === null || /^[a-f0-9]{32}$/.test(value.payloadMD5))
  )
    throw new Error('Invalid publication receipt');
  return { revision: value.revision, payloadMD5: value.payloadMD5 };
}
export async function backup({
  directory,
  mediaDirectory = process.env.MEDIA_DIRECTORY,
  uri = process.env.DATABASE_URI,
  container,
  quiesced = false,
  runner = runPG,
}) {
  if (!quiesced)
    throw new Error(
      'Stop app and scheduler writes, then explicitly confirm quiesced backup',
    );
  if (!directory || !mediaDirectory)
    throw new Error(
      'Explicit private backup and media directories are required',
    );
  const output = resolve(directory),
    media = resolve(mediaDirectory),
    target = databaseTarget(uri);
  const [canonicalOutput, canonicalMedia, canonicalPublic, canonicalWorkspace] =
    await Promise.all([
      canonicalProspective(output),
      canonicalProspective(media),
      canonicalProspective('public'),
      canonicalProspective('.'),
    ]);
  if (
    inside(canonicalMedia, canonicalOutput) ||
    inside(canonicalOutput, canonicalMedia) ||
    inside(canonicalPublic, canonicalOutput) ||
    canonicalOutput === canonicalWorkspace ||
    canonicalOutput === dirname(canonicalOutput)
  )
    throw new Error(
      'Backup and media directories must be separate private paths',
    );
  const files = await mediaFiles(media);
  await mkdir(output, { recursive: false, mode: 0o700 }); // refuse existing backup
  const publication = await publicationReceipt(target, container, runner);
  const partial = resolve(output, 'database.dump.pending');
  await runner('pg_dump', target, {
    container,
    args: ['--format=custom', '--schema=public', '--no-owner', '--no-acl'],
    output: partial,
  });
  await rename(partial, resolve(output, 'database.dump'));
  const destination = resolve(output, 'media');
  await mkdir(destination, { mode: 0o700 });
  const inventory = [];
  for (const name of files) {
    const source = resolve(media, name),
      copy = resolve(destination, name);
    if (
      !(await lstat(source)).isFile() ||
      (await lstat(source)).isSymbolicLink()
    )
      throw new Error('Media changed during backup');
    const before = await sha256(source);
    await copyFile(source, copy);
    const after = await sha256(copy);
    if (before !== after || before !== (await sha256(source)))
      throw new Error('Media changed during backup; keep writers stopped');
    inventory.push({
      path: name,
      bytes: (await stat(copy)).size,
      sha256: after,
    });
  }
  if (JSON.stringify(files) !== JSON.stringify(await mediaFiles(media)))
    throw new Error('Media inventory changed during backup');
  if (
    JSON.stringify(publication) !==
    JSON.stringify(await publicationReceipt(target, container, runner))
  )
    throw new Error(
      'Live publication changed during backup; keep writers stopped',
    );
  const databaseFile = resolve(output, 'database.dump');
  const manifest = {
    format: 'desan-operational-backup',
    schemaVersion: 1,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    sourceDatabase: target.name,
    quiesced: true,
    publication,
    database: {
      path: 'database.dump',
      bytes: (await stat(databaseFile)).size,
      sha256: await sha256(databaseFile),
    },
    media: inventory,
    secretEscrow:
      'PAYLOAD_SECRET and runtime credentials are deliberately absent; preserve separately in an encrypted operator vault.',
    recoveryMail: 'Local token spool deliberately excluded.',
  };
  await writeFile(
    resolve(output, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    { flag: 'wx', mode: 0o600 },
  );
  await verifyBackup(output);
  return manifest;
}
export async function verifyBackup(directory) {
  const root = resolve(directory);
  for (const folder of [root, resolve(root, 'media')]) {
    const info = await lstat(folder);
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new Error('Backup directories cannot be links');
  }
  const manifestFile = resolve(root, 'manifest.json');
  const manifestInfo = await lstat(manifestFile);
  if (
    !manifestInfo.isFile() ||
    manifestInfo.isSymbolicLink() ||
    manifestInfo.size > 10 * 1024 * 1024
  )
    throw new Error('Invalid backup manifest file');
  const raw = await readFile(manifestFile, 'utf8');
  if (Buffer.byteLength(raw) > 10 * 1024 * 1024)
    throw new Error('Backup manifest exceeds bound');
  const manifest = JSON.parse(raw);
  if (
    manifest.format !== 'desan-operational-backup' ||
    manifest.schemaVersion !== 1 ||
    manifest.quiesced !== true ||
    manifest.database?.path !== 'database.dump' ||
    !Array.isArray(manifest.media) ||
    manifest.media.length > 100000 ||
    !/^[a-zA-Z0-9_]+$/.test(manifest.sourceDatabase)
  )
    throw new Error('Invalid backup manifest');
  const names = new Set();
  for (const entry of [manifest.database, ...manifest.media]) {
    const identity =
      (entry === manifest.database ? 'db:' : 'media:') + entry.path;
    if (
      !safeName(entry.path) ||
      names.has(identity) ||
      !Number.isSafeInteger(entry.bytes) ||
      entry.bytes < 0 ||
      !/^[a-f0-9]{64}$/.test(entry.sha256)
    )
      throw new Error('Invalid/duplicate backup file metadata');
    names.add(identity);
    const filename =
      entry === manifest.database
        ? resolve(root, entry.path)
        : resolve(root, 'media', entry.path);
    const file = await lstat(filename);
    if (
      !file.isFile() ||
      file.isSymbolicLink() ||
      file.size !== entry.bytes ||
      (await sha256(filename)) !== entry.sha256
    )
      throw new Error('Backup file integrity check failed');
  }
  if (
    JSON.stringify((await mediaFiles(resolve(root, 'media'))).sort()) !==
    JSON.stringify(manifest.media.map((entry) => entry.path).sort())
  )
    throw new Error('Backup media inventory does not match manifest');
  return manifest;
}
export async function restore({
  directory,
  mediaDirectory,
  uri = process.env.RESTORE_DATABASE_URI,
  sourceURI = process.env.DATABASE_URI,
  container,
  confirm = false,
  runner = runPG,
}) {
  if (!confirm)
    throw new Error('Explicit isolated-restore confirmation is required');
  if (!directory || !mediaDirectory)
    throw new Error('Explicit backup and NEW restore media paths are required');
  const manifest = await verifyBackup(directory),
    target = databaseTarget(uri),
    source = sourceURI ? databaseTarget(sourceURI) : null;
  if (
    !/_restore(?:_[a-zA-Z0-9]+)?$/.test(target.name) ||
    target.name === manifest.sourceDatabase ||
    (source &&
      source.name === target.name &&
      source.host === target.host &&
      source.port === target.port)
  )
    throw new Error(
      'Restore requires a separate *_restore database; source/approved database overwrite is forbidden',
    );
  const media = resolve(mediaDirectory),
    backupRoot = resolve(directory),
    liveMedia = process.env.MEDIA_DIRECTORY
      ? resolve(process.env.MEDIA_DIRECTORY)
      : null;
  const [
    canonicalMedia,
    canonicalBackup,
    canonicalPublic,
    canonicalWorkspace,
    canonicalLive,
  ] = await Promise.all([
    canonicalProspective(media),
    canonicalProspective(backupRoot),
    canonicalProspective('public'),
    canonicalProspective('.'),
    liveMedia ? canonicalProspective(liveMedia) : Promise.resolve(null),
  ]);
  if (
    canonicalMedia === dirname(canonicalMedia) ||
    canonicalMedia === canonicalWorkspace ||
    inside(canonicalPublic, canonicalMedia) ||
    inside(canonicalBackup, canonicalMedia) ||
    inside(canonicalMedia, canonicalBackup) ||
    (canonicalLive &&
      (inside(canonicalLive, canonicalMedia) ||
        inside(canonicalMedia, canonicalLive)))
  )
    throw new Error('Restore media must be a separate NEW private directory');
  // Read-only target check before any restore. No --clean, drop or overwrite.
  const tables = await runner('psql', target, {
    container,
    args: [
      '-X',
      '-A',
      '-t',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      "SELECT count(*) FROM (SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' UNION ALL SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' UNION ALL SELECT t.oid FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' UNION ALL SELECT e.oid FROM pg_extension e WHERE e.extname<>'plpgsql' UNION ALL SELECT n.oid FROM pg_namespace n WHERE n.nspname NOT IN ('public','information_schema') AND n.nspname NOT LIKE 'pg_%') objects;",
    ],
  });
  if (tables.trim() !== '0') throw new Error('Restore target is not empty');
  const toc = await runner('pg_restore', target, {
    container,
    args: ['--list'],
    input: resolve(backupRoot, 'database.dump'),
    maxOutputBytes: 5 * 1024 * 1024,
  });
  const listFile = resolve(
    dirname(media),
    `.phase8-restore-${randomUUID()}.list`,
  );
  await writeFile(listFile, filteredRestoreTOC(toc), {
    flag: 'wx',
    mode: 0o600,
  });
  const remoteList = `/tmp/desan-restore-${randomUUID()}.list`;
  if (container)
    await dockerFile(['cp', listFile, `${container}:${remoteList}`]);
  await mkdir(media, { recursive: false, mode: 0o700 });
  for (const entry of manifest.media)
    await copyFile(
      resolve(backupRoot, 'media', entry.path),
      resolve(media, entry.path),
    );
  await runner('pg_restore', target, {
    container,
    args: [
      '--exit-on-error',
      '--single-transaction',
      '--no-owner',
      '--no-acl',
      '--use-list',
      container ? remoteList : listFile,
    ],
    input: resolve(backupRoot, 'database.dump'),
  });
  await unlink(listFile);
  if (container) await dockerFile(['exec', container, 'rm', '--', remoteList]);
  const publication = await publicationReceipt(target, container, runner);
  if (JSON.stringify(publication) !== JSON.stringify(manifest.publication))
    throw new Error(
      'Restored publication revision/payload fingerprint differs from backup',
    );
  for (const entry of manifest.media)
    if ((await sha256(resolve(media, entry.path))) !== entry.sha256)
      throw new Error('Restored media integrity check failed');
  return {
    restored: true,
    backupId: manifest.id,
    database: target.name,
    mediaFiles: manifest.media.length,
    publication,
    next: 'Verify selected graph, owner session reset and all public media against the isolated runtime before recovery cutover.',
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const [action, ...args] = process.argv.slice(2);
  const options = {};
  while (args.length) {
    const arg = args.shift();
    if (arg === '--quiesced') options.quiesced = true;
    else if (arg === '--confirm-isolated-restore') options.confirm = true;
    else if (['--directory', '--media-directory', '--container'].includes(arg))
      options[arg.slice(2).replace('-d', 'D')] = args.shift();
    else throw new Error('Unknown backup operation option');
  }
  try {
    const result =
      action === 'backup'
        ? await backup(options)
        : action === 'verify'
          ? await verifyBackup(options.directory)
          : action === 'restore'
            ? await restore(options)
            : null;
    if (!result) throw new Error('Use backup, verify or restore');
    console.log(
      JSON.stringify({
        action,
        verified: true,
        backupId: result.id || result.backupId,
        mediaFiles: result.media?.length ?? result.mediaFiles,
      }),
    );
  } catch {
    console.error(
      'Backup/restore operation failed. Preserve partial files, check the private target/configuration and do not cut over.',
    );
    process.exitCode = 1;
  }
}
