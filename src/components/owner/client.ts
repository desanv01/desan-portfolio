'use client';

export class OwnerApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: string[] = [],
  ) {
    super(message);
  }
}
export async function ownerApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      ...(typeof options.body === 'string'
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body?.error === 'string'
        ? body.error
        : typeof body?.errors?.[0]?.message === 'string'
          ? body.errors[0].message
          : `Request failed (${response.status}). Your edits are retained.`;
    throw new OwnerApiError(
      message,
      response.status,
      Array.isArray(body?.fields)
        ? body.fields.filter((field: unknown) => typeof field === 'string')
        : [],
    );
  }
  return body as T;
}
export async function ownerPages<T>(path: string): Promise<T[]> {
  const docs: T[] = [];
  let page = 1,
    total = 1;
  do {
    const result = await ownerApi<{ docs: T[]; totalPages: number }>(
      `${path}${path.includes('?') ? '&' : '?'}page=${page}`,
    );
    docs.push(...result.docs);
    total = result.totalPages;
    page++;
  } while (page <= total);
  return docs;
}
export function downloadJson(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export type OwnerField = {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  fields?: OwnerField[];
  options?: (string | { label: string; value: string })[];
  relationTo?: string | string[];
  hasMany?: boolean;
  readOnly?: boolean;
};
export type OwnerCollection = {
  slug: string;
  label: string;
  fields: OwnerField[];
};
export type OwnerRecord = {
  id: string | number;
  data: Record<string, unknown>;
  revision: string;
  versionId: number | null;
};
export type OwnerRecordPage = {
  docs: OwnerRecord[];
  totalDocs: number;
  page: number;
  totalPages: number;
};
export type OwnerPublication = {
  revision: string | null;
  designVersionId: number;
  designRecordId?: string | number;
  selections: {
    collection: string;
    versionId: number;
    recordId?: string | number;
    title?: string;
  }[];
};
export type OwnerWorkspaceData = {
  collections: OwnerCollection[];
  publication: OwnerPublication | null;
};
