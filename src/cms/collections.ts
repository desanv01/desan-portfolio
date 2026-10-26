import type { CollectionConfig, Field } from 'payload';
import { APIError } from 'payload';
import { isOwner, never, bootstrapCapability } from './access';
import { ensureRecoveryAvailable } from './email';
import { SafeValidationError } from './validation';

const ownerAccess = {
  create: isOwner,
  read: isOwner,
  update: isOwner,
  delete: never,
  readVersions: isOwner,
};
const text = (name: string, required = false): Field => ({
  name,
  type: 'text',
  required,
});
const relation = (
  name: string,
  relationTo: string | string[],
  hasMany = true,
): Field => ({ name, type: 'relationship', relationTo, hasMany }) as Field;
const dateFields: Field[] = [
  { name: 'start', type: 'text', validate: precisionDate },
  { name: 'end', type: 'text', validate: precisionDate },
  { name: 'current', type: 'checkbox', defaultValue: false },
];
const optionalDate = (name: string): Field => ({
  name,
  type: 'text',
  validate: precisionDate,
});
function precisionDate(value: unknown): true | string {
  return !value ||
    (typeof value === 'string' && /^\d{4}(-(0[1-9]|1[0-2]))?$/.test(value))
    ? true
    : 'Use YYYY or YYYY-MM; do not invent a day';
}
function reversed(start: string, end: string): boolean {
  return (
    `${start.length === 4 ? `${start}-01` : start}` >
    `${end.length === 4 ? `${end}-12` : end}`
  );
}
function editorialDate(value: unknown): true | string {
  if (!value) return true;
  if (
    typeof value !== 'string' ||
    !/^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12][0-9]|3[01]))?)?$/.test(value)
  )
    return 'Use the actual known YYYY, YYYY-MM or YYYY-MM-DD';
  if (
    value.length === 10 &&
    (Number.isNaN(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value)
  )
    return 'Invalid calendar day';
  return true;
}
const common: Field[] = [
  text('sourceKey', true),
  text('title', true),
  {
    name: 'slug',
    type: 'text',
    unique: true,
    required: true,
    validate: (v: unknown) =>
      typeof v === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)
        ? true
        : 'Use a safe lowercase slug',
  },
  { name: 'summary', type: 'textarea' },
  { name: 'body', type: 'richText' },
  { name: 'visible', type: 'checkbox', defaultValue: false },
  { name: 'sortOrder', type: 'number', defaultValue: 0 },
  { name: 'featured', type: 'checkbox', defaultValue: false },
  {
    name: 'featuredOrder',
    type: 'number',
    min: 0,
    defaultValue: 0,
    admin: { step: 1 },
  },
  { name: 'privateNotes', type: 'textarea' },
  {
    name: 'sources',
    type: 'array',
    fields: [
      text('url'),
      text('observedAt'),
      text('confidence'),
      text('context'),
    ],
  },
  {
    name: 'seo',
    type: 'group',
    fields: [
      text('title'),
      text('description'),
      relation('image', 'media', false),
    ],
  },
  relation('media', 'media'),
];
function content(slug: string, fields: Field[]): CollectionConfig {
  return {
    slug,
    access: ownerAccess,
    admin: { useAsTitle: 'title' },
    versions: { drafts: { validate: true }, maxPerDoc: 0 },
    fields: [...common, ...fields],
    hooks: {
      beforeValidate: [
        ({ data, originalDoc }) => {
          if (data && ['associations', 'context-links'].includes(slug)) {
            const merged = { ...originalDoc, ...data };
            const relationId = (v: unknown) =>
              typeof v === 'object' && v !== null && 'id' in v ? v.id : v;
            if (merged.target)
              data.edgeKey = JSON.stringify([
                slug === 'associations'
                  ? relationId(merged.skill)
                  : relationId(merged.project),
                merged.target.relationTo,
                relationId(merged.target.value),
                merged.targetRoleKey || '',
                merged.kind || '',
              ]);
          }
          const effective = { ...originalDoc, ...data };
          if (effective.current && effective.end)
            throw new SafeValidationError(
              'Current records cannot have an end date. Clear End or uncheck Current.',
              ['end', 'current'],
            );
          if (
            effective.start &&
            effective.end &&
            reversed(effective.start, effective.end)
          )
            throw new SafeValidationError(
              'End date precedes start date. Review Start and End.',
              ['start', 'end'],
            );
          const roleKeys = new Set<string>();
          for (const [index, patch] of (effective.roles || []).entries()) {
            const previous = originalDoc?.roles?.find(
              (role: { id?: string; roleKey?: string }) =>
                (patch.id && role.id === patch.id) ||
                (patch.roleKey && role.roleKey === patch.roleKey),
            );
            const role = { ...previous, ...patch };
            if (
              typeof role.roleKey !== 'string' ||
              !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(role.roleKey) ||
              roleKeys.has(role.roleKey)
            )
              throw new SafeValidationError(
                'Role keys must be safe, stable and unique within their group',
                [`roles.${index}.roleKey`],
              );
            roleKeys.add(role.roleKey);
            if (role.current && role.end)
              throw new SafeValidationError(
                'Current roles cannot have an end date. Clear End or uncheck Current.',
                [`roles.${index}.end`, `roles.${index}.current`],
              );
            if (role.start && role.end && reversed(role.start, role.end))
              throw new SafeValidationError(
                'Role end date precedes start date. Review the role dates.',
                [`roles.${index}.start`, `roles.${index}.end`],
              );
          }
          return data;
        },
      ],
    },
  };
}

