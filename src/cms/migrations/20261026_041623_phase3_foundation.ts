import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "associations" ADD COLUMN "edge_key" varchar;
  ALTER TABLE "_associations_v" ADD COLUMN "version_edge_key" varchar;
  ALTER TABLE "context_links" ADD COLUMN "edge_key" varchar;
  ALTER TABLE "_context_links_v" ADD COLUMN "version_edge_key" varchar;
  CREATE UNIQUE INDEX "associations_edge_key_idx" ON "associations" USING btree ("edge_key");
  CREATE INDEX "_associations_v_version_version_edge_key_idx" ON "_associations_v" USING btree ("version_edge_key");
  CREATE UNIQUE INDEX "context_links_edge_key_idx" ON "context_links" USING btree ("edge_key");
  CREATE INDEX "_context_links_v_version_version_edge_key_idx" ON "_context_links_v" USING btree ("version_edge_key");`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "associations_edge_key_idx";
  DROP INDEX "_associations_v_version_version_edge_key_idx";
  DROP INDEX "context_links_edge_key_idx";
  DROP INDEX "_context_links_v_version_version_edge_key_idx";
  ALTER TABLE "associations" DROP COLUMN "edge_key";
  ALTER TABLE "_associations_v" DROP COLUMN "version_edge_key";
  ALTER TABLE "context_links" DROP COLUMN "edge_key";
  ALTER TABLE "_context_links_v" DROP COLUMN "version_edge_key";`);
}
