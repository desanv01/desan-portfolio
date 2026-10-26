export const OWNER_JSON_BYTES = 3 * 1024 * 1024;
export const OWNER_MULTIPART_BYTES = 11 * 1024 * 1024;
export function ownerRequestLimitBytes() {
  return cloudMedia() ? CLOUD_MEDIA_BYTES + 256 * 1024 : OWNER_MULTIPART_BYTES;
}
export class RequestBodyError extends Error {
  constructor(
    message: string,
    public status: 400 | 408 | 413,
  ) {
    super(message);
  }
}

/** Enforce actual UTF-8/wire bytes while streaming, before JSON/multipart parsers
 * allocate an arbitrary body. A dishonest/missing length cannot bypass the cap. */
export async function boundedBytes(
  request: Request,
  maximum: number,
  timeoutMs = 60000,
): Promise<Uint8Array<ArrayBuffer>> {
  const length = request.headers.get('content-length');
  if (
    length &&
    (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length)))
  ) {
    void request.body?.cancel().catch(() => {});
    throw new RequestBodyError('Invalid request length', 400);
  }
  if (length && Number(length) > maximum) {
    void request.body?.cancel().catch(() => {});
    throw new RequestBodyError('Request exceeds the editing limit', 413);
  }
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let expired = false;
  const timer = setTimeout(() => {
    expired = true;
    void reader.cancel().catch(() => {});
  }, timeoutMs);
  try {
    while (true) {
      const result = await reader.read();
      if (expired)
        throw new RequestBodyError(
          'Request body timed out; your local edits are retained',
          408,
        );
      if (result.done) break;
      size += result.value.byteLength;
      if (size > maximum)
        throw new RequestBodyError('Request exceeds the editing limit', 413);
      chunks.push(result.value);
    }
    const output = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return output;
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError(
      'Request body could not be read; your local edits are retained',
      400,
    );
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
}
export async function ownerJSON(
  request: Request,
): Promise<Record<string, unknown>> {
  const bytes = await boundedBytes(request, OWNER_JSON_BYTES);
  try {
    const value = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(bytes),
    );
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error();
    return value;
  } catch {
    throw new RequestBodyError('A valid JSON object is required', 400);
  }
}
export async function ownerFormData(request: Request): Promise<FormData> {
  const bytes = await boundedBytes(request, ownerRequestLimitBytes());
  try {
    return await new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': request.headers.get('content-type') || '' },
      body: bytes,
    }).formData();
  } catch {
    throw new RequestBodyError('A valid multipart upload is required', 400);
  }
}
import { cloudMedia, CLOUD_MEDIA_BYTES } from '../cms/media-storage';