export const owners: CollectionConfig = {
  slug: 'owners',
  auth: {
    tokenExpiration: 3600,
    maxLoginAttempts: 5,
    lockTime: 600000,
    useSessions: true,
    forgotPassword: {
      generateEmailHTML: ({ token } = {}) => {
        const url = new URL(
          '/owner/reset',
          process.env.CMS_SERVER_URL || 'http://127.0.0.1:3000',
        );
        url.searchParams.set('token', token || '');
        return `<p>A password reset was requested for the owner workspace.</p><p><a href="${url.href.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}">Reset owner password</a></p><p>If you did not request this, ignore this message.</p>`;
      },
    },
  },
  admin: { useAsTitle: 'email' },
  access: {
    create: never,
    read: isOwner,
    update: isOwner,
    delete: never,
    admin: ({ req }) => req.user?.role === 'owner',
  },
  fields: [
    {
      name: 'singleton',
      type: 'number',
      unique: true,
      required: true,
      defaultValue: 1,
      access: { update: () => false },
      validate: (v: unknown) =>
        v === 1 ? true : 'Only one owner is permitted',
    },
    {
      name: 'role',
      type: 'select',
      options: ['owner', 'disabled'],
      defaultValue: 'owner',
      required: true,
      access: { create: () => false, update: () => false },
    },
  ],
  hooks: {
    beforeOperation: [
      async ({ operation, req, args }) => {
        if (
          operation === 'create' &&
          req.context.bootstrap !== bootstrapCapability
        )
          throw new APIError(
            'Only the local bootstrap CLI can create the owner',
            403,
          );
        if (
          'data' in args &&
          args.data &&
          'password' in args.data &&
          typeof args.data.password === 'string' &&
          args.data.password.length < 16
        )
          throw new APIError(
            'Owner passwords require at least 16 characters',
            400,
          );
        if (operation === 'forgotPassword') await ensureRecoveryAvailable();
      },
    ],
  },
};

