import type { FieldDescriptor, RecoveryFieldChange } from './contracts';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}
function summary(value: unknown) {
  const text =
    value === undefined
      ? '(not set)'
      : value === null
        ? '(empty)'
        : typeof value === 'string'
          ? value
          : typeof value === 'boolean'
            ? value
              ? 'Yes'
              : 'No'
            : JSON.stringify(value, null, 2);
  return {
    text: text.length > 800 ? `${text.slice(0, 800)}…` : text,
    truncated: text.length > 800,
  };
}
const names: Record<string, string> = {
  visible: 'Eligible for publication',
  publicEligible: 'Rights allow public use',
  sourceKey: 'Source reference',
  privateNotes: 'Private editorial notes',
  consentReceipt: 'Private permission record',
  consentToPublish: 'Permission to publish',
  body: 'Article / description blocks',
  sortOrder: 'Display order',
};

/** Call only inside the owner boundary, on editable data. Values are plain text
 * for React text rendering, not HTML; large nested fields have explicit limits. */
export function recoveryFieldChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: FieldDescriptor[],
): RecoveryFieldChange[] {
  return fields
    .filter((field) => !field.readOnly)
    .flatMap((field) => {
      if (
        JSON.stringify(canonical(before[field.name])) ===
        JSON.stringify(canonical(after[field.name]))
      )
        return [];
      const previous = summary(before[field.name]),
        next = summary(after[field.name]);
      const rawLabel = field.label || field.name;
      const label =
        names[field.name] ||
        rawLabel
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/^./, (letter) => letter.toUpperCase());
      return [
        {
          path: field.name,
          label,
          before: previous.text,
          after: next.text,
          truncated: previous.truncated || next.truncated,
        },
      ];
    });
}
