import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequire, registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
// Next's image default-export interop is supplied by its app compiler, absent in
// this plain Node SSR harness. Only adapt that leaf; all binding consumers run.
const reactURL = pathToFileURL(
  createRequire(import.meta.url).resolve('react'),
).href;
const imageAdapter = `data:text/javascript,${encodeURIComponent(`import React from ${JSON.stringify(reactURL)};export default function Image(props){const image={...props};delete image.unoptimized;return React.createElement('img',image);}`)}`;
registerHooks({
  resolve(specifier, context, nextResolve) {
    return specifier === 'next/image'
      ? { url: imageAdapter, shortCircuit: true }
      : nextResolve(specifier, context);
  },
});
const { GenericNode } =
  await import('../src/components/public/design-frame.tsx');
const { DesignEffects } =
  await import('../src/components/public/design-effects.tsx');
const { PublicDesignContext, useDesignBinding, useRecordDesignBinding } =
  await import('../src/components/public/design-context.tsx');
const { useSiteAppearance, setSiteAppearance } =
  await import('../src/components/public/site-chrome.tsx');
const { createCopperDesign } = await import('../src/design/runtime.ts');

const h = React.createElement;
const emptySite = { status: 'empty', publication: null };
const record = (id, title) => ({
  id,
  title,
  slug: `record-${id}`,
  visible: true,
});
const binding = (node, attributes = {}, behavior = {}) => ({
  style: {},
  declarations: {},
  parts: {},
  behavior,
  attributes: { 'data-design-node': node, ...attributes },
  sources: {},
  warnings: [],
});
const count = (html, attribute, value) =>
  (html.match(new RegExp(`\\s${attribute}="${value}"`, 'g')) ?? []).length;
function renderNode(
  node,
  {
    site = emptySite,
    anchor = `${node.id}-anchor`,
    attributes = {},
    behavior = {},
    children = null,
  } = {},
) {
  const runtime = {
    binding: (id) =>
      binding(
        id,
        id === node.id ? attributes : {},
        id === node.id ? behavior : {},
      ),
    appearance: { mode: 'dark', themeId: 'copper' },
    anchors: { [node.id]: anchor },
  };
  return renderToStaticMarkup(
    h(
      PublicDesignContext,
      { value: runtime },
      h(
        GenericNode,
        {
          node,
          attrs: {
            id: anchor,
            'data-design-node': node.id,
            'data-density': 'compact',
          },
          pageId: 'work',
          site,
        },
        children,
      ),
    ),
  );
}

test('generic project/post collections have one binding owner and one resolved anchor', () => {
  const content = {
    projects: [record(1, 'Project one'), record(2, 'Project two')],
    posts: [record(3, 'Post one'), record(4, 'Post two')],
  };
  const site = {
    status: 'ready',
    publication: {
      revision: 'synthetic',
      design: createCopperDesign(),
      media: [],
      redirects: {},
      content,
    },
  };
  for (const collection of ['projects', 'posts']) {
    const node = {
      id: `custom-${collection}`,
      kind: 'collection',
      scope: { values: {} },
      children: [],
      contentRef: { collection, id: String(content[collection][0].id) },
    };
    const html = renderNode(node, {
      site,
      attributes: { id: `${node.id}-anchor` },
      behavior: { 'collection.limit': 1 },
    });
    assert.equal(count(html, 'data-design-node', node.id), 1, html);
    assert.equal(count(html, 'id', `${node.id}-anchor`), 1, html);
    assert.match(html, /data-density="compact"/);
    assert.ok(html.includes(content[collection][0].title));
    assert.ok(!html.includes(content[collection][1].title));
  }
});

test('delegated empty collections preserve custom rendered children and anchor ownership', () => {
  for (const collection of ['projects', 'posts']) {
    const node = {
      id: `empty-${collection}`,
      kind: 'collection',
      scope: { values: {} },
      children: ['custom-empty'],
      contentRef: { collection, id: 'missing' },
    };
    const html = renderNode(node, {
      children: h(
        'p',
        { 'data-design-node': 'custom-empty' },
        'Selected custom empty layout',
      ),
    });
    assert.equal(count(html, 'data-design-node', node.id), 1);
    assert.equal(count(html, 'id', `${node.id}-anchor`), 1);
    assert.match(html, /Selected custom empty layout/);
  }
});

test('delegated controls retain fallback and explicit resolved anchors without wrapper duplication', () => {
  for (const kind of [
    'link',
    'button',
    'media',
    'dialog',
    'icon',
    'appearance',
    'progress',
    'section-navigation',
  ]) {
    const node = {
      id: `control-${kind}`,
      kind,
      scope: { values: {} },
      children: [],
      ...(['link', 'button'].includes(kind)
        ? { target: { pageId: 'home' } }
        : {}),
    };
    for (const explicit of [false, true]) {
      const anchor = explicit ? `chosen-${kind}` : node.id;
      const html = renderNode(node, {
        anchor,
        attributes: explicit ? { id: anchor } : {},
        children: 'Control content',
      });
      assert.equal(count(html, 'id', anchor), 1, `${kind}: ${html}`);
      assert.equal(
        count(html, 'data-design-node', node.id),
        1,
        `${kind}: ${html}`,
      );
    }
  }
});

