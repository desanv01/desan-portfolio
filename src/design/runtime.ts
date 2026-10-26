import {
  assertValidDesign,
  STATES,
  type DesignDocument,
  type DesignNode,
  type Scope,
  type State,
  type StateOverride,
  type Values,
} from './model';
import { plain, type Json } from './schema';
import {
  builtinVariables,
  cssString,
  reactStyle,
  resourceResolver,
  serializeValues,
  type Declarations,
  type PublishedResource,
} from './runtime-serialize';
export { BINDING_REGISTRY } from './runtime-serialize';
export { INVENTORY_BINDINGS } from './runtime-inventory';
export type { PublishedResource } from './runtime-serialize';
export {
  createCopperDesign,
  PUBLIC_PAGE_IDS,
  PUBLIC_ROLE_KINDS,
  PUBLIC_PAGE_SECTIONS,
  BUILTIN_FONT_ALIASES,
} from './runtime-defaults';

export type RuntimeOptions = {
  pageId?: string;
  themeId?: string;
  mode: 'light' | 'dark';
  resources?: readonly PublishedResource[];
  scopeId?: string;
};
export type BindingOptions = RuntimeOptions & {
  nodeId?: string;
  width: number;
  states?: State[];
  reducedMotion?: boolean;
};
export type RuntimeBinding = {
  style: Record<string, string>;
  declarations: Declarations;
  parts: Record<string, Declarations>;
  behavior: Values;
  attributes: Record<string, string | boolean>;
  sources: Record<string, string>;
  warnings: string[];
  structure?: {
    id: string;
    kind: string;
    children: string[];
    contentRef?: DesignNode['contentRef'];
    target?: DesignNode['target'];
    componentId?: string;
  };
};
export type CompiledRule = {
  nodeId?: string;
  minWidth: number;
  states: State[];
  declarations: Declarations;
  parts: Record<string, Declarations>;
  behavior: Values;
  focusOnly?: boolean;
};
export type CompiledDesign = {
  css: string;
  fontFaces: string;
  rootAttributes: Record<string, string>;
  nodeAttributes: Record<string, Record<string, string>>;
  rules: CompiledRule[];
  rootIds: string[];
  shellRoots: DesignDocument['sharedShell'];
  nodes: Record<string, DesignNode>;
  warnings: string[];
};
export type DesignTreeBinding = {
  node: DesignNode;
  binding: RuntimeBinding;
  children: DesignTreeBinding[];
};
const clone = <T>(value: T): T => structuredClone(value);
const stateKey = (states: readonly State[]) =>
  STATES.filter((x) => states.includes(x)).join('+');
const stateOrder = (a: StateOverride, b: StateOverride) =>
  Math.max(...a.when.map((x) => STATES.indexOf(x))) -
    Math.max(...b.when.map((x) => STATES.indexOf(x))) ||
  a.when.length - b.when.length ||
  stateKey(a.when).localeCompare(stateKey(b.when), 'en');
