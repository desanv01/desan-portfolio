import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
const siteStub =
  'data:text/javascript,' +
  encodeURIComponent(
    "export async function getPublicSite(){globalThis.__missingSiteReads=(globalThis.__missingSiteReads||0)+1;return {status:'empty',publication:null};}",
  );
registerHooks({
  resolve(s, c, n) {
    return s === '@/public-data/server'
      ? { url: siteStub, shortCircuit: true }
      : n(s, c);
  },
});
const { default: Missing } =
  await import('../src/app/(frontend)/not-found.tsx');
test('deferred not-found rendering retains explicit private site without reading the live publication after request context ends', async () => {
  globalThis.__missingSiteReads = 0;
  const site = {
    status: 'ready',
    publication: { revision: 'qa-private-pinned' },
  };
  const suspense = Missing({ site });
  const child = suspense.props.children;
  const rendered = await child.type(child.props);
  assert.equal(rendered.props.site, site);
  assert.equal(rendered.props.pageId, 'not-found');
  assert.equal(globalThis.__missingSiteReads, 0);
});
test('ordinary public not-found rendering still reads its current public site', async () => {
  globalThis.__missingSiteReads = 0;
  const suspense = Missing();
  const child = suspense.props.children;
  const rendered = await child.type(child.props);
  assert.equal(rendered.props.site.status, 'empty');
  assert.equal(globalThis.__missingSiteReads, 1);
});
