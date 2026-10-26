import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks, createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { Window } from 'happy-dom';
const window = new Window({ url: 'http://localhost/owner/design' });
const globals = {
  window,
  document: window.document,
  navigator: window.navigator,
  HTMLElement: window.HTMLElement,
  HTMLInputElement: window.HTMLInputElement,
  Node: window.Node,
  Event: window.Event,
  MouseEvent: window.MouseEvent,
  location: window.location,
  IS_REACT_ACT_ENVIRONMENT: true,
};
for (const [key, value] of Object.entries(globals))
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value,
  });
const reactURL = pathToFileURL(
  createRequire(import.meta.url).resolve('react'),
).href;
const linkAdapter = `data:text/javascript,${encodeURIComponent(`import React from ${JSON.stringify(reactURL)};export default function Link(p){return React.createElement('a',p);}`)}`;
registerHooks({
  resolve(s, c, n) {
    if (s === 'next/link') return { url: linkAdapter, shortCircuit: true };
    return n(s, c);
  },
  load(url, c, n) {
    if (url.endsWith('.css'))
      return {
        source: 'export default {};',
        format: 'module',
        shortCircuit: true,
      };
    return n(url, c);
  },
});
const { default: React, act } = await import('react');
const { createRoot } = await import('react-dom/client');
const { DesignStudio } =
  await import('../src/components/owner/design-studio.tsx');
const { createCopperDesign } = await import('../src/design/runtime.ts');
const { readMedia, restoreDesign } =
  await import('../src/owner-design/client.ts');
const h = React.createElement;
async function mount(t) {
  const element = window.document.createElement('div');
  window.document.body.append(element);
  const root = createRoot(element);
  await act(async () =>
    root.render(
      h(DesignStudio, {
        initial: {
          document: createCopperDesign(),
          revision: 'r1',
          recordId: '7',
          versionId: 3,
        },
        previewRoutes: [
          { pageId: 'home', label: 'Home', path: '/' },
          { pageId: 'profile', label: 'Profile', path: '/profile' },
        ],
      }),
    ),
  );
  t.after(async () => {
    await act(async () => root.unmount());
    element.remove();
  });
  return element;
}
const button = (root, text) =>
  [...root.querySelectorAll('button')].find((e) =>
    e.textContent.startsWith(text),
  );
async function click(element) {
  assert.ok(element);
  await act(async () => element.click());
}
async function input(element, value) {
  assert.ok(element);
  await act(async () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    );
    descriptor.set.call(element, value);
    element.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}
