import type { Values } from '../design/model';
import type { Json } from '../design/schema';
function channels(value: Json | undefined): number[] | undefined {
  if (typeof value === 'string' && /^#[\da-f]{3,8}$/i.test(value)) {
    let hex = value.slice(1);
    if (hex.length === 3 || hex.length === 4)
      hex = [...hex].map((x) => x + x).join('');
    if (hex.length !== 6 && hex.length !== 8) return;
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
      hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1,
    ];
  }
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'r' in value
  )
    return [Number(value.r), Number(value.g), Number(value.b), Number(value.a)];
}
function luminance(rgb: number[]) {
  return rgb
    .slice(0, 3)
    .map((x) => x / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
    .reduce((n, x, i) => n + x * [0.2126, 0.7152, 0.0722][i], 0);
}
export function contrastWarnings(values: Values): string[] {
  const bg = channels(values['background.color']);
  if (!bg || bg[3] !== 1)
    return [
      'Contrast needs visual review: background is transparent, inherited or composited.',
    ];
  const warnings: string[] = [];
  for (const key of [
    'text.color',
    'text.mutedColor',
    'link.color',
    'accent.color',
  ]) {
    const fg = channels(values[key]);
    if (!fg) continue;
    const blended = fg
      .slice(0, 3)
      .map((x, i) => x * fg[3] + bg[i] * (1 - fg[3]));
    const a = luminance(blended),
      b = luminance(bg),
      ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (ratio < 4.5)
      warnings.push(
        `${key} against background.color: ${ratio.toFixed(2)}:1. Increase foreground/background separation for ordinary text (4.5:1).`,
      );
  }
  if (
    values['background.image'] ||
    (values['background.gradient'] && values['background.gradient'] !== 'none')
  )
    warnings.push(
      'Image or gradient background: check contrast across every text position in the route preview.',
    );
  return warnings;
}
