/** Explicit synthetic local/CI content only. Never called by a public request. */
import { randomUUID } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import {
  getPayload,
  createLocalReq,
  type CollectionSlug,
  type PayloadRequest,
} from 'payload';
import sharp from 'sharp';
import config from '../src/cms/config';
import { bootstrapCapability } from '../src/cms/access';
import {
  currentPublication,
  publish,
  type Selection,
} from '../src/cms/publication';
import { createSyntheticFixtureDesign } from '../src/public-data/fixture-design';
import { assertValidDesign } from '../src/design/model';

const prefix = 'phase4-synthetic:';
const variant = process.argv.includes('--alternate') ? 'alternate' : 'copper';
if (
  !process.argv.includes('--publish-synthetic') ||
  process.env.ALLOW_SYNTHETIC_PUBLICATION !== '1'
)
  throw new Error(
    'Explicit --publish-synthetic and ALLOW_SYNTHETIC_PUBLICATION=1 required',
  );
const database = new URL(process.env.DATABASE_URI || '');
if (
  !['127.0.0.1', 'localhost', '[::1]'].includes(database.hostname) ||
  !/_(dev|test)$/.test(database.pathname)
)
  throw new Error(
    'Synthetic fixtures require a dedicated local *_dev or *_test database',
  );

function rich(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      version: 1,
      direction: null,
      format: '',
      indent: 0,
      children: paragraphs.map((value, index) => ({
        type: index % 6 === 0 ? 'heading' : 'paragraph',
        ...(index % 6 === 0 ? { tag: 'h2' } : {}),
        version: 1,
        direction: null,
        format: '',
        indent: 0,
        children: [
          {
            type: 'text',
            version: 1,
            text: value,
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
          },
        ],
      })),
    },
  };
}
const articleParagraphs = Array.from({ length: 54 }, (_, index) =>
  index % 6 === 0
    ? `Synthetic chapter ${Math.floor(index / 6) + 1}: design, build and observation`
    : `Synthetic reading sample ${index}. This fictional engineering note demonstrates a long article without making claims about a real person, company, qualification or delivered product. The imagined team records constraints, compares a simple option with a more complex one, and writes down what the available evidence does and does not support. The next observation changes a draft; it does not silently change a published version. Readers can follow the section links, resize the page, change the design and still return to the same place. Every result, date and name in this demonstration is synthetic. The purpose of this paragraph is to exercise a readable long-form layout and genuine document scrolling.`,
);

