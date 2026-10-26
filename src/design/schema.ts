/** Closed, data-only presentation vocabulary. Adding a property requires a schema. */
export type Json =
  null | boolean | number | string | Json[] | { [key: string]: Json };
export type Issue = { path: string; code: string; message: string };
export type Rule = (value: unknown, path: string, errors: Issue[]) => void;

export const fail = (
  errors: Issue[],
  path: string,
  message: string,
  code = 'invalid',
) => {
  if (errors.length < 200) errors.push({ path, code, message });
};
export const plain = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);
export const num =
  (min = -1e7, max = 1e7, integer = false): Rule =>
  (v, p, e) => {
    if (
      typeof v !== 'number' ||
      !Number.isFinite(v) ||
      v < min ||
      v > max ||
      (integer && !Number.isInteger(v))
    )
      fail(
        e,
        p,
        `Expected ${integer ? 'integer' : 'finite number'} between ${min} and ${max}`,
      );
  };
export const text: Rule = (v, p, e) => {
  if (
    typeof v !== 'string' ||
    v.length > 2048 ||
    /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]|(?:javascript|data|vbscript):|:\/\//i.test(
      v,
    )
  )
    fail(
      e,
      p,
      'Expected plain text, without markup, executable schemes or URLs',
    );
};
export const id: Rule = (v, p, e) => {
  if (
    typeof v !== 'string' ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(v) ||
    ['__proto__', 'constructor', 'prototype'].includes(v)
  )
    fail(e, p, 'Expected safe stable identifier');
};
export const bool: Rule = (v, p, e) => {
  if (typeof v !== 'boolean') fail(e, p, 'Expected boolean');
};
export const choice =
  (...values: (string | number | boolean)[]): Rule =>
  (v, p, e) => {
    if (!values.includes(v as string))
      fail(e, p, `Expected one of: ${values.join(', ')}`);
  };
export const array =
  (item: Rule, min = 0, max = 2048): Rule =>
  (v, p, e) => {
    if (!Array.isArray(v) || v.length < min || v.length > max)
      return fail(e, p, `Expected array with ${min}..${max} items`);
    v.forEach((x, i) => item(x, `${p}[${i}]`, e));
  };
export const shape =
  (required: Record<string, Rule>, optional: Record<string, Rule> = {}): Rule =>
  (v, p, e) => {
    if (!plain(v)) return fail(e, p, 'Expected plain object');
    for (const key of Object.keys(v)) {
      const rule = Object.hasOwn(required, key)
        ? required[key]
        : Object.hasOwn(optional, key)
          ? optional[key]
          : undefined;
      if (!rule) fail(e, `${p}.${key}`, 'Unknown property', 'unknown-property');
      else rule(v[key], `${p}.${key}`, e);
    }
    for (const key of Object.keys(required))
      if (!Object.hasOwn(v, key))
        fail(e, `${p}.${key}`, 'Required property missing');
  };
export const map =
  (keyRule: Rule, item: Rule, max = 2048): Rule =>
  (v, p, e) => {
    if (!plain(v) || Object.keys(v).length > max)
      return fail(e, p, 'Expected bounded plain map');
    for (const [key, x] of Object.entries(v)) {
      keyRule(key, `${p}.${key}`, e);
      item(x, `${p}.${key}`, e);
    }
  };
export const either =
  (...rules: Rule[]): Rule =>
  (v, p, e) => {
    if (
      !rules.some((r) => {
        const test: Issue[] = [];
        r(v, p, test);
        return test.length === 0;
      })
    )
      fail(e, p, 'Value does not match a supported typed representation');
  };
