import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { getPayload } from 'payload';
import config from '@/cms/config';
import { currentPublication } from '@/cms/publication';
import { mediaDirectory } from '@/cms/media';

export const dynamic = 'force-dynamic';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await getPayload({ config });
  const { id } = await params;
  const current = await currentPublication(payload);
  const media = current?.media.find((m) => String(m.id) === id);
  if (
    !media ||
    typeof media.filename !== 'string' ||
    basename(media.filename) !== media.filename
  )
    return new Response(null, { status: 404 });
  try {
    const bytes = await readFile(resolve(mediaDirectory, media.filename));
    if (createHash('sha256').update(bytes).digest('hex') !== media.sha256)
      return new Response(null, { status: 404 });
    return new Response(bytes, {
      headers: {
        'Content-Type': String(media.mimeType),
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
