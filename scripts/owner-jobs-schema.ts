import { getPayload } from 'payload';
import config from '../src/cms/config';

const payload = await getPayload({ config });
try {
  if (process.argv[2] === 'create-migration')
    await payload.db.createMigration({
      payload,
      migrationName: process.argv[3] || 'phase5_owner_workspace',
    });
  else if (process.argv[2] === 'migrate') await payload.db.migrate();
  else throw new Error('Usage: owner-jobs-schema.ts create-migration|migrate');
} finally {
  await payload.destroy();
}
process.exit(0);
