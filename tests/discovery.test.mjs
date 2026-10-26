import assert from 'node:assert/strict';
import test from 'node:test';
import {
  discoveryRoutes,
  routeMetadata,
  rss,
  siteOrigin,
  publicOrigin,
  structuredData,
  serializeStructuredData,
} from '../src/public-data/discovery.ts';
test('structured data is publication-only, allowlisted and escapes script delimiters', () => {
  const input = {
    status: 'ready',
    publication: {
      content: {
        profile: [
          {
            id: 1,
            slug: 'p',
            title: 'P',
            visible: true,
            displayName: 'Owner </script><script>bad</script>',
            privateNotes: 'PRIVATE',
            contact: [{ value: 'secret' }],
            links: [
              { url: 'https://www.linkedin.com/in/example/' },
              { url: 'javascript:bad' },
            ],
          },
        ],
      },
    },
  };
  const data = structuredData(
    input,
    'home',
    undefined,
    'https://portfolio.example',
  );
  const encoded = serializeStructuredData(data);
  assert(!encoded.includes('</script>'));
  assert(!encoded.includes('PRIVATE'));
  assert(!encoded.includes('secret'));
  assert(!encoded.includes('javascript:'));
  assert.equal(
    structuredData({ status: 'empty', publication: null }, 'home'),
    null,
  );
});
const site = {
  status: 'ready',
  publication: {
    revision: 'one',
    publishedAt: '2026-10-26T00:00:00Z',
    content: {
      profile: [
        {
          id: 1,
          slug: 'profile',
          title: 'Profile',
          displayName: 'Test Owner',
          visible: true,
        },
      ],
      projects: [
        {
          id: 2,
          slug: 'approved-project',
          title: 'Approved project',
          summary: 'Public summary',
          visible: true,
          seo: { title: 'Reviewed SEO', description: 'Reviewed description' },
        },
      ],
      posts: [
        {
          id: 3,
          slug: 'story',
          title: 'A < B & C',
          summary: 'No <script> injection',
          editorialDate: '2026-10',
          visible: true,
        },
      ],
    },
    media: [],
    redirects: { '/old': '/work/approved-project' },
  },
};
test('discovery includes only active public routes and never private endpoints or old slugs', () => {
  const paths = discoveryRoutes(site);
  assert(paths.includes('/work/approved-project'));
  assert(paths.includes('/journal/story'));
  assert(!paths.some((path) => /owner|admin|search|old/.test(path)));
  assert.deepEqual(discoveryRoutes({ status: 'empty', publication: null }), []);
  assert.equal(
    routeMetadata(site, '/owner/preview', 'https://portfolio.example').robots
      .index,
    false,
  );
});
test('canonical and social metadata use reviewed SEO and a configured origin rather than request Host', () => {
  const meta = routeMetadata(
    site,
    '/work/approved-project',
    'https://portfolio.example',
  );
  assert.equal(
    meta.alternates.canonical,
    'https://portfolio.example/work/approved-project',
  );
  assert.equal(meta.openGraph.title, 'Reviewed SEO');
  assert.equal(meta.openGraph.description, 'Reviewed description');
  assert(
    meta.openGraph.images[0].url.startsWith(
      'https://portfolio.example/social-image?',
    ),
  );
  assert.equal(siteOrigin('javascript:bad'), 'http://127.0.0.1:3000');
  assert.equal(publicOrigin('http://127.0.0.1:3007'), false);
  assert.equal(publicOrigin('https://portfolio.example'), true);
});
test('RSS escapes text, excludes draft data and does not invent precision for partial dates', () => {
  const output = rss(site, 'https://portfolio.example');
  assert(output.includes('A &lt; B &amp; C'));
  assert(output.includes('No &lt;script&gt; injection'));
  assert(!output.includes('<pubDate>'));
  assert(!output.includes('approved-project'));
});