test('section attributes and before/after content remain on the actual section', () => {
  const node = {
    id: 'custom-section',
    kind: 'section',
    scope: { values: {} },
    children: [],
  };
  const html = renderToStaticMarkup(
    h(
      PublicDesignContext,
      { value: { binding: (id) => binding(id) } },
      h(
        GenericNode,
        {
          node,
          site: emptySite,
          pageId: 'work',
          attrs: {
            id: 'section-anchor',
            'data-design-node': node.id,
            dir: 'rtl',
          },
          before: h('span', null, 'Before'),
          after: h('span', null, 'After'),
        },
        h('p', null, 'Actual child'),
      ),
    ),
  );
  assert.match(html, /<section[^>]*id="section-anchor"[^>]*dir="rtl"/);
  assert.ok(html.indexOf('Before') < html.indexOf('Actual child'));
  assert.ok(html.indexOf('Actual child') < html.indexOf('After'));
});

test('numeric zero reaches the animation API without becoming a single iteration', async (t) => {
  const { Window } = await import('happy-dom');
  const window = new Window({ url: 'http://localhost' });
  const globals = {
    window,
    document: window.document,
    HTMLElement: window.HTMLElement,
    Node: window.Node,
    navigator: window.navigator,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const originals = Object.fromEntries(
    Object.keys(globals).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  for (const [key, value] of Object.entries(globals))
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value,
    });
  const observerDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'IntersectionObserver',
  );
  globalThis.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe(target) {
      this.callback([{ target, isIntersecting: true }]);
    }
    disconnect() {}
  };
  const calls = [];
  let cancelled = 0;
  window.HTMLElement.prototype.animate = function (frames, options) {
    calls.push({ frames, options });
    return {
      playState: 'running',
      cancel() {
        cancelled++;
      },
      reverse() {},
    };
  };
  const { createRoot } = await import('react-dom/client');
  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container);
  t.after(async () => {
    await act(async () => root.unmount());
    await window.happyDOM.close();
    for (const key of Object.keys(globals)) {
      const descriptor = originals[key];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    if (observerDescriptor)
      Object.defineProperty(
        globalThis,
        'IntersectionObserver',
        observerDescriptor,
      );
    else delete globalThis.IntersectionObserver;
  });
  async function render(repeat, reducedMotion = false) {
    const behavior = {
      'motion.kind': 'fade',
      'motion.repeat': repeat,
      'motion.duration': { value: 150, unit: 'ms' },
    };
    await act(async () =>
      root.render(
        h(
          PublicDesignContext,
          {
            value: {
              binding: (id) => binding(id, {}, behavior),
              reducedMotion,
            },
          },
          h(
            'div',
            { className: 'public-surface' },
            h('div', { 'data-design-node': 'animated' }, 'Visible content'),
            h(DesignEffects),
          ),
        ),
      ),
    );
  }
  await render(0);
  assert.equal(calls.at(-1).options.iterations, 0);
  await render(3);
  assert.equal(calls.at(-1).options.iterations, 3);
  await render('loop');
  assert.equal(calls.at(-1).options.iterations, Infinity);
  await render('none');
  assert.equal(calls.at(-1).options.iterations, 1);
  const length = calls.length;
  await render(3, true);
  assert.equal(calls.length, length);
  assert.ok(cancelled >= 4);
  assert.equal(container.textContent, 'Visible content');
});

test('gallery delegates image behavior without repeating its binding owner or placement anchor', () => {
  const node = {
    id: 'custom-gallery',
    kind: 'gallery',
    scope: { values: {} },
    children: [],
    contentRef: { collection: 'projects', id: '1' },
  };
  const site = {
    status: 'ready',
    publication: {
      revision: 'synthetic',
      design: createCopperDesign(),
      redirects: {},
      content: { projects: [{ ...record(1, 'Gallery'), media: ['17', '18'] }] },
      media: [17, 18].map((id) => ({
        id,
        url: `/api/public/media/${id}`,
        mimeType: 'image/png',
        resourceVersion: `v${id}`,
        sha256: 'a'.repeat(64),
        alt: `Synthetic image ${id}`,
      })),
    },
  };
  const html = renderNode(node, {
    site,
    anchor: 'chosen-gallery',
    attributes: { id: 'chosen-gallery' },
    behavior: {
      'gallery.viewer': { mode: 'dialog', backdrop: '#000', controls: true },
    },
  });
  assert.equal(count(html, 'data-design-node', node.id), 1);
  assert.equal(count(html, 'id', 'chosen-gallery'), 1);
  assert.equal((html.match(/<figure/g) || []).length, 2);
  assert.equal((html.match(/<dialog/g) || []).length, 2);
  assert.match(html, /data-design-part="image"/);
});

