import {
  array,
  bool,
  choice,
  fail,
  id,
  map,
  num,
  plain,
  properties,
  shape,
  text,
  literalProperties,
  tokenReference,
  either,
  type Issue,
  type Json,
  type Rule,
} from './schema';

export const DESIGN_SCHEMA_VERSION = 1 as const;
export const COMPONENT_REGISTRY_VERSION = 1 as const;
export const STATES = [
  'selected',
  'expanded',
  'loading',
  'success',
  'hover',
  'pressed',
  'focus-visible',
  'error',
  'disabled',
] as const;
export type State = (typeof STATES)[number];
export type Values = Record<string, Json>;
export type StateOverride = { when: State[]; values: Values };
export type Scope = {
  values: Values;
  states?: StateOverride[];
  breakpoints?: { id: string; values: Values; states?: StateOverride[] }[];
};
export type Token = { property: string; value: Json };
export type Resource = {
  id: string;
  version: string;
  sha256: string;
  rights: { license: string; attribution: string; redistributable: boolean };
};
export type Font = Resource & {
  family: string;
  style: 'normal' | 'italic' | 'oblique';
  weight: { min: number; max: number };
  axes: { tag: string; min: number; max: number }[];
  fallbacks: (string | { fontId: string })[];
};
export const NODE_KINDS = [
  'section',
  'container',
  'stack',
  'row',
  'grid',
  'split',
  'rich-text',
  'media',
  'gallery',
  'heading',
  'text',
  'link',
  'button',
  'divider',
  'spacer',
  'collection',
  'timeline',
  'metadata',
  'field',
  'message',
  'disclosure',
  'dialog',
  'header',
  'footer',
  'navigation',
  'card',
  'tag',
  'icon',
  'code',
  'table',
  'pagination',
  'appearance',
  'progress',
  'section-navigation',
  'skill',
  'record',
] as const;
export type NodeKind = (typeof NODE_KINDS)[number];
export type DesignNode = {
  id: string;
  kind: NodeKind;
  scope: Scope;
  children: string[];
  componentId?: string;
  contentRef?: { collection: string; id: string };
  target?: { pageId: string; nodeId?: string };
};
export type DesignDocument = {
  schemaVersion: 1;
  componentRegistryVersion: 1;
  id: string;
  defaultThemeId: string;
  defaultMode: 'light' | 'dark' | 'system';
  visitorThemeIds: string[];
  tokens: Record<string, Token>;
  defaults: Scope;
  themes: {
    id: string;
    name: string;
    archived?: boolean;
    tokens?: Record<string, Token>;
    modes: { base: Scope; light: Scope; dark: Scope };
  }[];
  fonts: Font[];
  assets: (Resource & { kind: 'image' | 'video' | 'audio' | 'icon' })[];
  breakpoints: { id: string; minWidth: number }[];
  sharedComponents: { id: string; kind: NodeKind; scope: Scope }[];
  nodes: DesignNode[];
  templates: { id: string; scope: Scope; rootIds: string[] }[];
  pages: { id: string; templateId?: string; scope: Scope; rootIds: string[] }[];
  sharedShell: { header: string[]; footer: string[]; navigation: string[] };
};
export type ValidationResult =
  | {
      valid: true;
      schemaVersion: 1;
      data: DesignDocument;
      references: { mediaIds: string[]; fontIds: string[] };
    }
  | { valid: false; schemaVersion?: number; errors: Issue[] };

