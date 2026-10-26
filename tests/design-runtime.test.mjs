import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      context.parentURL?.includes('/src/design/') &&
      /^\.\/[-a-z]+$/.test(specifier)
    )
      return nextResolve(
        new URL(`${specifier}.ts`, context.parentURL).href,
        context,
      );
    return nextResolve(specifier, context);
  },
});
const runtime = await import('../src/design/runtime.ts');
const {
  createCopperDesign,
  resolveDesignBinding,
  compileDesignStyles,
  resolveDesignTree,
  documentProgress,
  seekFraction,
  progressKeyTarget,
  currentSection,
  BINDING_REGISTRY,
} = runtime;
const { resolvePresentation, assertValidDesign } =
  await import('../src/design/model.ts');
const { literalProperties } = await import('../src/design/schema.ts');
const px = (value) => ({ value, unit: 'px' });
const baseOptions = { pageId: 'work', mode: 'dark', width: 800 };
function alternate() {
  const d = createCopperDesign();
  d.defaultThemeId = 'mint';
  d.visitorThemeIds = ['mint'];
  d.themes.push({
    id: 'mint',
    name: 'Mint ultraviolet',
    modes: {
      base: { values: { 'accent.color': '#BD00FF', 'text.color': '#002B20' } },
      light: { values: { 'background.color': '#E0FFF1' } },
      dark: { values: { 'background.color': '#001E18' } },
    },
  });
  d.breakpoints = [{ id: 'custom', minWidth: 713.25 }];
  const grid = d.sharedComponents.find((x) => x.id === 'work.grid');
  grid.scope = {
    values: {
      'layout.mode': 'grid',
      'layout.columns': [{ fr: 3 }, { fr: 7 }],
      'gap.row': { value: 2.71828, unit: 'rem' },
      'layout.areas': [['copy', 'media']],
    },
    breakpoints: [
      {
        id: 'custom',
        values: { 'layout.columns': [{ fr: 1 }], 'gap.row': px(0) },
      },
    ],
  };
  d.sharedComponents.find((x) => x.id === 'work.title').scope = {
    values: {
      'font.size': {
        min: px(32),
        preferred: { value: 6.2, unit: 'vw' },
        max: px(117),
      },
      'font.weight': 613,
      'text.color': '#002B20',
    },
    states: [
      { when: ['hover'], values: { 'text.color': '#D30099' } },
      {
        when: ['focus-visible'],
        values: { 'outline.color': '#00AADD', 'outline.width': px(3) },
      },
      {
        when: ['disabled'],
        values: { 'text.color': '#777777', 'outline.width': px(0) },
      },
    ],
  };
  return d;
}
test('starter preserves semantic section order and baseline typography, aliases and component palette roles', () => {
  const d = createCopperDesign();
  assert.deepEqual(d.pages.find((p) => p.id === 'home').rootIds, [
    'home.hero',
    'home.work',
    'home.profile',
    'home.journal',
    'home.contact',
  ]);
  assert.deepEqual(d.sharedShell.header, ['header']);
  const output = compileDesignStyles(d, { pageId: 'home', mode: 'dark' });
  const heading = resolveDesignBinding(d, {
    pageId: 'home',
    nodeId: 'home.title',
    mode: 'dark',
    width: 1440,
  });
  assert.equal(heading.style.fontSize, undefined);
  assert.equal(heading.style.lineHeight, undefined);
  assert.equal(heading.style.backgroundColor, undefined);
  assert.equal(heading.style.color, undefined);
  assert.equal(
    output.rules.find((r) => !r.nodeId && r.declarations['--design-background'])
      ?.declarations['background-color'],
    '#121316',
  );
  assert.match(output.css, /@layer design/);
  assert.match(output.css, /--design-font-display/);
});
test('custom colors, fluid typography, fractional units, grids and breakpoint boundary produce actual CSS', () => {
  const d = alternate();
  const title = resolveDesignBinding(d, {
    ...baseOptions,
    themeId: 'mint',
    nodeId: 'work.title',
  });
  assert.equal(title.style.fontSize, 'clamp(32px, 6.2vw, 117px)');
  assert.equal(title.style.fontWeight, '613');
  assert.equal(title.style.color, '#002B20');
  assert.equal(title.style['--design-accent'], '#BD00FF');
  assert.equal(
    resolveDesignBinding(d, {
      ...baseOptions,
      nodeId: 'work.grid',
      width: 713.249,
    }).style.gridTemplateColumns,
    '3fr 7fr',
  );
  assert.equal(
    resolveDesignBinding(d, {
      ...baseOptions,
      nodeId: 'work.grid',
      width: 713.25,
    }).style.gridTemplateColumns,
    '1fr',
  );
  assert.equal(
    resolveDesignBinding(d, {
      ...baseOptions,
      nodeId: 'work.grid',
      width: 713.251,
    }).style.rowGap,
    '0px',
  );
  const css = compileDesignStyles(d, { ...baseOptions, themeId: 'mint' }).css;
  assert.match(css, /min-width:713\.25px/);
  assert.match(css, /grid-template-columns:3fr 7fr/);
  assert.match(css, /2\.71828rem/);
});
test('scope-first compiled cascade agrees with accepted resolver on local values and combined states', () => {
  const d = alternate();
  const node = d.nodes.find((x) => x.id === 'work.hero');
  d.defaults = {
    values: { 'font.size': px(18) },
    breakpoints: [
      {
        id: 'custom',
        values: { 'font.size': px(99) },
        states: [{ when: ['hover'], values: { 'font.size': px(120) } }],
      },
    ],
  };
  node.scope.values['font.size'] = px(22);
  for (const width of [0, 713.249, 713.25, 1440])
    for (const states of [
      [],
      ['hover'],
      ['hover', 'focus-visible', 'disabled'],
    ]) {
      const expected = resolvePresentation(d, {
        ...baseOptions,
        width,
        states,
        nodeId: node.id,
      });
      const actual = resolveDesignBinding(d, {
        ...baseOptions,
        width,
        states,
        nodeId: node.id,
      });
      assert.equal(
        actual.style.fontSize,
        `${expected.values['font.size'].value}px`,
      );
      const compiled = compileDesignStyles(d, baseOptions);
      const merged = Object.assign(
        {},
        ...compiled.rules
          .filter(
            (r) =>
              r.nodeId === node.id &&
              r.minWidth <= width &&
              r.states.every((s) => states.includes(s)),
          )
          .map((r) => r.declarations),
      );
      assert.equal(merged['font-size'], actual.declarations['font-size']);
    }
  const focused = resolveDesignBinding(d, {
    ...baseOptions,
    nodeId: 'work.title',
    states: ['hover', 'focus-visible', 'disabled'],
  });
  assert.equal(focused.style.color, '#777777');
  assert.equal(focused.style.outlineWidth, '3px');
  assert.equal(focused.attributes['aria-disabled'], 'true');
});
test('zero/false/none/transparent/empty arrays are preserved and tree order/hiding are structural', () => {
  const d = alternate();
  const page = d.pages.find((x) => x.id === 'work');
  page.rootIds.reverse();
  d.nodes.find((x) => x.id === 'work.hero').scope.values.visibility = false;
  const role = d.sharedComponents.find((x) => x.id === 'work.card');
  role.scope.values = {
    opacity: 0,
    'background.color': 'transparent',
    'shadow.layers': [],
    'layout.columns': [],
    'motion.kind': 'none',
  };
  const binding = resolveDesignBinding(d, {
    ...baseOptions,
    nodeId: 'work.card',
  });
  assert.equal(binding.style.opacity, '0');
  assert.equal(binding.style.backgroundColor, 'transparent');
  assert.equal(binding.style.boxShadow, 'none');
  assert.equal(binding.style.gridTemplateColumns, 'none');
  assert.equal(binding.behavior['motion.kind'], 'none');
  assert.deepEqual(
    resolveDesignTree(d, baseOptions).map((x) => x.node.id),
    ['work.library'],
  );
  assert.deepEqual(compileDesignStyles(d, baseOptions).rootIds, [
    'work.library',
    'work.hero',
  ]);
});
test('only exact published resource versions/checksums/local URLs generate fonts or image fetches', () => {
  const d = alternate();
  const rights = {
    license: 'Synthetic license',
    attribution: 'Test',
    redistributable: true,
  };
  d.fonts = [
    {
      id: '42',
      version: 'font-v1',
      sha256: 'a'.repeat(64),
      rights,
      family: 'Quote";evil{color:red}',
      style: 'normal',
      weight: { min: 100, max: 900 },
      axes: [],
      fallbacks: ['sans-serif'],
    },
  ];
  d.assets = [
    {
      id: '43',
      version: 'image-v1',
      sha256: 'b'.repeat(64),
      rights,
      kind: 'image',
    },
  ];
  d.sharedComponents.find((x) => x.id === 'work.title').scope.values[
    'font.family'
  ] = { fontId: '42' };
  d.sharedComponents.find((x) => x.id === 'work.media').scope.values[
    'background.image'
  ] = { assetId: '43' };
  const resources = [
    {
      id: 42,
      resourceVersion: 'font-v1',
      sha256: 'a'.repeat(64),
      url: '/api/public/media/42',
      mimeType: 'font/woff2',
    },
    {
      id: '43',
      resourceVersion: 'image-v1',
      sha256: 'b'.repeat(64),
      url: '/api/public/media/43',
      mimeType: 'image/png',
    },
  ];
  const output = compileDesignStyles(d, { ...baseOptions, resources });
  assert.match(output.fontFaces, /@font-face/);
  assert.doesNotMatch(output.css, /evil|Quote/);
  assert.equal(output.warnings.length, 0);
  for (const mutate of [
    (r) => {
      r[0].resourceVersion = 'wrong';
    },
    (r) => {
      r[0].url = 'https://tracker.invalid/font';
    },
    (r) => {
      r[0].url = '/api/public/media/42?draft=true';
    },
    (r) => {
      r[0].sha256 = 'c'.repeat(64);
    },
    (r) => {
      r.push(r[0]);
    },
  ]) {
    const refs = structuredClone(resources);
    mutate(refs);
    const invalid = compileDesignStyles(d, { ...baseOptions, resources: refs });
    assert.equal(invalid.fontFaces, '');
    assert.ok(invalid.warnings.length);
  }
});
test('unsafe context/selectors/CSS input cannot enter generated stylesheet', () => {
  const d = alternate();
  assert.throws(
    () =>
      compileDesignStyles(d, {
        ...baseOptions,
        scopeId: '\"></style><script>alert(1)</script>',
      }),
    /Unsafe/,
  );
  d.sharedComponents.find((x) => x.id === 'work.title').scope.values[
    'font.size'
  ] = '1px; background:url(https://evil.invalid)';
  assert.throws(() => compileDesignStyles(d, baseOptions));
  const safe = compileDesignStyles(alternate(), {
    ...baseOptions,
    scopeId: 'scope.with-dots',
  }).css;
  assert.doesNotMatch(safe, /<\/style|<script|@import|javascript:|https:/i);
});
test('semantic states, data parts and record-scoped selectors are bound, with no sticky touch hover', () => {
  const d = alternate();
  d.nodes.push({
    id: 'project-1-card',
    kind: 'card',
    componentId: 'work.card',
    contentRef: { collection: 'projects', id: '1' },
    children: [],
    scope: {
      values: {
        'border.radius': px(27),
        'media.caption': {
          visible: false,
          position: 'after',
          measure: { value: 55, unit: 'ch' },
          spacing: px(9),
        },
      },
    },
  });
  d.pages.find((x) => x.id === 'work').rootIds.push('project-1-card');
  const output = compileDesignStyles(d, baseOptions);
  assert.match(output.css, /data-design-content-collection="projects"/);
  assert.match(output.css, /data-design-content-id="1"/);
  assert.match(output.css, /data-design-part="caption"/);
  assert.match(output.css, /@media \(hover:hover\)/);
  assert.match(output.css, /aria-disabled/);
  assert.match(output.css, /:where\(/);
  const binding = resolveDesignBinding(d, {
    ...baseOptions,
    nodeId: 'project-1-card',
  });
  assert.equal(binding.parts.caption.display, 'none');
  assert.deepEqual(binding.structure.contentRef, {
    collection: 'projects',
    id: '1',
  });
});
test('background, axes, grid identifiers, border/shadow/crop/motion values serialize without raw CSS', () => {
  const d = alternate();
  const role = d.sharedComponents.find((x) => x.id === 'work.media');
  role.scope.values = {
    'background.color': { r: 12.25, g: 31, b: 49, a: 0.3125 },
    'background.gradient': {
      angle: 31.5,
      stops: [
        { color: '#ABC', position: 0 },
        { color: '#DEFA', position: 100 },
      ],
    },
    'border.width': [px(0), px(2)],
    'font.variableAxes': { wght: 613, opsz: 72 },
    'layout.areas': [['a.b', 'a.b']],
    'layout.gridPlacement': { area: 'a.b' },
    'media.crop': { x: 0.1, y: 0.2, width: 0.7, height: 0.6 },
    'motion.duration': { value: 0.15, unit: 's' },
    'shadow.layers': [
      {
        x: px(-1),
        y: px(3),
        blur: px(7),
        spread: px(0),
        color: '#00F8',
        inset: false,
      },
    ],
  };
  const r = resolveDesignBinding(d, { ...baseOptions, nodeId: 'work.media' });
  assert.equal(r.style.backgroundColor, 'rgb(12.25 31 49 / 0.3125)');
  assert.equal(r.style.borderWidth, '0px 2px');
  assert.equal(
    r.style.transitionDuration,
    'calc(var(--design-motion-enabled, 1) * 0.15s)',
  );
  assert.match(r.style.fontVariationSettings, /"wght" 613/);
  assert.equal(r.style.gridArea, 'g-61-2e-62');
  assert.match(r.style.gridTemplateAreas, /g-61-2e-62/);
  assert.match(r.style.boxShadow, /-1px 3px 7px 0px/);
});
test('reduced motion keeps content readable and actual progress/seek math remains truthful', () => {
  const d = alternate();
  d.sharedComponents.find((x) => x.id === 'work.title').scope.values[
    'motion.kind'
  ] = 'translate';
  const binding = resolveDesignBinding(d, {
    ...baseOptions,
    nodeId: 'work.title',
    reducedMotion: true,
  });
  assert.equal(binding.behavior['motion.kind'], 'none');
  assert.equal(binding.style.transitionDuration, '0ms');
  assert.match(
    compileDesignStyles(d, baseOptions).css,
    /prefers-reduced-motion:reduce/,
  );
  assert.deepEqual(documentProgress(1000, 1000, 1000), {
    range: 0,
    fraction: 0,
    percent: 0,
    scrollable: false,
    label: '000%',
  });
  assert.equal(documentProgress(-20, 3000, 1000).label, '000%');
  assert.equal(documentProgress(9999, 3000, 1000).label, '100%');
  assert.equal(documentProgress(1000, 3000, 1000).label, '050%');
  assert.equal(documentProgress(1000, 5000, 1000).label, '025%');
  assert.equal(seekFraction(50, 0, 100), 0.5);
  assert.equal(seekFraction(-10, 0, 100), 0);
  assert.equal(seekFraction(110, 0, 100), 1);
  assert.equal(progressKeyTarget('ArrowDown', 0.5), 0.51);
  assert.equal(progressKeyTarget('PageUp', 0.5), 0.4);
  assert.equal(progressKeyTarget('Tab', 0.5), undefined);
  assert.equal(
    currentSection(
      [
        { id: 'first', top: 0 },
        { id: 'second', top: 500 },
      ],
      501,
    ),
    'second',
  );
});
test('every accepted property has an explicit CSS/part/behavior classification; owner scope is separate', () => {
  assert.deepEqual(
    Object.keys(BINDING_REGISTRY).sort(),
    Object.keys(literalProperties).sort(),
  );
  for (const value of Object.values(BINDING_REGISTRY))
    assert.ok(value.css || value.behavior);
  assert.equal(BINDING_REGISTRY['font.size'].css, true);
  assert.equal(BINDING_REGISTRY['shell.navOrder'].behavior, true);
  assert.equal(BINDING_REGISTRY['sectionNav.entries'].css, false);
  assertValidDesign(alternate());
  assert.equal(runtime.INVENTORY_BINDINGS.length, 263);
  assert.equal(new Set(runtime.INVENTORY_BINDINGS.map((x) => x.id)).size, 263);
  assert.equal(
    runtime.INVENTORY_BINDINGS.find((x) => x.property === 'children.add')
      .category,
    'owner-control-later',
  );
  assert.equal(
    runtime.INVENTORY_BINDINGS.find((x) => x.property === 'advanced.unmapped')
      .category,
    'explicit-gap',
  );
});

test('page/template/shared-shell root reuse cannot duplicate stable DOM nodes', () => {
  const d = createCopperDesign();
  d.templates.push({
    id: 'overlap',
    scope: { values: {} },
    rootIds: ['work.hero'],
  });
  d.pages.find((x) => x.id === 'work').templateId = 'overlap';
  d.pages.find((x) => x.id === 'work').rootIds.push('header');
  d.sharedShell.footer.push('header');
  const compiled = compileDesignStyles(d, baseOptions);
  assert.deepEqual(compiled.rootIds, ['work.hero', 'work.library']);
  assert.deepEqual(compiled.shellRoots.footer, ['footer']);
  assert.deepEqual(
    resolveDesignTree(d, baseOptions).map((x) => x.node.id),
    ['work.hero', 'work.library'],
  );
});

test('media crop and icon size affect the actual image/icon part without clipping figure captions', () => {
  const d = createCopperDesign();
  const target = d.sharedComponents.find((x) => x.id === 'work.media');
  target.scope.values = {
    'icon.size': px(24),
    'media.fit': 'contain',
    'media.focalPoint': { x: 20, y: 80 },
    'media.crop': { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
  };
  const r = resolveDesignBinding(d, { ...baseOptions, nodeId: 'work.media' });
  assert.equal(r.style.width, undefined);
  assert.equal(r.style.clipPath, undefined);
  assert.equal(r.parts.icon.width, '24px');
  assert.equal(r.parts.image['object-fit'], 'contain');
  assert.equal(r.parts.image['object-position'], '20% 80%');
  assert.match(r.parts.image['clip-path'], /inset/);
});

test('global motion off gates later durations while absent kind preserves baseline and focus targets actual parts', () => {
  const d = createCopperDesign();
  d.defaults.values['motion.kind'] = 'none';
  d.sharedComponents.find((x) => x.id === 'work.title').scope.values[
    'motion.duration'
  ] = { value: 900, unit: 'ms' };
  assert.equal(
    resolveDesignBinding(d, { ...baseOptions, nodeId: 'work.title' }).style
      .transitionDuration,
    '0ms',
  );
  d.defaults.states = [
    {
      when: ['focus-visible'],
      values: {
        'outline.width': px(5),
        'outline.offset': px(8),
        'outline.color': '#FF00FF',
      },
    },
  ];
  const css = compileDesignStyles(d, baseOptions).css;
  assert.match(css, /--design-motion-enabled:0/);
  assert.match(css, /data-design-part="seek"\]:focus-visible/);
  assert.match(css, /data-design-part="field"\]:focus-visible/);
  assert.match(css, /outline-width:5px/);
  const unchanged = resolveDesignBinding(createCopperDesign(), {
    ...baseOptions,
    nodeId: 'work.title',
  });
  assert.notEqual(unchanged.style.transitionDuration, '0ms');
});
