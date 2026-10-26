import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import testing from 'next/experimental/testing/server';
import { proxy, config } from '../src/proxy.ts';
import {
  needsPublicRouteCheck,
  classifyPublicRoute,
} from '../src/public-data/routing.ts';
import { publicSiteFromPublication } from '../src/public-data/index.ts';
import { createEmptyDesign } from '../src/design/model.ts';
// The installed 16.4.3 utility retains its older Middleware export name.
const { unstable_doesMiddlewareMatch: doesProxyMatch } = testing;

test('indexing follows runtime configuration without changing route decisions', async () => {
  const priorUrl = process.env.PUBLIC_SITE_URL;
  const priorIndexing = process.env.PUBLIC_SITE_INDEXABLE;
  try {
    process.env.PUBLIC_SITE_URL = 'https://portfolio.example';
    process.env.PUBLIC_SITE_INDEXABLE = '0';
    assert.equal(
      (await proxy(new NextRequest('https://portfolio.example/'))).headers.get(
        'x-robots-tag',
      ),
      'noindex, nofollow',
    );
    process.env.PUBLIC_SITE_INDEXABLE = '1';
    assert.equal(
      (await proxy(new NextRequest('https://portfolio.example/'))).headers.get(
        'x-robots-tag',
      ),
      null,
    );
    assert.equal(
      (
        await proxy(new NextRequest('https://portfolio.example/search'))
      ).headers.get('x-robots-tag'),
      'noindex, nofollow',
    );
    assert.equal(
      (await proxy(new NextRequest('https://portfolio.example/not-found')))
        .status,
      404,
    );
  } finally {
    if (priorUrl === undefined) delete process.env.PUBLIC_SITE_URL;
    else process.env.PUBLIC_SITE_URL = priorUrl;
    if (priorIndexing === undefined) delete process.env.PUBLIC_SITE_INDEXABLE;
    else process.env.PUBLIC_SITE_INDEXABLE = priorIndexing;
  }
});

const empty = { status: 'empty', publication: null };
const unavailable = {
  status: 'unavailable',
  publication: null,
  reason: 'unavailable',
};
const site = publicSiteFromPublication({
  revision: 'proxy-fixture',
  design: createEmptyDesign('proxy-fixture'),
  content: {
    projects: [
      {
        id: 1,
        title: 'Selected project',
        slug: 'selected-project',
        visible: true,
      },
    ],
    posts: [
      { id: 1, title: 'Selected post', slug: 'selected-post', visible: true },
    ],
  },
  media: [],
  redirects: { '/projects/old-project': '/projects/selected-project' },
});

test('proxy excludes indexes, CMS/API and assets without publication reads', async () => {
  for (const pathname of [
    '/',
    '/work',
    '/profile',
    '/journal',
    '/contact',
    '/resume',
    '/search',
    '/api/publication',
    '/api/owners/login',
    '/admin/login',
    '/_next/static/app.js',
    '/fonts/body.woff2',
    '/robots.txt',
    '/favicon.ico',
    '/images/a.png',
  ]) {
    assert.equal(needsPublicRouteCheck(pathname), false, pathname);
    const response = await proxy(
      new NextRequest(`http://localhost:3000${pathname}`),
    );
    assert.equal(response.headers.get('x-middleware-next'), '1', pathname);
  }
  assert.equal(needsPublicRouteCheck('/unknown', 'POST'), false);
});
test('only selected details pass; missing/private/unknown details are classified before rendering', () => {
  assert.equal(site.status, 'ready');
  assert.deepEqual(classifyPublicRoute('/work/selected-project', site), {
    kind: 'next',
  });
  assert.deepEqual(classifyPublicRoute('/journal/selected-post', site), {
    kind: 'next',
  });
  for (const pathname of [
    '/work/private-draft',
    '/journal/missing',
    '/unknown',
    '/work/selected-project/extra',
    '/work/invalid.pdf',
    '/missing.pdf',
    '/private-file.woff2',
    '/not-found',
  ])
    assert.deepEqual(classifyPublicRoute(pathname, site), { kind: 'missing' });
  assert.deepEqual(classifyPublicRoute('/work/selected-project', empty), {
    kind: 'missing',
  });
  assert.deepEqual(classifyPublicRoute('/work/selected-project', unavailable), {
    kind: 'unavailable',
  });
});
test('legacy selected redirects precede missing routing and stay local', () => {
  assert.deepEqual(classifyPublicRoute('/work/old-project', site), {
    kind: 'redirect',
    pathname: '/work/selected-project',
  });
  assert.deepEqual(classifyPublicRoute('/projects/selected-project', site), {
    kind: 'redirect',
    pathname: '/work/selected-project',
  });
  assert.deepEqual(classifyPublicRoute('/projects', unavailable), {
    kind: 'redirect',
    pathname: '/work',
  });
  assert.deepEqual(classifyPublicRoute('/posts', empty), {
    kind: 'redirect',
    pathname: '/journal',
  });
  assert.deepEqual(classifyPublicRoute('//external.example', site), {
    kind: 'missing',
  });
});
test('dedicated missing route continues with 404 without rewriting to itself', async () => {
  const request = new NextRequest('http://localhost:3000/not-found?draft=true');
  const response = await proxy(request);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('x-middleware-rewrite'), null);
  assert.equal(response.headers.get('x-middleware-next'), '1');
  assert.equal(response.headers.get('location'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(
    request.nextUrl.pathname,
    '/not-found',
    'Original requested URL is not mutated',
  );
});
test('actual constant Next matcher excludes private framework/CMS paths and includes detail/unknown paths', () => {
  for (const url of [
    '/api/owners',
    '/admin',
    '/_next/static/a.js',
    '/fonts/face.woff2',
    '/robots.txt',
  ])
    assert.equal(doesProxyMatch({ config, nextConfig: {}, url }), false, url);
  for (const url of [
    '/work/missing',
    '/journal/missing',
    '/not-found',
    '/unknown',
    '/administrator',
  ])
    assert.equal(doesProxyMatch({ config, nextConfig: {}, url }), true, url);
});
