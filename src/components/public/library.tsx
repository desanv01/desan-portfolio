import Link from './public-link';
import {
  filterRecords,
  paginate,
  records,
  text,
  type PublicSite,
} from '@/public-data';
import { PublicPage } from './public-page';
import {
  PageIntro,
  PublicationNotice,
  queryURL,
  SearchForm,
} from './primitives';
import { LibraryResults } from './library-results';
import { BoundFilterBar } from './bound-form';

export type Query = Record<string, string | string[] | undefined>;
export const queryValue = (query: Query, key: string) =>
  typeof query[key] === 'string' ? query[key].slice(0, 200) : '';
export function Library({
  site,
  kind,
  query,
}: {
  site: PublicSite;
  kind: 'work' | 'journal';
  query: Query;
}) {
  const work = kind === 'work';
  const all = records(site, work ? 'projects' : 'posts');
  const field = work ? 'discipline' : 'kind';
  const selected = queryValue(query, field);
  const q = queryValue(query, 'q');
  const choices = [
    ...new Set(all.map((record) => text(record[field])).filter(Boolean)),
  ];
  const filtered = filterRecords(all, { query: q, [field]: selected });
  const result = paginate(filtered, {
    page: queryValue(query, 'page'),
    pageSize: work ? 6 : 8,
  });
  const path = `/${kind}`;
  return (
    <PublicPage
      site={site}
      pageId={kind}
      slots={{
        [`${kind}.hero`]: (
          <section
            className="content"
            id="overview"
            data-section="Overview"
            tabIndex={-1}
          >
            <PageIntro page={kind} title={work ? 'Work' : 'Journal'}>
              {work ? (
                <>
                  Ideas into <span className="expressive">working things.</span>
                </>
              ) : (
                <>
                  Notes, ideas &amp;{' '}
                  <span className="expressive">things learned.</span>
                </>
              )}
            </PageIntro>
            <PublicationNotice site={site} />
            <BoundFilterBar
              node={`${kind}.filter`}
              label={work ? 'Work disciplines' : 'Journal types'}
              options={['', ...choices].map((value) => ({
                href: queryURL(path, { q, [field]: value }),
                label: value || 'All',
                selected: selected === value,
              }))}
            >
              {['', ...choices].map((value) => (
                <Link
                  key={value}
                  className="filter"
                  data-design-node={`${kind}.filter`}
                  aria-current={selected === value ? 'true' : undefined}
                  href={queryURL(path, { q, [field]: value })}
                >
                  {value || 'All'}
                </Link>
              ))}
            </BoundFilterBar>
          </section>
        ),
        [`${kind}.library`]: (
          <section
            className="section content reading-content"
            id="library"
            data-section={work ? 'Projects' : 'Entries'}
            tabIndex={-1}
          >
            <SearchForm
              action={path}
              initial={q}
              page={kind}
              hidden={selected ? { [field]: selected } : {}}
              label={work ? 'Search work' : 'Search journal'}
            />
            <div className="results-summary">
              {(q || selected) && <Link href={path}>Clear filters</Link>}
            </div>
            <LibraryResults
              key={`${q}-${selected}-${result.page}`}
              items={filtered}
              site={site}
              kind={kind}
              requestedPage={String(result.page)}
              query={{ q, [field]: selected }}
            />
          </section>
        ),
      }}
    />
  );
}
