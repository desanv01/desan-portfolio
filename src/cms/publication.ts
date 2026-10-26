import {
  createLocalReq,
  type CollectionSlug,
  type Payload,
  type PayloadRequest,
} from 'payload';
import { randomUUID } from 'node:crypto';
import { assertValidDesign } from '../design/model';
import { requireOwner } from './access';
import { lock } from '../owner/transaction';

export type Selection = { collection: string; versionId: number };
export type PublicationInput = {
  expectedRevision: string | null;
  designVersionId: number;
  selections: Selection[];
  action?: 'publish' | 'revoke' | 'restore';
  restoreSnapshotId?: number;
};
type RecordData = Record<string, unknown>;
export type Publication = {
  revision: string;
  publishedAt?: string;
  design: unknown;
  designVersionId: number;
  selections: Selection[];
  content: Record<string, RecordData[]>;
  media: RecordData[];
  redirects: Record<string, string>;
};
const publishable = new Set([
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
const secretFields = new Set([
  'privateNotes',
  'sources',
  'sourceKey',
  'consentReceipt',
  'createdAt',
  'updatedAt',
  'password',
  'salt',
  'hash',
]);
function redact(value: unknown): unknown {
  if (Array.isArray(value))
    return value
      .filter((v) => !(v && typeof v === 'object' && 'hidden' in v && v.hidden))
      .map(redact);
  if (!value || typeof value !== 'object') return value;
  const obj = value as RecordData;
  return Object.fromEntries(
    Object.entries(obj)
      .filter(
        ([k]) =>
          !secretFields.has(k) &&
          !k.startsWith('_') &&
          !(k === 'grade' && !obj.showGrade) &&
          !(k === 'credentialId' && !obj.showCredentialId) &&
          !(k === 'price' && !obj.showPrice),
      )
      .map(([k, v]) => [
        k,
        k === 'contact' && Array.isArray(v)
          ? redact(v.filter((x) => x.public === true))
          : redact(v),
      ]),
  );
}
function id(value: unknown): string {
  return String(
    typeof value === 'object' && value !== null && 'id' in value
      ? value.id
      : value,
  );
}
function relationshipIds(value: unknown): string[] {
  return value === null || value === undefined
    ? []
    : (Array.isArray(value) ? value : [value]).map(id);
}

export async function currentPublication(
  payload: Payload,
  req?: PayloadRequest,
): Promise<Publication | null> {
  // Explicitly authorized internal read: this returns the public projection only.
  const state = await payload.find({
    collection: 'publication-state',
    where: { singleton: { equals: 1 } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  });
  if (!state.docs[0]) return null;
  const snap = await payload.findByID({
    collection: 'publication-snapshots',
    id: id(state.docs[0].snapshot),
    depth: 0,
    overrideAccess: true,
    req,
  });
  return snap.payload as unknown as Publication;
}

export async function resolveSelection(
  payload: Payload,
  req: PayloadRequest,
  input: PublicationInput,
): Promise<Omit<Publication, 'revision' | 'redirects'>> {
  requireOwner(req);
  if (!Array.isArray(input.selections) || input.selections.length > 500)
    throw new Error('Select at most 500 content versions');
  const designVersion = await payload.findVersionByID({
    collection: 'design-themes',
    id: String(input.designVersionId),
    depth: 0,
    overrideAccess: false,
    req,
  });
  const design = assertValidDesign(designVersion.version.data);
  const content: Publication['content'] = {};
  const selected = new Set<string>();
  const raw: { collection: string; doc: RecordData }[] = [];
  for (const selection of input.selections) {
    if (!publishable.has(selection.collection))
      throw new Error('Collection cannot be published');
    const version = await payload.findVersionByID({
      collection: selection.collection as CollectionSlug,
      id: String(selection.versionId),
      depth: 0,
      overrideAccess: false,
      req,
    });
    const doc = version.version as unknown as RecordData;
    if (
      typeof doc.title !== 'string' ||
      !doc.title.trim() ||
      typeof doc.slug !== 'string' ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(doc.slug)
    )
      throw new Error('Invalid content title or public slug');
    const key = `${selection.collection}:${id(version.parent)}`;
    if (selected.has(key))
      throw new Error('Select one version per content record');
    if (!doc.visible) throw new Error('Hidden content cannot be published');
    if (
      selection.collection === 'professional-sections' &&
      doc.kind === 'testimonial' &&
      !doc.consentToPublish
    )
      throw new Error('Testimonial publication requires consent');
    if (
      ['profile', 'site-settings'].includes(selection.collection) &&
      content[selection.collection]?.length
    )
      throw new Error('Singleton content has multiple selections');
    selected.add(key);
    raw.push({ collection: selection.collection, doc });
    (content[selection.collection] ||= []).push({
      ...(redact(doc) as RecordData),
      id: version.parent,
    });
  }
  const mediaIds = new Set<string>();
  const edgeKeys = new Set<string>();
  for (const { collection, doc } of raw.filter((r) =>
    ['associations', 'context-links'].includes(r.collection),
  )) {
    const target = doc.target as
      { relationTo: string; value: unknown } | undefined;
    const key = JSON.stringify([
      collection,
      id(collection === 'associations' ? doc.skill : doc.project),
      target?.relationTo,
      id(target?.value),
      doc.targetRoleKey || '',
      doc.kind || '',
    ]);
    if (edgeKeys.has(key)) throw new Error('Duplicate selected relationship');
    edgeKeys.add(key);
  }
  const check = (collection: string, value: unknown) => {
    for (const target of relationshipIds(value)) {
      if (collection === 'media') mediaIds.add(target);
      else if (!selected.has(`${collection}:${target}`))
        throw new Error(
          `Selected publication is missing a referenced ${collection} record`,
        );
    }
  };
  for (const node of design.nodes)
    if (node.contentRef) check(node.contentRef.collection, node.contentRef.id);
  const checkEmbedded = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(checkEmbedded);
      return;
    }
    if (!value || typeof value !== 'object') return;
    const node = value as RecordData;
    if (node.type === 'link' || node.type === 'autolink') {
      const url = (node.fields as RecordData | undefined)?.url;
      if (
        typeof url !== 'string' ||
        !/^(https?:|mailto:|tel:|\/(?!\/))/.test(url)
      )
        throw new Error('Unsafe rich text link');
    }
    if (
      node.type === 'upload' ||
      node.type === 'relationship' ||
      node.type === 'block' ||
      node.type === 'inlineBlock'
    )
      throw new Error(
        'Embedded reference nodes are not supported in public rich text; use explicit validated relationships',
      );
    Object.values(node).forEach(checkEmbedded);
  };
  for (const { collection, doc } of raw) {
    checkEmbedded(doc.body);
    check('media', doc.media);
    check('media', (doc.seo as RecordData | null)?.image);
    if (collection === 'posts') check('projects', doc.projects);
    if (collection === 'experiences') check('media', doc.logo);
    if (collection === 'education')
      check('professional-sections', doc.credentials);
    if (collection === 'profile' || collection === 'site-settings')
      check('media', doc.resume);
    if (collection === 'associations' || collection === 'context-links') {
      check(
        collection === 'associations' ? 'skills' : 'projects',
        collection === 'associations' ? doc.skill : doc.project,
      );
      const target = doc.target as {
        relationTo: string;
        value: unknown;
      } | null;
      if (!target) throw new Error('Association requires a typed target');
      check(target.relationTo, target.value);
      if (target.relationTo === 'experiences') {
        if (!doc.targetRoleKey)
          throw new Error('Experience context requires an explicit role key');
        const group = raw.find(
          (r) =>
            r.collection === 'experiences' && id(r.doc.id) === id(target.value),
        );
        // Version documents omit id in some adapters; use selected public records.
        const roles = (group?.doc.roles ||
          content.experiences?.find((r) => id(r.id) === id(target.value))
            ?.roles ||
          []) as RecordData[];
        if (
          !roles.some(
            (role) => role.roleKey === doc.targetRoleKey && !role.hidden,
          )
        )
          throw new Error('Role association targets a hidden or missing role');
      }
    }
    if (collection === 'professional-sections')
      for (const rel of (doc.related || []) as {
        relationTo: string;
        value: unknown;
      }[])
        check(rel.relationTo, rel.value);
  }
  const resources = [...design.assets, ...design.fonts];
  for (const resource of resources) mediaIds.add(resource.id);
  const media: RecordData[] = [];
  for (const mediaId of mediaIds) {
    const doc = await payload.findByID({
      collection: 'media',
      id: mediaId,
      depth: 0,
      req,
      overrideAccess: false,
    });
    if (!doc.publicEligible)
      throw new Error('A referenced media resource is private');
    for (const resource of resources.filter((r) => r.id === mediaId)) {
      if (
        resource.version !== doc.resourceVersion ||
        resource.sha256 !== doc.sha256 ||
        !resource.rights.redistributable
      )
        throw new Error('Design resource version/checksum/rights mismatch');
    }
    if (design.fonts.some((f) => f.id === mediaId) && doc.kind !== 'font')
      throw new Error('Font reference is not a validated font');
    for (const asset of design.assets.filter((a) => a.id === mediaId))
      if (!['image', 'icon'].includes(asset.kind) || doc.kind !== 'image')
        throw new Error(
          'Design asset type is not supported by the validated media policy',
        );
    media.push({
      id: doc.id,
      resourceVersion: doc.resourceVersion,
      sha256: doc.sha256,
      filename: doc.filename,
      mimeType: doc.mimeType,
      alt: doc.alt,
      caption: doc.caption,
      credit: doc.credit,
      license: doc.license,
      url: `/api/public/media/${doc.id}`,
    });
  }
  // Reciprocal associations share one selected edge, rather than independent counters.
  const edges = content.associations || [];
  for (const [collection, docs] of Object.entries(content))
    for (const doc of docs) {
      doc.associations = edges
        .filter((edge) =>
          collection === 'skills'
            ? id(edge.skill) === id(doc.id)
            : (edge.target as { relationTo: string } | undefined)
                ?.relationTo === collection &&
              id((edge.target as { value: unknown }).value) === id(doc.id),
        )
        .map((edge) => edge.id);
      if (collection === 'skills')
        doc.relatedCount = new Set(
          edges
            .filter((edge) => id(edge.skill) === id(doc.id))
            .map((edge) => {
              const target = edge.target as {
                relationTo: string;
                value: unknown;
              };
              return `${target.relationTo}:${id(target.value)}:${edge.targetRoleKey || ''}`;
            }),
        ).size;
    }
  for (const [collection, docs] of Object.entries(content))
    for (const doc of docs)
      doc.contextLinks = (content['context-links'] || [])
        .filter((edge) =>
          collection === 'projects'
            ? id(edge.project) === id(doc.id)
            : (edge.target as { relationTo: string } | undefined)
                ?.relationTo === collection &&
              id((edge.target as { value: unknown }).value) === id(doc.id),
        )
        .map((edge) => edge.id);
  return {
    design,
    designVersionId: input.designVersionId,
    selections: input.selections,
    content,
    media,
  };
}

export async function publish(
  payload: Payload,
  userReq: PayloadRequest,
  input: PublicationInput,
): Promise<Publication> {
  requireOwner(userReq);
  const outerTransaction = await userReq.transactionID;
  const transactionID =
    outerTransaction ||
    (await payload.db.beginTransaction({
      isolationLevel: 'read committed',
    }));
  if (!transactionID)
    throw new Error('Publication requires a database transaction');
  const req = await createLocalReq(
    { user: userReq.user || undefined, req: { transactionID } },
    payload,
  );
  try {
    await lock(payload, req, 'publication');
    const current = await currentPublication(payload, req);
    if ((current?.revision || null) !== input.expectedRevision)
      throw new Error('Publication conflict: refresh the active revision');
    let selection = input;
    if (input.action === 'restore') {
      if (!input.restoreSnapshotId)
        throw new Error('Restore snapshot is required');
      const saved = await payload.findByID({
        collection: 'publication-snapshots',
        id: input.restoreSnapshotId,
        depth: 0,
        overrideAccess: false,
        req,
      });
      const previous = saved.payload as unknown as Publication;
      selection = {
        ...input,
        designVersionId: previous.designVersionId,
        selections: previous.selections,
      };
    }
    const resolved =
      input.action === 'revoke'
        ? {
            design: null,
            designVersionId: 0,
            selections: [],
            content: {},
            media: [],
          }
        : await resolveSelection(payload, req, selection);
    const paths = new Map<string, string>();
    for (const [collection, docs] of Object.entries(resolved.content))
      for (const doc of docs) {
        const path = `/${collection}/${doc.slug}`;
        if (paths.has(path)) throw new Error('Duplicate public slug');
        paths.set(path, `${collection}:${doc.id}`);
      }
    const redirects: Record<string, string> = {};
    const newPaths = new Map([...paths].map(([path, key]) => [key, path]));
    if (current) {
      for (const [collection, docs] of Object.entries(current.content))
        for (const doc of docs) {
          const next = newPaths.get(`${collection}:${doc.id}`);
          const old = `/${collection}/${doc.slug}`;
          if (next && next !== old && !paths.has(old)) redirects[old] = next;
        }
      for (const [old, previousTarget] of Object.entries(current.redirects)) {
        const target = redirects[previousTarget] || previousTarget;
        if (paths.has(target) && !paths.has(old)) redirects[old] = target;
      }
    }
    const publishedAt = new Date().toISOString();
    for (const [collection, docs] of Object.entries(resolved.content))
      for (const doc of docs)
        doc.publishedAt =
          current?.content[collection]?.find(
            (previous) => id(previous.id) === id(doc.id),
          )?.publishedAt || publishedAt;
    const publication: Publication = {
      ...resolved,
      revision: randomUUID(),
      publishedAt,
      redirects,
    };
    // Bypass is confined to owner-authorized immutable publication internals.
    const snapshot = await payload.create({
      collection: 'publication-snapshots',
      data: {
        revision: publication.revision,
        payload: publication,
        mediaIds: publication.media.map((m) => m.id),
      },
      overrideAccess: true,
      req,
    });
    const state = await payload.find({
      collection: 'publication-state',
      where: { singleton: { equals: 1 } },
      depth: 0,
      overrideAccess: true,
      req,
    });
    if (state.docs[0])
      await payload.update({
        collection: 'publication-state',
        id: state.docs[0].id,
        data: { revision: publication.revision, snapshot: snapshot.id },
        overrideAccess: true,
        req,
      });
    else
      await payload.create({
        collection: 'publication-state',
        data: {
          singleton: 1,
          revision: publication.revision,
          snapshot: snapshot.id,
        },
        overrideAccess: true,
        req,
      });
    if (!outerTransaction) await payload.db.commitTransaction(transactionID);
    return publication;
  } catch (error) {
    if (!outerTransaction) await payload.db.rollbackTransaction(transactionID);
    throw error;
  }
}
