import { createLocalReq, getPayload } from 'payload';
import config from '@/cms/config';
import { jobsAuthorized } from '@/owner/jobs-auth';
import { processSchedules, workerHeartbeat } from '@/owner/service';
import { boundedBytes } from '@/owner/request-body';
import type { CollectionSlug } from 'payload';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const headers = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
};
export async function POST(request: Request) {
  if (!jobsAuthorized(request.headers.get('x-desan-job-secret')))
    return Response.json(
      { error: 'Job authorization required' },
      { status: 401, headers },
    );
  try {
    await boundedBytes(request, 1024, 5000);
    const payload = await getPayload({ config });
    const owners = await payload.find({
      collection: 'owners',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const owner = owners.docs[0];
    if (!owner || owner.role !== 'owner')
      return Response.json(
        { error: 'Enabled owner required' },
        { status: 503, headers },
      );
    const req = await createLocalReq(
      { user: { ...owner, collection: 'owners' } },
      payload,
    );
    const now = new Date();
    const due = await payload.count({
      collection: 'owner-state' as CollectionSlug,
      where: {
        and: [
          { kind: { equals: 'schedule' } },
          { status: { equals: 'pending' } },
          { runAt: { less_than_equal: now.toISOString() } },
        ],
      },
      overrideAccess: true,
      req,
    });
    // No heartbeat/keepalive write when no real due job exists. Native Cron also
    // checks EXISTS before invoking this endpoint, reducing needless wakeups.
    if (!due.totalDocs) return Response.json({ processed: [] }, { headers });
    await workerHeartbeat(payload, req);
    const results = await processSchedules(payload, req, now, {
      limit: 3,
      deadlineAt: Date.now() + 40000,
    });
    return Response.json(
      {
        processed: results.map((result) => ({
          id: result.id,
          status: result.status,
        })),
      },
      { headers },
    );
  } catch {
    return Response.json(
      {
        error:
          'Scheduled delivery could not complete; pending jobs remain durable',
      },
      { status: 503, headers },
    );
  }
}
