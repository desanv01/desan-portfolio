import { getPayload, createLocalReq } from 'payload';
import config from '@/cms/config';
import {
  currentPublication,
  publish,
  type PublicationInput,
} from '@/cms/publication';
import { ownerRequest } from '@/cms/access';

export const dynamic = 'force-dynamic';
export async function GET() {
  const payload = await getPayload({ config });
  const current = await currentPublication(payload);
  return Response.json(current, {
    headers: {
      'Cache-Control': 'no-store',
      ETag: `"${current?.revision || 'empty'}"`,
    },
  });
}
export async function POST(request: Request) {
  const expectedOrigin = new URL(
    process.env.CMS_SERVER_URL || 'http://127.0.0.1:3000',
  ).origin;
  if (request.headers.get('origin') !== expectedOrigin)
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
    const publication = await publish(
      payload,
      req,
      (await request.json()) as PublicationInput,
    );
    return Response.json(
      { revision: publication.revision },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      { error: 'Publication rejected: invalid selection or stale revision' },
      { status: 409 },
    );
  }
}
