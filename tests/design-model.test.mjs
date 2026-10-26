import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';

// Node's TS stripping intentionally does not resolve extensionless TS imports; Next does.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      context.parentURL?.endsWith('/src/design/model.ts') &&
      specifier === './schema'
    )
      return nextResolve(
        new URL('../src/design/schema.ts', import.meta.url).href,
        context,
      );
    return nextResolve(specifier, context);
  },
});
const {
  createEmptyDesign,
  validateDesign,
  assertValidDesign,
  resolvePresentation,
  importDesign,
  exportDesign,
  migrateDesign,
  resetOverride,
  DesignValidationError,
} = await import('../src/design/model.ts');

const px = (value) => ({ value, unit: 'px' });
const rem = (value) => ({ value, unit: 'rem' });
const rights = {
  license: 'OFL-1.1',
  attribution: 'Synthetic test asset',
  redistributable: true,
};
function fixture() {
  const data = createEmptyDesign('synthetic-design');
  data.defaultThemeId = 'cobalt';
  data.visitorThemeIds = ['cobalt', 'paper'];
  data.fonts = [
    {
      id: '42',
      version: 'font-v3',
      sha256: 'a'.repeat(64),
      rights,
      family: 'Synthetic Variable',
      style: 'normal',
      weight: { min: 100, max: 900 },
      axes: [{ tag: 'wght', min: 100, max: 900 }],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ];
  data.assets = [
    {
      id: '43',
      version: 'asset-v7',
      sha256: 'b'.repeat(64),
      rights,
      kind: 'image',
    },
  ];
  data.tokens = {
    ink: { property: 'text.color', value: '#00FF99E3' },
    gap: { property: 'gap.row', value: rem(3.14159) },
  };
  data.themes = [
    {
      id: 'cobalt',
      name: 'Cobalt & lime',
      tokens: { accent: { property: 'accent.color', value: '#EB00FF' } },
      modes: {
        base: {
          values: {
            'text.color': { $token: 'ink' },
            'accent.color': { $token: 'accent' },
            'font.family': { fontId: '42' },
          },
        },
        light: { values: { 'background.color': '#F0FFFF' } },
        dark: { values: { 'background.color': '#00001F' } },
      },
    },
    {
      id: 'paper',
      name: 'Unrelated paper theme',
      modes: {
        base: { values: { 'text.color': '#182330' } },
        light: { values: { 'background.color': '#FFFFFF' } },
        dark: { values: { 'background.color': '#202020' } },
      },
    },
  ];
  data.breakpoints = [
    { id: 'wide', minWidth: 1537 },
    { id: 'phone', minWidth: 419.5 },
    { id: 'tablet', minWidth: 777 },
  ];
  data.defaults = {
    values: {
      'font.size': px(18),
      'layout.columns': [{ fr: 1 }, { min: px(200), max: { fr: 2 } }],
      'gap.row': { $token: 'gap' },
      'motion.kind': 'translate',
      'motion.duration': { value: 0.18, unit: 's' },
    },
    breakpoints: [
      {
        id: 'tablet',
        values: { 'font.size': px(19) },
        states: [{ when: ['hover'], values: { 'font.size': px(99) } }],
      },
    ],
  };
  data.sharedComponents = [
    {
      id: 'headline',
      kind: 'heading',
      scope: { values: { 'font.weight': 613, 'text.align': 'start' } },
    },
  ];
  data.nodes = [
    {
      id: 'split-hero',
      kind: 'split',
      scope: {
        values: {
          'layout.mode': 'split',
          'layout.columns': [{ fr: 3 }, { fr: 7 }],
          'layout.areas': [
            ['intro', 'image'],
            ['intro', 'image'],
          ],
        },
      },
      children: ['title', 'visual'],
    },
    {
      id: 'title',
      kind: 'heading',
      componentId: 'headline',
      contentRef: { collection: 'profile', id: '1' },
      scope: {
        values: {
          'font.size': px(22),
          'font.variableAxes': { wght: 613 },
          'font.lineHeight': 1.217,
        },
        states: [
          { when: ['hover'], values: { 'text.color': '#EE00AA' } },
          {
            when: ['focus-visible'],
            values: { 'outline.color': '#FFFF00', 'outline.width': px(3) },
          },
          { when: ['error'], values: { 'text.color': '#AA0000' } },
          { when: ['disabled'], values: { opacity: 0.12345 } },
          {
            when: ['hover', 'focus-visible'],
            values: { 'text.color': '#00BBCC' },
          },
        ],
        breakpoints: [
          {
            id: 'tablet',
            values: { 'font.size': px(24) },
            states: [{ when: ['hover'], values: { 'font.size': px(26) } }],
          },
        ],
      },
      children: [],
    },
    {
      id: 'visual',
      kind: 'media',
      scope: {
        values: {
          'media.asset': { assetId: '43' },
          'media.crop': { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
          'media.focalPoint': { x: 37.123, y: 80.2 },
          aspectRatio: { width: 17, height: 9 },
          'media.fit': 'contain',
        },
      },
      children: [],
    },
  ];
  data.templates = [
    {
      id: 'home',
      scope: { values: { 'font.size': px(20) } },
      rootIds: ['split-hero'],
    },
  ];
  data.pages = [
    {
      id: 'stable-page-id',
      templateId: 'home',
      scope: { values: {} },
      rootIds: [],
    },
  ];
  return data;
}
const valid = (data) => {
  const r = validateDesign(data);
  assert.equal(r.valid, true, JSON.stringify(r));
  return r;
};
const invalid = (data, code) => {
  const r = validateDesign(data);
  assert.equal(r.valid, false);
  if (code)
    assert.ok(
      r.errors.some((x) => x.code === code),
      JSON.stringify(r.errors),
    );
  return r;
};

test('arbitrary themes, fractional units, versioned fonts, split layouts and media round-trip exactly', () => {
  const input = fixture();
  const before = JSON.stringify(input);
  const result = valid(input);
  assert.deepEqual(result.references, {
    mediaIds: ['42', '43'],
    fontIds: ['42'],
  });
  assert.equal(
    JSON.stringify(input),
    before,
    'validation must not mutate the caller',
  );
  const serialized = exportDesign(input);
  const imported = importDesign(serialized);
  assert.equal(imported.valid, true);
  assert.equal(exportDesign(imported.data), serialized);
  assert.equal(imported.data.tokens.gap.value.value, 3.14159);
  assert.deepEqual(
    imported.data.breakpoints.map((x) => x.id),
    ['phone', 'tablet', 'wide'],
  );
  assert.notEqual(imported.data.themes[0].name, imported.data.themes[1].name);
  const presentation = resolvePresentation(input, {
    pageId: 'stable-page-id',
    nodeId: 'title',
    mode: 'dark',
    width: 600,
  });
  assert.equal(presentation.values['accent.color'], '#EB00FF');
  assert.equal(presentation.values['font.weight'], 613);
  assert.deepEqual(presentation.values['gap.row'], rem(3.14159));
});

test('scope-first inheritance, threshold boundaries and explicit combined state precedence', () => {
  const input = fixture();
  const resolve = (width, states = []) =>
    resolvePresentation(input, {
      pageId: 'stable-page-id',
      nodeId: 'title',
      mode: 'light',
      width,
      states,
    });
  assert.deepEqual(resolve(776.999, ['hover']).values['font.size'], px(22));
  assert.deepEqual(resolve(777).values['font.size'], px(24));
  assert.deepEqual(resolve(777.001, ['hover']).values['font.size'], px(26));
  assert.match(
    resolve(800, ['hover']).sources['font.size'],
    /node:title:breakpoint:tablet:state:hover/,
  );
  const combined = resolve(800, [
    'disabled',
    'error',
    'focus-visible',
    'hover',
  ]);
  assert.equal(combined.values['text.color'], '#AA0000');
  assert.equal(combined.values.opacity, 0.12345);
  assert.equal(combined.disabled, true);
  assert.deepEqual(combined.focusIndicator, {
    'outline.color': '#FFFF00',
    'outline.width': px(3),
  });
  assert.equal(
    resolve(800, ['focus-visible', 'hover', 'disabled', 'error']).values[
      'text.color'
    ],
    combined.values['text.color'],
  );
  assert.equal(
    resolve(800, ['focus-visible', 'hover']).values['text.color'],
    '#00BBCC',
  );
});

test('unset inherits; zero, false, transparent, none and empty lists survive until explicit reset', () => {
  const input = fixture();
  const local = input.nodes[1].scope;
  local.values = {
    'font.size': px(0),
    opacity: 0,
    visibility: false,
    'text.color': 'transparent',
    'shadow.layers': [],
    'motion.kind': 'none',
    'layout.columns': [],
  };
  const r = resolvePresentation(input, {
    nodeId: 'title',
    mode: 'dark',
    width: 0,
  });
  assert.deepEqual(r.values['font.size'], px(0));
  assert.equal(r.values.opacity, 0);
  assert.equal(r.values.visibility, false);
  assert.equal(r.values['text.color'], 'transparent');
  assert.deepEqual(r.values['shadow.layers'], []);
  assert.deepEqual(r.values['layout.columns'], []);
  const reset = resetOverride(local, 'font.size');
  assert.ok(!Object.hasOwn(reset.values, 'font.size'));
  assert.deepEqual(local.values['font.size'], px(0));
  input.nodes[1].scope = reset;
  assert.deepEqual(
    resolvePresentation(input, { nodeId: 'title', mode: 'dark', width: 0 })
      .values['font.size'],
    px(18),
  );
  const hoverReset = resetOverride(local, 'font.size', {
    breakpointId: 'tablet',
    when: ['hover'],
  });
  assert.ok(
    !Object.hasOwn(hoverReset.breakpoints[0].states[0].values, 'font.size'),
  );
});

test('missing, cyclic, incompatible and extra-field token imports reject without silent loss', () => {
  for (const mutate of [
    (d) => {
      d.tokens.ink.value = { $token: 'missing' };
    },
    (d) => {
      d.tokens.ink.value = { $token: 'ink' };
    },
    (d) => {
      d.tokens.ink.value = { $token: 'gap' };
    },
    (d) => {
      d.tokens.ink.value = { $token: 'gap', javascript: 'run' };
    },
    (d) => {
      d.nodes[1].scope.values['font.size'] = { $token: 'ink' };
    },
  ]) {
    const data = fixture();
    mutate(data);
    invalid(data);
  }
});

test('unknown schema, properties, components and unsupported CSS are explicit errors', () => {
  for (const mutate of [
    (d) => {
      d.schemaVersion = 900;
    },
    (d) => {
      d.componentRegistryVersion = 99;
    },
    (d) => {
      d.nodes[0].kind = 'custom-script';
    },
    (d) => {
      d.defaults.values['background.color'] = 'url(https://tracker.invalid)';
    },
    (d) => {
      d.defaults.values.onClick = 'alert(1)';
    },
    (d) => {
      d.defaults.css = 'body{display:none}';
    },
    (d) => {
      d.assets[0].url = 'https://tracker.invalid';
    },
  ]) {
    const data = fixture();
    mutate(data);
    invalid(data);
  }
  invalid({ ...fixture(), schemaVersion: 12 }, 'unsupported-version');
});

test('malicious non-JSON inputs, accessors, prototype keys, nonfinite values and cycles are rejected', () => {
  let executed = false;
  const accessor = fixture();
  Object.defineProperty(accessor, 'danger', {
    enumerable: true,
    get() {
      executed = true;
      throw new Error('must never execute');
    },
  });
  invalid(accessor, 'unsafe-data');
  assert.equal(executed, false);
  const cyclic = fixture();
  cyclic.tokens.loop = cyclic;
  invalid(cyclic, 'cycle');
  for (const number of [NaN, Infinity, -Infinity]) {
    const d = fixture();
    d.defaults.values.opacity = number;
    invalid(d);
  }
  const polluted = JSON.parse(exportDesign(fixture()));
  polluted.tokens = JSON.parse('{"__proto__":{"polluted":true}}');
  invalid(polluted, 'unsafe-data');
  assert.equal({}.polluted, undefined);
  const fake = fixture();
  fake.defaults.values.visibility = undefined;
  invalid(fake);
  assert.equal(importDesign('{broken').valid, false);
  assert.equal(importDesign('x'.repeat(2_000_001)).valid, false);
  const html = fixture();
  html.themes[0].name = '<script>alert(1)</script>';
  invalid(html);
});

test('reference and geometry validation catches invalid layout trees and missing dependencies', () => {
  for (const mutate of [
    (d) => {
      d.nodes[0].children.push('absent');
    },
    (d) => {
      d.nodes[0].children.push('title');
    },
    (d) => {
      d.nodes[1].kind = 'container';
      d.nodes[1].componentId = undefined;
      delete d.nodes[1].componentId;
      d.nodes[1].children = ['split-hero'];
    },
    (d) => {
      d.nodes[1].kind = 'link';
      delete d.nodes[1].componentId;
      d.nodes[1].children = ['visual'];
      d.nodes[0].children = ['title'];
      d.nodes[2].kind = 'button';
    },
    (d) => {
      d.nodes[2].children = ['title'];
    },
    (d) => {
      d.nodes[1].scope.values['font.family'] = { fontId: 'missing' };
    },
    (d) => {
      d.nodes[2].scope.values['media.asset'] = { assetId: 'missing' };
    },
    (d) => {
      d.breakpoints.push({ id: 'collision', minWidth: 777 });
    },
    (d) => {
      d.nodes[1].scope.breakpoints[0].id = 'absent';
    },
    (d) => {
      d.nodes[0].scope.values['layout.areas'] = [
        ['intro', 'image'],
        ['image', 'intro'],
      ];
    },
    (d) => {
      d.nodes[2].scope.values['media.crop'].width = 1;
    },
    (d) => {
      d.pages[0].templateId = 'absent';
    },
    (d) => {
      d.pages.push({ id: 'other-page', scope: { values: {} }, rootIds: [] });
      d.nodes[1].target = { pageId: 'other-page', nodeId: 'visual' };
    },
    (d) => {
      d.nodes[1].scope.values['section.anchor'] = 'same';
      d.nodes[2].scope.values['section.anchor'] = 'same';
    },
    (d) => {
      d.nodes[1].scope.breakpoints[0].values['section.anchor'] = 'unstable';
    },
    (d) => {
      d.fonts[0].fallbacks = [{ fontId: '42' }];
    },
    (d) => {
      d.tokens.unused = {
        property: 'font.family',
        value: { fontId: 'absent' },
      };
    },
  ]) {
    const d = fixture();
    mutate(d);
    invalid(d);
  }
});

test('exact explicit legacy migration; ambiguous/future formats fail; import never changes input/live', () => {
  const data = fixture();
  const legacy = structuredClone(data);
  delete legacy.schemaVersion;
  legacy.version = 0;
  const before = JSON.stringify(legacy);
  const result = migrateDesign(legacy);
  assert.equal(result.valid, true);
  assert.equal(result.data.schemaVersion, 1);
  assert.equal(JSON.stringify(legacy), before);
  assert.equal(exportDesign(data), exportDesign(result.data));
  legacy.schemaVersion = 1;
  assert.equal(migrateDesign(legacy).valid, false);
  assert.throws(
    () => assertValidDesign({ schemaVersion: 55 }),
    DesignValidationError,
  );
  const live = exportDesign(data);
  const restoredDraft = importDesign(live).data;
  restoredDraft.defaults.values['text.color'] = '#FFFF00';
  assert.equal(exportDesign(data), live);
});

test('reduced motion uses immediate endpoints without changing stored design or focus indication', () => {
  const d = fixture();
  const original = exportDesign(d);
  d.nodes[1].scope.values['motion.primaryFeedback'] = {
    kind: 'opacity',
    duration: { value: 150, unit: 'ms' },
    easing: 'linear',
    opacity: 0.8,
  };
  const stored = exportDesign(d);
  const resolved = resolvePresentation(d, {
    nodeId: 'title',
    mode: 'dark',
    width: 800,
    states: ['focus-visible'],
    reducedMotion: true,
  });
  assert.equal(resolved.values['motion.kind'], 'none');
  assert.deepEqual(resolved.values['motion.primaryFeedback'].duration, {
    value: 0,
    unit: 'ms',
  });
  assert.equal(resolved.focusIndicator['outline.color'], '#FFFF00');
  assert.equal(exportDesign(d), stored);
  assert.notEqual(original, stored);
});

test('resource bounds and malformed state contexts fail explicitly without clipping values', () => {
  const deep = fixture();
  let current = deep;
  for (let i = 0; i < 70; i++) {
    current.deep = {};
    current = current.deep;
  }
  invalid(deep, 'resource-limit');
  const d = fixture();
  d.nodes = Array.from({ length: 4097 }, (_, i) => ({
    id: `node-${i}`,
    kind: 'text',
    scope: { values: {} },
    children: [],
  }));
  invalid(d);
  const unicode = fixture();
  unicode.themes[0].name = '森のテーマ — நீலம்';
  valid(unicode);
  const oversized = `"${'森'.repeat(700000)}"`;
  assert.ok(
    importDesign(oversized).errors.some((x) => x.code === 'resource-limit'),
  );
  assert.throws(
    () => resetOverride(fixture().defaults, 'font.size', { when: ['unknown'] }),
    /Invalid reset/,
  );
  assert.throws(
    () => resolvePresentation(fixture(), { mode: 'dark', width: NaN }),
    /Invalid presentation/,
  );
});

test('explicit combined disabled rules refine disabled visuals while lower combinations cannot override them', () => {
  const d = fixture();
  d.nodes[1].scope.states.push({
    when: ['disabled'],
    values: { 'text.color': '#111111' },
  });
  invalid(d, 'duplicate');
  d.nodes[1].scope.states.pop();
  d.nodes[1].scope.states.find((x) => x.when.includes('disabled')).values[
    'text.color'
  ] = '#111111';
  const options = {
    nodeId: 'title',
    mode: 'dark',
    width: 0,
    states: ['disabled', 'focus-visible', 'hover'],
  };
  assert.equal(resolvePresentation(d, options).values['text.color'], '#111111');
  d.nodes[1].scope.states.push({
    when: ['hover', 'disabled'],
    values: { 'text.color': '#222222' },
  });
  assert.equal(resolvePresentation(d, options).values['text.color'], '#222222');
  assert.equal(
    resolvePresentation(d, options).focusIndicator['outline.color'],
    '#FFFF00',
  );
});
