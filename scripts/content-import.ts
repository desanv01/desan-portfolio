import { readFile, writeFile } from 'node:fs/promises';
import { createLocalReq, getPayload } from 'payload';
import config from '../src/cms/config';
import { importReviewedContent } from '../src/cms/content-import';
const args = process.argv.slice(2);
const option = (name: string) => args[args.indexOf(name) + 1];
if (!args.includes('--input') || !args.includes('--report'))
  throw Error(
    'Use --input private-reviewed.json --report private-result.json [--apply]',
  );
const input = JSON.parse(await readFile(option('--input'), 'utf8'));
const payload = await getPayload({ config });
try {
  const owner = (
    await payload.find({
      collection: 'owners',
      where: { role: { equals: 'owner' } },
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0];
  if (!owner) throw Error('Bootstrap the owner before importing');
  const req = await createLocalReq(
    { user: { ...owner, collection: 'owners' } },
    payload,
  );
  const report = await importReviewedContent(
    payload,
    req,
    input,
    args.includes('--apply'),
  );
  await writeFile(option('--report'), JSON.stringify(report, null, 2), {
    mode: 0o600,
  });
  console.log(
    JSON.stringify({
      applied: report.applied,
      records: report.records.length,
      created: report.records.filter((record) => record.action === 'created')
        .length,
      preserved: report.records.filter(
        (record) => record.action === 'preserved',
      ).length,
    }),
  );
} finally {
  await payload.destroy();
}
process.exit(0);
