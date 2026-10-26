import { createHash } from 'node:crypto';
import type { CollectionSlug, Payload, PayloadRequest } from 'payload';
import { requireOwner } from './access';
import { transaction, lock } from '../owner/transaction';
import { readRecord } from '../owner/service';
const allowed = new Set([
  'skills',
  'experiences',
  'education',
  'projects',
  'posts',
  'profile',
  'professional-sections',
  'associations',
  'context-links',
  'site-settings',
]);
export type ImportRecord = {
  key: string;
  collection: string;
  data: Record<string, unknown>;
};
export type ContentImport = {
  format: 'desan-reviewed-content';
  approval: string;
  records: ImportRecord[];
};
export function validateContentImport(input: unknown): ContentImport {
  const value = input as ContentImport;
  if (
    !value ||
    value.format !== 'desan-reviewed-content' ||
    typeof value.approval !== 'string' ||
    !value.approval.trim() ||
    !Array.isArray(value.records) ||
    value.records.length > 500
  )
    throw Error(
      'A reviewed content manifest of at most 500 records is required',
    );
  const seen = new Set<string>();
  for (const row of value.records) {
    if (
      !row ||
      !/^[a-z0-9][a-z0-9:._-]{0,180}$/.test(row.key) ||
      seen.has(row.key) ||
      !allowed.has(row.collection) ||
      !row.data ||
      typeof row.data !== 'object' ||
      Array.isArray(row.data)
    )
      throw Error('Invalid or duplicate import record');
    if (
      ['id', '_status', 'createdAt', 'updatedAt', 'password'].some((key) =>
        Object.hasOwn(row.data, key),
      )
    )
      throw Error('Import cannot set system fields');
    seen.add(row.key);
  }
  return value;
}
function resolveReferences(
  value: unknown,
  ids: Map<string, string | number>,
): unknown {
  if (Array.isArray(value))
    return value.map((item) => resolveReferences(item, ids));
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    if (Object.hasOwn(object, '$ref')) {
      const id = ids.get(String(object.$ref));
      if (!id || Object.keys(object).length !== 1)
        throw Error('References must point to an earlier imported record');
      return id;
    }
    return Object.fromEntries(
      Object.entries(object).map(([key, item]) => [
        key,
        resolveReferences(item, ids),
      ]),
    );
  }
  return value;
}
/** Atomic create-only import: a repeated source key preserves subsequent owner edits. */
export async function importReviewedContent(
  payload: Payload,
  req: PayloadRequest,
  raw: unknown,
  apply = false,
) {
  requireOwner(req);
  const input = validateContentImport(raw);
  const digest = createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex');
  return transaction(payload, req, 'reviewed-content-import', async (tx) => {
    const ids = new Map<string, string | number>();
    const result = [];
    for (const row of input.records) {
      const collection = row.collection as CollectionSlug;
      await lock(payload, tx, `import:${collection}:${row.key}`);
      const found = await payload.find({
        collection,
        where: { sourceKey: { equals: row.key } },
        draft: true,
        limit: 2,
        depth: 0,
        overrideAccess: false,
        req: tx,
      });
      if (found.docs.length > 1)
        throw Error(
          'Duplicate existing source reference; reconcile before importing',
        );
      let existing = found.docs[0];
      const created = !existing;
      if (created && apply) {
        const data = resolveReferences(row.data, ids) as Record<
          string,
          unknown
        >;
        existing = await payload.create({
          collection,
          data: { ...data, sourceKey: row.key } as never,
          draft: true,
          depth: 0,
          overrideAccess: false,
          req: tx,
        });
      }
      if (existing) {
        ids.set(row.key, existing.id);
        const record = await readRecord(payload, tx, collection, existing.id);
        result.push({
          key: row.key,
          collection,
          id: record.id,
          versionId: record.versionId,
          action: created ? 'created' : 'preserved',
        });
      } else result.push({ key: row.key, collection, action: 'would-create' });
    }
    return {
      digest,
      applied: apply,
      approval: input.approval,
      records: result,
    };
  });
}
