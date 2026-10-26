import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

// Load private local config without passing env-file flags to Next's worker pool.
// Existing process variables (including CI secrets) always take precedence.
for (const file of ['.env.local', 'tmp/phase3-runtime.env']) {
  if (existsSync(file)) process.loadEnvFile(file);
}
const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env },
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => child.kill(signal));
child.on('error', () => process.exit(1));
child.on('exit', (code) => process.exit(code ?? 1));
