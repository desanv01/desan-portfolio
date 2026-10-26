import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const LOCAL_MEDIA_BYTES = 10 * 1024 * 1024;
export const CLOUD_MEDIA_BYTES = 4 * 1024 * 1024;
export function cloudMedia() {
  return process.env.MEDIA_STORAGE === 'supabase';
}
export function mediaLimitBytes() {
  return cloudMedia() ? CLOUD_MEDIA_BYTES : LOCAL_MEDIA_BYTES;
}
export class PrivateStorageError extends Error {
  constructor(public code: 'unavailable' | 'not-found' = 'unavailable') {
    super(
      'Private storage is temporarily unavailable. Your local edits are retained.',
    );
  }
}
export type StorageConfig = {
  url: string;
  key: string;
  mediaBucket: string;
  cacheBucket: string;
};
export function storageConfig(env = process.env): StorageConfig {
  try {
    const url = new URL(env.SUPABASE_URL || '');
    const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (
      url.protocol !== 'https:' ||
      !/^[a-z0-9]{20}\.supabase\.co$/.test(url.hostname) ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/'
    )
      throw new Error();
    if (!key.startsWith('sb_secret_')) {
      if (
        !/^eyJ[^.]+\.[^.]+\.[^.]+$/.test(key) ||
        JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString())
          .role !== 'service_role'
      )
        throw new Error();
    }
    if (key.length < 32 || /[\r\n]/.test(key)) throw new Error();
    const mediaBucket = env.SUPABASE_MEDIA_BUCKET || 'desan-media',
      cacheBucket = env.SUPABASE_CACHE_BUCKET || 'desan-cache';
    if (
      ![mediaBucket, cacheBucket].every((name) =>
        /^[a-z0-9][a-z0-9-]{0,62}$/.test(name),
      ) ||
      mediaBucket === cacheBucket
    )
      throw new Error();
    return { url: url.origin, key, mediaBucket, cacheBucket };
  } catch {
    throw new PrivateStorageError();
  }
}
function objectPath(path: string) {
  if (
    path.length > 512 ||
    !path
      .split('/')
      .every(
        (part) =>
          /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,254}$/.test(part) &&
          !['.', '..'].includes(part),
      )
  )
    throw new PrivateStorageError();
  return path.split('/').map(encodeURIComponent).join('/');
}
function headers(config: StorageConfig): Record<string, string> {
  // New opaque keys belong only on apikey, not Bearer. Legacy JWT service keys
  // retain their Authorization header during the documented migration period.
  return {
    apikey: config.key,
    ...(!config.key.startsWith('sb_secret_')
      ? { Authorization: `Bearer ${config.key}` }
      : {}),
  };
}
async function boundedResponse(
  response: Response,
  maximum: number,
  signal: AbortSignal,
): Promise<Buffer<ArrayBuffer>> {
  const length = response.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > maximum))
    throw new PrivateStorageError();
  if (!response.body) throw new PrivateStorageError();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  const abort = () => {
    void reader.cancel().catch(() => {});
  };
  signal.addEventListener('abort', abort, { once: true });
  try {
    while (true) {
      const result = await reader.read();
      if (signal.aborted) throw new PrivateStorageError();
      if (result.done) break;
      size += result.value.byteLength;
      if (size > maximum) throw new PrivateStorageError();
      chunks.push(result.value);
    }
    return Buffer.concat(chunks);
  } finally {
    signal.removeEventListener('abort', abort);
    void reader.cancel().catch(() => {});
  }
}
type Options = {
  config?: StorageConfig;
  fetch?: typeof fetch;
  timeoutMs?: number;
};
async function privateBucket(
  config: StorageConfig,
  bucket: string,
  request: typeof fetch,
  signal: AbortSignal,
) {
  const response = await request(
    `${config.url}/storage/v1/bucket/${encodeURIComponent(bucket)}`,
    { headers: headers(config), redirect: 'error', cache: 'no-store', signal },
  );
  if (!response.ok) {
    void response.body?.cancel().catch(() => {});
    throw new PrivateStorageError();
  }
  const data = JSON.parse(
    (await boundedResponse(response, 16384, signal)).toString('utf8'),
  );
  if (data.id !== bucket || data.public !== false)
    throw new PrivateStorageError();
}
export async function readPrivateObject(
  bucket: string,
  path: string,
  maximum: number,
  options: Options = {},
) {
  const config = options.config || storageConfig();
  if (![config.mediaBucket, config.cacheBucket].includes(bucket))
    throw new PrivateStorageError();
  const request = options.fetch || fetch,
    controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    Math.min(15000, options.timeoutMs || 8000),
  );
  try {
    await privateBucket(config, bucket, request, controller.signal);
    const response = await request(
      `${config.url}/storage/v1/object/authenticated/${bucket}/${objectPath(path)}`,
      {
        headers: headers(config),
        redirect: 'error',
        cache: 'no-store',
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      // Some Storage deployments wrap NoSuchKey/404 in HTTP 400. Recognize
      // only that bounded, typed envelope after the private-bucket gate.
      if (response.status === 400) {
        const data: unknown = JSON.parse(
          (await boundedResponse(response, 2048, controller.signal)).toString(
            'utf8',
          ),
        );
        if (
          data !== null &&
          typeof data === 'object' &&
          !Array.isArray(data) &&
          'code' in data &&
          data.code === 'NoSuchKey' &&
          'statusCode' in data &&
          data.statusCode === '404' &&
          'error' in data &&
          data.error === 'not_found' &&
          'message' in data &&
          typeof data.message === 'string'
        )
          throw new PrivateStorageError('not-found');
        throw new PrivateStorageError();
      }
      void response.body?.cancel().catch(() => {});
      throw new PrivateStorageError(
        response.status === 404 ? 'not-found' : 'unavailable',
      );
    }
    return await boundedResponse(response, maximum, controller.signal);
  } catch (error) {
    if (error instanceof PrivateStorageError && error.code === 'not-found')
      throw error;
    throw new PrivateStorageError();
  } finally {
    clearTimeout(timer);
  }
}
export async function writePrivateObject(
  bucket: string,
  path: string,
  bytes: Uint8Array,
  mimeType: string,
  options: Options & { upsert?: boolean } = {},
) {
  const config = options.config || storageConfig();
  if (
    ![config.mediaBucket, config.cacheBucket].includes(bucket) ||
    bytes.byteLength >
      (bucket === config.mediaBucket ? CLOUD_MEDIA_BYTES : 32768) ||
    (bucket === config.mediaBucket && options.upsert)
  )
    throw new PrivateStorageError();
  const request = options.fetch || fetch,
    controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    Math.min(15000, options.timeoutMs || 10000),
  );
  try {
    await privateBucket(config, bucket, request, controller.signal);
    const response = await request(
      `${config.url}/storage/v1/object/${bucket}/${objectPath(path)}`,
      {
        method: 'POST',
        headers: {
          ...headers(config),
          'Content-Type': mimeType,
          'x-upsert': options.upsert ? 'true' : 'false',
          'Cache-Control': 'max-age=0',
        },
        body: Buffer.from(bytes),
        redirect: 'error',
        cache: 'no-store',
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      void response.body?.cancel().catch(() => {});
      throw new PrivateStorageError();
    }
    void response.body?.cancel().catch(() => {});
  } catch {
    throw new PrivateStorageError();
  } finally {
    clearTimeout(timer);
  }
}
export async function readStoredMedia(filename: string) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,254}$/.test(filename))
    throw new PrivateStorageError();
  if (cloudMedia()) {
    const config = storageConfig();
    return readPrivateObject(config.mediaBucket, filename, CLOUD_MEDIA_BYTES, {
      config,
    });
  }
  return readFile(
    /*turbopackIgnore: true*/ resolve(
      process.env.MEDIA_DIRECTORY || 'tmp/phase3-media',
      filename,
    ),
  );
}
