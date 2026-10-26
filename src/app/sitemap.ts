import type { MetadataRoute } from 'next';
import { getPublicSite } from '@/public-data/server';
import { discoveryRoutes, siteOrigin } from '@/public-data/discovery';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getPublicSite();
  return discoveryRoutes(site).map((path) => ({
    url: siteOrigin() + path,
    ...(site.status === 'ready' && site.publication.publishedAt
      ? { lastModified: site.publication.publishedAt }
      : {}),
  }));
}