test('repeated records borrow overrides without stealing the explicitly placed node anchor', () => {
  const explicit = binding(
    'selected-card',
    { id: 'selected-placement-anchor' },
    { 'record.expansion': { expanded: true, summaryLength: 0 } },
  );
  const shared = binding('work.card');
  function Probe() {
    const repeated = useRecordDesignBinding('work.card', 'projects', 1);
    const placed = useDesignBinding('selected-card');
    return h(
      'div',
      null,
      h(
        'article',
        { ...repeated.attributes, 'data-design-node': 'work.card' },
        'Repeated',
      ),
      h('article', placed.attributes, 'Placed'),
    );
  }
  const html = renderToStaticMarkup(
    h(
      PublicDesignContext,
      {
        value: {
          nodes: {
            'selected-card': {
              id: 'selected-card',
              kind: 'card',
              componentId: 'work.card',
              contentRef: { collection: 'projects', id: '1' },
              scope: { values: {} },
              children: [],
            },
          },
          binding: (id) => (id === 'selected-card' ? explicit : shared),
        },
      },
      h(Probe),
    ),
  );
  assert.equal(count(html, 'id', 'selected-placement-anchor'), 1);
  assert.equal(explicit.attributes.id, 'selected-placement-anchor');
  assert.equal(count(html, 'data-design-node', 'work.card'), 1);
});

test('removed theme preferences fall back consistently while valid themes, System mode and denied cookies work', async (t) => {
  const { Window } = await import('happy-dom');
  const window = new Window({ url: 'http://localhost' });
  let dark = false;
  const listeners = new Set();
  const media = {
    get matches() {
      return dark;
    },
    addEventListener(_name, listener) {
      listeners.add(listener);
    },
    removeEventListener(_name, listener) {
      listeners.delete(listener);
    },
  };
  window.matchMedia = () => media;
  const globals = {
    window,
    document: window.document,
    navigator: window.navigator,
    HTMLElement: window.HTMLElement,
    Node: window.Node,
    Event: window.Event,
    matchMedia: () => media,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const originals = Object.fromEntries(
    Object.keys(globals).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  for (const [key, value] of Object.entries(globals))
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value,
    });
  const { createRoot } = await import('react-dom/client');
  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container);
  t.after(async () => {
    await act(async () => root.unmount());
    await window.happyDOM.close();
    for (const key of Object.keys(globals)) {
      const descriptor = originals[key];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  function Probe({ allowed }) {
    const appearance = useSiteAppearance(
      'dark',
      'synthetic-violet',
      'system',
      null,
      allowed,
    );
    return h(
      'div',
      { 'data-design-theme': appearance.themeId, 'data-mode': appearance.mode },
      h(
        'select',
        { value: appearance.themeId, onChange: () => {} },
        allowed.map((id) => h('option', { key: id, value: id }, id)),
      ),
    );
  }
  window.document.cookie = 'desan-theme=removed-theme; Path=/';
  window.document.documentElement.dataset.theme = 'removed-theme';
  await act(async () =>
    root.render(h(Probe, { allowed: ['synthetic-violet', 'copper'] })),
  );
  assert.equal(
    container.firstElementChild.dataset.designTheme,
    'synthetic-violet',
  );
  assert.equal(
    window.document.documentElement.dataset.theme,
    'synthetic-violet',
  );
  assert.equal(container.querySelector('select').value, 'synthetic-violet');
  assert.equal(window.document.documentElement.dataset.mode, 'light');
  await act(async () =>
    setSiteAppearance('light', 'copper', { modeExplicit: false }),
  );
  assert.equal(container.querySelector('select').value, 'copper');
  await act(async () => {
    dark = true;
    listeners.forEach((listener) => listener());
  });
  assert.equal(window.document.documentElement.dataset.mode, 'dark');
  assert.equal(container.querySelector('select').value, 'copper');
  await act(async () =>
    root.render(h(Probe, { allowed: ['synthetic-violet'] })),
  );
  assert.equal(container.querySelector('select').value, 'synthetic-violet');
  assert.equal(
    window.document.documentElement.dataset.theme,
    'synthetic-violet',
  );
  Object.defineProperty(window.document, 'cookie', {
    configurable: true,
    get() {
      throw new Error('Cookie access denied');
    },
    set() {
      throw new Error('Cookie access denied');
    },
  });
  await act(async () => setSiteAppearance('light', 'synthetic-violet'));
  assert.equal(window.document.documentElement.dataset.mode, 'light');
  assert.equal(container.querySelector('select').value, 'synthetic-violet');
});
