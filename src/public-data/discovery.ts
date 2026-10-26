import type { Metadata } from 'next';
import {
  list,
  safeHref,
  records,
  recordBySlug,
  relationshipId,
  text,
  type PublicRecord,
  type PublicSite,
} from './index';

export function structuredData(
  site: PublicSite,
  pageId: string,
  record?: PublicRecord,
  origin = siteOrigin(),
): Record<string, unknown> | null {
  if (site.status !== 'ready') return null;
  const profile = records(site, 'profile')[0];
  const name = text(profile?.displayName, 'Desan Vasu');
  const person = {
    '@type': 'Person',
    '@id': origin + '/#person',
    name,
    url: origin + '/profile',
    sameAs: list(profile?.links)
      .map((link) => safeHref(link.url))
      .filter((url) => url?.startsWith('https://')),
  };
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': origin + '/#website',
      name,
      url: origin + '/',
    },
    person,
  ];
  if (record && ['case-study', 'article'].includes(pageId))
    graph.push({
      '@type': pageId === 'article' ? 'BlogPosting' : 'CreativeWork',
      '@id':
        origin + (pageId === 'article' ? '/journal/' : '/work/') + record.slug,
      name: record.title,
      headline: record.title,
      description: record.summary || '',
      author: { '@id': origin + '/#person' },
    });
  return { '@context': 'https://schema.org', '@graph': graph };
}
export function serializeStructuredData(
  value: Record<string, unknown>,
): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function siteOrigin(
  configured = process.env.PUBLIC_SITE_URL ||
    process.env.CMS_SERVER_URL ||
    'http://127.0.0.1:3000',
): string {
  try {
    const url = new URL(configured);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error();
    return url.origin;
  } catch {
    return 'http://127.0.0.1:3000';
  }
}
export function publicOrigin(origin: string): boolean {
  const url = new URL(origin);
  return (
    url.protocol === 'https:' &&
    !/^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/.test(
      url.hostname,
    ) &&
    !url.hostname.endsWith('.invalid') &&
    !url.hostname.endsWith('.local')
  );
}
export function indexable(origin = siteOrigin()): boolean {
  return process.env.PUBLIC_SITE_INDEXABLE === '1' && publicOrigin(origin);
}
export const staticRoutes = {
  '/': 'Home',
  '/work': 'Work',
  '/profile': 'Profile',
  '/journal': 'Journal',
  '/contact': 'Contact',
  '/resume': 'Resume',
};
export function discoveryRoutes(site: PublicSite): string[] {
  if (site.status !== 'ready') return [];
  return [
    ...Object.keys(staticRoutes),
    ...records(site, 'projects').map((record) => `/work/${record.slug}`),
    ...records(site, 'posts').map((record) => `/journal/${record.slug}`),
  ];
}
export function routeRecord(
  site: PublicSite,
  path: string,
): PublicRecord | undefined {
  if (path.startsWith('/work/'))
    return recordBySlug(site, 'projects', path.slice(6));
  if (path.startsWith('/journal/'))
    return recordBySlug(site, 'posts', path.slice(9));
  return path === '/' || path === '/profile'
    ? records(site, 'profile')[0]
    : undefined;
}
export function routeMetadata(
  site: PublicSite,
  path: string,
  origin = siteOrigin(),
): Metadata {
  if (!discoveryRoutes(site).includes(path))
    return { title: 'Page not found', robots: { index: false, follow: false } };
  const profile = records(site, 'profile')[0],
    settings = records(site, 'site-settings')[0],
    record = routeRecord(site, path);
  const seo = (record?.seo ||
    (path === '/' ? settings?.seo : {}) ||
    {}) as Record<string, unknown>;
  const brand = text(profile?.displayName, 'Desan Vasu');
  const title = text(
    seo.title,
    path === '/'
      ? brand
      : record?.title ||
          staticRoutes[path as keyof typeof staticRoutes] ||
          brand,
  );
  const description = text(
    seo.description,
    record?.summary ||
      text(profile?.headline, 'Work, ideas and the process behind them.'),
  );
  const imageId = relationshipId(seo.image);
  const media =
    site.status === 'ready'
      ? site.publication.media.find(
          (item) =>
            String(item.id) === imageId && item.mimeType.startsWith('image/'),
        )
      : undefined;
  const image = {
    url: media
      ? new URL(media.url, origin).href
      : `${origin}/social-image?path=${encodeURIComponent(path)}`,
    width: media ? undefined : 1200,
    height: media ? undefined : 630,
    alt: media?.alt || title,
  };
  return {
    title: { absolute: path === '/' ? title : `${title} — ${brand}` },
    description,
    alternates: {
      canonical: new URL(path, origin).href,
      types: { 'application/rss+xml': `${origin}/feed.xml` },
    },
    robots: { index: indexable(origin), follow: indexable(origin) },
    openGraph: {
      type: path.startsWith('/journal/') ? 'article' : 'website',
      title,
      description,
      url: new URL(path, origin).href,
      siteName: brand,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  };
}
export const xml = (value: string): string =>
  value.replace(
    /[<>&"']/g,
    (char) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      })[char]!,
  );
export function rss(site: PublicSite, origin = siteOrigin()): string {
  const profile = records(site, 'profile')[0];
  const items = records(site, 'posts')
    .map((post) => {
      const url = `${origin}/journal/${post.slug}`;
      const date = text(post.editorialDate);
      const fullDate =
        /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date))
          ? new Date(date).toUTCString()
          : '';
      return `<item><title>${xml(post.title)}</title><link>${xml(url)}</link><guid isPermaLink="true">${xml(url)}</guid><description>${xml(post.summary || '')}</description>${fullDate ? `<pubDate>${fullDate}</pubDate>` : ''}</item>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${xml(text(profile?.displayName, 'Desan Vasu'))} — Journal</title><link>${xml(origin + '/journal')}</link><description>Published updates and writing.</description><atom:link href="${xml(origin + '/feed.xml')}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
}
