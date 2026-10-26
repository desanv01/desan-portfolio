import Link from 'next/link';
import { getPublicSite } from '@/public-data/server';
import { recordPath, searchRecords } from '@/public-data';
import { PublicPage } from '@/components/public/public-page';
import {
  EmptyState,
  PageIntro,
  Pagination,
  PublicationNotice,
  SearchForm,
} from '@/components/public/primitives';
import { queryValue, type Query } from '@/components/public/library';
export const metadata = { title: 'Search' };
export default async function Search({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const site = await getPublicSite();
  const query = await searchParams;
  const q = queryValue(query, 'q');
  const result = searchRecords(site, q, {
    page: queryValue(query, 'page'),
    pageSize: 12,
  });
  return (
    <PublicPage
      site={site}
      pageId="search"
      slots={{
        'search.hero': (
          <section
            className="content reading-content"
            id="search"
            data-section="Search"
            tabIndex={-1}
          >
            <PageIntro page="search" title="Search">
              Find a project, skill or{' '}
              <span className="expressive">an idea.</span>
            </PageIntro>
            <PublicationNotice site={site} />
            <SearchForm
              action="/search"
              page="search"
              initial={q}
              label="Search the site"
            />
          </section>
        ),
        'search.results': (
          <section
            className="section content reading-content"
            id="results"
            data-section="Results"
            tabIndex={-1}
          >
            {q ? (
              <>
                <p className="results-summary">
                  {result.total} results for “{q}”
                </p>
                {result.items.length ? (
                  result.items.map(({ collection, record }) => (
                    <article
                      key={`${collection}-${record.id}`}
                      className="journal-row"
                      data-design-node="search.card"
                    >
                      <span className="journal-date">
                        {collection.replaceAll('-', ' ')}
                      </span>
                      <div>
                        <h2 style={{ fontSize: 28 }}>
                          <Link href={recordPath(collection, record)}>
                            {record.title}
                          </Link>
                        </h2>
                        <p>{record.summary}</p>
                      </div>
                      <span aria-hidden="true">↗</span>
                    </article>
                  ))
                ) : (
                  <EmptyState page="search" title="No results found.">
                    Try another word or browse Work, Profile and Journal.
                  </EmptyState>
                )}
                <Pagination path="/search" {...result} query={{ q }} />
              </>
            ) : (
              <EmptyState page="search" title="What are you looking for?">
                Enter a search above to explore published content.
              </EmptyState>
            )}
          </section>
        ),
      }}
    />
  );
}