const stateOverride = shape({
  when: array(choice(...STATES), 1, STATES.length),
  values: properties,
});
const scope: Rule = shape(
  { values: properties },
  {
    states: array(stateOverride, 0, 256),
    breakpoints: array(
      shape(
        { id, values: properties },
        { states: array(stateOverride, 0, 256) },
      ),
      0,
      64,
    ),
  },
);
const token: Rule = (v, p, e) => {
  shape({
    property: choice(...Object.keys(literalProperties)),
    value: () => {},
  })(v, p, e);
  if (
    plain(v) &&
    typeof v.property === 'string' &&
    Object.hasOwn(literalProperties, v.property)
  )
    either(tokenReference, literalProperties[v.property])(
      v.value,
      `${p}.value`,
      e,
    );
};
const tokens = map(id, token);
const rights = shape({
  license: text,
  attribution: text,
  redistributable: bool,
});
const sha256: Rule = (v, p, e) => {
  if (typeof v !== 'string' || !/^[a-f0-9]{64}$/.test(v))
    fail(e, p, 'Expected lowercase SHA-256 digest');
};
const resource = { id, version: id, sha256, rights };
const schema = shape({
  schemaVersion: choice(1),
  componentRegistryVersion: choice(1),
  id,
  defaultThemeId: id,
  defaultMode: choice('light', 'dark', 'system'),
  visitorThemeIds: array(id, 0, 256),
  tokens,
  defaults: scope,
  themes: array(
    shape(
      {
        id,
        name: text,
        modes: shape({ base: scope, light: scope, dark: scope }),
      },
      { archived: bool, tokens },
    ),
    1,
    256,
  ),
  fonts: array(
    shape({
      ...resource,
      family: text,
      style: choice('normal', 'italic', 'oblique'),
      weight: shape({ min: num(1, 1000), max: num(1, 1000) }),
      axes: array(
        shape({
          tag: (v, p, e) => {
            if (typeof v !== 'string' || !/^[A-Za-z0-9]{4}$/.test(v))
              fail(e, p, 'Expected OpenType axis tag');
          },
          min: num(),
          max: num(),
        }),
        0,
        64,
      ),
      fallbacks: array(
        either(
          choice(
            'serif',
            'sans-serif',
            'monospace',
            'system-ui',
            'cursive',
            'fantasy',
          ),
          shape({ fontId: id }),
        ),
        0,
        16,
      ),
    }),
    0,
    256,
  ),
  assets: array(
    shape({ ...resource, kind: choice('image', 'video', 'audio', 'icon') }),
    0,
    2048,
  ),
  breakpoints: array(shape({ id, minWidth: num(0, 100000) }), 0, 64),
  sharedComponents: array(
    shape({ id, kind: choice(...NODE_KINDS), scope }),
    0,
    2048,
  ),
  nodes: array(
    shape(
      { id, kind: choice(...NODE_KINDS), scope, children: array(id) },
      {
        componentId: id,
        contentRef: shape({ collection: id, id }),
        target: shape({ pageId: id }, { nodeId: id }),
      },
    ),
    0,
    4096,
  ),
  templates: array(shape({ id, scope, rootIds: array(id) }), 0, 256),
  pages: array(
    shape({ id, scope, rootIds: array(id) }, { templateId: id }),
    0,
    2048,
  ),
  sharedShell: shape({
    header: array(id),
    footer: array(id),
    navigation: array(id),
  }),
});

/** Reject non-JSON graphs before any schema traversal or serialization. No accessors execute. */
function preflight(input: unknown, errors: Issue[]) {
  const active = new WeakSet<object>();
  let count = 0;
  let bytes = 0;
  const encoder = new TextEncoder();
  function walk(v: unknown, path: string, depth: number) {
    if (++count > 50000 || depth > 64)
      return fail(
        errors,
        path,
        'Design exceeds import complexity limits',
        'resource-limit',
      );
    if (bytes > 2_000_000)
      return fail(
        errors,
        path,
        'Design exceeds 2 MB JSON limit',
        'resource-limit',
      );
    if (typeof v === 'string') {
      if (v.length > 2_000_000)
        return fail(
          errors,
          path,
          'String exceeds import limit',
          'resource-limit',
        );
      bytes += encoder.encode(v).byteLength;
      if (bytes > 2_000_000)
        fail(errors, path, 'Design exceeds 2 MB JSON limit', 'resource-limit');
      return;
    }
    if (v === null || typeof v === 'boolean') return;
    if (typeof v === 'number' && Number.isFinite(v)) return;
    if (typeof v !== 'object' || (!Array.isArray(v) && !plain(v)))
      return fail(
        errors,
        path,
        'Only finite JSON data is accepted',
        'unsafe-data',
      );
    if (active.has(v))
      return fail(errors, path, 'Cyclic object graph', 'cycle');
    active.add(v);
    const descriptors = Object.getOwnPropertyDescriptors(v);
    if (Object.getOwnPropertySymbols(v).length)
      fail(errors, path, 'Symbol properties are not JSON', 'unsafe-data');
    if (
      Array.isArray(v) &&
      (v.length > 50000 || Object.keys(v).length !== v.length)
    )
      fail(errors, path, 'Sparse or oversized array', 'resource-limit');
    for (const [key, desc] of Object.entries(descriptors)) {
      if (Array.isArray(v) && key === 'length') continue;
      bytes += key.length;
      if (
        ['__proto__', 'prototype', 'constructor'].includes(key) ||
        !('value' in desc) ||
        !desc.enumerable
      ) {
        fail(errors, `${path}.${key}`, 'Unsafe key or accessor', 'unsafe-data');
        continue;
      }
      walk(desc.value, `${path}.${key}`, depth + 1);
      if (count > 50000 || errors.length >= 200) break;
    }
    active.delete(v);
  }
  try {
    walk(input, '$', 0);
  } catch {
    fail(errors, '$', 'Uninspectable input', 'unsafe-data');
  }
  if (
    !errors.length &&
    encoder.encode(JSON.stringify(input)).byteLength > 2_000_000
  )
    fail(errors, '$', 'Design exceeds 2 MB JSON limit', 'resource-limit');
}