function context(data: DesignDocument, options: RuntimeOptions) {
  if (!['light', 'dark'].includes(options.mode))
    throw new Error('Invalid appearance mode');
  const theme = data.themes.find(
    (x) => x.id === (options.themeId ?? data.defaultThemeId) && !x.archived,
  );
  if (!theme) throw new Error('Unknown or archived theme');
  const page = data.pages.find((x) => x.id === options.pageId);
  if (options.pageId && !page) throw new Error('Unknown design page');
  const template = data.templates.find((x) => x.id === page?.templateId);
  const nodes = new Map(data.nodes.map((x) => [x.id, x]));
  const parents = new Map(
    data.nodes.flatMap((x) => x.children.map((id) => [id, x.id] as const)),
  );
  const seenShell = new Set<string>();
  const shellRoots = Object.fromEntries(
    Object.entries(data.sharedShell).map(([slot, ids]) => [
      slot,
      ids.filter((id) => {
        if (seenShell.has(id)) return false;
        seenShell.add(id);
        return true;
      }),
    ]),
  ) as DesignDocument['sharedShell'];
  const rootIds = [
    ...new Set([...(page?.rootIds ?? []), ...(template?.rootIds ?? [])]),
  ].filter((id) => !seenShell.has(id));
  const allowedRoots = [...rootIds, ...Object.values(shellRoots).flat()];
  const tokenMap = { ...data.tokens, ...theme.tokens };
  function literal(v: Json): Json {
    if (plain(v) && Object.hasOwn(v, '$token'))
      return literal(tokenMap[v.$token as string].value);
    return clone(v);
  }
  function chain(nodeId?: string): { scope: Scope; name: string }[] {
    const layers = [
      { scope: data.defaults, name: 'site' },
      { scope: theme!.modes.base, name: `theme:${theme!.id}:base` },
      {
        scope: theme!.modes[options.mode],
        name: `theme:${theme!.id}:${options.mode}`,
      },
    ];
    if (template)
      layers.push({ scope: template.scope, name: `template:${template.id}` });
    if (page) layers.push({ scope: page.scope, name: `page:${page.id}` });
    if (nodeId) {
      const ancestry: DesignNode[] = [];
      let key: string | undefined = nodeId;
      while (key && nodes.has(key)) {
        const node = nodes.get(key)!;
        ancestry.unshift(node);
        key = parents.get(key);
      }
      if (ancestry.length && page && !allowedRoots.includes(ancestry[0].id))
        throw new Error('Node is outside selected page');
      if (!ancestry.length) {
        const shared = data.sharedComponents.find((x) => x.id === nodeId);
        if (!shared)
          throw new Error('Unknown design node or shared component role');
        layers.push({ scope: shared.scope, name: `shared:${shared.id}` });
      } else
        for (const node of ancestry) {
          const shared = data.sharedComponents.find(
            (x) => x.id === node.componentId,
          );
          if (shared)
            layers.push({ scope: shared.scope, name: `shared:${shared.id}` });
          layers.push({ scope: node.scope, name: `node:${node.id}` });
        }
    }
    return layers;
  }
  return {
    theme,
    page,
    template,
    nodes,
    parents,
    rootIds,
    shellRoots,
    allowedRoots,
    literal,
    chain,
  };
}
function validateBindingOptions(options: BindingOptions) {
  if (
    !Number.isFinite(options.width) ||
    options.width < 0 ||
    options.states?.some((x) => !STATES.includes(x))
  )
    throw new Error('Invalid viewport/state context');
}
function valuesAt(
  data: DesignDocument,
  ctx: ReturnType<typeof context>,
  options: BindingOptions,
) {
  const values: Values = {};
  const sources: Record<string, string> = {};
  const focus: Values = {};
  const active = options.states ?? [];
  const apply = (bag: Values, name: string, focused = false) => {
    for (const [key, value] of Object.entries(bag)) {
      values[key] = ctx.literal(value);
      sources[key] = name;
      if (focused && key.startsWith('outline.')) focus[key] = values[key];
    }
  };
  const states = (entries: StateOverride[] | undefined, name: string) => {
    for (const item of [...(entries ?? [])].sort(stateOrder))
      if (item.when.every((x) => active.includes(x)))
        apply(
          item.values,
          `${name}:state:${stateKey(item.when)}`,
          item.when.includes('focus-visible'),
        );
  };
  for (const { scope, name } of ctx.chain(options.nodeId)) {
    apply(scope.values, name);
    states(scope.states, name);
    for (const breakpoint of data.breakpoints)
      if (breakpoint.minWidth <= options.width) {
        const entry = scope.breakpoints?.find((x) => x.id === breakpoint.id);
        if (!entry) continue;
        apply(entry.values, `${name}:breakpoint:${entry.id}`);
        states(entry.states, `${name}:breakpoint:${entry.id}`);
      }
  }
  if (options.reducedMotion) {
    values['motion.kind'] = 'none';
    values['motion.duration'] = { value: 0, unit: 'ms' };
    values['motion.delay'] = { value: 0, unit: 'ms' };
    values['motion.repeat'] = 'none';
    for (const key of Object.keys(values))
      if (
        key.startsWith('motion.') &&
        key.endsWith('Feedback') &&
        plain(values[key])
      )
        values[key] = {
          ...(values[key] as Record<string, Json>),
          kind: 'none',
          duration: { value: 0, unit: 'ms' },
        };
  }
  return { values, sources, focus };
}
function structure(node: DesignNode | undefined) {
  if (!node) return undefined;
  return clone({
    id: node.id,
    kind: node.kind,
    children: node.children,
    ...(node.contentRef ? { contentRef: node.contentRef } : {}),
    ...(node.target ? { target: node.target } : {}),
    ...(node.componentId ? { componentId: node.componentId } : {}),
  });
}
export function designNodeAttributes(
  nodeId: string,
  contentRef?: { collection: string; id: string },
): Record<string, string> {
  // These are attribute values, never a selector/HTML fragment. CSS uses quoted escaping.
  return {
    'data-design-node': nodeId,
    ...(contentRef
      ? {
          'data-design-content-collection': contentRef.collection,
          'data-design-content-id': contentRef.id,
        }
      : {}),
  };
}
export function resolveDesignBinding(
  input: unknown,
  options: BindingOptions,
): RuntimeBinding {
  const data = assertValidDesign(input);
  validateBindingOptions(options);
  const ctx = context(data, options);
  const result = valuesAt(data, ctx, options);
  const warnings: string[] = [];
  const resource = resourceResolver(data, options.resources ?? [], warnings);
  const source = result.sources['background.color'];
  const node = ctx.nodes.get(options.nodeId ?? '');
  const ownNames = [
    `node:${options.nodeId}`,
    `shared:${node?.componentId ?? options.nodeId}`,
  ];
  const isOwn = (name: string | undefined) =>
    !options.nodeId ||
    ownNames.some((own) => name === own || name?.startsWith(`${own}:`));
  const serialized = serializeValues(result.values, resource, {
    paintBackground: isOwn(source),
  });
  const focused = serializeValues(result.focus, resource);
  if (options.nodeId && result.sources['text.color']?.startsWith('theme:'))
    delete serialized.declarations.color;
  // Background subproperties may have independent provenance; inherited palettes do not paint every text box.
  for (const [property, css] of Object.entries({
    'background.image': 'background-image',
    'background.gradient': 'background-image',
    'background.position': 'background-position',
    'background.size': 'background-size',
    'background.repeat': 'background-repeat',
  }))
    if (
      isOwn(result.sources[property]) &&
      Object.hasOwn(result.values, property)
    )
      Object.assign(
        serialized.declarations,
        serializeValues({ [property]: result.values[property] }, resource)
          .declarations,
      );
    else if (
      property !== 'background.gradient' &&
      property !== 'background.image'
    )
      delete serialized.declarations[css];
  Object.assign(serialized.declarations, focused.declarations);
  if (options.nodeId === 'nav-link')
    serialized.parts.label = {
      ...(serialized.parts.label ?? {}),
      ...Object.fromEntries(
        Object.entries(serialized.declarations).filter(
          ([key]) => key === 'color' || key === 'background-color',
        ),
      ),
    };
  const attributes: Record<string, string | boolean> = options.nodeId
    ? designNodeAttributes(options.nodeId)
    : {};
  if (result.values['text.direction'])
    attributes.dir = String(result.values['text.direction']);
  if (result.values['section.anchor'])
    attributes.id = String(result.values['section.anchor']);
  if (result.values.visibility === false) attributes.hidden = true;
  if (options.states?.includes('disabled'))
    attributes['aria-disabled'] = 'true';
  if (
    result.values['record.expansion'] &&
    plain(result.values['record.expansion'])
  )
    attributes['data-design-default-expanded'] = String(
      (result.values['record.expansion'] as Record<string, Json>).expanded,
    );
  return {
    style: reactStyle(serialized.declarations),
    declarations: serialized.declarations,
    parts: serialized.parts,
    behavior: {
      ...serialized.behavior,
      ...Object.fromEntries(
        Object.entries(result.values).filter(([key]) =>
          key.startsWith('motion.'),
        ),
      ),
    },
    attributes,
    sources: result.sources,
    warnings: [...warnings, ...serialized.warnings],
    structure: structure(ctx.nodes.get(options.nodeId ?? '')),
  };
}
const stateSelector: Record<State, string> = {
  selected:
    ':is([data-design-selected="true"],[aria-selected="true"],[aria-current]:not([aria-current="false"]))',
  expanded: ':is([data-design-expanded="true"],[aria-expanded="true"],[open])',
  loading: ':is([data-design-loading="true"],[aria-busy="true"])',
  success: '[data-design-success="true"]',
  hover: ':hover',
  pressed: ':active',
  'focus-visible': ':focus-visible',
  error: ':is([data-design-error="true"],[aria-invalid="true"])',
  disabled:
    ':is(:disabled,[aria-disabled="true"],[data-design-disabled="true"])',
};
const declarationsText = (declarations: Declarations) =>
  Object.entries(declarations)
    .map(([key, value]) => `${key}:${value};`)
    .join('');
