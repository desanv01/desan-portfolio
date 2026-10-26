import type { CollectionConfig } from 'payload';
import { never, requireOwner } from './access';

/** Internal durable jobs/preview receipts. Only the bounded owner service writes. */
export const ownerState: CollectionConfig = {
  slug: 'owner-state',
  admin: { hidden: true },
  access: { create: never, read: never, update: never, delete: never },
  hooks: {
    beforeChange: [
      ({ data, originalDoc, operation, req }) => {
        requireOwner(req);
        if (operation === 'update' && originalDoc?.kind === 'preview')
          throw new Error('Preview receipts are immutable');
        const next = { ...originalDoc, ...data };
        if (
          typeof next.key !== 'string' ||
          !/^[0-9a-f-]{36}$/.test(next.key) ||
          !['schedule', 'preview', 'worker'].includes(next.kind) ||
          JSON.stringify(next.value).length > 3 * 1024 * 1024
        )
          throw new Error('Invalid internal owner record');
        if (
          operation === 'update' &&
          originalDoc &&
          (next.key !== originalDoc.key ||
            next.kind !== originalDoc.kind ||
            next.runAt !== originalDoc.runAt ||
            JSON.stringify(next.value.input) !==
              JSON.stringify(originalDoc.value.input))
        )
          throw new Error(
            'Pinned owner record identity and selection are immutable',
          );
        if (next.kind === 'schedule') {
          const value = next.value;
          if (
            ![
              'pending',
              'completed',
              'failed',
              'conflict',
              'cancelled',
            ].includes(next.status) ||
            !Number.isSafeInteger(value?.attempts) ||
            value.attempts < 0 ||
            !value.input ||
            !Array.isArray(value.input.selections) ||
            value.input.selections.length > 500 ||
            !Number.isSafeInteger(value.input.designVersionId) ||
            !(
              value.input.expectedRevision === null ||
              typeof value.input.expectedRevision === 'string'
            )
          )
            throw new Error('Invalid schedule state');
        } else if (next.kind === 'worker') {
          if (
            next.status !== 'ready' ||
            typeof next.value?.lastSeenAt !== 'string' ||
            !Number.isFinite(Date.parse(next.value.lastSeenAt))
          )
            throw new Error('Invalid worker heartbeat');
        } else if (
          next.status !== 'ready' ||
          !next.value?.revision ||
          !Array.isArray(next.value?.selections) ||
          !Array.isArray(next.value?.media) ||
          !next.value?.content ||
          typeof next.value.content !== 'object'
        )
          throw new Error('Invalid preview receipt');
        return data;
      },
    ],
  },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: ['schedule', 'preview', 'worker'],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        'pending',
        'completed',
        'conflict',
        'failed',
        'cancelled',
        'ready',
      ],
    },
    { name: 'runAt', type: 'date', required: true, index: true },
    { name: 'value', type: 'json', required: true },
  ],
};
