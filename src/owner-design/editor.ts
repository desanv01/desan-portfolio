import {
  assertValidDesign,
  importDesign,
  validateDesign,
  STATES,
  type DesignDocument,
  type Scope,
  type State,
  type Values,
  type NodeKind,
} from '../design/model';
import {
  literalProperties,
  plain,
  type Json,
  type Issue,
} from '../design/schema';

export type Selection =
  | { kind: 'site' }
  | { kind: 'theme'; id: string; mode: 'base' | 'light' | 'dark' }
  | { kind: 'page' | 'template' | 'node' | 'shared'; id: string };
export type Context = {
  selection: Selection;
  breakpoint?: string;
  states: State[];
};
export type EditorState = {
  document: DesignDocument;
  saved: DesignDocument;
  revision: string;
  recordId: string;
  past: { document: DesignDocument; label: string }[];
  future: { document: DesignDocument; label: string }[];
  status: 'idle' | 'saving' | 'saved' | 'error' | 'conflict' | 'expired';
  message: string;
};
export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
export const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
export function openEditor(
  document: DesignDocument,
  revision: string,
  recordId: string,
): EditorState {
  const valid = assertValidDesign(document);
  return {
    document: clone(valid),
    saved: clone(valid),
    revision,
    recordId,
    past: [],
    future: [],
    status: 'idle',
    message: '',
  };
}
export const isDirty = (s: EditorState) => !same(s.document, s.saved);
export function commit(
  s: EditorState,
  document: DesignDocument,
  label: string,
): EditorState {
  const valid = assertValidDesign(document);
  if (same(s.document, valid)) return s;
  return {
    ...s,
    document: clone(valid),
    past: [...s.past, { document: s.document, label }].slice(-100),
    future: [],
    status: s.status === 'expired' ? 'expired' : 'idle',
    message: label,
  };
}
export function undo(s: EditorState): EditorState {
  const previous = s.past.at(-1);
  if (!previous) return s;
  return {
    ...s,
    document: previous.document,
    past: s.past.slice(0, -1),
    future: [...s.future, { document: s.document, label: previous.label }],
    status: 'idle',
    message: `Undid ${previous.label}`,
  };
}
export function redo(s: EditorState): EditorState {
  const next = s.future.at(-1);
  if (!next) return s;
  return {
    ...s,
    document: next.document,
    future: s.future.slice(0, -1),
    past: [...s.past, { document: s.document, label: next.label }],
    status: 'idle',
    message: `Redid ${next.label}`,
  };
}
/** Acknowledgements checkpoint the submitted document, preserving edits made while the request was in flight. */
export function acknowledgeSave(
  s: EditorState,
  submitted: DesignDocument,
  revision: string,
  recordId = s.recordId,
): EditorState {
  return {
    ...s,
    saved: clone(submitted),
    revision,
    recordId,
    status: 'saved',
    message: `Saved draft revision ${revision}${same(s.document, submitted) ? '' : ' · newer local changes retained'}`,
  };
}
export function saveFailure(
  s: EditorState,
  status: number,
  message: string,
): EditorState {
  return {
    ...s,
    status:
      status === 409
        ? 'conflict'
        : status === 401 || status === 403
          ? 'expired'
          : 'error',
    message,
  };
}
export function scopeAt(d: DesignDocument, s: Selection): Scope {
  if (s.kind === 'site') return d.defaults;
  if (s.kind === 'theme') {
    const t = d.themes.find((t) => t.id === s.id);
    if (t) return t.modes[s.mode];
  }
  const collection =
    s.kind === 'node'
      ? d.nodes
      : s.kind === 'page'
        ? d.pages
        : s.kind === 'template'
          ? d.templates
          : s.kind === 'shared'
            ? d.sharedComponents
            : [];
  const found = collection.find((x) => x.id === ('id' in s ? s.id : ''));
  if (found) return found.scope;
  throw Error('Selected scope no longer exists');
}
export function normalizeEditorContext(
  d: DesignDocument,
  requested: { selection: Selection; breakpoint: string; themeId: string },
): { selection: Selection; breakpoint: string; themeId: string } {
  let selection = requested.selection;
  try {
    if (!scopeAt(d, selection)) selection = { kind: 'site' };
  } catch {
    selection = { kind: 'site' };
  }
  return {
    selection,
    breakpoint: d.breakpoints.some((b) => b.id === requested.breakpoint)
      ? requested.breakpoint
      : '',
    themeId: d.themes.some((t) => t.id === requested.themeId && !t.archived)
      ? requested.themeId
      : d.defaultThemeId,
  };
}
export function valuesAt(
  d: DesignDocument,
  c: Context,
  create = false,
): Values {
  let scope = scopeAt(d, c.selection);
  if (c.breakpoint) {
    if (!d.breakpoints.some((b) => b.id === c.breakpoint))
      throw Error('Unknown breakpoint');
    let bp = scope.breakpoints?.find((b) => b.id === c.breakpoint);
    if (!bp && create) {
      bp = { id: c.breakpoint, values: {} };
      (scope.breakpoints ??= []).push(bp);
    }
    if (!bp) return {};
    scope = bp;
  }
  if (!c.states.length) return scope.values;
  const key = [...c.states].sort().join('|');
  let state = scope.states?.find((x) => [...x.when].sort().join('|') === key);
  if (!state && create) {
    state = { when: [...c.states], values: {} };
    (scope.states ??= []).push(state);
  }
  return state?.values ?? {};
}
export function setProperty(
  d: DesignDocument,
  c: Context,
  key: string,
  value: Json | undefined,
): DesignDocument {
  if (!Object.hasOwn(literalProperties, key))
    throw Error('Unsupported property');
  const next = clone(d),
    values = valuesAt(next, c, true);
  if (value === undefined) delete values[key];
  else values[key] = clone(value);
  return assertValidDesign(next);
}
export function propertyIssues(key: string, value: unknown): Issue[] {
  const issues: Issue[] = [];
  literalProperties[key]?.(value, key, issues);
  return issues;
}
/** Inspector resolution stops at the selected scope instead of showing a descendant's override as inherited. */
export function inspectValues(
  d: DesignDocument,
  c: Context,
  options: {
    pageId: string;
    themeId: string;
    mode: 'light' | 'dark';
    width: number;
  },
): { values: Values; sources: Record<string, string> } {
  const theme = d.themes.find(
    (t) =>
      t.id ===
      (c.selection.kind === 'theme' ? c.selection.id : options.themeId),
  );
  const layers: { name: string; scope: Scope }[] = [
    { name: 'site', scope: d.defaults },
  ];
  if (c.selection.kind !== 'site' && theme) {
    layers.push({ name: `theme:${theme.id}:base`, scope: theme.modes.base });
    const mode = c.selection.kind === 'theme' ? c.selection.mode : options.mode;
    if (mode !== 'base')
      layers.push({
        name: `theme:${theme.id}:${mode}`,
        scope: theme.modes[mode],
      });
  }
  if (c.selection.kind !== 'site' && c.selection.kind !== 'theme') {
    const page = d.pages.find(
      (p) =>
        p.id ===
        (c.selection.kind === 'page' ? c.selection.id : options.pageId),
    );
    const template = d.templates.find(
      (t) =>
        t.id ===
        (c.selection.kind === 'template' ? c.selection.id : page?.templateId),
    );
    if (template)
      layers.push({ name: `template:${template.id}`, scope: template.scope });
    if (page && c.selection.kind !== 'template')
      layers.push({ name: `page:${page.id}`, scope: page.scope });
    if (c.selection.kind === 'shared') {
      const id = c.selection.id;
      const shared = d.sharedComponents.find((x) => x.id === id);
      if (shared)
        layers.push({ name: `shared:${shared.id}`, scope: shared.scope });
    }
    if (c.selection.kind === 'node') {
      const chain = [];
      const id = c.selection.id;
      let node = d.nodes.find((n) => n.id === id);
      while (node) {
        chain.unshift(node);
        const current = node;
        node = d.nodes.find((n) => n.children.includes(current.id));
      }
      for (const n of chain) {
        const shared = d.sharedComponents.find((x) => x.id === n.componentId);
        if (shared)
          layers.push({ name: `shared:${shared.id}`, scope: shared.scope });
        layers.push({ name: `node:${n.id}`, scope: n.scope });
      }
    }
  }
  const values: Values = {},
    sources: Record<string, string> = {},
    tokens = { ...d.tokens, ...theme?.tokens };
  const literal = (v: Json): Json =>
    v && typeof v === 'object' && !Array.isArray(v) && '$token' in v
      ? literal(tokens[String(v.$token)].value)
      : clone(v);
  function apply(bag: Values, name: string) {
    for (const [k, v] of Object.entries(bag)) {
      values[k] = literal(v);
      sources[k] = name;
    }
  }
  function applyStates(s: Scope, name: string) {
    for (const item of [...(s.states ?? [])].sort(
      (a, b) =>
        Math.max(...a.when.map((x) => STATES.indexOf(x))) -
          Math.max(...b.when.map((x) => STATES.indexOf(x))) ||
        a.when.length - b.when.length ||
        [...a.when]
          .sort()
          .join()
          .localeCompare([...b.when].sort().join()),
    ))
      if (item.when.every((x) => c.states.includes(x)))
        apply(item.values, name + ':state:' + item.when.join('+'));
  }
  const width = c.breakpoint
    ? (d.breakpoints.find((x) => x.id === c.breakpoint)?.minWidth ??
      options.width)
    : options.width;
  for (const { scope, name } of layers) {
    apply(scope.values, name);
    applyStates(scope, name);
    for (const bp of d.breakpoints)
      if (bp.minWidth <= width) {
        const o = scope.breakpoints?.find((x) => x.id === bp.id);
        if (o) {
          apply(o.values, name + ':' + bp.id);
          applyStates(o, name + ':' + bp.id);
        }
      }
  }
  return { values, sources };
}
export function resetScope(d: DesignDocument, c: Context): DesignDocument {
  const next = clone(d);
  const values = valuesAt(next, c, true);
  for (const k of Object.keys(values)) delete values[k];
  return assertValidDesign(next);
}
export function uniqueId(d: DesignDocument, prefix: string): string {
  const used = new Set(
    [
      ...d.nodes,
      ...d.pages,
      ...d.templates,
      ...d.themes,
      ...d.sharedComponents,
      ...d.breakpoints,
    ].map((x) => x.id),
  );
  let i = 1;
  while (used.has(`${prefix}-${i}`)) i++;
  return `${prefix}-${i}`;
}
export type Destination =
  | { kind: 'page' | 'template' | 'node'; id: string }
  | { kind: 'shell'; id: 'header' | 'footer' | 'navigation' };
