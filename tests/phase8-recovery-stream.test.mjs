import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { recoveryStream } from '../src/owner/recovery-stream.ts';

test('owner recovery stream exceeds4.5MB without truncation or Unicode corruption and carries exact byte digest', async () => {
  const value = {
    format: 'synthetic-private-recovery',
    history: ['text-😀-α-漢字\n'.repeat(400000)],
    credentials: undefined,
  };
  const archive = recoveryStream(value);
  assert.ok(archive.bytes > 4.5 * 1024 * 1024);
  const bytes = Buffer.from(await new Response(archive.stream).arrayBuffer());
  assert.equal(bytes.length, archive.bytes);
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    archive.sha256,
  );
  assert.deepEqual(
    JSON.parse(bytes.toString()),
    JSON.parse(JSON.stringify(value)),
  );
});
