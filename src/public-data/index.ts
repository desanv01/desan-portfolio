import { assertValidDesign, type DesignDocument } from '../design/model';

export const COLLECTIONS = [
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
] as const;
export type PublicCollection = (typeof COLLECTIONS)[number];
export type RecordId = string | number;
export type PublicRecord = {
  id: RecordId;
  slug: string;
  title: string;
  visible: true;
  summary?: string;
  body?: unknown;
  sortOrder?: number;
  featured?: boolean;
  publishedAt?: string;
  [key: string]: unknown;
};
export type PublicMedia = {
  id: RecordId;
  resourceVersion: string;
  sha256: string;
  url: string;
  mimeType: string;
  alt: string;
  caption?: string;
  credit?: string;
  license?: string;
  [key: string]: unknown;
};
export type PublicPublication = {
  revision: string;
  publishedAt?: string;
  design: DesignDocument;
  content: Partial<Record<PublicCollection, PublicRecord[]>>;
  media: PublicMedia[];
  redirects: Record<string, string>;
};
export type PublicSite =
  | { status: 'ready'; publication: PublicPublication }
  | { status: 'empty'; publication: null }
  | {
      status: 'unavailable';
      publication: null;
      reason: 'unavailable' | 'invalid';
    };
export type TypedRecord = {
  collection: PublicCollection;
  record: PublicRecord;
  roleKey?: string;
  kind?: string;
  edge?: PublicRecord;
};
const privateKeys = new Set([
  'privateNotes',
  'sources',
  'sourceKey',
  'consentReceipt',
  'password',
  'salt',
  'hash',
  'resetPasswordToken',
  'resetPasswordExpiration',
]);
const plain = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));
const safeId = (value: unknown): value is RecordId =>
  typeof value === 'number'
    ? Number.isSafeInteger(value) && value > 0
    : typeof value === 'string' &&
      /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(value);
