import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';

const base = process.env.PUBLIC_SITE_BASE_URL;
const fixtureWork = '/work/synthetic-orbit-controller';
const fixtureArticle = '/journal/synthetic-thoughtful-systems';
const serverHTML = (html) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '');
function mainHTML(html) {
  const withoutScripts = serverHTML(html);
  return (
    withoutScripts.match(/<main\b[^>]*>([\s\S]*?)<\/main\s*>/i)?.[1] ||
    withoutScripts
  );
}
function visibleText(html) {
  return mainHTML(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
function recordLinks(html, family) {
  const links = [
    ...mainHTML(html).matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/gi),
  ].map((match) => match[1].replace(/&amp;/g, '&'));
  return [
    ...new Set(
      links.filter(
        (href) =>
          href.startsWith(`/${family}/`) &&
          !href.includes('?') &&
          !href.includes('#'),
      ),
    ),
  ];
}
test(
  'synthetic live public routes use selected publication, filtering, search and redirects',
  { timeout: 120000, skip: !base },
  async () => {
    const origin = new URL(base);
    assert.ok(
      ['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname),
      'Live synthetic verification is local-only',
    );
    const get = async (path, expected = 200) => {
      let response;
      try {
        response = await fetch(new URL(path, origin), {
          redirect: 'manual',
          signal: AbortSignal.timeout(20000),
        });
      } catch (error) {
        throw new Error(
          `GET ${path} failed (${error instanceof Error ? error.name : 'unknown request error'})`,
          { cause: error },
        );
      }
      assert.equal(
        response.status,
        expected,
        `${path} returned ${response.status}`,
      );
      const html = await response.text();
      assert.ok(
        !html.includes('PRIVATE-PHASE4'),
        `${path} leaked an unpublished canary, including in serialized props`,
      );
      if (expected === 200)
        assert.match(response.headers.get('content-type') || '', /text\/html/);
      return { response, html, text: visibleText(html) };
    };
    const publicResponse = await fetch(new URL('/api/publication', origin));
    assert.equal(publicResponse.status, 200);
    assert.equal(publicResponse.headers.get('cache-control'), 'no-store');
    const publication = await publicResponse.json();
    assert.ok(!JSON.stringify(publication).includes('PRIVATE-PHASE4'));
    assert.ok(
      Array.isArray(publication.media) && publication.media.length >= 4,
    );
    for (const resource of publication.media) {
      assert.equal(resource.url, `/api/public/media/${resource.id}`);
      const response = await fetch(new URL(resource.url, origin));
      assert.equal(
        response.status,
        200,
        'Selected public media/font bytes must be available',
      );
      assert.equal(response.headers.get('content-type'), resource.mimeType);
      assert.equal(
        createHash('sha256')
          .update(Buffer.from(await response.arrayBuffer()))
          .digest('hex'),
        resource.sha256,
      );
    }
    for (const route of [
      '/',
      '/work',
      fixtureWork,
      '/profile',
      '/journal',
      fixtureArticle,
      '/contact',
      '/resume',
    ]) {
      const result = await get(route);
      assert.ok(
        result.text.length > 25,
        `${route} has no useful visible main content`,
      );
    }
    const work = await get('/work');
    assert.ok(
      recordLinks(work.html, 'work').includes(fixtureWork),
      'Selected project appears in real visible card links',
    );
    assert.match(
      work.text,
      /synthetic/i,
      'Synthetic publication must be explicitly labelled',
    );
    const caseStudy = await get(fixtureWork);
    const assertMetadata = (html, collection, slug, path) => {
      const record = publication.content[collection].find(
        (item) => item.slug === slug,
      );
      assert.ok(record, 'Metadata fixture must exist in the selected snapshot');
      const markup = serverHTML(html);
      const titles = [
        ...markup.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi),
      ].map((match) => match[1]);
      assert.ok(
        titles.some((title) => title.includes(record.title)),
        'Selected record title must populate actual metadata',
      );
      const description = markup.match(
        /<meta\s+name="description"\s+content="([^"]*)"/i,
      )?.[1];
      assert.equal(
        description,
        record.summary,
        'Description must come from the selected public record',
      );
      const canonical = markup.match(
        /<link\s+rel="canonical"\s+href="([^"]*)"/i,
      )?.[1];
      assert.ok(canonical, 'Selected detail route needs a canonical link');
      assert.equal(new URL(canonical, origin).pathname, path);
    };
    assertMetadata(
      caseStudy.html,
      'projects',
      'synthetic-orbit-controller',
      fixtureWork,
    );
    assert.match(caseStudy.text, /Orbit Controller/);
    assert.match(
      caseStudy.text,
      /Synthetic qualitative result|Synthetic contribution/,
    );
    const draftQuery = await get(`${fixtureWork}?draft=true`);
    assert.match(draftQuery.text, /Orbit Controller/);
    const article = await get(fixtureArticle);
    assertMetadata(
      article.html,
      'posts',
      'synthetic-thoughtful-systems',
      fixtureArticle,
    );
    assert.match(
      article.text,
      /Synthetic reading sample 53\./,
      'Long article tail is rendered, not merely serialized in RSC props',
    );
    const profile = await get('/profile');
    assert.match(profile.text, /Demo Engineer/);
    assert.match(profile.text, /Synthetic prototype engineer/);
    assert.match(profile.text, /Embedded Systems/);
    const skill = await get('/profile?skill=synthetic-embedded-systems');
    assert.match(skill.text, /Embedded Systems/);
    assert.ok(
      recordLinks(skill.html, 'work').includes(fixtureWork),
      'Skill context links return to the selected project',
    );
    const systems = await get('/work?discipline=Systems');
    const systemsLinks = recordLinks(systems.html, 'work');
    const expectedSystems = new Set(
      [
        'synthetic-orbit-controller',
        'synthetic-signal-atlas',
        'synthetic-bench-logger',
        'synthetic-sensor-sketch',
        'synthetic-motion-ledger',
      ].map((slug) => `/work/${slug}`),
    );
    assert.ok(
      systemsLinks.length > 0,
      'Selected discipline must retain actual matching work',
    );
    assert.ok(
      systemsLinks.every((link) => expectedSystems.has(link)),
      `Discipline filter exposed a nonmatching project: ${systemsLinks.join(', ')}`,
    );
    const workQuery = await get('/work?q=Orbit');
    assert.deepEqual(recordLinks(workQuery.html, 'work'), [fixtureWork]);
    const journal1 = await get('/journal?page=1');
    const journal2 = await get('/journal?page=2');
    const posts1 = recordLinks(journal1.html, 'journal');
    const posts2 = recordLinks(journal2.html, 'journal');
    assert.ok(
      posts1.length > 0 && posts2.length > 0,
      'Both journal pages contain actual selected records',
    );
    assert.ok(
      posts2.every((link) => !posts1.includes(link)),
      'Pagination must change visible record identities',
    );
    const search = await get('/search?q=Orbit');
    assert.ok(recordLinks(search.html, 'work').includes(fixtureWork));
    const profileSearch = await get('/search?q=thoughtful%20builder');
    assert.match(profileSearch.text, /Demo Engineer|Synthetic profile/);
    const noResults = await get('/search?q=zzzz-no-public-result-67219');
    assert.equal(recordLinks(noResults.html, 'work').length, 0);
    assert.match(
      noResults.text,
      /no results|no matches|nothing|not found|try another/i,
    );
    const resume = await get('/resume');
    assert.match(
      resume.text,
      /unavailable|not available|not uploaded|not selected|no (?:published |selected )?pdf|awaiting/i,
    );
    assert.match(
      resume.html,
      /href="\/profile(?:[?#][^"]*)?"|print/i,
      'Missing PDF retains a useful profile/print alternative',
    );
    const legacy = await get('/work/synthetic-orbit-old', 308);
    assert.equal(
      new URL(legacy.response.headers.get('location'), origin).pathname,
      fixtureWork,
    );
    const legacyQuery = await get(
      '/work/synthetic-orbit-old?via=legacy&draft=true',
      308,
    );
    assert.equal(
      new URL(legacyQuery.response.headers.get('location'), origin).search,
      '?via=legacy&draft=true',
    );
    const privateAPI = await fetch(new URL('/api/owners', origin), {
      redirect: 'manual',
    });
    assert.ok(
      [401, 403].includes(privateAPI.status),
      'Proxy must preserve CMS access denial instead of rewriting it',
    );
    const admin = await fetch(new URL('/admin/login', origin), {
      redirect: 'manual',
    });
    assert.equal(
      admin.status,
      200,
      'Configured CMS login must bypass public routing',
    );
    const script = work.html.match(
      /<script[^>]+src="([^"?]+\.js(?:\?[^"]*)?)"/,
    );
    assert.ok(script);
    const scriptResponse = await fetch(
      new URL(script[1].replaceAll('&amp;', '&'), origin),
    );
    assert.equal(scriptResponse.status, 200);
    assert.match(scriptResponse.headers.get('content-type'), /javascript/);
    const missing = await get('/work/synthetic-missing-not-published', 404);
    assert.match(
      serverHTML(missing.html),
      /<main\b[^>]*>[\s\S]*?<\/main\s*>/i,
      'A metadata title or serialized RSC component is not a useful server-rendered 404 body',
    );
    assert.match(
      mainHTML(missing.html),
      /Lost in thought|This page may have moved|could not find|Page not found/i,
    );
    await get('/work/private-phase4-canary', 404);
    for (const pathname of [
      '/synthetic-unknown-route?from=verification',
      '/missing.pdf',
      '/not-found',
    ]) {
      const result = await get(pathname, 404);
      assert.match(
        serverHTML(result.html),
        /<main\b[^>]*>[\s\S]*?<\/main\s*>/i,
      );
      assert.match(
        mainHTML(result.html),
        /Lost in thought|This page may have moved|Page not found/i,
      );
      assert.equal(
        result.response.headers.get('location'),
        null,
        '404 rewrites must not redirect the requested URL',
      );
      assert.equal(
        new URL(result.response.url).pathname,
        new URL(pathname, origin).pathname,
      );
      assert.equal(
        new URL(result.response.url).search,
        new URL(pathname, origin).search,
      );
      const head = await fetch(new URL(pathname, origin), {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(20000),
      }).catch((error) => {
        throw new Error(
          `HEAD ${pathname} failed (${error instanceof Error ? error.name : 'unknown request error'})`,
          { cause: error },
        );
      });
      assert.equal(head.status, 404);
      assert.equal(head.headers.get('location'), null);
      assert.equal(await head.text(), '');
    }
  },
);