export const contentCollections: CollectionConfig[] = [
  content('skills', [
    text('canonicalName', true),
    text('category'),
    { name: 'aliases', type: 'array', fields: [text('name', true)] },
  ]),
  content('experiences', [
    text('organization', true),
    text('organizationURL'),
    relation('logo', 'media', false),
    {
      name: 'roles',
      type: 'array',
      required: true,
      fields: [
        text('roleKey', true),
        text('role', true),
        text('employmentType'),
        text('location'),
        text('locationType'),
        ...dateFields,
        { name: 'responsibilities', type: 'textarea' },
        { name: 'outcomes', type: 'textarea' },
        text('contribution'),
        { name: 'hidden', type: 'checkbox' },
      ],
    },
  ]),
  content('education', [
    text('institution', true),
    text('qualification'),
    text('fieldOfStudy'),
    ...dateFields,
    text('completionStatus'),
    text('grade'),
    { name: 'showGrade', type: 'checkbox', defaultValue: false },
    { name: 'activities', type: 'textarea' },
    { name: 'coursework', type: 'textarea' },
    relation('credentials', 'professional-sections'),
  ]),
  content('projects', [
    text('discipline'),
    text('role'),
    text('workStatus'),
    ...dateFields,
    { name: 'collaborators', type: 'textarea' },
    ...[
      'problem',
      'contribution',
      'approach',
      'architecture',
      'results',
      'limitations',
      'lineage',
      'credits',
    ].map((name): Field => ({ name, type: 'textarea' })),
    { name: 'links', type: 'array', fields: [text('label'), text('url')] },
  ]),
  content('posts', [
    {
      name: 'kind',
      type: 'select',
      options: ['update', 'article', 'build-log', 'milestone'],
    },
    {
      name: 'editorialDate',
      type: 'text',
      validate: editorialDate,
    },
    relation('projects', 'projects'),
    { name: 'categories', type: 'array', fields: [text('name')] },
  ]),
  content('profile', [
    text('displayName'),
    text('headline'),
    text('region'),
    text('availability'),
    { name: 'links', type: 'array', fields: [text('label'), text('url')] },
    {
      name: 'contact',
      type: 'array',
      fields: [
        text('label'),
        text('value'),
        { name: 'public', type: 'checkbox', defaultValue: false },
      ],
    },
    relation('resume', 'media', false),
  ]),
  content('professional-sections', [
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        'credential',
        'course',
        'award',
        'volunteering',
        'publication',
        'patent',
        'test-score',
        'language',
        'organization',
        'cause',
        'career-break',
        'service',
        'featured',
        'testimonial',
      ],
    },
    text('issuer'),
    text('organization'),
    text('role'),
    ...dateFields,
    optionalDate('issueDate'),
    optionalDate('expiryDate'),
    { name: 'noExpiry', type: 'checkbox' },
    text('credentialId'),
    { name: 'showCredentialId', type: 'checkbox', defaultValue: false },
    text('url'),
    text('provider'),
    text('courseCode'),
    text('completionStatus'),
    text('authors'),
    text('contribution'),
    text('publisher'),
    text('identifier'),
    text('jurisdiction'),
    text('patentStatus'),
    text('result'),
    text('scale'),
    text('proficiency'),
    text('cause'),
    text('scope'),
    text('deliveryMode'),
    text('price'),
    { name: 'showPrice', type: 'checkbox', defaultValue: false },
    { name: 'quote', type: 'textarea' },
    text('author'),
    text('relationship'),
    { name: 'consentReceipt', type: 'textarea' },
    { name: 'consentToPublish', type: 'checkbox', defaultValue: false },
    relation('related', ['projects', 'education', 'experiences', 'skills']),
  ]),
  content('associations', [
    { name: 'edgeKey', type: 'text', unique: true, admin: { readOnly: true } },
    relation('skill', 'skills', false),
    relation(
      'target',
      ['projects', 'education', 'experiences', 'professional-sections'],
      false,
    ),
    text('targetRoleKey'),
    text('kind'),
    text('context'),
    { name: 'ownerProposed', type: 'checkbox' },
  ]),
  content('context-links', [
    { name: 'edgeKey', type: 'text', unique: true, admin: { readOnly: true } },
    relation('project', 'projects', false),
    relation('target', ['education', 'experiences'], false),
    text('targetRoleKey'),
    text('kind'),
    text('context'),
  ]),
  content('site-settings', [
    {
      name: 'navigation',
      type: 'array',
      fields: [text('label'), text('path')],
    },
    { name: 'footer', type: 'textarea' },
    { name: 'sectionOrder', type: 'array', fields: [text('section')] },
    relation('resume', 'media', false),
  ]),
];

export const snapshots: CollectionConfig = {
  slug: 'publication-snapshots',
  access: { create: never, read: isOwner, update: never, delete: never },
  fields: [
    text('revision', true),
    { name: 'payload', type: 'json', required: true },
    { name: 'mediaIds', type: 'json', required: true },
  ],
};
export const publicationState: CollectionConfig = {
  slug: 'publication-state',
  access: { create: never, read: isOwner, update: never, delete: never },
  fields: [
    { name: 'singleton', type: 'number', unique: true, required: true },
    text('revision', true),
    relation('snapshot', 'publication-snapshots', false),
  ],
};
