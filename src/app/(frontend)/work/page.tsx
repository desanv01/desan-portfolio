import { routeMetadata } from '@/public-data/discovery';
import { getPublicSite } from '@/public-data/server';
import { Library, type Query } from '@/components/public/library';
export default async function Work({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  return (
    <Library
      site={await getPublicSite()}
      kind="work"
      query={await searchParams}
    />
  );
}

export async function generateMetadata() {
  return routeMetadata(await getPublicSite(), '/work');
}
