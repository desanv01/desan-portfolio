import assert from 'node:assert/strict';
import test from 'node:test';
test(
  'reviewed import is atomic, reference-safe and preserves owner edits on rerun',
  { timeout: 180000 },
  async (t) => {
    assert.ok(process.env.TEST_DATABASE_URI);
    assert.match(new URL(process.env.TEST_DATABASE_URI).pathname, /_test$/);
    process.env.DATABASE_URI = process.env.TEST_DATABASE_URI;
    const { getPayload, createLocalReq } = await import('payload');
    const { default: config } = await import('../src/cms/config');
    const { bootstrapCapability } = await import('../src/cms/access');
    const { importReviewedContent } = await import('../src/cms/content-import');
    const { currentPublication } = await import('../src/cms/publication');
    const payload = await getPayload({ config });
    t.after(() => payload.destroy());
    await payload.db.migrateFresh({ forceAcceptWarning: true });
    const owner = await payload.create({
      collection: 'owners',
      overrideAccess: true,
      context: { bootstrap: bootstrapCapability },
      data: {
        email: 'import-owner@example.invalid',
        password: 'Synthetic-import-password-only-2026',
        role: 'owner',
        singleton: 1,
      },
    });
    const req = await createLocalReq(
      { user: { ...owner, collection: 'owners' } },
      payload,
    );
    const manifest = {
      format: 'desan-reviewed-content',
      approval: 'Synthetic import test only',
      records: [
        {
          key: 'test:skill',
          collection: 'skills',
          data: {
            title: 'Skill',
            slug: 'skill',
            canonicalName: 'Skill',
            visible: true,
          },
        },
        {
          key: 'test:project',
          collection: 'projects',
          data: { title: 'Project', slug: 'project', visible: true },
        },
        {
          key: 'test:association',
          collection: 'associations',
          data: {
            title: 'Project skill',
            slug: 'project-skill',
            visible: true,
            skill: { $ref: 'test:skill' },
            target: { relationTo: 'projects', value: { $ref: 'test:project' } },
            kind: 'uses_skill',
          },
        },
      ],
    };
    const plan = await importReviewedContent(payload, req, manifest, false);
    assert(plan.records.every((row) => row.action === 'would-create'));
    assert.equal(
      (
        await payload.count({
          collection: 'skills',
          req,
          overrideAccess: false,
        })
      ).totalDocs,
      0,
    );
    const first = await importReviewedContent(payload, req, manifest, true);
    assert.equal(
      first.records.filter((row) => row.action === 'created').length,
      3,
    );
    const project = first.records.find((row) => row.collection === 'projects')!;
    assert.ok('id' in project);
    await payload.update({
      collection: 'projects',
      id: project.id!,
      data: { title: 'Later owner edit' },
      draft: true,
      req,
      overrideAccess: false,
    });
    const second = await importReviewedContent(payload, req, manifest, true);
    assert(second.records.every((row) => row.action === 'preserved'));
    assert.equal(
      (
        await payload.findByID({
          collection: 'projects',
          id: project.id!,
          draft: true,
          req,
          overrideAccess: false,
        })
      ).title,
      'Later owner edit',
    );
    const bad = {
      ...manifest,
      records: [
        {
          key: 'test:rollback',
          collection: 'skills',
          data: {
            title: 'Rollback',
            slug: 'rollback',
            canonicalName: 'Rollback',
          },
        },
        {
          key: 'test:broken',
          collection: 'associations',
          data: { title: 'Broken', slug: 'broken', skill: { $ref: 'missing' } },
        },
      ],
    };
    await assert.rejects(
      importReviewedContent(payload, req, bad, true),
      /earlier imported record/,
    );
    assert.equal(
      (
        await payload.find({
          collection: 'skills',
          where: { sourceKey: { equals: 'test:rollback' } },
          draft: true,
          req,
          overrideAccess: false,
        })
      ).totalDocs,
      0,
    );
    assert.equal(await currentPublication(payload, req), null);
    await assert.rejects(
      importReviewedContent(
        payload,
        await createLocalReq({}, payload),
        manifest,
        true,
      ),
      /Owner authorization/,
    );
  },
);
