import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import sharp from 'sharp';
import { resolve } from 'node:path';
import {
  owners,
  contentCollections,
  snapshots,
  publicationState,
} from './collections';
import { media } from './media';
import { localRecoveryEmail } from './email';
import { designCollection } from '../design/collection';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { ownerState } from './owner-state';

if (!process.env.PAYLOAD_SECRET || process.env.PAYLOAD_SECRET.length < 32)
  throw new Error('PAYLOAD_SECRET must be at least 32 characters');
if (!process.env.DATABASE_URI) throw new Error('DATABASE_URI is required');

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET,
  serverURL: process.env.CMS_SERVER_URL || 'http://127.0.0.1:3000',
  admin: {
    user: 'owners',
    importMap: { baseDir: resolve(/*turbopackIgnore: true*/ '.') },
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    push: false,
    migrationDir: resolve('src/cms/migrations'),
  }),
  sharp,
  email: localRecoveryEmail,
  editor: lexicalEditor(),
  graphQL: { disable: true },
  collections: [
    owners,
    media,
    ...contentCollections,
    designCollection,
    snapshots,
    publicationState,
    ownerState,
  ],
  typescript: { outputFile: resolve('src/cms/payload-types.ts') },
  upload: { limits: { fileSize: 10 * 1024 * 1024 } },
});
