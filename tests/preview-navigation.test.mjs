import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { registerHooks, createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { Window } from 'happy-dom';
import { readdir, readFile } from 'node:fs/promises';
import ts from 'typescript';
const reactURL = pathToFileURL(
  createRequire(import.meta.url).resolve('react'),
).href;
const adapter = `data:text/javascript,${encodeURIComponent(`import React from ${JSON.stringify(reactURL)};export default function Link(props){globalThis.__previewNextCalls=(globalThis.__previewNextCalls||0)+1;const {prefetch,children,...rest}=props;return React.createElement('a',{...rest,'data-next-prefetch':String(prefetch)},children);}`)}`;
registerHooks({
  resolve(s, c, n) {
    return s === 'next/link' ? { url: adapter, shortCircuit: true } : n(s, c);
  },
});
const { previewDestination, previewHref } =
  await import('../src/components/owner/preview-navigation-url.ts');
const { PreviewNavigation } =
  await import('../src/components/owner/preview-navigation.tsx');
const {
  default: PublicLink,
  PublicAnchor,
  PublicGetForm,
} = await import('../src/components/public/public-link.tsx');
const { BoundFilterBar } =
  await import('../src/components/public/bound-form.tsx');
const { PublicDesignContext } =
  await import('../src/components/public/design-context.tsx');
const { RichText } = await import('../src/components/public/rich-text.tsx');
const h = React.createElement;
const receipt = '11111111-2222-4333-8444-555555555555';
const context = {
  receipt,
  origin: 'https://portfolio.test',
  pathname: '/work/current-project',
};
const wrap = (children) => h(PreviewNavigation, context, children);
test('all public route and component link consumers participate in preview routing rather than mounting Next Link directly', async () => {
  const bypasses = [];
  async function inspect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = new URL(
        entry.name + (entry.isDirectory() ? '/' : ''),
        directory,
      );
      if (entry.isDirectory()) await inspect(file);
      else if (
        entry.name.endsWith('.tsx') &&
        entry.name !== 'public-link.tsx'
      ) {
        const source = ts.createSourceFile(
          entry.name,
          await readFile(file, 'utf8'),
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX,
        );
        for (const statement of source.statements)
          if (
            ts.isImportDeclaration(statement) &&
            statement.moduleSpecifier.text === 'next/link' &&
            statement.importClause?.name
          )
            bypasses.push(file.pathname);
      }
    }
  }
  await inspect(new URL('../src/components/public/', import.meta.url));
  await inspect(new URL('../src/app/(frontend)/', import.meta.url));
  assert.deepEqual(
    bypasses,
    [],
    'Default Next Link imports bypass private href/prefetch routing',
  );
});

