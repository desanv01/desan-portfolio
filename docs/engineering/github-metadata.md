# GitHub repository metadata cache

GitHub metadata is an attributed external observation, separate from the owner's authored project narrative. The integration never imports a README, discovers/adds projects, writes content records, or replaces claims, source context, credits or outcomes. Public rendering reads a local cache and does not make GitHub requests.

## Public rendering contract

On the server, call `readProjectGitHubMetadata(project)` from `src/integrations/github/index.ts`. The project's existing `links` array is the explicit read allowlist. Only exact HTTPS github.com repository roots are recognized; duplicate case variants normalize to one root, a clone `.git` suffix is removed, and at most eight unique repositories are read per project. Subresources, encoded paths, credentials, ports, query strings, fragments and other hosts are rejected.

Each `GitHubMetadataView` includes repositoryURL, status (`fresh`, `stale`, `unavailable`), metadata or null, fetchedAt, checkedAt, and attribution `{label:'GitHub repository metadata',url:repositoryURL}`. Render metadata as plain text with the attribution and observation time. Explain stale state without replacing the owner's article. Missing/corrupt cache should leave the authored project and original repository link usable. Display metrics as external observations, not evidence of the owner's contribution or endorsement.

Metadata is limited to repository identity/description/language, stars/forks/open issues, archived/fork flags, default branch, topics, license name/SPDX ID and upstream pushed/updated times. API auth/owner/security fields and every unlisted property are discarded before disk writes and again when reading disk. The helper never exposes ETags, local paths, raw network bodies/errors, credentials or internal retry state.

## Explicit refresh

Using the project's pinned Node and installed tsx:

```powershell
node --import tsx scripts/github-cache.ts refresh --repo https://github.com/OWNER/REPOSITORY
node --import tsx scripts/github-cache.ts refresh --repo https://github.com/OWNER/ONE --repo https://github.com/OWNER/TWO
node --import tsx scripts/github-cache.ts refresh --snapshot path/to/public-publication.json
```

Snapshot input must pass the existing selected-publication validator. Drafts and recovery bundles are rejected. Only selected projects' explicit repository links are used; no profile/repository discovery follows. Choose either repositories or one local snapshot, with 1–50 unique repositories. Snapshot files are bounded to 10 MiB. No database, token, schema migration or package install is needed. The CLI prints only selected public repository URLs, outcome/freshness and generic failure codes; any failed refresh exits nonzero. Refresh requests are sequential, and the command stops on rate limiting.

The default cache lives in ignored `tmp/github-metadata`. Set `GITHUB_METADATA_CACHE_DIRECTORY` to an operator-controlled absolute persistent directory when running from a different working directory or a standalone package. This directory is runtime data, not source or a bundled fixture. It stores only projected public metadata plus conditional-request timestamps. Cache filenames are SHA-256 hashes of normalized URLs; writes use a unique same-directory temporary file and atomic rename, with restrictive creation modes where supported. No cache data is committed or provisioned externally.

Default TTL is six hours. `--force` revalidates early but still respects a recorded repository retry time. Refresh uses `If-None-Match` and preserves fetchedAt on 304 while advancing checkedAt/expiry. There is one unauthenticated GET to the reconstructed `https://api.github.com/repos/{owner}/{repo}` endpoint, with API version `2026-03-10`; no environment token is read or sent. Redirects are deliberately denied: a renamed/transferred repository needs a newly reviewed explicit URL rather than silently expanding the allowlist.

Requests have a five-second abort deadline (including response streaming), a 256 KiB response limit and JSON content checks. The payload must identify the exact selected public repository (`private:false`, public visibility and matching identity). Private, mismatched, malformed, redirected or oversized responses cannot replace the last-known-good projection. Disk entries are bounded to 32 KiB and revalidated. Timeouts, network/rate/server/payload/storage failures retain last-known-good data as stale when available; missing data remains unavailable. Failure retry is at least one minute, extended by GitHub Retry-After/rate reset headers. There is no automatic retry loop or background automation created by this feature. The operator should wait for rate limits before refreshing other repositories; this cache's retry ledger is per repository, not an account-wide rate limiter.

## Validation

`tests/integration-github-cache.test.mjs` uses injected fetch and clock with unique workspace-local temporary directories. It covers allowlist/SSRF boundaries, exact endpoint/redirect/header constraints, TTL/no-fetch behavior, ETag304 timestamps, projection canaries, no owner narrative mutation, stale fallback for network/header/body timeouts and rate/redirect/private/mismatch/malformed/HTML/size errors, retry deferral and recovery, atomic-file residue, and corrupt/substituted/oversized disk data. Public helper checks only local disk; no test depends on GitHub uptime.

Official primary references: [Get a repository](https://docs.github.com/en/rest/repos/repos#get-a-repository) documents public unauthenticated metadata and the repository endpoint. [REST API best practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api) documents conditional requests, rate-limit headers and serial request guidance. This implementation intentionally rejects redirects to preserve its explicit repository boundary. Review these sources before changing fields, API version or retry behavior.
