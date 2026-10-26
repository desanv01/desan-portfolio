import Link, { PublicGetForm } from './public-link';
import type { ReactNode } from 'react';
import {
  relationshipId,
  text,
  type PublicRecord,
  type PublicSite,
} from '@/public-data';
import {
  BoundAction,
  BoundCard,
  BoundCollection,
  BoundMedia,
  BoundEmpty,
} from './bound-elements';
import { BoundField } from './bound-form';
import { Arrow } from './site-chrome';

export function Action({
  href,
  children,
  primary = false,
  small = false,
  node,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
  small?: boolean;
  node?: string;
}) {
  return (
    <BoundAction href={href} primary={primary} small={small} node={node}>
      {children}
    </BoundAction>
  );
}
export function PageIntro({
  page,
  title,
  children,
  eyebrow,
  left = false,
}: {
  page: string;
  title: ReactNode;
  children?: ReactNode;
  eyebrow?: string;
  left?: boolean;
}) {
  return (
    <div className={`page-intro ${left ? 'left' : ''}`}>
      {eyebrow && (
        <p className="eyebrow" data-design-node={`${page}.meta`}>
          {eyebrow}
        </p>
      )}
      <h1 data-design-node={`${page}.title`}>{title}</h1>
      {children && (
        <div className="lede" data-design-node={`${page}.subtitle`}>
          {children}
        </div>
      )}
    </div>
  );
}
export function EmptyState({
  page,
  title = 'Nothing here yet.',
  children,
  href,
  action = 'Explore work',
}: {
  page: string;
  title?: string;
  children: ReactNode;
  href?: string;
  action?: string;
}) {
  return (
    <BoundEmpty page={page}>
      <div className="empty-state" data-design-node={`${page}.empty`}>
        <h2>{title}</h2>
        <p>{children}</p>
        {href && <Action href={href}>{action}</Action>}
      </div>
    </BoundEmpty>
  );
}
export function PublicationNotice({ site }: { site: PublicSite }) {
  return site.status === 'unavailable' ? (
    <div className="error-banner" role="status">
      <strong>Content is temporarily unavailable.</strong>
      <p>Please try again in a moment.</p>
      <a href="">Reload this page</a>
    </div>
  ) : null;
}
export function Media({
  site,
  value,
  page,
  placeholder = 'Media awaiting selection',
}: {
  site: PublicSite;
  value: unknown;
  page: string;
  placeholder?: string;
}) {
  const id = relationshipId(Array.isArray(value) ? value[0] : value);
  return (
    <BoundMedia
      site={site}
      assetId={id}
      node={`${page}.media`}
      placeholder={placeholder}
    />
  );
}
export function ProjectCard({
  record,
  site,
  page = 'work',
}: {
  record: PublicRecord;
  site: PublicSite;
  page?: string;
}) {
  return (
    <BoundCard node={`${page}.card`} id={String(record.id)}>
      <Media site={site} value={record.media} page={page} />
      <h3>
        <Link href={`/work/${record.slug}`}>{record.title}</Link>
      </h3>
      {record.workStatus ? (
        <span className="status-label" data-design-node={`${page}.meta`}>
          {text(record.workStatus)}
        </span>
      ) : null}
      {record.summary && (
        <p className="summary" data-design-node={`${page}.text`}>
          {record.summary}
        </p>
      )}
      <Action
        href={`/work/${record.slug}`}
        small
        node={`${page}.secondary-action`}
      >
        View project
      </Action>
    </BoundCard>
  );
}
export function ProjectGrid({
  items,
  site,
  page = 'work',
  node,
  attributes,
  empty,
}: {
  items: PublicRecord[];
  site: PublicSite;
  page?: string;
  node?: string;
  attributes?: Record<string, unknown>;
  empty?: ReactNode;
}) {
  return (
    <BoundCollection
      className="project-grid"
      node={node || `${page}.grid`}
      records={items}
      attributes={attributes}
      empty={empty}
    >
      {items.map((record) => (
        <ProjectCard key={record.id} record={record} site={site} page={page} />
      ))}
    </BoundCollection>
  );
}
export function formatDate(value: unknown) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}(?:-\d{2})?(?:-\d{2})?(?:T.*)?$/.test(value)
  )
    return '';
  if (value.length === 4) return value;
  const date = new Date(value.length === 7 ? `${value}-01T12:00:00Z` : value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('en', {
        month: 'short',
        year: 'numeric',
        ...(value.length > 7 ? { day: 'numeric' as const } : {}),
        timeZone: 'UTC',
      }).format(date)
    : '';
}
export function dateRange(record: Record<string, unknown>) {
  return [
    formatDate(record.start),
    record.current === true ? 'Present' : formatDate(record.end),
  ]
    .filter(Boolean)
    .join(' – ');
}
export function JournalRows({
  items,
  page = 'journal',
  node,
  attributes,
  empty,
}: {
  items: PublicRecord[];
  page?: string;
  node?: string;
  attributes?: Record<string, unknown>;
  empty?: ReactNode;
}) {
  return (
    <BoundCollection
      node={node || `${page}.grid`}
      records={items}
      attributes={attributes}
      empty={empty}
    >
      {items.map((record) => (
        <Link
          key={record.id}
          href={`/journal/${record.slug}`}
          className="journal-row"
          data-design-node={`${page}.card`}
          data-design-content-collection="posts"
          data-design-content-id={String(record.id)}
        >
          <span className="journal-date" data-design-node={`${page}.meta`}>
            {formatDate(record.editorialDate || record.publishedAt) ||
              'Undated'}
            <br />
            {text(record.kind, 'Article')}
          </span>
          <div>
            <h3>{record.title}</h3>
            {record.summary && (
              <p data-design-node={`${page}.text`}>{record.summary}</p>
            )}
          </div>
          <Arrow />
        </Link>
      ))}
    </BoundCollection>
  );
}
export function queryURL(
  path: string,
  query: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (value) params.set(key, value);
  return `${path}${params.size ? `?${params}` : ''}`;
}
export function Pagination({
  path,
  page,
  pageCount,
  total,
  query = {},
  node,
}: {
  path: string;
  page: number;
  pageCount: number;
  total: number;
  query?: Record<string, string | undefined>;
  node?: string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination" data-design-node={node}>
      {page > 1 ? (
        <Link href={queryURL(path, { ...query, page: String(page - 1) })}>
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span>
        Page {page} of {pageCount} · {total} results
      </span>
      {page < pageCount ? (
        <Link href={queryURL(path, { ...query, page: String(page + 1) })}>
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
export function SearchForm({
  action,
  initial = '',
  page,
  hidden = {},
  label = 'Search',
}: {
  action: string;
  initial?: string;
  page: string;
  hidden?: Record<string, string>;
  label?: string;
}) {
  return (
    <PublicGetForm
      action={action}
      method="get"
      className="search-form"
      role="search"
    >
      <BoundField
        node={`${page}.input`}
        label={label}
        input={{
          type: 'search',
          name: 'q',
          defaultValue: initial,
          placeholder: 'Type to search…',
          maxLength: 200,
        }}
      />
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        className="button secondary"
        type="submit"
        data-design-node={`${page}.secondary-action`}
      >
        Search <Arrow />
      </button>
    </PublicGetForm>
  );
}
