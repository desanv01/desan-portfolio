import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_owner_state_kind" AS ENUM('schedule', 'preview');
  CREATE TYPE "public"."enum_owner_state_status" AS ENUM('pending', 'completed', 'conflict', 'failed', 'cancelled', 'ready');
  CREATE TABLE "owner_state" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "kind" "enum_owner_state_kind" NOT NULL,
    "status" "enum_owner_state_status" NOT NULL,
    "run_at" timestamp(3) with time zone NOT NULL,
    "value" jsonb NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "owner_state_id" integer;
  CREATE UNIQUE INDEX "owner_state_key_idx" ON "owner_state" USING btree ("key");
  CREATE INDEX "owner_state_run_at_idx" ON "owner_state" USING btree ("run_at");
  CREATE INDEX "owner_state_updated_at_idx" ON "owner_state" USING btree ("updated_at");
  CREATE INDEX "owner_state_created_at_idx" ON "owner_state" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_owner_state_fk" FOREIGN KEY ("owner_state_id") REFERENCES "public"."owner_state"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_owner_state_id_idx" ON "payload_locked_documents_rels" USING btree ("owner_state_id");`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_owner_state_fk";

  DROP INDEX "payload_locked_documents_rels_owner_state_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "owner_state_id";
  DROP TABLE "owner_state";
  DROP TYPE "public"."enum_owner_state_kind";
  DROP TYPE "public"."enum_owner_state_status";`);
}