const payload = await getPayload({ config });
try {
  let owner = (
    await payload.find({ collection: 'owners', limit: 1, overrideAccess: true })
  ).docs[0];
  if (!owner) {
    if (!process.argv.includes('--bootstrap-fixture-owner'))
      throw new Error(
        'No owner exists; use explicit --bootstrap-fixture-owner only in the synthetic local database',
      );
    owner = await payload.create({
      collection: 'owners',
      data: {
        email: 'synthetic-owner@phase4.invalid',
        password: `${randomUUID()}-Synthetic!`,
        role: 'owner',
        singleton: 1,
      },
      context: { bootstrap: bootstrapCapability },
      overrideAccess: true,
    });
  }
  if (owner.role !== 'owner')
    throw new Error('The configured owner is disabled');
  const req = await createLocalReq(
    { user: { ...owner, collection: 'owners' } },
    payload,
  );
  const current = await currentPublication(payload);
  if (current)
    for (const [collection, docs] of Object.entries(current.content))
      for (const doc of docs) {
        const source = await payload.findByID({
          collection: collection as CollectionSlug,
          id: String(doc.id),
          depth: 0,
          overrideAccess: false,
          req,
        });
        if (
          !('sourceKey' in source) ||
          typeof source.sourceKey !== 'string' ||
          !source.sourceKey.startsWith(prefix)
        )
          throw new Error(
            'Refusing to replace a publication that contains non-fixture records',
          );
      }
  const selected: { collection: CollectionSlug; id: number | string }[] = [];
  async function upsert(
    collection: CollectionSlug,
    key: string,
    fields: Record<string, unknown>,
    include = true,
  ) {
    const sourceKey = `${prefix}${key}`;
    const existing = (
      await payload.find({
        collection,
        where: { sourceKey: { equals: sourceKey } },
        limit: 1,
        depth: 0,
        draft: true,
        overrideAccess: false,
        req,
      })
    ).docs[0];
    const data = {
      sourceKey,
      visible: true,
      _status: 'draft',
      privateNotes: 'PRIVATE-PHASE4-CANARY-NOTES',
      sources: [
        {
          url: 'https://example.invalid/synthetic-source',
          context:
            'Synthetic fixture; no real-profile source or publication consent inferred',
        },
      ],
      ...fields,
    };
    const result = existing
      ? await payload.update({
          collection,
          id: existing.id,
          data: data as never,
          draft: true,
          overrideAccess: false,
          req,
        })
      : await payload.create({
          collection,
          data: data as never,
          draft: true,
          overrideAccess: false,
          req,
        });
    if (include) selected.push({ collection, id: result.id });
    return result.id;
  }
  async function image(key: string, color: string) {
    const alt = `Synthetic phase4 visual: ${key}. Diagram fixture, not physical evidence.`;
    const existing = (
      await payload.find({
        collection: 'media',
        where: { alt: { equals: alt } },
        limit: 1,
        depth: 0,
        overrideAccess: false,
        req,
      })
    ).docs[0];
    if (existing) return existing;
    const svg = `<svg width="960" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="960" height="600" fill="${color}"/><rect x="72" y="84" width="816" height="432" rx="20" fill="#16181c" stroke="#d8a16b" stroke-width="2"/><path d="M140 420 L300 260 L460 340 L620 180 L800 260" fill="none" stroke="#d8a16b" stroke-width="7"/><text x="140" y="160" fill="#f2f1ee" font-family="sans-serif" font-size="28">SYNTHETIC / ${key.toUpperCase()}</text><circle cx="620" cy="180" r="14" fill="#f2f1ee"/></svg>`;
    const bytes = await sharp(Buffer.from(svg)).png().toBuffer();
    return payload.create({
      collection: 'media',
      data: {
        alt,
        caption:
          'Synthetic test illustration; no real product photograph or outcome.',
        license: 'CC0 synthetic fixture',
        credit: 'Generated locally for engineering verification',
        publicEligible: true,
        kind: 'image',
        resourceVersion: 'generated-by-upload-hook',
        sha256: 'generated-by-upload-hook',
      },
      file: {
        data: bytes,
        mimetype: 'image/png',
        name: `${key}.png`,
        size: bytes.length,
      },
      overrideAccess: false,
      req,
    });
  }
  const visuals = [
    await image('systems', '#313944'),
    await image('software', '#39332f'),
    await image('research', '#293c39'),
  ];
  const fontAlt = 'Synthetic phase4 font fixture: ABeeZee';
  let font = (
    await payload.find({
      collection: 'media',
      where: { alt: { equals: fontAlt } },
      limit: 1,
      depth: 0,
      overrideAccess: false,
      req,
    })
  ).docs[0];
  if (!font) {
    const bytes = await readFile(
      'tests/fixtures/abeezee-latin-400-normal.woff2',
    );
    font = await payload.create({
      collection: 'media',
      data: {
        alt: fontAlt,
        credit:
          'ABeeZee authors; SIL Open Font License included in tests/fixtures',
        license: 'SIL OFL 1.1',
        publicEligible: true,
        kind: 'font',
        resourceVersion: 'generated-by-upload-hook',
        sha256: 'generated-by-upload-hook',
      },
      file: {
        data: bytes,
        size: bytes.length,
        name: 'abeezee.woff2',
        mimetype: 'font/woff2',
      },
      overrideAccess: false,
      req,
    });
  }

  const skillNames = [
    'Embedded Systems',
    'Firmware',
    'Interface Design',
    'TypeScript',
    'Data Visualization',
    'Prototyping',
    'Technical Writing',
    'Systems Thinking',
  ];
  const skills: (number | string)[] = [];
  for (const [index, name] of skillNames.entries())
    skills.push(
      await upsert('skills', `skill-${index}`, {
        title: `Synthetic skill: ${name}`,
        canonicalName: name,
        slug: `synthetic-${name.toLowerCase().replaceAll(' ', '-')}`,
        category: index < 2 ? 'Systems' : index < 5 ? 'Software' : 'Practice',
        summary:
          'Synthetic directory entry with selected public evidence links; no proficiency rating.',
        featured: index < 4,
        sortOrder: index,
        aliases: [{ name: `${name} demonstration` }],
      }),
    );
  const education = await upsert('education', 'education', {
    title: 'Synthetic learning program',
    slug: 'synthetic-learning-program',
    institution: 'Fictional Learning Studio',
    qualification: 'Synthetic programme record',
    fieldOfStudy: 'Engineering methods (synthetic)',
    start: '2021',
    end: '2023',
    completionStatus: 'Synthetic example; no real qualification claim',
    grade: 'PRIVATE-PHASE4-CANARY-GRADE',
    showGrade: false,
    activities: 'Synthetic group research and documentation exercises.',
    coursework:
      'Synthetic sensing, control, accessible interfaces and technical communication.',
    body: rich([
      'Synthetic education record',
      'This fictional record exercises the expanded education layout. It does not describe a real institution, grade or achievement.',
    ]),
    media: [visuals[2].id],
  });
  const experience = await upsert('experiences', 'experience', {
    title: 'Synthetic grouped experience',
    slug: 'synthetic-design-lab',
    organization: 'Fictional Design Lab',
    summary:
      'Synthetic multi-role group for timeline, expansion and reciprocal skill checks.',
    body: rich([
      'Synthetic professional context',
      'No employer, project delivery or employment claim is made by this demonstration.',
    ]),
    roles: [
      {
        roleKey: 'prototype-engineer',
        role: 'Synthetic prototype engineer',
        employmentType: 'Synthetic example',
        start: '2024-03',
        end: '2025',
        current: false,
        responsibilities:
          'Synthetic responsibilities: compare constraints, assemble test fixtures, document limitations and retain upstream credits.',
        outcomes:
          'Synthetic outcome description; no quantitative or real-world delivery claim.',
        contribution: 'Fictional individual contribution',
      },
      {
        roleKey: 'technical-writer',
        role: 'Synthetic technical writer',
        start: '2023',
        end: '2024',
        current: false,
        responsibilities:
          'Synthetic structured documentation and accessible explanation.',
        outcomes: 'Synthetic long-form writing sample',
      },
      {
        roleKey: 'private-role',
        role: 'PRIVATE-PHASE4-CANARY-ROLE',
        hidden: true,
      },
    ],
    media: [visuals[0].id],
  });

  const names = [
    'Orbit Controller',
    'Field Notes',
    'Signal Atlas',
    'Studio Index',
    'Bench Logger',
    'Pattern Library',
    'Sensor Sketch',
    'Reading Room',
    'Motion Ledger',
    'Trace Viewer',
  ];
  const projectIds: (number | string)[] = [];
  const hasOldRedirect = Boolean(
    current?.redirects['/projects/synthetic-orbit-old'],
  );
  for (const [index, name] of names.entries())
    projectIds.push(
      await upsert('projects', `project-${index}`, {
        title: `Synthetic / ${name}`,
        slug:
          index === 0 && !hasOldRedirect
            ? 'synthetic-orbit-old'
            : `synthetic-${name.toLowerCase().replaceAll(' ', '-')}`,
        summary: `A synthetic ${index % 2 ? 'software' : 'systems'} case study for route and layout verification. No real product or owner achievement is implied.`,
        discipline: index % 2 ? 'Software' : 'Systems',
        role: 'Synthetic design and documentation',
        workStatus: 'Synthetic prototype',
        start: '2024',
        end: '2025',
        featured: index < 3,
        sortOrder: index,
        collaborators:
          'Fictional collaborators; no real person credited or endorsed.',
        problem:
          'Synthetic problem: make a complex engineering process easier to inspect.',
        contribution:
          'Synthetic contribution: a small prototype, explicit trade-offs and a documented handoff.',
        approach:
          'Synthetic approach: explore a narrow option, test assumptions and compare alternatives.',
        architecture:
          'Synthetic architecture: observable inputs, a bounded state model and clear outputs.',
        results:
          'Synthetic qualitative result. No measured or deployed outcome is asserted.',
        limitations:
          'Fictional fixture only; this is not evidence of a delivered product.',
        lineage:
          'Original synthetic fixture created for local engineering verification.',
        credits:
          'Synthetic diagrams generated locally. No third-party project is represented.',
        body: rich([
          `Synthetic case study: ${name}`,
          ...articleParagraphs.slice(1, 13),
        ]),
        media: [visuals[index % visuals.length].id],
        links: [
          {
            label: 'Synthetic source example (not a live repository)',
            url: 'https://example.invalid/synthetic-source',
          },
        ],
      }),
    );
  for (let index = 0; index < 14; index++)
    await upsert('posts', `post-${index}`, {
      title: `Synthetic / ${index === 0 ? 'A field guide to thoughtful systems' : `Notebook ${String(index + 1).padStart(2, '0')}`}`,
      slug:
        index === 0
          ? 'synthetic-thoughtful-systems'
          : `synthetic-notebook-${index + 1}`,
      summary:
        'Synthetic journal content for reading, filtering, pagination, links and scroll verification.',
      kind: ['article', 'build-log', 'update', 'milestone'][index % 4],
      editorialDate: `2025-${String((index % 12) + 1).padStart(2, '0')}`,
      sortOrder: index,
      featured: index < 3,
      projects: [projectIds[index % projectIds.length]],
      categories: [{ name: index % 2 ? 'Practice' : 'Systems' }],
      body: rich(
        index === 0 ? articleParagraphs : articleParagraphs.slice(0, 8),
      ),
      media: [visuals[index % visuals.length].id],
    });
  const kinds = [
    'credential',
    'course',
    'award',
    'volunteering',
    'publication',
    'patent',
    'test-score',
    'language',
    'organization',
    'cause',
    'career-break',
    'service',
    'featured',
    'testimonial',
  ];
  const professional: (number | string)[] = [];
  for (const [index, kind] of kinds.entries())
    professional.push(
      await upsert('professional-sections', `professional-${kind}`, {
        title: `Synthetic / ${kind.replaceAll('-', ' ')}`,
        slug: `synthetic-${kind}`,
        kind,
        summary:
          'Fictional optional professional record. No real credential, affiliation, score or endorsement.',
        issuer: 'Fictional issuer',
        organization: 'Fictional organization',
        role: 'Synthetic role',
        start: '2024',
        end: '2025',
        issueDate: '2024-05',
        noExpiry: true,
        credentialId: 'PRIVATE-PHASE4-CANARY-CREDENTIAL',
        showCredentialId: false,
        provider: 'Fictional provider',
        courseCode: 'SYNTHETIC-01',
        completionStatus: 'Synthetic only',
        authors: 'Fictional author',
        publisher: 'Fictional publisher',
        identifier: 'SYNTHETIC-EXAMPLE',
        jurisdiction: 'Synthetic jurisdiction',
        patentStatus: 'Synthetic example only',
        result: 'Synthetic result',
        scale: 'Synthetic scale',
        proficiency: 'Synthetic description; no proficiency bar',
        cause: 'Synthetic cause',
        scope: 'Synthetic offering; no real service is sold',
        deliveryMode: 'Synthetic demonstration',
        price: 'PRIVATE-PHASE4-CANARY-PRICE',
        showPrice: false,
        quote:
          'This is a synthetic quotation for layout verification, not a real recommendation.',
        author: 'Fictional collaborator',
        relationship: 'Synthetic example',
        consentReceipt:
          'Synthetic fixture only; no real third party or endorsement.',
        consentToPublish: true,
        url: 'https://example.invalid/synthetic-professional-record',
        sortOrder: index,
        body: rich([
          `Synthetic ${kind} record`,
          'All narrative, affiliations and publication metadata here are fictional demonstration values.',
        ]),
        related: [
          { relationTo: 'education', value: education },
          { relationTo: 'projects', value: projectIds[0] },
        ],
      }),
    );
  const profile = await upsert('profile', 'profile', {
    title: 'Synthetic profile / Demo Engineer',
    slug: 'synthetic-demo-engineer',
    displayName: 'Demo Engineer',
    headline: 'Synthetic systems designer and thoughtful builder',
    region: 'Synthetic location',
    availability: 'Synthetic demonstration only',
    summary:
      'This is a clearly labelled local/CI profile fixture, not a biography or published claim about the owner.',
    body: rich([
      'Synthetic profile',
      'Demo Engineer is a fictional identity used to verify the portfolio interface and its publication boundary. All work, study and professional records shown here are synthetic.',
    ]),
    links: [
      {
        label: 'Synthetic external profile',
        url: 'https://example.invalid/demo-engineer',
      },
    ],
    contact: [
      {
        label: 'Demo email (synthetic)',
        value: 'demo@example.invalid',
        public: true,
      },
      {
        label: 'Private canary',
        value: 'PRIVATE-PHASE4-CANARY-CONTACT',
        public: false,
      },
    ],
    media: [visuals[1].id],
  });
  await upsert('site-settings', 'settings', {
    title: 'Synthetic site settings',
    slug: 'synthetic-site-settings',
    navigation: [
      { label: 'Home', path: '/' },
      { label: 'Work', path: '/work' },
      { label: 'Profile', path: '/profile' },
      { label: 'Journal', path: '/journal' },
      { label: 'Contact', path: '/contact' },
    ],
    footer:
      'Synthetic local/CI publication. No owner factual claims have been migrated.',
    sectionOrder: [
      { section: 'work' },
      { section: 'profile' },
      { section: 'journal' },
      { section: 'contact' },
    ],
  });
  for (const [index, project] of projectIds.entries())
    await upsert('associations', `edge-project-${index}`, {
      title: `Synthetic skill project edge ${index}`,
      slug: `synthetic-skill-project-${index}`,
      skill: skills[index % skills.length],
      target: { relationTo: 'projects', value: project },
      kind: 'applied-in-project',
      context: 'Synthetic explicitly selected relationship',
    });
  await upsert('associations', 'edge-role', {
    title: 'Synthetic exact role skill edge',
    slug: 'synthetic-role-skill',
    skill: skills[0],
    target: { relationTo: 'experiences', value: experience },
    targetRoleKey: 'prototype-engineer',
    kind: 'used-in-role',
    context: 'Synthetic relation to the selected visible role',
  });
  await upsert('associations', 'edge-education', {
    title: 'Synthetic education skill edge',
    slug: 'synthetic-education-skill',
    skill: skills[0],
    target: { relationTo: 'education', value: education },
    kind: 'studied-in-program',
  });
  await upsert('associations', 'edge-credential', {
    title: 'Synthetic credential skill edge',
    slug: 'synthetic-credential-skill',
    skill: skills[6],
    target: { relationTo: 'professional-sections', value: professional[0] },
    kind: 'supported-by-credential',
  });
  await upsert('context-links', 'context-education', {
    title: 'Synthetic project institution context',
    slug: 'synthetic-project-institution',
    project: projectIds[0],
    target: { relationTo: 'education', value: education },
    kind: 'associated-with',
    context:
      'Synthetic explicit programme association; not a shared-skill inference',
  });
  await upsert('context-links', 'context-role', {
    title: 'Synthetic project role context',
    slug: 'synthetic-project-role',
    project: projectIds[0],
    target: { relationTo: 'experiences', value: experience },
    targetRoleKey: 'prototype-engineer',
    kind: 'associated-with',
  });
  await upsert(
    'projects',
    'private-project',
    {
      title: 'PRIVATE-PHASE4-CANARY-TITLE',
      slug: 'private-phase4-canary',
      visible: false,
      summary: 'PRIVATE-PHASE4-CANARY-BODY',
    },
    false,
  );

  const resource = (media: {
    id: string | number;
    resourceVersion?: unknown;
    sha256?: unknown;
  }) => {
    if (
      typeof media.resourceVersion !== 'string' ||
      typeof media.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(media.sha256)
    )
      throw new Error(
        'Fixture upload did not return immutable resource metadata',
      );
    return {
      id: media.id,
      resourceVersion: media.resourceVersion,
      sha256: media.sha256,
    };
  };
  const { design: designData, expectations } = createSyntheticFixtureDesign({
    visuals: visuals.map(resource),
    font: resource(font),
    projectId: projectIds[0],
    alternate: variant === 'alternate',
  });
  if (process.argv.includes('--system-default')) {
    designData.defaultMode = 'system';
    expectations.mode = 'system';
    expectations.systemPreferenceFollowsOSForNewVisitor = true;
  }
  const existingDesign = (
    await payload.find({
      collection: 'design-themes',
      where: { title: { equals: 'Synthetic Phase4 design' } },
      limit: 1,
      draft: true,
      overrideAccess: false,
      req,
    })
  ).docs[0];
  const design = existingDesign
    ? await payload.update({
        collection: 'design-themes',
        id: existingDesign.id,
        data: { data: assertValidDesign(designData) as never },
        draft: true,
        overrideAccess: false,
        req,
      })
    : await payload.create({
        collection: 'design-themes',
        data: {
          title: 'Synthetic Phase4 design',
          schemaVersion: 1,
          data: assertValidDesign(designData) as never,
        },
        draft: true,
        overrideAccess: false,
        req,
      });
  async function latestVersion(
    collection: CollectionSlug,
    id: number | string,
    request: PayloadRequest = req,
  ) {
    const result = await payload.findVersions({
      collection,
      where: { parent: { equals: id } },
      sort: '-updatedAt',
      limit: 1,
      depth: 0,
      overrideAccess: false,
      req: request,
    });
    if (!result.docs[0]) throw new Error('Missing fixture version');
    return Number(result.docs[0].id);
  }
  const selections: Selection[] = await Promise.all(
    selected.map(async (entry) => ({
      collection: entry.collection,
      versionId: await latestVersion(entry.collection, entry.id),
    })),
  );
  const designVersionId = await latestVersion('design-themes', design.id);
  let publication = await publish(payload, req, {
    expectedRevision: current?.revision || null,
    selections,
    designVersionId,
  });
  if (!hasOldRedirect) {
    await payload.update({
      collection: 'projects',
      id: projectIds[0],
      data: { slug: 'synthetic-orbit-controller' },
      draft: true,
      overrideAccess: false,
      req,
    });
    const next = selections.map((entry) => ({ ...entry }));
    const position = selected.findIndex(
      (entry) => entry.collection === 'projects' && entry.id === projectIds[0],
    );
    next[position].versionId = await latestVersion('projects', projectIds[0]);
    publication = await publish(payload, req, {
      expectedRevision: publication.revision,
      selections: next,
      designVersionId,
    });
  }
  const canary = 'PRIVATE-PHASE4-CANARY';
  if (JSON.stringify(publication).includes(canary))
    throw new Error('Synthetic privacy canary entered public publication');
  // Keep a newer draft on an already selected record: public routes must still
  // render the selected immutable snapshot rather than querying the raw CMS.
  await payload.update({
    collection: 'projects',
    id: projectIds[0],
    data: {
      title: 'PRIVATE-PHASE4-NEWER-DRAFT-CANARY',
      summary: 'PRIVATE-PHASE4-NEWER-DRAFT-CANARY-BODY',
    },
    draft: true,
    overrideAccess: false,
    req,
  });
  await mkdir('tmp', { recursive: true });
  const receipt = {
    synthetic: true,
    variant,
    revision: publication.revision,
    counts: Object.fromEntries(
      Object.entries(publication.content).map(([key, values]) => [
        key,
        values.length,
      ]),
    ),
    profileId: profile,
    projectId: projectIds[0],
    workPath: '/work/synthetic-orbit-controller',
    articlePath: '/journal/synthetic-thoughtful-systems',
    oldPath: '/work/synthetic-orbit-old',
    skillSlug: 'synthetic-embedded-systems',
    fontId: font.id,
    expectations,
  };
  const sourceCounts: Record<string, number> = {};
  for (const collection of new Set(selected.map((entry) => entry.collection)))
    sourceCounts[collection] = (
      await payload.count({
        collection,
        where: { sourceKey: { like: prefix } },
        overrideAccess: false,
        req,
      })
    ).totalDocs;
  sourceCounts.media = (
    await payload.count({
      collection: 'media',
      where: { alt: { like: 'Synthetic phase4' } },
      overrideAccess: false,
      req,
    })
  ).totalDocs;
  sourceCounts['design-themes'] = (
    await payload.count({
      collection: 'design-themes',
      where: { title: { equals: 'Synthetic Phase4 design' } },
      overrideAccess: false,
      req,
    })
  ).totalDocs;
  const expectedSourceCounts = {
    skills: 8,
    education: 1,
    experiences: 1,
    projects: 11,
    posts: 14,
    'professional-sections': 14,
    profile: 1,
    'site-settings': 1,
    associations: 13,
    'context-links': 2,
    media: 4,
    'design-themes': 1,
  };
  for (const [collection, count] of Object.entries(expectedSourceCounts))
    if (sourceCounts[collection] !== count)
      throw new Error(`Synthetic fixture record count mismatch: ${collection}`);
  await writeFile(
    'tmp/phase4-fixture-receipt.json',
    JSON.stringify({ ...receipt, sourceCounts }, null, 2),
    { mode: 0o600 },
  );
  console.log(JSON.stringify({ ...receipt, sourceCounts }));
} finally {
  await payload.destroy();
}
// Matches the established Payload CLI teardown for its retained initial pool checkout.
process.exit(0);
