import type { Payload, PayloadRequest } from 'payload';
import { requireOwner } from '../cms/access';
import { descriptors, OwnerError, readRecord, revision } from './service';
import { recoveryFieldChanges } from './recovery-diff';
import { transaction } from './transaction';
import type { RecoveryFieldChange, OwnerRecord } from './contracts';

export type SkillMergeInput = {
  sourceId: string | number;
  targetId: string | number;
  apply?: boolean;
  expectedRevisions?: Record<string, string>;
  edgeFingerprint?: string;
};
export type SkillMergePlan = {
  sourceId: string | number;
  targetId: string | number;
  applied: boolean;
  expectedRevisions: Record<string, string>;
  edgeFingerprint: string;
  changes: {
    collection: string;
    id: string | number;
    title: string;
    action:
      | 'archive-source'
      | 'add-aliases'
      | 'repoint-association'
      | 'hide-duplicate'
      | 'preserve-visible-association';
    changedFields: RecoveryFieldChange[];
  }[];
};
type Data = Record<string, unknown>;
function id(value: unknown): string {
  return String(
    value && typeof value === 'object' && 'id' in value ? value.id : value,
  );
}
function semantic(data: Data) {
  const target = data.target as
    { relationTo?: unknown; value?: unknown } | undefined;
  return JSON.stringify([
    target?.relationTo,
    id(target?.value),
    data.targetRoleKey || '',
    data.kind || '',
  ]);
}
function mergeConflict(): never {
  throw new OwnerError(
    'Skills or their associations changed. Review a new merge plan before applying.',
    409,
    'conflict',
  );
}

export async function skillMerge(
  payload: Payload,
  req: PayloadRequest,
  input: SkillMergeInput,
): Promise<SkillMergePlan> {
  requireOwner(req);
  if (
    !input ||
    !/^[1-9]\d*$/.test(String(input.sourceId)) ||
    !/^[1-9]\d*$/.test(String(input.targetId)) ||
    String(input.sourceId) === String(input.targetId)
  )
    throw new OwnerError(
      'Choose two different existing skills.',
      400,
      'invalid',
    );
  return transaction(payload, req, 'skill-merge', async (tx) => {
    // Fixed tables only. This also serializes legacy Payload/admin writers that
    // do not participate in our advisory-lock protocol, including absent edges.
    const transactionID = await tx.transactionID;
    const adapter = payload.db as unknown as {
      sessions: Record<string, { db: unknown }>;
      execute: (args: { db: unknown; raw: string }) => Promise<unknown>;
    };
    const db = adapter.sessions[String(transactionID)].db;
    await adapter.execute({ db, raw: "SET LOCAL lock_timeout = '5s'" });
    await adapter.execute({
      db,
      raw: 'LOCK TABLE "skills", "_skills_v", "associations", "_associations_v" IN SHARE ROW EXCLUSIVE MODE',
    });
    const source = await readRecord(payload, tx, 'skills', input.sourceId);
    const target = await readRecord(payload, tx, 'skills', input.targetId);
    const found = await payload.find({
      collection: 'associations',
      where: {
        or: [
          { skill: { equals: source.id } },
          { skill: { equals: target.id } },
        ],
      },
      draft: true,
      pagination: false,
      depth: 0,
      overrideAccess: false,
      req: tx,
    });
    if (found.docs.length > 500)
      throw new OwnerError(
        'Review at most 500 affected associations in one merge.',
        400,
        'invalid',
      );
    const edges: OwnerRecord[] = [];
    for (const edge of found.docs)
      edges.push(await readRecord(payload, tx, 'associations', edge.id));
    edges.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const all: {
      collection: 'skills' | 'associations';
      record: OwnerRecord;
    }[] = [
      { collection: 'skills', record: source },
      { collection: 'skills', record: target },
      ...edges.map((record) => ({
        collection: 'associations' as const,
        record,
      })),
    ];
    const expectedRevisions = Object.fromEntries(
      all.map(({ collection, record }) => [
        `${collection}:${record.id}`,
        record.revision,
      ]),
    );
    const edgeFingerprint = revision(
      edges.map((edge) => ({ id: edge.id, revision: edge.revision })),
    );
    if (
      input.apply &&
      (input.edgeFingerprint !== edgeFingerprint ||
        JSON.stringify(Object.entries(input.expectedRevisions || {}).sort()) !==
          JSON.stringify(Object.entries(expectedRevisions).sort()))
    )
      mergeConflict();
    const plan: SkillMergePlan = {
      sourceId: source.id,
      targetId: target.id,
      applied: input.apply === true,
      expectedRevisions,
      edgeFingerprint,
      changes: [],
    };
    const updates: {
      collection: 'skills' | 'associations';
      record: OwnerRecord;
      patch: Data;
    }[] = [];
    const add = (
      collection: 'skills' | 'associations',
      record: OwnerRecord,
      patch: Data,
      action: SkillMergePlan['changes'][number]['action'],
    ) => {
      const changedFields = recoveryFieldChanges(
        record.data,
        { ...record.data, ...patch },
        descriptors(payload.collections[collection].config.fields),
      );
      if (!changedFields.length) return;
      plan.changes.push({
        collection,
        id: record.id,
        title: String(record.data.title || record.id),
        action,
        changedFields,
      });
      updates.push({ collection, record, patch });
    };
    const aliases = Array.isArray(target.data.aliases)
      ? (structuredClone(target.data.aliases) as {
          name: string;
          id?: string;
        }[])
      : [];
    const names = new Set(
      [target.data.canonicalName, ...aliases.map((alias) => alias.name)]
        .filter((value) => typeof value === 'string')
        .map((value) => String(value).trim().toLowerCase()),
    );
    for (const value of [
      source.data.canonicalName,
      ...(Array.isArray(source.data.aliases)
        ? source.data.aliases.map((alias) => alias.name)
        : []),
    ]) {
      if (
        typeof value !== 'string' ||
        !value.trim() ||
        names.has(value.trim().toLowerCase())
      )
        continue;
      aliases.push({ name: value });
      names.add(value.trim().toLowerCase());
    }
    add('skills', target, { aliases }, 'add-aliases');
    add('skills', source, { visible: false }, 'archive-source');
    const targetEdges = new Map(
      edges
        .filter((edge) => id(edge.data.skill) === String(target.id))
        .map((edge) => [semantic(edge.data), edge]),
    );
    for (const edge of edges.filter(
      (edge) => id(edge.data.skill) === String(source.id),
    )) {
      const duplicate = targetEdges.get(semantic(edge.data));
      if (duplicate) {
        // Merge eligibility as a union, preserving the existing target edge's
        // identity/context and the archived source edge's original relation.
        if (edge.data.visible === true && duplicate.data.visible !== true)
          add(
            'associations',
            duplicate,
            { visible: true },
            'preserve-visible-association',
          );
        add('associations', edge, { visible: false }, 'hide-duplicate');
      } else {
        add('associations', edge, { skill: target.id }, 'repoint-association');
        targetEdges.set(semantic(edge.data), edge);
      }
    }
    if (input.apply)
      for (const update of updates)
        await payload.update({
          collection: update.collection,
          id: update.record.id,
          data: update.patch as never,
          draft: true,
          depth: 0,
          overrideAccess: false,
          req: tx,
        });
    return plan;
  });
}
