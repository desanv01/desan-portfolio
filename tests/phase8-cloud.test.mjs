import assert from 'node:assert/strict';
import test from 'node:test';
import {
  storageConfig,
  readPrivateObject,
  writePrivateObject,
  PrivateStorageError,
  CLOUD_MEDIA_BYTES,
} from '../src/cms/media-storage.ts';
import { jobsAuthorized } from '../src/owner/jobs-auth.ts';
import { postgresPoolOptions } from '../src/cms/runtime-policy.ts';
import {
  readEntry,
  refreshGitHubMetadata,
} from '../src/integrations/github/cache.ts';
import { repositoryFromURL } from '../src/integrations/github/model.ts';
import { readProjectGitHubMetadata } from '../src/integrations/github/index.ts';

const config = {
  url: 'https://' + 'a'.repeat(20) + '.supabase.co',
  key: 'sb_secret_' + 'synthetic'.repeat(6),
  mediaBucket: 'desan-media',
  cacheBucket: 'desan-cache',
};
test('native private storage uses opaque apikey, immutable writes, private-bucket gate and bounded reads', async () => {
  const calls = [];
  const request = async (url, init) => {
    calls.push(url);
    assert.equal(init.headers.apikey, config.key);
    assert.ok(!('Authorization' in init.headers));
    assert.equal(init.redirect, 'error');
    assert.equal(init.cache, 'no-store');
    if (url.includes('/bucket/'))
      return Response.json({ id: 'desan-media', public: false });
    if (init.method === 'POST') {
      assert.equal(init.headers['x-upsert'], 'false');
      assert.deepEqual([...init.body], [1, 2, 3]);
      return Response.json({ Key: 'not-returned' });
    }
    return new Response(new Uint8Array([1, 2, 3]));
  };
  await writePrivateObject(
    config.mediaBucket,
    'immutable.png',
    new Uint8Array([1, 2, 3]),
    'image/png',
    { config, fetch: request },
  );
  assert.deepEqual(
    [
      ...(await readPrivateObject(config.mediaBucket, 'immutable.png', 10, {
        config,
        fetch: request,
      })),
    ],
    [1, 2, 3],
  );
  assert.ok(calls.every((url) => url.startsWith(config.url + '/storage/v1/')));
  await assert.rejects(
    writePrivateObject(
      config.mediaBucket,
      'immutable.png',
      new Uint8Array([1]),
      'image/png',
      { config, upsert: true },
    ),
    PrivateStorageError,
  );
  await assert.rejects(
    writePrivateObject(
      config.mediaBucket,
      'huge.png',
      new Uint8Array(CLOUD_MEDIA_BYTES + 1),
      'image/png',
      { config },
    ),
    PrivateStorageError,
  );
  await assert.rejects(
    readPrivateObject(config.mediaBucket, '../private.env', 10, {
      config,
      fetch: request,
    }),
    PrivateStorageError,
  );
  await assert.rejects(
    readPrivateObject(config.mediaBucket, 'immutable.png', 10, {
      config,
      fetch: async () =>
        Response.json({ id: config.mediaBucket, public: true }),
    }),
    PrivateStorageError,
  );
});

test('storage rejects public/anon credentials, oversized responses, redirects/failures and slow bodies without diagnostic leakage', async () => {
  for (const env of [
    { SUPABASE_URL: 'http://127.0.0.1', SUPABASE_SECRET_KEY: config.key },
    {
      SUPABASE_URL: config.url,
      SUPABASE_SECRET_KEY: 'sb_publishable_' + 'x'.repeat(40),
    },
  ])
    assert.throws(() => storageConfig(env), PrivateStorageError);
  assert.equal(
    storageConfig({ SUPABASE_URL: config.url, SUPABASE_SECRET_KEY: config.key })
      .mediaBucket,
    config.mediaBucket,
  );
  for (const mode of ['length', 'stream', 'timeout', 'redirect', 'error']) {
    const request = async (url) => {
      if (url.includes('/bucket/'))
        return Response.json({ id: config.mediaBucket, public: false });
      if (mode === 'length')
        return new Response('x', { headers: { 'content-length': '9999999' } });
      if (mode === 'stream') return new Response('x'.repeat(11));
      if (mode === 'timeout')
        return new Response(new ReadableStream({ start() {} }));
      if (mode === 'redirect')
        return new Response(null, {
          status: 302,
          headers: { location: 'http://127.0.0.1' },
        });
      throw new Error('SYNTHETIC-SECRET-DIAGNOSTIC');
    };
    await assert.rejects(
      readPrivateObject(config.mediaBucket, 'image.png', 10, {
        config,
        fetch: request,
        timeoutMs: 10,
      }),
      (error) =>
        error instanceof PrivateStorageError &&
        !error.message.includes('SYNTHETIC-SECRET'),
    );
  }
});

