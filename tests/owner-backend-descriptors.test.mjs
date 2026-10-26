import assert from 'node:assert/strict';
import test from 'node:test';
import { descriptors, saveRecord } from '../src/owner/service.ts';

test('authored root and nested URLs survive descriptor generation', () => {
  const fields = descriptors([
    { name: 'url', type: 'text' },
    {
      name: 'sources',
      type: 'array',
      fields: [
        { name: 'url', type: 'text' },
        { name: 'observedAt', type: 'text' },
      ],
    },
    {
      name: 'links',
      type: 'array',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ]);
  assert.ok(fields.find((field) => field.name === 'url'));
  assert.ok(
    fields
      .find((field) => field.name === 'sources')
      .fields.find((field) => field.name === 'url'),
  );
  assert.equal(
    fields
      .find((field) => field.name === 'links')
      .fields.find((field) => field.name === 'url').required,
    true,
  );
});

test('media generated URL remains blocked before any database mutation', async () => {
  const payload = {
    collections: {
      media: {
        config: {
          fields: [
            { name: 'url', type: 'text' },
            { name: 'kind', type: 'select', options: ['image'] },
            { name: 'alt', type: 'text' },
          ],
        },
      },
    },
  };
  const req = { user: { collection: 'owners', role: 'owner' } };
  await assert.rejects(
    saveRecord(
      payload,
      req,
      'media',
      { url: 'https://invalid.example/file' },
      1,
      'expected',
    ),
    /Field is not editable: url/,
  );
  await assert.rejects(
    saveRecord(payload, req, 'media', { kind: 'image' }, 1, 'expected'),
    /Field is not editable: kind/,
  );
});
