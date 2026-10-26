import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { EmailAdapter } from 'payload';
import { APIError } from 'payload';

function spoolDirectory() {
  return resolve(
    /*turbopackIgnore: true*/ process.env.RECOVERY_SPOOL_DIRECTORY ||
      'tmp/phase3-recovery',
  );
}
export async function ensureRecoveryAvailable(): Promise<void> {
  if (process.env.LOCAL_RECOVERY_SPOOL !== '1')
    throw new APIError('Recovery delivery is unavailable', 503);
  try {
    const dir = spoolDirectory();
    await mkdir(dir, { recursive: true, mode: 0o700 });
    const probe = resolve(dir, `.probe-${randomUUID()}`);
    await writeFile(probe, '', { mode: 0o600 });
    await unlink(probe);
  } catch {
    throw new APIError('Recovery delivery is unavailable', 503);
  }
}

// Explicit local-only recovery spool. Production delivery requires a real adapter.
export const localRecoveryEmail: EmailAdapter = () => ({
  name: 'local-private-recovery-spool',
  defaultFromAddress: 'no-reply@example.invalid',
  defaultFromName: 'Local owner recovery',
  sendEmail: async (message) => {
    try {
      await writeFile(
        resolve(spoolDirectory(), `${randomUUID()}.json`),
        JSON.stringify(message),
        { mode: 0o600 },
      );
    } catch {
      // Account-independent preflight normally detects this. A race after preflight
      // must still not reveal whether the requested account exists.
      console.error('Local recovery delivery failed after availability check');
    }
  },
});
