import type { DesignDocument } from '../design/model';
export type DesignRecord = {
  id: string | number;
  revision: string;
  versionId?: number | null;
  data: { title?: string; data: DesignDocument };
};
export type VersionRecord = {
  id: string | number;
  createdAt: string;
  data: DesignRecord['data'];
};
export type MediaRecord = {
  id: string | number;
  data: Record<string, unknown>;
  revision: string;
};
export class OwnerDesignError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
export async function ownerFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new OwnerDesignError(
      'Server response could not be read. Local changes are retained.',
      response.status,
    );
  }
  if (!response.ok)
    throw new OwnerDesignError(
      typeof result === 'object' && result && 'error' in result
        ? String(result.error)
        : 'Request failed. Local changes are retained.',
      response.status,
    );
  return result as T;
}
export const saveDesign = (
  recordId: string,
  revision: string,
  document: DesignDocument,
) =>
  recordId
    ? ownerFetch<DesignRecord>(
        `/api/owner/records/design-themes/${encodeURIComponent(recordId)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            expectedRevision: revision,
            data: { data: document },
          }),
        },
      )
    : ownerFetch<DesignRecord>('/api/owner/records/design-themes', {
        method: 'POST',
        body: JSON.stringify({
          data: { title: document.id, data: document },
        }),
      });
export const readDesign = (id: string) =>
  ownerFetch<DesignRecord>(
    `/api/owner/records/design-themes/${encodeURIComponent(id)}`,
  );
async function allPages<T>(path: string): Promise<{ docs: T[] }> {
  const docs: T[] = [];
  let page = 1;
  for (;;) {
    const result = await ownerFetch<{ docs: T[]; totalPages: number }>(
      `${path}${path.includes('?') ? '&' : '?'}page=${page}&limit=100`,
    );
    docs.push(...result.docs);
    if (page >= result.totalPages || !result.docs.length) break;
    page++;
  }
  return { docs };
}
export const readVersions = (id: string) =>
  allPages<VersionRecord>(
    `/api/owner/records/design-themes/${encodeURIComponent(id)}/versions`,
  );
export const restoreDesign = (
  id: string,
  revision: string,
  versionId: string | number,
) =>
  ownerFetch<DesignRecord>(
    `/api/owner/records/design-themes/${encodeURIComponent(id)}/restore`,
    {
      method: 'POST',
      body: JSON.stringify({
        expectedRevision: revision,
        versionId: Number(versionId),
      }),
    },
  );
export const readMedia = () =>
  allPages<MediaRecord>('/api/owner/records/media');
export const uploadMedia = async (
  file: File,
  metadata: Record<string, unknown>,
) => {
  const { limits } = await ownerFetch<{ limits: { mediaBytes: number } }>(
    '/api/owner/workspace',
  );
  if (file.size > limits.mediaBytes) {
    throw new Error(
      `Choose a file no larger than ${limits.mediaBytes / (1024 * 1024)} MiB.`,
    );
  }
  const body = new FormData();
  body.append('file', file);
  body.append('_payload', JSON.stringify(metadata));
  return ownerFetch<{ doc: Record<string, unknown> }>('/api/owner/media', {
    method: 'POST',
    body,
  });
};
