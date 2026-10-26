import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const { PublicDesignContext } =
  await import('../src/components/public/design-context.tsx');
const {
  BoundRecord,
  BoundRecordDetails,
  BoundRecordSummary,
  BoundRelationGroups,
  BoundSkillGrid,
  BoundSkillCard,
  BoundPrintButton,
  summaryPreview,
} = await import('../src/components/public/bound-professional.tsx');
const { BoundField, BoundFilterBar } =
  await import('../src/components/public/bound-form.tsx');
const h = React.createElement;
function render(component, behavior = {}, context = {}) {
  return renderToStaticMarkup(
    h(
      PublicDesignContext,
      {
        value: {
          binding: () => ({
            behavior,
            attributes: {},
            declarations: {},
            style: {},
            parts: {},
            sources: {},
            warnings: [],
          }),
          ...context,
        },
      },
      component,
    ),
  );
}
test('summary expansion preserves full published text and valid Unicode graphemes, including zero preview', () => {
  const text = 'A👨‍👩‍👧‍👦é complete professional description';
  assert.equal(summaryPreview(text, 2), 'A👨‍👩‍👧‍👦…');
  const html = render(h(BoundRecordSummary, { text }), {
    'record.expansion': { expanded: true, summaryLength: 2 },
  });
  assert.ok(html.includes(text));
  assert.match(html, /<details[^>]*open=/);
  assert.match(html, /Read full summary/);
  const zero = render(h(BoundRecordSummary, { text }), {
    'record.expansion': { expanded: false, summaryLength: 0 },
  });
  assert.ok(zero.includes(text));
  assert.match(zero, /<details/);
  assert.doesNotMatch(zero, /<details[^>]*open=/);
  assert.equal(render(h(BoundRecordSummary, { text })), `<p>${text}</p>`);
});
test('record narrow layout and source identity use the selected route without inventing record fields', () => {
  const html = render(
    h(
      BoundRecord,
      { collection: 'education', id: 7, page: 'resume' },
      'Public record',
    ),
    { 'record.narrowLayout': 'metadata-wrap' },
    { viewportWidth: 390 },
  );
  assert.match(html, /data-design-node="resume.record"/);
  assert.match(html, /data-design-content-id="7"/);
  assert.match(html, /flex-wrap:wrap/);
  assert.match(html, /id="education-7"/);
  const expanded = render(
    h(
      BoundRecordDetails,
      { title: 'Details' },
      'Complete source-backed public details',
    ),
    { 'record.expansion': { expanded: true, summaryLength: 4 } },
  );
  assert.match(expanded, /open=/);
  assert.match(expanded, /Complete source-backed public details/);
});
test('skill group choice changes presentation order without manufacturing or duplicating relationships', () => {
  const groups = [
    { id: 'projects', children: h('p', null, 'Public project') },
    { id: 'education', children: h('p', null, 'Public education') },
  ];
  const html = render(h(BoundRelationGroups, { groups, skill: true }), {
    'skill.contextGrouping': ['education', 'project', 'project'],
  });
  assert.ok(html.indexOf('Public education') < html.indexOf('Public project'));
  assert.equal(html.split('Public project').length - 1, 1);
  assert.equal(
    render(h(BoundRelationGroups, { groups, skill: true }), {
      'skill.contextGrouping': [],
    }),
    '',
  );
  assert.match(
    render(h(BoundRelationGroups, { groups, skill: false }), {
      'skill.contextGrouping': [],
    }),
    /Public project/,
  );
});
test('grouped/chip/panel skills retain public content and stable deep-link identity', () => {
  const items = [
    { id: 1, category: 'Hardware' },
    { id: 2, category: 'Software' },
  ];
  const html = render(
    h(
      BoundSkillGrid,
      { items },
      h(
        BoundSkillCard,
        { id: '1', title: 'Circuit design' },
        'Complete context one',
      ),
      h(
        BoundSkillCard,
        { id: '2', title: 'Software design' },
        'Complete context two',
      ),
    ),
    { 'skill.presentation': 'grouped', 'skill.detailEntry': 'panel' },
  );
  assert.match(html, /<h3>Hardware<\/h3>/);
  assert.match(html, /<h3>Software<\/h3>/);
  assert.match(html, /id="skill-1"/);
  assert.match(html, /<summary>Circuit design<\/summary>/);
  assert.match(html, /Complete context one/);
});
test('field arrangement/label/help/error preserves accessible input identity and invalid state', () => {
  const html = render(
    h(BoundField, {
      node: 'profile.input',
      label: 'Search skills',
      help: 'Published records only',
      error: 'Try a shorter query',
      input: { name: 'q', type: 'search' },
    }),
    {
      'field.arrangement': { layout: 'inline', label: 'after' },
      'field.helpErrorPlacement': 'before',
    },
  );
  const id = html.match(/<input[^>]*\sid="([^"]+)"/)[1];
  assert.ok(html.includes(`for="${id}"`));
  assert.ok(html.includes(`aria-describedby="${id}-help"`));
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /role="alert"/);
  assert.match(html, /flex-direction:row/);
  assert.ok(html.indexOf('Try a shorter query') < html.indexOf('<input'));
});
test('filter select/drawer retain canonical existing navigation and no arbitrary external options', () => {
  const links = [
    h(
      'a',
      {
        href: '/work?category=hardware',
        'aria-current': 'true',
        key: 'hardware',
      },
      'Hardware',
    ),
    h('a', { href: '/work?category=software', key: 'software' }, 'Software'),
    h('a', { href: 'javascript:alert(1)', key: 'bad' }, 'Unsafe'),
  ];
  const select = render(h(BoundFilterBar, { node: 'work.filter' }, links), {
    'filter.presentation': 'select',
  });
  assert.match(select, /<select/);
  assert.match(select, /value="\/work\?category=hardware"/);
  assert.doesNotMatch(select, /javascript:|Unsafe/);
  const drawer = render(
    h(BoundFilterBar, { node: 'work.filter' }, links.slice(0, 2)),
    { 'filter.presentation': 'drawer' },
  );
  assert.match(drawer, /<details/);
  assert.match(drawer, /<summary>Filters<\/summary>/);
  assert.match(drawer, /position:fixed/);
  assert.match(drawer, /Software/);
});

