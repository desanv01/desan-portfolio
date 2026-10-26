import { literalProperties, plain, type Json } from './schema';
import type { DesignDocument, Values } from './model';
import { BUILTIN_FONT_ALIASES } from './runtime-defaults';

export type PublishedResource = {
  id: string | number;
  resourceVersion?: string;
  version?: string;
  sha256: string;
  url: string;
  mimeType?: string;
  kind?: string;
};
export type Declarations = Record<string, string>;
export type SerializedValues = {
  declarations: Declarations;
  parts: Record<string, Declarations>;
  behavior: Values;
  warnings: string[];
};
export const CSS_DIRECT: Record<string, string> = {
  'background.color': 'background-color',
  'background.position': 'background-position',
  'background.size': 'background-size',
  'background.repeat': 'background-repeat',
  'text.color': 'color',
  'border.color': 'border-color',
  'outline.color': 'outline-color',
  opacity: 'opacity',
  'border.width': 'border-width',
  'border.style': 'border-style',
  'border.radius': 'border-radius',
  'outline.width': 'outline-width',
  'outline.offset': 'outline-offset',
  'font.size': 'font-size',
  'font.weight': 'font-weight',
  'font.lineHeight': 'line-height',
  'font.tracking': 'letter-spacing',
  'font.wordSpacing': 'word-spacing',
  'text.align': 'text-align',
  'text.transform': 'text-transform',
  'text.measure': 'max-width',
  'text.wrap': 'text-wrap',
  width: 'width',
  minWidth: 'min-width',
  maxWidth: 'max-width',
  height: 'height',
  minHeight: 'min-height',
  maxHeight: 'max-height',
  margin: 'margin',
  padding: 'padding',
  'gap.row': 'row-gap',
  'gap.column': 'column-gap',
  'layout.direction': 'flex-direction',
  'layout.wrap': 'flex-wrap',
  'layout.grow': 'flex-grow',
  'layout.shrink': 'flex-shrink',
  'layout.basis': 'flex-basis',
  'layout.alignItems': 'align-items',
  'layout.justifyContent': 'justify-content',
  'layout.alignSelf': 'align-self',
  'layout.order': 'order',
  'position.layer': 'z-index',
  aspectRatio: 'aspect-ratio',
  'media.fit': 'object-fit',
  'sectionNav.seekOffset': 'scroll-margin-top',
};
const PALETTE: Record<string, string> = {
  'background.color': '--design-background',
  'surface.color': '--design-surface',
  'text.color': '--design-text',
  'text.mutedColor': '--design-muted',
  'accent.color': '--design-accent',
  'link.color': '--design-link',
  'border.color': '--design-border',
  'outline.color': '--design-focus',
  'status.errorColor': '--design-error',
  'status.successColor': '--design-success',
  'status.warningColor': '--design-warning',
  'status.infoColor': '--design-info',
};
const BEHAVIOR_KEYS = new Set([
  'density',
  'container.behavior',
  'section.anchor',
  'section.numbering',
  'collection.displayOrder',
  'collection.limit',
  'collection.emptyState',
  'text.direction',
  'shell.navOrder',
  'shell.navPresentation',
  'shell.collapseAt',
  'shell.sticky',
  'shell.activeIndicator',
  'action.variant',
  'action.iconPlacement',
  'action.loadingPresentation',
  'card.interactiveArea',
  'card.mediaPosition',
  'field.arrangement',
  'field.helpErrorPlacement',
  'filter.presentation',
  'icon.accessibleRole',
  'icon.source',
  'shell.logoAsset',
  'media.asset',
  'tag.presentation',
  'media.crop',
  'media.caption',
  'media.credit',
  'gallery.arrangement',
  'gallery.viewer',
  'pagination.presentation',
  'appearance.controlStyle',
  'motion.kind',
  'motion.trigger',
  'motion.repeat',
  'motion.reduced',
  'motion.interruptReset',
  'motion.reducedPolicy',
  'motion.intensity',
  'progress.enabled',
  'progress.zeroRange',
  'progress.format',
  'progress.mapping',
  'progress.topMarker',
  'progress.keyboardSteps',
  'progress.narrowVariant',
  'progress.minorTicks',
  'progress.majorTicks',
  'sectionNav.entries',
  'sectionNav.order',
  'sectionNav.currentRule',
  'sectionNav.history',
  'sectionNav.narrow',
  'skill.presentation',
  'skill.contextGrouping',
  'skill.detailEntry',
  'record.expansion',
  'record.narrowLayout',
  'resume.printPresentation',
]);
const PART_KEYS = new Set([
  'icon.size',
  'media.fit',
  'media.focalPoint',
  'media.crop',
  'aspectRatio',
  'section.divider',
  'shell.logoSize',
  'shell.menuPanel',
  'action.hitArea',
  'action.iconPlacement',
  'card.mediaPosition',
  'field.arrangement',
  'field.dimensions',
  'field.placeholderStyle',
  'tag.presentation',
  'icon.stroke',
  'media.caption',
  'media.credit',
  'gallery.spacing',
  'gallery.viewer',
  'progress.trackGeometry',
  'progress.minorTicks',
  'progress.majorTicks',
  'progress.labelStyle',
  'progress.markerStyle',
  'progress.hitArea',
  'sectionNav.position',
  'sectionNav.backing',
]);
const BOTH = new Set([
  'motion.kind',
  'text.direction',
  'shell.sticky',
  'gallery.arrangement',
  'media.crop',
  'tag.presentation',
]);
export const BINDING_REGISTRY = Object.fromEntries(
  Object.keys(literalProperties).map((key) => [
    key,
    {
      css: !BEHAVIOR_KEYS.has(key) || PART_KEYS.has(key) || BOTH.has(key),
      behavior: BEHAVIOR_KEYS.has(key),
      parts: PART_KEYS.has(key),
    },
  ]),
) as Record<string, { css: boolean; behavior: boolean; parts: boolean }>;

