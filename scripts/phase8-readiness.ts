import { cmsOrigin, postgresPoolOptions } from '../src/cms/runtime-policy';
import { storageConfig } from '../src/cms/media-storage';

const production = process.argv.includes('--production');
const checks: { id: string; ok: boolean; note: string }[] = [];
function check(id: string, operation: () => boolean, note: string) {
  let ok = false;
  try {
    ok = operation();
  } catch {
    /* no raw configuration/errors in output */
  }
  checks.push({ id, ok, note });
}
check(
  'cms-origin',
  () => {
    const url = new URL(cmsOrigin());
    return (
      !production ||
      (url.protocol === 'https:' &&
        !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    );
  },
  'Production uses the exact public HTTPS owner/API origin.',
);
check(
  'application-secret',
  () => !!process.env.PAYLOAD_SECRET && process.env.PAYLOAD_SECRET.length >= 32,
  'Preserve the random application secret in separate encrypted escrow.',
);
check(
  'database-tls',
  () => {
    const options = postgresPoolOptions();
    return !production || options.ssl?.rejectUnauthorized === true;
  },
  'Remote/cloud database TLS must verify hostname and the trusted provider CA.',
);
check(
  'private-storage-configuration',
  () =>
    !production ||
    (process.env.MEDIA_STORAGE === 'supabase' && !!storageConfig()),
  'Live bucket privacy/permissions require a separate network acceptance receipt.',
);
check(
  'durable-metadata-cache',
  () => !production || process.env.GITHUB_METADATA_CACHE_STORAGE === 'supabase',
  'Public pages read the private durable cache; they never refresh GitHub.',
);
check(
  'managed-scheduler-credentials',
  () =>
    !production ||
    (process.env.SCHEDULE_MODE === 'managed' &&
      (process.env.JOBS_SECRET?.length || 0) >= 32),
  'Verify native Cron/Vault/due-only delivery separately; configured does not mean healthy.',
);
check(
  'operator-recovery',
  () =>
    !production ||
    (process.env.OWNER_RECOVERY_MODE === 'operator' &&
      process.env.LOCAL_RECOVERY_SPOOL !== '1'),
  'Email delivery is not configured; operator recovery must be explicitly selected and rehearsed.',
);
check(
  'canonical-origin',
  () =>
    !production || cmsOrigin(process.env.PUBLIC_SITE_URL || '') === cmsOrigin(),
  'Production canonical and owner/API origins must agree.',
);
check(
  'client-secret-boundary',
  () =>
    !Object.keys(process.env).some((name) =>
      /^NEXT_PUBLIC_(?:PAYLOAD_SECRET|DATABASE_URI|SUPABASE_(?:SECRET|SERVICE_ROLE)_KEY|JOBS_SECRET)$/.test(
        name,
      ),
    ),
  'Server credentials must never be published in client environment variables.',
);
console.log(
  JSON.stringify(
    { production, passed: checks.every((item) => item.ok), checks },
    null,
    2,
  ),
);
if (checks.some((item) => !item.ok)) process.exitCode = 1;
