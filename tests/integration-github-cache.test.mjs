import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { refreshGitHubMetadata } from '../src/integrations/github/cache.ts';
import {
  readProjectGitHubMetadata,
  repositoryFromURL,
  projectRepositories,
} from '../src/integrations/github/index.ts';

const url = 'https://github.com/example/public-repo';
const payload = () => ({
  private: false,
  visibility: 'public',
  full_name: 'Example/Public-Repo',
  html_url: url,
  description: 'External metadata only',
  language: 'TypeScript',
  stargazers_count: 3,
  forks_count: 2,
  open_issues_count: 1,
  archived: false,
  fork: false,
  default_branch: 'main',
  topics: ['engineering'],
  license: { name: 'MIT License', spdx_id: 'MIT', url: 'PRIVATE-RAW-CANARY' },
  pushed_at: '2026-10-20T00:00:00Z',
  updated_at: '2026-10-21T00:00:00Z',
  secret: 'PRIVATE-RAW-CANARY',
  owner: { email: 'PRIVATE-RAW-CANARY' },
});
const response = (data) =>
  Response.json(data, { headers: { etag: '"etag-one"' } });
async function fixture(t) {
  await mkdir(resolve('tmp'), { recursive: true });
  const directory = await mkdtemp(join(process.cwd(), 'tmp', 'github-test-'));
  t.after(() => {
    assert.equal(dirname(directory), resolve('tmp'));
    return rm(directory, { recursive: true, force: true });
  });
  let clock = new Date('2026-10-26T00:00:00Z');
  return {
    directory,
    now: () => clock,
    advance(ms) {
      clock = new Date(clock.getTime() + ms);
    },
  };
}

test('strict repository allowlist prevents credential/query/path/redirect destination expansion', async (t) => {
  const options = await fixture(t);
  for (const invalid of [
    'http://github.com/a/b',
    'https://api.github.com/a/b',
    'https://github.com.evil.example/a/b',
    'https://token@github.com/a/b',
    'https://github.com:443/a/b',
    'https://github.com/a/b?token=secret',
    'https://github.com/a/b#secret',
    'https://github.com/a/b/tree/main',
    'https://github.com/a/%62',
    'https://github.com/a/../b/c',
    'https://github.com/a/..',
    'https://127.0.0.1/a/b',
    'git@github.com:a/b',
  ])
    assert.equal(repositoryFromURL(invalid), null, invalid);
  assert.equal(
    repositoryFromURL('https://GitHub.com/Example/Public-Repo.git/').url,
    url,
  );
  let called = false;
  await assert.rejects(
    refreshGitHubMetadata(url, [], {
      ...options,
      fetch: async () => {
        called = true;
        return response(payload());
      },
    }),
    /allowlisted/,
  );
  assert.equal(called, false);
  const repositories = projectRepositories({
    links: [
      { url },
      { url: 'https://github.com/EXAMPLE/PUBLIC-REPO' },
      { url: 'https://evil.example/repo' },
    ],
  });
  assert.equal(repositories.length, 1);
});

test('fresh TTL makes no fetch, conditional304 extends checkedAt without changing last fetched data', async (t) => {
  const options = await fixture(t);
  let calls = 0;
  const fetch = async (endpoint, init) => {
    calls++;
    assert.equal(endpoint, 'https://api.github.com/repos/example/public-repo');
    assert.equal(init.redirect, 'manual');
    assert.equal(init.method, 'GET');
    assert.ok(!('Authorization' in init.headers));
    if (calls === 1) return response(payload());
    assert.equal(init.headers['If-None-Match'], '"etag-one"');
    return new Response(null, { status: 304 });
  };
  const first = await refreshGitHubMetadata(url, [url], { ...options, fetch });
  assert.equal(first.outcome, 'updated', JSON.stringify(first));
  assert.equal(first.view.status, 'fresh');
  assert.ok(!JSON.stringify(first).includes('PRIVATE-RAW-CANARY'));
  options.advance(1000);
  assert.equal(
    (await refreshGitHubMetadata(url, [url], { ...options, fetch })).outcome,
    'cached',
  );
  assert.equal(calls, 1);
  options.advance(6 * 60 * 60 * 1000);
  const checked = await refreshGitHubMetadata(url, [url], {
    ...options,
    fetch,
  });
  assert.equal(checked.outcome, 'not-modified');
  assert.equal(checked.view.fetchedAt, first.view.fetchedAt);
  assert.notEqual(checked.view.checkedAt, first.view.checkedAt);
  const files = await readdir(options.directory);
  assert.equal(files.length, 1);
  assert.match(files[0], /^[a-f0-9]{64}\.json$/);
  assert.ok(
    !(await readFile(join(options.directory, files[0]), 'utf8')).includes(
      'PRIVATE-RAW-CANARY',
    ),
  );
  const project = {
    title: 'Owner narrative',
    description: 'Owner claim',
    links: [{ url }],
  };
  const before = structuredClone(project);
  const views = await readProjectGitHubMetadata(project, {
    directory: options.directory,
    now: options.now(),
  });
  assert.equal(views[0].metadata.stars, 3);
  assert.equal(views[0].attribution.label, 'GitHub repository metadata');
  assert.deepEqual(project, before);
  assert.equal(calls, 2);
});

