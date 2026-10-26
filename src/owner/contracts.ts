import type {
  Publication,
  PublicationInput,
  Selection,
} from '../cms/publication';

export type FieldDescriptor = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  readOnly?: boolean;
  fields?: FieldDescriptor[];
  options?: { label: string; value: string }[];
  relationTo?: string | string[];
  hasMany?: boolean;
};
export type OwnerRecord = {
  id: string | number;
  data: Record<string, unknown>;
  revision: string;
  versionId: number | null;
};
export type OwnerPage<T> = {
  docs: T[];
  totalDocs: number;
  page: number;
  totalPages: number;
};
export type OwnerVersion = {
  id: number;
  createdAt: string;
  data: Record<string, unknown>;
};
export type Workspace = {
  limits: { mediaBytes: number; requestBytes: number };
  collections: { slug: string; label: string; fields: FieldDescriptor[] }[];
  publication: {
    revision: string;
    designVersionId: number;
    designRecordId?: string | number;
    designTitle?: string;
    selections: (Selection & { recordId?: string | number; title?: string })[];
  } | null;
  scheduler: {
    lastSeenAt: string | null;
    running: boolean;
    mode: 'managed' | 'local';
    configured: boolean;
    lastActualDelivery: string | null;
  };
};
export type ScheduleStatus =
  'pending' | 'completed' | 'conflict' | 'failed' | 'cancelled';
export type Schedule = {
  id: string | number;
  revision: string;
  status: ScheduleStatus;
  runAt: string;
  input: PublicationInput;
  attempts: number;
  error: string | null;
  completedRevision?: string;
};
export type PreviewReceipt = { id: string; publication: Publication };
export type RecoveryFieldChange = {
  path: string;
  label: string;
  before: string;
  after: string;
  truncated: boolean;
};
export type RecoveryPlan = {
  applied: boolean;
  changes: {
    collection: string;
    id: string | number;
    title: string;
    expectedRevision: string;
    changedFields: RecoveryFieldChange[];
  }[];
  expectedRevisions: Record<string, string>;
  warnings: string[];
};
