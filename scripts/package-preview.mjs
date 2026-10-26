import {
  cp,
  lstat,
  mkdir,
  realpath,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { basename, isAbsolute, relative, resolve } from 'node:path';

const root = process.cwd();
// Load private runtime values only to ensure none were embedded in the artifact.
for (const envFile of ['.env.local', 'tmp/phase3-runtime.env']) {
  try {
    process.loadEnvFile(resolve(root, envFile));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
const destination = resolve(root, 'tmp/phase2-preview');
await stat(resolve(root, '.next/standalone/server.js'));
const standalone = await realpath(resolve(root, '.next/standalone'));
// Windows standalone builds can contain absolute junctions. Copy their bytes,
// but refuse links escaping this generated runtime tree.
for (const path of await readdir(standalone, { recursive: true })) {
  const source = resolve(standalone, path);
  if (!(await lstat(source)).isSymbolicLink()) continue;
  const target = relative(standalone, await realpath(source));
  if (target.startsWith('..') || isAbsolute(target)) {
    throw new Error('Standalone runtime link escapes the generated tree');
  }
}
await mkdir(resolve(root, 'tmp'), { recursive: true });
const workspace = await realpath(root);
const parent = await realpath(resolve(root, 'tmp'));
const withinWorkspace = relative(workspace, parent);
if (withinWorkspace.startsWith('..') || isAbsolute(withinWorkspace)) {
  throw new Error('Preview output parent must remain inside the workspace');
}
try {
  if ((await lstat(destination)).isSymbolicLink()) {
    throw new Error('Preview output must not be a symbolic link');
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
// This exact generated directory is owned by this packager; never remove its parent.
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(standalone, destination, { recursive: true, dereference: true });
async function rejectAssetLinks(source) {
  if ((await lstat(source)).isSymbolicLink()) {
    throw new Error('Preview asset links are not allowed');
  }
  return true;
}
await cp(resolve(root, '.next/static'), resolve(destination, '.next/static'), {
  recursive: true,
  filter: rejectAssetLinks,
});
try {
  await stat(resolve(root, 'public'));
  await cp(resolve(root, 'public'), resolve(destination, 'public'), {
    recursive: true,
    filter: rejectAssetLinks,
  });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const packagedPaths = await readdir(destination, { recursive: true });
const privateDirectories = new Set([
  'phase3-media',
  'phase3-recovery',
  'pgdata',
]);
for (const name of ['MEDIA_DIRECTORY', 'RECOVERY_SPOOL_DIRECTORY']) {
  if (process.env[name])
    privateDirectories.add(basename(resolve(process.env[name])));
}
const privatePaths = packagedPaths.filter((path) => {
  const parts = path.replaceAll('\\', '/').split('/');
  return (
    parts[0] === 'tmp' ||
    parts.some(
      (part) => /^\.env(?:\.|$)/.test(part) || privateDirectories.has(part),
    )
  );
});
if (privatePaths.length > 0) {
  throw new Error(
    'Preview package contains private environment or runtime files; upload refused',
  );
}
const privateValues = [
  'PAYLOAD_SECRET',
  'DATABASE_URI',
  'TEST_DATABASE_URI',
  'OWNER_PASSWORD',
  'POSTGRES_PASSWORD',
]
  .map((name) => process.env[name])
  .filter((value) => value && value.length >= 16);
for (const path of packagedPaths) {
  const file = resolve(destination, path);
  if ((await lstat(file)).isSymbolicLink()) {
    throw new Error(
      'Preview package contains an unresolved link; upload refused',
    );
  }
  if (!(await stat(file)).isFile()) continue;
  const bytes = await readFile(file);
  if (privateValues.some((value) => bytes.includes(Buffer.from(value)))) {
    throw new Error(
      'Preview package contains a configured private runtime value; upload refused',
    );
  }
}
await writeFile(
  resolve(destination, 'PREVIEW-README.txt'),
  'Desan public site and owner workspace engineering preview.\nUse Node 24.22.1. CI artifacts target Linux.\nSupply your own DATABASE_URI and PAYLOAD_SECRET (32+ characters), matching migrated schema and private persistent media directory. See repository docs/engineering/backend.md for migrations/bootstrap and docs/engineering/OPERATIONS.md for deployment, backups and recovery.\nNo credentials, database rows, recovery mail or uploaded media are included.\nLinux: HOSTNAME=127.0.0.1 node server.js\nPowerShell (locally built artifact): $env:HOSTNAME="127.0.0.1"; node server.js\nOpen http://localhost:3000, /owner and /api/health.\nThe public frontend renders selected publication snapshots. The owner workspace includes content/media/settings, private previews, versioned publication and visual Design Studio. See docs/engineering/OWNER-WORKSPACE.md for editing and recovery.\nScheduled publication requires the separately supervised owner:jobs process from the matching source checkout. This web artifact alone does not run scheduled jobs.\nA hosted release also needs HTTPS, production owner/recovery configuration, persistent PostgreSQL/media, tested backups and runtime configuration. This downloadable artifact is not a hosted deployment.\n',
);
console.log('Standalone preview packaged in tmp/phase2-preview');