const duplicate = (values: string[], path: string, errors: Issue[]) => {
  const seen = new Set<string>();
  values.forEach((value, i) => {
    if (seen.has(value))
      fail(
        errors,
        `${path}[${i}]`,
        `Duplicate identifier ${value}`,
        'duplicate',
      );
    seen.add(value);
  });
};
const reference = (
  value: string,
  ids: Set<string>,
  path: string,
  errors: Issue[],
) => {
  if (!ids.has(value))
    fail(errors, path, `Missing reference ${value}`, 'missing-reference');
};
const stateKey = (when: readonly State[]) =>
  STATES.filter((state) => when.includes(state)).join('+');

function allScopes(data: DesignDocument): { scope: Scope; path: string }[] {
  return [
    { scope: data.defaults, path: '$.defaults' },
    ...data.themes.flatMap((t, i) =>
      (['base', 'light', 'dark'] as const).map((mode) => ({
        scope: t.modes[mode],
        path: `$.themes[${i}].modes.${mode}`,
      })),
    ),
    ...(['sharedComponents', 'nodes', 'templates', 'pages'] as const).flatMap(
      (name) =>
        data[name].map((x, i) => ({
          scope: x.scope,
          path: `$.${name}[${i}].scope`,
        })),
    ),
  ];
}
function bags(
  s: Scope,
): { values: Values; when?: State[]; breakpointId?: string }[] {
  return [
    { values: s.values },
    ...(s.states ?? []).map((x) => ({ ...x })),
    ...(s.breakpoints ?? []).flatMap((b) => [
      { values: b.values, breakpointId: b.id },
      ...(b.states ?? []).map((x) => ({ ...x, breakpointId: b.id })),
    ]),
  ];
}

function resolveTokenValue(
  value: Json,
  tokenMap: Record<string, Token>,
  trail: string[] = [],
): Json {
  if (plain(value) && Object.hasOwn(value, '$token')) {
    const key = value.$token as string;
    if (!Object.hasOwn(tokenMap, key)) throw new Error(`Missing token ${key}`);
    if (trail.includes(key))
      throw new Error(`Cyclic token reference ${[...trail, key].join(' -> ')}`);
    if (trail.length > 64) throw new Error('Token reference depth exceeds 64');
    return resolveTokenValue(tokenMap[key].value, tokenMap, [...trail, key]);
  }
  return value;
}

