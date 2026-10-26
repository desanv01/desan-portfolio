export const GITHUB_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
export type Repository = {
  owner: string;
  name: string;
  url: string;
  apiURL: string;
};
export type GitHubRepositoryMetadata = {
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  archived: boolean;
  isFork: boolean;
  defaultBranch: string;
  topics: string[];
  license: { name: string; spdxId: string } | null;
  pushedAt: string | null;
  updatedAt: string;
};
export type GitHubMetadataView = {
  repositoryURL: string;
  status: 'fresh' | 'stale' | 'unavailable';
  metadata: GitHubRepositoryMetadata | null;
  fetchedAt: string | null;
  checkedAt: string | null;
  attribution: { label: 'GitHub repository metadata'; url: string };
};
export type Failure =
  | 'timeout'
  | 'network'
  | 'rate-limit'
  | 'http'
  | 'invalid-response'
  | 'storage';
export type CacheEntry = {
  schemaVersion: 1;
  repositoryURL: string;
  metadata: GitHubRepositoryMetadata | null;
  etag: string | null;
  fetchedAt: string | null;
  checkedAt: string | null;
  expiresAt: string | null;
  retryAt: string | null;
  failure: Failure | null;
};

/** Root repository URLs only: no credentials, ports, queries, encoded paths,
 * subresources, shorthand hosts or enterprise/private network destinations. */
export function repositoryFromURL(value: unknown): Repository | null {
  if (typeof value !== 'string' || value.length > 256) return null;
  const match =
    /^https:\/\/github\.com\/([a-z\d](?:[a-z\d-]{0,37}[a-z\d])?)\/([a-z\d_.-]{1,100})\/?$/i.exec(
      value,
    );
  if (!match) return null;
  const owner = match[1].toLowerCase();
  const name = match[2].replace(/\.git$/i, '').toLowerCase();
  if (!name || ['.', '..'].includes(name)) return null;
  return {
    owner,
    name,
    url: `https://github.com/${owner}/${name}`,
    apiURL: `https://api.github.com/repos/${owner}/${name}`,
  };
}
export function projectRepositories(
  project:
    | {
        links?: unknown;
      }
    | Record<string, unknown>,
): Repository[] {
  if (!Array.isArray(project.links)) return [];
  const output = new Map<string, Repository>();
  for (const link of project.links.slice(0, 100)) {
    const repository = repositoryFromURL(
      link && typeof link === 'object' ? link.url : null,
    );
    if (repository) output.set(repository.url, repository);
    if (output.size === 8) break;
  }
  return [...output.values()];
}
function text(value: unknown, maximum: number): string {
  if (
    typeof value !== 'string' ||
    value.length > maximum ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
  )
    throw new Error('Invalid metadata text');
  return value;
}
function nullableText(value: unknown, maximum: number) {
  return value === null ? null : text(value, maximum);
}
function count(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 0)
    throw new Error('Invalid metadata count');
  return Number(value);
}
function boolean(value: unknown) {
  if (typeof value !== 'boolean') throw new Error('Invalid metadata boolean');
  return value;
}
export function date(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    throw new Error('Invalid metadata date');
  return new Date(value).toISOString();
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid metadata object');
  return value as Record<string, unknown>;
}
/** Reprojects both API and disk data. Unlisted fields never cross this boundary. */
export function validateMetadata(
  value: unknown,
  repository: Repository,
): GitHubRepositoryMetadata {
  const data = record(value);
  if (
    text(data.fullName, 140).toLowerCase() !==
    `${repository.owner}/${repository.name}`
  )
    throw new Error('Repository identity changed');
  if (!Array.isArray(data.topics) || data.topics.length > 30)
    throw new Error('Invalid topics');
  const license = data.license === null ? null : record(data.license);
  return {
    fullName: text(data.fullName, 140),
    description: nullableText(data.description, 2048),
    language: nullableText(data.language, 100),
    stars: count(data.stars),
    forks: count(data.forks),
    openIssues: count(data.openIssues),
    archived: boolean(data.archived),
    isFork: boolean(data.isFork),
    defaultBranch: text(data.defaultBranch, 255),
    topics: data.topics.map((topic) => text(topic, 100)),
    license: license
      ? { name: text(license.name, 200), spdxId: text(license.spdxId, 100) }
      : null,
    pushedAt: data.pushedAt === null ? null : date(data.pushedAt),
    updatedAt: date(data.updatedAt),
  };
}
export function metadataFromAPI(
  value: unknown,
  repository: Repository,
): GitHubRepositoryMetadata {
  const data = record(value);
  if (
    data.private !== false ||
    data.visibility !== 'public' ||
    repositoryFromURL(data.html_url)?.url !== repository.url
  )
    throw new Error(
      'Only the explicitly selected public repository is allowed',
    );
  const license = data.license === null ? null : record(data.license);
  return validateMetadata(
    {
      fullName: data.full_name,
      description: data.description,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      archived: data.archived,
      isFork: data.fork,
      defaultBranch: data.default_branch,
      topics: data.topics,
      license: license ? { name: license.name, spdxId: license.spdx_id } : null,
      pushedAt: data.pushed_at,
      updatedAt: data.updated_at,
    },
    repository,
  );
}
export function view(
  entry: CacheEntry | null,
  repository: Repository,
  now: Date,
): GitHubMetadataView {
  return {
    repositoryURL: repository.url,
    status: !entry?.metadata
      ? 'unavailable'
      : !entry.failure &&
          entry.expiresAt &&
          Date.parse(entry.expiresAt) > now.getTime()
        ? 'fresh'
        : 'stale',
    metadata: entry?.metadata || null,
    fetchedAt: entry?.fetchedAt || null,
    checkedAt: entry?.checkedAt || null,
    attribution: { label: 'GitHub repository metadata', url: repository.url },
  };
}