test('supported navigation is private before interaction; encoded paths, repeated query values, hashes and receipt identity survive', () => {
  for (const path of [
    '/',
    '/work',
    '/work/encoded%20project',
    '/journal',
    '/journal/my-post',
    '/profile',
    '/contact',
    '/resume',
    '/search',
    '/not-found',
  ]) {
    const url = new URL(previewDestination(path, context), context.origin);
    assert.equal(url.pathname, '/owner/preview' + (path === '/' ? '' : path));
    assert.equal(url.searchParams.get('receipt'), receipt);
  }
  const url = new URL(
    previewDestination(
      'https://portfolio.test/work/a%2Fb?q=a%2Bb&tag=x&tag=y#details',
      context,
    ),
    context.origin,
  );
  assert.equal(url.pathname, '/owner/preview/work/a%2Fb');
  assert.equal(url.searchParams.get('q'), 'a+b');
  assert.deepEqual(url.searchParams.getAll('tag'), ['x', 'y']);
  assert.equal(url.hash, '#details');
  const relative = new URL(
    previewDestination('../journal?draft=1', context),
    context.origin,
  );
  assert.equal(relative.pathname, '/owner/preview/journal');
});
test('external, fragment, download endpoints, owner/API paths and unsafe path lookalikes are preserved without receipt disclosure', () => {
  for (const path of [
    '#skills',
    '',
    'https://external.test/work',
    'mailto:owner@example.test',
    'tel:+123',
    '/api/owner/media/3',
    '/owner/design',
    '/owner/preview-evil/work',
    '/feed.xml',
    '/work/a/b',
    '//external.test/profile',
    '/work\\evil',
  ])
    assert.equal(previewDestination(path, context), undefined, path);
  assert.equal(previewHref('/work', null), '/work');
  assert.equal(
    previewDestination('/work', { ...context, receipt: 'invalid' }),
    undefined,
  );
});
test('already private URLs are idempotent and cannot substitute another receipt', () => {
  const href = previewDestination(
    '/owner/preview/work?q=one&receipt=other#point',
    context,
  );
  assert.equal(previewDestination(href, context), href);
  assert.equal(
    new URL(href, context.origin).searchParams.get('receipt'),
    receipt,
  );
});
test('server-rendered preview links never mount NextLink or forward its prefetch/navigation props', () => {
  globalThis.__previewNextCalls = 0;
  const html = renderToStaticMarkup(
    wrap(
      h(
        PublicLink,
        {
          href: '/work?a=1',
          prefetch: true,
          replace: true,
          scroll: false,
          target: '_blank',
          className: 'project-link',
        },
        'Work',
      ),
    ),
  );
  assert.equal(globalThis.__previewNextCalls, 0);
  assert.match(html, /href="\/owner\/preview\/work\?a=1&amp;receipt=/);
  assert.match(html, /target="_blank"/);
  assert.doesNotMatch(html, /prefetch|replace=|scroll=|data-next/);
  const publicHtml = renderToStaticMarkup(
    h(PublicLink, { href: '/work', prefetch: true }, 'Work'),
  );
  assert.equal(globalThis.__previewNextCalls, 1);
  assert.match(publicHtml, /href="\/work"/);
  assert.match(publicHtml, /data-next-prefetch="true"/);
});
test('native rich-text/internal anchors render private hrefs; external, fragment and explicit download behavior stay intact', () => {
  const html = renderToStaticMarkup(
    wrap(
      h(
        'div',
        null,
        h(PublicAnchor, { href: '/profile#skills' }, 'Profile'),
        h(PublicAnchor, { href: '#local' }, 'Local'),
        h(PublicLink, { href: '/work/download', download: true }, 'Download'),
        h(
          PublicAnchor,
          {
            href: 'https://external.test/profile',
            target: '_blank',
            rel: 'noreferrer',
          },
          'External',
        ),
        h(RichText, {
          value: {
            root: {
              children: [
                {
                  type: 'link',
                  url: '/journal/post',
                  children: [{ type: 'text', text: 'Read post' }],
                },
              ],
            },
          },
        }),
      ),
    ),
  );
  assert.match(html, /\/owner\/preview\/profile\?receipt=[^"]+#skills/);
  assert.match(html, /href="#local"/);
  assert.match(html, /href="\/work\/download"/);
  assert.match(html, /href="https:\/\/external.test\/profile"/);
  assert.match(html, /href="\/owner\/preview\/journal\/post\?receipt=/);
});
test('GET forms contain a private action and receipt input before hydration; POST and external forms never acquire the receipt', () => {
  const get = renderToStaticMarkup(
    wrap(
      h(
        PublicGetForm,
        { action: '/search', method: 'get', target: '_blank' },
        h('input', { name: 'q', defaultValue: 'draft query' }),
      ),
    ),
  );
  assert.match(get, /action="\/owner\/preview\/search\?receipt=/);
  assert.match(get, new RegExp(`name="receipt" value="${receipt}"`));
  assert.match(get, /name="q"/);
  for (const props of [
    { action: '/contact', method: 'post' },
    { action: 'https://external.test/search', method: 'get' },
  ]) {
    const html = renderToStaticMarkup(wrap(h(PublicGetForm, props)));
    assert.ok(!html.includes(receipt));
  }
  const publicHtml = renderToStaticMarkup(
    h(PublicGetForm, { action: '/search', method: 'get' }),
  );
  assert.match(publicHtml, /action="\/search"/);
  assert.ok(!publicHtml.includes(receipt));
});

async function mount(t, children) {
  const window = new Window({
    url: context.origin + '/owner/preview/work?receipt=' + receipt,
  });
  const globals = {
    window,
    document: window.document,
    navigator: window.navigator,
    HTMLElement: window.HTMLElement,
    Node: window.Node,
    Event: window.Event,
    MouseEvent: window.MouseEvent,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previous = {};
  for (const [key, value] of Object.entries(globals)) {
    previous[key] = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value,
    });
  }
  const { createRoot } = await import('react-dom/client');
  const rootNode = window.document.createElement('div');
  window.document.body.append(rootNode);
  const root = createRoot(rootNode);
  await act(async () => root.render(wrap(children)));
  t.after(async () => {
    await act(async () => root.unmount());
    await window.happyDOM.close();
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { window, rootNode };
}
test('modified and middle clicks retain native behavior and already private hrefs', async (t) => {
  const { window, rootNode } = await mount(
    t,
    h(PublicLink, { href: '/profile' }, 'Profile'),
  );
  const anchor = rootNode.querySelector('a');
  assert.ok(anchor.href.includes('/owner/preview/profile?receipt='));
  for (const props of [
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { button: 1 },
  ]) {
    const event = new window.MouseEvent(
      props.button === 1 ? 'auxclick' : 'click',
      { ...props, bubbles: true, cancelable: true },
    );
    anchor.addEventListener(
      event.type,
      (e) => {
        assert.equal(e.defaultPrevented, false);
        e.preventDefault();
      },
      { once: true },
    );
    await act(async () => anchor.dispatchEvent(event));
    assert.ok(anchor.href.includes(receipt));
  }
});
test('selectable filters use the same receipt-aware destination while their public option identity stays stable', async (t) => {
  const runtime = {
    binding: () => ({
      behavior: { 'filter.presentation': 'select' },
      attributes: {},
      style: {},
      parts: {},
      declarations: {},
      sources: {},
      warnings: [],
    }),
  };
  const { window, rootNode } = await mount(
    t,
    h(
      PublicDesignContext,
      { value: runtime },
      h(BoundFilterBar, {
        node: 'work.filter',
        options: [
          { href: '/work?category=all', label: 'All', selected: true },
          { href: '/work?category=embedded', label: 'Embedded' },
        ],
      }),
    ),
  );
  let assigned;
  window.location.assign = (href) => {
    assigned = href;
  };
  const select = rootNode.querySelector('select');
  assert.equal(select.options[1].value, '/work?category=embedded');
  await act(async () => {
    select.value = '/work?category=embedded';
    select.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
  const url = new URL(assigned, context.origin);
  assert.equal(url.pathname, '/owner/preview/work');
  assert.equal(url.searchParams.get('category'), 'embedded');
  assert.equal(url.searchParams.get('receipt'), receipt);
});
