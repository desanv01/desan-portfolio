import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPayload } from 'payload';
import config from '@/cms/config';
import { OwnerAuth } from '@/components/owner/owner-auth';
import { OwnerWorkspace } from '@/components/owner/workspace';

export const dynamic = 'force-dynamic';
export default async function OwnerPage({
  params,
  searchParams,
}: {
  params: Promise<{ segments?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const segments = (await params).segments || [];
  if (
    segments.length === 1 &&
    ['login', 'recovery', 'reset'].includes(segments[0])
  ) {
    const query = await searchParams;
    return (
      <OwnerAuth
        mode={segments[0] as 'login' | 'recovery' | 'reset'}
        token={typeof query.token === 'string' ? query.token : ''}
      />
    );
  }
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  if (!user || user.collection !== 'owners' || user.role !== 'owner')
    redirect('/owner/login');
  return <OwnerWorkspace segments={segments} email={user.email} />;
}
