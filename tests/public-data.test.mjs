import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      context.parentURL?.endsWith('/src/public-data/fixture-design.ts') &&
      specifier.startsWith('../design/')
    )
      return nextResolve(
        new URL(`${specifier}.ts`, context.parentURL).href,
        context,
      );
    if (
      context.parentURL?.endsWith('/src/design/runtime-defaults.ts') &&
      specifier === './model'
    )
      return nextResolve(
        new URL('./model.ts', context.parentURL).href,
        context,
      );
    if (
      context.parentURL?.endsWith('/src/public-data/index.ts') &&
      specifier === '../design/model'
    )
      return nextResolve(
        new URL('../design/model.ts', context.parentURL).href,
        context,
      );
    if (
      context.parentURL?.endsWith('/src/design/model.ts') &&
      specifier === './schema'
    )
      return nextResolve(
        new URL('./schema.ts', context.parentURL).href,
        context,
      );
    return nextResolve(specifier, context);
  },
});
const data = await import('../src/public-data/index.ts');
const { createEmptyDesign } = await import('../src/design/model.ts');
const { createSyntheticFixtureDesign } =
  await import('../src/public-data/fixture-design.ts');
const record = (id, slug, title, fields = {}) => ({
  id,
  slug,
  title,
  visible: true,
  ...fields,
});
test('featured rank is independent from full library order, with a legacy fallback', () => {
  const site = {
    status: 'ready',
    publication: {
      content: {
        skills: [
          record(1, 'one', 'One', {
            sortOrder: 1,
            featured: true,
            featuredOrder: 2,
          }),
          record(2, 'two', 'Two', {
            sortOrder: 2,
            featured: true,
            featuredOrder: 0,
          }),
          record(3, 'three', 'Three', { sortOrder: 3, featured: false }),
          record(4, 'four', 'Four', { sortOrder: 4, featured: true }),
        ],
      },
    },
  };
  assert.deepEqual(
    data.records(site, 'skills').map((row) => row.id),
    [1, 2, 3, 4],
  );
  assert.deepEqual(
    data.featuredRecords(site, 'skills').map((row) => row.id),
    [2, 1, 4],
  );
});
function publication() {
  return {
    revision: 'test-revision',
    design: createEmptyDesign('fixture'),
    selections: [{ secretInternalVersionId: 1 }],
    designVersionId: 1,
    content: {
      skills: [
        record(1, 'embedded-systems', 'Embedded Systems', {
          category: 'Engineering',
          aliases: [{ name: 'Firmware' }],
        }),
      ],
      projects: [
        record(1, 'alpha', 'Alpha', {
          sortOrder: 2,
          discipline: 'Systems',
          featured: true,
          summary: 'Café sensor controller',
        }),
        record(2, 'beta', 'Beta', {
          sortOrder: 1,
          discipline: 'Software',
          summary: 'Searchable public sample',
        }),
      ],
      posts: [
        record(1, 'build-log', 'Build log', {
          body: {
            root: {
              children: [
                {
                  type: 'paragraph',
                  children: [{ text: 'Public lexical article text' }],
                },
              ],
            },
          },
        }),
      ],
      education: [record(1, 'learning', 'Learning')],
      experiences: [
        record(1, 'studio', 'Studio', {
          roles: [
            {
              roleKey: 'engineer',
              role: 'Engineer',
              responsibilities: 'Synthetic firmware',
            },
          ],
        }),
      ],
      profile: [
        record(1, 'demo-engineer', 'Synthetic profile', {
          displayName: 'Demo Engineer',
          headline: 'Observant systems thinker',
          region: 'Synthetic city',
          contact: [
            { label: 'Public', value: 'demo@example.invalid', public: true },
          ],
        }),
      ],
      associations: [
        record(1, 'edge-one', 'Edge', {
          skill: 1,
          target: { relationTo: 'projects', value: 1 },
          kind: 'evidence',
        }),
        record(2, 'edge-two', 'Edge2', {
          skill: 1,
          target: { relationTo: 'projects', value: 1 },
          kind: 'context',
        }),
        record(3, 'edge-three', 'Edge3', {
          skill: 1,
          target: { relationTo: 'education', value: 1 },
          kind: 'evidence',
        }),
        record(4, 'edge-role', 'Role edge', {
          skill: 1,
          target: { relationTo: 'experiences', value: 1 },
          targetRoleKey: 'engineer',
          kind: 'used-in-role',
        }),
      ],
      'context-links': [
        record(1, 'context', 'Project learning context', {
          project: 1,
          target: { relationTo: 'education', value: 1 },
          kind: 'institution-context',
        }),
      ],
    },
    media: [
      {
        id: 1,
        resourceVersion: 'v1',
        sha256: 'a'.repeat(64),
        url: '/api/public/media/1',
        mimeType: 'image/png',
        alt: 'Synthetic square',
      },
    ],
    redirects: { '/projects/old-alpha': '/projects/alpha' },
  };
}
test('public DTO distinguishes empty/unavailable/invalid and never falls back to raw or synthetic content', async () => {
  assert.deepEqual(data.publicSiteFromPublication(null), {
    status: 'empty',
    publication: null,
  });
  assert.deepEqual(
    await data.loadPublicSite(async () => {
      throw new Error('PRIVATE connection details');
    }),
    { status: 'unavailable', publication: null, reason: 'unavailable' },
  );
  assert.deepEqual(
    data.publicSiteFromPublication({
      docs: [record(1, 'raw', 'Raw Payload document')],
    }),
    { status: 'unavailable', publication: null, reason: 'invalid' },
  );
  const revoked = { ...publication(), content: {}, design: null, media: [] };
  assert.equal(data.publicSiteFromPublication(revoked).status, 'empty');
  const site = data.publicSiteFromPublication(publication());
  assert.equal(site.status, 'ready');
  assert.equal(Object.hasOwn(site.publication, 'selections'), false);
  assert.equal(Object.hasOwn(site.publication, 'designVersionId'), false);
  assert.deepEqual(await data.loadPublicSite(() => new Promise(() => {}), 5), {
    status: 'unavailable',
    publication: null,
    reason: 'unavailable',
  });
});
test('private notes, hidden roles, raw status, unsafe resources and malformed records fail closed', () => {
  for (const fields of [
    { privateNotes: 'PRIVATE' },
    { sources: [{ url: 'https://private.example' }] },
    { _status: 'published' },
    { roles: [{ hidden: true, role: 'SECRET' }] },
    { grade: 'SECRET', showGrade: false },
    { slug: '../escape' },
    { visible: false },
  ]) {
    const input = publication();
    Object.assign(input.content.projects[0], fields);
    assert.equal(data.publicSiteFromPublication(input).status, 'unavailable');
  }
  const resource = publication();
  resource.media[0].url = 'https://private.example/original.png';
  assert.equal(data.publicSiteFromPublication(resource).status, 'unavailable');
  const dangling = publication();
  dangling.content.associations[0].target.value = 999;
  assert.equal(data.publicSiteFromPublication(dangling).status, 'unavailable');
  const role = publication();
  role.content.associations[3].targetRoleKey = 'private-role';
  assert.equal(data.publicSiteFromPublication(role).status, 'unavailable');
  const hostile = publication();
  hostile.content.projects[0].body = {};
  Object.defineProperty(hostile.content.projects[0].body, 'text', {
    get() {
      throw new Error('getter executed');
    },
  });
  assert.equal(data.publicSiteFromPublication(hostile).status, 'unavailable');
});
test('sorting, Unicode AND search, aliases, filtering and bounded pagination use selected public records only', () => {
  const input = publication();
  const site = data.publicSiteFromPublication(input);
  input.content.projects[0].title = 'MUTATED AFTER DTO';
  assert.deepEqual(
    data.records(site, 'projects').map((record) => record.title),
    ['Beta', 'Alpha'],
  );
  assert.equal(data.searchRecords(site, 'cafe sensor').total, 1);
  assert.equal(
    data.searchRecords(site, 'firmware', { collections: ['skills'] }).total,
    1,
  );
  assert.equal(
    data.searchRecords(site, 'lexical article').items[0].collection,
    'posts',
  );
  assert.equal(data.searchRecords(site, 'unpublished-draft').total, 0);
  const profileResult = data.searchRecords(site, 'Observant systems thinker');
  assert.equal(profileResult.total, 1);
  assert.equal(profileResult.items[0].collection, 'profile');
  assert.equal(
    data.recordPath('profile', profileResult.items[0].record),
    '/profile',
  );
  assert.equal(
    data.searchRecords(site, 'demo@example.invalid').total,
    0,
    'Contact values are not indexed',
  );
  assert.equal(data.searchRecords(site, '').total, 0);
  assert.equal(
    data.filterRecords(data.records(site, 'projects'), {
      discipline: 'Systems',
      featured: true,
    }).length,
    1,
  );
  assert.deepEqual(data.paginate([1, 2, 3], { page: 999, pageSize: 2 }), {
    items: [3],
    page: 2,
    pageSize: 2,
    total: 3,
    pageCount: 2,
    hasPrevious: true,
    hasNext: false,
  });
  assert.equal(data.paginate([], { page: '-10', pageSize: 'NaN' }).page, 1);
  assert.equal(data.paginate([1], { pageSize: 999 }).pageSize, 100);
});
test('typed reciprocal targets deduplicate kinds and preserve exact role and education/project context', () => {
  const site = data.publicSiteFromPublication(publication());
  const related = data.relatedRecords(site, { collection: 'skills', id: 1 });
  assert.equal(related.length, 3);
  assert.deepEqual(
    related
      .map(
        (entry) =>
          `${entry.collection}:${entry.record.id}:${entry.roleKey || ''}`,
      )
      .sort(),
    ['education:1:', 'experiences:1:engineer', 'projects:1:'],
  );
  assert.equal(
    data.relatedRecords(site, {
      collection: 'experiences',
      id: 1,
      roleKey: 'engineer',
    })[0].collection,
    'skills',
  );
  assert.equal(
    data.relatedRecords(site, {
      collection: 'experiences',
      id: 1,
      roleKey: 'private-role',
    }).length,
    0,
  );
  assert.deepEqual(
    data
      .relatedRecords(site, { collection: 'education', id: 1 })
      .map((entry) => entry.collection)
      .sort(),
    ['projects', 'skills'],
  );
  assert.equal(
    data.recordPath('skills', related[0].record),
    '/profile#skill-1',
  );
  assert.equal(
    data.recordPath('experiences', { id: 1, slug: 'studio' }, 'engineer'),
    '/profile#experiences-1-engineer',
  );
});
test('legacy redirects translate canonical families and reject loops, unsafe paths and missing live targets', () => {
  const input = publication();
  const site = data.publicSiteFromPublication(input);
  assert.equal(data.resolveRedirect(site, '/work/old-alpha'), '/work/alpha');
  assert.equal(data.resolveRedirect(site, '/projects/alpha'), '/work/alpha');
  assert.equal(data.resolveRedirect(site, '/work/alpha'), null);
  assert.equal(data.resolveRedirect(site, '/projects/missing'), null);
  assert.equal(data.resolveRedirect(site, '//external.example'), null);
  input.redirects = {
    '/projects/old-alpha': '/projects/cycle',
    '/projects/cycle': '/projects/old-alpha',
  };
  assert.equal(
    data.resolveRedirect(
      data.publicSiteFromPublication(input),
      '/projects/old-alpha',
    ),
    null,
  );
  input.redirects = { '/projects/old-alpha': 'https://external.example' };
  assert.equal(data.publicSiteFromPublication(input).status, 'unavailable');
});
test('render helpers emit only bounded text and safe destinations', () => {
  assert.equal(
    data.plainText({
      root: {
        children: [
          {
            type: 'paragraph',
            children: [{ text: 'Hello' }, { text: 'world' }],
          },
        ],
      },
    }),
    'Hello world',
  );
  assert.equal(data.plainText('abcdef', 3), 'abc');
  assert.equal(data.safeHref('javascript:alert(1)'), null);
  assert.equal(data.safeHref('//external.example'), null);
  assert.equal(
    data.safeHref('https://example.invalid/path'),
    'https://example.invalid/path',
  );
  assert.equal(data.safeHref('/work/alpha'), '/work/alpha');
  const site = data.publicSiteFromPublication(publication());
  assert.equal(data.mediaById(site, 1).url, '/api/public/media/1');
  assert.equal(data.mediaById(site, 999), undefined);
});
test('alternate synthetic design is schema-valid and declares explicit selected-resource/layout/behavior expectations', () => {
  const resource = (id) => ({
    id,
    resourceVersion: 'fixture-v1',
    sha256: 'a'.repeat(64),
  });
  const { design, expectations } = createSyntheticFixtureDesign({
    visuals: [resource(7)],
    font: resource(8),
    projectId: 9,
    alternate: true,
  });
  assert.equal(design.defaultThemeId, 'synthetic-violet');
  assert.equal(design.defaultMode, 'light');
  assert.deepEqual(design.visitorThemeIds, ['copper', 'synthetic-violet']);
  assert.equal(design.fonts[0].id, '8');
  assert.equal(expectations.h1SizePx, 72);
  assert.equal(expectations.workColumns, 1);
  assert.equal(expectations.focusWidthPx, 5);
  assert.equal(expectations.progressArrowPercent, 2);
  assert.equal(
    design.nodes.find((node) => node.id === expectations.headingNodeId)
      .contentRef.id,
    '9',
  );
  assert.equal(
    design.nodes.find((node) => node.id === expectations.recordNodeId)
      .componentId,
    'work.card',
  );
  assert.deepEqual(
    design.pages.find((page) => page.id === 'work').rootIds,
    expectations.workRootOrder,
  );
});