export function childrenAt(d: DesignDocument, p: Destination): string[] {
  if (p.kind === 'shell') return d.sharedShell[p.id];
  const row = (
    p.kind === 'node' ? d.nodes : p.kind === 'page' ? d.pages : d.templates
  ).find((x) => x.id === p.id);
  if (!row) throw Error('Destination no longer exists');
  return 'children' in row ? row.children : row.rootIds;
}
export function addNode(
  d: DesignDocument,
  parent: Destination,
  kind: NodeKind,
): DesignDocument {
  const next = clone(d),
    id = uniqueId(next, kind);
  next.nodes.push({ id, kind, scope: { values: {} }, children: [] });
  childrenAt(next, parent).push(id);
  return assertValidDesign(next);
}
export function moveNode(
  d: DesignDocument,
  id: string,
  parent: Destination,
  index: number,
): DesignDocument {
  const next = clone(d);
  if (!next.nodes.some((n) => n.id === id)) throw Error('Unknown node');
  for (const list of allLists(next)) {
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1);
  }
  const list = childrenAt(next, parent);
  list.splice(Math.max(0, Math.min(list.length, index)), 0, id);
  return assertValidDesign(next);
}
function allLists(d: DesignDocument): string[][] {
  return [
    ...d.nodes.map((n) => n.children),
    ...d.pages.map((p) => p.rootIds),
    ...d.templates.map((t) => t.rootIds),
    ...Object.values(d.sharedShell),
  ];
}
export function duplicateNode(
  d: DesignDocument,
  id: string,
  parent: Destination,
): DesignDocument {
  const next = clone(d),
    map = new Map<string, string>();
  function copy(key: string): string {
    const original = d.nodes.find((n) => n.id === key);
    if (!original) throw Error('Unknown node');
    const fresh = clone(original);
    fresh.id = uniqueId(next, `${original.kind}-copy`);
    map.set(key, fresh.id);
    next.nodes.push(fresh);
    fresh.children = original.children.map(copy);
    return fresh.id;
  }
  const root = copy(id);
  // Internal references are remapped; copied anchors get fresh stable identifiers.
  function remap(v: Json): Json {
    if (Array.isArray(v)) return v.map(remap);
    if (v && typeof v === 'object')
      return Object.fromEntries(
        Object.entries(v).map(([k, x]) => [
          k,
          (k === 'targetId' || k === 'nodeId') && typeof x === 'string'
            ? (map.get(x) ?? x)
            : remap(x),
        ]),
      );
    return v;
  }
  for (const freshId of map.values()) {
    const n = next.nodes.find((n) => n.id === freshId)!;
    n.scope = remap(n.scope as unknown as Json) as unknown as Scope;
    if (n.scope.values['section.anchor'])
      n.scope.values['section.anchor'] = freshId;
    if (n.target?.nodeId)
      n.target.nodeId = map.get(n.target.nodeId) ?? n.target.nodeId;
  }
  childrenAt(next, parent).push(root);
  return assertValidDesign(next);
}
export function removeNode(d: DesignDocument, id: string): DesignDocument {
  const next = clone(d),
    removed = new Set<string>();
  function visit(key: string) {
    if (removed.has(key)) return;
    removed.add(key);
    next.nodes.find((n) => n.id === key)?.children.forEach(visit);
  }
  visit(id);
  next.nodes = next.nodes.filter((n) => !removed.has(n.id));
  for (const list of allLists(next))
    for (let i = list.length - 1; i >= 0; i--)
      if (removed.has(list[i])) list.splice(i, 1);
  // Model validation deliberately blocks deletion when external references need owner review.
  return assertValidDesign(next);
}
export function editTheme(
  d: DesignDocument,
  id: string,
  action: 'create' | 'duplicate' | 'archive' | 'rename' | 'default' | 'visitor',
  name?: string,
): DesignDocument {
  const next = clone(d),
    theme = next.themes.find((t) => t.id === id);
  if (action === 'create' || action === 'duplicate') {
    const fresh =
      action === 'duplicate' && theme
        ? clone(theme)
        : {
            id: '',
            name: '',
            modes: {
              base: { values: {} },
              light: { values: {} },
              dark: { values: {} },
            },
          };
    fresh.id = uniqueId(next, 'theme');
    fresh.name = name || 'Untitled theme';
    fresh.archived = false;
    next.themes.push(fresh);
  } else {
    if (!theme) throw Error('Unknown theme');
    if (action === 'rename') theme.name = name || 'Untitled theme';
    if (action === 'default') {
      theme.archived = false;
      next.defaultThemeId = id;
    }
    if (action === 'archive') {
      if (id === next.defaultThemeId)
        throw Error('Choose another default before archiving');
      theme.archived = !theme.archived;
      next.visitorThemeIds = next.visitorThemeIds.filter((x) => x !== id);
    }
    if (action === 'visitor') {
      if (theme.archived) throw Error('Unarchive theme first');
      next.visitorThemeIds = next.visitorThemeIds.includes(id)
        ? next.visitorThemeIds.filter((x) => x !== id)
        : [...next.visitorThemeIds, id];
    }
  }
  return assertValidDesign(next);
}
export function importIntoEditor(s: EditorState, input: string): EditorState {
  const result = importDesign(input);
  if (!result.valid)
    throw Error(result.errors.map((x) => `${x.path}: ${x.message}`).join('\n'));
  return commit(s, result.data, 'Import validated design into local draft');
}
export function editBreakpoint(
  d: DesignDocument,
  id: string,
  minWidth: number | undefined,
): DesignDocument {
  const next = clone(d);
  if (minWidth === undefined) {
    next.breakpoints = next.breakpoints.filter((x) => x.id !== id);
    for (const s of [
      next.defaults,
      ...next.themes.flatMap((t) => Object.values(t.modes)),
      ...next.nodes.map((n) => n.scope),
      ...next.sharedComponents.map((n) => n.scope),
      ...next.pages.map((n) => n.scope),
      ...next.templates.map((n) => n.scope),
    ])
      if (s.breakpoints)
        s.breakpoints = s.breakpoints.filter((b) => b.id !== id);
  } else {
    const found = next.breakpoints.find((x) => x.id === id);
    if (found) found.minWidth = minWidth;
    else next.breakpoints.push({ id, minWidth });
    next.breakpoints.sort((a, b) => a.minWidth - b.minWidth);
  }
  return assertValidDesign(next);
}
export function detachNodeRole(
  d: DesignDocument,
  nodeId: string,
): DesignDocument {
  const next = clone(d),
    node = next.nodes.find((n) => n.id === nodeId);
  if (!node) throw Error('Unknown node');
  const mergeStates = (a: Scope['states'], b: Scope['states']) => {
    const map = new Map<string, NonNullable<Scope['states']>[number]>();
    for (const s of [...(a ?? []), ...(b ?? [])]) {
      const key = [...s.when].sort().join('|');
      map.set(key, {
        when: s.when,
        values: { ...map.get(key)?.values, ...s.values },
      });
    }
    return [...map.values()];
  };
  const shared = next.sharedComponents.find((c) => c.id === node.componentId);
  if (shared) {
    const local = node.scope;
    node.scope = clone(shared.scope);
    node.scope.values = { ...node.scope.values, ...local.values };
    node.scope.states = mergeStates(node.scope.states, local.states);
    const merged = new Map(
      (node.scope.breakpoints ?? []).map((b) => [b.id, b]),
    );
    for (const bp of local.breakpoints ?? []) {
      const inherited = merged.get(bp.id);
      merged.set(bp.id, {
        id: bp.id,
        values: { ...inherited?.values, ...bp.values },
        states: mergeStates(inherited?.states, bp.states),
      });
    }
    node.scope.breakpoints = [...merged.values()];
  }
  delete node.componentId;
  return assertValidDesign(next);
}
const THEME_FIELDS = [
  'defaultThemeId',
  'defaultMode',
  'visitorThemeIds',
  'tokens',
  'defaults',
  'themes',
  'fonts',
  'assets',
  'breakpoints',
] as const;
export function exportThemes(d: DesignDocument): string {
  return JSON.stringify(
    {
      kind: 'desan-themes',
      schemaVersion: 1,
      data: Object.fromEntries(THEME_FIELDS.map((k) => [k, d[k]])),
    },
    null,
    2,
  );
}
export function exportRecovery(
  d: DesignDocument,
  buffers: Record<string, Json>,
): string {
  return JSON.stringify(
    { kind: 'desan-editor-recovery', schemaVersion: 1, document: d, buffers },
    null,
    2,
  );
}
export function validateImport(
  text: string,
  current?: DesignDocument,
): {
  document?: DesignDocument;
  buffers?: Record<string, Json>;
  kind?: 'themes' | 'recovery' | 'design';
  errors: Issue[];
} {
  if (new TextEncoder().encode(text).length > 2_000_000)
    return {
      errors: [{ path: '$', code: 'size', message: 'Import exceeds 2 MB' }],
    };
  try {
    const packageData: unknown = JSON.parse(text);
    if (plain(packageData) && packageData.kind === 'desan-themes') {
      if (
        packageData.schemaVersion !== 1 ||
        !plain(packageData.data) ||
        !current ||
        Object.keys(packageData).some(
          (k) => !['kind', 'schemaVersion', 'data'].includes(k),
        ) ||
        Object.keys(packageData.data).some(
          (k) => !THEME_FIELDS.includes(k as (typeof THEME_FIELDS)[number]),
        )
      )
        throw Error('Unsupported theme package or no current design');
      const result = validateDesign({ ...current, ...packageData.data });
      return result.valid
        ? { document: result.data, errors: [], kind: 'themes' }
        : { errors: result.errors };
    }
    if (plain(packageData) && packageData.kind === 'desan-editor-recovery') {
      if (
        packageData.schemaVersion !== 1 ||
        !plain(packageData.buffers) ||
        Object.keys(packageData).some(
          (k) => !['kind', 'schemaVersion', 'document', 'buffers'].includes(k),
        )
      )
        throw Error('Unsupported recovery package');
      const result = validateDesign(packageData.document);
      if (!result.valid) return { errors: result.errors };
      for (const key of Object.keys(packageData.buffers)) {
        const [selection, bp, states, property] = JSON.parse(key);
        if (
          !Object.hasOwn(literalProperties, property) ||
          !Array.isArray(states) ||
          states.some((s: State) => !STATES.includes(s)) ||
          (bp && !result.data.breakpoints.some((b) => b.id === bp))
        )
          throw Error('Invalid editing buffer context');
        scopeAt(result.data, selection);
      }
      return {
        document: result.data,
        buffers: packageData.buffers as Record<string, Json>,
        errors: [],
        kind: 'recovery',
      };
    }
  } catch (error) {
    return {
      errors: [
        {
          path: '$',
          code: 'package',
          message:
            error instanceof Error ? error.message : 'Invalid import package',
        },
      ],
    };
  }
  const result = importDesign(text);
  return result.valid
    ? { document: result.data, errors: [], kind: 'design' }
    : { errors: result.errors };
}
export function validateCandidate(d: unknown) {
  return validateDesign(d);
}
