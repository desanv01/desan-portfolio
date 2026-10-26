import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

test(
  'owner HTTP atomic drafts, restore, exact previews, durable schedules and recovery',
  { timeout: 180000 },
  async (t) => {
    assert.ok(process.env.TEST_DATABASE_URI);
    assert.match(new URL(process.env.TEST_DATABASE_URI).pathname, /_test$/);
    process.env.DATABASE_URI = process.env.TEST_DATABASE_URI;
    const { getPayload, createLocalReq, handleEndpoints } =
      await import('payload');
    const { default: config } = await import('../src/cms/config');
    const { bootstrapCapability } = await import('../src/cms/access');
    const { createEmptyDesign } = await import('../src/design/model');
    const { ownerHTTP } = await import('../src/owner/http');
    const { processSchedules, createPreview, workerHeartbeat } =
      await import('../src/owner/service');
    const { publish, currentPublication } =
      await import('../src/cms/publication');
    const payload = await getPayload({ config });
    t.after(async () => {
      await payload.destroy();
    });
    await payload.db.migrateFresh({ forceAcceptWarning: true });
    let base = '';
    const server = createServer(async (incoming, outgoing) => {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of incoming) chunks.push(Buffer.from(chunk));
        const method = incoming.method || 'GET';
        const request = new Request(`${base}${incoming.url}`, {
          method,
          headers: incoming.headers as HeadersInit,
          ...(method === 'GET' ? {} : { body: Buffer.concat(chunks) }),
        });
        const path = new URL(request.url).pathname;
        const response = path.startsWith('/api/owner/')
          ? await ownerHTTP(
              request,
              path.slice('/api/owner/'.length).split('/'),
            )
          : await handleEndpoints({ config, request });
        outgoing.writeHead(
          response.status,
          Object.fromEntries(response.headers),
        );
        outgoing.end(Buffer.from(await response.arrayBuffer()));
      } catch {
        outgoing.writeHead(500);
        outgoing.end('Test adapter failure');
      }
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    base = `http://127.0.0.1:${address.port}`;
    process.env.CMS_SERVER_URL = base;
    payload.config.csrf.push(base);
    t.after(async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });
    let cookie = '';
    const api = (
      path: string,
      method = 'GET',
      data?: unknown,
      auth = true,
      origin = base,
    ) =>
      fetch(`${base}/api${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Origin: origin,
          ...(auth ? { Cookie: cookie } : {}),
        },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
      });
    const email = 'owner-workspace-test@example.invalid',
      password = `Test-only-${randomUUID()}!`;
    const owner = await payload.create({
      collection: 'owners',
      data: { email, password, role: 'owner', singleton: 1 },
      context: { bootstrap: bootstrapCapability },
      overrideAccess: true,
    });
    const login = await api(
      '/owners/login',
      'POST',
      { email, password },
      false,
    );
    assert.equal(login.status, 200);
    cookie = login.headers.get('set-cookie')!.split(';')[0];
    const req = await createLocalReq(
      { user: { ...owner, collection: 'owners' } },
      payload,
    );
    assert.equal(
      (await api('/owner/workspace', 'GET', undefined, false)).status,
      401,
    );
    assert.equal(
      (
        await api(
          '/owner/records/skills',
          'POST',
          { data: {} },
          true,
          'https://invalid.example',
        )
      ).status,
      403,
    );
    assert.equal((await api('/owner/records/owners')).status, 404);
    assert.equal((await api('/owner-state')).status, 403);
    assert.equal(
      (
        await api('/owner-state', 'POST', {
          key: 'bypass',
          kind: 'preview',
          value: {},
        })
      ).status,
      403,
    );
    const workspace = await (await api('/owner/workspace')).json();
    assert.equal(workspace.scheduler.running, false);
    await workerHeartbeat(payload, req);
    assert.equal(
      (await (await api('/owner/workspace')).json()).scheduler.running,
      true,
    );
    await workerHeartbeat(payload, req, true);
    assert.equal(
      (await (await api('/owner/workspace')).json()).scheduler.running,
      false,
    );
    const professionalKind = workspace.collections
      .find((c: { slug: string }) => c.slug === 'professional-sections')
      .fields.find((f: { name: string }) => f.name === 'kind');
    assert.equal(professionalKind.options.length, 14);
    assert.ok(
      workspace.collections
        .find((c: { slug: string }) => c.slug === 'posts')
        .fields.find((f: { name: string }) => f.name === 'kind'),
    );
    assert.ok(
      !workspace.collections
        .find((c: { slug: string }) => c.slug === 'media')
        .fields.find((f: { name: string }) => f.name === 'kind'),
    );
    const skillResponse = await api('/owner/records/skills', 'POST', {
      data: {
        sourceKey: 'owner-test',
        title: 'Selected A',
        canonicalName: 'Synthetic',
        slug: 'owner-test',
        visible: true,
        privateNotes: 'PRIVATE-OWNER-CANARY',
      },
    });
    assert.equal(skillResponse.status, 201, await skillResponse.clone().text());
    const skill = await skillResponse.json();
    assert.ok(skill.versionId && skill.revision);
    const originalVersion = skill.versionId;
    const saves = await Promise.all(
      ['Concurrent B', 'Concurrent C'].map((title) =>
        api(`/owner/records/skills/${skill.id}`, 'PATCH', {
          expectedRevision: skill.revision,
          data: { title },
        }),
      ),
    );
    assert.deepEqual(saves.map((r) => r.status).sort(), [200, 409]);
    const winner = await saves.find((r) => r.status === 200)!.json();
    assert.notEqual(winner.revision, skill.revision);
    assert.equal(
      (
        await api(`/owner/records/skills/${skill.id}`, 'PATCH', {
          expectedRevision: winner.revision,
          data: { id: 19 },
        })
      ).status,
      400,
    );
    const restoredResponse = await api(
      `/owner/records/skills/${skill.id}/restore`,
      'POST',
      { expectedRevision: winner.revision, versionId: originalVersion },
    );
    assert.equal(
      restoredResponse.status,
      200,
      await restoredResponse.clone().text(),
    );
    const restored = await restoredResponse.json();
    assert.equal(restored.data.title, 'Selected A');
    assert.notEqual(restored.versionId, originalVersion);
    const otherResponse = await api('/owner/records/skills', 'POST', {
      data: {
        sourceKey: 'other-test',
        title: 'Other',
        canonicalName: 'Other',
        slug: 'other-test',
        visible: true,
      },
    });
    const other = await otherResponse.json();
    assert.equal(
      (
        await api(`/owner/records/skills/${skill.id}/restore`, 'POST', {
          expectedRevision: restored.revision,
          versionId: other.versionId,
        })
      ).status,
      400,
    );
    const designResponse = await api('/owner/records/design-themes', 'POST', {
      data: {
        title: 'Synthetic design',
        schemaVersion: 1,
        data: createEmptyDesign('owner-test'),
      },
    });
    assert.equal(
      designResponse.status,
      201,
      await designResponse.clone().text(),
    );
    const design = await designResponse.json();
    const input = {
      expectedRevision: null,
      designVersionId: design.versionId,
      selections: [{ collection: 'skills', versionId: originalVersion }],
    };
    const previewResponse = await api('/owner/previews', 'POST', { input });
    if (previewResponse.status !== 201)
      await createPreview(payload, req, input);
    assert.equal(
      previewResponse.status,
      201,
      await previewResponse.clone().text(),
    );
    const preview = await previewResponse.json();
    assert.equal(preview.publication.content.skills[0].title, 'Selected A');
    assert.ok(
      !JSON.stringify(preview.publication).includes('PRIVATE-OWNER-CANARY'),
    );
    assert.equal(
      (await api(`/owner/previews/${preview.id}`, 'GET', undefined, false))
        .status,
      401,
    );
    assert.equal(
      (await api(`/owner/previews/${preview.id}/media/99999`)).status,
      404,
    );
    const image = await sharp({
      create: { width: 2, height: 2, channels: 3, background: '#f00' },
    })
      .png()
      .toBuffer();
    const form = new FormData();
    form.set('file', new File([image], 'synthetic.png', { type: 'image/png' }));
    form.set(
      '_payload',
      JSON.stringify({
        alt: 'Synthetic',
        credit: 'Test',
        license: 'CC0',
        publicEligible: true,
      }),
    );
    const uploadResponse = await fetch(`${base}/api/owner/media`, {
      method: 'POST',
      headers: { Origin: base, Cookie: cookie },
      body: form,
    });
    assert.equal(
      uploadResponse.status,
      201,
      await uploadResponse.clone().text(),
    );
    const { doc: media } = await uploadResponse.json();
    const fontForm = new FormData();
    fontForm.set(
      'file',
      new File(
        [await readFile('tests/fixtures/abeezee-latin-400-normal.woff2')],
        'abeezee-latin-400-normal.woff2',
        { type: 'font/woff2' },
      ),
    );
    fontForm.set(
      '_payload',
      JSON.stringify({
        alt: 'Synthetic ABeeZee Studio',
        license: 'OFL-1.1',
        credit: 'ABeeZee authors; SIL Open Font License in tests/fixtures',
        publicEligible: true,
      }),
    );
    const fontResponse = await fetch(`${base}/api/owner/media`, {
      method: 'POST',
      headers: { Origin: base, Cookie: cookie },
      body: fontForm,
    });
    assert.equal(fontResponse.status, 201, await fontResponse.clone().text());
    assert.equal((await fontResponse.json()).doc.kind, 'font');
    for (const declared of ['', 'application/octet-stream', 'image/png']) {
      const mimeForm = new FormData();
      mimeForm.set(
        'file',
        new File(
          [await readFile('tests/fixtures/abeezee-latin-400-normal.woff2')],
          'untrusted-extension.bin',
          { type: declared },
        ),
      );
      mimeForm.set(
        '_payload',
        JSON.stringify({
          alt: 'Synthetic browser MIME regression',
          license: 'OFL-1.1',
          credit: 'ABeeZee authors',
          publicEligible: true,
        }),
      );
      const result = await fetch(`${base}/api/owner/media`, {
        method: 'POST',
        headers: { Origin: base, Cookie: cookie },
        body: mimeForm,
      });
      assert.equal(
        result.status,
        declared === 'image/png' ? 400 : 201,
        await result.clone().text(),
      );
      if (result.status === 201)
        assert.equal((await result.json()).doc.kind, 'font');
    }
    const bytes = await api(`/owner/media/${media.id}`);
    assert.equal(bytes.status, 200);
    assert.equal(bytes.headers.get('cache-control'), 'private, no-store');
    assert.equal(
      (await api(`/owner/media/${media.id}`, 'GET', undefined, false)).status,
      401,
    );
    // Cancel/retry preserves exact selection and publication precondition.
    const createSchedule = async () => {
      const response = await api('/owner/schedules', 'POST', {
        runAt: '2020-01-01T00:00:00Z',
        input,
      });
      assert.equal(response.status, 201, await response.clone().text());
      return response.json();
    };
    const cancelled = await createSchedule();
    const cancelResponse = await api(
      `/owner/schedules/${cancelled.id}/cancel`,
      'POST',
      { expectedRevision: cancelled.revision },
    );
    assert.equal(cancelResponse.status, 200);
    assert.equal(
      (
        await api(`/owner/schedules/${cancelled.id}/retry`, 'POST', {
          expectedRevision: cancelled.revision,
        })
      ).status,
      409,
    );
    assert.deepEqual(await processSchedules(payload, req), []);
    const retry = await api(`/owner/schedules/${cancelled.id}/retry`, 'POST', {
      expectedRevision: (await cancelResponse.json()).revision,
    });
    assert.equal(retry.status, 200);
    // Two processes race to claim the same job. Only one publication is created.
    const runs = await Promise.all([
      processSchedules(payload, req),
      processSchedules(payload, req),
    ]);
    assert.equal(runs.flat().filter((s) => s.status === 'completed').length, 1);
    const firstLive = await currentPublication(payload);
    assert.ok(firstLive);
    assert.equal(firstLive.content.skills[0].title, 'Selected A');
    assert.deepEqual(await processSchedules(payload, req), []);
    const staleJob = await createSchedule();
    const stale = await processSchedules(payload, req);
    assert.equal(stale[0].status, 'conflict');
    assert.equal(
      (await currentPublication(payload))?.revision,
      firstLive.revision,
    );
    // Inject crash after publication snapshot/pointer writes: outer rollback must
    // undo publication and retain a failed job that can be safely retried.
    const nextInput = { ...input, expectedRevision: firstLive.revision };
    const crashResponse = await api('/owner/schedules', 'POST', {
      runAt: '2020-01-01',
      input: nextInput,
    });
    assert.equal(crashResponse.status, 201);
    const crashJob = await crashResponse.json();
    const update = payload.update.bind(payload);
    payload.update = (async (args: Parameters<typeof payload.update>[0]) => {
      if (
        args.collection === 'owner-state' &&
        (args.data as { status?: string }).status === 'completed'
      )
        throw new Error('Injected process failure');
      return update(args);
    }) as typeof payload.update;
    try {
      assert.equal((await processSchedules(payload, req))[0].status, 'failed');
    } finally {
      payload.update = update;
    }
    assert.equal(
      (await currentPublication(payload))?.revision,
      firstLive.revision,
    );
    const states = await (await api('/owner/schedules')).json();
    const failed = states.docs.find(
      (s: { id: string }) => s.id === crashJob.id,
    );
    const retried = await api(`/owner/schedules/${failed.id}/retry`, 'POST', {
      expectedRevision: failed.revision,
    });
    assert.equal(retried.status, 200);
    // Manual publication and job compete for same live revision: one wins.
    const race = await Promise.allSettled([
      publish(payload, req, nextInput),
      processSchedules(payload, req),
    ]);
    assert.ok(race.some((r) => r.status === 'fulfilled'));
    const latestLive = await currentPublication(payload);
    assert.notEqual(latestLive?.revision, firstLive.revision);
    const snapshots = await payload.count({
      collection: 'publication-snapshots',
      overrideAccess: true,
    });
    assert.equal(snapshots.totalDocs, 2);
    assert.equal(
      (
        await api(`/owner/schedules/${staleJob.id}/cancel`, 'POST', {
          expectedRevision: stale[0].revision,
        })
      ).status,
      200,
    );
    const history = await (
      await api(`/owner/records/skills/${skill.id}/versions`)
    ).json();
    assert.ok(history.docs.length >= 3);
    const exportedResponse = await api('/owner/export');
    assert.equal(exportedResponse.status, 200);
    assert.equal(
      exportedResponse.headers.get('cache-control'),
      'private, no-store',
    );
    const exported = await exportedResponse.json();
    assert.ok(exported.collections.skills.versions.length >= 3);
    assert.equal(exported.snapshots.length, 2);
    assert.ok(exported.schedules.length >= 3);
    assert.ok(!JSON.stringify(exported).includes(password));
    assert.ok(!('owners' in exported.collections));
    const publicationList = await (await api('/owner/publications')).json();
    assert.equal(publicationList.docs.length, 2);
    assert.ok(publicationList.docs[0].current);
    const recoveryBundle = {
      ...exported,
      collections: { skills: { docs: exported.collections.skills.docs } },
    };
    recoveryBundle.collections.skills.docs[0].title = 'Recovery draft';
    const planResponse = await api('/owner/import', 'POST', {
      bundle: recoveryBundle,
    });
    assert.equal(planResponse.status, 200, await planResponse.clone().text());
    const plan = await planResponse.json();
    assert.equal(plan.applied, false);
    assert.equal(plan.changes.length, 1);
    assert.equal(
      (
        await api('/owner/import', 'POST', {
          bundle: recoveryBundle,
          apply: true,
          expectedRevisions: {},
        })
      ).status,
      409,
    );
    const applyResponse = await api('/owner/import', 'POST', {
      bundle: recoveryBundle,
      apply: true,
      expectedRevisions: plan.expectedRevisions,
    });
    assert.equal(applyResponse.status, 200, await applyResponse.clone().text());
    assert.equal((await applyResponse.json()).applied, true);
    assert.equal(
      (await currentPublication(payload))?.revision,
      latestLive?.revision,
    );
    assert.equal(
      (
        await api('/owner/import', 'POST', {
          bundle: { ...recoveryBundle, instanceId: 'different' },
        })
      ).status,
      400,
    );
    // Invalid second record must roll back the first draft update too.
    const invalidBundle = structuredClone(recoveryBundle);
    invalidBundle.collections.skills.docs[0].title = 'Must roll back';
    invalidBundle.collections.skills.docs[1].slug = 'INVALID SLUG';
    const invalidPlan = await (
      await api('/owner/import', 'POST', { bundle: invalidBundle })
    ).json();
    assert.ok(
      (
        await api('/owner/import', 'POST', {
          bundle: invalidBundle,
          apply: true,
          expectedRevisions: invalidPlan.expectedRevisions,
        })
      ).status >= 400,
    );
    const afterFailedImport = await (
      await api(
        `/owner/records/skills/${invalidBundle.collections.skills.docs[0].id}`,
      )
    ).json();
    assert.equal(afterFailedImport.data.title, 'Recovery draft');
    // Skill merge preserves canonical evidence and never changes a publication.
    const make = async (collection: string, data: Record<string, unknown>) => {
      const response = await api(`/owner/records/${collection}`, 'POST', {
        data,
      });
      assert.equal(response.status, 201, await response.clone().text());
      return response.json();
    };
    const mergeSource = await make('skills', {
      sourceKey: 'merge-source',
      title: 'Merge Source',
      canonicalName: 'Merge Source',
      slug: 'merge-source',
      visible: true,
      aliases: [{ name: 'Earlier alias' }],
    });
    const mergeTarget = await make('skills', {
      sourceKey: 'merge-target',
      title: 'Merge Target',
      canonicalName: 'Merge Target',
      slug: 'merge-target',
      visible: true,
      aliases: [{ name: 'Existing alias' }],
    });
    const mergeProject = await make('projects', {
      sourceKey: 'merge-project',
      title: 'Merge project',
      slug: 'merge-project',
      visible: true,
    });
    const edge = (
      skill: number,
      key: string,
      kind: string,
      visible = true,
      context = 'Original source context',
    ) =>
      make('associations', {
        sourceKey: key,
        title: key,
        slug: key,
        visible,
        skill,
        target: { relationTo: 'projects', value: mergeProject.id },
        kind,
        context,
      });
    const duplicate = await edge(
      mergeSource.id,
      'merge-source-duplicate',
      'same-evidence',
    );
    const hiddenTargetEdge = await edge(
      mergeTarget.id,
      'merge-target-existing',
      'same-evidence',
      false,
      'Original target context',
    );
    const unique = await edge(
      mergeSource.id,
      'merge-source-unique',
      'distinct-evidence',
    );
    const mergeInput = { sourceId: mergeSource.id, targetId: mergeTarget.id };
    assert.equal(
      (await api('/owner/skills/merge', 'POST', mergeInput, false)).status,
      401,
    );
    assert.equal(
      (
        await api(
          '/owner/skills/merge',
          'POST',
          mergeInput,
          true,
          'https://invalid.example',
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await api('/owner/skills/merge', 'POST', {
          sourceId: mergeSource.id,
          targetId: mergeSource.id,
        })
      ).status,
      400,
    );
    const getPlan = async () => {
      const response = await api('/owner/skills/merge', 'POST', mergeInput);
      assert.equal(response.status, 200, await response.clone().text());
      return response.json();
    };
    const firstPlan = await getPlan();
    assert.equal(firstPlan.applied, false);
    assert.equal(firstPlan.sourceId, mergeSource.id);
    assert.equal(firstPlan.targetId, mergeTarget.id);
    assert.ok(
      firstPlan.changes.some(
        (change: {
          id: string | number;
          action: string;
          changedFields: { path: string; before: string; after: string }[];
        }) =>
          change.id === hiddenTargetEdge.id &&
          change.action === 'preserve-visible-association' &&
          change.changedFields.some(
            (field) =>
              field.path === 'visible' &&
              field.before === 'No' &&
              field.after === 'Yes',
          ),
      ),
    );
    assert.equal(
      firstPlan.changes.filter(
        (change: { action: string }) => change.action === 'hide-duplicate',
      ).length,
      1,
    );
    assert.ok(
      firstPlan.changes.every(
        (change: { changedFields: unknown[] }) => change.changedFields.length,
      ),
    );
    const newcomer = await edge(
      mergeSource.id,
      'merge-new-after-review',
      'new-evidence',
    );
    assert.equal(
      (await api('/owner/skills/merge', 'POST', { ...firstPlan, apply: true }))
        .status,
      409,
      'New edges invalidate a reviewed merge',
    );
    const secondPlan = await getPlan();
    const changed = await api(
      `/owner/records/associations/${newcomer.id}`,
      'PATCH',
      {
        expectedRevision: newcomer.revision,
        data: { context: 'Changed after review' },
      },
    );
    assert.equal(changed.status, 200);
    assert.equal(
      (await api('/owner/skills/merge', 'POST', { ...secondPlan, apply: true }))
        .status,
      409,
      'Changed edges invalidate a reviewed merge',
    );
    const racePlan = await getPlan();
    const raceResponses = await Promise.all([
      api('/owner/skills/merge', 'POST', { ...racePlan, apply: true }),
      api(`/owner/records/associations/${unique.id}`, 'PATCH', {
        expectedRevision: unique.revision,
        data: { context: 'Concurrent edit' },
      }),
    ]);
    assert.deepEqual(
      raceResponses.map((response) => response.status).sort(),
      [200, 409],
    );
    if (raceResponses[0].status === 409) {
      const currentPlan = await getPlan();
      const applyMerge = await api('/owner/skills/merge', 'POST', {
        ...currentPlan,
        apply: true,
      });
      assert.equal(applyMerge.status, 200, await applyMerge.clone().text());
    }
    const sourceAfter = await (
      await api(`/owner/records/skills/${mergeSource.id}`)
    ).json();
    assert.equal(sourceAfter.data.visible, false);
    const targetAfter = await (
      await api(`/owner/records/skills/${mergeTarget.id}`)
    ).json();
    assert.equal(targetAfter.data.canonicalName, 'Merge Target');
    assert.deepEqual(
      targetAfter.data.aliases.map((alias: { name: string }) => alias.name),
      ['Existing alias', 'Merge Source', 'Earlier alias'],
    );
    const duplicateAfter = await (
      await api(`/owner/records/associations/${duplicate.id}`)
    ).json();
    assert.equal(duplicateAfter.data.visible, false);
    assert.equal(duplicateAfter.data.skill, mergeSource.id);
    assert.equal(duplicateAfter.data.context, 'Original source context');
    const retainedTargetEdge = await (
      await api(`/owner/records/associations/${hiddenTargetEdge.id}`)
    ).json();
    assert.equal(
      retainedTargetEdge.data.visible,
      true,
      'Visible source evidence must survive an equivalent hidden target edge',
    );
    assert.equal(retainedTargetEdge.data.skill, mergeTarget.id);
    assert.equal(retainedTargetEdge.data.context, 'Original target context');
    t.diagnostic(
      'MERGE_VISIBILITY_UNION_VERIFIED: hidden target + visible source retained an eligible target edge',
    );
    const uniqueAfter = await (
      await api(`/owner/records/associations/${unique.id}`)
    ).json();
    assert.equal(uniqueAfter.data.skill, mergeTarget.id);
    assert.equal(uniqueAfter.data.visible, true);
    assert.equal(
      (await currentPublication(payload))?.revision,
      latestLive?.revision,
    );
    await api('/owners/logout', 'POST', {});
    assert.equal((await api('/owner/workspace')).status, 401);
  },
);
