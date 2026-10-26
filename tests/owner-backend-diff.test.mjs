import assert from 'node:assert/strict';
import test from 'node:test';
import { recoveryFieldChanges } from '../src/owner/recovery-diff.ts';

test('recovery plan exposes changed publication rights and nested content without internal fields', () => {
  const fields = [
    {
      name: 'publicEligible',
      label: 'publicEligible',
      type: 'checkbox',
      required: false,
    },
    { name: 'roles', label: 'roles', type: 'array', required: false },
    {
      name: 'hash',
      label: 'hash',
      type: 'text',
      required: false,
      readOnly: true,
    },
  ];
  const changes = recoveryFieldChanges(
    {
      publicEligible: false,
      roles: [{ role: 'A' }],
      hash: 'before',
      password: 'secret',
    },
    {
      publicEligible: true,
      roles: [{ role: 'B' }],
      hash: 'after',
      password: 'changed',
    },
    fields,
  );
  assert.deepEqual(
    changes.map((change) => change.path),
    ['publicEligible', 'roles'],
  );
  assert.equal(changes[0].label, 'Rights allow public use');
  assert.equal(changes[0].before, 'No');
  assert.equal(changes[0].after, 'Yes');
  assert.match(changes[1].after, /B/);
  assert.ok(!JSON.stringify(changes).includes('secret'));
});

test('recovery differences retain array ordering, ignore object key ordering and mark bounded summaries', () => {
  const fields = [
    { name: 'body', label: 'body', type: 'richText', required: false },
    { name: 'seo', label: 'seo', type: 'group', required: false },
    { name: 'empty', label: 'empty', type: 'text', required: false },
  ];
  const unchanged = recoveryFieldChanges(
    { seo: { title: 'A', description: 'B' } },
    { seo: { description: 'B', title: 'A' } },
    fields,
  );
  assert.deepEqual(unchanged, []);
  const changes = recoveryFieldChanges(
    {},
    { body: { text: '<script>' + 'X'.repeat(2000) }, empty: null },
    fields,
  );
  assert.equal(changes[0].truncated, true);
  assert.ok(changes[0].after.length <= 801);
  assert.match(changes[0].after, /<script>/); // plain text only; no HTML rendering API
  assert.equal(changes[1].before, '(not set)');
  assert.equal(changes[1].after, '(empty)');
});
