import { getPublicSite } from '@/public-data/server';
import { Library, type Query } from '@/components/public/library';
export const metadata = { title: 'Journal' };
export default async function Journal({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  return (
    <Library
      site={await getPublicSite()}
      kind="journal"
      query={await searchParams}
    />
  );
}
