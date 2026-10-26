import { notFound, permanentRedirect } from 'next/navigation';
import { getPublicSite } from '@/public-data/server';
import { resolveRedirect } from '@/public-data';
export default async function Unknown({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const path = `/${(await params).path.join('/')}`;
  const target = resolveRedirect(await getPublicSite(), path);
  if (target) permanentRedirect(target);
  notFound();
}
