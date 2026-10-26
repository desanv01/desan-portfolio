import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "skills" ADD COLUMN "featured_order" numeric DEFAULT 0;
  ALTER TABLE "_skills_v" ADD COLUMN "version_featured_order" numeric DEFAULT 0;
  ALTER TABLE "experiences" ADD COLUMN "featured_order" numeric DEFAULT 0;
  ALTER TABLE "_experiences_v" ADD COLUMN "version_featured_order" numeric DEFAULT 0;
  ALTER TABLE "education" ADD COLUMN "featured_order" numeric DEFAULT 0;
  ALTER TABLE "_education_v" ADD COLUMN "version_featured_order" numeric DEFAULT 0;
  ALTER TABLE "projects" ADD COLUMN "featured_order" numeric DEFAULT 0;
  ALTER TABLE "_projects_v" ADD COLUMN "version_featured_order" numeric DEFAULT 0;
  ALTER TABLE "posts" ADD COLUMN "featured_order" numeric DEFAULT 0;
  ALTER TABLE "_posts_v" ADD COLUMN "version_featured_order" numeric DEFAULT 0;
  ALTER TABLE "profile" ADD COLUMN "featured_order" numeric DEFAULT 0;
  ALTER TABLE "_profile_v" ADD COLUMN "version_featured_order" numeric DEFAULT 0;
  ALTER TABLE "professional_sections" ADD COLUMN "featured_order" numeric DEFAULT 0;
  ALTER TABLE "_professional_sections_v" ADD COLUMN "version_featured_order" numeric DEFAULT 0;
  ALTER TABLE "associations" ADD COLUMN "featured_order" numeric DEFAULT 0;
  ALTER TABLE "_associations_v" ADD COLUMN "version_featured_order" numeric DEFAULT 0;
  ALTER TABLE "context_links" ADD COLUMN "featured_order" numeric DEFAULT 0;
  ALTER TABLE "_context_links_v" ADD COLUMN "version_featured_order" numeric DEFAULT 0;
  ALTER TABLE "site_settings" ADD COLUMN "featured_order" numeric DEFAULT 0;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_featured_order" numeric DEFAULT 0;`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "skills" DROP COLUMN "featured_order";
  ALTER TABLE "_skills_v" DROP COLUMN "version_featured_order";
  ALTER TABLE "experiences" DROP COLUMN "featured_order";
  ALTER TABLE "_experiences_v" DROP COLUMN "version_featured_order";
  ALTER TABLE "education" DROP COLUMN "featured_order";
  ALTER TABLE "_education_v" DROP COLUMN "version_featured_order";
  ALTER TABLE "projects" DROP COLUMN "featured_order";
  ALTER TABLE "_projects_v" DROP COLUMN "version_featured_order";
  ALTER TABLE "posts" DROP COLUMN "featured_order";
  ALTER TABLE "_posts_v" DROP COLUMN "version_featured_order";
  ALTER TABLE "profile" DROP COLUMN "featured_order";
  ALTER TABLE "_profile_v" DROP COLUMN "version_featured_order";
  ALTER TABLE "professional_sections" DROP COLUMN "featured_order";
  ALTER TABLE "_professional_sections_v" DROP COLUMN "version_featured_order";
  ALTER TABLE "associations" DROP COLUMN "featured_order";
  ALTER TABLE "_associations_v" DROP COLUMN "version_featured_order";
  ALTER TABLE "context_links" DROP COLUMN "featured_order";
  ALTER TABLE "_context_links_v" DROP COLUMN "version_featured_order";
  ALTER TABLE "site_settings" DROP COLUMN "featured_order";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_featured_order";`);
}
