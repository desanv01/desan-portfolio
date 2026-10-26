import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { randomUUID, randomBytes } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

test(
  'real Postgres backend authorization, revisions, immutable publication and media',
  { timeout: 240000 },
  async (t) => {
    assert.ok(process.env.TEST_DATABASE_URI, 'TEST_DATABASE_URI is required');
    assert.match(
      new URL(process.env.TEST_DATABASE_URI).pathname,
      /_test$/,
      'Destructive migration tests require a dedicated *_test database',
    );
    process.env.DATABASE_URI = process.env.TEST_DATABASE_URI;
    process.env.LOCAL_RECOVERY_SPOOL = '1';
    const { getPayload, createLocalReq, handleEndpoints } =
      await import('payload');
    const { default: config } = await import('../src/cms/config');
    const { bootstrapCapability } = await import('../src/cms/access');
    const { createEmptyDesign } = await import('../src/design/model');
    const { publish, currentPublication, resolveSelection } =
      await import('../src/cms/publication');
    const payload = await getPayload({ config });
    t.after(async () => {
      await payload.destroy();
    });
    await payload.db.migrateFresh({ forceAcceptWarning: true });
    await payload.db.migrate();
    const publicRoute = await import('../src/app/api/publication/route');
    const previewRoute = await import('../src/app/api/owner-preview/route');
    const mediaRoute = await import('../src/app/api/public/media/[id]/route');
    let base = '';
    const server = createServer(async (incoming, outgoing) => {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of incoming) chunks.push(Buffer.from(chunk));
        const method = incoming.method || 'GET';
        const request = new Request(`${base}${incoming.url}`, {
          method,
          headers: incoming.headers as HeadersInit,
          ...(method === 'GET' || method === 'HEAD'
            ? {}
            : { body: Buffer.concat(chunks) }),
        });
        const path = new URL(request.url).pathname;
        let response: Response;
        if (path === '/api/publication')
          response =
            method === 'POST'
              ? await publicRoute.POST(request)
              : await publicRoute.GET();
        else if (path === '/api/owner-preview')
          response = await previewRoute.POST(request);
        else if (path.startsWith('/api/public/media/'))
          response = await mediaRoute.GET(request, {
            params: Promise.resolve({ id: path.split('/').at(-1)! }),
          });
        else response = await handleEndpoints({ config, request });
        outgoing.writeHead(
          response.status,
          Object.fromEntries(response.headers),
        );
        outgoing.end(Buffer.from(await response.arrayBuffer()));
      } catch {
        outgoing.writeHead(500);
        outgoing.end('Backend test adapter failure');
      }
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    base = `http://127.0.0.1:${address.port}`;
    process.env.CMS_SERVER_URL = base;
    t.after(async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });
    const api = (
      path: string,
      method = 'GET',
      data?: unknown,
      token?: string,
      origin = base,
    ) =>
      fetch(`${base}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `JWT ${token}` } : {}),
          Origin: origin,
        },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
      });
    const email = 'synthetic-owner@example.invalid';
    const password = `Local-only-${randomUUID()}!`;
    assert.ok(
      (await api('/api/owners/first-register', 'POST', { email, password }))
        .status >= 400,
      'First-user endpoint must not bypass local bootstrap',
    );
    assert.ok(
      (await api('/api/owners', 'POST', { email, password })).status >= 400,
    );
    assert.equal(
      (await payload.count({ collection: 'owners', overrideAccess: true }))
        .totalDocs,
      0,
    );
    const owner = await payload.create({
      collection: 'owners',
      data: { email, password, singleton: 1, role: 'owner' },
      context: { bootstrap: bootstrapCapability },
      overrideAccess: true,
    });
    await assert.rejects(
      payload.create({
        collection: 'owners',
        data: {
          email: 'second@example.invalid',
          password,
          singleton: 1,
          role: 'owner',
        },
        context: { bootstrap: bootstrapCapability },
        overrideAccess: true,
      }),
    );
    const login = await api('/api/owners/login', 'POST', { email, password });
    assert.equal(login.status, 200);
    const loginData = await login.json();
    assert.ok(login.headers.get('set-cookie')?.includes('HttpOnly'));
    let token = String(loginData.token);
    const authenticated = await payload.auth({
      headers: new Headers({ Authorization: `JWT ${token}` }),
    });
    const req = await createLocalReq(
      { user: authenticated.user || undefined },
      payload,
    );
    const anonymous = await createLocalReq({}, payload);
    const nonowner = await createLocalReq(
      { user: { ...authenticated.user!, role: 'disabled' } },
      payload,
    );
    const fixture = {
      sourceKey: 'synthetic-project',
      title: 'Public A',
      slug: 'synthetic-a',
      summary: 'Reviewed A',
      visible: true,
      privateNotes: 'PRIVATE-NOTE-NEVER-PUBLIC',
      _status: 'draft' as const,
    };
    await assert.rejects(
      payload.create({
        collection: 'projects',
        data: fixture,
        overrideAccess: false,
        req: anonymous,
      }),
    );
    await assert.rejects(
      payload.create({
        collection: 'projects',
        data: fixture,
        overrideAccess: false,
        req: nonowner,
      }),
    );
    assert.ok((await api('/api/projects', 'POST', fixture)).status >= 400);
    assert.ok((await api('/api/projects?draft=true')).status >= 400);
    assert.equal((await api('/api/projects/versions')).status, 403);
    assert.equal((await api('/api/design-themes/versions')).status, 403);
    await payload.update({
      collection: 'owners',
      id: owner.id,
      data: { role: 'disabled' },
      overrideAccess: true,
    });
    const deniedLogin = await api('/api/owners/login', 'POST', {
      email,
      password,
    });
    const disabledToken = (await deniedLogin.json()).token;
    assert.ok(
      (await api('/api/projects', 'POST', fixture, disabledToken)).status >=
        400,
      'Authenticated disabled identity cannot write',
    );
    await payload.update({
      collection: 'owners',
      id: owner.id,
      data: { role: 'owner' },
      overrideAccess: true,
    });

    const skill = await payload.create({
      collection: 'skills',
      data: {
        sourceKey: 'synthetic-skill',
        title: 'Synthetic skill',
        canonicalName: 'Synthetic skill',
        slug: 'synthetic-skill',
        visible: true,
      },
      draft: true,
      overrideAccess: false,
      req,
    });
    const project = await payload.create({
      collection: 'projects',
      data: fixture,
      draft: true,
      overrideAccess: false,
      req,
    });
    const education = await payload.create({
      collection: 'education',
      data: {
        sourceKey: 'synthetic-education',
        title: 'Synthetic education',
        slug: 'synthetic-education',
        institution: 'Synthetic institution',
        visible: true,
        grade: 'PRIVATE-GRADE',
        showGrade: false,
      },
      draft: true,
      overrideAccess: false,
      req,
    });
    await assert.rejects(
      payload.create({
        collection: 'experiences',
        data: {
          sourceKey: 'invalid-date',
          title: 'Invalid',
          slug: 'invalid-date',
          organization: 'Synthetic',
          roles: [{ role: 'Test', start: '2026-05', end: '2025-01' }],
        },
        draft: true,
        overrideAccess: false,
        req,
      }),
    );
    await assert.rejects(
      payload.create({
        collection: 'experiences',
        data: {
          sourceKey: 'invalid-current',
          title: 'Invalid',
          slug: 'invalid-current',
          organization: 'Synthetic',
          roles: [{ role: 'Test', current: true, end: '2026' }],
        },
        draft: true,
        overrideAccess: false,
        req,
      }),
    );
    const edge1 = await payload.create({
      collection: 'associations',
      data: {
        sourceKey: 'synthetic-edge1',
        title: 'Synthetic edge',
        slug: 'synthetic-edge1',
        visible: true,
        skill: skill.id,
        target: { relationTo: 'projects', value: project.id },
        kind: 'evidence',
      },
      draft: true,
      overrideAccess: false,
      req,
    });
    const edge2 = await payload.create({
      collection: 'associations',
      data: {
        sourceKey: 'synthetic-edge2',
        title: 'Synthetic edge2',
        slug: 'synthetic-edge2',
        visible: true,
        skill: skill.id,
        target: { relationTo: 'projects', value: project.id },
        kind: 'context',
      },
      draft: true,
      overrideAccess: false,
      req,
    });
    const edge3 = await payload.create({
      collection: 'associations',
      data: {
        sourceKey: 'synthetic-edge3',
        title: 'Synthetic edge3',
        slug: 'synthetic-edge3',
        visible: true,
        skill: skill.id,
        target: { relationTo: 'education', value: education.id },
        kind: 'evidence',
      },
      draft: true,
      overrideAccess: false,
      req,
    });
    await assert.rejects(
      payload.create({
        collection: 'associations',
        data: {
          sourceKey: 'duplicate-edge',
          title: 'Duplicate',
          slug: 'duplicate-edge',
          visible: true,
          skill: skill.id,
          target: { relationTo: 'projects', value: project.id },
          kind: 'evidence',
        },
        draft: true,
        overrideAccess: false,
        req,
      }),
    );
    const experience = await payload.create({
      collection: 'experiences',
      data: {
        sourceKey: 'synthetic-work',
        title: 'Synthetic work',
        slug: 'synthetic-work',
        organization: 'Synthetic organization',
        visible: true,
        roles: [
          {
            roleKey: 'public-role',
            role: 'Public role',
            start: '2026-05',
            end: '2026',
          },
          { roleKey: 'private-role', role: 'PRIVATE-ROLE', hidden: true },
        ],
      },
      draft: true,
      overrideAccess: false,
      req,
    });
    await assert.rejects(
      payload.update({
        collection: 'experiences',
        id: experience.id,
        data: { roles: [{ id: experience.roles![0].id, start: '2027' }] },
        draft: true,
        overrideAccess: false,
        req,
      }),
    );
    await assert.rejects(
      payload.update({
        collection: 'experiences',
        id: experience.id,
        data: {
          roles: [
            { roleKey: 'duplicate', role: 'Public' },
            { roleKey: 'duplicate', role: 'Hidden', hidden: true },
          ],
        },
        draft: true,
        overrideAccess: false,
        req,
      }),
    );
    await assert.rejects(
      payload.create({
        collection: 'posts',
        data: {
          sourceKey: 'invalid-calendar',
          title: 'Invalid calendar',
          slug: 'invalid-calendar',
          editorialDate: '2026-02-31',
        },
        draft: true,
        overrideAccess: false,
        req,
      }),
    );
    await assert.rejects(
      payload.create({
        collection: 'projects',
        data: { ...fixture, sourceKey: 'invalid-slug', slug: '../private' },
        draft: true,
        overrideAccess: false,
        req,
      }),
    );
    const contextLink = await payload.create({
      collection: 'context-links',
      data: {
        sourceKey: 'synthetic-context',
        title: 'Synthetic project education context',
        slug: 'synthetic-context',
        visible: true,
        project: project.id,
        target: { relationTo: 'education', value: education.id },
        kind: 'institution-context',
      },
      draft: true,
      overrideAccess: false,
      req,
    });
    const roleEdge = await payload.create({
      collection: 'associations',
      data: {
        sourceKey: 'role-edge',
        title: 'Role skill',
        slug: 'role-edge',
        visible: true,
        skill: skill.id,
        target: { relationTo: 'experiences', value: experience.id },
        targetRoleKey: 'public-role',
        kind: 'evidence',
      },
      draft: true,
      overrideAccess: false,
      req,
    });
    const hiddenRoleEdge = await payload.create({
      collection: 'associations',
      data: {
        sourceKey: 'hidden-role-edge',
        title: 'Private role skill',
        slug: 'hidden-role-edge',
        visible: true,
        skill: skill.id,
        target: { relationTo: 'experiences', value: experience.id },
        targetRoleKey: 'private-role',
        kind: 'evidence',
      },
      draft: true,
      overrideAccess: false,
      req,
    });
    const png = await sharp({
      create: { width: 4, height: 4, channels: 3, background: '#ff9900' },
    })
      .png()
      .toBuffer();
    const file = {
      data: png,
      mimetype: 'image/png',
      name: 'synthetic.png',
      size: png.length,
    };
    await assert.rejects(
      payload.create({
        collection: 'media',
        data: { alt: 'Synthetic', license: 'Synthetic test' },
        file,
        req: anonymous,
        overrideAccess: false,
      }),
    );
    await assert.rejects(
      payload.create({
        collection: 'media',
        data: { alt: 'Synthetic', license: 'Synthetic test' },
        file: { ...file, data: Buffer.from('<svg onload="alert(1)"/>') },
        req,
        overrideAccess: false,
      }),
    );
    await assert.rejects(
      payload.create({
        collection: 'media',
        data: { alt: 'Synthetic', license: 'Synthetic test' },
        file: { ...file, mimetype: 'image/jpeg' },
        req,
        overrideAccess: false,
      }),
    );
    await assert.rejects(
      payload.create({
        collection: 'media',
        data: { alt: 'Synthetic', license: 'Synthetic test' },
        file: {
          data: Buffer.from('%PDF-1.7\n/Open#41ction\n%%EOF'),
          size: 35,
          mimetype: 'application/pdf',
          name: 'active.pdf',
        },
        req,
        overrideAccess: false,
      }),
    );
    const malformedFont = Buffer.alloc(48);
    malformedFont.write('wOF2');
    malformedFont.writeUInt32BE(48, 8);
    await assert.rejects(
      payload.create({
        collection: 'media',
        data: { alt: 'Synthetic font', license: 'Test' },
        file: {
          data: malformedFont,
          size: 48,
          mimetype: 'font/woff2',
          name: 'bad.woff2',
        },
        req,
        overrideAccess: false,
      }),
    );
    const compressedLarge = await sharp(randomBytes(2500 * 2500 * 3), {
      raw: { width: 2500, height: 2500, channels: 3 },
    })
      .jpeg({ quality: 60 })
      .toBuffer();
    await assert.rejects(
      payload.create({
        collection: 'media',
        data: { alt: 'Oversize transformed test', license: 'Synthetic' },
        file: {
          data: compressedLarge,
          size: compressedLarge.length,
          mimetype: 'image/jpeg',
          name: 'large.jpg',
        },
        req,
        overrideAccess: false,
      }),
      /Transformed upload exceeds/,
    );
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: 'Synthetic orange square',
        license: 'CC0 synthetic test',
        publicEligible: true,
      },
      file,
      overrideAccess: false,
      req,
    });
    assert.equal(media.kind, 'image');
    assert.match(String(media.sha256), /^[a-f0-9]{64}$/);
    await assert.rejects(
      payload.update({
        collection: 'media',
        id: media.id,
        data: {},
        file,
        overrideAccess: false,
        req,
      }),
    );
    const rawFileURL = `/api/media/file/${media.filename}`;
    assert.ok(
      (await api(rawFileURL)).status >= 400,
      'Raw originals remain owner-only',
    );
    assert.equal((await api(`/api/public/media/${media.id}`)).status, 404);
    await payload.update({
      collection: 'projects',
      id: project.id,
      data: { media: [media.id] },
      draft: true,
      overrideAccess: false,
      req,
    });
    const fontBytes = await readFile(
      'tests/fixtures/abeezee-latin-400-normal.woff2',
    );
    const font = await payload.create({
      collection: 'media',
      data: {
        alt: 'ABeeZee test font',
        license: 'SIL OFL 1.1',
        publicEligible: true,
      },
      file: {
        data: fontBytes,
        mimetype: 'font/woff2',
        name: 'test.woff2',
        size: fontBytes.length,
      },
      overrideAccess: false,
      req,
    });
    assert.equal(font.kind, 'font');
    const designData = createEmptyDesign('synthetic-design');
    designData.fonts.push({
      id: String(font.id),
      version: String(font.resourceVersion),
      sha256: String(font.sha256),
      rights: {
        license: 'SIL OFL 1.1',
        attribution: 'ABeeZee authors',
        redistributable: true,
      },
      family: 'ABeeZee',
      style: 'normal',
      weight: { min: 400, max: 400 },
      axes: [],
      fallbacks: ['sans-serif'],
    });
    const design = await payload.create({
      collection: 'design-themes',
      data: { title: 'Synthetic design', data: designData, schemaVersion: 1 },
      draft: true,
      overrideAccess: false,
      req,
    });
    const version = async (collection: string, parent: number | string) =>
      (
        await payload.findVersions({
          collection,
          where: { parent: { equals: parent } },
          sort: '-updatedAt',
          limit: 1,
          depth: 0,
          overrideAccess: false,
          req,
        })
      ).docs[0].id as number;
    const designVersionId = await version('design-themes', design.id);
    const selections = await Promise.all(
      [
        ['skills', skill.id],
        ['projects', project.id],
        ['education', education.id],
        ['experiences', experience.id],
        ['context-links', contextLink.id],
        ['associations', edge1.id],
        ['associations', edge2.id],
        ['associations', edge3.id],
        ['associations', roleEdge.id],
      ].map(async ([collection, parent]) => ({
        collection: String(collection),
        versionId: await version(String(collection), parent),
      })),
    );
    const input = { expectedRevision: null, designVersionId, selections };
    await assert.rejects(publish(payload, anonymous, input));
    await assert.rejects(
      resolveSelection(payload, req, {
        ...input,
        selections: selections.filter((x) => x.collection !== 'education'),
      }),
    );
    await assert.rejects(
      resolveSelection(payload, req, {
        ...input,
        selections: [
          ...selections,
          {
            collection: 'associations',
            versionId: await version('associations', hiddenRoleEdge.id),
          },
        ],
      }),
    );
    assert.equal((await api('/api/publication', 'POST', input)).status, 403);
    assert.equal(
      (
        await api(
          '/api/publication',
          'POST',
          input,
          token,
          'https://hostile.example',
        )
      ).status,
      403,
    );
    const preview = await api('/api/owner-preview', 'POST', input, token);
    assert.equal(preview.status, 200);
    assert.equal(preview.headers.get('cache-control'), 'private, no-store');
    assert.equal(
      await currentPublication(payload),
      null,
      'Preview does not publish',
    );
    const first = await publish(payload, req, input);
    const snapshotCount = (
      await payload.count({
        collection: 'publication-snapshots',
        req,
        overrideAccess: false,
      })
    ).totalDocs;
    const realUpdate = payload.update;
    payload.update = ((options: Parameters<typeof payload.update>[0]) => {
      if (options.collection === 'publication-state')
        throw new Error('Synthetic failure after snapshot insert');
      return realUpdate(options);
    }) as typeof payload.update;
    try {
      await assert.rejects(
        publish(payload, req, { ...input, expectedRevision: first.revision }),
      );
    } finally {
      payload.update = realUpdate;
    }
    assert.equal(
      (
        await payload.count({
          collection: 'publication-snapshots',
          req,
          overrideAccess: false,
        })
      ).totalDocs,
      snapshotCount,
      'Failed pointer update rolls back inserted snapshot',
    );
    assert.equal((await currentPublication(payload))?.revision, first.revision);
    assert.equal(
      first.content.skills[0].relatedCount,
      3,
      'Duplicate kinds count one target; distinct typed records and explicit public role count separately',
    );
    assert.equal(
      (first.content.projects[0].contextLinks as unknown[]).length,
      1,
    );
    assert.equal(
      (first.content.education[0].contextLinks as unknown[]).length,
      1,
    );
    assert.ok(
      first.publishedAt && !JSON.stringify(first).includes('PRIVATE-ROLE'),
    );
    assert.equal(
      (first.content.projects[0].associations as unknown[]).length,
      2,
    );
    const publicA = await api('/api/publication');
    const textA = await publicA.text();
    assert.ok(textA.includes('Reviewed A'));
    assert.ok(!textA.includes('PRIVATE-NOTE'));
    assert.ok(!textA.includes('PRIVATE-GRADE'));
    const originalBytes = await (
      await api(`/api/public/media/${media.id}`)
    ).arrayBuffer();
    assert.ok(originalBytes.byteLength > 0);
    const replacementBytes = await sharp({
      create: { width: 4, height: 4, channels: 3, background: '#0033ff' },
    })
      .png()
      .toBuffer();
    const replacement = await payload.create({
      collection: 'media',
      data: {
        alt: 'Synthetic blue replacement',
        license: 'Synthetic',
        publicEligible: true,
      },
      file: {
        data: replacementBytes,
        size: replacementBytes.length,
        mimetype: 'image/png',
        name: 'replacement.png',
      },
      req,
      overrideAccess: false,
    });
    await payload.update({
      collection: 'projects',
      id: project.id,
      data: {
        media: [replacement.id],
        title: 'Private draft B',
        summary: 'SECRET-NEW-DRAFT',
        slug: 'synthetic-b',
      },
      draft: true,
      overrideAccess: false,
      req,
    });
    assert.ok(
      !(await (await api('/api/publication')).text()).includes(
        'SECRET-NEW-DRAFT',
      ),
    );
    assert.deepEqual(
      await (await api(`/api/public/media/${media.id}`)).arrayBuffer(),
      originalBytes,
    );
    await assert.rejects(
      publish(payload, req, { ...input, expectedRevision: 'stale' }),
    );
    const nextSelections = [
      ...selections.filter((x) => x.collection !== 'projects'),
      {
        collection: 'projects',
        versionId: await version('projects', project.id),
      },
    ];
    const next = await publish(payload, req, {
      ...input,
      selections: nextSelections,
      expectedRevision: first.revision,
    });
    assert.equal(
      next.content.projects[0].publishedAt,
      first.content.projects[0].publishedAt,
    );
    assert.ok(Date.parse(next.publishedAt!) >= Date.parse(first.publishedAt!));
    assert.equal((await api(`/api/public/media/${media.id}`)).status, 404);
    assert.equal(
      (await api(`/api/public/media/${replacement.id}`)).status,
      200,
    );
    assert.equal(
      next.redirects['/projects/synthetic-a'],
      '/projects/synthetic-b',
    );
    const firstSnapshot = (
      await payload.find({
        collection: 'publication-snapshots',
        where: { revision: { equals: first.revision } },
        req,
        overrideAccess: false,
      })
    ).docs[0];
    const restored = await publish(payload, req, {
      ...input,
      expectedRevision: next.revision,
      action: 'restore',
      restoreSnapshotId: Number(firstSnapshot.id),
    });
    assert.equal(restored.content.projects[0].title, 'Public A');
    assert.equal((await api(`/api/public/media/${media.id}`)).status, 200);
    assert.equal(
      (await api(`/api/public/media/${replacement.id}`)).status,
      404,
    );
    assert.notEqual(restored.revision, first.revision);
    const races = await Promise.allSettled([
      publish(payload, req, { ...input, expectedRevision: restored.revision }),
      publish(payload, req, { ...input, expectedRevision: restored.revision }),
    ]);
    assert.equal(
      races.filter((x) => x.status === 'fulfilled').length,
      1,
      'Concurrent stale publisher must lose',
    );
    const current = await currentPublication(payload);
    const revoked = await publish(payload, req, {
      ...input,
      expectedRevision: current!.revision,
      action: 'revoke',
    });
    assert.deepEqual(revoked.content, {});
    assert.deepEqual(revoked.media, []);
    assert.equal(revoked.design, null);
    assert.equal(
      (await api(`/api/public/media/${media.id}`)).status,
      404,
      'Unpublish immediately revokes public media',
    );
    assert.ok((await api(rawFileURL)).status >= 400);
    const restoredDraft = await payload.restoreVersion({
      collection: 'projects',
      id: selections.find((x) => x.collection === 'projects')!.versionId,
      req,
      overrideAccess: false,
    });
    assert.equal(restoredDraft.title, 'Public A');
    assert.deepEqual(
      (await currentPublication(payload))?.content,
      {},
      'Content restore does not republish',
    );
    assert.equal(
      (await api('/api/owners/logout', 'POST', {}, token)).status,
      200,
    );
    assert.ok(
      (await api('/api/projects', 'GET', undefined, token)).status >= 400,
      'Logged-out session token is denied',
    );
    const loginAgain = await (
      await api('/api/owners/login', 'POST', { email, password })
    ).json();
    token = loginAgain.token;
    const recoveryFilesBefore = new Set(
      await readdir('tmp/phase3-recovery').catch(() => []),
    );
    const knownRecovery = await api('/api/owners/forgot-password', 'POST', {
      email,
    });
    const unknownRecovery = await api('/api/owners/forgot-password', 'POST', {
      email: 'missing@example.invalid',
    });
    assert.equal(knownRecovery.status, unknownRecovery.status);
    const recoveryBody = await knownRecovery.text();
    assert.ok(!/token|passwordReset/i.test(recoveryBody));
    const spool = (await readdir('tmp/phase3-recovery')).filter(
      (name) => !recoveryFilesBefore.has(name),
    );
    const messages = await Promise.all(
      spool.map(async (name) => ({
        name,
        text: await readFile(`tmp/phase3-recovery/${name}`, 'utf8'),
      })),
    );
    const message = messages.findLast((x) => x.text.includes(email));
    assert.ok(message);
    const resetToken = message.text.match(
      /(?:token=|reset\/)([a-f0-9]{40})/,
    )?.[1];
    assert.ok(resetToken, 'Private recovery adapter received reset token');
    const reset = await api('/api/owners/reset-password', 'POST', {
      token: resetToken,
      password: `${password}-reset`,
    });
    assert.equal(reset.status, 200);
    assert.ok(
      (await api('/api/projects', 'GET', undefined, token)).status >= 400,
      'Password recovery revokes earlier sessions',
    );
    assert.ok(
      (
        await api('/api/owners/reset-password', 'POST', {
          token: resetToken,
          password,
        })
      ).status >= 400,
      'Reset token cannot be reused',
    );
    assert.ok(
      (await api('/api/owners/login', 'POST', { email, password })).status >=
        400,
      'Old password no longer works',
    );
    const changed = await api('/api/owners/login', 'POST', {
      email,
      password: `${password}-reset`,
    });
    assert.equal(changed.status, 200);
    assert.equal(
      (
        await api(
          `/api/owners/${owner.id}`,
          'PATCH',
          { password: 'weak' },
          (await changed.clone().json()).token,
        )
      ).status,
      400,
    );
    const expired = await payload.forgotPassword({
      collection: 'owners',
      data: { email },
      expiration: -1,
      disableEmail: true,
    });
    assert.equal(
      (
        await api('/api/owners/reset-password', 'POST', {
          token: expired,
          password: `${password}-reset-again`,
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await api('/api/owners/reset-password', 'POST', {
          token: 'invalid-token',
          password: `${password}-reset-again`,
        })
      ).status,
      403,
    );
    process.env.LOCAL_RECOVERY_SPOOL = '0';
    assert.equal(
      (await api('/api/owners/forgot-password', 'POST', { email })).status,
      503,
    );
    assert.equal(
      (
        await api('/api/owners/forgot-password', 'POST', {
          email: 'missing@example.invalid',
        })
      ).status,
      503,
    );
    process.env.LOCAL_RECOVERY_SPOOL = '1';
    await writeFile('tmp/phase3-recovery-block', 'test availability failure');
    process.env.RECOVERY_SPOOL_DIRECTORY = 'tmp/phase3-recovery-block';
    assert.equal(
      (await api('/api/owners/forgot-password', 'POST', { email })).status,
      503,
    );
    assert.equal(
      (
        await api('/api/owners/forgot-password', 'POST', {
          email: 'missing@example.invalid',
        })
      ).status,
      503,
    );
    delete process.env.RECOVERY_SPOOL_DIRECTORY;
    await writeFile(
      'tmp/phase3-http-fixture.json',
      JSON.stringify({ email, password: `${password}-reset` }),
      { mode: 0o600 },
    );
  },
);