function semanticChecks(data: DesignDocument, errors: Issue[]) {
  for (const key of [
    'themes',
    'fonts',
    'assets',
    'breakpoints',
    'sharedComponents',
    'nodes',
    'templates',
    'pages',
  ] as const)
    duplicate(
      data[key].map((x) => x.id),
      `$.${key}`,
      errors,
    );
  duplicate(
    [...data.fonts.map((x) => x.id), ...data.assets.map((x) => x.id)],
    '$.resources',
    errors,
  );
  duplicate(data.visitorThemeIds, '$.visitorThemeIds', errors);
  const themes = new Set(
    data.themes.filter((x) => !x.archived).map((x) => x.id),
  );
  reference(data.defaultThemeId, themes, '$.defaultThemeId', errors);
  data.visitorThemeIds.forEach((x) =>
    reference(x, themes, '$.visitorThemeIds', errors),
  );
  duplicate(
    data.breakpoints.map((x) => String(x.minWidth)),
    '$.breakpoints.minWidth',
    errors,
  );
  const breakpointIds = new Set(data.breakpoints.map((x) => x.id));
  const nodes = new Map(data.nodes.map((x) => [x.id, x]));
  const nodeIds = new Set(nodes.keys());
  const components = new Map(data.sharedComponents.map((x) => [x.id, x]));
  const templateIds = new Set(data.templates.map((x) => x.id));
  const pageIds = new Set(data.pages.map((x) => x.id));
  const fontIds = new Set(data.fonts.map((x) => x.id));
  const assetIds = new Set(data.assets.map((x) => x.id));
  function checkResourceReferences(value: Json, path: string) {
    const pending = [value];
    while (pending.length) {
      const v = pending.pop();
      if (Array.isArray(v)) {
        pending.push(...v);
        continue;
      }
      if (!plain(v)) continue;
      if (Object.hasOwn(v, 'fontId'))
        reference(v.fontId as string, fontIds, `${path}.fontId`, errors);
      if (Object.hasOwn(v, 'assetId'))
        reference(v.assetId as string, assetIds, `${path}.assetId`, errors);
      pending.push(...(Object.values(v) as Json[]));
    }
  }
  data.fonts.forEach((font, i) => {
    if (!font.family.trim())
      fail(errors, `$.fonts[${i}].family`, 'Font family cannot be empty');
    if (font.weight.min > font.weight.max)
      fail(errors, `$.fonts[${i}].weight`, 'Inverted weight range');
    duplicate(
      font.axes.map((x) => x.tag),
      `$.fonts[${i}].axes`,
      errors,
    );
    font.axes.forEach((axis) => {
      if (axis.min > axis.max)
        fail(errors, `$.fonts[${i}].axes`, 'Inverted font axis range');
    });
    checkResourceReferences(font.fallbacks, `$.fonts[${i}].fallbacks`);
    const complete = new Set<string>();
    const follow = (key: string, trail: string[]) => {
      if (trail.includes(key) || trail.length > 64)
        return fail(
          errors,
          `$.fonts[${i}].fallbacks`,
          'Cyclic or overly deep font fallback chain',
          'cycle',
        );
      if (complete.has(key)) return;
      const target = data.fonts.find((x) => x.id === key);
      target?.fallbacks.forEach((x) => {
        if (typeof x !== 'string') follow(x.fontId, [...trail, key]);
      });
      complete.add(key);
    };
    follow(font.id, []);
  });
  for (const [i, resource] of [...data.fonts, ...data.assets].entries()) {
    if (resource.rights.redistributable && !resource.rights.license.trim())
      fail(
        errors,
        `$.resources[${i}].rights.license`,
        'Redistributable resources require a license statement',
      );
  }
  data.themes.forEach((theme, i) => {
    if (!theme.name.trim())
      fail(errors, `$.themes[${i}].name`, 'Theme name cannot be empty');
  });
  const parents = new Map<string, string>();
  data.nodes.forEach((node, i) => {
    duplicate(node.children, `$.nodes[${i}].children`, errors);
    node.children.forEach((child) => {
      reference(child, nodeIds, `$.nodes[${i}].children`, errors);
      if (parents.has(child))
        fail(
          errors,
          `$.nodes[${i}].children`,
          `Node ${child} has multiple parents`,
          'layout',
        );
      parents.set(child, node.id);
    });
    if (node.componentId) {
      const component = components.get(node.componentId);
      if (!component || component.kind !== node.kind)
        fail(
          errors,
          `$.nodes[${i}].componentId`,
          'Missing or incompatible shared component',
          'missing-reference',
        );
    }
    if (
      [
        'text',
        'heading',
        'media',
        'field',
        'divider',
        'spacer',
        'icon',
        'code',
      ].includes(node.kind) &&
      node.children.length
    )
      fail(
        errors,
        `$.nodes[${i}].children`,
        'Leaf component cannot contain children',
        'layout',
      );
    if (node.target) {
      reference(
        node.target.pageId,
        pageIds,
        `$.nodes[${i}].target.pageId`,
        errors,
      );
      if (node.target.nodeId)
        reference(
          node.target.nodeId,
          nodeIds,
          `$.nodes[${i}].target.nodeId`,
          errors,
        );
    }
  });
  const visited = new Set<string>();
  const active = new Set<string>();
  function walkNode(key: string, depth: number, interactive: boolean) {
    if (active.has(key) || depth > 32)
      return fail(
        errors,
        '$.nodes',
        'Layout cycle or nesting deeper than 32',
        'layout',
      );
    const node = nodes.get(key);
    if (!node) return;
    const isInteractive = ['link', 'button', 'field'].includes(node.kind);
    if (interactive && isInteractive)
      fail(
        errors,
        '$.nodes',
        'Interactive components cannot be nested',
        'layout',
      );
    if (visited.has(key)) return;
    active.add(key);
    node.children.forEach((child) =>
      walkNode(child, depth + 1, interactive || isInteractive),
    );
    active.delete(key);
    visited.add(key);
  }
  data.nodes.forEach((node) => {
    if (!parents.has(node.id)) walkNode(node.id, 0, false);
  });
  data.nodes.forEach((node) => {
    if (!visited.has(node.id)) walkNode(node.id, 0, false);
  });
  const roots = [
    ...data.templates.map((x) => x.rootIds),
    ...data.pages.map((x) => x.rootIds),
    ...Object.values(data.sharedShell),
  ];
  roots.forEach((ids) => {
    duplicate(ids, '$.rootIds', errors);
    ids.forEach((key) => {
      reference(key, nodeIds, '$.rootIds', errors);
      if (parents.has(key))
        fail(
          errors,
          '$.rootIds',
          'A root cannot also be another node’s child',
          'layout',
        );
    });
  });
  data.pages.forEach((page, i) => {
    if (page.templateId)
      reference(
        page.templateId,
        templateIds,
        `$.pages[${i}].templateId`,
        errors,
      );
  });
  function pageNodes(pageId: string): Set<string> {
    const page = data.pages.find((x) => x.id === pageId);
    if (!page) return new Set();
    const template = data.templates.find((x) => x.id === page.templateId);
    const roots = [
      ...page.rootIds,
      ...(template?.rootIds ?? []),
      ...Object.values(data.sharedShell).flat(),
    ];
    const found = new Set<string>();
    const pending = [...roots];
    while (pending.length) {
      const key = pending.pop()!;
      if (found.has(key)) continue;
      found.add(key);
      pending.push(...(nodes.get(key)?.children ?? []));
    }
    return found;
  }
  data.nodes.forEach((node, i) => {
    if (
      node.target?.nodeId &&
      !pageNodes(node.target.pageId).has(node.target.nodeId)
    )
      fail(
        errors,
        `$.nodes[${i}].target.nodeId`,
        'Target node is not reachable on target page',
        'missing-reference',
      );
  });
  const scopes = allScopes(data);
  for (const { scope: s, path } of scopes) {
    duplicate(
      (s.breakpoints ?? []).map((x) => x.id),
      `${path}.breakpoints`,
      errors,
    );
    s.breakpoints?.forEach((x) =>
      reference(x.id, breakpointIds, `${path}.breakpoints`, errors),
    );
    for (const states of [
      s.states ?? [],
      ...(s.breakpoints ?? []).map((b) => b.states ?? []),
    ]) {
      duplicate(
        states.map((x) => stateKey(x.when)),
        `${path}.states`,
        errors,
      );
      states.forEach((x) => duplicate(x.when, `${path}.states.when`, errors));
    }
  }
  // Check each theme context: an override can introduce a cycle or type error in a global token.
  for (const [themeIndex, theme] of data.themes.entries()) {
    const tokenMap = { ...data.tokens, ...theme.tokens };
    for (const [key, t] of Object.entries(tokenMap)) {
      try {
        const value = resolveTokenValue(t.value, tokenMap);
        literalProperties[t.property](value, `$.tokens.${key}`, errors);
        checkResourceReferences(value, `$.tokens.${key}`);
      } catch (error) {
        fail(
          errors,
          `$.tokens.${key}`,
          (error as Error).message,
          'token-reference',
        );
      }
    }
    for (const { scope: s, path } of scopes) {
      if (
        path.startsWith('$.themes[') &&
        !path.startsWith(`$.themes[${themeIndex}].`)
      )
        continue;
      for (const { values, when, breakpointId } of bags(s)) {
        for (const [key, raw] of Object.entries(values)) {
          let value: Json;
          try {
            value = resolveTokenValue(raw, tokenMap);
          } catch (error) {
            fail(
              errors,
              `${path}.${key}`,
              (error as Error).message,
              'token-reference',
            );
            continue;
          }
          literalProperties[key](value, `${path}.${key}`, errors);
          if (
            key === 'section.anchor' &&
            (!path.startsWith('$.nodes[') ||
              when ||
              breakpointId ||
              typeof raw !== 'string')
          )
            fail(
              errors,
              `${path}.${key}`,
              'Stable section anchors belong only to node base values and cannot be responsive/state/token overrides',
              'layout',
            );
          // All references including those nested in typed presentation data are checked.
          checkResourceReferences(value, `${path}.${key}`);
          if (key === 'shell.collapseAt')
            reference(value as string, breakpointIds, `${path}.${key}`, errors);
          if (['shell.navOrder', 'collection.emptyState'].includes(key)) {
            duplicate(value as string[], `${path}.${key}`, errors);
            (value as string[]).forEach((x) =>
              reference(x, nodeIds, `${path}.${key}`, errors),
            );
          }
          if (key === 'sectionNav.entries') {
            const entries = value as { id: string; targetId: string }[];
            duplicate(
              entries.map((x) => x.id),
              `${path}.${key}`,
              errors,
            );
            entries.forEach((x) =>
              reference(x.targetId, nodeIds, `${path}.${key}`, errors),
            );
          }
          if (key === 'sectionNav.order') {
            const order = value as string[];
            duplicate(order, `${path}.${key}`, errors);
            const entries = values['sectionNav.entries'];
            if (Array.isArray(entries)) {
              const ids = new Set(
                (entries as { id: string }[]).map((x) => x.id),
              );
              order.forEach((x) => reference(x, ids, `${path}.${key}`, errors));
            }
          }
          if (key === 'layout.areas')
            validateAreas(value as string[][], `${path}.${key}`, errors);
          if (
            key === 'media.crop' &&
            plain(value) &&
            ((value.x as number) + (value.width as number) > 1 ||
              (value.y as number) + (value.height as number) > 1)
          )
            fail(
              errors,
              `${path}.${key}`,
              'Crop exceeds normalized asset bounds',
            );
        }
      }
    }
    for (const page of data.pages) {
      const ids = pageNodes(page.id);
      const anchors = [...ids].flatMap((key) => {
        const value = nodes.get(key)?.scope.values['section.anchor'];
        return typeof value === 'string' ? [value] : [];
      });
      duplicate(anchors, `$.pages.${page.id}.anchors`, errors);
      for (const nodeId of ids) {
        const s = nodes.get(nodeId)?.scope;
        if (!s) continue;
        for (const { values } of bags(s)) {
          const entries = values['sectionNav.entries'];
          if (Array.isArray(entries))
            for (const entry of entries as { targetId: string }[])
              if (!ids.has(entry.targetId))
                fail(
                  errors,
                  `$.nodes.${nodeId}.sectionNav.entries`,
                  'Section navigation target is not on the same page',
                  'missing-reference',
                );
        }
      }
    }
  }
}