const obj = (v: Json): Record<string, Json> => v as Record<string, Json>;
const list = (v: Json): Json[] => v as Json[];
const number = (v: Json) => String(Object.is(v, -0) ? 0 : v);
export function cssString(value: string): string {
  // Also safe inside an HTML style element: never emit a literal '<' or closing tag.
  return `"${[...value].map((c) => (/[a-zA-Z0-9 _.-]/.test(c) ? c : `\\${c.codePointAt(0)!.toString(16)} `)).join('')}"`;
}
export function dimension(v: Json): string {
  if (typeof v === 'number' || typeof v === 'string') return number(v);
  const x = obj(v);
  if ('value' in x) return `${number(x.value)}${x.unit}`;
  if ('min' in x && 'preferred' in x)
    return `clamp(${dimension(x.min)}, ${dimension(x.preferred)}, ${dimension(x.max)})`;
  if (Array.isArray(v)) return v.map(dimension).join(' ');
  throw new Error('Unsupported typed dimension');
}
const color = (v: Json): string =>
  typeof v === 'string'
    ? v
    : `rgb(${obj(v).r} ${obj(v).g} ${obj(v).b} / ${obj(v).a})`;
const pair = (v: Json): string =>
  `${dimension(obj(v).x)} ${dimension(obj(v).y)}`;
const ratio = (v: Json): string =>
  typeof v === 'string' ? v : `${obj(v).width} / ${obj(v).height}`;
const track = (v: Json): string =>
  typeof v === 'string'
    ? v
    : 'fr' in obj(v)
      ? `${obj(v).fr}fr`
      : 'value' in obj(v) || 'preferred' in obj(v)
        ? dimension(v)
        : `minmax(${track(obj(v).min)}, ${track(obj(v).max)})`;
const gridName = (name: Json) =>
  `g-${[...String(name)].map((c) => c.codePointAt(0)!.toString(16)).join('-')}`;
const shadows = (v: Json): string =>
  list(v)
    .map((s) => {
      const x = obj(s);
      return `${x.inset ? 'inset ' : ''}${dimension(x.x)} ${dimension(x.y)} ${dimension(x.blur)} ${dimension(x.spread)} ${color(x.color)}`;
    })
    .join(', ') || 'none';
const easing = (v: Json): string =>
  typeof v === 'string'
    ? v
    : `cubic-bezier(${obj(v).x1}, ${obj(v).y1}, ${obj(v).x2}, ${obj(v).y2})`;
