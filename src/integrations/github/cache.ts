import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, rename, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  PrivateStorageError,
  readPrivateObject,
  storageConfig,
  writePrivateObject,
} from '../../cms/media-storage';
import {
  date,
  GITHUB_CACHE_TTL_MS,
  metadataFromAPI,
  repositoryFromURL,
  validateMetadata,
  view,
  type CacheEntry,
  type Failure,
  type GitHubMetadataView,
  type Repository,
} from './model';

const MAX_RESPONSE_BYTES = 256 * 1024;
const MAX_CACHE_BYTES = 32 * 1024;
export function cacheDirectory(directory?: string) {
  return resolve(
    /*turbopackIgnore: true*/
    directory ||
      process.env.GITHUB_METADATA_CACHE_DIRECTORY ||
      'tmp/github-metadata',
  );
}
function pathFor(directory: string, repository: Repository) {
  return resolve(
    directory,
    `${createHash('sha256').update(repository.url).digest('hex')}.json`,
  );
}
function etag(value: unknown): string | null {
  return typeof value === 'string' &&
    /^(W\/)?"[\x21\x23-\x7e]{1,180}"$/.test(value)
    ? value
    : null;
}
const failures: Failure[] = [
  'timeout',
  'network',
  'rate-limit',
  'http',
  'invalid-response',
  'storage',
];

export async function readEntry(
  directory: string,
  repository: Repository,
  strictCloud = false,
): Promise<CacheEntry | null> {
  let file;
  try {
    let raw: string;
    if (process.env.GITHUB_METADATA_CACHE_STORAGE === 'supabase') {
      const config = storageConfig();
      raw = (
        await readPrivateObject(
          config.cacheBucket,
          `github/${createHash('sha256').update(repository.url).digest('hex')}.json`,
          MAX_CACHE_BYTES,
          { config, timeoutMs: 1000 },
        )
      ).toString('utf8');
    } else {
      file = await open(pathFor(directory, repository), 'r');
      if ((await file.stat()).size > MAX_CACHE_BYTES) return null;
      raw = await file.readFile({
        encoding: 'utf8',
        signal: AbortSignal.timeout(2000),
      });
    }
    if (Buffer.byteLength(raw) > MAX_CACHE_BYTES) return null;
    const data = JSON.parse(raw) as CacheEntry;
    if (data.schemaVersion !== 1 || data.repositoryURL !== repository.url)
      return null;
    const metadata =
      data.metadata === null
        ? null
        : validateMetadata(data.metadata, repository);
    if (metadata && (!data.fetchedAt || !data.checkedAt || !data.expiresAt))
      return null;
    if (!(data.failure === null || failures.includes(data.failure)))
      return null;
    return {
      schemaVersion: 1,
      repositoryURL: repository.url,
      metadata,
      etag: etag(data.etag),
      fetchedAt: data.fetchedAt ? date(data.fetchedAt) : null,
      checkedAt: data.checkedAt ? date(data.checkedAt) : null,
      expiresAt: data.expiresAt ? date(data.expiresAt) : null,
      retryAt: data.retryAt ? date(data.retryAt) : null,
      failure: data.failure,
    };
  } catch (error) {
    if (
      strictCloud &&
      process.env.GITHUB_METADATA_CACHE_STORAGE === 'supabase' &&
      !(error instanceof PrivateStorageError && error.code === 'not-found')
    )
      throw new PrivateStorageError();
    return null;
  } finally {
    await file?.close();
  }
}
async function writeEntry(
  directory: string,
  repository: Repository,
  entry: CacheEntry,
) {
  if (process.env.GITHUB_METADATA_CACHE_STORAGE === 'supabase') {
    const config = storageConfig();
    await writePrivateObject(
      config.cacheBucket,
      `github/${createHash('sha256').update(repository.url).digest('hex')}.json`,
      Buffer.from(JSON.stringify(entry)),
      'application/json',
      { config, upsert: true },
    );
    return;
  }
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const filename = pathFor(directory, repository);
  const temporary = `${filename}.${randomUUID()}.tmp`;
  try {
    const json = JSON.stringify(entry);
    if (Buffer.byteLength(json) > MAX_CACHE_BYTES)
      throw new Error('Cache entry is too large');
    await writeFile(temporary, json, { flag: 'wx', mode: 0o600 });
    await rename(temporary, filename);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}
async function readResponse(response: Response, signal: AbortSignal) {
  const length = response.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_RESPONSE_BYTES))
    throw new Error('Response exceeds bound');
  if (
    !response.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json')
  )
    throw new Error('Expected JSON');
  if (!response.body) throw new Error('Expected response body');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  const abort = () => {
    void reader.cancel().catch(() => {});
  };
  signal.addEventListener('abort', abort, { once: true });
  try {
    while (true) {
      if (signal.aborted) throw new Error('Response timed out');
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) throw new Error('Response exceeds bound');
      chunks.push(value);
    }
    if (signal.aborted) throw new Error('Response timed out');
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } finally {
    signal.removeEventListener('abort', abort);
    await reader.cancel().catch(() => {});
  }
}
export type CacheOptions = {
  directory?: string;
  now?: () => Date;
  fetch?: typeof fetch;
  timeoutMs?: number;
  ttlMs?: number;
};
export type RefreshResult = {
  view: GitHubMetadataView;
  outcome: 'cached' | 'updated' | 'not-modified' | 'deferred' | 'failed';
  failure: Failure | null;
};
function retryTime(response: Response | undefined, now: Date): string {
  let delay = 60000;
  const retry = response?.headers.get('retry-after');
  if (retry && /^\d+$/.test(retry))
    delay = Math.max(delay, Number(retry) * 1000);
  const reset = response?.headers.get('x-ratelimit-reset');
  if (
    response?.headers.get('x-ratelimit-remaining') === '0' &&
    reset &&
    /^\d+$/.test(reset)
  )
    delay = Math.max(delay, Number(reset) * 1000 - now.getTime());
  return new Date(
    now.getTime() + Math.min(30 * 24 * 60 * 60 * 1000, delay),
  ).toISOString();
}

