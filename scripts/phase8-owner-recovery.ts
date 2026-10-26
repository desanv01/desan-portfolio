import { readFile, lstat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getPayload } from 'payload';
import config from '../src/cms/config';
import { canonicalProspective, inside } from './phase8-backup.mjs';

// Trusted local operator action only, never an HTTP reset/signup bypass.
const args = process.argv.slice(2);
if (args[0] !== 'reset' || !args.includes('--confirm-owner-recovery'))
  throw new Error(
    'Explicit reset --confirm-owner-recovery --password-file PATH --database-name NAME is required',
  );
const passwordFile = args[args.indexOf('--password-file') + 1];
const expectedDatabase = args[args.indexOf('--database-name') + 1];
const database = new URL(process.env.DATABASE_URI || '').pathname.slice(1);
if (
  !args.includes('--password-file') ||
  !args.includes('--database-name') ||
  !passwordFile ||
  !expectedDatabase ||
  database !== expectedDatabase
)
  throw new Error('Confirm the exact database and private password file');
const canonicalPassword = await canonicalProspective(passwordFile);
if (inside(await canonicalProspective('public'), canonicalPassword))
  throw new Error('Password files must not be publicly served');
const info = await lstat(resolve(passwordFile));
if (
  !info.isFile() ||
  info.size > 1024 ||
  (process.platform !== 'win32' && (info.mode & 0o077) !== 0)
)
  throw new Error('Use a private owner-readable password file up to 1 KiB');
const password = (await readFile(resolve(passwordFile), 'utf8')).replace(
  /\r?\n$/,
  '',
);
if (password.length < 16 || /[\r\n]/.test(password))
  throw new Error('Use one password line of at least 16 characters');
const payload = await getPayload({ config });
try {
  const result = await payload.find({
    collection: 'owners',
    limit: 2,
    depth: 0,
    overrideAccess: true,
  });
  if (result.totalDocs !== 1 || result.docs[0]?.role !== 'owner')
    throw new Error(
      'Exactly one enabled existing owner is required; this command never creates/enables accounts',
    );
  // No authenticated current SID: Payload's password-update path clears all
  // sessions. Explicitly expire recovery state and clear failed-login lockout.
  await payload.update({
    collection: 'owners',
    id: result.docs[0].id,
    data: {
      password,
      sessions: [],
      resetPasswordToken: null,
      resetPasswordExpiration: null,
      loginAttempts: 0,
      lockUntil: null,
    } as never,
    overrideAccess: true,
  });
  console.log(
    'Owner password updated; prior sessions and recovery tokens revoked. Remove the one-time password file and verify login.',
  );
} finally {
  await payload.destroy();
}
process.exit(0);