function validateAreas(rows: string[][], path: string, errors: Issue[]) {
  if (!rows.length) return;
  if (rows.some((row) => row.length !== rows[0].length))
    return fail(errors, path, 'Grid areas must have equal-width rows');
  for (const name of new Set(rows.flat().filter((x) => x !== '.'))) {
    const cells = rows.flatMap((row, y) =>
      row.flatMap((value, x) => (value === name ? [{ x, y }] : [])),
    );
    const xs = cells.map((c) => c.x);
    const ys = cells.map((c) => c.y);
    if (
      (Math.max(...xs) - Math.min(...xs) + 1) *
        (Math.max(...ys) - Math.min(...ys) + 1) !==
      cells.length
    )
      fail(errors, path, `Grid area ${name} must be rectangular`);
  }
}

function normalize(data: DesignDocument): DesignDocument {
  const copy = JSON.parse(JSON.stringify(data)) as DesignDocument;
  copy.breakpoints.sort((a, b) => a.minWidth - b.minWidth);
  const order = new Map(copy.breakpoints.map((x, i) => [x.id, i]));
  for (const { scope: s } of allScopes(copy)) {
    s.breakpoints?.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    for (const states of [
      s.states ?? [],
      ...(s.breakpoints ?? []).map((b) => b.states ?? []),
    ]) {
      states.forEach((x) => {
        x.when = STATES.filter((state) => x.when.includes(state));
      });
      states.sort(compareStates);
    }
  }
  return copy;
}
function compareStates(a: StateOverride, b: StateOverride) {
  // A lower-priority combination cannot erase error/disabled; combinations break ties.
  return (
    Math.max(...a.when.map((x) => STATES.indexOf(x))) -
      Math.max(...b.when.map((x) => STATES.indexOf(x))) ||
    a.when.length - b.when.length ||
    stateKey(a.when).localeCompare(stateKey(b.when), 'en')
  );
}

