import { readFileSync } from 'node:fs';
import { X509Certificate } from 'node:crypto';

/** One trusted configuration value, never inferred from request Host/forwarded
 * headers. HTTPS deployments require Secure owner cookies; local HTTP remains
 * usable for evaluation and isolated acceptance checks. */
export function cmsOrigin(
  value = process.env.CMS_SERVER_URL || 'http://127.0.0.1:3000',
): string {
  try {
    const url = new URL(value);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !['', '/'].includes(url.pathname)
    )
      throw new Error();
    return url.origin;
  } catch {
    throw new Error(
      'CMS_SERVER_URL must be an HTTP(S) origin without credentials, path, query or fragment',
    );
  }
}
export function ownerCookiePolicy(value?: string) {
  return {
    secure: new URL(cmsOrigin(value)).protocol === 'https:',
    sameSite: 'Lax' as const,
  };
}
export function postgresPoolOptions(env = process.env) {
  let connectionString = env.DATABASE_URI || '';
  const cloud = env.VERCEL === '1' || env.MEDIA_STORAGE === 'supabase';
  const url = new URL(connectionString);
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  const max = env.DATABASE_POOL_MAX
    ? Number(env.DATABASE_POOL_MAX)
    : cloud
      ? 3
      : 10;
  if (!Number.isSafeInteger(max) || max < 2 || max > 20)
    throw new Error('DATABASE_POOL_MAX must be between 2 and 20');
  const explicitLocal = loopback && env.DATABASE_SSL === '0';
  const verifiedTLS =
    !explicitLocal &&
    (cloud ||
      !loopback ||
      env.DATABASE_SSL === '1' ||
      !!env.DATABASE_SSL_CA ||
      !!env.DATABASE_SSL_CA_FILE ||
      ['require', 'verify-ca', 'verify-full', 'no-verify'].includes(
        url.searchParams.get('sslmode') || '',
      ));
  if (!verifiedTLS) return { connectionString, max };
  let ca = env.DATABASE_SSL_CA?.replace(/\\n/g, '\n');
  if (!ca && env.DATABASE_SSL_CA_FILE)
    ca = readFileSync(
      /*turbopackIgnore: true*/ env.DATABASE_SSL_CA_FILE,
      'utf8',
    );
  if (ca) {
    try {
      new X509Certificate(ca);
    } catch {
      throw new Error(
        'DATABASE_SSL_CA must contain a valid trusted provider certificate',
      );
    }
  }
  // node-postgres URL SSL parameters otherwise replace the verified SSL object.
  for (const key of [
    'sslmode',
    'sslcert',
    'sslkey',
    'sslrootcert',
    'uselibpqcompat',
  ])
    url.searchParams.delete(key);
  connectionString = url.toString();
  return {
    connectionString,
    max,
    ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  };
}
