import type { Json } from '../design/schema';

/** Data-only inspector vocabulary. Never interprets application code or CSS. */
export type Control =
  | { kind: 'number'; min: number; max: number; integer: boolean }
  | { kind: 'text' }
  | { kind: 'id' }
  | { kind: 'color' }
  | { kind: 'boolean' }
  | { kind: 'choice'; options: (string | number | boolean)[] }
  | {
      kind: 'object';
      required: Record<string, Control>;
      optional: Record<string, Control>;
    }
  | { kind: 'array'; item: Control; min: number; max: number }
  | { kind: 'map'; key: Control; item: Control; max: number }
  | { kind: 'union'; options: Control[] };

export function initialValue(control: Control): Json {
  switch (control.kind) {
    case 'number':
      return Math.max(control.min, Math.min(control.max, 0));
    case 'boolean':
      return true;
    case 'color':
      return '#ffffff';
    case 'id':
      return 'item';
    case 'text':
      return '';
    case 'choice':
      return control.options[0];
    case 'object':
      return Object.fromEntries(
        Object.entries(control.required).map(([k, v]) => [k, initialValue(v)]),
      );
    case 'array':
      return Array.from({ length: control.min }, () =>
        initialValue(control.item),
      );
    case 'map':
      return {};
    case 'union':
      return initialValue(control.options[0]);
  }
}

export function matchesControl(c: Control, v: Json | undefined): boolean {
  switch (c.kind) {
    case 'number':
      return typeof v === 'number';
    case 'boolean':
      return typeof v === 'boolean';
    case 'text':
    case 'id':
      return typeof v === 'string';
    case 'color':
      return (
        typeof v === 'string' ||
        (!!v && typeof v === 'object' && !Array.isArray(v) && 'r' in v)
      );
    case 'choice':
      return c.options.includes(v as string);
    case 'array':
      return Array.isArray(v);
    case 'map':
      return !!v && typeof v === 'object' && !Array.isArray(v);
    case 'object':
      return (
        !!v &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        Object.keys(c.required).every((k) => k in v)
      );
    case 'union':
      return c.options.some((x) => matchesControl(x, v));
  }
}

export function controlLabel(c: Control): string {
  if (c.kind === 'choice') return c.options.join(' / ');
  if (c.kind === 'object')
    return (
      Object.keys(c.required).join(' + ') || Object.keys(c.optional).join(' / ')
    );
  if (c.kind === 'array') return 'List';
  if (c.kind === 'union') return 'Alternative';
  return c.kind;
}
