'use client';
import { useState } from 'react';
import { paginate, type PublicRecord, type PublicSite } from '@/public-data';
import { useDesignBehavior } from './design-context';
import { EmptyState, JournalRows, Pagination, ProjectGrid } from './primitives';
import { presentCollection } from './collection-order';

export function LibraryResults({
  items,
  site,
  kind,
  requestedPage,
  query,
}: {
  items: PublicRecord[];
  site: PublicSite;
  kind: 'work' | 'journal';
  requestedPage: string;
  query: Record<string, string>;
}) {
  const config = useDesignBehavior(`${kind}.pagination`);
  const [extraPages, setExtraPages] = useState(0);
  const collection = useDesignBehavior(`${kind}.grid`);
  const ordered = presentCollection(items, collection);
  const pageSize = kind === 'work' ? 6 : 8;
  const result = paginate(ordered, { page: requestedPage, pageSize });
  const loadMore = config['pagination.presentation'] === 'load-more';
  const visible = loadMore
    ? ordered.slice(0, (result.page + extraPages) * pageSize)
    : result.items;
  return (
    <>
      <p className="results-summary">
        {ordered.length} {ordered.length === 1 ? 'result' : 'results'}
      </p>
      {visible.length ? (
        kind === 'work' ? (
          <ProjectGrid items={visible} site={site} />
        ) : (
          <JournalRows items={visible} />
        )
      ) : (
        <EmptyState page={kind} title="No matching results.">
          Try another search or clear the filters.
        </EmptyState>
      )}
      {loadMore ? (
        <div className="pagination" data-design-node={`${kind}.pagination`}>
          <span>
            {visible.length} of {ordered.length}
          </span>
          {visible.length < ordered.length && (
            <button
              className="button secondary"
              onClick={() => setExtraPages((value) => value + 1)}
            >
              Load more
            </button>
          )}
        </div>
      ) : (
        <Pagination
          path={`/${kind}`}
          {...result}
          query={query}
          node={`${kind}.pagination`}
        />
      )}
    </>
  );
}
