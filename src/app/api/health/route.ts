// Process liveness only. This does not check database or CMS readiness.
export const dynamic = 'force-dynamic';

export function GET(): Response {
  return Response.json(
    { status: 'ok', scope: 'process' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
