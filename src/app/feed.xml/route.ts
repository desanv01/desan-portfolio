import { getPublicSite } from '@/public-data/server';
import { rss } from '@/public-data/discovery';
export const dynamic = 'force-dynamic';
export async function GET() {
  const site = await getPublicSite();
  if (site.status === 'unavailable')
    return new Response('Temporarily unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  return new Response(rss(site), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
