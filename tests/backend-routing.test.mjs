import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { verifyFoundation } from './smoke-helper.mjs';

test(
  'built Next routes preserve anonymous CMS and publication boundaries',
  { timeout: 90000 },
  async (t) => {
    assert.ok(
      process.env.TEST_DATABASE_URI,
      'Use the dedicated migrated test database',
    );
    assert.match(new URL(process.env.TEST_DATABASE_URI).pathname, /_test$/);
    process.env.DATABASE_URI = process.env.TEST_DATABASE_URI;
    const base = await verifyFoundation(t);
    const publication = await fetch(`${base}/api/publication`);
    assert.equal(publication.status, 200);
    assert.equal(publication.headers.get('cache-control'), 'no-store');
    assert.ok(publication.headers.get('etag'));
    await publication.json();
    for (const path of [
      '/api/skills?draft=true',
      '/api/skills/versions',
      '/api/owners',
      '/api/media',
    ]) {
      const response = await fetch(`${base}${path}`);
      assert.ok(
        [401, 403].includes(response.status),
        `${path} returned ${response.status}`,
      );
    }
    for (const path of ['/api/publication', '/api/owner-preview']) {
      for (const origin of [base, 'https://untrusted.example.invalid']) {
        const response = await fetch(`${base}${path}`, {
          method: 'POST',
          headers: { Origin: origin, 'Content-Type': 'application/json' },
          body: '{}',
        });
        assert.equal(response.status, 403);
      }
    }
    assert.equal(
      (await fetch(`${base}/api/public/media/999999999`)).status,
      404,
    );
    const login = await fetch(`${base}/admin/login`);
    assert.equal(login.status, 200);
    assert.match(await login.text(), /<html[\s>]/);
    const fixturePath = resolve('tmp/phase3-http-fixture.json');
    const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
    t.after(async () => {
      await unlink(fixturePath);
    });
    const signedIn = await fetch(`${base}/api/owners/login`, {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify(fixture),
    });
    assert.equal(signedIn.status, 200);
    const cookieHeader = signedIn.headers.get('set-cookie');
    assert.ok(cookieHeader?.includes('HttpOnly'));
    const cookie = cookieHeader.split(';')[0];
    const missingMetadata = await fetch(`${base}/api/owners/me`, {
      headers: { Cookie: cookie },
    });
    assert.equal((await missingMetadata.json()).user, null);
    const crossSite = await fetch(`${base}/api/owners/me`, {
      headers: { Cookie: cookie, 'Sec-Fetch-Site': 'cross-site' },
    });
    assert.equal((await crossSite.json()).user, null);
    const me = await fetch(`${base}/api/owners/me`, {
      headers: { Cookie: cookie, 'Sec-Fetch-Site': 'same-origin' },
    });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).user.email, fixture.email);
    assert.equal(
      (
        await fetch(`${base}/api/skills?draft=true`, {
          headers: { Cookie: cookie, 'Sec-Fetch-Site': 'same-origin' },
        })
      ).status,
      200,
    );
    const ownPreview = await fetch(`${base}/api/owner-preview`, {
      method: 'POST',
      headers: {
        Cookie: cookie,
        Origin: base,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    assert.equal(
      ownPreview.status,
      400,
      'Authenticated owner reaches selection validation',
    );
    const hostilePreview = await fetch(`${base}/api/owner-preview`, {
      method: 'POST',
      headers: {
        Cookie: cookie,
        Origin: 'https://untrusted.example.invalid',
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    assert.equal(hostilePreview.status, 403);
    const logout = await fetch(`${base}/api/owners/logout`, {
      method: 'POST',
      headers: { Cookie: cookie, Origin: base },
    });
    assert.equal(logout.status, 200);
    const afterLogout = await fetch(`${base}/api/owners/me`, {
      headers: { Cookie: cookie, 'Sec-Fetch-Site': 'same-origin' },
    });
    assert.equal((await afterLogout.json()).user, null);
  },
);