const safeSlug = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
export const text = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;
export const list = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(plain) : [];
export function relationshipId(value: unknown): string | null {
  const candidate = plain(value) ? value.id : value;
  return safeId(candidate) ? String(candidate) : null;
}
export function safeHref(value: unknown): string | null {
  if (
    typeof value !== 'string' ||
    value.length > 2048 ||
    /[\u0000-\u0020\\]/.test(value)
  )
    return null;
  if (/^\/(?!\/)/.test(value) || /^#[a-zA-Z0-9_-]+$/.test(value)) return value;
  try {
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(
      new URL(value).protocol,
    )
      ? value
      : null;
  } catch {
    return null;
  }
}

function assertPublicJson(
  value: unknown,
  budget = { count: 0 },
  depth = 0,
): void {
  if (++budget.count > 200000 || depth > 60)
    throw new Error('Publication exceeds limits');
  if (value === null || typeof value === 'boolean' || typeof value === 'string')
    return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (Array.isArray(value)) {
    value.forEach((item) => assertPublicJson(item, budget, depth + 1));
    return;
  }
  if (!plain(value)) throw new Error('Publication contains non-JSON values');
  if (
    ['upload', 'relationship', 'block', 'inlineBlock'].includes(
      text(value.type),
    )
  )
    throw new Error('Unresolved rich text reference');
  if (
    value.hidden === true ||
    (Object.hasOwn(value, 'grade') && !value.showGrade) ||
    (Object.hasOwn(value, 'credentialId') && !value.showCredentialId) ||
    (Object.hasOwn(value, 'price') && !value.showPrice)
  )
    throw new Error('Publication contains hidden fields');
  for (const [key, descriptor] of Object.entries(
    Object.getOwnPropertyDescriptors(value),
  )) {
    if (
      key.startsWith('_') ||
      privateKeys.has(key) ||
      ['__proto__', 'prototype', 'constructor'].includes(key) ||
      !Object.hasOwn(descriptor, 'value')
    )
      throw new Error('Publication contains private or unsafe data');
    assertPublicJson(descriptor.value, budget, depth + 1);
  }
}

/** Validate and project immutable publication JSON; never accept raw Payload documents. */
export function publicSiteFromPublication(input: unknown): PublicSite {
  if (input === null) return { status: 'empty', publication: null };
  try {
    if (
      !plain(input) ||
      typeof input.revision !== 'string' ||
      !input.revision ||
      input.revision.length > 128 ||
      !plain(input.content) ||
      !Array.isArray(input.media) ||
      !plain(input.redirects)
    )
      throw new Error('Invalid publication');
    assertPublicJson(input.content);
    assertPublicJson(input.media);
    const content: PublicPublication['content'] = {};
    let count = 0;
    for (const [collection, values] of Object.entries(input.content)) {
      if (
        !COLLECTIONS.includes(collection as PublicCollection) ||
        !Array.isArray(values)
      )
        throw new Error('Unknown publication collection');
      const ids = new Set<string>();
      const slugs = new Set<string>();
      for (const value of values) {
        if (
          !plain(value) ||
          !safeId(value.id) ||
          !safeSlug(value.slug) ||
          typeof value.title !== 'string' ||
          !value.title.trim() ||
          value.visible !== true ||
          ids.has(String(value.id)) ||
          slugs.has(value.slug)
        )
          throw new Error('Invalid public record');
        ids.add(String(value.id));
        slugs.add(value.slug);
        count++;
      }
      content[collection as PublicCollection] = structuredClone(
        values,
      ) as PublicRecord[];
    }
    if (!count && input.design === null && input.media.length === 0)
      return { status: 'empty', publication: null };
    const design = assertValidDesign(input.design);
    const mediaIds = new Set<string>();
    for (const value of input.media) {
      if (
        !plain(value) ||
        !safeId(value.id) ||
        typeof value.resourceVersion !== 'string' ||
        !value.resourceVersion ||
        typeof value.sha256 !== 'string' ||
        !/^[a-f0-9]{64}$/.test(value.sha256) ||
        value.url !==
          `/api/public/media/${encodeURIComponent(String(value.id))}` ||
        typeof value.mimeType !== 'string' ||
        typeof value.alt !== 'string' ||
        mediaIds.has(String(value.id))
      )
        throw new Error('Invalid public media');
      mediaIds.add(String(value.id));
    }
    const selectedRef = (
      collection: PublicCollection,
      value: unknown,
    ): PublicRecord => {
      const id = relationshipId(value);
      const record =
        id && content[collection]?.find((entry) => String(entry.id) === id);
      if (!record) throw new Error('Missing selected relationship target');
      return record;
    };
    const mediaRefs = (value: unknown) => {
      if (value === null || value === undefined) return;
      for (const ref of Array.isArray(value) ? value : [value])
        if (!mediaIds.has(relationshipId(ref) || ''))
          throw new Error('Missing selected media');
    };
    for (const [collection, values] of Object.entries(content))
      for (const record of values || []) {
        mediaRefs(record.media);
        if (plain(record.seo)) mediaRefs(record.seo.image);
        if (collection === 'experiences') mediaRefs(record.logo);
        if (collection === 'profile' || collection === 'site-settings')
          mediaRefs(record.resume);
        if (
          collection === 'profile' &&
          list(record.contact).some((entry) => entry.public !== true)
        )
          throw new Error('Private contact in publication');
        if (collection === 'posts')
          for (const ref of Array.isArray(record.projects)
            ? record.projects
            : [])
            selectedRef('projects', ref);
        if (collection === 'education')
          for (const ref of Array.isArray(record.credentials)
            ? record.credentials
            : [])
            selectedRef('professional-sections', ref);
        if (collection === 'associations' || collection === 'context-links') {
          selectedRef(
            collection === 'associations' ? 'skills' : 'projects',
            collection === 'associations' ? record.skill : record.project,
          );
          const target = plain(record.target) ? record.target : null;
          const allowed =
            collection === 'associations'
              ? [
                  'projects',
                  'education',
                  'experiences',
                  'professional-sections',
                ]
              : ['education', 'experiences'];
          if (!target || !allowed.includes(text(target.relationTo)))
            throw new Error('Invalid typed relationship');
          const referenced = selectedRef(
            target.relationTo as PublicCollection,
            target.value,
          );
          if (
            target.relationTo === 'experiences' &&
            !list(referenced.roles).some(
              (role) => role.roleKey === record.targetRoleKey && !role.hidden,
            )
          )
            throw new Error('Missing selected role');
        }
      }
    for (const node of design.nodes)
      if (node.contentRef) {
        if (node.contentRef.collection === 'media')
          mediaRefs(node.contentRef.id);
        else if (
          COLLECTIONS.includes(node.contentRef.collection as PublicCollection)
        )
          selectedRef(
            node.contentRef.collection as PublicCollection,
            node.contentRef.id,
          );
        else throw new Error('Invalid design content reference');
      }
    for (const resource of [...design.assets, ...design.fonts]) {
      const media = input.media.find((item) => String(item.id) === resource.id);
      if (
        !media ||
        media.resourceVersion !== resource.version ||
        media.sha256 !== resource.sha256 ||
        !resource.rights.redistributable
      )
        throw new Error('Unready design resource');
    }
    const redirects: Record<string, string> = {};
    for (const [from, to] of Object.entries(input.redirects)) {
      if (!safeInternalPath(from) || !safeInternalPath(to))
        throw new Error('Invalid redirect');
      redirects[from] = to;
    }
    const media: PublicMedia[] = input.media.map((value) => {
      const resource: PublicMedia = {
        id: value.id,
        resourceVersion: value.resourceVersion,
        sha256: value.sha256,
        url: value.url,
        mimeType: value.mimeType,
        alt: value.alt,
      };
      for (const key of ['caption', 'credit', 'license'])
        if (typeof value[key] === 'string') resource[key] = value[key];
      for (const key of ['width', 'height'])
        if (
          typeof value[key] === 'number' &&
          Number.isFinite(value[key]) &&
          value[key] > 0
        )
          resource[key] = value[key];
      return resource;
    });
    const publication: PublicPublication = {
      revision: input.revision,
      design,
      content,
      media,
      redirects,
    };
    if (
      typeof input.publishedAt === 'string' &&
      Number.isFinite(Date.parse(input.publishedAt))
    )
      publication.publishedAt = input.publishedAt;
    return { status: 'ready', publication };
  } catch {
    return { status: 'unavailable', publication: null, reason: 'invalid' };
  }
}
export async function loadPublicSite(
  load: () => Promise<unknown>,
  timeoutMs = 5000,
): Promise<PublicSite> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const delay = Number.isFinite(timeoutMs)
      ? Math.min(30000, Math.max(1, timeoutMs))
      : 5000;
    const unavailable = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(
        () => reject(new Error('Publication read unavailable')),
        delay,
      );
    });
    return publicSiteFromPublication(await Promise.race([load(), unavailable]));
  } catch {
    return { status: 'unavailable', publication: null, reason: 'unavailable' };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function records(
  site: PublicSite,
  collection: PublicCollection,
): PublicRecord[] {
  return site.status === 'ready'
    ? [...(site.publication.content[collection] || [])].sort(
        (a, b) =>
          number(a.sortOrder) - number(b.sortOrder) ||
          a.title.localeCompare(b.title) ||
          String(a.id).localeCompare(String(b.id)),
      )
    : [];
}
const number = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;
export function recordById(
  site: PublicSite,
  collection: PublicCollection,
  id: RecordId,
): PublicRecord | undefined {
  return records(site, collection).find(
    (record) => String(record.id) === String(id),
  );
}
export function recordBySlug(
  site: PublicSite,
  collection: PublicCollection,
  slug: string,
): PublicRecord | undefined {
  return records(site, collection).find((record) => record.slug === slug);
}
export function recordPath(
  collection: PublicCollection,
  record: Pick<PublicRecord, 'id' | 'slug'>,
  roleKey?: string,
): string {
  if (collection === 'projects') return `/work/${record.slug}`;
  if (collection === 'posts') return `/journal/${record.slug}`;
  if (collection === 'profile' || collection === 'site-settings')
    return '/profile';
  const anchor =
    collection === 'skills'
      ? `skill-${record.id}`
      : `${collection}-${record.id}${roleKey ? `-${roleKey}` : ''}`;
  return `/profile#${encodeURIComponent(anchor)}`;
}
function safeInternalPath(path: unknown): path is string {
  return (
    typeof path === 'string' &&
    /^\/[a-z0-9/-]*$/.test(path) &&
    !path.includes('//') &&
    !path.includes('..')
  );
}
export function publicPath(path: string): string {
  return path
    .replace(/^\/projects(?=\/|$)/, '/work')
    .replace(/^\/posts(?=\/|$)/, '/journal');
}
export function resolveRedirect(site: PublicSite, path: string): string | null {
  if (site.status !== 'ready' || !safeInternalPath(path)) return null;
  let target = path;
  const seen = new Set<string>();
  for (let hop = 0; hop < 16; hop++) {
    if (seen.has(target)) return null;
    seen.add(target);
    const entries = Object.entries(site.publication.redirects);
    const next =
      site.publication.redirects[target] ||
      entries.find(([from]) => publicPath(from) === publicPath(target))?.[1];
    if (!next) break;
    target = next;
  }
  target = publicPath(target);
  if (target === path) return null;
  const [family, slug] = target.slice(1).split('/');
  const collection =
    family === 'work' ? 'projects' : family === 'journal' ? 'posts' : null;
  return collection && slug && recordBySlug(site, collection, slug)
    ? target
    : null;
}

/** Extract text from supported plain/lexical JSON, without private metadata or executable markup. */
export function plainText(value: unknown, maxLength = 200000): string {
  const parts: string[] = [];
  let length = 0;
  const visit = (node: unknown, depth = 0) => {
    if (length >= maxLength || depth > 60) return;
    if (typeof node === 'string') {
      const part = node.slice(0, maxLength - length);
      parts.push(part);
      length += part.length;
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((child) => visit(child, depth + 1));
      return;
    }
    if (!plain(node)) return;
    if (typeof node.text === 'string') visit(node.text, depth + 1);
    else if (Array.isArray(node.children)) visit(node.children, depth + 1);
    else if (plain(node.root)) visit(node.root, depth + 1);
  };
  visit(value);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
function normalized(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en');
}
export function recordSearchText(record: PublicRecord): string {
  return normalized(
    [
      record.title,
      record.summary,
      record.body,
      record.displayName,
      record.headline,
      record.region,
      record.availability,
      record.issuer,
      record.publisher,
      record.author,
      record.quote,
      record.proficiency,
      record.canonicalName,
      record.category,
      record.aliases &&
        list(record.aliases)
          .map((alias) => text(alias.name))
          .join(' '),
      record.organization,
      record.institution,
      record.qualification,
      record.fieldOfStudy,
      record.discipline,
      record.kind,
      record.problem,
      record.contribution,
      record.approach,
      record.results,
      record.limitations,
      record.activities,
      record.coursework,
      list(record.roles)
        .map((role) =>
          [role.role, role.responsibilities, role.outcomes]
            .map((value) => plainText(value))
            .join(' '),
        )
        .join(' '),
    ]
      .map((value) => plainText(value))
      .join(' '),
  );
}
export function matchesQuery(record: PublicRecord, query: string): boolean {
  const terms = normalized(query.slice(0, 256))
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 16);
  const haystack = recordSearchText(record);
  return terms.every((term) => haystack.includes(term));
}
export function filterRecords(
  items: readonly PublicRecord[],
  filters: {
    query?: string;
    discipline?: string;
    category?: string;
    kind?: string;
    featured?: boolean;
  } = {},
): PublicRecord[] {
  return items.filter(
    (record) =>
      (!filters.query || matchesQuery(record, filters.query)) &&
      (!filters.discipline || record.discipline === filters.discipline) &&
      (!filters.category ||
        record.category === filters.category ||
        list(record.categories).some(
          (entry) => entry.name === filters.category,
        )) &&
      (!filters.kind || record.kind === filters.kind) &&
      (filters.featured === undefined || record.featured === filters.featured),
  );
}
export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
};
export function paginate<T>(
  items: readonly T[],
  options: { page?: unknown; pageSize?: unknown } = {},
): PageResult<T> {
  const requestedSize = Number(options.pageSize ?? 12);
  const pageSize = Number.isSafeInteger(requestedSize)
    ? Math.min(100, Math.max(1, requestedSize))
    : 12;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const requestedPage = Number(options.page ?? 1);
  const page = Number.isSafeInteger(requestedPage)
    ? Math.min(pageCount, Math.max(1, requestedPage))
    : 1;
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: items.length,
    pageCount,
    hasPrevious: page > 1,
    hasNext: page < pageCount,
  };
}
export function searchRecords(
  site: PublicSite,
  query: string,
  options: {
    collections?: PublicCollection[];
    page?: unknown;
    pageSize?: unknown;
  } = {},
): PageResult<TypedRecord> {
  if (!query.trim()) return paginate([], options);
  const selected =
    options.collections ||
    ([
      'projects',
      'posts',
      'skills',
      'experiences',
      'education',
      'professional-sections',
      'profile',
    ] as PublicCollection[]);
  return paginate(
    selected.flatMap((collection) =>
      records(site, collection)
        .filter((record) => matchesQuery(record, query))
        .map((record) => ({ collection, record })),
    ),
    options,
  );
}
export function relatedRecords(
  site: PublicSite,
  source: { collection: PublicCollection; id: RecordId; roleKey?: string },
): TypedRecord[] {
  const results = new Map<string, TypedRecord>();
  const add = (
    collection: PublicCollection,
    target: unknown,
    edge: PublicRecord,
    roleKey?: string,
    kindOverride?: string,
  ) => {
    if (!COLLECTIONS.includes(collection)) return;
    const targetId = relationshipId(target);
    if (!targetId) return;
    const record = recordById(site, collection, targetId);
    if (record)
      results.set(`${collection}:${targetId}:${roleKey || ''}`, {
        collection,
        record,
        roleKey,
        kind: kindOverride || text(edge.kind),
        edge,
      });
  };
  for (const edge of records(site, 'associations')) {
    const target = plain(edge.target) ? edge.target : null;
    if (!target) continue;
    if (
      source.collection === 'skills' &&
      relationshipId(edge.skill) === String(source.id)
    )
      add(
        target.relationTo as PublicCollection,
        target.value,
        edge,
        text(edge.targetRoleKey) || undefined,
      );
    else if (
      target.relationTo === source.collection &&
      relationshipId(target.value) === String(source.id) &&
      (!source.roleKey || edge.targetRoleKey === source.roleKey)
    )
      add('skills', edge.skill, edge);
  }
  for (const edge of records(site, 'context-links')) {
    const target = plain(edge.target) ? edge.target : null;
    if (!target) continue;
    if (
      source.collection === 'projects' &&
      relationshipId(edge.project) === String(source.id)
    )
      add(
        target.relationTo as PublicCollection,
        target.value,
        edge,
        text(edge.targetRoleKey) || undefined,
      );
    else if (
      target.relationTo === source.collection &&
      relationshipId(target.value) === String(source.id) &&
      (!source.roleKey || edge.targetRoleKey === source.roleKey)
    )
      add('projects', edge.project, edge);
  }
  for (const post of records(site, 'posts')) {
    const projects = Array.isArray(post.projects) ? post.projects : [];
    if (source.collection === 'posts' && String(post.id) === String(source.id))
      for (const target of projects)
        add('projects', target, post, undefined, 'post-project');
    else if (
      source.collection === 'projects' &&
      projects.some((target) => relationshipId(target) === String(source.id))
    )
      add('posts', post.id, post, undefined, 'post-project');
  }
  for (const professional of records(site, 'professional-sections'))
    for (const target of list(professional.related)) {
      if (!COLLECTIONS.includes(target.relationTo as PublicCollection))
        continue;
      if (
        source.collection === 'professional-sections' &&
        String(professional.id) === String(source.id)
      )
        add(
          target.relationTo as PublicCollection,
          target.value,
          professional,
          undefined,
          'professional-context',
        );
      else if (
        target.relationTo === source.collection &&
        relationshipId(target.value) === String(source.id) &&
        !source.roleKey
      )
        add(
          'professional-sections',
          professional.id,
          professional,
          undefined,
          'professional-context',
        );
    }
  for (const education of records(site, 'education'))
    for (const target of Array.isArray(education.credentials)
      ? education.credentials
      : []) {
      if (
        source.collection === 'education' &&
        String(education.id) === String(source.id)
      )
        add(
          'professional-sections',
          target,
          education,
          undefined,
          'education-credential',
        );
      else if (
        source.collection === 'professional-sections' &&
        relationshipId(target) === String(source.id)
      )
        add(
          'education',
          education.id,
          education,
          undefined,
          'education-credential',
        );
    }
  return [...results.values()];
}
export function mediaById(
  site: PublicSite,
  id: unknown,
): PublicMedia | undefined {
  const target = relationshipId(id);
  return site.status === 'ready'
    ? site.publication.media.find((media) => String(media.id) === target)
    : undefined;
}

export function recordsForSkill(
  site: PublicSite,
  skillId: RecordId,
  collection?: PublicCollection,
): TypedRecord[] {
  return relatedRecords(site, { collection: 'skills', id: skillId }).filter(
    (entry) => !collection || entry.collection === collection,
  );
}
