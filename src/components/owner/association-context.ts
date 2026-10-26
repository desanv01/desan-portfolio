export function parseContext(raw: string | null) {
  const match =
    /^(skills|projects|experiences|education|professional-sections):(\d+)$/.exec(
      raw || '',
    );
  return match ? { collection: match[1], id: match[2] } : null;
}
export function associationDefaults(
  collection: string,
  raw: string | null,
): Record<string, unknown> {
  const context = parseContext(raw);
  if (!context || !['associations', 'context-links'].includes(collection))
    return {};
  if (collection === 'associations' && context.collection === 'skills')
    return { skill: context.id };
  if (collection === 'context-links' && context.collection === 'projects')
    return { project: context.id };
  if (
    context.collection !== 'skills' &&
    !(
      collection === 'context-links' &&
      context.collection === 'professional-sections'
    )
  )
    return { target: { relationTo: context.collection, value: context.id } };
  return {};
}
export function matchesContext(
  collection: string,
  data: Record<string, unknown>,
  raw: string | null,
) {
  const expected = associationDefaults(collection, raw);
  const id = (value: unknown): string =>
    String(
      value && typeof value === 'object'
        ? (value as { id?: unknown }).id
        : value,
    );
  return Object.entries(expected).every(([key, value]) => {
    if (key === 'target') {
      const actual = data.target as
        { relationTo?: string; value?: unknown } | undefined;
      const target = value as { relationTo: string; value: string };
      return (
        actual?.relationTo === target.relationTo &&
        id(actual.value) === target.value
      );
    }
    return id(data[key]) === id(value);
  });
}
