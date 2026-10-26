import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RichText } from '../src/components/public/rich-text.tsx';
import { presentCollection } from '../src/components/public/collection-order.ts';
import { paginate } from '../src/public-data/index.ts';

test('rich text retains long-form tails and renders unsafe content inert', () => {
  const paragraph = (value) => ({
    type: 'paragraph',
    children: [{ type: 'text', text: value }],
  });
  const value = {
    root: {
      type: 'root',
      children: [
        paragraph('<script>private()</script>'),
        ...Array.from({ length: 500 }, (_, i) => paragraph(`Paragraph ${i}`)),
        {
          type: 'link',
          fields: { url: 'javascript:alert(1)' },
          children: [{ type: 'text', text: 'Unsafe URL' }],
        },
        paragraph('FINAL VISIBLE TAIL'),
      ],
    },
  };
  const html = renderToStaticMarkup(React.createElement(RichText, { value }));
  assert.match(html, /FINAL VISIBLE TAIL/);
  assert.match(html, /Paragraph 499/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /href="javascript:|<script>/);
});
test('over-limit rich text reports unavailability rather than silently truncating', () => {
  const value = {
    root: {
      type: 'root',
      children: Array.from({ length: 12000 }, () => ({
        type: 'text',
        text: 'VISIBLE PREFIX',
      })),
    },
  };
  const html = renderToStaticMarkup(React.createElement(RichText, { value }));
  assert.match(html, /cannot be displayed/);
  assert.doesNotMatch(html, /VISIBLE PREFIX/);
});
test('owner collection ordering and limit precede pagination across page boundaries', () => {
  const items = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    slug: `item-${i}`,
    title: `Item ${String(19 - i).padStart(2, '0')}`,
    visible: true,
  }));
  const presented = presentCollection(items, {
    'collection.displayOrder': 'title',
    'collection.limit': 10,
  });
  assert.equal(presented.length, 10);
  assert.equal(
    paginate(presented, { page: 1, pageSize: 6 }).items[0].title,
    'Item 00',
  );
  assert.deepEqual(
    paginate(presented, { page: 2, pageSize: 6 }).items.map(
      (item) => item.title,
    ),
    ['Item 06', 'Item 07', 'Item 08', 'Item 09'],
  );
  assert.equal(items[0].title, 'Item 19');
});
