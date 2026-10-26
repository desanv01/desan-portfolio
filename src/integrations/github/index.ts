import { cacheDirectory, readEntry } from './cache';
import { projectRepositories, view, type GitHubMetadataView } from './model';
export type { GitHubMetadataView, GitHubRepositoryMetadata } from './model';
export { repositoryFromURL, projectRepositories } from './model';

/** Server-side local read only. It never refreshes or fetches on page requests.
 * Render metadata as attributed plain text, separate from the owner's claims. */
export async function readProjectGitHubMetadata(
  project: { links?: unknown } | Record<string, unknown>,
  options: { directory?: string; now?: Date } = {},
): Promise<GitHubMetadataView[]> {
  const directory = cacheDirectory(options.directory);
  const now = options.now || new Date();
  return Promise.all(
    projectRepositories(project).map(async (repository) =>
      view(await readEntry(directory, repository), repository, now),
    ),
  );
}
