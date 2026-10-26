import { getPayload } from 'payload';
import config from '../src/cms/config';
import { bootstrapCapability } from '../src/cms/access';

const payload = await getPayload({ config });
try {
  const command = process.argv[2];
  if (command === 'migrate') await payload.db.migrate();
  else if (command === 'status') await payload.db.migrateStatus();
  else if (command === 'create-migration')
    await payload.db.createMigration({
      payload,
      migrationName: 'phase3_foundation',
    });
  else if (command === 'bootstrap') {
    if (
      !process.argv.includes('--bootstrap') ||
      !process.env.OWNER_EMAIL ||
      !process.env.OWNER_PASSWORD ||
      process.env.OWNER_PASSWORD.length < 16
    )
      throw new Error(
        'Explicit --bootstrap and OWNER_EMAIL/OWNER_PASSWORD(16+ chars) required',
      );
    const existing = await payload.count({
      collection: 'owners',
      overrideAccess: true,
    });
    if (existing.totalDocs)
      throw new Error('Owner already exists; use password recovery');
    await payload.create({
      collection: 'owners',
      data: {
        email: process.env.OWNER_EMAIL,
        password: process.env.OWNER_PASSWORD,
        role: 'owner',
        singleton: 1,
      },
      context: { bootstrap: bootstrapCapability },
      overrideAccess: true,
    });
    console.log('Single owner created; no credentials printed');
  } else if (command === 'seed') {
    const sourceKey = 'synthetic-phase3-skill';
    const existing = await payload.find({
      collection: 'skills',
      where: { sourceKey: { equals: sourceKey } },
      overrideAccess: true,
    });
    if (!existing.docs.length)
      await payload.create({
        collection: 'skills',
        data: {
          sourceKey,
          title: 'Synthetic skill fixture',
          slug: 'synthetic-skill-fixture',
          canonicalName: 'Synthetic skill',
          visible: false,
          _status: 'draft',
        },
        draft: true,
        overrideAccess: true,
      });
    console.log('Synthetic draft seed ready; no personal records imported');
  } else throw new Error('Unknown backend CLI command');
} finally {
  await payload.destroy();
}
// Payload 3.92 holds its initial pool checkout; its own CLI also exits explicitly.
// Every database command above has completed/committed before this point.
process.exit(0);