test('network, timeout, rate limit, redirects and invalid payload preserve last-known-good metadata', async (t) => {
  for (const mode of [
    'network',
    'timeout',
    'rate-limit',
    'redirect',
    'private',
    'identity',
    'malformed',
    'oversized',
    'stream-limit',
    'slow-body',
    'html',
  ]) {
    await t.test(mode, async (t) => {
      const options = await fixture(t);
      const initial = await refreshGitHubMetadata(url, [url], {
        ...options,
        fetch: async () => response(payload()),
      });
      options.advance(7 * 60 * 60 * 1000);
      const fetch = async (_endpoint, init) => {
        if (mode === 'network') throw new Error('SECRET NETWORK DIAGNOSTIC');
        if (mode === 'timeout')
          return new Promise((_, reject) =>
            init.signal.addEventListener(
              'abort',
              () => reject(new Error('aborted')),
              { once: true },
            ),
          );
        if (mode === 'rate-limit')
          return new Response('SECRET HTTP DIAGNOSTIC', {
            status: 429,
            headers: { 'retry-after': '120' },
          });
        if (mode === 'redirect')
          return new Response(null, {
            status: 301,
            headers: { location: 'http://127.0.0.1/private' },
          });
        if (mode === 'private')
          return response({
            ...payload(),
            private: true,
            visibility: 'private',
          });
        if (mode === 'identity')
          return response({ ...payload(), full_name: 'example/other' });
        if (mode === 'malformed')
          return new Response('{broken', {
            headers: { 'content-type': 'application/json' },
          });
        if (mode === 'oversized')
          return new Response('{}', {
            headers: {
              'content-type': 'application/json',
              'content-length': '999999999',
            },
          });
        if (mode === 'stream-limit')
          return new Response('X'.repeat(256 * 1024 + 1), {
            headers: { 'content-type': 'application/json' },
          });
        if (mode === 'slow-body')
          return new Response(new ReadableStream({ start() {} }), {
            headers: { 'content-type': 'application/json' },
          });
        return new Response('<html>SECRET</html>', {
          headers: { 'content-type': 'text/html' },
        });
      };
      const result = await refreshGitHubMetadata(url, [url], {
        ...options,
        fetch,
        timeoutMs: 10,
      });
      assert.equal(result.outcome, 'failed');
      assert.equal(result.view.status, 'stale');
      assert.deepEqual(result.view.metadata, initial.view.metadata);
      assert.equal(result.view.fetchedAt, initial.view.fetchedAt);
      assert.ok(!JSON.stringify(result).includes('SECRET'));
      const publicView = await readProjectGitHubMetadata(
        { links: [{ url }] },
        { directory: options.directory, now: options.now() },
      );
      assert.equal(publicView[0].status, 'stale');
      let retried = false;
      const deferred = await refreshGitHubMetadata(
        url,
        [url],
        {
          ...options,
          fetch: async () => {
            retried = true;
            return response(payload());
          },
        },
        true,
      );
      assert.equal(deferred.outcome, 'deferred');
      assert.equal(retried, false);
      options.advance(mode === 'rate-limit' ? 120001 : 60001);
      assert.equal(
        (
          await refreshGitHubMetadata(url, [url], {
            ...options,
            fetch: async () => response(payload()),
          })
        ).outcome,
        'updated',
      );
    });
  }
});

test('missing, corrupt or substituted cache fails closed and never triggers a refresh', async (t) => {
  const options = await fixture(t);
  assert.equal(
    (await readProjectGitHubMetadata({ links: [{ url }] }, options))[0].status,
    'unavailable',
  );
  const failed = await refreshGitHubMetadata(url, [url], {
    ...options,
    fetch: async () => new Response(null, { status: 404 }),
  });
  assert.equal(failed.view.metadata, null);
  const filename = join(
    options.directory,
    (await readdir(options.directory))[0],
  );
  await writeFile(filename, '{broken');
  assert.equal(
    (await readProjectGitHubMetadata({ links: [{ url }] }, options))[0].status,
    'unavailable',
  );
  options.advance(60001);
  await refreshGitHubMetadata(url, [url], {
    ...options,
    fetch: async () => response(payload()),
  });
  const entry = JSON.parse(await readFile(filename, 'utf8'));
  entry.repositoryURL = 'https://github.com/example/other';
  await writeFile(filename, JSON.stringify(entry));
  assert.equal(
    (await readProjectGitHubMetadata({ links: [{ url }] }, options))[0].status,
    'unavailable',
  );
  await writeFile(filename, 'X'.repeat(32769));
  assert.equal(
    (await readProjectGitHubMetadata({ links: [{ url }] }, options))[0].status,
    'unavailable',
  );
});
