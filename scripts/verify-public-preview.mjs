import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { resolve } from 'node:path';

for (const file of ['.env.local', 'tmp/phase3-runtime.env'])
  if (existsSync(file)) process.loadEnvFile(file);
const packaged = process.argv.includes('--packaged');
const workspace = process.cwd();
const reservation = createServer();
reservation.listen(0, '127.0.0.1');
await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise((done) => reservation.close(done));
const base = `http://127.0.0.1:${port}`;
const environment = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: '1',
  HOSTNAME: '127.0.0.1',
  PORT: String(port),
  CMS_SERVER_URL: base,
  PUBLIC_SITE_BASE_URL: base,
  MEDIA_DIRECTORY: resolve(process.env.MEDIA_DIRECTORY || 'tmp/phase3-media'),
};
const server = spawn(
  process.execPath,
  packaged
    ? ['server.js']
    : [
        'node_modules/next/dist/bin/next',
        'start',
        '--hostname',
        '127.0.0.1',
        '--port',
        String(port),
      ],
  {
    cwd: packaged ? resolve('tmp/phase2-preview') : workspace,
    env: environment,
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let output = '';
let startupError;
server.on('error', (error) => {
  startupError = error;
});
server.stdout.on('data', (chunk) => {
  output = `${output}${chunk}`.slice(-20000);
});
server.stderr.on('data', (chunk) => {
  output = `${output}${chunk}`.slice(-20000);
});
let verifier;
function safeDiagnostics(value) {
  const secrets = [
    'PAYLOAD_SECRET',
    'DATABASE_URI',
    'TEST_DATABASE_URI',
    'OWNER_PASSWORD',
    'POSTGRES_PASSWORD',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
    'SMTP_PASSWORD',
  ]
    .map((name) => process.env[name])
    .filter((value) => value && value.length >= 4);
  for (const name of ['DATABASE_URI', 'TEST_DATABASE_URI']) {
    try {
      const password = decodeURIComponent(new URL(process.env[name]).password);
      if (password.length >= 4) secrets.push(password);
    } catch {
      /* Optional local configuration. */
    }
  }
  return [...new Set(secrets)]
    .reduce(
      (text, secret) => text.replaceAll(secret, '[redacted]'),
      value.slice(-12000),
    )
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]');
}
async function stopServer() {
  if (!server.pid || server.exitCode !== null || server.signalCode) return;
  const exited = once(server, 'exit');
  server.kill('SIGTERM');
  let timer;
  await Promise.race([
    exited,
    new Promise((done) => {
      timer = setTimeout(() => {
        server.kill('SIGKILL');
        done();
      }, 5000);
    }),
  ]);
  clearTimeout(timer);
}
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    verifier?.kill(signal);
    server.kill(signal);
  });
try {
  let ready = false;
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (startupError) throw startupError;
    assert.ok(
      server.exitCode === null && !server.signalCode,
      `Public preview process exited: ${safeDiagnostics(output)}`,
    );
    try {
      const response = await fetch(`${base}/api/health`, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Still starting. */
    }
    await new Promise((done) => setTimeout(done, 200));
  }
  assert.ok(
    ready,
    `Public preview did not become ready: ${safeDiagnostics(output)}`,
  );
  if (process.argv.includes('--diagnose-404')) {
    const probes = [];
    for (const [label, headers] of [
      ['default-fetch', {}],
      [
        'browser-navigation',
        {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
        },
      ],
      ['googlebot', { Accept: 'text/html', 'User-Agent': 'Googlebot' }],
      [
        'html-limited-twitterbot',
        { Accept: 'text/html', 'User-Agent': 'Twitterbot/1.0' },
      ],
    ])
      for (const path of [
        '/work/synthetic-missing-not-published',
        '/synthetic-unmatched-route',
      ]) {
        const response = await fetch(`${base}${path}`, {
          headers,
          signal: AbortSignal.timeout(30000),
        });
        const html = await response.text();
        const serverHTML = html
          .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
          .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '');
        probes.push({
          label,
          path,
          status: response.status,
          bytes: html.length,
          hasServerMain: /<main\b/i.test(serverHTML),
          hasServer404Copy:
            /Lost in thought|Page not found|This page may have moved/i.test(
              serverHTML,
            ),
          hasSerialized404Copy: html.includes('Lost in thought'),
          hasFallbackDigest: html.includes('NEXT_HTTP_ERROR_FALLBACK'),
        });
        await writeFile(
          resolve(
            workspace,
            `tmp/phase4-404-${label}-${path.includes('/work/') ? 'work' : 'unmatched'}.html`,
          ),
          html,
        );
      }
    await mkdir(resolve(workspace, 'docs/phase-4/data'), { recursive: true });
    await writeFile(
      resolve(workspace, 'docs/phase-4/data/404-PRODUCTION-PROBES.json'),
      JSON.stringify(probes, null, 2),
    );
    console.log(JSON.stringify({ diagnosticOnly: true, probes }));
  } else {
    verifier = spawn(
      process.execPath,
      [
        '--test',
        'tests/public-data-routing.test.mjs',
        'tests/discovery-routing.test.mjs',
      ],
      { cwd: workspace, env: environment, stdio: 'inherit' },
    );
    const [exitCode] = await once(verifier, 'exit');
    assert.equal(exitCode, 0, 'Live public route assertions failed');
    console.log(
      `Public route verification passed against ${packaged ? 'packaged standalone' : 'built Next'} on an owned loopback process.`,
    );
  }
} catch (error) {
  console.error(
    `Bounded public server diagnostics:\n${safeDiagnostics(output)}`,
  );
  throw error;
} finally {
  await stopServer();
}