function nodeSelector(
  root: string,
  id: string | undefined,
  nodes: Map<string, DesignNode>,
) {
  if (!id) return root;
  const node = nodes.get(id);
  const regular = `[data-design-node=${cssString(id)}]`;
  const record =
    node?.contentRef && node.componentId
      ? `[data-design-node=${cssString(node.componentId)}][data-design-content-collection=${cssString(node.contentRef.collection)}][data-design-content-id=${cssString(node.contentRef.id)}]`
      : undefined;
  return `${root} ${record ? `:is(${regular},${record})` : regular}`;
}
function ruleText(selector: string, rule: CompiledRule): string {
  const state = rule.states.map((x) => stateSelector[x]).join('');
  const scoped = `:where(${selector}${state})`;
  let css = Object.keys(rule.declarations).length
    ? `${scoped}{${declarationsText(rule.declarations)}}`
    : '';
  if (
    rule.states.includes('focus-visible') &&
    Object.keys(rule.declarations).length
  ) {
    const otherStates = rule.states
      .filter((state) => state !== 'focus-visible')
      .map((state) => stateSelector[state])
      .join('');
    const focusParts = ['seek', 'field']
      .map(
        (part) =>
          `:where(${selector}${otherStates} [data-design-part=${cssString(part)}]:focus-visible)`,
      )
      .join(',');
    css += `${focusParts}{${declarationsText(rule.declarations)}}`;
  }
  for (const [name, declarations] of Object.entries(rule.parts)) {
    const target =
      name === 'placeholder'
        ? `:where(${selector}${state})::placeholder,:where(${selector}${state} [data-design-part="field"])::placeholder`
        : `:where(${selector}${state} [data-design-part=${cssString(name)}])`;
    css += `${target}{${declarationsText(declarations)}}`;
  }
  // Avoid sticky emulated touch hover: require an actual hover-capable pointer.
  if (rule.states.includes('hover')) css = `@media (hover:hover){${css}}`;
  return rule.minWidth > 0
    ? `@media (min-width:${rule.minWidth}px){${css}}`
    : css;
}

