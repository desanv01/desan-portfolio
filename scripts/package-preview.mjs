import {
  cp,
  lstat,
  mkdir,
  realpath,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

const root = process.cwd();
const destination = resolve(root, 'tmp/phase2-preview');
await stat(resolve(root, '.next/standalone/server.js'));
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
await cp(resolve(root, '.next/standalone'), destination, { recursive: true });
await cp(resolve(root, '.next/static'), resolve(destination, '.next/static'), {
  recursive: true,
});
try {
  await stat(resolve(root, 'public'));
  await cp(resolve(root, 'public'), resolve(destination, 'public'), {
    recursive: true,
  });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await writeFile(
  resolve(destination, 'PREVIEW-README.txt'),
  'Phase 2 engineering preview only.\nUse Node 24.22.1. CI artifacts target Linux.\nLinux: HOSTNAME=127.0.0.1 node server.js\nPowerShell (locally built artifact): $env:HOSTNAME="127.0.0.1"; node server.js\nOpen http://localhost:3000 and /api/health.\nNo database or secrets are required.\nThe approved website and CMS workflows belong to later phases.\n',
);
console.log('Standalone preview packaged in tmp/phase2-preview');