/** Refresh is operator/CLI-only. The caller supplies the entire explicit
 * allowlist; the API URL is reconstructed rather than taken from input/payload. */
export async function refreshGitHubMetadata(
  repositoryURL: string,
  allowedURLs: readonly string[],
  options: CacheOptions = {},
  force = false,
): Promise<RefreshResult> {
  const repository = repositoryFromURL(repositoryURL);
  if (
    !repository ||
    allowedURLs.length > 50 ||
    !allowedURLs.some((url) => repositoryFromURL(url)?.url === repository.url)
  )
    throw new Error('Repository is not explicitly allowlisted');
  const directory = cacheDirectory(options.directory);
  const now = (options.now || (() => new Date()))();
  let previous: CacheEntry | null;
  try {
    previous = await readEntry(directory, repository, true);
  } catch {
    return {
      view: view(null, repository, now),
      outcome: 'deferred',
      failure: 'storage',
    };
  }
  if (previous?.retryAt && Date.parse(previous.retryAt) > now.getTime())
    return {
      view: view(previous, repository, now),
      outcome: 'deferred',
      failure: previous.failure,
    };
  if (
    !force &&
    previous?.metadata &&
    !previous.failure &&
    previous.expiresAt &&
    Date.parse(previous.expiresAt) > now.getTime()
  )
    return {
      view: view(previous, repository, now),
      outcome: 'cached',
      failure: null,
    };
  const ttl = Math.max(
    60000,
    Math.min(options.ttlMs || GITHUB_CACHE_TTL_MS, 24 * 60 * 60 * 1000),
  );
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    Math.max(1, Math.min(options.timeoutMs || 5000, 10000)),
  );
  let response: Response | undefined;
  let failure: Failure = 'network';
  try {
    response = await (options.fetch || fetch)(repository.apiURL, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2026-03-10',
        'User-Agent': 'desan-public-metadata-cache',
        ...(previous?.etag ? { 'If-None-Match': previous.etag } : {}),
      },
    });
    failure = 'invalid-response';
    if (response.status === 304) {
      if (!previous?.metadata || !previous.etag)
        throw new Error('Unexpected conditional response');
      const entry: CacheEntry = {
        ...previous,
        checkedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + ttl).toISOString(),
        retryAt: null,
        failure: null,
        etag: etag(response.headers.get('etag')) || previous.etag,
      };
      failure = 'storage';
      await writeEntry(directory, repository, entry);
      return {
        view: view(entry, repository, now),
        outcome: 'not-modified',
        failure: null,
      };
    }
    if (response.status !== 200) {
      failure = [403, 429].includes(response.status) ? 'rate-limit' : 'http';
      throw new Error('GitHub metadata request failed');
    }
    if (response.url && response.url !== repository.apiURL)
      throw new Error('Unexpected endpoint');
    const metadata = metadataFromAPI(
      await readResponse(response, controller.signal),
      repository,
    );
    const entry: CacheEntry = {
      schemaVersion: 1,
      repositoryURL: repository.url,
      metadata,
      etag: etag(response.headers.get('etag')),
      fetchedAt: now.toISOString(),
      checkedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttl).toISOString(),
      retryAt: null,
      failure: null,
    };
    failure = 'storage';
    await writeEntry(directory, repository, entry);
    return {
      view: view(entry, repository, now),
      outcome: 'updated',
      failure: null,
    };
  } catch {
    if (controller.signal.aborted) failure = 'timeout';
    const entry: CacheEntry = {
      ...(previous || {
        schemaVersion: 1,
        repositoryURL: repository.url,
        metadata: null,
        etag: null,
        fetchedAt: null,
        checkedAt: null,
        expiresAt: null,
      }),
      retryAt: retryTime(response, now),
      failure,
    };
    await writeEntry(directory, repository, entry).catch(() => {});
    return { view: view(entry, repository, now), outcome: 'failed', failure };
  } finally {
    clearTimeout(timer);
    await response?.body?.cancel().catch(() => {});
  }
}