test('explicit RSC-safe filter/input props do not rely on inspecting server child elements', () => {
  const filters = render(
    h(BoundFilterBar, {
      node: 'work.filter',
      options: [
        { href: '/work?type=hardware', label: 'Hardware', selected: true },
      ],
      children: null,
    }),
    { 'filter.presentation': 'select' },
  );
  assert.match(filters, /<option[^>]*selected/);
  assert.match(filters, /Hardware/);
  const field = render(
    h(BoundField, {
      node: 'work.input',
      label: 'Search',
      input: { type: 'search', name: 'q', defaultValue: 'published' },
    }),
  );
  assert.match(field, /value="published"/);
  assert.match(field, /data-design-part="field"/);
});
test('print presentation uses validated paper and typed margins without altering visible records', () => {
  const html = render(h(BoundPrintButton, null, 'Print profile'), {
    'resume.printPresentation': {
      paper: 'letter',
      margins: [{ value: 24, unit: 'px' }],
    },
  });
  assert.match(html, /media="print"/);
  assert.match(html, /size:letter/);
  assert.match(html, /Print profile/);
});

test('record-specific behavior reaches nested details while shared role attributes remain stable', () => {
  const fallback = {
    behavior: { 'record.expansion': { expanded: false, summaryLength: 100 } },
    attributes: {},
    declarations: {},
    style: {},
    parts: {},
    sources: {},
    warnings: [],
  };
  const override = {
    ...fallback,
    behavior: { 'record.expansion': { expanded: true, summaryLength: 0 } },
  };
  const component = h(
    BoundRecord,
    { collection: 'education', id: 7 },
    h(BoundRecordSummary, { text: 'A complete selected public description' }),
  );
  const html = render(
    component,
    {},
    {
      nodes: {
        specific: {
          id: 'specific',
          kind: 'record',
          componentId: 'profile.record',
          contentRef: { collection: 'education', id: '7' },
          scope: { values: {} },
          children: [],
        },
      },
      binding: (id) => (id === 'specific' ? override : fallback),
    },
  );
  assert.match(html, /data-design-node="profile.record"/);
  assert.match(html, /<details[^>]*open=/);
  assert.match(html, /A complete selected public description/);
});
