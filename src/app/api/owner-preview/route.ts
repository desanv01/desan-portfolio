import { getPayload, createLocalReq } from 'payload';
import config from '@/cms/config';
import { resolveSelection, type PublicationInput } from '@/cms/publication';
import { ownerRequest } from '@/cms/access';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (
    request.headers.get('origin') !==
    new URL(process.env.CMS_SERVER_URL || 'http://127.0.0.1:3000').origin
  )
    return Response.json({ error: 'Origin denied' }, { status: 403 });
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  const req = await createLocalReq({ user: user || undefined }, payload);
  if (!ownerRequest(req))
    return Response.json(
      { error: 'Owner authorization required' },
      { status: 403 },
    );
  try {
    return Response.json(
      await resolveSelection(
        payload,
        req,
        (await request.json()) as PublicationInput,
      ),
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return Response.json(
      { error: 'Preview selection rejected' },
      { status: 400 },
    );
  }
}
