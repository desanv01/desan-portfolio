import { ownerHTTP } from '@/owner/http';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ segments: string[] }> };
async function handle(request: Request, context: Context) {
  return ownerHTTP(request, (await context.params).segments);
}
export { handle as GET, handle as POST, handle as PATCH };