export const measure = shape({
  value: num(),
  unit: choice('px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'),
});
const nonnegativeMeasure: Rule = (v, p, e) => {
  measure(v, p, e);
  if (plain(v)) num(0)(v.value, `${p}.value`, e);
};
const fluid = shape({
  min: nonnegativeMeasure,
  preferred: nonnegativeMeasure,
  max: nonnegativeMeasure,
});
export const length = either(nonnegativeMeasure, fluid);
const signedLength = either(
  measure,
  shape({ min: measure, preferred: measure, max: measure }),
);
export const color = either(
  (v, p, e) => {
    if (
      typeof v !== 'string' ||
      !/^(?:#[\da-f]{3}|#[\da-f]{4}|#[\da-f]{6}|#[\da-f]{8}|transparent|currentColor)$/i.test(
        v,
      )
    )
      fail(e, p, 'Expected hex color, transparent or currentColor');
  },
  shape({ r: num(0, 255), g: num(0, 255), b: num(0, 255), a: num(0, 1) }),
);
export const tokenReference = shape({ $token: id });
export const fontReference = shape({ fontId: id });
export const mediaReference = shape({ assetId: id });
const edges = either(
  signedLength,
  choice('auto'),
  array(either(signedLength, choice('auto')), 1, 4),
);
const padding = either(length, array(length, 1, 4));
const tag: Rule = (v, p, e) => {
  if (typeof v !== 'string' || !/^[A-Za-z0-9]{4}$/.test(v))
    fail(e, p, 'Expected four-character OpenType tag');
};
const trackEnd = either(
  length,
  choice('auto', 'min-content', 'max-content'),
  shape({ fr: num(0.000001) }),
);
const track = either(
  trackEnd,
  shape({
    min: either(length, choice('auto', 'min-content', 'max-content')),
    max: trackEnd,
  }),
);
const point = shape({ x: num(0, 100), y: num(0, 100) });
const ratio = either(
  choice('auto'),
  shape({ width: num(0.000001), height: num(0.000001) }),
);
const time = shape({ value: num(0, 3600000), unit: choice('ms', 's') });
const easing = either(
  choice('linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'),
  shape({ x1: num(0, 1), y1: num(), x2: num(0, 1), y2: num() }),
);
const shadow = shape({
  x: measure,
  y: measure,
  blur: nonnegativeMeasure,
  spread: measure,
  color,
  inset: bool,
});
const position = shape({ x: signedLength, y: signedLength });
const feedback = shape(
  {
    kind: choice(
      'none',
      'opacity',
      'inversion',
      'backing',
      'brightness',
      'digit',
      'smooth',
    ),
    duration: time,
    easing,
  },
  { opacity: num(0, 1) },
);
const tick = shape({
  step: num(0.000001, 100),
  length,
  width: length,
  color,
  opacity: num(0, 1),
});