test('cloud job secret is scoped and timing-safe; verified TLS options cannot be weakened by URI query', () => {
  const secret = 'synthetic-job-secret-' + 'x'.repeat(32);
  assert.equal(jobsAuthorized(null, secret), false);
  assert.equal(jobsAuthorized(secret, 'short'), false);
  assert.equal(jobsAuthorized('wrong', secret), false);
  assert.equal(jobsAuthorized(secret, secret), true);
  const pool = postgresPoolOptions({
    DATABASE_URI:
      'postgresql://owner:synthetic@db.example:5432/postgres?sslmode=require',
    DATABASE_SSL: '1',
    VERCEL: '1',
  });
  assert.equal(pool.max, 3);
  assert.equal(pool.ssl.rejectUnauthorized, true);
  assert.ok(!pool.connectionString.includes('sslmode='));
  assert.throws(
    () =>
      postgresPoolOptions({
        DATABASE_URI: 'postgresql://localhost/db',
        DATABASE_SSL: '1',
        DATABASE_SSL_CA: 'not a certificate',
      }),
    /valid trusted provider/,
  );
  for (const env of [
    {
      DATABASE_URI: 'postgresql://owner:synthetic@db.example/postgres',
      VERCEL: '1',
    },
    {
      DATABASE_URI:
        'postgresql://owner:synthetic@db.example/postgres?sslmode=no-verify',
    },
    {
      DATABASE_URI:
        'postgresql://owner:synthetic@db.example/postgres?sslmode=disable',
      DATABASE_SSL: '0',
    },
  ]) {
    const safe = postgresPoolOptions(env);
    assert.equal(safe.ssl.rejectUnauthorized, true);
    assert.ok(!safe.connectionString.includes('sslmode='));
  }
  assert.equal(
    postgresPoolOptions({
      DATABASE_URI: 'postgresql://owner:synthetic@127.0.0.1/local',
      DATABASE_SSL: '0',
    }).ssl,
    undefined,
  );
});

test('private object reads recognize the real HTTP 400 NoSuchKey envelope and fail closed for other errors', async () => {
  const missing = {
    statusCode: '404',
    error: 'not_found',
    message: 'Object not found',
    code: 'NoSuchKey',
  };
  const cases = [
    [400, JSON.stringify(missing), 'not-found'],
    [404, '', 'not-found'],
    [400, '{malformed', 'unavailable'],
    [400, JSON.stringify({ ...missing, code: 'NoSuchBucket' }), 'unavailable'],
    [400, JSON.stringify({ ...missing, code: 'AccessDenied' }), 'unavailable'],
    [400, JSON.stringify({ ...missing, statusCode: '403' }), 'unavailable'],
    [400, JSON.stringify({ ...missing, statusCode: 404 }), 'unavailable'],
    [400, JSON.stringify({ ...missing, error: 'unauthorized' }), 'unavailable'],
    [400, JSON.stringify({ ...missing, message: null }), 'unavailable'],
    [400, JSON.stringify([missing]), 'unavailable'],
    [400, 'null', 'unavailable'],
    [
      400,
      JSON.stringify({ ...missing, extra: 'x'.repeat(2048) }),
      'unavailable',
    ],
    [401, JSON.stringify(missing), 'unavailable'],
    [403, JSON.stringify(missing), 'unavailable'],
    [429, JSON.stringify(missing), 'unavailable'],
    [500, JSON.stringify(missing), 'unavailable'],
  ];
  for (const [status, body, expected] of cases) {
    let gate = false;
    await assert.rejects(
      readPrivateObject(config.cacheBucket, 'github/missing.json', 32768, {
        config,
        fetch: async (url) => {
          if (url.includes('/bucket/')) {
            gate = true;
            return Response.json({ id: config.cacheBucket, public: false });
          }
          assert.equal(gate, true);
          return new Response(body, { status });
        },
      }),
      (error) =>
        error instanceof PrivateStorageError && error.code === expected,
      `HTTP ${status}: ${body.slice(0, 150)}`,
    );
  }
  let objectCalls = 0;
  await assert.rejects(
    readPrivateObject(config.cacheBucket, 'github/missing.json', 32768, {
      config,
      fetch: async (url) => {
        if (url.includes('/object/')) objectCalls++;
        return Response.json(missing, { status: 400 });
      },
    }),
    (error) =>
      error instanceof PrivateStorageError && error.code === 'unavailable',
  );
  assert.equal(objectCalls, 0);
});

