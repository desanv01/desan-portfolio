import { open } from 'node:fs/promises';
import { publicSiteFromPublication } from '../src/public-data';
import {
  projectRepositories,
  repositoryFromURL,
} from '../src/integrations/github/model';
import { refreshGitHubMetadata } from '../src/integrations/github/cache';

const args = process.argv.slice(2);
if (args.shift() !== 'refresh')
  throw new Error(
    'Usage: github-cache.ts refresh (--repo https://github.com/owner/repo ... | --snapshot public-publication.json) [--force]',
  );
const urls: string[] = [];
let snapshot: string | null = null;
let force = false;
while (args.length) {
  const flag = args.shift();
  if (flag === '--force') force = true;
  else if (flag === '--repo') {
    const repository = repositoryFromURL(args.shift());
    if (!repository)
      throw new Error('Use an exact public https://github.com/owner/repo URL');
    urls.push(repository.url);
  } else if (flag === '--snapshot' && !snapshot)
    snapshot = args.shift() || null;
  else throw new Error('Unknown or duplicate GitHub cache option');
}
if (snapshot) {
  if (urls.length)
    throw new Error('Choose either explicit repositories or a public snapshot');
  const file = await open(snapshot, 'r');
  let raw: string;
  try {
    if ((await file.stat()).size > 10 * 1024 * 1024)
      throw new Error('Public snapshot exceeds 10 MiB');
    raw = await file.readFile({
      encoding: 'utf8',
      signal: AbortSignal.timeout(5000),
    });
    if (Buffer.byteLength(raw) > 10 * 1024 * 1024)
      throw new Error('Public snapshot exceeds 10 MiB');
  } finally {
    await file.close();
  }
  const parsed = JSON.parse(raw);
  const site = publicSiteFromPublication(
    parsed?.status === 'ready' ? parsed.publication : parsed,
  );
  if (site.status !== 'ready')
    throw new Error(
      'Use a validated public publication snapshot, not a draft or recovery export',
    );
  for (const project of site.publication.content.projects || [])
    urls.push(
      ...projectRepositories(project).map((repository) => repository.url),
    );
}
const allowedURLs = [...new Set(urls)];
if (!allowedURLs.length || allowedURLs.length > 50)
  throw new Error('Explicitly select between 1 and 50 public repositories');
let failed = false;
// Sequential bounded requests; no repo discovery, retries in a tight loop,
// implicit token use, remote README/media fetches, or owner narrative writes.
for (const url of allowedURLs) {
  const result = await refreshGitHubMetadata(url, allowedURLs, {}, force);
  console.log(
    JSON.stringify({
      repositoryURL: url,
      status: result.view.status,
      outcome: result.outcome,
      failure: result.failure,
    }),
  );
  if (result.outcome === 'failed') failed = true;
  if (result.failure === 'rate-limit') break;
}
if (failed) process.exitCode = 1;