export function validateDesign(input: unknown): ValidationResult {
  const errors: Issue[] = [];
  preflight(input, errors);
  if (errors.length) return { valid: false, errors };
  const schemaVersion =
    plain(input) && typeof input.schemaVersion === 'number'
      ? input.schemaVersion
      : undefined;
  if (schemaVersion !== 1)
    return {
      valid: false,
      schemaVersion,
      errors: [
        {
          path: '$.schemaVersion',
          code: 'unsupported-version',
          message:
            'Only design schema 1 is supported; use an explicit migration for older data',
        },
      ],
    };
  schema(input, '$', errors);
  if (errors.length) return { valid: false, schemaVersion, errors };
  semanticChecks(input as DesignDocument, errors);
  if (errors.length) return { valid: false, schemaVersion, errors };
  const data = normalize(input as DesignDocument);
  return {
    valid: true,
    schemaVersion: 1,
    data,
    references: {
      mediaIds: [
        ...data.assets.map((x) => x.id),
        ...data.fonts.map((x) => x.id),
      ].sort(),
      fontIds: data.fonts.map((x) => x.id).sort(),
    },
  };
}

export class DesignValidationError extends Error {
  readonly issues: Issue[];
  constructor(issues: Issue[]) {
    super(issues.map((x) => `${x.path}: ${x.message}`).join('; '));
    this.name = 'DesignValidationError';
    this.issues = issues;
  }
}
export function assertValidDesign(input: unknown): DesignDocument {
  const result = validateDesign(input);
  if (!result.valid) throw new DesignValidationError(result.errors);
  return result.data;
}

