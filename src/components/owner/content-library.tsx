'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ownerApi,
  ownerPages,
  type OwnerRecord,
  type OwnerCollection,
  type OwnerRecordPage,
} from './client';
import { parseContext, matchesContext } from './association-context';
import { OwnerHeading } from './owner-shell';

export function ContentLibrary({
  collection,
  collections,
}: {
  collection: OwnerCollection;
  collections: OwnerCollection[];
}) {
  const params = useSearchParams();
  const context =
    ['associations', 'context-links'].includes(collection.slug) &&
    parseContext(params.get('context'))
      ? params.get('context')
      : null;
  const [page, setPage] = useState(1),
    [query, setQuery] = useState(''),
    [result, setResult] = useState<OwnerRecordPage | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    (context
      ? ownerPages<OwnerRecord>(
          `/api/owner/records/${collection.slug}?limit=100`,
        ).then((docs) => {
          const filtered = docs.filter((record) =>
            matchesContext(collection.slug, record.data, context),
          );
          return {
            docs: filtered,
            totalDocs: filtered.length,
            page: 1,
            totalPages: 1,
          };
        })
      : ownerApi<OwnerRecordPage>(
          `/api/owner/records/${collection.slug}?page=${page}&limit=30`,
        )
    )
      .then((value) => {
        if (active) {
          setResult(value);
          setError('');
        }
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      });
    return () => {
      active = false;
    };
  }, [collection.slug, page, context]);
  const docs =
    result?.docs.filter((record) =>
      JSON.stringify([
        record.data.title,
        record.data.organization,
        record.data.institution,
        record.data.canonicalName,
      ])
        .toLowerCase()
        .includes(query.toLowerCase()),
    ) || [];
  const profileTypes = [
    'profile',
    'experiences',
    'education',
    'skills',
    'professional-sections',
    'associations',
    'context-links',
  ];
  return (
    <>
      <OwnerHeading
        eyebrow="Content library"
        title={collection.label}
        description="Drafts and published selections are separate. Open a record to edit, reorder, hide or restore it."
        actions={
          <Link
            className="owner-button owner-primary"
            href={`/owner/content/${collection.slug}/new${context ? `?context=${encodeURIComponent(context)}` : ''}`}
          >
            + New record
          </Link>
        }
      />
      {context && (
        <p className="owner-notice">
          Showing relationships for this record.{' '}
          <Link href={`/owner/content/${collection.slug}`}>
            Show all relationships
          </Link>
        </p>
      )}
      {profileTypes.includes(collection.slug) && (
        <nav className="owner-tabs" aria-label="Profile collections">
          {collections
            .filter((item) => profileTypes.includes(item.slug))
            .map((item) => (
              <Link
                key={item.slug}
                href={`/owner/content/${item.slug}`}
                aria-current={
                  item.slug === collection.slug ? 'page' : undefined
                }
              >
                {item.label}
              </Link>
            ))}
        </nav>
      )}
      <div className="owner-toolbar">
        <label className="owner-field">
          <span className="owner-label">Search this page</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a draft…"
          />
        </label>
        <span className="owner-muted">{result?.totalDocs ?? '…'} records</span>
      </div>
      {error && (
        <p className="owner-notice" data-tone="error" role="alert">
          {error}
        </p>
      )}
      <section className="owner-panel">
        {!result ? (
          <p role="status">Loading private records…</p>
        ) : !docs.length ? (
          <div className="owner-empty">
            {query
              ? 'No matching records on this page.'
              : 'No records yet. Create your first draft.'}
          </div>
        ) : (
          docs.map((record) => (
            <div className="owner-row" key={record.id}>
              <div>
                <Link
                  className="owner-row-title"
                  href={`/owner/content/${collection.slug}/${record.id}`}
                >
                  {String(
                    record.data.title ||
                      record.data.canonicalName ||
                      record.data.alt ||
                      'Untitled',
                  )}
                </Link>
                <span className="owner-row-meta">
                  {record.data.visible ? 'Eligible draft' : 'Hidden draft'} ·{' '}
                  {record.versionId
                    ? `saved version ${record.versionId}`
                    : 'No saved content version'}{' '}
                  · order {String(record.data.sortOrder ?? 0)}
                </span>
              </div>
              <Link
                className="owner-button"
                href={`/owner/content/${collection.slug}/${record.id}`}
              >
                Edit →
              </Link>
            </div>
          ))
        )}
      </section>
      {result && result.totalPages > 1 && (
        <nav className="owner-actions" aria-label="Record pages">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {result.totalPages}
          </span>
          <button
            disabled={page >= result.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </>
  );
}
