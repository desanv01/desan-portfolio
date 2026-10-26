import assert from 'node:assert/strict';
import test from 'node:test';
import { generatePayloadCookie } from '../node_modules/payload/dist/auth/cookies.js';
import { cmsOrigin, ownerCookiePolicy } from '../src/cms/runtime-policy.ts';
import {
  boundedBytes,
  ownerJSON,
  ownerFormData,
  RequestBodyError,
} from '../src/owner/request-body.ts';

test('HTTPS owner cookies carry Secure, HttpOnly, Lax and host-only scope; HTTP evaluation remains usable', () => {
  for (const origin of [
    'https://portfolio.example',
    'http://127.0.0.1:3000',
    'http://localhost:3007',
  ]) {
    const header = generatePayloadCookie({
      collectionAuthConfig: {
        cookies: ownerCookiePolicy(origin),
        tokenExpiration: 3600,
      },
      cookiePrefix: 'payload',
      token: 'synthetic-not-a-session',
    });
    assert.match(header, /HttpOnly/);
    assert.match(header, /SameSite=Lax/);
    assert.match(header, /Path=\//);
    assert.doesNotMatch(header, /Domain=/);
    assert.equal(
      /; Secure(?:=true)?(?:;|$)/.test(header),
      origin.startsWith('https:'),
    );
  }
  for (const value of [
    'https://user:password@example.com',
    'https://example.com/path',
    'https://example.com?key=secret',
    'https://example.com/#x',
    'file:///tmp',
  ])
    assert.throws(() => cmsOrigin(value), /CMS_SERVER_URL/);
});

test('JSON reads enforce actual byte caps before parsing, including missing/false Content-Length', async () => {
  assert.deepEqual(
    await ownerJSON(
      new Request('http://localhost', {
        method: 'POST',
        body: '{"value":"ok"}',
      }),
    ),
    { value: 'ok' },
  );
  const chunks = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(7));
      controller.enqueue(new Uint8Array(7));
      controller.close();
    },
  });
  await assert.rejects(
    boundedBytes(
      new Request('http://localhost', {
        method: 'POST',
        duplex: 'half',
        body: chunks,
        headers: { 'content-length': '1' },
      }),
      10,
    ),
    (error) => error instanceof RequestBodyError && error.status === 413,
  );
  let cancelled = false;
  const declared = new Request('http://localhost', {
    method: 'POST',
    duplex: 'half',
    headers: { 'content-length': '1000' },
    body: new ReadableStream({
      cancel() {
        cancelled = true;
      },
    }),
  });
  await assert.rejects(
    boundedBytes(declared, 10),
    (error) => error.status === 413,
  );
  assert.equal(cancelled, true);
  await assert.rejects(
    ownerJSON(new Request('http://localhost', { method: 'POST', body: '[1]' })),
    (error) => error.status === 400,
  );
  await assert.rejects(
    ownerJSON(
      new Request('http://localhost', {
        method: 'POST',
        body: new Uint8Array([0xff]),
      }),
    ),
    (error) => error.status === 400,
  );
});

test('slow bodies time out and bounded multipart keeps empty-MIME file bytes unchanged', async () => {
  await assert.rejects(
    boundedBytes(
      new Request('http://localhost', {
        method: 'POST',
        duplex: 'half',
        body: new ReadableStream({ start() {} }),
      }),
      100,
      10,
    ),
    (error) => error.status === 408,
  );
  const form = new FormData();
  form.set('file', new File([new Uint8Array([1, 2, 3])], 'sample.bin'));
  form.set('_payload', '{"alt":"synthetic"}');
  const parsed = await ownerFormData(
    new Request('http://localhost', { method: 'POST', body: form }),
  );
  assert.deepEqual(
    [...new Uint8Array(await parsed.get('file').arrayBuffer())],
    [1, 2, 3],
  );
  assert.equal(parsed.get('_payload'), '{"alt":"synthetic"}');
});