/** v0 is precisely schema 1 except its root field `version: 0` replaces `schemaVersion`. */
export function migrateDesign(input: unknown): ValidationResult {
  const errors: Issue[] = [];
  preflight(input, errors);
  if (errors.length) return { valid: false, errors };
  if (
    plain(input) &&
    input.version === 0 &&
    !Object.hasOwn(input, 'schemaVersion')
  ) {
    const copy = JSON.parse(JSON.stringify(input));
    delete copy.version;
    copy.schemaVersion = 1;
    return validateDesign(copy);
  }
  return validateDesign(input);
}
export function importDesign(input: string | unknown): ValidationResult {
  if (typeof input !== 'string') return migrateDesign(input);
  if (
    input.length > 2_000_000 ||
    new TextEncoder().encode(input).byteLength > 2_000_000
  )
    return {
      valid: false,
      errors: [
        { path: '$', code: 'resource-limit', message: 'Import exceeds 2 MB' },
      ],
    };
  try {
    return migrateDesign(JSON.parse(input));
  } catch {
    return {
      valid: false,
      errors: [
        {
          path: '$',
          code: 'invalid-json',
          message: 'Invalid JSON design package',
        },
      ],
    };
  }
}
export function exportDesign(input: unknown): string {
  const data = assertValidDesign(input);
  function canonical(v: unknown): unknown {
    if (Array.isArray(v)) return v.map(canonical);
    if (plain(v))
      return Object.fromEntries(
        Object.keys(v)
          .sort()
          .map((key) => [key, canonical(v[key])]),
      );
    return v;
  }
  return JSON.stringify(canonical(data));
}

export function createEmptyDesign(designId = 'design'): DesignDocument {
  return assertValidDesign({
    schemaVersion: 1,
    componentRegistryVersion: 1,
    id: designId,
    defaultThemeId: 'default',
    defaultMode: 'system',
    visitorThemeIds: [],
    tokens: {},
    defaults: { values: {} },
    themes: [
      {
        id: 'default',
        name: 'Default',
        modes: {
          base: { values: {} },
          light: { values: {} },
          dark: { values: {} },
        },
      },
    ],
    fonts: [],
    assets: [],
    breakpoints: [],
    sharedComponents: [],
    nodes: [],
    templates: [],
    pages: [],
    sharedShell: { header: [], footer: [], navigation: [] },
  });
}