export function compileDesignStyles(
  input: unknown,
  options: RuntimeOptions,
): CompiledDesign {
  const data = assertValidDesign(input);
  const ctx = context(data, options);
  const scopeId =
    options.scopeId ??
    `${data.id}.${options.pageId ?? 'site'}.${ctx.theme.id}.${options.mode}`;
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,511}$/.test(scopeId))
    throw new Error('Unsafe design scope identifier');
  const root = `[data-design-root=${cssString(scopeId)}]`;
  const warnings: string[] = [];
  const resource = resourceResolver(data, options.resources ?? [], warnings);
  const fontFaces = resource.fontFaces();
  const ids = new Set<string>();
  const walk = (id: string) => {
    if (ids.has(id)) return;
    ids.add(id);
    ctx.nodes.get(id)?.children.forEach(walk);
  };
  (ctx.page
    ? ctx.allowedRoots
    : data.nodes.filter((x) => !ctx.parents.has(x.id)).map((x) => x.id)
  ).forEach(walk);
  // Abstract role definitions bind existing semantic DOM slots without duplicating content nodes.
  for (const shared of data.sharedComponents)
    if (
      !options.pageId ||
      shared.id.startsWith(`${options.pageId}.`) ||
      !shared.id.includes('.')
    )
      ids.add(shared.id);
  const orderedIds = [...ids].sort(
    (a, b) =>
      Number(Boolean(ctx.nodes.get(a)?.contentRef)) -
      Number(Boolean(ctx.nodes.get(b)?.contentRef)),
  );
  const rules: CompiledRule[] = [];
  const focusRules: CompiledRule[] = [];
  for (const nodeId of [undefined, ...orderedIds]) {
    const add = (
      values: Values,
      minWidth: number,
      states: State[] = [],
      paintBackground = true,
      inheritThemeColor = false,
    ) => {
      const literal = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, ctx.literal(value)]),
      );
      const rendered = serializeValues(literal, resource, { paintBackground });
      if (literal['motion.kind'] === 'none') {
        rendered.declarations['transition-duration'] =
          'calc(var(--design-motion-enabled, 1) * var(--design-motion-duration, 150ms))';
        rendered.declarations['transition-delay'] =
          'calc(var(--design-motion-enabled, 1) * var(--design-motion-delay, 0ms))';
      }
      if (inheritThemeColor) delete rendered.declarations.color;
      if (nodeId === 'nav-link')
        rendered.parts.label = {
          ...(rendered.parts.label ?? {}),
          ...Object.fromEntries(
            Object.entries(rendered.declarations).filter(
              ([key]) => key === 'color' || key === 'background-color',
            ),
          ),
        };
      rules.push({
        nodeId,
        minWidth,
        states: [...states],
        declarations: rendered.declarations,
        parts: rendered.parts,
        behavior: rendered.behavior,
      });
      if (states.includes('focus-visible')) {
        const focus = Object.fromEntries(
          Object.entries(literal).filter(([key]) => key.startsWith('outline.')),
        );
        const protectedValues = serializeValues(focus, resource);
        if (Object.keys(protectedValues.declarations).length)
          focusRules.push({
            nodeId,
            minWidth,
            states: [...states],
            declarations: protectedValues.declarations,
            parts: {},
            behavior: {},
            focusOnly: true,
          });
      }
    };
    for (const { scope, name } of ctx.chain(nodeId)) {
      const node = ctx.nodes.get(nodeId ?? '');
      const paint =
        !nodeId ||
        name === `node:${nodeId}` ||
        name === `shared:${node?.componentId ?? nodeId}`;
      const inheritThemeColor = Boolean(nodeId && name.startsWith('theme:'));
      add(scope.values, 0, [], paint, inheritThemeColor);
      [...(scope.states ?? [])]
        .sort(stateOrder)
        .forEach((x) => add(x.values, 0, x.when, paint, inheritThemeColor));
      for (const bp of data.breakpoints) {
        const override = scope.breakpoints?.find((x) => x.id === bp.id);
        if (!override) continue;
        add(override.values, bp.minWidth, [], paint, inheritThemeColor);
        [...(override.states ?? [])]
          .sort(stateOrder)
          .forEach((x) =>
            add(x.values, bp.minWidth, x.when, paint, inheritThemeColor),
          );
      }
    }
  }
  const initial = `:where(${root}){${declarationsText({ ...builtinVariables(), 'font-family': 'var(--design-font-body)', 'font-synthesis': 'none' })}}`;
  const cssRules = [...rules, ...focusRules]
    .map((rule) => ruleText(nodeSelector(root, rule.nodeId, ctx.nodes), rule))
    .join('\n');
  const reduced = `@media (prefers-reduced-motion:reduce){:where(${root},${root} *){transition-duration:0s;transition-delay:0s;animation:none;scroll-behavior:auto;}}`;
  return {
    css: `${fontFaces}\n@layer design{${initial}\n${cssRules}\n${reduced}}`,
    fontFaces,
    rootAttributes: {
      'data-design-root': scopeId,
      'data-design-page': options.pageId ?? '',
      'data-design-theme': ctx.theme.id,
      'data-design-mode': options.mode,
    },
    nodeAttributes: Object.fromEntries(
      orderedIds.map((id) => [id, designNodeAttributes(id)]),
    ),
    rules: [...rules, ...focusRules],
    rootIds: clone(ctx.rootIds),
    shellRoots: clone(ctx.shellRoots),
    nodes: Object.fromEntries(
      [...ids].flatMap((id) =>
        ctx.nodes.has(id) ? [[id, clone(ctx.nodes.get(id)!)] as const] : [],
      ),
    ),
    warnings,
  };
}