async function select(element, value) {
  assert.ok(element);
  await act(async () => {
    element.value = value;
    element.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
}
function labelled(root, text, tag = 'input') {
  const label = [...root.querySelectorAll('label')].find((l) =>
    l.textContent.startsWith(text),
  );
  return label?.querySelector(tag);
}

test('actual Studio applies arbitrary color, retains invalid buffers across scope changes, and blocks save until resolved', async (t) => {
  const root = await mount(t);
  await click(button(root, 'Edit value'));
  await input(
    labelled(root.querySelector('.ds-inspector'), 'Exact color'),
    '#1234abcd',
  );
  assert.equal(
    labelled(root.querySelector('.ds-inspector'), 'Exact color').value,
    '#1234abcd',
  );
  await click(button(root, 'Apply property'));
  assert.match(root.textContent, /#1234abcd/);
  assert.match(root.textContent, /Unsaved changes/);
  await click(button(root, 'Edit value'));
  await input(
    labelled(root.querySelector('.ds-inspector'), 'Exact color'),
    'bad-color',
  );
  assert.equal(button(root, 'Apply property').disabled, true);
  assert.equal(button(root, 'Save draft').disabled, true);
  assert.equal(root.querySelector('.ds-library-body').disabled, true);
  assert.equal(button(root, 'Undo').disabled, true);
  const scope = labelled(root, 'Editing scope', 'select');
  await select(scope, JSON.stringify({ kind: 'site' }));
  assert.match(root.textContent, /1 unapplied property buffers/);
  await select(
    scope,
    JSON.stringify({ kind: 'theme', id: 'copper', mode: 'dark' }),
  );
  assert.equal(
    labelled(root.querySelector('.ds-inspector'), 'Exact color').value,
    'bad-color',
  );
  await click(button(root, 'Discard field buffer'));
  assert.equal(button(root, 'Save draft').disabled, false);
  assert.match(root.textContent, /#1234abcd/);
  await click(button(root, 'Undo'));
  assert.doesNotMatch(root.querySelector('.ds-value').textContent, /#1234abcd/);
  await click(button(root, 'Redo'));
  assert.match(root.querySelector('.ds-value').textContent, /#1234abcd/);
});
test('actual Studio conflict retains local design and offers recovery without silently overwriting', async (t) => {
  const oldFetch = globalThis.fetch;
  t.after(() => (globalThis.fetch = oldFetch));
  let submitted;
  globalThis.fetch = async (path, options) => {
    submitted = { path, options };
    return new Response(
      JSON.stringify({ error: 'New server revision', code: 'conflict' }),
      { status: 409 },
    );
  };
  const root = await mount(t);
  await click(button(root, 'Edit value'));
  await input(
    labelled(root.querySelector('.ds-inspector'), 'Exact color'),
    '#876543',
  );
  await click(button(root, 'Apply property'));
  await click(button(root, 'Save draft'));
  assert.match(root.textContent, /Newer server revision exists/);
  assert.match(root.querySelector('.ds-value').textContent, /#876543/);
  assert.equal(button(root, 'Save draft').disabled, true);
  assert.equal(JSON.parse(submitted.options.body).expectedRevision, 'r1');
  assert.equal(
    JSON.parse(submitted.options.body).data.data.themes[0].modes.dark.values[
      'background.color'
    ],
    '#876543',
  );
  assert.ok(button(root, 'Export local recovery'));
});
test('preview receipt pins saved design + current selected content; actual iframe route carries receipt and device dimensions', async (t) => {
  const oldFetch = globalThis.fetch;
  t.after(() => (globalThis.fetch = oldFetch));
  const calls = [];
  globalThis.fetch = async (path, options = {}) => {
    calls.push({ path, options });
    let data;
    if (path === '/api/owner/workspace')
      data = {
        publication: {
          revision: 'live-r',
          designVersionId: 2,
          selections: [
            {
              collection: 'projects',
              versionId: 8,
              title: 'private title',
              recordId: 1,
            },
          ],
        },
      };
    else if (path.includes('/records/design-themes/7'))
      data = {
        id: 7,
        revision: 'r1',
        versionId: 9,
        data: { data: createCopperDesign() },
      };
    else data = { id: 'receipt-123' };
    return new Response(JSON.stringify(data));
  };
  const root = await mount(t);
  await click(button(root, 'Connect private preview'));
  const iframe = root.querySelector('iframe');
  assert.ok(iframe);
  assert.equal(
    iframe.getAttribute('src'),
    '/owner/preview?receipt=receipt-123',
  );
  assert.equal(iframe.style.width, '1440px');
  const posted = JSON.parse(
    calls.find((c) => c.path === '/api/owner/previews').options.body,
  ).input;
  assert.deepEqual(posted, {
    expectedRevision: 'live-r',
    designVersionId: 9,
    selections: [{ collection: 'projects', versionId: 8 }],
  });
  await click(button(root, 'Mobile'));
  assert.equal(iframe.style.width, '390px');
});
test('client follows paginated catalog and sends integer exact version restore with optimistic revision', async (t) => {
  const oldFetch = globalThis.fetch;
  t.after(() => (globalThis.fetch = oldFetch));
  const calls = [];
  globalThis.fetch = async (path, options = {}) => {
    calls.push({ path, options });
    const page = new URL(path, 'http://localhost').searchParams.get('page');
    return new Response(
      JSON.stringify(
        path.includes('/restore')
          ? { id: 7, revision: 'new', data: {} }
          : { docs: [{ id: page, data: { kind: 'font' } }], totalPages: 2 },
      ),
    );
  };
  const result = await readMedia();
  assert.deepEqual(
    result.docs.map((x) => x.id),
    ['1', '2'],
  );
  assert.equal(calls.length, 2);
  await restoreDesign('7', 'r1', '12');
  assert.deepEqual(JSON.parse(calls.at(-1).options.body), {
    expectedRevision: 'r1',
    versionId: 12,
  });
});
test.after(async () => window.happyDOM.close());