export type ResolveOptions = {
  themeId?: string;
  mode: 'light' | 'dark';
  width: number;
  states?: State[];
  pageId?: string;
  nodeId?: string;
  reducedMotion?: boolean;
};
export type ResolvedPresentation = {
  values: Values;
  sources: Record<string, string>;
  focusIndicator: Values;
  disabled: boolean;
};
/** Pure inheritance only: this neither renders UI nor grants content/action permissions. */
export function resolvePresentation(
  input: unknown,
  options: ResolveOptions,
): ResolvedPresentation {
  const data = assertValidDesign(input);
  if (
    !Number.isFinite(options.width) ||
    options.width < 0 ||
    !['light', 'dark'].includes(options.mode) ||
    options.states?.some((x) => !STATES.includes(x))
  )
    throw new Error('Invalid presentation context');
  const theme = data.themes.find(
    (x) => x.id === (options.themeId ?? data.defaultThemeId) && !x.archived,
  );
  if (!theme) throw new Error('Unknown or archived theme');
  const tokenMap = { ...data.tokens, ...theme.tokens };
  const states = options.states ?? [];
  const values: Values = {};
  const sources: Record<string, string> = {};
  const focusIndicator: Values = {};
  function apply(layer: Values, source: string, focus = false) {
    for (const [key, raw] of Object.entries(layer)) {
      const value = JSON.parse(
        JSON.stringify(resolveTokenValue(raw, tokenMap)),
      ) as Json;
      values[key] = value;
      sources[key] = source;
      if (focus && key.startsWith('outline.')) focusIndicator[key] = value;
    }
  }
  function applyStates(overrides: StateOverride[] | undefined, source: string) {
    for (const item of [...(overrides ?? [])].sort(compareStates))
      if (item.when.every((state) => states.includes(state)))
        apply(
          item.values,
          `${source}:state:${stateKey(item.when)}`,
          item.when.includes('focus-visible'),
        );
  }
  function applyScope(s: Scope, name: string) {
    apply(s.values, name);
    applyStates(s.states, name);
    for (const bp of data.breakpoints) {
      if (bp.minWidth > options.width) break;
      const override = s.breakpoints?.find((x) => x.id === bp.id);
      if (override) {
        apply(override.values, `${name}:breakpoint:${bp.id}`);
        applyStates(override.states, `${name}:breakpoint:${bp.id}`);
      }
    }
  }
  applyScope(data.defaults, 'site');
  applyScope(theme.modes.base, `theme:${theme.id}:base`);
  applyScope(theme.modes[options.mode], `theme:${theme.id}:${options.mode}`);
  const page = data.pages.find((x) => x.id === options.pageId);
  if (options.pageId && !page) throw new Error('Unknown page');
  if (page) {
    const template = data.templates.find((x) => x.id === page.templateId);
    if (template) applyScope(template.scope, `template:${template.id}`);
    applyScope(page.scope, `page:${page.id}`);
  }
  if (options.nodeId) {
    const nodeMap = new Map(data.nodes.map((x) => [x.id, x]));
    const parentMap = new Map(
      data.nodes.flatMap((x) => x.children.map((id) => [id, x.id] as const)),
    );
    const chain: DesignNode[] = [];
    let key: string | undefined = options.nodeId;
    while (key) {
      const node = nodeMap.get(key);
      if (!node) throw new Error('Unknown node');
      chain.unshift(node);
      key = parentMap.get(key);
    }
    if (page) {
      const template = data.templates.find((x) => x.id === page.templateId);
      const allowedRoots = [
        ...page.rootIds,
        ...(template?.rootIds ?? []),
        ...Object.values(data.sharedShell).flat(),
      ];
      if (!allowedRoots.includes(chain[0].id))
        throw new Error(
          'Node does not belong to selected page or shared shell',
        );
    }
    for (const node of chain) {
      const component = data.sharedComponents.find(
        (x) => x.id === node.componentId,
      );
      if (component) applyScope(component.scope, `shared:${component.id}`);
      applyScope(node.scope, `node:${node.id}`);
    }
  }
  if (options.reducedMotion) {
    values['motion.kind'] = 'none';
    values['motion.duration'] = { value: 0, unit: 'ms' };
    values['motion.delay'] = { value: 0, unit: 'ms' };
    values['motion.repeat'] = 'none';
    for (const key of Object.keys(values))
      if (key.startsWith('motion.') && key.endsWith('Feedback')) {
        const item = values[key];
        if (plain(item))
          values[key] = {
            ...item,
            kind: 'none',
            duration: { value: 0, unit: 'ms' },
          } as Json;
      }
  }
  return {
    values,
    sources,
    focusIndicator,
    disabled: states.includes('disabled'),
  };
}

/** Removing an override means inheritance; zero/false/empty values are never reset implicitly. */
export function resetOverride(
  input: Scope,
  property: string,
  context: { breakpointId?: string; when?: State[] } = {},
): Scope {
  if (!Object.hasOwn(literalProperties, property))
    throw new Error('Unknown presentation property');
  if (
    context.when &&
    (!context.when.length ||
      context.when.some((x) => !STATES.includes(x)) ||
      new Set(context.when).size !== context.when.length)
  )
    throw new Error('Invalid reset state context');
  const errors: Issue[] = [];
  preflight(input, errors);
  if (!errors.length) scope(input, '$', errors);
  if (errors.length) throw new DesignValidationError(errors);
  const copy = JSON.parse(JSON.stringify(input)) as Scope;
  const layer = context.breakpointId
    ? copy.breakpoints?.find((x) => x.id === context.breakpointId)
    : copy;
  if (!layer) return copy;
  const target = context.when
    ? layer.states?.find((x) => stateKey(x.when) === stateKey(context.when!))
    : layer;
  if (target) delete target.values[property];
  return copy;
}
