import test from 'node:test';
import assert from 'node:assert/strict';
import { createCopperDesign } from '../src/design/runtime.ts';
import { assertValidDesign } from '../src/design/model.ts';
import { duplicateNode } from '../src/owner-design/editor.ts';

test('duplicated subtree remaps literal internal empty-state/navigation arrays across overrides, preserving external references and tokens', () => {
  const d = createCopperDesign(),
    hero = d.nodes.find((n) => n.id === 'home.hero');
  hero.children = ['empty-message'];
  d.nodes.push({
    id: 'empty-message',
    kind: 'message',
    scope: { values: {} },
    children: [],
    contentRef: { collection: 'projects', id: 'empty-message' },
  });
  d.tokens['empty-message'] = {
    property: 'collection.emptyState',
    value: ['empty-message'],
  };
  hero.scope = {
    values: {
      'collection.emptyState': ['empty-message', 'home.work'],
      'shell.navOrder': ['empty-message'],
    },
    states: [
      {
        when: ['hover'],
        values: { 'collection.emptyState': { $token: 'empty-message' } },
      },
    ],
    breakpoints: [
      {
        id: d.breakpoints[0].id,
        values: { 'collection.emptyState': ['empty-message'] },
        states: [
          {
            when: ['focus-visible'],
            values: { 'collection.emptyState': ['empty-message'] },
          },
        ],
      },
    ],
  };
  assertValidDesign(d);
  const original = structuredClone(d),
    copy = duplicateNode(d, 'home.hero', { kind: 'page', id: 'home' }),
    root = copy.nodes.find((n) => n.id.startsWith('section-copy-')),
    child = root.children[0];
  assert.deepEqual(root.scope.values['collection.emptyState'], [
    child,
    'home.work',
  ]);
  assert.deepEqual(root.scope.values['shell.navOrder'], [child]);
  assert.deepEqual(root.scope.breakpoints[0].values['collection.emptyState'], [
    child,
  ]);
  assert.deepEqual(
    root.scope.breakpoints[0].states[0].values['collection.emptyState'],
    [child],
  );
  assert.deepEqual(root.scope.states[0].values['collection.emptyState'], {
    $token: 'empty-message',
  });
  assert.deepEqual(copy.tokens, d.tokens);
  assert.equal(
    copy.nodes.find((n) => n.id === child).contentRef.id,
    'empty-message',
  );
  assert.deepEqual(d, original);
});
test('cross-page duplicate retargets copied internal actions to destination page while original external action targets remain pinned', () => {
  const d = createCopperDesign(),
    hero = d.nodes.find((n) => n.id === 'home.hero');
  hero.children = ['local-action', 'external-action'];
  d.nodes.push(
    {
      id: 'local-action',
      kind: 'link',
      scope: { values: {} },
      children: [],
      target: { pageId: 'home', nodeId: 'home.hero' },
    },
    {
      id: 'external-action',
      kind: 'link',
      scope: { values: {} },
      children: [],
      target: { pageId: 'home', nodeId: 'home.work' },
    },
  );
  assertValidDesign(d);
  for (const parent of [
    { kind: 'page', id: 'profile' },
    { kind: 'node', id: 'profile.hero' },
  ]) {
    const copy = duplicateNode(d, 'home.hero', parent),
      root = copy.nodes.find((n) => n.id.startsWith('section-copy-')),
      local = copy.nodes.find((n) => n.id === root.children[0]),
      external = copy.nodes.find((n) => n.id === root.children[1]);
    assert.deepEqual(local.target, { pageId: 'profile', nodeId: root.id });
    assert.deepEqual(external.target, { pageId: 'home', nodeId: 'home.work' });
    assertValidDesign(copy);
  }
});
