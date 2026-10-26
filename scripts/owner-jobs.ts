import { createLocalReq, getPayload } from 'payload';
import config from '../src/cms/config';
import { processSchedules, workerHeartbeat } from '../src/owner/service';
import { setTimeout } from 'node:timers/promises';

if (process.argv[2] !== 'run') throw new Error('Usage: owner-jobs.ts run');
const payload = await getPayload({ config });
let running = true;
const stop = new AbortController();
function shutdown() {
  running = false;
  stop.abort();
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
try {
  // Local execution is an explicitly trusted operator action. It cannot accept
  // an arbitrary user, selection or publication revision on the command line.
  const owners = await payload.find({
    collection: 'owners',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const owner = owners.docs[0];
  if (!owner || owner.role !== 'owner')
    throw new Error('An existing owner is required');
  const req = await createLocalReq(
    { user: { ...owner, collection: 'owners' } },
    payload,
  );
  const watch = process.argv.includes('--watch');
  try {
    do {
      if (watch) await workerHeartbeat(payload, req);
      const results = await processSchedules(payload, req);
      if (results.length || !watch)
        console.log(
          JSON.stringify({
            processed: results.map((s) => ({ id: s.id, status: s.status })),
          }),
        );
      if (watch && running)
        await setTimeout(5000, undefined, { signal: stop.signal }).catch(
          (error) => {
            if (error.name !== 'AbortError') throw error;
          },
        );
    } while (watch && running);
  } finally {
    if (watch) await workerHeartbeat(payload, req, true);
  }
} finally {
  await payload.destroy();
}
// Payload 3.92's held initial PostgreSQL checkout outlives destroy; all work is
// awaited above. Match the established backend CLI lifecycle workaround.
process.exit(0);
