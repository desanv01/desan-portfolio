import assert from 'node:assert/strict';
import test from 'node:test';
import { validateContentImport } from '../src/cms/content-import.ts';
import { draftRecoveryBundle } from '../src/components/owner/recovery-bundle.ts';
import {
  associationDefaults,
  matchesContext,
} from '../src/components/owner/association-context.ts';
test('content imports reject system collections, duplicate sources and system fields', () => {
  const base = {
    format: 'desan-reviewed-content',
    approval: 'Explicit local approval',
    records: [
      { key: 'source:one', collection: 'projects', data: { title: 'Example' } },
    ],
  };
  assert.equal(validateContentImport(base).records.length, 1);
  for (const records of [
    [{ ...base.records[0], collection: 'owners' }],
    [...base.records, ...base.records],
    [{ ...base.records[0], data: { id: 99 } }],
  ])
    assert.throws(() => validateContentImport({ ...base, records }));
  assert.throws(() => validateContentImport({ ...base, approval: '' }));
});
test('archive draft extraction preserves complete docs but excludes history and secrets from editing payload', () => {
  const source = {
    format: 'desan-owner-recovery',
    schemaVersion: 1,
    instanceId: 'test',
    collections: {
      projects: {
        docs: [{ id: 1, title: 'Draft', body: { long: ['complete', 'data'] } }],
        versions: Array(100).fill({ old: true }),
      },
    },
    snapshots: [{ data: 'history' }],
  };
  const draft = draftRecoveryBundle(source);
  assert.deepEqual(
    draft.collections.projects.docs,
    source.collections.projects.docs,
  );
  assert.equal('versions' in draft.collections.projects, false);
  assert.equal('snapshots' in draft, false);
  assert.equal(source.collections.projects.versions.length, 100);
  assert.throws(() =>
    draftRecoveryBundle({ format: 'other', collections: {} }),
  );
});
test('association endpoints remain typed when IDs coincide and prefill both sides', () => {
  assert.deepEqual(associationDefaults('associations', 'skills:5'), {
    skill: '5',
  });
  assert.deepEqual(associationDefaults('context-links', 'projects:5'), {
    project: '5',
  });
  assert.deepEqual(associationDefaults('associations', 'experiences:5'), {
    target: { relationTo: 'experiences', value: '5' },
  });
  assert.equal(
    matchesContext(
      'associations',
      { target: { relationTo: 'education', value: 5 } },
      'experiences:5',
    ),
    false,
  );
  assert.equal(
    matchesContext(
      'associations',
      { target: { relationTo: 'experiences', value: { id: 5 } } },
      'experiences:5',
    ),
    true,
  );
});
