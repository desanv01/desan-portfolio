import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_context_links_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__context_links_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "context_links_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar
  );
  
  CREATE TABLE "context_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_key" varchar,
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"body" jsonb,
  	"visible" boolean DEFAULT false,
  	"sort_order" numeric DEFAULT 0,
  	"featured" boolean DEFAULT false,
  	"private_notes" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"project_id" integer,
  	"target_role_key" varchar,
  	"kind" varchar,
  	"context" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_context_links_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "context_links_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"education_id" integer,
  	"experiences_id" integer
  );
  
  CREATE TABLE "_context_links_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_context_links_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_source_key" varchar,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_body" jsonb,
  	"version_visible" boolean DEFAULT false,
  	"version_sort_order" numeric DEFAULT 0,
  	"version_featured" boolean DEFAULT false,
  	"version_private_notes" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_project_id" integer,
  	"version_target_role_key" varchar,
  	"version_kind" varchar,
  	"version_context" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__context_links_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_context_links_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"education_id" integer,
  	"experiences_id" integer
  );
  
  ALTER TABLE "experiences_roles" ADD COLUMN "role_key" varchar;
  ALTER TABLE "_experiences_v_version_roles" ADD COLUMN "role_key" varchar;
  ALTER TABLE "posts" ADD COLUMN "editorial_date" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_editorial_date" varchar;
  ALTER TABLE "associations" ADD COLUMN "target_role_key" varchar;
  ALTER TABLE "_associations_v" ADD COLUMN "version_target_role_key" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "context_links_id" integer;
  ALTER TABLE "context_links_sources" ADD CONSTRAINT "context_links_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."context_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "context_links" ADD CONSTRAINT "context_links_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "context_links" ADD CONSTRAINT "context_links_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "context_links_rels" ADD CONSTRAINT "context_links_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."context_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "context_links_rels" ADD CONSTRAINT "context_links_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "context_links_rels" ADD CONSTRAINT "context_links_rels_education_fk" FOREIGN KEY ("education_id") REFERENCES "public"."education"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "context_links_rels" ADD CONSTRAINT "context_links_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_context_links_v_version_sources" ADD CONSTRAINT "_context_links_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_context_links_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_context_links_v" ADD CONSTRAINT "_context_links_v_parent_id_context_links_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."context_links"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_context_links_v" ADD CONSTRAINT "_context_links_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_context_links_v" ADD CONSTRAINT "_context_links_v_version_project_id_projects_id_fk" FOREIGN KEY ("version_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_context_links_v_rels" ADD CONSTRAINT "_context_links_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_context_links_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_context_links_v_rels" ADD CONSTRAINT "_context_links_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_context_links_v_rels" ADD CONSTRAINT "_context_links_v_rels_education_fk" FOREIGN KEY ("education_id") REFERENCES "public"."education"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_context_links_v_rels" ADD CONSTRAINT "_context_links_v_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "context_links_sources_order_idx" ON "context_links_sources" USING btree ("_order");
  CREATE INDEX "context_links_sources_parent_id_idx" ON "context_links_sources" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "context_links_slug_idx" ON "context_links" USING btree ("slug");
  CREATE INDEX "context_links_seo_seo_image_idx" ON "context_links" USING btree ("seo_image_id");
  CREATE INDEX "context_links_project_idx" ON "context_links" USING btree ("project_id");
  CREATE INDEX "context_links_updated_at_idx" ON "context_links" USING btree ("updated_at");
  CREATE INDEX "context_links_created_at_idx" ON "context_links" USING btree ("created_at");
  CREATE INDEX "context_links__status_idx" ON "context_links" USING btree ("_status");
  CREATE INDEX "context_links_rels_order_idx" ON "context_links_rels" USING btree ("order");
  CREATE INDEX "context_links_rels_parent_idx" ON "context_links_rels" USING btree ("parent_id");
  CREATE INDEX "context_links_rels_path_idx" ON "context_links_rels" USING btree ("path");
  CREATE INDEX "context_links_rels_media_id_idx" ON "context_links_rels" USING btree ("media_id");
  CREATE INDEX "context_links_rels_education_id_idx" ON "context_links_rels" USING btree ("education_id");
  CREATE INDEX "context_links_rels_experiences_id_idx" ON "context_links_rels" USING btree ("experiences_id");
  CREATE INDEX "_context_links_v_version_sources_order_idx" ON "_context_links_v_version_sources" USING btree ("_order");
  CREATE INDEX "_context_links_v_version_sources_parent_id_idx" ON "_context_links_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_context_links_v_parent_idx" ON "_context_links_v" USING btree ("parent_id");
  CREATE INDEX "_context_links_v_version_version_slug_idx" ON "_context_links_v" USING btree ("version_slug");
  CREATE INDEX "_context_links_v_version_seo_version_seo_image_idx" ON "_context_links_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_context_links_v_version_version_project_idx" ON "_context_links_v" USING btree ("version_project_id");
  CREATE INDEX "_context_links_v_version_version_updated_at_idx" ON "_context_links_v" USING btree ("version_updated_at");
  CREATE INDEX "_context_links_v_version_version_created_at_idx" ON "_context_links_v" USING btree ("version_created_at");
  CREATE INDEX "_context_links_v_version_version__status_idx" ON "_context_links_v" USING btree ("version__status");
  CREATE INDEX "_context_links_v_created_at_idx" ON "_context_links_v" USING btree ("created_at");
  CREATE INDEX "_context_links_v_updated_at_idx" ON "_context_links_v" USING btree ("updated_at");
  CREATE INDEX "_context_links_v_latest_idx" ON "_context_links_v" USING btree ("latest");
  CREATE INDEX "_context_links_v_rels_order_idx" ON "_context_links_v_rels" USING btree ("order");
  CREATE INDEX "_context_links_v_rels_parent_idx" ON "_context_links_v_rels" USING btree ("parent_id");
  CREATE INDEX "_context_links_v_rels_path_idx" ON "_context_links_v_rels" USING btree ("path");
  CREATE INDEX "_context_links_v_rels_media_id_idx" ON "_context_links_v_rels" USING btree ("media_id");
  CREATE INDEX "_context_links_v_rels_education_id_idx" ON "_context_links_v_rels" USING btree ("education_id");
  CREATE INDEX "_context_links_v_rels_experiences_id_idx" ON "_context_links_v_rels" USING btree ("experiences_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_context_links_fk" FOREIGN KEY ("context_links_id") REFERENCES "public"."context_links"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_context_links_id_idx" ON "payload_locked_documents_rels" USING btree ("context_links_id");`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "context_links_sources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "context_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "context_links_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_context_links_v_version_sources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_context_links_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_context_links_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "context_links_sources" CASCADE;
  DROP TABLE "context_links" CASCADE;
  DROP TABLE "context_links_rels" CASCADE;
  DROP TABLE "_context_links_v_version_sources" CASCADE;
  DROP TABLE "_context_links_v" CASCADE;
  DROP TABLE "_context_links_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_context_links_fk";
  
  DROP INDEX "payload_locked_documents_rels_context_links_id_idx";
  ALTER TABLE "experiences_roles" DROP COLUMN "role_key";
  ALTER TABLE "_experiences_v_version_roles" DROP COLUMN "role_key";
  ALTER TABLE "posts" DROP COLUMN "editorial_date";
  ALTER TABLE "_posts_v" DROP COLUMN "version_editorial_date";
  ALTER TABLE "associations" DROP COLUMN "target_role_key";
  ALTER TABLE "_associations_v" DROP COLUMN "version_target_role_key";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "context_links_id";
  DROP TYPE "public"."enum_context_links_status";
  DROP TYPE "public"."enum__context_links_v_version_status";`);
}
