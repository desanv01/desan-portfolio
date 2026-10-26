import type { PublicRecord } from '@/public-data';
import type { Values } from '@/design/model';

/** Apply owner order/limit to the complete eligible set before pagination. */
export function presentCollection(
  items: readonly PublicRecord[],
  config: Values,
): PublicRecord[] {
  const result = [...items];
  const order = config['collection.displayOrder'];
  if (order === 'title') result.sort((a, b) => a.title.localeCompare(b.title));
  if (order === 'date-ascending' || order === 'date-descending')
    result.sort(
      (a, b) =>
        String(a.editorialDate || a.publishedAt || '').localeCompare(
          String(b.editorialDate || b.publishedAt || ''),
        ) * (order === 'date-ascending' ? 1 : -1),
    );
  const limit = config['collection.limit'];
  return typeof limit === 'number' ? result.slice(0, limit) : result;
}
