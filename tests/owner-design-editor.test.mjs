import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  createCopperDesign,
  compileDesignStyles,
} from '../src/design/runtime.ts';
import { literalProperties } from '../src/design/schema.ts';
import { validateDesign, exportDesign } from '../src/design/model.ts';
import * as edit from '../src/owner-design/editor.ts';
import { PROPERTY_CONTROLS } from '../src/owner-design/property-controls.ts';
import { initialValue } from '../src/owner-design/control-schema.ts';
import { VisualValueEditor } from '../src/components/owner/design-studio-controls.tsx';
import { validatePreviewMessage } from '../src/components/owner/design-studio-preview.tsx';
import { contrastWarnings } from '../src/owner-design/diagnostics.ts';
const context = (id = 'home.hero', states = [], breakpoint) => ({
  selection: { kind: 'node', id },
  states,
  breakpoint,
});
const px = (value) => ({ value, unit: 'px' });

test('every closed property renders actual labelled visual controls, including every union representation', () => {
  assert.deepEqual(
    Object.keys(PROPERTY_CONTROLS).sort(),
    Object.keys(literalProperties).sort(),
  );
  const d = createCopperDesign();
  let rendered = 0;
  for (const [property, control] of Object.entries(PROPERTY_CONTROLS)) {
    const options = control.kind === 'union' ? control.options : [control];
    for (const option of options) {
      const html = renderToStaticMarkup(
        React.createElement(VisualValueEditor, {
          control,
          value: initialValue(option),
          label: property,
          document: d,
          onChange() {},
          onInvalid() {},
        }),
      );
      assert.match(html, /<(?:input|select|button)/, property);
      assert.match(html, /<(?:label|legend)/, property);
      assert.doesNotMatch(html, /<textarea/, property);
      rendered++;
    }
  }
  assert.ok(rendered > 200);
});
test('arbitrary values, units, explicit zero/false/none and inheritance reset survive export roundtrip', () => {
  let d = createCopperDesign();
  const c = context();
  for (const [k, v] of Object.entries({
    'background.color': '#1234abcd',
    'font.size': {
      min: { value: 1, unit: 'rem' },
      preferred: { value: 4, unit: 'vw' },
      max: { value: 7, unit: 'rem' },
    },
    margin: [{ value: -2, unit: 'em' }, px(0)],
    visibility: false,
    'motion.repeat': 0,
    'shadow.layers': [],
    'background.gradient': 'none',
  }))
    d = edit.setProperty(d, c, k, v);
  const result = edit.validateImport(exportDesign(d));
  assert.deepEqual(result.document, d);
  assert.equal(edit.valuesAt(d, c).visibility, false);
  assert.equal(edit.valuesAt(d, c)['motion.repeat'], 0);
  d = edit.setProperty(d, c, 'visibility', undefined);
  assert.equal(Object.hasOwn(edit.valuesAt(d, c), 'visibility'), false);
  assert.throws(() => edit.setProperty(d, c, 'width', 'expression(alert(1))'));
});
test('scope inspector resolves theme base/mode, instance, breakpoint and combined state without descendant leakage', () => {
  let d = createCopperDesign();
  d = edit.editBreakpoint(d, 'tablet', 768);
  d = edit.setProperty(
    d,
    { selection: { kind: 'theme', id: 'copper', mode: 'base' }, states: [] },
    'font.size',
    px(18),
  );
  d = edit.setProperty(
    d,
    { selection: { kind: 'theme', id: 'copper', mode: 'dark' }, states: [] },
    'font.size',
    px(19),
  );
  d = edit.setProperty(d, context(), 'font.size', px(22));
  d = edit.setProperty(
    d,
    context('home.hero', ['hover', 'focus-visible'], 'tablet'),
    'font.size',
    px(27),
  );
  const options = {
    pageId: 'home',
    themeId: 'copper',
    mode: 'dark',
    width: 1000,
  };
  const resolved = edit.inspectValues(
    d,
    context('home.hero', ['hover', 'focus-visible'], 'tablet'),
    options,
  );
  assert.deepEqual(resolved.values['font.size'], px(27));
  assert.match(resolved.sources['font.size'], /home.hero.*tablet.*hover/);
  assert.deepEqual(
    edit.inspectValues(
      d,
      { selection: { kind: 'theme', id: 'copper', mode: 'base' }, states: [] },
      options,
    ).values['font.size'],
    px(18),
  );
  assert.deepEqual(
    edit.inspectValues(
      d,
      { selection: { kind: 'theme', id: 'copper', mode: 'dark' }, states: [] },
      options,
    ).values['font.size'],
    px(19),
  );
  d = edit.resetScope(
    d,
    context('home.hero', ['hover', 'focus-visible'], 'tablet'),
  );
  assert.deepEqual(
    edit.inspectValues(
      d,
      context('home.hero', ['hover', 'focus-visible'], 'tablet'),
      options,
    ).values['font.size'],
    px(22),
  );
});
test('tree operations preserve stable moves, duplicate subtrees, reject cycles and keep content separate', () => {
  let d = createCopperDesign();
  const parent = { kind: 'node', id: 'home.hero' };
  d = edit.addNode(d, parent, 'container');
  const container = d.nodes.at(-1).id;
  d = edit.addNode(d, { kind: 'node', id: container }, 'heading');
  const heading = d.nodes.at(-1).id;
  d = edit.setProperty(d, context(heading), 'font.size', px(31));
  assert.throws(() =>
    edit.moveNode(d, container, { kind: 'node', id: container }, 0),
  );
  const original = structuredClone(d);
  d = edit.duplicateNode(d, container, parent);
  const duplicate = d.nodes.find((n) => n.id.startsWith('container-copy'));
  assert.ok(duplicate);
  assert.notEqual(duplicate.children[0], heading);
  assert.deepEqual(
    d.nodes.find((n) => n.id === duplicate.children[0]).scope.values[
      'font.size'
    ],
    px(31),
  );
  d = edit.moveNode(d, heading, { kind: 'page', id: 'home' }, 0);
  assert.equal(d.pages.find((p) => p.id === 'home').rootIds[0], heading);
  assert.deepEqual(
    d.nodes.find((n) => n.id === heading).scope,
    original.nodes.find((n) => n.id === heading).scope,
  );
  d = edit.removeNode(d, duplicate.id);
  assert.ok(!d.nodes.some((n) => n.id === duplicate.id));
  assert.equal(validateDesign(d).valid, true);
});
test('theme identity, exposure/default/archive and breakpoint removal are undoable without preset quantization', () => {
  let s = edit.openEditor(createCopperDesign(), 'r1', '1');
  let d = edit.editTheme(s.document, 'copper', 'duplicate', 'Arbitrary lagoon');
  const theme = d.themes.at(-1);
  d = edit.editTheme(d, theme.id, 'default');
  d = edit.editTheme(d, theme.id, 'visitor');
  d = edit.editTheme(d, theme.id, 'rename', 'Renamed lagoon');
  assert.equal(d.defaultThemeId, theme.id);
  assert.equal(d.themes.at(-1).name, 'Renamed lagoon');
  assert.throws(() => edit.editTheme(d, theme.id, 'archive'));
  d = edit.editBreakpoint(d, 'wide', 1111);
  d = edit.setProperty(d, context('home.hero', [], 'wide'), 'width', {
    value: 82.25,
    unit: 'vw',
  });
  s = edit.commit(s, d, 'Theme + responsive edit');
  assert.deepEqual(
    edit.undo(s).document.breakpoints,
    createCopperDesign().breakpoints,
  );
  assert.deepEqual(edit.redo(edit.undo(s)).document, d);
  d = edit.editBreakpoint(d, 'wide', undefined);
  assert.equal(edit.valuesAt(d, context())['width'], undefined);
  assert.ok(
    !d.nodes
      .find((n) => n.id === 'home.hero')
      .scope.breakpoints.some((b) => b.id === 'wide'),
  );
});
test('failed/expired/conflicting saves retain local changes; save acknowledgements preserve newer edits and undo history', () => {
  let s = edit.openEditor(createCopperDesign(), 'r1', '1');
  const first = edit.setProperty(
    s.document,
    context(),
    'background.color',
    '#112233',
  );
  s = edit.commit(s, first, 'First');
  const second = edit.setProperty(
    s.document,
    context(),
    'background.color',
    '#445566',
  );
  s = edit.commit(s, second, 'Second');
  for (const status of [0, 401, 403, 409, 500]) {
    const failed = edit.saveFailure(s, status, 'Rejected');
    assert.deepEqual(failed.document, second);
    assert.equal(failed.revision, 'r1');
    assert.equal(edit.isDirty(failed), true);
  }
  s = edit.acknowledgeSave(s, first, 'r2');
  assert.deepEqual(s.document, second);
  assert.deepEqual(s.saved, first);
  assert.equal(edit.isDirty(s), true);
  assert.equal(s.past.length, 2);
  assert.deepEqual(edit.undo(s).document, first);
  const branch = edit.commit(
    edit.undo(s),
    edit.setProperty(first, context(), 'opacity', 0),
    'Branch',
  );
  assert.equal(branch.future.length, 0);
});
test('invalid import is explicit and nondestructive; valid roundtrip is a reversible checkpoint', () => {
  const s = edit.openEditor(createCopperDesign(), 'r1', '1');
  assert.throws(() => edit.importIntoEditor(s, '{"schemaVersion":99}'));
  assert.equal(s.past.length, 0);
  assert.ok(edit.validateImport('{broken').errors.length);
  assert.ok(edit.validateImport('{"__proto__":{}}').errors.length);
  const imported = structuredClone(s.document);
  imported.id = 'imported';
  const next = edit.importIntoEditor(s, JSON.stringify(imported));
  assert.equal(next.document.id, 'imported');
  assert.equal(edit.undo(next).document.id, s.document.id);
});
test('preview message schema rejects unsupported payloads and unknown theme/state values', () => {
  const document = createCopperDesign();
  const base = {
    type: 'owner-design-preview',
    document,
    themeId: 'copper',
    mode: 'dark',
    states: ['hover', 'focus-visible'],
    reducedMotion: true,
  };
  assert.ok(validatePreviewMessage(base));
  for (const patch of [
    { type: 'anything' },
    { themeId: 'absent' },
    { states: ['execute'] },
    { mode: 'auto' },
    { document: { ...document, schemaVersion: 999 } },
  ])
    assert.equal(validatePreviewMessage({ ...base, ...patch }), null);
});
test('private media needs explicit owner preview flag, exact URL, matching manifest hash/version; public mode stays closed', () => {
  const d = createCopperDesign();
  d.assets = [
    {
      id: '42',
      version: 'v1',
      sha256: 'a'.repeat(64),
      kind: 'image',
      rights: { license: 'CC0', attribution: 'Fixture', redistributable: true },
    },
  ];
  d.nodes.find((n) => n.id === 'home.hero').scope.values['background.image'] = {
    assetId: '42',
  };
  const options = {
    pageId: 'home',
    mode: 'dark',
    resources: [
      {
        id: '42',
        version: 'v1',
        sha256: 'a'.repeat(64),
        url: '/api/owner/media/42',
      },
    ],
  };
  assert.ok(
    compileDesignStyles(d, options).warnings.some((w) => w.includes('42')),
  );
  assert.equal(
    compileDesignStyles(d, { ...options, ownerPreview: true }).warnings.length,
    0,
  );
  for (const patch of [
    { url: '/api/owner/media/42?unsafe=1' },
    { url: 'https://external.test/font' },
    { sha256: 'b'.repeat(64) },
    { version: 'v2' },
  ])
    assert.ok(
      compileDesignStyles(d, {
        ...options,
        ownerPreview: true,
        resources: [{ ...options.resources[0], ...patch }],
      }).warnings.some((w) => w.includes('42')),
    );
});
test('simulated hover/focus renders CSS without pointer interaction only in authenticated preview mode', () => {
  let d = createCopperDesign();
  d = edit.setProperty(
    d,
    context('home.hero', ['hover']),
    'background.color',
    '#102030',
  );
  d = edit.setProperty(
    d,
    context('home.hero', ['focus-visible']),
    'outline.width',
    px(5),
  );
  const options = {
    pageId: 'home',
    mode: 'dark',
    previewStates: { nodeId: 'home.hero', states: ['hover', 'focus-visible'] },
  };
  const publicCss = compileDesignStyles(d, options).css,
    privateCss = compileDesignStyles(d, { ...options, ownerPreview: true }).css;
  assert.match(publicCss, /:hover\)\{[^}]*background-color:#102030/);
  assert.match(
    privateCss,
    /data-design-node="home.hero"\]\)\{[^}]*background-color:#102030/,
  );
  assert.match(
    privateCss,
    /data-design-node="home.hero"\]\)\{outline-width:5px/,
  );
  assert.ok(publicCss.includes(':focus-visible'));
});

