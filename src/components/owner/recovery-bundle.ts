/** History remains in the original export; the editing API restores current drafts only. */
export function draftRecoveryBundle(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Choose a recovery export.');
  const input = value as Record<string, unknown>;
  if (
    input.format !== 'desan-owner-recovery' ||
    input.schemaVersion !== 1 ||
    !input.collections ||
    typeof input.collections !== 'object' ||
    Array.isArray(input.collections)
  )
    throw new Error('Choose a Desan recovery export.');
  return {
    format: input.format,
    schemaVersion: input.schemaVersion,
    instanceId: input.instanceId,
    collections: Object.fromEntries(
      Object.entries(input.collections).map(([name, value]) => {
        if (
          !value ||
          typeof value !== 'object' ||
          !Array.isArray((value as { docs?: unknown }).docs)
        )
          throw new Error('Invalid recovery collection.');
        return [name, { docs: (value as { docs: unknown[] }).docs }];
      }),
    ),
  };
}