const time = (v: Json): string => `${obj(v).value}${obj(v).unit}`;
const fontName = (id: string) =>
  `design-font-${[...id].map((c) => c.codePointAt(0)!.toString(16)).join('-')}`;

export function resourceResolver(
  design: DesignDocument,
  resources: readonly PublishedResource[],
  warnings: string[],
) {
  const manifest = new Map(
    [...design.assets, ...design.fonts].map((x) => [x.id, x]),
  );
  const fontIds = new Set(design.fonts.map((x) => x.id));
  const byId = new Map<string, PublishedResource[]>();
  for (const resource of resources) {
    const key = String(resource.id);
    byId.set(key, [...(byId.get(key) ?? []), resource]);
  }
  const warn = (message: string) => {
    if (!warnings.includes(message)) warnings.push(message);
  };
  function url(id: string, font = false): string | undefined {
    const ref = manifest.get(id);
    const matches = byId.get(id) ?? [];
    const resource = matches.length === 1 ? matches[0] : undefined;
    if (
      !ref ||
      !resource ||
      (resource.resourceVersion ?? resource.version) !== ref.version ||
      resource.sha256 !== ref.sha256 ||
      !ref.rights.redistributable ||
      font !== fontIds.has(id) ||
      resource.url !== `/api/public/media/${encodeURIComponent(id)}` ||
      (font && resource.mimeType !== 'font/woff2')
    ) {
      warn(
        `Resource ${id} is missing, ambiguous, unpinned, unavailable or not public-ready; no fetch emitted`,
      );
      return undefined;
    }
    return resource.url;
  }
  function family(id: string): string {
    const font = design.fonts.find((x) => x.id === id);
    if (!font || !url(id, true)) return 'system-ui, sans-serif';
    const fallbacks = font.fallbacks.map((x) =>
      typeof x === 'string' ? x : cssString(fontName(x.fontId)),
    );
    return [cssString(fontName(id)), ...fallbacks].join(', ');
  }
  function fontFaces(): string {
    return design.fonts
      .flatMap((font) => {
        const source = url(font.id, true);
        if (!source) return [];
        return [
          `@font-face{font-family:${cssString(fontName(font.id))};src:url(${cssString(source)}) format("woff2");font-weight:${font.weight.min} ${font.weight.max};font-style:${font.style};font-display:swap;}`,
        ];
      })
      .join('\n');
  }
  return { url, family, fontFaces };
}