test('theme packages retain composition; recovery packages roundtrip unapplied invalid buffers', () => {
  const d = createCopperDesign(),
    theme = structuredClone(d);
  theme.themes[0].modes.dark.values['accent.color'] = '#00ab9f';
  const pkg = edit.exportThemes(theme);
  assert.ok(!JSON.parse(pkg).data.nodes);
  const imported = edit.validateImport(pkg, d);
  assert.equal(imported.kind, 'themes');
  assert.deepEqual(imported.document.nodes, d.nodes);
  assert.equal(
    imported.document.themes[0].modes.dark.values['accent.color'],
    '#00ab9f',
  );
  const key = JSON.stringify([
    { kind: 'theme', id: 'copper', mode: 'dark' },
    '',
    [],
    'background.color',
  ]);
  const buffers = { [key]: 'unfinished-color' };
  const recovery = edit.validateImport(edit.exportRecovery(d, buffers));
  assert.equal(recovery.kind, 'recovery');
  assert.deepEqual(recovery.buffers, buffers);
  assert.deepEqual(recovery.document, d);
  assert.ok(
    edit.validateImport(edit.exportRecovery(d, { bad: 'unsafe-context' }))
      .errors.length,
  );
});
test('detaching a shared role preserves merged base/state/breakpoint presentation and remains independent', () => {
  let d = createCopperDesign();
  const node = d.nodes.find((n) => n.id === 'home.hero');
  const shared = d.sharedComponents.find((c) => c.id === node.componentId);
  shared.scope.values['font.size'] = px(29);
  shared.scope.states = [
    { when: ['hover'], values: { 'background.color': '#112233' } },
  ];
  node.scope.states = [
    { when: ['hover'], values: { 'text.color': '#abcdef' } },
  ];
  d = edit.detachNodeRole(d, node.id);
  const detached = d.nodes.find((n) => n.id === node.id);
  assert.equal(detached.componentId, undefined);
  assert.deepEqual(detached.scope.values['font.size'], px(29));
  assert.equal(detached.scope.states.length, 1);
  assert.equal(detached.scope.states[0].values['background.color'], '#112233');
  assert.equal(detached.scope.states[0].values['text.color'], '#abcdef');
  assert.equal(validateDesign(d).valid, true);
});
test('contrast diagnostics identify the exact foreground/background pair and compositing limitations', () => {
  assert.ok(
    contrastWarnings({
      'background.color': '#ffffff',
      'text.color': '#eeeeee',
    }).some((w) => w.includes('text.color') && w.includes('1.16:1')),
  );
  assert.equal(
    contrastWarnings({ 'background.color': '#ffffff', 'text.color': '#000000' })
      .length,
    0,
  );
  assert.ok(
    contrastWarnings({
      'background.color': '#fff0',
      'text.color': '#000',
    }).some((w) => w.includes('composited')),
  );
});

