import { getPublicSite } from '@/public-data/server';
import { PublicPage } from '@/components/public/public-page';
import { Action, PageIntro } from '@/components/public/primitives';
import { Suspense } from 'react';
import Link from '@/components/public/public-link';
import type { PublicSite } from '@/public-data';
function MissingMessage() {
  return (
    <main className="content section">
      <p className="eyebrow">404 · Page not found</p>
      <h1>Lost in thought?</h1>
      <p>This page may have moved, or is not available.</p>
      <Link href="/">Back home</Link> ·{' '}
      <Link href="/search">Search the site</Link>
    </main>
  );
}
async function DesignedMissing({ site }: { site?: PublicSite }) {
  return (
    <PublicPage
      site={site ?? (await getPublicSite())}
      pageId="not-found"
      slots={{
        'not-found.hero': (
          <section className="content section">
            <PageIntro
              page="not-found"
              title="Lost in thought?"
              eyebrow="404 · Page not found"
            >
              This page may have moved, or is not available.
            </PageIntro>
            <div className="button-group">
              <Action primary href="/">
                Back home
              </Action>
              <Action href="/search">Search the site</Action>
            </div>
          </section>
        ),
      }}
    />
  );
}
export default function Missing({ site }: { site?: PublicSite } = {}) {
  return (
    <Suspense fallback={<MissingMessage />}>
      <DesignedMissing site={site} />
    </Suspense>
  );
}
