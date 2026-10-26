import assert from 'node:assert/strict';
import test from 'node:test';

const base = process.env.PUBLIC_SITE_BASE_URL;
test(
  'built discovery routes use the selected publication and protect private paths',
  { skip: !base, timeout: 120000 },
  async () => {
    const get = (path) =>
      fetch(new URL(path, base), {
        redirect: 'manual',
        signal: AbortSignal.timeout(20000),
      });
    const response = await get('/api/publication');
    assert.equal(response.status, 200);
    const publication = await response.json();
    const sitemapResponse = await get('/sitemap.xml');
    assert.equal(sitemapResponse.status, 200);
    const sitemap = await sitemapResponse.text();
    for (const [collection, prefix] of [
      ['projects', '/work/'],
      ['posts', '/journal/'],
    ]) {
      for (const record of publication.content[collection] || [])
        assert.ok(sitemap.includes(`${prefix}${record.slug}</loc>`));
    }
    assert.doesNotMatch(sitemap, /\/owner|\/admin|\/search|PRIVATE-PHASE4/);
    const feedResponse = await get('/feed.xml');
    assert.equal(feedResponse.status, 200);
    assert.match(feedResponse.headers.get('content-type') || '', /xml/);
    const feed = await feedResponse.text();
    assert.match(feed, /<rss\b/);
    assert.equal(
      (feed.match(/<item>/g) || []).length,
      (publication.content.posts || []).length,
    );
    assert.doesNotMatch(feed, /PRIVATE-PHASE4|privateNotes|sourceKey/);
    const project = publication.content.projects?.[0];
    if (project) {
      const path = `/work/${project.slug}`;
      const pageResponse = await get(path);
      assert.equal(pageResponse.status, 200);
      const html = await pageResponse.text();
      assert.ok(html.includes('property="og:title"'));
      assert.ok(html.includes('rel="canonical"'));
      assert.ok(html.includes('application/ld+json'));
      assert.ok(html.includes('Copy link'));
      const card = await get(`/social-image?path=${encodeURIComponent(path)}`);
      assert.equal(card.status, 200);
      assert.match(card.headers.get('content-type') || '', /image\/png/);
      const bytes = Buffer.from(await card.arrayBuffer());
      assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
      assert.equal(bytes.readUInt32BE(16), 1200);
      assert.equal(bytes.readUInt32BE(20), 630);
    }
    assert.equal((await get('/social-image?path=%2Fowner')).status, 404);
    const owner = await get('/api/owner/workspace');
    assert.equal(owner.status, 401);
    assert.match(owner.headers.get('cache-control') || '', /no-store/);
    assert.match(owner.headers.get('x-robots-tag') || '', /noindex/);
    const robots = await (await get('/robots.txt')).text();
    assert.match(robots, /Disallow: \/(?:\r?\n|$)/);
  },
);
