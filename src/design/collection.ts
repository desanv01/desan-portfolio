import type { CollectionConfig } from 'payload';
import { isOwner } from '../cms/access';
import {
  assertValidDesign,
  validateDesign,
  DESIGN_SCHEMA_VERSION,
} from './model';

/** Raw design revisions are private. Public consumers receive a pinned publication snapshot. */
export const designCollection: CollectionConfig = {
  slug: 'design-themes',
  admin: { useAsTitle: 'title' },
  access: {
    create: isOwner,
    read: isOwner,
    update: isOwner,
    delete: () => false,
    readVersions: isOwner,
  },
  // Publication/restore pins exact version IDs. Do not prune or delete their history.
  versions: { drafts: true, maxPerDoc: 0 },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'schemaVersion',
      type: 'number',
      required: true,
      defaultValue: DESIGN_SCHEMA_VERSION,
      admin: { readOnly: true },
    },
    {
      name: 'data',
      type: 'json',
      required: true,
      validate: (value: unknown) => {
        const result = validateDesign(value);
        return (
          result.valid ||
          result.errors
            .map((error) => `${error.path}: ${error.message}`)
            .join('; ')
        );
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && Object.hasOwn(data, 'data'))
          data.data = assertValidDesign(data.data);
        if (data) data.schemaVersion = DESIGN_SCHEMA_VERSION;
        return data;
      },
    ],
  },
};