export function resolveDesignTree(input: unknown, options: BindingOptions) {
  const data = assertValidDesign(input);
  validateBindingOptions(options);
  const ctx = context(data, options);
  const walk = (id: string): DesignTreeBinding | undefined => {
    const node = ctx.nodes.get(id);
    if (!node) return;
    const binding = resolveDesignBinding(data, { ...options, nodeId: id });
    if (binding.attributes.hidden) return;
    return {
      node: clone(node),
      binding,
      children: node.children.flatMap((child) => {
        const next = walk(child);
        return next ? [next] : [];
      }),
    };
  };
  return ctx.rootIds.flatMap((id) => {
    const next = walk(id);
    return next ? [next] : [];
  });
}

/** Honest document progress; every input is current measured geometry, not a frozen initial range. */
export function documentProgress(
  scrollY: number,
  scrollHeight: number,
  viewportHeight: number,
  format = { digits: 3, suffix: '%' },
) {
  if (
    ![scrollY, scrollHeight, viewportHeight].every(Number.isFinite) ||
    scrollHeight < 0 ||
    viewportHeight < 0 ||
    !Number.isInteger(format.digits) ||
    format.digits < 1 ||
    format.digits > 10
  )
    throw new Error('Invalid progress geometry/format');
  const range = Math.max(0, scrollHeight - viewportHeight);
  const fraction = range === 0 ? 0 : Math.min(1, Math.max(0, scrollY / range));
  const percent = Math.round(fraction * 100);
  return {
    range,
    fraction,
    percent,
    scrollable: range > 0,
    label: `${String(percent).padStart(format.digits, '0')}${format.suffix}`,
  };
}
export function seekFraction(
  pointer: number,
  trackStart: number,
  trackSize: number,
): number {
  if (
    ![pointer, trackStart, trackSize].every(Number.isFinite) ||
    trackSize <= 0
  )
    return 0;
  return Math.min(1, Math.max(0, (pointer - trackStart) / trackSize));
}
export function progressKeyTarget(
  key: string,
  fraction: number,
  steps = { arrow: 1, page: 10 },
): number | undefined {
  if (
    !Number.isFinite(fraction) ||
    ![steps.arrow, steps.page].every(
      (x) => Number.isFinite(x) && x > 0 && x <= 100,
    )
  )
    throw new Error('Invalid progress keyboard steps');
  if (key === 'Home') return 0;
  if (key === 'End') return 1;
  const delta: Record<string, number> = {
    ArrowDown: steps.arrow,
    ArrowRight: steps.arrow,
    ArrowUp: -steps.arrow,
    ArrowLeft: -steps.arrow,
    PageDown: steps.page,
    PageUp: -steps.page,
  };
  return Object.hasOwn(delta, key)
    ? Math.min(1, Math.max(0, fraction + delta[key] / 100))
    : undefined;
}
export function currentSection(
  sections: { id: string; top: number }[],
  activationLine: number,
): string | undefined {
  if (
    !Number.isFinite(activationLine) ||
    sections.some((x) => !Number.isFinite(x.top))
  )
    throw new Error('Invalid section geometry');
  const ordered = [...sections].sort((a, b) => a.top - b.top);
  return (
    ordered.filter((x) => x.top <= activationLine).at(-1)?.id ?? ordered[0]?.id
  );
}
