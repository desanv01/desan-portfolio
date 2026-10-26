import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_owner_state_kind" ADD VALUE 'worker';`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DELETE FROM "owner_state" WHERE "kind" = 'worker';
  ALTER TABLE "owner_state" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_owner_state_kind";
  CREATE TYPE "public"."enum_owner_state_kind" AS ENUM('schedule', 'preview');
  ALTER TABLE "owner_state" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_owner_state_kind" USING "kind"::"public"."enum_owner_state_kind";`);
}