test('durable GitHub cache keeps last-good data in a private object and public reads never refresh GitHub', async () => {
  const names = [
    'SUPABASE_URL',
    'SUPABASE_SECRET_KEY',
    'GITHUB_METADATA_CACHE_STORAGE',
  ];
  const previous = Object.fromEntries(
    names.map((name) => [name, process.env[name]]),
  );
  const originalFetch = globalThis.fetch,
    objects = new Map();
  Object.assign(process.env, {
    SUPABASE_URL: config.url,
    SUPABASE_SECRET_KEY: config.key,
    GITHUB_METADATA_CACHE_STORAGE: 'supabase',
  });
  globalThis.fetch = async (url, init) => {
    assert.ok(url.startsWith(config.url));
    assert.equal(init.headers.apikey, config.key);
    if (url.includes('/bucket/'))
      return Response.json({ id: config.cacheBucket, public: false });
    const path = url.split('/desan-cache/')[1];
    if (init.method === 'POST') {
      assert.equal(init.headers['x-upsert'], 'true');
      objects.set(path, Buffer.from(init.body));
      return Response.json({ Key: 'ignored' });
    }
    return objects.has(path)
      ? new Response(objects.get(path))
      : Response.json(
          {
            statusCode: '404',
            error: 'not_found',
            message: 'Object not found',
            code: 'NoSuchKey',
          },
          { status: 400 },
        );
  };
  try {
    const url = 'https://github.com/example/repo',
      now = new Date('2026-10-26T00:00:00Z');
    const upstream = {
      private: false,
      visibility: 'public',
      html_url: url,
      full_name: 'example/repo',
      description: 'External observation',
      language: null,
      stargazers_count: 11,
      forks_count: 0,
      open_issues_count: 0,
      archived: false,
      fork: false,
      default_branch: 'main',
      topics: [],
      license: null,
      pushed_at: null,
      updated_at: now.toISOString(),
    };
    let githubCalls = 0;
    const fresh = await refreshGitHubMetadata(url, [url], {
      now: () => now,
      fetch: async () => {
        githubCalls++;
        return Response.json(upstream);
      },
    });
    assert.equal(fresh.outcome, 'updated');
    assert.equal(objects.size, 1);
    const storedBeforeFailure = [...objects.values()][0].toString();
    const healthyFetch = globalThis.fetch;
    let posts = 0,
      callsOnUnavailableRead = 0;
    globalThis.fetch = async (target, init) => {
      if (init.method === 'POST') posts++;
      if (target.includes('/object/authenticated/'))
        throw new Error('Transient private cache read failure');
      return healthyFetch(target, init);
    };
    const deferred = await refreshGitHubMetadata(url, [url], {
      now: () => new Date(now.getTime() + 7 * 60 * 60 * 1000),
      fetch: async () => {
        callsOnUnavailableRead++;
        return new Response(null, { status: 429 });
      },
    });
    assert.equal(deferred.failure, 'storage');
    assert.equal(deferred.outcome, 'deferred');
    assert.equal(posts, 0);
    assert.equal(callsOnUnavailableRead, 0);
    assert.equal([...objects.values()][0].toString(), storedBeforeFailure);
    globalThis.fetch = healthyFetch;
    const project = { title: 'Authored narrative', links: [{ url }] },
      unchanged = structuredClone(project);
    const views = await readProjectGitHubMetadata(project, { now });
    assert.equal(views[0].status, 'fresh');
    assert.equal(views[0].metadata.stars, 11);
    assert.deepEqual(project, unchanged);
    assert.equal(githubCalls, 1);
    assert.ok(!JSON.stringify(views).includes(config.key));
    const later = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const stale = await refreshGitHubMetadata(url, [url], {
      now: () => later,
      fetch: async () => {
        throw new Error('upstream unavailable');
      },
    });
    assert.equal(stale.view.status, 'stale');
    assert.equal(
      (await readProjectGitHubMetadata(project, { now: later }))[0].metadata
        .stars,
      11,
    );
    // A slow storage object must not block a visitor, but an explicit refresh
    // can wait longer for the last-good entry before deciding what to write.
    globalThis.fetch = async (target, init) => {
      if (!target.includes('/object/authenticated/'))
        return healthyFetch(target, init);
      const bytes = [...objects.values()][0];
      let timer;
      return new Response(
        new ReadableStream({
          start(controller) {
            timer = setTimeout(() => {
              controller.enqueue(bytes);
              controller.close();
            }, 1200);
          },
          cancel() {
            clearTimeout(timer);
          },
        }),
      );
    };
    const repository = repositoryFromURL(url);
    assert.equal(await readEntry('', repository), null);
    const slowOperationalRead = await readEntry('', repository, true);
    assert.equal(slowOperationalRead.metadata.stars, 11);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
});
