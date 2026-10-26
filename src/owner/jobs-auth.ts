import { createHash, timingSafeEqual } from 'node:crypto';
export function jobsAuthorized(
  provided: string | null,
  expected = process.env.JOBS_SECRET,
): boolean {
  if (
    !expected ||
    expected.length < 32 ||
    expected.length > 256 ||
    !provided ||
    provided.length > 256
  )
    return false;
  return timingSafeEqual(
    createHash('sha256').update(provided).digest(),
    createHash('sha256').update(expected).digest(),
  );
}
