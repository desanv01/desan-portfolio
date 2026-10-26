import { createHash } from 'node:crypto';
import { createLocalReq, type Payload, type PayloadRequest } from 'payload';

/** PostgreSQL transaction advisory locks also cover absent rows and draft tables. */
export async function lock(payload: Payload, req: PayloadRequest, key: string) {
  const transactionID = await req.transactionID;
  if (!transactionID) throw new Error('A transaction is required');
  const adapter = payload.db as unknown as {
    sessions: Record<string, { db: unknown }>;
    execute: (args: { db: unknown; raw: string }) => Promise<unknown>;
  };
  const numericKey = createHash('sha256')
    .update(`desan-owner:${key}`)
    .digest()
    .readBigInt64BE();
  await adapter.execute({
    db: adapter.sessions[transactionID].db,
    raw: `SELECT pg_advisory_xact_lock(${numericKey})`,
  });
}

export async function transaction<T>(
  payload: Payload,
  userReq: PayloadRequest,
  key: string,
  operation: (req: PayloadRequest) => Promise<T>,
  isolationLevel: 'read committed' | 'repeatable read' = 'read committed',
): Promise<T> {
  // READ COMMITTED takes its first read after the blocking lock, so waiting saves
  // observe the committed winner rather than a stale serializable snapshot.
  const transactionID = await payload.db.beginTransaction({ isolationLevel });
  if (!transactionID) throw new Error('A database transaction is required');
  const req = await createLocalReq(
    { user: userReq.user || undefined, req: { transactionID } },
    payload,
  );
  try {
    // Merge discovery must precede every cooperating skill/edge write, before
    // per-record locks are acquired. Covers saves, restores and both importers.
    if (
      key === 'skill-merge' ||
      /^record:(skills|associations):/.test(key) ||
      key === 'recovery-import' ||
      key === 'reviewed-content-import'
    )
      await lock(payload, req, 'skill-association-writers');
    await lock(payload, req, key);
    const result = await operation(req);
    await payload.db.commitTransaction(transactionID);
    return result;
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID);
    throw error;
  }
}
