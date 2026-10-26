import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { resolve } from 'node:path';

export async function verifyFoundation(t, preview = false) {
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const child = spawn(
    process.execPath,
    preview
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
      cwd: preview ? resolve('tmp/phase2-preview') : process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: '1',
        HOSTNAME: '127.0.0.1',
        PORT: String(port),
      },
    },
  );
  let output = '';
  child.stdout.on('data', (data) => {
    output += data;
  });
  child.stderr.on('data', (data) => {
    output += data;
  });
  t.after(async () => {
    if (child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
  });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.equal(child.exitCode, null, output);
    try {
      const response = await fetch(`${base}/api/health`, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* The production server is still starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready, `Production server did not become ready: ${output}`);
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('x-robots-tag'), /noindex/);
  assert.equal(page.headers.get('x-powered-by'), null);
  const html = await page.text();
  assert.match(html, /<h1>Engineering foundation<\/h1>/);
  assert.match(html, /Phase 2 build verification placeholder/);
  assert.match(html, /<meta name="robots" content="noindex, nofollow"/);
  const script = html.match(/<script[^>]+src="([^"?]+\.js(?:\?[^\"]*)?)"/);
  assert.ok(script, 'The placeholder must reference a real JavaScript asset');
  assert.ok(script[1].startsWith('/_next/static/'));
  const asset = await fetch(new URL(script[1].replaceAll('&amp;', '&'), base));
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('content-type'), /javascript/);
  assert.ok((await asset.text()).length > 0);
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await health.json(), { status: 'ok', scope: 'process' });
  const robots = await fetch(`${base}/robots.txt`);
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Disallow: \//);
  assert.equal((await fetch(`${base}/missing-foundation-route`)).status, 404);
}
