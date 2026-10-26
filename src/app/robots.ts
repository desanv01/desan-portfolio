import type { MetadataRoute } from 'next';
import { indexable, siteOrigin } from '@/public-data/discovery';

// Evaluate the deployment's current canonical/indexing configuration at request time.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return indexable()
    ? {
        rules: {
          userAgent: '*',
          allow: '/',
          disallow: ['/owner', '/admin', '/api', '/search'],
        },
        sitemap: siteOrigin() + '/sitemap.xml',
      }
    : { rules: { userAgent: '*', disallow: '/' } };
}