test('undo and historical restore normalize removed selected scopes, themes and breakpoints without stale preview IDs', () => {
  const original = createCopperDesign();
  let next = edit.editTheme(original, 'copper', 'duplicate', 'Temporary');
  const theme = next.themes.at(-1);
  next = edit.editBreakpoint(next, 'temporary-wide', 1234);
  const requested = {
    selection: { kind: 'theme', id: theme.id, mode: 'dark' },
    themeId: theme.id,
    breakpoint: 'temporary-wide',
  };
  assert.deepEqual(edit.normalizeEditorContext(next, requested), requested);
  assert.deepEqual(edit.normalizeEditorContext(original, requested), {
    selection: { kind: 'site' },
    themeId: 'copper',
    breakpoint: '',
  });
  const added = edit.addNode(
    original,
    { kind: 'page', id: 'home' },
    'container',
  );
  const id = added.nodes.at(-1).id;
  assert.equal(
    edit.normalizeEditorContext(original, {
      selection: { kind: 'node', id },
      themeId: 'copper',
      breakpoint: '',
    }).selection.kind,
    'site',
  );
});

test('font and media selectors show friendly resource titles and exact versions, without duplicate generic selected options', () => {
  const d = createCopperDesign();
  const rights = {
    license: 'OFL-1.1',
    attribution: 'Fixture',
    redistributable: true,
  };
  d.fonts = [
    {
      id: 'font-owned',
      version: 'font-v2',
      sha256: 'a'.repeat(64),
      rights,
      family: 'Owned font family',
      style: 'normal',
      weight: { min: 400, max: 400 },
      axes: [],
      fallbacks: ['sans-serif'],
    },
  ];
  d.assets = [
    {
      id: 'image-owned',
      version: 'image-v3',
      sha256: 'b'.repeat(64),
      rights,
      kind: 'image',
    },
  ];
  const render = (property, value) =>
    renderToStaticMarkup(
      React.createElement(VisualValueEditor, {
        control: PROPERTY_CONTROLS[property],
        value,
        label: property,
        document: d,
        resourceNames: { 'image-owned': 'Named project photograph' },
        onChange() {},
        onInvalid() {},
      }),
    );
  const font = render('font.family', { fontId: 'font-owned' }),
    media = render('background.image', { assetId: 'image-owned' });
  assert.match(font, /Owned font family/);
  assert.match(font, /font-v2/);
  assert.doesNotMatch(font, /Selected reference/);
  assert.match(media, /Named project photograph/);
  assert.match(media, /image-v3/);
});
