import { readProjectGitHubMetadata } from '@/integrations/github';
export async function GitHubMetadata({
  project,
}: {
  project: Record<string, unknown>;
}) {
  const repositories = await readProjectGitHubMetadata(project);
  if (!repositories.length) return null;
  return (
    <section className="case-block">
      <h2>Repository details</h2>
      {repositories.map((repo) => (
        <div key={repo.repositoryURL}>
          <h3>
            <a
              href={repo.repositoryURL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {repo.metadata?.fullName ||
                new URL(repo.repositoryURL).pathname.slice(1)}{' '}
              ↗
            </a>
          </h3>
          {repo.metadata ? (
            <>
              <p>{repo.metadata.description}</p>
              <p>
                {[
                  repo.metadata.language,
                  repo.metadata.license?.name,
                  `${repo.metadata.stars} stars`,
                  `${repo.metadata.forks} forks`,
                  repo.metadata.archived ? 'Archived' : null,
                  repo.metadata.isFork ? 'Fork' : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <small>
                {repo.attribution.label} · checked{' '}
                {repo.checkedAt
                  ? new Date(repo.checkedAt).toLocaleDateString('en-GB')
                  : 'not yet'}
                {repo.status === 'stale'
                  ? ' · Last saved data; refresh unavailable or overdue.'
                  : ''}
              </small>
            </>
          ) : (
            <p>
              Repository metadata is currently unavailable. The source link
              remains available.
            </p>
          )}
        </div>
      ))}
    </section>
  );
}
