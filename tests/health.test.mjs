import assert from 'node:assert/strict';
import test from 'node:test';
import { GET } from '../src/app/api/health/route.ts';

test('health reports process liveness without exposing configuration', async () => {
  const response = GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.deepEqual(await response.json(), { status: 'ok', scope: 'process' });
});
