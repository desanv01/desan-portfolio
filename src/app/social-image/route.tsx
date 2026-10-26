import { ImageResponse } from 'next/og';
import { getPublicSite } from '@/public-data/server';
import {
  discoveryRoutes,
  routeRecord,
  staticRoutes,
} from '@/public-data/discovery';
import { records, text } from '@/public-data';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path') || '/';
  const site = await getPublicSite();
  if (!discoveryRoutes(site).includes(path))
    return new Response('Not found', {
      status: site.status === 'unavailable' ? 503 : 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  const record = routeRecord(site, path),
    profile = records(site, 'profile')[0];
  const title = (
    record?.title || staticRoutes[path as keyof typeof staticRoutes]
  ).slice(0, 140);
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#101315',
        color: '#f5f2eb',
        padding: 72,
        justifyContent: 'space-between',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 26,
          color: '#e8ad65',
          letterSpacing: 4,
        }}
      >
        {text(profile?.displayName, 'Desan Vasu').slice(0, 70)} / PORTFOLIO
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 64,
          lineHeight: 1.1,
          fontWeight: 700,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', fontSize: 24, color: '#b9bebc' }}>
        {(
          record?.summary ||
          text(profile?.headline, 'Work, ideas and the process behind them.')
        ).slice(0, 180)}
      </div>
    </div>,
    { width: 1200, height: 630, headers: { 'Cache-Control': 'no-store' } },
  );
}
