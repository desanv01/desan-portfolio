import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createLocalReq, getPayload } from 'payload';
import config from '@/cms/config';
import { ownerRequest } from '@/cms/access';
import { readPreview } from '@/owner/service';
import { publicSiteFromPublication } from '@/public-data';
import { ownerPreviewContext } from '@/public-data/owner-preview-context';
import { DesignStudioPreviewProvider } from '@/components/owner/design-studio-preview';
import { PreviewNavigation } from '@/components/owner/preview-navigation';
import Home from '@/app/(frontend)/page';
import Work from '@/app/(frontend)/work/page';
import CaseStudy from '@/app/(frontend)/work/[slug]/page';
import Profile from '@/app/(frontend)/profile/page';
import Journal from '@/app/(frontend)/journal/page';
import Article from '@/app/(frontend)/journal/[slug]/page';
import Contact from '@/app/(frontend)/contact/page';
import Resume from '@/app/(frontend)/resume/page';
import Search from '@/app/(frontend)/search/page';
import Missing from '@/app/(frontend)/not-found';

export const dynamic = 'force-dynamic';
export default async function Preview({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  const req = await createLocalReq({ user: user || undefined }, payload);
  if (!ownerRequest(req)) redirect('/owner/login');
  const query = await searchParams;
  const path = (await params).path || [];
  const receipt = typeof query.receipt === 'string' ? query.receipt : '';
  if (!/^[a-f0-9-]{36}$/.test(receipt))
    return (
      <main className="page-container">
        <h1>Private preview needs a selection</h1>
        <p>Create a private preview from Publishing or Design Studio first.</p>
      </main>
    );
  let stored;
  try {
    stored = await readPreview(payload, req, receipt);
  } catch {
    return (
      <main className="page-container">
        <h1>Preview unavailable</h1>
        <p>
          Create a fresh preview from the saved versions you want to review.
        </p>
      </main>
    );
  }
  // Run the normal projection validator without widening its public URL policy.
  const canonical = {
    ...stored.publication,
    media: stored.publication.media.map((item) => ({
      ...item,
      url: `/api/public/media/${item.id}`,
    })),
  };
  const site = publicSiteFromPublication(canonical);
  if (site.status !== 'ready')
    return (
      <main className="page-container">
        <h1>Preview validation failed</h1>
        <p>The saved selection could not be rendered safely.</p>
      </main>
    );
  site.publication.media = site.publication.media.map((item) => ({
    ...item,
    url: `/api/owner/media/${item.id}`,
  }));
  const content = await ownerPreviewContext.run(site, async () => {
    const route = path.join('/');
    const cleanQuery = { ...query };
    delete cleanQuery.receipt;
    if (!route) return Home();
    if (route === 'work')
      return Work({ searchParams: Promise.resolve(cleanQuery) });
    if (path[0] === 'work' && path.length === 2)
      return CaseStudy({ params: Promise.resolve({ slug: path[1] }) });
    if (route === 'profile')
      return Profile({ searchParams: Promise.resolve(cleanQuery) });
    if (route === 'journal')
      return Journal({ searchParams: Promise.resolve(cleanQuery) });
    if (path[0] === 'journal' && path.length === 2)
      return Article({ params: Promise.resolve({ slug: path[1] }) });
    if (route === 'contact') return Contact();
    if (route === 'resume') return Resume();
    if (route === 'search')
      return Search({ searchParams: Promise.resolve(cleanQuery) });
    return Missing();
  });
  return (
    <DesignStudioPreviewProvider>
      <PreviewNavigation receipt={receipt} />
      <div
        role="status"
        style={{
          padding: '6px 16px',
          background: '#edac68',
          color: '#111',
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        PRIVATE PREVIEW · Saved selection · Live site unchanged
      </div>
      {content}
    </DesignStudioPreviewProvider>
  );
}