/** Internal: input values have already passed the complete published design validator. */
export function serializeValues(
  values: Values,
  resource: ReturnType<typeof resourceResolver>,
  options: { paintBackground?: boolean } = {},
): SerializedValues {
  const declarations: Declarations = {};
  const parts: Record<string, Declarations> = {};
  const behavior: Values = {};
  const warnings: string[] = [];
  const set = (key: string, value: string) => {
    declarations[key] = value;
  };
  const part = (name: string, style: Declarations) => {
    parts[name] = { ...parts[name], ...style };
  };
  const layout = (v: Json) => {
    const display = ['grid', 'split'].includes(String(v))
      ? 'grid'
      : ['stack', 'row'].includes(String(v))
        ? 'flex'
        : 'block';
    set('--design-display', display);
    set('display', 'var(--design-display)');
    if (v === 'stack' || v === 'row')
      set('flex-direction', v === 'row' ? 'row' : 'column');
  };
  for (const key of Object.keys(literalProperties)) {
    if (!Object.hasOwn(values, key)) continue;
    const v = values[key];
    if (BINDING_REGISTRY[key].behavior) behavior[key] = structuredClone(v);
    if (PALETTE[key]) set(PALETTE[key], color(v));
    if (CSS_DIRECT[key]) {
      let value: string;
      if (key.endsWith('.color')) value = color(v);
      else if (key === 'background.position') value = pair(v);
      else if (key === 'background.size' && typeof v !== 'string')
        value = `${dimension(obj(v).width)} ${dimension(obj(v).height)}`;
      else if (key === 'aspectRatio') value = ratio(v);
      else value = dimension(v);
      set(CSS_DIRECT[key], value);
    }
    switch (key) {
      case 'background.repeat':
        if (v === 'none') set('background-repeat', 'no-repeat');
        break;
      case 'background.gradient':
        set(
          '--design-gradient',
          v === 'none'
            ? 'none'
            : `linear-gradient(${obj(v).angle}deg, ${list(obj(v).stops)
                .map((s) => `${color(obj(s).color)} ${obj(s).position}%`)
                .join(', ')})`,
        );
        set(
          'background-image',
          'var(--design-gradient, none), var(--design-image, none)',
        );
        break;
      case 'background.image': {
        const url =
          v === 'none' ? undefined : resource.url(String(obj(v).assetId));
        set('--design-image', url ? `url(${cssString(url)})` : 'none');
        set(
          'background-image',
          'var(--design-gradient, none), var(--design-image, none)',
        );
        break;
      }
      case 'shadow.layers':
        set('box-shadow', shadows(v));
        break;
      case 'font.family':
        set('font-family', resource.family(String(obj(v).fontId)));
        break;
      case 'font.style':
        set(
          'font-style',
          typeof v === 'string' ? v : `oblique ${obj(v).oblique}deg`,
        );
        break;
      case 'font.variableAxes':
        set(
          'font-variation-settings',
          Object.entries(obj(v))
            .map(([tag, value]) => `${cssString(tag)} ${value}`)
            .join(', ') || 'normal',
        );
        break;
      case 'font.features':
        set(
          'font-feature-settings',
          Object.entries(obj(v))
            .map(([tag, value]) => `${cssString(tag)} ${value}`)
            .join(', ') || 'normal',
        );
        break;
      case 'text.decoration': {
        const x = obj(v);
        set('text-decoration-line', String(x.line));
        set('text-decoration-style', String(x.style));
        set('text-decoration-color', color(x.color));
        set('text-decoration-thickness', dimension(x.thickness));
        set('text-underline-offset', dimension(x.offset));
        break;
      }
      case 'text.wrap':
        if (v === 'nowrap') {
          set('white-space', 'nowrap');
          set('text-wrap', 'nowrap');
        } else set('white-space', 'normal');
        break;
      case 'text.breaking':
        set('overflow-wrap', String(obj(v).word));
        set('hyphens', String(obj(v).hyphens));
        break;
      case 'text.truncation':
        set('-webkit-line-clamp', v === 'none' ? 'unset' : String(v));
        set('-webkit-box-orient', 'vertical');
        if (v !== 'none') {
          set('display', '-webkit-box');
          set('overflow', 'hidden');
        }
        break;
      case 'text.direction':
        behavior[key] = v;
        if (v !== 'auto') set('direction', String(v));
        break;
      case 'layout.mode':
        layout(v);
        break;
      case 'layout.columns':
      case 'collection.columns':
        set('grid-template-columns', list(v).map(track).join(' ') || 'none');
        break;
      case 'layout.rows':
        set('grid-template-rows', list(v).map(track).join(' ') || 'none');
        break;
      case 'layout.columnSpan':
        set('grid-column', v === 'full' ? '1 / -1' : `span ${v}`);
        break;
      case 'layout.rowSpan':
        set('grid-row', `span ${v}`);
        break;
      case 'layout.gridPlacement': {
        const x = obj(v);
        for (const [name, css] of Object.entries({
          rowStart: 'grid-row-start',
          rowEnd: 'grid-row-end',
          columnStart: 'grid-column-start',
          columnEnd: 'grid-column-end',
          area: 'grid-area',
        }))
          set(
            css,
            x[name] === undefined
              ? 'auto'
              : typeof x[name] === 'string'
                ? gridName(x[name])
                : String(x[name]),
          );
        break;
      }
      case 'layout.areas':
        set(
          'grid-template-areas',
          list(v)
            .map((row) =>
              cssString(
                list(row)
                  .map((cell) => (cell === '.' ? '.' : gridName(cell)))
                  .join(' '),
              ),
            )
            .join(' ') || 'none',
        );
        break;
      case 'visibility':
        set('display', v === false ? 'none' : 'var(--design-display, revert)');
        break;
      case 'position.mode':
        set('position', v === 'flow' ? 'static' : String(v));
        break;
      case 'position.offsets':
        for (const edge of ['top', 'right', 'bottom', 'left'])
          set(
            edge,
            obj(v)[edge] === undefined ? 'auto' : dimension(obj(v)[edge]),
          );
        break;
      case 'overflow.axes':
        set('overflow-x', String(obj(v).x));
        set('overflow-y', String(obj(v).y));
        break;
      case 'transform': {
        const x = obj(v);
        const p = x.translate ? obj(x.translate) : undefined;
        const s = x.scale ? obj(x.scale) : undefined;
        set(
          'transform',
          `translate(${p ? dimension(p.x) : '0px'}, ${p ? dimension(p.y) : '0px'}) scale(${s?.x ?? 1}, ${s?.y ?? 1}) rotate(${x.rotate ?? 0}deg)`,
        );
        set(
          'transform-origin',
          x.origin ? `${obj(x.origin).x}% ${obj(x.origin).y}%` : '50% 50%',
        );
        break;
      }
      case 'collection.presentation':
        if (['grid', 'cards', 'split'].includes(String(v))) layout('grid');
        else {
          layout('stack');
        }
        break;
      case 'shell.logoAsset':
      case 'media.asset':
      case 'icon.source': {
        const x = plain(v) ? obj(v) : {};
        const id = x.assetId;
        behavior[key] = id
          ? { assetId: id, url: resource.url(String(id)) ?? null }
          : v;
        break;
      }
      case 'shell.logoSize':
        part('logo', {
          width: dimension(obj(v).width),
          height: dimension(obj(v).height),
        });
        break;
      case 'shell.sticky':
        set(
          'position',
          v === 'static' ? 'static' : v === 'fixed' ? 'fixed' : 'sticky',
        );
        set('top', '0px');
        break;
      case 'shell.menuPanel': {
        const x = obj(v);
        part('menu', {
          width: dimension(x.width),
          height: dimension(x.height),
          'background-color': color(x.backdrop),
          [String(x.edge)]: '0px',
        });
        break;
      }
      case 'action.hitArea':
        set('min-width', dimension(obj(v).minWidth));
        set('min-height', dimension(obj(v).minHeight));
        set('padding', dimension(obj(v).padding));
        break;
      case 'action.iconPlacement':
        part('icon', {
          display: obj(v).placement === 'none' ? 'none' : 'inline-block',
          width: dimension(obj(v).size),
          height: dimension(obj(v).size),
          order: obj(v).placement === 'before' ? '-1' : '1',
          'margin-inline-end':
            obj(v).placement === 'before' ? dimension(obj(v).gap) : '0px',
          'margin-inline-start':
            obj(v).placement === 'after' ? dimension(obj(v).gap) : '0px',
        });
        break;
      case 'card.mediaPosition':
        part('media', {
          order: obj(v).placement === 'before' ? '-1' : '1',
          'aspect-ratio': ratio(obj(v).ratio),
          'object-fit': String(obj(v).fit),
        });
        behavior[key] = v;
        break;
      case 'field.arrangement':
        set('display', obj(v).layout === 'columns' ? 'grid' : 'flex');
        set('flex-direction', obj(v).layout === 'inline' ? 'row' : 'column');
        behavior[key] = v;
        break;
      case 'field.dimensions':
        part('field', {
          height: dimension(obj(v).height),
          width: dimension(obj(v).width),
          padding: dimension(obj(v).padding),
        });
        break;
      case 'field.placeholderStyle':
        part('placeholder', {
          color: color(obj(v).color),
          opacity: String(obj(v).opacity),
          'font-size': dimension(obj(v).size),
        });
        break;
      case 'tag.presentation':
        set('padding', dimension(obj(v).padding));
        set('border-radius', dimension(obj(v).radius));
        set('border-style', obj(v).style === 'outline' ? 'solid' : 'none');
        behavior[key] = v;
        break;
      case 'icon.size':
        part('icon', { width: dimension(v), height: dimension(v) });
        break;
      case 'icon.stroke':
        part('icon', {
          stroke: color(obj(v).color),
          'stroke-width': dimension(obj(v).width),
          'stroke-linecap': String(obj(v).linecap),
          'stroke-linejoin': String(obj(v).linejoin),
        });
        break;
      case 'media.focalPoint':
        set('object-position', `${obj(v).x}% ${obj(v).y}%`);
        part('image', { 'object-position': `${obj(v).x}% ${obj(v).y}%` });
        break;
      case 'media.fit':
        part('image', {
          'object-fit': String(v),
          width: '100%',
          height: '100%',
        });
        break;
      case 'aspectRatio':
        part('media', { 'aspect-ratio': ratio(v) });
        break;
      case 'media.crop': {
        const x = obj(v);
        set(
          'clip-path',
          `inset(${Number(x.y) * 100}% ${(1 - Number(x.x) - Number(x.width)) * 100}% ${(1 - Number(x.y) - Number(x.height)) * 100}% ${Number(x.x) * 100}%)`,
        );
        part('image', { 'clip-path': declarations['clip-path'] });
        delete declarations['clip-path'];
        break;
      }
      case 'media.caption':
        part('caption', {
          display: obj(v).visible ? 'block' : 'none',
          order: obj(v).position === 'before' ? '-1' : '1',
          'max-width': dimension(obj(v).measure),
          'margin-block-start': dimension(obj(v).spacing),
        });
        break;
      case 'media.credit':
        part('credit', {
          display: obj(v).visible ? 'block' : 'none',
          order: obj(v).position === 'before' ? '-1' : '1',
        });
        break;
      case 'gallery.arrangement':
        layout(
          v === 'grid' || v === 'masonry'
            ? 'grid'
            : v === 'stack'
              ? 'stack'
              : 'row',
        );
        if (v === 'carousel') {
          set('overflow-x', 'auto');
          set('scroll-snap-type', 'x mandatory');
        }
        break;
      case 'gallery.spacing':
        set(
          'grid-template-columns',
          list(obj(v).columns).map(track).join(' ') || 'none',
        );
        set('gap', dimension(obj(v).gap));
        part('media', { 'aspect-ratio': ratio(obj(v).ratio) });
        break;
      case 'gallery.viewer':
        part('viewer', { 'background-color': color(obj(v).backdrop) });
        break;
      case 'motion.duration':
        set(
          'transition-duration',
          `calc(var(--design-motion-enabled, 1) * ${time(v)})`,
        );
        set('--design-motion-duration', time(v));
        break;
      case 'motion.delay':
        set('--design-motion-delay', time(v));
        set(
          'transition-delay',
          `calc(var(--design-motion-enabled, 1) * ${time(v)})`,
        );
        break;
      case 'motion.kind':
        set('--design-motion-enabled', v === 'none' ? '0' : '1');
        set(
          'transition-duration',
          'calc(var(--design-motion-enabled, 1) * var(--design-motion-duration, 150ms))',
        );
        set(
          'transition-delay',
          'calc(var(--design-motion-enabled, 1) * var(--design-motion-delay, 0ms))',
        );
        if (v !== 'none') set('animation', 'revert-layer');
        break;
      case 'motion.easing':
        set('transition-timing-function', easing(v));
        break;
      case 'motion.intensity':
        behavior[key] = v;
        break;
      case 'progress.trackGeometry':
        set('width', dimension(obj(v).width));
        set('height', dimension(obj(v).height));
        set('inset', dimension(obj(v).inset));
        break;
      case 'progress.minorTicks':
      case 'progress.majorTicks': {
        const x = obj(v);
        part(key.endsWith('minorTicks') ? 'minor-tick' : 'major-tick', {
          width: dimension(x.length),
          'border-top-width': dimension(x.width),
          'border-top-style': 'solid',
          'border-color': color(x.color),
          opacity: String(x.opacity),
        });
        behavior[key] = v;
        break;
      }
      case 'progress.labelStyle': {
        const x = obj(v);
        part('readout', {
          'font-family': resource.family(String(obj(x.font).fontId)),
          'font-size': dimension(x.size),
          'letter-spacing': dimension(x.tracking),
          color: color(x.color),
          'text-align': x.placement === 'start' ? 'start' : 'end',
        });
        break;
      }
      case 'progress.markerStyle':
        part('marker', {
          'border-top-width': dimension(obj(v).thickness),
          'border-top-style': 'solid',
          'border-color': color(obj(v).color),
          'box-shadow': shadows(obj(v).glow),
          display: obj(v).visible ? 'block' : 'none',
        });
        break;
      case 'progress.hitArea':
        part('seek', {
          'min-width': dimension(obj(v).width),
          'min-height': dimension(obj(v).height),
          'user-select': 'none',
        });
        break;
      case 'sectionNav.position':
        set(
          'position',
          obj(v).mode === 'flow' ? 'static' : String(obj(v).mode),
        );
        set('inset', dimension(obj(v).inset));
        set('width', dimension(obj(v).width));
        break;
      case 'sectionNav.backing':
        set(
          'background-color',
          `color-mix(in srgb, ${color(obj(v).color)} ${Number(obj(v).opacity) * 100}%, transparent)`,
        );
        set('backdrop-filter', `blur(${dimension(obj(v).blur)})`);
        set('padding', dimension(obj(v).padding));
        set('--design-backing-opacity', String(obj(v).opacity));
        break;
      case 'advanced.blendFilter': {
        const x = obj(v);
        set('mix-blend-mode', String(x.blend ?? 'normal'));
        set(
          'filter',
          `blur(${x.blur ? dimension(x.blur) : '0px'}) brightness(${x.brightness ?? 1}) saturate(${x.saturation ?? 1})`,
        );
        set(
          'backdrop-filter',
          x.backdropBlur ? `blur(${dimension(x.backdropBlur)})` : 'none',
        );
        break;
      }
      case 'advanced.clipMask': {
        if (v === 'none') {
          set('clip-path', 'none');
          set('mask-image', 'none');
        } else if ('assetId' in obj(v)) {
          const url = resource.url(String(obj(v).assetId));
          set('mask-image', url ? `url(${cssString(url)})` : 'none');
        } else {
          const x = obj(v);
          set(
            'clip-path',
            x.shape === 'inset'
              ? `inset(${dimension(x.inset)})`
              : x.shape === 'circle'
                ? 'circle(50% at 50% 50%)'
                : 'ellipse(50% 50% at 50% 50%)',
          );
        }
        break;
      }
      case 'advanced.scrollPresentation':
        set('scroll-margin', dimension(obj(v).margin));
        set('scroll-padding', dimension(obj(v).padding));
        set(
          'scroll-snap-type',
          obj(v).snap === 'none' ? 'none' : `both ${obj(v).snap}`,
        );
        set('scroll-behavior', String(obj(v).behavior));
        break;
      case 'section.divider': {
        const x = obj(v);
        part('divider', {
          display: x.placement === 'none' ? 'none' : 'block',
          width: dimension(x.length),
          'border-top-width': dimension(x.thickness),
          'border-top-style': String(x.style),
        });
        behavior[key] = v;
        break;
      }
      default:
        if (key.startsWith('motion.') && key.endsWith('Feedback')) {
          const x = obj(v);
          behavior[key] = v;
          set(
            `--design-${key.replaceAll('.', '-')}-duration`,
            time(x.duration),
          );
          set(`--design-${key.replaceAll('.', '-')}-easing`, easing(x.easing));
        }
        break;
    }
  }
  if (values['motion.kind'] === 'none') {
    declarations['transition-duration'] = '0ms';
    declarations['transition-delay'] = '0ms';
    declarations['animation'] = 'none';
    declarations['scroll-behavior'] = 'auto';
    for (const key of Object.keys(declarations))
      if (key.startsWith('--design-motion-') && key.endsWith('-duration'))
        declarations[key] = '0s';
  }
  if (options.paintBackground === false)
    for (const key of [
      'background-color',
      'background-image',
      'background-position',
      'background-size',
      'background-repeat',
    ])
      delete declarations[key];
  return { declarations, parts, behavior, warnings };
}

export function builtinVariables(): Declarations {
  return Object.fromEntries(
    Object.entries(BUILTIN_FONT_ALIASES).map(([key, value]) => [
      `--design-font-${key}`,
      value,
    ]),
  );
}
export function reactStyle(declarations: Declarations): Record<string, string> {
  return Object.fromEntries(
    Object.entries(declarations).map(([key, value]) => [
      key.startsWith('--')
        ? key
        : key
            .replace(/^-webkit-/, 'Webkit-')
            .replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()),
      value,
    ]),
  );
}
