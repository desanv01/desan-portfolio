import { createHash, createHmac, randomUUID } from 'node:crypto';
import {
  APIError,
  type CollectionSlug,
  type Field,
  type Payload,
  type PayloadRequest,
} from 'payload';
import { requireOwner } from '../cms/access';
import {
  currentPublication,
  publish,
  resolveSelection,
  type Publication,
  type PublicationInput,
} from '../cms/publication';
import type {
  FieldDescriptor,
  OwnerRecord,
  Schedule,
  Workspace,
} from './contracts';
import { lock, transaction } from './transaction';
import { recoveryFieldChanges } from './recovery-diff';
import { mediaLimitBytes } from '../cms/media-storage';
import { ownerRequestLimitBytes } from './request-body';
import type { RecoveryPlan } from './contracts';

export const editableCollections = [
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
  'design-themes',
  'media',
] as const;
const internals = new Set([
  'id',
  'createdAt',
  'updatedAt',
  '_status',
  'edgeKey',
]);
const internalCollection = 'owner-state' as CollectionSlug;
type Data = Record<string, unknown>;
export class OwnerError extends APIError {
  code: string;
  constructor(message: string, status: number, code: string) {
    super(message, status);
    this.code = code;
  }
}
function conflict() {
  return new OwnerError(
    'This item changed. Reload before saving; your local edits are retained.',
    409,
    'conflict',
  );
}
export function collectionSlug(value: string): CollectionSlug {
  if (!(editableCollections as readonly string[]).includes(value))
    throw new OwnerError('Unknown editable collection', 404, 'not-found');
  return value as CollectionSlug;
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonical(v)]),
    );
  return value;
}
export function revision(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');
}
function label(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}
export function descriptors(fields: Field[]): FieldDescriptor[] {
  return fields.flatMap((field): FieldDescriptor[] => {
    if (field.type === 'tabs')
      return field.tabs.flatMap((tab) => descriptors(tab.fields));
    if (!('name' in field))
      return 'fields' in field ? descriptors(field.fields) : [];
    if (
      internals.has(field.name) ||
      field.name.startsWith('_') ||
      field.type === 'ui'
    )
      return [];
    const item: FieldDescriptor = {
      name: field.name,
      label: label(field.label, field.name),
      type: field.type,
      required: 'required' in field && field.required === true,
    };
    if (field.admin?.readOnly) item.readOnly = true;
    if ('fields' in field) item.fields = descriptors(field.fields);
    if ('options' in field && Array.isArray(field.options))
      item.options = field.options.map((option) =>
        typeof option === 'string'
          ? { label: option, value: option }
          : { label: label(option.label, option.value), value: option.value },
      );
    if ('relationTo' in field) item.relationTo = field.relationTo;
    if ('hasMany' in field) item.hasMany = field.hasMany;
    return [item];
  });
}
function schema(payload: Payload, collection: CollectionSlug) {
  const mediaDerived = new Set([
    'kind',
    'filename',
    'mimeType',
    'filesize',
    'width',
    'height',
    'url',
    'thumbnailURL',
    'sizes',
    'resourceVersion',
    'sha256',
  ]);
  return descriptors(payload.collections[collection].config.fields).filter(
    (f) => collection !== 'media' || !mediaDerived.has(f.name),
  );
}
function sanitize(data: unknown, fields: FieldDescriptor[]): Data {
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new OwnerError(
      'Expected an object of editable fields',
      400,
      'invalid',
    );
  const result: Data = {};
  for (const [key, value] of Object.entries(data)) {
    const field = fields.find((f) => f.name === key);
    if (key === 'schemaVersion' && field?.readOnly && value === 1) continue;
    if (!field || field.readOnly)
      throw new OwnerError(`Field is not editable: ${key}`, 400, 'invalid');
    if (field.fields && value !== null) {
      if (field.type === 'array') {
        if (!Array.isArray(value))
          throw new OwnerError(`Expected an array: ${key}`, 400, 'invalid');
        result[key] = value.map((row) => {
          // Payload array IDs identify existing rows, not collection records.
          const { id, ...rest } = row as Data;
          return {
            ...sanitize(rest, field.fields!),
            ...(typeof id === 'string' ? { id } : {}),
          };
        });
      } else result[key] = sanitize(value, field.fields);
    } else result[key] = value;
  }
  return result;
}
async function latestVersion(
  payload: Payload,
  req: PayloadRequest,
  collection: CollectionSlug,
  id: string | number,
) {
  if (!payload.collections[collection].config.versions) return null;
  const result = await payload.findVersions({
    collection,
    where: { parent: { equals: id } },
    sort: '-id',
    limit: 1,
    depth: 0,
    overrideAccess: false,
    req,
  });
  return result.docs[0] || null;
}
export async function readRecord(
  payload: Payload,
  req: PayloadRequest,
  collectionName: string,
  id: string | number,
): Promise<OwnerRecord> {
  requireOwner(req);
  const collection = collectionSlug(collectionName);
  const version = await latestVersion(payload, req, collection, id);
  // Return the exact version row's data and ID together. Separate latest-draft
  // and latest-version queries could pair A's fields with B's version during a
  // concurrent save, making a publication checkbox misrepresent its selection.
  const data = (version
    ? { ...version.version, id: version.parent }
    : await payload.findByID({
        collection,
        id,
        draft: true,
        depth: 0,
        overrideAccess: false,
        req,
      })) as unknown as Data & { id: string | number };
  return {
    id: data.id,
    data,
    revision: revision({ data, versionId: version?.id || null }),
    versionId: version ? Number(version.id) : null,
  };
}
export async function listRecords(
  payload: Payload,
  req: PayloadRequest,
  collectionName: string,
  page = 1,
  limit = 50,
) {
  requireOwner(req);
  const collection = collectionSlug(collectionName);
  const result = await payload.find({
    collection,
    draft: true,
    depth: 0,
    page,
    limit: Math.min(100, Math.max(1, limit)),
    sort: '-updatedAt',
    overrideAccess: false,
    req,
  });
  return {
    docs: await Promise.all(
      result.docs.map((doc) => readRecord(payload, req, collection, doc.id)),
    ),
    totalDocs: result.totalDocs,
    page: result.page || 1,
    totalPages: result.totalPages,
  };
}
export async function workspace(
  payload: Payload,
  req: PayloadRequest,
): Promise<Workspace> {
  requireOwner(req);
  const publication = await currentPublication(payload, req);
  const design = publication?.designVersionId
    ? await payload.findVersionByID({
        collection: 'design-themes',
        id: String(publication.designVersionId),
        depth: 0,
        overrideAccess: false,
        req,
      })
    : null;
  return {
    limits: {
      mediaBytes: mediaLimitBytes(),
      requestBytes: ownerRequestLimitBytes(),
    },
    collections: editableCollections.map((slug) => ({
      slug,
      label: label(payload.collections[slug].config.labels.plural, slug),
      fields: schema(payload, slug),
    })),
    publication: publication
      ? {
          revision: publication.revision,
          designVersionId: publication.designVersionId,
          designRecordId: design?.parent || undefined,
          designTitle: design?.version.title,
          selections: await Promise.all(
            publication.selections.map(async (selection) => {
              const saved = await payload.findVersionByID({
                collection: collectionSlug(selection.collection),
                id: String(selection.versionId),
                depth: 0,
                overrideAccess: false,
                req,
              });
              return {
                ...selection,
                recordId: saved.parent || undefined,
                title:
                  'title' in saved.version
                    ? String(saved.version.title)
                    : undefined,
              };
            }),
          ),
        }
      : null,
    scheduler: await schedulerStatus(payload, req),
  };
}
export async function saveRecord(
  payload: Payload,
  req: PayloadRequest,
  collectionName: string,
  data: unknown,
  id?: string | number,
  expectedRevision?: string,
): Promise<OwnerRecord> {
  requireOwner(req);
  const collection = collectionSlug(collectionName);
  if (collection === 'media' && !id)
    throw new OwnerError('Use the media upload endpoint', 400, 'invalid');
  const safe = sanitize(data, schema(payload, collection));
  return transaction(
    payload,
    req,
    `record:${collection}:${id || 'create'}`,
    async (tx) => {
      if (id) {
        const previous = await readRecord(payload, tx, collection, id);
        if (!expectedRevision || previous.revision !== expectedRevision)
          throw conflict();
        await payload.update({
          collection,
          id,
          data: safe as never,
          draft: collection !== 'media',
          depth: 0,
          overrideAccess: false,
          req: tx,
        });
        return readRecord(payload, tx, collection, id);
      }
      const created = await payload.create({
        collection,
        data: safe as never,
        draft: true,
        depth: 0,
        overrideAccess: false,
        req: tx,
      });
      return readRecord(payload, tx, collection, created.id);
    },
  );
}
export async function versions(
  payload: Payload,
  req: PayloadRequest,
  collectionName: string,
  id: string | number,
  page = 1,
) {
  requireOwner(req);
  const collection = collectionSlug(collectionName);
  if (!payload.collections[collection].config.versions)
    return { docs: [], totalDocs: 0, page: 1, totalPages: 0 };
  const result = await payload.findVersions({
    collection,
    where: { parent: { equals: id } },
    page,
    limit: 50,
    sort: '-id',
    depth: 0,
    overrideAccess: false,
    req,
  });
  return {
    docs: result.docs.map((v) => ({
      id: Number(v.id),
      createdAt: v.createdAt,
      data: v.version,
    })),
    totalDocs: result.totalDocs,
    page: result.page || 1,
    totalPages: result.totalPages,
  };
}
export async function restoreRecord(
  payload: Payload,
  req: PayloadRequest,
  collectionName: string,
  id: string | number,
  expectedRevision: string,
  versionId: number,
) {
  requireOwner(req);
  const collection = collectionSlug(collectionName);
  return transaction(payload, req, `record:${collection}:${id}`, async (tx) => {
    if (
      (await readRecord(payload, tx, collection, id)).revision !==
      expectedRevision
    )
      throw conflict();
    const selected = await payload.findVersionByID({
      collection,
      id: String(versionId),
      depth: 0,
      overrideAccess: false,
      req: tx,
    });
    if (String(selected.parent) !== String(id))
      throw new OwnerError(
        'Version does not belong to this record',
        400,
        'invalid',
      );
    // Restore only editable data as a new draft, never activate a publication.
    const fields = schema(payload, collection);
    const data = Object.fromEntries(
      Object.entries(selected.version).filter(([key]) =>
        fields.some((f) => f.name === key && !f.readOnly),
      ),
    );
    await payload.update({
      collection,
      id,
      data: sanitize(data, fields) as never,
      draft: true,
      depth: 0,
      overrideAccess: false,
      req: tx,
    });
    return readRecord(payload, tx, collection, id);
  });
}
export async function ownerPreview(
  payload: Payload,
  req: PayloadRequest,
  input: PublicationInput,
): Promise<Publication> {
  requireOwner(req);
  const resolved = await resolveSelection(payload, req, validateInput(input));
  return {
    ...resolved,
    revision: randomUUID(),
    redirects: {},
    media: resolved.media.map((media) => ({
      ...media,
      url: `/api/owner/media/${media.id}`,
    })),
  };
}
export function validateInput(value: unknown): PublicationInput {
  if (!value || typeof value !== 'object')
    throw new OwnerError(
      'Exact publication selection is required',
      400,
      'invalid',
    );
  const input = value as PublicationInput;
  if (
    !(
      input.expectedRevision === null ||
      typeof input.expectedRevision === 'string'
    ) ||
    !Number.isSafeInteger(input.designVersionId) ||
    !Array.isArray(input.selections) ||
    input.selections.length > 500 ||
    input.selections.some(
      (s) =>
        !s ||
        typeof s.collection !== 'string' ||
        !Number.isSafeInteger(s.versionId),
    ) ||
    (input.action !== undefined &&
      !['publish', 'restore', 'revoke'].includes(input.action))
  )
    throw new OwnerError('Invalid exact publication selection', 400, 'invalid');
  return JSON.parse(JSON.stringify(input)) as PublicationInput;
}
export async function createPreview(
  payload: Payload,
  req: PayloadRequest,
  input: PublicationInput,
) {
  const publication = await ownerPreview(payload, req, input);
  const key = randomUUID();
  publication.media = publication.media.map((m) => ({
    ...m,
    url: `/api/owner/previews/${key}/media/${m.id}`,
  }));
  await payload.create({
    collection: internalCollection,
    data: {
      key,
      kind: 'preview',
      status: 'ready',
      runAt: new Date().toISOString(),
      value: publication,
    } as never,
    overrideAccess: true,
    req,
  });
  return { id: key, publication };
}
async function stateByKey(
  payload: Payload,
  req: PayloadRequest,
  key: string,
  kind: string,
) {
  requireOwner(req);
  const result = await payload.find({
    collection: internalCollection,
    where: { and: [{ key: { equals: key } }, { kind: { equals: kind } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  });
  if (!result.docs[0]) throw new OwnerError('Item not found', 404, 'not-found');
  return result.docs[0] as unknown as Data & { id: number; value: Data };
}
export async function readPreview(
  payload: Payload,
  req: PayloadRequest,
  key: string,
) {
  const state = await stateByKey(payload, req, key, 'preview');
  return { id: key, publication: state.value as unknown as Publication };
}
function scheduleDTO(doc: Data): Schedule {
  return {
    ...(doc.value as unknown as Schedule),
    id: String(doc.key),
    status: doc.status as Schedule['status'],
    runAt: String(doc.runAt),
    revision: revision(doc),
  };
}
export async function listSchedules(
  payload: Payload,
  req: PayloadRequest,
  page = 1,
) {
  requireOwner(req);
  const result = await payload.find({
    collection: internalCollection,
    where: { kind: { equals: 'schedule' } },
    limit: 100,
    page,
    sort: '-createdAt',
    depth: 0,
    overrideAccess: true,
    req,
  });
  return {
    docs: result.docs.map((d) => scheduleDTO(d as unknown as Data)),
    totalDocs: result.totalDocs,
    page: result.page || 1,
    totalPages: result.totalPages,
    scheduler: await schedulerStatus(payload, req),
  };
}
const workerKey = '00000000-0000-4000-8000-000000000005';
export async function schedulerStatus(payload: Payload, req: PayloadRequest) {
  requireOwner(req);
  const result = await payload.find({
    collection: internalCollection,
    where: { key: { equals: workerKey } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  });
  const value = (
    result.docs[0] as unknown as {
      value?: { lastSeenAt?: string; stopped?: boolean };
    }
  )?.value;
  const lastSeenAt = value?.lastSeenAt || null;
  const managed = process.env.SCHEDULE_MODE === 'managed';
  return {
    mode: managed ? ('managed' as const) : ('local' as const),
    configured: managed
      ? !!process.env.JOBS_SECRET && process.env.JOBS_SECRET.length >= 32
      : !!lastSeenAt && !value?.stopped,
    lastActualDelivery: managed ? lastSeenAt : null,
    lastSeenAt,
    running:
      !!lastSeenAt &&
      !value?.stopped &&
      Date.now() - Date.parse(lastSeenAt) < (managed ? 180000 : 45000),
  };
}
export async function workerHeartbeat(
  payload: Payload,
  req: PayloadRequest,
  stopped = false,
) {
  requireOwner(req);
  return transaction(payload, req, 'worker-heartbeat', async (tx) => {
    const result = await payload.find({
      collection: internalCollection,
      where: { key: { equals: workerKey } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req: tx,
    });
    const data = {
      key: workerKey,
      kind: 'worker',
      status: 'ready',
      runAt: result.docs[0]
        ? (result.docs[0] as unknown as Data).runAt
        : new Date().toISOString(),
      value: { lastSeenAt: new Date().toISOString(), stopped },
    };
    if (result.docs[0])
      await payload.update({
        collection: internalCollection,
        id: result.docs[0].id,
        data: data as never,
        overrideAccess: true,
        req: tx,
      });
    else
      await payload.create({
        collection: internalCollection,
        data: data as never,
        overrideAccess: true,
        req: tx,
      });
  });
}
export async function publicationHistory(
  payload: Payload,
  req: PayloadRequest,
  page = 1,
) {
  requireOwner(req);
  const result = await payload.find({
    collection: 'publication-snapshots',
    limit: 50,
    page,
    sort: '-id',
    depth: 0,
    overrideAccess: false,
    req,
  });
  const current = await currentPublication(payload, req);
  return {
    docs: result.docs.map((doc) => {
      const value = doc.payload as unknown as Publication;
      return {
        id: doc.id,
        revision: doc.revision,
        publishedAt: value.publishedAt,
        designVersionId: value.designVersionId,
        selections: value.selections,
        current: value.revision === current?.revision,
      };
    }),
    totalDocs: result.totalDocs,
    page: result.page || 1,
    totalPages: result.totalPages,
    currentRevision: current?.revision || null,
  };
}
export async function createSchedule(
  payload: Payload,
  req: PayloadRequest,
  runAt: string,
  rawInput: PublicationInput,
) {
  requireOwner(req);
  const input = validateInput(rawInput);
  if (input.action && input.action !== 'publish')
    throw new OwnerError(
      'Schedules support exact selected publication only',
      400,
      'invalid',
    );
  const date = new Date(runAt);
  if (!Number.isFinite(date.getTime()))
    throw new OwnerError('A valid schedule time is required', 400, 'invalid');
  // Validate closure at creation; execution validates again (e.g. withdrawn rights).
  await resolveSelection(payload, req, input);
  const doc = await payload.create({
    collection: internalCollection,
    data: {
      key: randomUUID(),
      kind: 'schedule',
      status: 'pending',
      runAt: date.toISOString(),
      value: { input, attempts: 0, error: null },
    } as never,
    overrideAccess: true,
    req,
  });
  return scheduleDTO(doc as unknown as Data);
}
export async function changeSchedule(
  payload: Payload,
  req: PayloadRequest,
  key: string,
  action: 'cancel' | 'retry',
  expectedRevision: string,
) {
  requireOwner(req);
  return transaction(payload, req, `schedule:${key}`, async (tx) => {
    const doc = await stateByKey(payload, tx, key, 'schedule');
    if (revision(doc) !== expectedRevision) throw conflict();
    if (doc.status === 'completed')
      throw new OwnerError(
        'Completed publication cannot be cancelled or retried',
        409,
        'conflict',
      );
    if (
      action === 'retry' &&
      !['conflict', 'failed', 'cancelled'].includes(String(doc.status))
    )
      throw conflict();
    // Retrying retains pinned versions AND expected live revision. A changed
    // publication requires a newly reviewed schedule rather than silent rebasing.
    const updated = await payload.update({
      collection: internalCollection,
      id: doc.id,
      data: {
        status: action === 'cancel' ? 'cancelled' : 'pending',
        value: { ...doc.value, error: null },
      } as never,
      overrideAccess: true,
      req: tx,
    });
    return scheduleDTO(updated as unknown as Data);
  });
}
export async function processSchedules(
  payload: Payload,
  req: PayloadRequest,
  now = new Date(),
  options: { limit?: number; deadlineAt?: number } = {},
) {
  requireOwner(req);
  const due = await payload.find({
    collection: internalCollection,
    where: {
      and: [
        { kind: { equals: 'schedule' } },
        { status: { equals: 'pending' } },
        { runAt: { less_than_equal: now.toISOString() } },
      ],
    },
    limit: Math.min(100, Math.max(1, Math.floor(options.limit || 100))),
    sort: 'runAt',
    depth: 0,
    overrideAccess: true,
    req,
  });
  const results: Schedule[] = [];
  for (const item of due.docs) {
    if (options.deadlineAt && Date.now() >= options.deadlineAt) break;
    const key = String((item as unknown as Data).key);
    // Claim = held database transaction lock, with no committed processing state
    // to strand after a crash. Publication and completion commit together.
    try {
      const result = await transaction(
        payload,
        req,
        `schedule:${key}`,
        async (tx) => {
          const doc = await stateByKey(payload, tx, key, 'schedule');
          if (doc.status !== 'pending' || new Date(String(doc.runAt)) > now)
            return null;
          const input = doc.value.input as PublicationInput;
          const publication = await publish(payload, tx, input);
          const updated = await payload.update({
            collection: internalCollection,
            id: doc.id,
            data: {
              status: 'completed',
              value: {
                ...doc.value,
                attempts: Number(doc.value.attempts || 0) + 1,
                error: null,
                completedRevision: publication.revision,
              },
            } as never,
            overrideAccess: true,
            req: tx,
          });
          return scheduleDTO(updated as unknown as Data);
        },
      );
      if (result) results.push(result);
    } catch {
      // The failed publication transaction has rolled back completely. Recheck
      // under the same lock before recording failure (cancel/other worker wins).
      const result = await transaction(
        payload,
        req,
        `schedule:${key}`,
        async (tx) => {
          const doc = await stateByKey(payload, tx, key, 'schedule');
          if (doc.status !== 'pending') return null;
          const current = await currentPublication(payload, tx);
          const stale =
            (current?.revision || null) !==
            (doc.value.input as PublicationInput).expectedRevision;
          const updated = await payload.update({
            collection: internalCollection,
            id: doc.id,
            data: {
              status: stale ? 'conflict' : 'failed',
              value: {
                ...doc.value,
                attempts: Number(doc.value.attempts || 0) + 1,
                error: stale
                  ? 'Live publication changed; create a reviewed replacement schedule.'
                  : 'Selection could not be published. Review selected records and resource rights before retrying.',
              },
            } as never,
            overrideAccess: true,
            req: tx,
          });
          return scheduleDTO(updated as unknown as Data);
        },
      );
      if (result) results.push(result);
    }
  }
  return results;
}
export async function recoveryExport(payload: Payload, req: PayloadRequest) {
  requireOwner(req);
  return transaction(
    payload,
    req,
    'recovery-export',
    async (tx) => {
      const collections: Record<string, unknown> = {};
      for (const collection of editableCollections) {
        const docs = await payload.find({
          collection,
          draft: true,
          depth: 0,
          pagination: false,
          overrideAccess: false,
          req: tx,
        });
        const history = payload.collections[collection].config.versions
          ? await payload.findVersions({
              collection,
              pagination: false,
              depth: 0,
              overrideAccess: false,
              req: tx,
            })
          : null;
        collections[collection] = {
          docs: docs.docs,
          versions: history?.docs || [],
        };
      }
      const snapshots = await payload.find({
        collection: 'publication-snapshots',
        pagination: false,
        depth: 0,
        overrideAccess: false,
        req: tx,
      });
      const schedules = await payload.find({
        collection: internalCollection,
        where: { kind: { equals: 'schedule' } },
        pagination: false,
        depth: 0,
        overrideAccess: true,
        req: tx,
      });
      return {
        format: 'desan-owner-recovery',
        schemaVersion: 1,
        instanceId: recoveryInstance(payload),
        exportedAt: new Date().toISOString(),
        collections,
        publication: await currentPublication(payload, tx),
        snapshots: snapshots.docs,
        schedules: schedules.docs,
        mediaNote:
          'Metadata and checksums included. Copy the persistent media directory separately; this export contains no media bytes or owner credentials.',
      };
    },
    'repeatable read',
  );
}
function recoveryInstance(payload: Payload) {
  return createHmac('sha256', payload.secret)
    .update('desan-owner-recovery-v1')
    .digest('hex');
}
function editableData(
  payload: Payload,
  collection: CollectionSlug,
  data: Data,
) {
  const fields = schema(payload, collection);
  return sanitize(
    Object.fromEntries(
      Object.entries(data).filter(([key]) =>
        fields.some((f) => f.name === key && !f.readOnly),
      ),
    ),
    fields,
  );
}
export async function recoveryImport(
  payload: Payload,
  req: PayloadRequest,
  bundle: unknown,
  apply = false,
  expectedRevisions: Record<string, string> = {},
) {
  requireOwner(req);
  const value = bundle as {
    format?: string;
    schemaVersion?: number;
    instanceId?: string;
    collections?: Record<string, { docs?: Data[] }>;
  };
  if (
    !value ||
    value.format !== 'desan-owner-recovery' ||
    value.schemaVersion !== 1 ||
    value.instanceId !== recoveryInstance(payload) ||
    !value.collections ||
    typeof value.collections !== 'object'
  )
    throw new OwnerError(
      'Select a recovery export from this installation. Cross-installation database recovery requires the operator backup.',
      400,
      'invalid',
    );
  const records: {
    collection: CollectionSlug;
    id: string | number;
    data: Data;
  }[] = [];
  const seen = new Set<string>();
  for (const [name, saved] of Object.entries(value.collections)) {
    const collection = collectionSlug(name);
    if (!saved || !Array.isArray(saved.docs))
      throw new OwnerError('Invalid recovery collection', 400, 'invalid');
    for (const doc of saved.docs) {
      if (!doc || !(typeof doc.id === 'number' || typeof doc.id === 'string'))
        throw new OwnerError(
          'Recovery records require existing IDs',
          400,
          'invalid',
        );
      const key = `${collection}:${doc.id}`;
      if (seen.has(key))
        throw new OwnerError('Duplicate recovery record', 400, 'invalid');
      seen.add(key);
      records.push({
        collection,
        id: doc.id,
        data: editableData(payload, collection, doc),
      });
    }
  }
  if (records.length > 500)
    throw new OwnerError(
      'Recover at most 500 records per reviewed import',
      400,
      'invalid',
    );
  records.sort((a, b) =>
    `${a.collection}:${a.id}`.localeCompare(`${b.collection}:${b.id}`),
  );
  return transaction(payload, req, 'recovery-import', async (tx) => {
    // Acquire every record lock before reading or writing any item. A failed
    // precondition/validation rolls the entire import back, including versions.
    if (apply)
      for (const record of records)
        await lock(payload, tx, `record:${record.collection}:${record.id}`);
    const changes: RecoveryPlan['changes'] = [];
    for (const record of records) {
      const current = await readRecord(
        payload,
        tx,
        record.collection,
        record.id,
      );
      if (
        apply &&
        expectedRevisions[`${record.collection}:${record.id}`] !==
          current.revision
      )
        throw conflict();
      if (
        revision(editableData(payload, record.collection, current.data)) ===
        revision(record.data)
      )
        continue;
      changes.push({
        collection: record.collection,
        id: record.id,
        title: String(record.data.title || record.data.alt || record.id),
        expectedRevision: current.revision,
        changedFields: recoveryFieldChanges(
          editableData(payload, record.collection, current.data),
          record.data,
          schema(payload, record.collection),
        ),
      });
      if (apply)
        await payload.update({
          collection: record.collection,
          id: record.id,
          data: record.data as never,
          draft: record.collection !== 'media',
          depth: 0,
          overrideAccess: false,
          req: tx,
        });
    }
    const finalRevisions: Record<string, string> = {};
    for (const record of records)
      finalRevisions[`${record.collection}:${record.id}`] = (
        await readRecord(payload, tx, record.collection, record.id)
      ).revision;
    return {
      applied: apply,
      changes,
      expectedRevisions: finalRevisions,
      warnings: [
        'Recovers editable fields into drafts only. Live publication, schedules, historical version rows, credentials and media bytes are not overwritten. Restore a publication snapshot separately after reviewing the recovered drafts.',
      ],
    };
  });
}