/** Values can reference typed tokens; each token is checked against its property's rule. */
export const literalProperties: Record<string, Rule> = {
  'background.color': color,
  'background.gradient': either(
    choice('none'),
    shape({
      angle: num(-360, 360),
      stops: array(shape({ color, position: num(0, 100) }), 2, 32),
    }),
  ),
  'background.image': either(mediaReference, choice('none')),
  'background.position': position,
  'background.size': either(
    choice('cover', 'contain', 'auto'),
    shape({ width: length, height: length }),
  ),
  'background.repeat': choice('none', 'repeat', 'repeat-x', 'repeat-y'),
  'surface.color': color,
  'text.color': color,
  'text.mutedColor': color,
  'accent.color': color,
  'link.color': color,
  'border.color': color,
  'outline.color': color,
  'status.errorColor': color,
  'status.successColor': color,
  'status.warningColor': color,
  'status.infoColor': color,
  opacity: num(0, 1),
  'border.width': padding,
  'border.style': choice('solid', 'dashed', 'dotted', 'double', 'none'),
  'border.radius': padding,
  'shadow.layers': array(shadow, 0, 32),
  'outline.width': length,
  'outline.offset': signedLength,
  'font.family': fontReference,
  'font.size': length,
  'font.weight': num(1, 1000),
  'font.style': either(
    choice('normal', 'italic'),
    shape({ oblique: num(-90, 90) }),
  ),
  'font.lineHeight': either(num(0), length),
  'font.tracking': either(choice('normal'), signedLength),
  'font.wordSpacing': either(choice('normal'), signedLength),
  'font.variableAxes': map(tag, num(), 64),
  'font.features': map(tag, num(0, 65535, true), 128),
  'text.align': choice('start', 'center', 'end', 'justify'),
  'text.transform': choice('none', 'uppercase', 'lowercase', 'capitalize'),
  'text.decoration': shape({
    line: choice('none', 'underline', 'overline', 'line-through'),
    style: choice('solid', 'double', 'dotted', 'dashed', 'wavy'),
    color,
    thickness: length,
    offset: signedLength,
  }),
  'text.measure': length,
  'text.wrap': choice('normal', 'balance', 'pretty', 'nowrap'),
  'text.breaking': shape({
    word: choice('normal', 'break-word', 'anywhere'),
    hyphens: choice('none', 'manual', 'auto'),
  }),
  'text.truncation': either(choice('none'), num(1, 100000, true)),
  'text.direction': choice('inherit', 'ltr', 'rtl', 'auto'),
  width: either(length, choice('auto')),
  minWidth: length,
  maxWidth: either(length, choice('none')),
  height: either(length, choice('auto')),
  minHeight: length,
  maxHeight: either(length, choice('none')),
  margin: edges,
  padding,
  'gap.row': length,
  'gap.column': length,
  density: choice('comfortable', 'compact', 'custom'),
  'layout.mode': choice('stack', 'row', 'grid', 'split', 'free'),
  'layout.columns': array(track, 0, 128),
  'layout.rows': array(track, 0, 128),
  'layout.columnSpan': either(choice('full'), num(1, 100000, true)),
  'layout.rowSpan': num(1, 100000, true),
  'layout.gridPlacement': shape(
    {},
    {
      rowStart: either(id, num(1, 100000, true)),
      rowEnd: either(id, num(1, 100000, true)),
      columnStart: either(id, num(1, 100000, true)),
      columnEnd: either(id, num(1, 100000, true)),
      area: id,
    },
  ),
  'layout.areas': array(array(either(id, choice('.')), 1, 128), 0, 128),
  'layout.direction': choice('row', 'column', 'row-reverse', 'column-reverse'),
  'layout.wrap': choice('wrap', 'nowrap'),
  'layout.grow': num(0),
  'layout.shrink': num(0),
  'layout.basis': either(length, choice('auto')),
  'layout.alignItems': choice('start', 'center', 'end', 'stretch', 'baseline'),
  'layout.justifyContent': choice(
    'start',
    'center',
    'end',
    'space-between',
    'space-around',
    'space-evenly',
  ),
  'layout.alignSelf': choice(
    'inherit',
    'start',
    'center',
    'end',
    'stretch',
    'baseline',
  ),
  'layout.order': num(-100000, 100000, true),
  visibility: bool,
  'position.mode': choice('flow', 'relative', 'absolute', 'sticky', 'fixed'),
  'position.offsets': shape(
    {},
    {
      top: either(signedLength, choice('auto')),
      right: either(signedLength, choice('auto')),
      bottom: either(signedLength, choice('auto')),
      left: either(signedLength, choice('auto')),
    },
  ),
  'position.layer': either(choice('auto'), num(-100000, 100000, true)),
  'overflow.axes': shape({
    x: choice('visible', 'clip', 'hidden', 'auto', 'scroll'),
    y: choice('visible', 'clip', 'hidden', 'auto', 'scroll'),
  }),
  transform: shape(
    {},
    {
      translate: position,
      scale: shape({ x: num(-1000, 1000), y: num(-1000, 1000) }),
      rotate: num(-36000, 36000),
      origin: point,
    },
  ),
  aspectRatio: ratio,
  'container.behavior': choice('bounded', 'full-bleed', 'inset'),
  'section.anchor': id,
  'section.numbering': shape(
    { mode: choice('auto', 'manual', 'hidden') },
    { label: text },
  ),
  'section.divider': shape({
    placement: choice('none', 'before', 'after', 'both'),
    length,
    thickness: length,
    style: choice('solid', 'dashed', 'dotted'),
  }),
  'collection.presentation': choice(
    'rows',
    'cards',
    'grid',
    'timeline',
    'editorial',
    'split',
  ),
  'collection.columns': array(track, 0, 128),
  'collection.displayOrder': choice(
    'source',
    'date-ascending',
    'date-descending',
    'title',
  ),
  'collection.limit': num(1, 100000, true),
  'collection.emptyState': array(id),
  'shell.logoAsset': either(mediaReference, choice('none')),
  'shell.logoSize': shape({ width: length, height: length }),
  'shell.navOrder': array(id),
  'shell.navPresentation': choice(
    'segmented',
    'inline',
    'stacked',
    'drawer',
    'disclosure',
  ),
  'shell.collapseAt': id,
  'shell.sticky': choice('static', 'sticky', 'fixed', 'auto-hide'),
  'shell.menuPanel': shape({
    edge: choice('top', 'bottom', 'left', 'right'),
    width: either(length, choice('auto')),
    height: either(length, choice('auto')),
    backdrop: color,
  }),
  'shell.activeIndicator': choice(
    'border',
    'fill',
    'underline',
    'marker',
    'none',
  ),
  'action.variant': choice('fill', 'outline', 'text', 'custom'),
  'action.hitArea': shape({ minWidth: length, minHeight: length, padding }),
  'action.iconPlacement': shape({
    placement: choice('before', 'after', 'none'),
    gap: length,
    size: length,
  }),
  'action.loadingPresentation': shape({
    kind: choice('spinner', 'text', 'icon', 'none'),
    position: choice('before', 'after', 'replace'),
  }),
  'card.mediaPosition': shape({
    placement: choice('before', 'after', 'overlay', 'side'),
    ratio,
    fit: choice('cover', 'contain', 'fill', 'none', 'scale-down'),
  }),
  'card.interactiveArea': choice('title', 'whole-card', 'separate-actions'),
  'field.arrangement': shape({
    layout: choice('stack', 'inline', 'columns'),
    label: choice('before', 'after', 'above'),
  }),
  'field.dimensions': shape({
    height: either(length, choice('auto')),
    padding,
    width: either(length, choice('auto')),
  }),
  'field.placeholderStyle': shape({ color, opacity: num(0, 1), size: length }),
  'field.helpErrorPlacement': choice('before', 'after', 'inline', 'icon'),
  'filter.presentation': choice(
    'chips',
    'select',
    'sidebar',
    'disclosure',
    'drawer',
  ),
  'tag.presentation': shape({
    style: choice('fill', 'outline'),
    padding,
    radius: length,
  }),
  'icon.source': either(mediaReference, shape({ iconId: id })),
  'icon.size': length,
  'icon.stroke': shape({
    width: length,
    color,
    linecap: choice('butt', 'round', 'square'),
    linejoin: choice('miter', 'round', 'bevel'),
  }),
  'icon.accessibleRole': choice('decorative', 'labelled'),
  'media.asset': mediaReference,
  'media.fit': choice('cover', 'contain', 'fill', 'none', 'scale-down'),
  'media.focalPoint': point,
  'media.crop': shape({
    x: num(0, 1),
    y: num(0, 1),
    width: num(0.000001, 1),
    height: num(0.000001, 1),
  }),
  'media.caption': shape({
    visible: bool,
    position: choice('before', 'after', 'overlay'),
    measure: length,
    spacing: length,
  }),
  'media.credit': shape({
    visible: bool,
    position: choice('before', 'after', 'overlay'),
  }),
  'gallery.arrangement': choice('grid', 'row', 'stack', 'masonry', 'carousel'),
  'gallery.spacing': shape({
    columns: array(track, 0, 128),
    gap: length,
    ratio,
  }),
  'gallery.viewer': shape({
    mode: choice('inline', 'dialog'),
    backdrop: color,
    controls: bool,
  }),
  'pagination.presentation': choice('pages', 'previous-next', 'load-more'),
  'appearance.controlStyle': choice('menu', 'buttons', 'labelled-icon'),
  'motion.kind': choice(
    'fade',
    'translate',
    'scale',
    'rotate',
    'reveal',
    'none',
  ),
  'motion.duration': time,
  'motion.delay': time,
  'motion.easing': easing,
  'motion.intensity': shape(
    {},
    {
      distance: measure,
      rotate: num(-36000, 36000),
      scale: num(0, 1000),
      opacity: num(0, 1),
    },
  ),
  'motion.trigger': choice('hover', 'focus', 'enter', 'scroll', 'toggle'),
  'motion.repeat': either(choice('none', 'loop'), num(0, 100000, true)),
  'motion.reduced': choice('off', 'static', 'fade'),
  'motion.primaryFeedback': feedback,
  'motion.inversionFeedback': feedback,
  'motion.headerFeedback': feedback,
  'motion.linkFeedback': feedback,
  'motion.pressFeedback': feedback,
  'motion.panelFeedback': feedback,
  'motion.themeFeedback': feedback,
  'motion.resultFeedback': feedback,
  'motion.statusFeedback': feedback,
  'motion.digitFeedback': feedback,
  'motion.seekFeedback': feedback,
  'motion.interruptReset': choice('reverse-current'),
  'motion.reducedPolicy': choice('instant', 'static', 'off'),
  'progress.enabled': bool,
  'progress.zeroRange': choice('hidden', 'read-only-zero'),
  'progress.format': shape({
    digits: num(1, 10, true),
    suffix: text,
    rounding: choice('nearest'),
  }),
  'progress.mapping': choice('document-strip', 'normalized'),
  'progress.trackGeometry': shape({
    width: length,
    height: either(length, choice('auto')),
    inset: edges,
  }),
  'progress.minorTicks': tick,
  'progress.majorTicks': tick,
  'progress.labelStyle': shape({
    font: fontReference,
    size: length,
    tracking: signedLength,
    color,
    placement: choice('start', 'end'),
  }),
  'progress.markerStyle': shape({
    thickness: length,
    color,
    glow: array(shadow, 0, 8),
    visible: bool,
  }),
  'progress.topMarker': choice('show', 'hide'),
  'progress.hitArea': shape({ width: length, height: length }),
  'progress.keyboardSteps': shape({
    arrow: num(0.000001, 100),
    page: num(0.000001, 100),
  }),
  'progress.narrowVariant': choice('compact', 'indicator', 'hidden'),
  'sectionNav.entries': array(shape({ id, targetId: id }, { label: text })),
  'sectionNav.order': array(id),
  'sectionNav.position': shape({
    mode: choice('fixed', 'sticky', 'flow'),
    inset: edges,
    width: length,
  }),
  'sectionNav.backing': shape({
    color,
    opacity: num(0, 1),
    blur: length,
    padding,
  }),
  'sectionNav.currentRule': shape({
    offset: length,
    tie: choice('last-crossed'),
  }),
  'sectionNav.seekOffset': length,
  'sectionNav.history': choice('click-push-scroll-none'),
  'sectionNav.narrow': choice('disclosure', 'sheet', 'inline'),
  'skill.presentation': choice('grid', 'rows', 'grouped', 'chips'),
  'skill.contextGrouping': array(
    choice('experience', 'education', 'project', 'credential'),
    0,
    4,
  ),
  'skill.detailEntry': choice('route', 'panel'),
  'record.expansion': shape({
    expanded: bool,
    summaryLength: num(0, 100000, true),
  }),
  'record.narrowLayout': choice('stack', 'metadata-wrap', 'media-sequence'),
  'advanced.blendFilter': shape(
    {},
    {
      blend: choice(
        'normal',
        'multiply',
        'screen',
        'overlay',
        'darken',
        'lighten',
      ),
      blur: length,
      brightness: num(0, 100),
      saturation: num(0, 100),
      backdropBlur: length,
    },
  ),
  'advanced.clipMask': either(
    choice('none'),
    shape({ shape: choice('circle', 'ellipse', 'inset'), inset: padding }),
    mediaReference,
  ),
  'advanced.scrollPresentation': shape({
    margin: padding,
    padding,
    snap: choice('none', 'proximity', 'mandatory'),
    behavior: choice('auto', 'smooth'),
  }),
  'resume.printPresentation': shape({
    paper: choice('a4', 'letter'),
    margins: padding,
  }),
};

export const properties: Rule = (v, p, e) => {
  if (!plain(v)) return fail(e, p, 'Expected presentation property map');
  for (const [key, value] of Object.entries(v)) {
    if (!Object.hasOwn(literalProperties, key))
      fail(
        e,
        `${p}.${key}`,
        'Unknown presentation property',
        'unknown-property',
      );
    else
      either(tokenReference, literalProperties[key])(value, `${p}.${key}`, e);
  }
};
