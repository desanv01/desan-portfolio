import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_owners_role" AS ENUM('owner', 'disabled');
  CREATE TYPE "public"."enum_media_kind" AS ENUM('image', 'document', 'font');
  CREATE TYPE "public"."enum_skills_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__skills_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_experiences_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__experiences_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_education_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__education_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_posts_kind" AS ENUM('update', 'article', 'build-log', 'milestone');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_version_kind" AS ENUM('update', 'article', 'build-log', 'milestone');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_profile_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__profile_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_professional_sections_kind" AS ENUM('credential', 'course', 'award', 'volunteering', 'publication', 'patent', 'test-score', 'language', 'organization', 'cause', 'career-break', 'service', 'featured', 'testimonial');
  CREATE TYPE "public"."enum_professional_sections_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__professional_sections_v_version_kind" AS ENUM('credential', 'course', 'award', 'volunteering', 'publication', 'patent', 'test-score', 'language', 'organization', 'cause', 'career-break', 'service', 'featured', 'testimonial');
  CREATE TYPE "public"."enum__professional_sections_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_associations_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__associations_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_site_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__site_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_design_themes_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__design_themes_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "owners_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "owners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"singleton" numeric DEFAULT 1 NOT NULL,
  	"role" "enum_owners_role" DEFAULT 'owner' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"credit" varchar,
  	"license" varchar NOT NULL,
  	"public_eligible" boolean DEFAULT false,
  	"kind" "enum_media_kind" NOT NULL,
  	"resource_version" varchar NOT NULL,
  	"sha256" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "skills_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar
  );
  
  CREATE TABLE "skills_aliases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "skills" (
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
  	"canonical_name" varchar,
  	"category" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_skills_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "skills_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_skills_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_skills_v_version_aliases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_skills_v" (
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
  	"version_canonical_name" varchar,
  	"version_category" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__skills_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_skills_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "experiences_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar
  );
  
  CREATE TABLE "experiences_roles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"role" varchar,
  	"employment_type" varchar,
  	"location" varchar,
  	"location_type" varchar,
  	"start" varchar,
  	"end" varchar,
  	"current" boolean DEFAULT false,
  	"responsibilities" varchar,
  	"outcomes" varchar,
  	"contribution" varchar,
  	"hidden" boolean
  );
  
  CREATE TABLE "experiences" (
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
  	"organization" varchar,
  	"organization_u_r_l" varchar,
  	"logo_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_experiences_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "experiences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_experiences_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_experiences_v_version_roles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" varchar,
  	"employment_type" varchar,
  	"location" varchar,
  	"location_type" varchar,
  	"start" varchar,
  	"end" varchar,
  	"current" boolean DEFAULT false,
  	"responsibilities" varchar,
  	"outcomes" varchar,
  	"contribution" varchar,
  	"hidden" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_experiences_v" (
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
  	"version_organization" varchar,
  	"version_organization_u_r_l" varchar,
  	"version_logo_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__experiences_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_experiences_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "education_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar
  );
  
  CREATE TABLE "education" (
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
  	"institution" varchar,
  	"qualification" varchar,
  	"field_of_study" varchar,
  	"start" varchar,
  	"end" varchar,
  	"current" boolean DEFAULT false,
  	"completion_status" varchar,
  	"grade" varchar,
  	"show_grade" boolean DEFAULT false,
  	"activities" varchar,
  	"coursework" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_education_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "education_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"professional_sections_id" integer
  );
  
  CREATE TABLE "_education_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_education_v" (
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
  	"version_institution" varchar,
  	"version_qualification" varchar,
  	"version_field_of_study" varchar,
  	"version_start" varchar,
  	"version_end" varchar,
  	"version_current" boolean DEFAULT false,
  	"version_completion_status" varchar,
  	"version_grade" varchar,
  	"version_show_grade" boolean DEFAULT false,
  	"version_activities" varchar,
  	"version_coursework" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__education_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_education_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"professional_sections_id" integer
  );
  
  CREATE TABLE "projects_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar
  );
  
  CREATE TABLE "projects_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "projects" (
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
  	"discipline" varchar,
  	"role" varchar,
  	"work_status" varchar,
  	"start" varchar,
  	"end" varchar,
  	"current" boolean DEFAULT false,
  	"collaborators" varchar,
  	"problem" varchar,
  	"contribution" varchar,
  	"approach" varchar,
  	"architecture" varchar,
  	"results" varchar,
  	"limitations" varchar,
  	"lineage" varchar,
  	"credits" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_projects_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "projects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_projects_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v" (
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
  	"version_discipline" varchar,
  	"version_role" varchar,
  	"version_work_status" varchar,
  	"version_start" varchar,
  	"version_end" varchar,
  	"version_current" boolean DEFAULT false,
  	"version_collaborators" varchar,
  	"version_problem" varchar,
  	"version_contribution" varchar,
  	"version_approach" varchar,
  	"version_architecture" varchar,
  	"version_results" varchar,
  	"version_limitations" varchar,
  	"version_lineage" varchar,
  	"version_credits" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__projects_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_projects_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "posts_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar
  );
  
  CREATE TABLE "posts_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "posts" (
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
  	"kind" "enum_posts_kind",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"projects_id" integer
  );
  
  CREATE TABLE "_posts_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v_version_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v" (
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
  	"version_kind" "enum__posts_v_version_kind",
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"projects_id" integer
  );
  
  CREATE TABLE "profile_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar
  );
  
  CREATE TABLE "profile_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "profile_contact" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"public" boolean DEFAULT false
  );
  
  CREATE TABLE "profile" (
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
  	"display_name" varchar,
  	"headline" varchar,
  	"region" varchar,
  	"availability" varchar,
  	"resume_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_profile_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "profile_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_profile_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_profile_v_version_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_profile_v_version_contact" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"public" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_profile_v" (
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
  	"version_display_name" varchar,
  	"version_headline" varchar,
  	"version_region" varchar,
  	"version_availability" varchar,
  	"version_resume_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__profile_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_profile_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "professional_sections_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar
  );
  
  CREATE TABLE "professional_sections" (
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
  	"kind" "enum_professional_sections_kind",
  	"issuer" varchar,
  	"organization" varchar,
  	"role" varchar,
  	"start" varchar,
  	"end" varchar,
  	"current" boolean DEFAULT false,
  	"issue_date" varchar,
  	"expiry_date" varchar,
  	"no_expiry" boolean,
  	"credential_id" varchar,
  	"show_credential_id" boolean DEFAULT false,
  	"url" varchar,
  	"provider" varchar,
  	"course_code" varchar,
  	"completion_status" varchar,
  	"authors" varchar,
  	"contribution" varchar,
  	"publisher" varchar,
  	"identifier" varchar,
  	"jurisdiction" varchar,
  	"patent_status" varchar,
  	"result" varchar,
  	"scale" varchar,
  	"proficiency" varchar,
  	"cause" varchar,
  	"scope" varchar,
  	"delivery_mode" varchar,
  	"price" varchar,
  	"show_price" boolean DEFAULT false,
  	"quote" varchar,
  	"author" varchar,
  	"relationship" varchar,
  	"consent_receipt" varchar,
  	"consent_to_publish" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_professional_sections_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "professional_sections_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"projects_id" integer,
  	"education_id" integer,
  	"experiences_id" integer,
  	"skills_id" integer
  );
  
  CREATE TABLE "_professional_sections_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_professional_sections_v" (
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
  	"version_kind" "enum__professional_sections_v_version_kind",
  	"version_issuer" varchar,
  	"version_organization" varchar,
  	"version_role" varchar,
  	"version_start" varchar,
  	"version_end" varchar,
  	"version_current" boolean DEFAULT false,
  	"version_issue_date" varchar,
  	"version_expiry_date" varchar,
  	"version_no_expiry" boolean,
  	"version_credential_id" varchar,
  	"version_show_credential_id" boolean DEFAULT false,
  	"version_url" varchar,
  	"version_provider" varchar,
  	"version_course_code" varchar,
  	"version_completion_status" varchar,
  	"version_authors" varchar,
  	"version_contribution" varchar,
  	"version_publisher" varchar,
  	"version_identifier" varchar,
  	"version_jurisdiction" varchar,
  	"version_patent_status" varchar,
  	"version_result" varchar,
  	"version_scale" varchar,
  	"version_proficiency" varchar,
  	"version_cause" varchar,
  	"version_scope" varchar,
  	"version_delivery_mode" varchar,
  	"version_price" varchar,
  	"version_show_price" boolean DEFAULT false,
  	"version_quote" varchar,
  	"version_author" varchar,
  	"version_relationship" varchar,
  	"version_consent_receipt" varchar,
  	"version_consent_to_publish" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__professional_sections_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_professional_sections_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"projects_id" integer,
  	"education_id" integer,
  	"experiences_id" integer,
  	"skills_id" integer
  );
  
  CREATE TABLE "associations_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar
  );
  
  CREATE TABLE "associations" (
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
  	"skill_id" integer,
  	"kind" varchar,
  	"context" varchar,
  	"owner_proposed" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_associations_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "associations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"projects_id" integer,
  	"education_id" integer,
  	"experiences_id" integer,
  	"professional_sections_id" integer
  );
  
  CREATE TABLE "_associations_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_associations_v" (
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
  	"version_skill_id" integer,
  	"version_kind" varchar,
  	"version_context" varchar,
  	"version_owner_proposed" boolean,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__associations_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_associations_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"projects_id" integer,
  	"education_id" integer,
  	"experiences_id" integer,
  	"professional_sections_id" integer
  );
  
  CREATE TABLE "site_settings_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar
  );
  
  CREATE TABLE "site_settings_navigation" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"path" varchar
  );
  
  CREATE TABLE "site_settings_section_order" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section" varchar
  );
  
  CREATE TABLE "site_settings" (
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
  	"footer" varchar,
  	"resume_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_site_settings_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "site_settings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_site_settings_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"observed_at" varchar,
  	"confidence" varchar,
  	"context" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_navigation" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"path" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_section_order" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"section" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v" (
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
  	"version_footer" varchar,
  	"version_resume_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__site_settings_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_site_settings_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "design_themes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"schema_version" numeric DEFAULT 1,
  	"data" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_design_themes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_design_themes_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_schema_version" numeric DEFAULT 1,
  	"version_data" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__design_themes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "publication_snapshots" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"revision" varchar NOT NULL,
  	"payload" jsonb NOT NULL,
  	"media_ids" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "publication_state" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"singleton" numeric NOT NULL,
  	"revision" varchar NOT NULL,
  	"snapshot_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"owners_id" integer,
  	"media_id" integer,
  	"skills_id" integer,
  	"experiences_id" integer,
  	"education_id" integer,
  	"projects_id" integer,
  	"posts_id" integer,
  	"profile_id" integer,
  	"professional_sections_id" integer,
  	"associations_id" integer,
  	"site_settings_id" integer,
  	"design_themes_id" integer,
  	"publication_snapshots_id" integer,
  	"publication_state_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"owners_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "owners_sessions" ADD CONSTRAINT "owners_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "skills_sources" ADD CONSTRAINT "skills_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "skills_aliases" ADD CONSTRAINT "skills_aliases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "skills" ADD CONSTRAINT "skills_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "skills_rels" ADD CONSTRAINT "skills_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "skills_rels" ADD CONSTRAINT "skills_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_skills_v_version_sources" ADD CONSTRAINT "_skills_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_skills_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_skills_v_version_aliases" ADD CONSTRAINT "_skills_v_version_aliases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_skills_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_skills_v" ADD CONSTRAINT "_skills_v_parent_id_skills_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."skills"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_skills_v" ADD CONSTRAINT "_skills_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_skills_v_rels" ADD CONSTRAINT "_skills_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_skills_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_skills_v_rels" ADD CONSTRAINT "_skills_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experiences_sources" ADD CONSTRAINT "experiences_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experiences_roles" ADD CONSTRAINT "experiences_roles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experiences" ADD CONSTRAINT "experiences_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "experiences" ADD CONSTRAINT "experiences_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "experiences_rels" ADD CONSTRAINT "experiences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experiences_rels" ADD CONSTRAINT "experiences_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v_version_sources" ADD CONSTRAINT "_experiences_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v_version_roles" ADD CONSTRAINT "_experiences_v_version_roles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_parent_id_experiences_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v_rels" ADD CONSTRAINT "_experiences_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v_rels" ADD CONSTRAINT "_experiences_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "education_sources" ADD CONSTRAINT "education_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."education"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "education" ADD CONSTRAINT "education_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "education_rels" ADD CONSTRAINT "education_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."education"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "education_rels" ADD CONSTRAINT "education_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "education_rels" ADD CONSTRAINT "education_rels_professional_sections_fk" FOREIGN KEY ("professional_sections_id") REFERENCES "public"."professional_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_education_v_version_sources" ADD CONSTRAINT "_education_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_education_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_education_v" ADD CONSTRAINT "_education_v_parent_id_education_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."education"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_education_v" ADD CONSTRAINT "_education_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_education_v_rels" ADD CONSTRAINT "_education_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_education_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_education_v_rels" ADD CONSTRAINT "_education_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_education_v_rels" ADD CONSTRAINT "_education_v_rels_professional_sections_fk" FOREIGN KEY ("professional_sections_id") REFERENCES "public"."professional_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_sources" ADD CONSTRAINT "projects_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_links" ADD CONSTRAINT "projects_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_sources" ADD CONSTRAINT "_projects_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_links" ADD CONSTRAINT "_projects_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_sources" ADD CONSTRAINT "posts_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_categories" ADD CONSTRAINT "posts_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_sources" ADD CONSTRAINT "_posts_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_categories" ADD CONSTRAINT "_posts_v_version_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profile_sources" ADD CONSTRAINT "profile_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profile_links" ADD CONSTRAINT "profile_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profile_contact" ADD CONSTRAINT "profile_contact_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profile" ADD CONSTRAINT "profile_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "profile" ADD CONSTRAINT "profile_resume_id_media_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "profile_rels" ADD CONSTRAINT "profile_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profile_rels" ADD CONSTRAINT "profile_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_profile_v_version_sources" ADD CONSTRAINT "_profile_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_profile_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_profile_v_version_links" ADD CONSTRAINT "_profile_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_profile_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_profile_v_version_contact" ADD CONSTRAINT "_profile_v_version_contact_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_profile_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_profile_v" ADD CONSTRAINT "_profile_v_parent_id_profile_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_profile_v" ADD CONSTRAINT "_profile_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_profile_v" ADD CONSTRAINT "_profile_v_version_resume_id_media_id_fk" FOREIGN KEY ("version_resume_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_profile_v_rels" ADD CONSTRAINT "_profile_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_profile_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_profile_v_rels" ADD CONSTRAINT "_profile_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "professional_sections_sources" ADD CONSTRAINT "professional_sections_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."professional_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "professional_sections" ADD CONSTRAINT "professional_sections_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "professional_sections_rels" ADD CONSTRAINT "professional_sections_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."professional_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "professional_sections_rels" ADD CONSTRAINT "professional_sections_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "professional_sections_rels" ADD CONSTRAINT "professional_sections_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "professional_sections_rels" ADD CONSTRAINT "professional_sections_rels_education_fk" FOREIGN KEY ("education_id") REFERENCES "public"."education"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "professional_sections_rels" ADD CONSTRAINT "professional_sections_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "professional_sections_rels" ADD CONSTRAINT "professional_sections_rels_skills_fk" FOREIGN KEY ("skills_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_professional_sections_v_version_sources" ADD CONSTRAINT "_professional_sections_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_professional_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_professional_sections_v" ADD CONSTRAINT "_professional_sections_v_parent_id_professional_sections_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."professional_sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_professional_sections_v" ADD CONSTRAINT "_professional_sections_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_professional_sections_v_rels" ADD CONSTRAINT "_professional_sections_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_professional_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_professional_sections_v_rels" ADD CONSTRAINT "_professional_sections_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_professional_sections_v_rels" ADD CONSTRAINT "_professional_sections_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_professional_sections_v_rels" ADD CONSTRAINT "_professional_sections_v_rels_education_fk" FOREIGN KEY ("education_id") REFERENCES "public"."education"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_professional_sections_v_rels" ADD CONSTRAINT "_professional_sections_v_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_professional_sections_v_rels" ADD CONSTRAINT "_professional_sections_v_rels_skills_fk" FOREIGN KEY ("skills_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "associations_sources" ADD CONSTRAINT "associations_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."associations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "associations" ADD CONSTRAINT "associations_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "associations" ADD CONSTRAINT "associations_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "associations_rels" ADD CONSTRAINT "associations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."associations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "associations_rels" ADD CONSTRAINT "associations_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "associations_rels" ADD CONSTRAINT "associations_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "associations_rels" ADD CONSTRAINT "associations_rels_education_fk" FOREIGN KEY ("education_id") REFERENCES "public"."education"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "associations_rels" ADD CONSTRAINT "associations_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "associations_rels" ADD CONSTRAINT "associations_rels_professional_sections_fk" FOREIGN KEY ("professional_sections_id") REFERENCES "public"."professional_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_associations_v_version_sources" ADD CONSTRAINT "_associations_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_associations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_associations_v" ADD CONSTRAINT "_associations_v_parent_id_associations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."associations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_associations_v" ADD CONSTRAINT "_associations_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_associations_v" ADD CONSTRAINT "_associations_v_version_skill_id_skills_id_fk" FOREIGN KEY ("version_skill_id") REFERENCES "public"."skills"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_associations_v_rels" ADD CONSTRAINT "_associations_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_associations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_associations_v_rels" ADD CONSTRAINT "_associations_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_associations_v_rels" ADD CONSTRAINT "_associations_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_associations_v_rels" ADD CONSTRAINT "_associations_v_rels_education_fk" FOREIGN KEY ("education_id") REFERENCES "public"."education"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_associations_v_rels" ADD CONSTRAINT "_associations_v_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_associations_v_rels" ADD CONSTRAINT "_associations_v_rels_professional_sections_fk" FOREIGN KEY ("professional_sections_id") REFERENCES "public"."professional_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_sources" ADD CONSTRAINT "site_settings_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_navigation" ADD CONSTRAINT "site_settings_navigation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_section_order" ADD CONSTRAINT "site_settings_section_order_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_resume_id_media_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_sources" ADD CONSTRAINT "_site_settings_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_navigation" ADD CONSTRAINT "_site_settings_v_version_navigation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_section_order" ADD CONSTRAINT "_site_settings_v_version_section_order_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_parent_id_site_settings_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_resume_id_media_id_fk" FOREIGN KEY ("version_resume_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v_rels" ADD CONSTRAINT "_site_settings_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_rels" ADD CONSTRAINT "_site_settings_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_design_themes_v" ADD CONSTRAINT "_design_themes_v_parent_id_design_themes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."design_themes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publication_state" ADD CONSTRAINT "publication_state_snapshot_id_publication_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."publication_snapshots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_owners_fk" FOREIGN KEY ("owners_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_skills_fk" FOREIGN KEY ("skills_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_education_fk" FOREIGN KEY ("education_id") REFERENCES "public"."education"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_profile_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_professional_sections_fk" FOREIGN KEY ("professional_sections_id") REFERENCES "public"."professional_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_associations_fk" FOREIGN KEY ("associations_id") REFERENCES "public"."associations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_site_settings_fk" FOREIGN KEY ("site_settings_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_design_themes_fk" FOREIGN KEY ("design_themes_id") REFERENCES "public"."design_themes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_publication_snapshots_fk" FOREIGN KEY ("publication_snapshots_id") REFERENCES "public"."publication_snapshots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_publication_state_fk" FOREIGN KEY ("publication_state_id") REFERENCES "public"."publication_state"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_owners_fk" FOREIGN KEY ("owners_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "owners_sessions_order_idx" ON "owners_sessions" USING btree ("_order");
  CREATE INDEX "owners_sessions_parent_id_idx" ON "owners_sessions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "owners_singleton_idx" ON "owners" USING btree ("singleton");
  CREATE INDEX "owners_updated_at_idx" ON "owners" USING btree ("updated_at");
  CREATE INDEX "owners_created_at_idx" ON "owners" USING btree ("created_at");
  CREATE UNIQUE INDEX "owners_email_idx" ON "owners" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "skills_sources_order_idx" ON "skills_sources" USING btree ("_order");
  CREATE INDEX "skills_sources_parent_id_idx" ON "skills_sources" USING btree ("_parent_id");
  CREATE INDEX "skills_aliases_order_idx" ON "skills_aliases" USING btree ("_order");
  CREATE INDEX "skills_aliases_parent_id_idx" ON "skills_aliases" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "skills_slug_idx" ON "skills" USING btree ("slug");
  CREATE INDEX "skills_seo_seo_image_idx" ON "skills" USING btree ("seo_image_id");
  CREATE INDEX "skills_updated_at_idx" ON "skills" USING btree ("updated_at");
  CREATE INDEX "skills_created_at_idx" ON "skills" USING btree ("created_at");
  CREATE INDEX "skills__status_idx" ON "skills" USING btree ("_status");
  CREATE INDEX "skills_rels_order_idx" ON "skills_rels" USING btree ("order");
  CREATE INDEX "skills_rels_parent_idx" ON "skills_rels" USING btree ("parent_id");
  CREATE INDEX "skills_rels_path_idx" ON "skills_rels" USING btree ("path");
  CREATE INDEX "skills_rels_media_id_idx" ON "skills_rels" USING btree ("media_id");
  CREATE INDEX "_skills_v_version_sources_order_idx" ON "_skills_v_version_sources" USING btree ("_order");
  CREATE INDEX "_skills_v_version_sources_parent_id_idx" ON "_skills_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_skills_v_version_aliases_order_idx" ON "_skills_v_version_aliases" USING btree ("_order");
  CREATE INDEX "_skills_v_version_aliases_parent_id_idx" ON "_skills_v_version_aliases" USING btree ("_parent_id");
  CREATE INDEX "_skills_v_parent_idx" ON "_skills_v" USING btree ("parent_id");
  CREATE INDEX "_skills_v_version_version_slug_idx" ON "_skills_v" USING btree ("version_slug");
  CREATE INDEX "_skills_v_version_seo_version_seo_image_idx" ON "_skills_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_skills_v_version_version_updated_at_idx" ON "_skills_v" USING btree ("version_updated_at");
  CREATE INDEX "_skills_v_version_version_created_at_idx" ON "_skills_v" USING btree ("version_created_at");
  CREATE INDEX "_skills_v_version_version__status_idx" ON "_skills_v" USING btree ("version__status");
  CREATE INDEX "_skills_v_created_at_idx" ON "_skills_v" USING btree ("created_at");
  CREATE INDEX "_skills_v_updated_at_idx" ON "_skills_v" USING btree ("updated_at");
  CREATE INDEX "_skills_v_latest_idx" ON "_skills_v" USING btree ("latest");
  CREATE INDEX "_skills_v_rels_order_idx" ON "_skills_v_rels" USING btree ("order");
  CREATE INDEX "_skills_v_rels_parent_idx" ON "_skills_v_rels" USING btree ("parent_id");
  CREATE INDEX "_skills_v_rels_path_idx" ON "_skills_v_rels" USING btree ("path");
  CREATE INDEX "_skills_v_rels_media_id_idx" ON "_skills_v_rels" USING btree ("media_id");
  CREATE INDEX "experiences_sources_order_idx" ON "experiences_sources" USING btree ("_order");
  CREATE INDEX "experiences_sources_parent_id_idx" ON "experiences_sources" USING btree ("_parent_id");
  CREATE INDEX "experiences_roles_order_idx" ON "experiences_roles" USING btree ("_order");
  CREATE INDEX "experiences_roles_parent_id_idx" ON "experiences_roles" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "experiences_slug_idx" ON "experiences" USING btree ("slug");
  CREATE INDEX "experiences_seo_seo_image_idx" ON "experiences" USING btree ("seo_image_id");
  CREATE INDEX "experiences_logo_idx" ON "experiences" USING btree ("logo_id");
  CREATE INDEX "experiences_updated_at_idx" ON "experiences" USING btree ("updated_at");
  CREATE INDEX "experiences_created_at_idx" ON "experiences" USING btree ("created_at");
  CREATE INDEX "experiences__status_idx" ON "experiences" USING btree ("_status");
  CREATE INDEX "experiences_rels_order_idx" ON "experiences_rels" USING btree ("order");
  CREATE INDEX "experiences_rels_parent_idx" ON "experiences_rels" USING btree ("parent_id");
  CREATE INDEX "experiences_rels_path_idx" ON "experiences_rels" USING btree ("path");
  CREATE INDEX "experiences_rels_media_id_idx" ON "experiences_rels" USING btree ("media_id");
  CREATE INDEX "_experiences_v_version_sources_order_idx" ON "_experiences_v_version_sources" USING btree ("_order");
  CREATE INDEX "_experiences_v_version_sources_parent_id_idx" ON "_experiences_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_experiences_v_version_roles_order_idx" ON "_experiences_v_version_roles" USING btree ("_order");
  CREATE INDEX "_experiences_v_version_roles_parent_id_idx" ON "_experiences_v_version_roles" USING btree ("_parent_id");
  CREATE INDEX "_experiences_v_parent_idx" ON "_experiences_v" USING btree ("parent_id");
  CREATE INDEX "_experiences_v_version_version_slug_idx" ON "_experiences_v" USING btree ("version_slug");
  CREATE INDEX "_experiences_v_version_seo_version_seo_image_idx" ON "_experiences_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_experiences_v_version_version_logo_idx" ON "_experiences_v" USING btree ("version_logo_id");
  CREATE INDEX "_experiences_v_version_version_updated_at_idx" ON "_experiences_v" USING btree ("version_updated_at");
  CREATE INDEX "_experiences_v_version_version_created_at_idx" ON "_experiences_v" USING btree ("version_created_at");
  CREATE INDEX "_experiences_v_version_version__status_idx" ON "_experiences_v" USING btree ("version__status");
  CREATE INDEX "_experiences_v_created_at_idx" ON "_experiences_v" USING btree ("created_at");
  CREATE INDEX "_experiences_v_updated_at_idx" ON "_experiences_v" USING btree ("updated_at");
  CREATE INDEX "_experiences_v_latest_idx" ON "_experiences_v" USING btree ("latest");
  CREATE INDEX "_experiences_v_rels_order_idx" ON "_experiences_v_rels" USING btree ("order");
  CREATE INDEX "_experiences_v_rels_parent_idx" ON "_experiences_v_rels" USING btree ("parent_id");
  CREATE INDEX "_experiences_v_rels_path_idx" ON "_experiences_v_rels" USING btree ("path");
  CREATE INDEX "_experiences_v_rels_media_id_idx" ON "_experiences_v_rels" USING btree ("media_id");
  CREATE INDEX "education_sources_order_idx" ON "education_sources" USING btree ("_order");
  CREATE INDEX "education_sources_parent_id_idx" ON "education_sources" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "education_slug_idx" ON "education" USING btree ("slug");
  CREATE INDEX "education_seo_seo_image_idx" ON "education" USING btree ("seo_image_id");
  CREATE INDEX "education_updated_at_idx" ON "education" USING btree ("updated_at");
  CREATE INDEX "education_created_at_idx" ON "education" USING btree ("created_at");
  CREATE INDEX "education__status_idx" ON "education" USING btree ("_status");
  CREATE INDEX "education_rels_order_idx" ON "education_rels" USING btree ("order");
  CREATE INDEX "education_rels_parent_idx" ON "education_rels" USING btree ("parent_id");
  CREATE INDEX "education_rels_path_idx" ON "education_rels" USING btree ("path");
  CREATE INDEX "education_rels_media_id_idx" ON "education_rels" USING btree ("media_id");
  CREATE INDEX "education_rels_professional_sections_id_idx" ON "education_rels" USING btree ("professional_sections_id");
  CREATE INDEX "_education_v_version_sources_order_idx" ON "_education_v_version_sources" USING btree ("_order");
  CREATE INDEX "_education_v_version_sources_parent_id_idx" ON "_education_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_education_v_parent_idx" ON "_education_v" USING btree ("parent_id");
  CREATE INDEX "_education_v_version_version_slug_idx" ON "_education_v" USING btree ("version_slug");
  CREATE INDEX "_education_v_version_seo_version_seo_image_idx" ON "_education_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_education_v_version_version_updated_at_idx" ON "_education_v" USING btree ("version_updated_at");
  CREATE INDEX "_education_v_version_version_created_at_idx" ON "_education_v" USING btree ("version_created_at");
  CREATE INDEX "_education_v_version_version__status_idx" ON "_education_v" USING btree ("version__status");
  CREATE INDEX "_education_v_created_at_idx" ON "_education_v" USING btree ("created_at");
  CREATE INDEX "_education_v_updated_at_idx" ON "_education_v" USING btree ("updated_at");
  CREATE INDEX "_education_v_latest_idx" ON "_education_v" USING btree ("latest");
  CREATE INDEX "_education_v_rels_order_idx" ON "_education_v_rels" USING btree ("order");
  CREATE INDEX "_education_v_rels_parent_idx" ON "_education_v_rels" USING btree ("parent_id");
  CREATE INDEX "_education_v_rels_path_idx" ON "_education_v_rels" USING btree ("path");
  CREATE INDEX "_education_v_rels_media_id_idx" ON "_education_v_rels" USING btree ("media_id");
  CREATE INDEX "_education_v_rels_professional_sections_id_idx" ON "_education_v_rels" USING btree ("professional_sections_id");
  CREATE INDEX "projects_sources_order_idx" ON "projects_sources" USING btree ("_order");
  CREATE INDEX "projects_sources_parent_id_idx" ON "projects_sources" USING btree ("_parent_id");
  CREATE INDEX "projects_links_order_idx" ON "projects_links" USING btree ("_order");
  CREATE INDEX "projects_links_parent_id_idx" ON "projects_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_seo_seo_image_idx" ON "projects" USING btree ("seo_image_id");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "projects__status_idx" ON "projects" USING btree ("_status");
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_media_id_idx" ON "projects_rels" USING btree ("media_id");
  CREATE INDEX "_projects_v_version_sources_order_idx" ON "_projects_v_version_sources" USING btree ("_order");
  CREATE INDEX "_projects_v_version_sources_parent_id_idx" ON "_projects_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_links_order_idx" ON "_projects_v_version_links" USING btree ("_order");
  CREATE INDEX "_projects_v_version_links_parent_id_idx" ON "_projects_v_version_links" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_parent_idx" ON "_projects_v" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_version_slug_idx" ON "_projects_v" USING btree ("version_slug");
  CREATE INDEX "_projects_v_version_seo_version_seo_image_idx" ON "_projects_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_projects_v_version_version_updated_at_idx" ON "_projects_v" USING btree ("version_updated_at");
  CREATE INDEX "_projects_v_version_version_created_at_idx" ON "_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_projects_v_version_version__status_idx" ON "_projects_v" USING btree ("version__status");
  CREATE INDEX "_projects_v_created_at_idx" ON "_projects_v" USING btree ("created_at");
  CREATE INDEX "_projects_v_updated_at_idx" ON "_projects_v" USING btree ("updated_at");
  CREATE INDEX "_projects_v_latest_idx" ON "_projects_v" USING btree ("latest");
  CREATE INDEX "_projects_v_rels_order_idx" ON "_projects_v_rels" USING btree ("order");
  CREATE INDEX "_projects_v_rels_parent_idx" ON "_projects_v_rels" USING btree ("parent_id");
  CREATE INDEX "_projects_v_rels_path_idx" ON "_projects_v_rels" USING btree ("path");
  CREATE INDEX "_projects_v_rels_media_id_idx" ON "_projects_v_rels" USING btree ("media_id");
  CREATE INDEX "posts_sources_order_idx" ON "posts_sources" USING btree ("_order");
  CREATE INDEX "posts_sources_parent_id_idx" ON "posts_sources" USING btree ("_parent_id");
  CREATE INDEX "posts_categories_order_idx" ON "posts_categories" USING btree ("_order");
  CREATE INDEX "posts_categories_parent_id_idx" ON "posts_categories" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_seo_seo_image_idx" ON "posts" USING btree ("seo_image_id");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE INDEX "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_media_id_idx" ON "posts_rels" USING btree ("media_id");
  CREATE INDEX "posts_rels_projects_id_idx" ON "posts_rels" USING btree ("projects_id");
  CREATE INDEX "_posts_v_version_sources_order_idx" ON "_posts_v_version_sources" USING btree ("_order");
  CREATE INDEX "_posts_v_version_sources_parent_id_idx" ON "_posts_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_categories_order_idx" ON "_posts_v_version_categories" USING btree ("_order");
  CREATE INDEX "_posts_v_version_categories_parent_id_idx" ON "_posts_v_version_categories" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_seo_version_seo_image_idx" ON "_posts_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX "_posts_v_rels_order_idx" ON "_posts_v_rels" USING btree ("order");
  CREATE INDEX "_posts_v_rels_parent_idx" ON "_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_posts_v_rels_path_idx" ON "_posts_v_rels" USING btree ("path");
  CREATE INDEX "_posts_v_rels_media_id_idx" ON "_posts_v_rels" USING btree ("media_id");
  CREATE INDEX "_posts_v_rels_projects_id_idx" ON "_posts_v_rels" USING btree ("projects_id");
  CREATE INDEX "profile_sources_order_idx" ON "profile_sources" USING btree ("_order");
  CREATE INDEX "profile_sources_parent_id_idx" ON "profile_sources" USING btree ("_parent_id");
  CREATE INDEX "profile_links_order_idx" ON "profile_links" USING btree ("_order");
  CREATE INDEX "profile_links_parent_id_idx" ON "profile_links" USING btree ("_parent_id");
  CREATE INDEX "profile_contact_order_idx" ON "profile_contact" USING btree ("_order");
  CREATE INDEX "profile_contact_parent_id_idx" ON "profile_contact" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "profile_slug_idx" ON "profile" USING btree ("slug");
  CREATE INDEX "profile_seo_seo_image_idx" ON "profile" USING btree ("seo_image_id");
  CREATE INDEX "profile_resume_idx" ON "profile" USING btree ("resume_id");
  CREATE INDEX "profile_updated_at_idx" ON "profile" USING btree ("updated_at");
  CREATE INDEX "profile_created_at_idx" ON "profile" USING btree ("created_at");
  CREATE INDEX "profile__status_idx" ON "profile" USING btree ("_status");
  CREATE INDEX "profile_rels_order_idx" ON "profile_rels" USING btree ("order");
  CREATE INDEX "profile_rels_parent_idx" ON "profile_rels" USING btree ("parent_id");
  CREATE INDEX "profile_rels_path_idx" ON "profile_rels" USING btree ("path");
  CREATE INDEX "profile_rels_media_id_idx" ON "profile_rels" USING btree ("media_id");
  CREATE INDEX "_profile_v_version_sources_order_idx" ON "_profile_v_version_sources" USING btree ("_order");
  CREATE INDEX "_profile_v_version_sources_parent_id_idx" ON "_profile_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_profile_v_version_links_order_idx" ON "_profile_v_version_links" USING btree ("_order");
  CREATE INDEX "_profile_v_version_links_parent_id_idx" ON "_profile_v_version_links" USING btree ("_parent_id");
  CREATE INDEX "_profile_v_version_contact_order_idx" ON "_profile_v_version_contact" USING btree ("_order");
  CREATE INDEX "_profile_v_version_contact_parent_id_idx" ON "_profile_v_version_contact" USING btree ("_parent_id");
  CREATE INDEX "_profile_v_parent_idx" ON "_profile_v" USING btree ("parent_id");
  CREATE INDEX "_profile_v_version_version_slug_idx" ON "_profile_v" USING btree ("version_slug");
  CREATE INDEX "_profile_v_version_seo_version_seo_image_idx" ON "_profile_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_profile_v_version_version_resume_idx" ON "_profile_v" USING btree ("version_resume_id");
  CREATE INDEX "_profile_v_version_version_updated_at_idx" ON "_profile_v" USING btree ("version_updated_at");
  CREATE INDEX "_profile_v_version_version_created_at_idx" ON "_profile_v" USING btree ("version_created_at");
  CREATE INDEX "_profile_v_version_version__status_idx" ON "_profile_v" USING btree ("version__status");
  CREATE INDEX "_profile_v_created_at_idx" ON "_profile_v" USING btree ("created_at");
  CREATE INDEX "_profile_v_updated_at_idx" ON "_profile_v" USING btree ("updated_at");
  CREATE INDEX "_profile_v_latest_idx" ON "_profile_v" USING btree ("latest");
  CREATE INDEX "_profile_v_rels_order_idx" ON "_profile_v_rels" USING btree ("order");
  CREATE INDEX "_profile_v_rels_parent_idx" ON "_profile_v_rels" USING btree ("parent_id");
  CREATE INDEX "_profile_v_rels_path_idx" ON "_profile_v_rels" USING btree ("path");
  CREATE INDEX "_profile_v_rels_media_id_idx" ON "_profile_v_rels" USING btree ("media_id");
  CREATE INDEX "professional_sections_sources_order_idx" ON "professional_sections_sources" USING btree ("_order");
  CREATE INDEX "professional_sections_sources_parent_id_idx" ON "professional_sections_sources" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "professional_sections_slug_idx" ON "professional_sections" USING btree ("slug");
  CREATE INDEX "professional_sections_seo_seo_image_idx" ON "professional_sections" USING btree ("seo_image_id");
  CREATE INDEX "professional_sections_updated_at_idx" ON "professional_sections" USING btree ("updated_at");
  CREATE INDEX "professional_sections_created_at_idx" ON "professional_sections" USING btree ("created_at");
  CREATE INDEX "professional_sections__status_idx" ON "professional_sections" USING btree ("_status");
  CREATE INDEX "professional_sections_rels_order_idx" ON "professional_sections_rels" USING btree ("order");
  CREATE INDEX "professional_sections_rels_parent_idx" ON "professional_sections_rels" USING btree ("parent_id");
  CREATE INDEX "professional_sections_rels_path_idx" ON "professional_sections_rels" USING btree ("path");
  CREATE INDEX "professional_sections_rels_media_id_idx" ON "professional_sections_rels" USING btree ("media_id");
  CREATE INDEX "professional_sections_rels_projects_id_idx" ON "professional_sections_rels" USING btree ("projects_id");
  CREATE INDEX "professional_sections_rels_education_id_idx" ON "professional_sections_rels" USING btree ("education_id");
  CREATE INDEX "professional_sections_rels_experiences_id_idx" ON "professional_sections_rels" USING btree ("experiences_id");
  CREATE INDEX "professional_sections_rels_skills_id_idx" ON "professional_sections_rels" USING btree ("skills_id");
  CREATE INDEX "_professional_sections_v_version_sources_order_idx" ON "_professional_sections_v_version_sources" USING btree ("_order");
  CREATE INDEX "_professional_sections_v_version_sources_parent_id_idx" ON "_professional_sections_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_professional_sections_v_parent_idx" ON "_professional_sections_v" USING btree ("parent_id");
  CREATE INDEX "_professional_sections_v_version_version_slug_idx" ON "_professional_sections_v" USING btree ("version_slug");
  CREATE INDEX "_professional_sections_v_version_seo_version_seo_image_idx" ON "_professional_sections_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_professional_sections_v_version_version_updated_at_idx" ON "_professional_sections_v" USING btree ("version_updated_at");
  CREATE INDEX "_professional_sections_v_version_version_created_at_idx" ON "_professional_sections_v" USING btree ("version_created_at");
  CREATE INDEX "_professional_sections_v_version_version__status_idx" ON "_professional_sections_v" USING btree ("version__status");
  CREATE INDEX "_professional_sections_v_created_at_idx" ON "_professional_sections_v" USING btree ("created_at");
  CREATE INDEX "_professional_sections_v_updated_at_idx" ON "_professional_sections_v" USING btree ("updated_at");
  CREATE INDEX "_professional_sections_v_latest_idx" ON "_professional_sections_v" USING btree ("latest");
  CREATE INDEX "_professional_sections_v_rels_order_idx" ON "_professional_sections_v_rels" USING btree ("order");
  CREATE INDEX "_professional_sections_v_rels_parent_idx" ON "_professional_sections_v_rels" USING btree ("parent_id");
  CREATE INDEX "_professional_sections_v_rels_path_idx" ON "_professional_sections_v_rels" USING btree ("path");
  CREATE INDEX "_professional_sections_v_rels_media_id_idx" ON "_professional_sections_v_rels" USING btree ("media_id");
  CREATE INDEX "_professional_sections_v_rels_projects_id_idx" ON "_professional_sections_v_rels" USING btree ("projects_id");
  CREATE INDEX "_professional_sections_v_rels_education_id_idx" ON "_professional_sections_v_rels" USING btree ("education_id");
  CREATE INDEX "_professional_sections_v_rels_experiences_id_idx" ON "_professional_sections_v_rels" USING btree ("experiences_id");
  CREATE INDEX "_professional_sections_v_rels_skills_id_idx" ON "_professional_sections_v_rels" USING btree ("skills_id");
  CREATE INDEX "associations_sources_order_idx" ON "associations_sources" USING btree ("_order");
  CREATE INDEX "associations_sources_parent_id_idx" ON "associations_sources" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "associations_slug_idx" ON "associations" USING btree ("slug");
  CREATE INDEX "associations_seo_seo_image_idx" ON "associations" USING btree ("seo_image_id");
  CREATE INDEX "associations_skill_idx" ON "associations" USING btree ("skill_id");
  CREATE INDEX "associations_updated_at_idx" ON "associations" USING btree ("updated_at");
  CREATE INDEX "associations_created_at_idx" ON "associations" USING btree ("created_at");
  CREATE INDEX "associations__status_idx" ON "associations" USING btree ("_status");
  CREATE INDEX "associations_rels_order_idx" ON "associations_rels" USING btree ("order");
  CREATE INDEX "associations_rels_parent_idx" ON "associations_rels" USING btree ("parent_id");
  CREATE INDEX "associations_rels_path_idx" ON "associations_rels" USING btree ("path");
  CREATE INDEX "associations_rels_media_id_idx" ON "associations_rels" USING btree ("media_id");
  CREATE INDEX "associations_rels_projects_id_idx" ON "associations_rels" USING btree ("projects_id");
  CREATE INDEX "associations_rels_education_id_idx" ON "associations_rels" USING btree ("education_id");
  CREATE INDEX "associations_rels_experiences_id_idx" ON "associations_rels" USING btree ("experiences_id");
  CREATE INDEX "associations_rels_professional_sections_id_idx" ON "associations_rels" USING btree ("professional_sections_id");
  CREATE INDEX "_associations_v_version_sources_order_idx" ON "_associations_v_version_sources" USING btree ("_order");
  CREATE INDEX "_associations_v_version_sources_parent_id_idx" ON "_associations_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_associations_v_parent_idx" ON "_associations_v" USING btree ("parent_id");
  CREATE INDEX "_associations_v_version_version_slug_idx" ON "_associations_v" USING btree ("version_slug");
  CREATE INDEX "_associations_v_version_seo_version_seo_image_idx" ON "_associations_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_associations_v_version_version_skill_idx" ON "_associations_v" USING btree ("version_skill_id");
  CREATE INDEX "_associations_v_version_version_updated_at_idx" ON "_associations_v" USING btree ("version_updated_at");
  CREATE INDEX "_associations_v_version_version_created_at_idx" ON "_associations_v" USING btree ("version_created_at");
  CREATE INDEX "_associations_v_version_version__status_idx" ON "_associations_v" USING btree ("version__status");
  CREATE INDEX "_associations_v_created_at_idx" ON "_associations_v" USING btree ("created_at");
  CREATE INDEX "_associations_v_updated_at_idx" ON "_associations_v" USING btree ("updated_at");
  CREATE INDEX "_associations_v_latest_idx" ON "_associations_v" USING btree ("latest");
  CREATE INDEX "_associations_v_rels_order_idx" ON "_associations_v_rels" USING btree ("order");
  CREATE INDEX "_associations_v_rels_parent_idx" ON "_associations_v_rels" USING btree ("parent_id");
  CREATE INDEX "_associations_v_rels_path_idx" ON "_associations_v_rels" USING btree ("path");
  CREATE INDEX "_associations_v_rels_media_id_idx" ON "_associations_v_rels" USING btree ("media_id");
  CREATE INDEX "_associations_v_rels_projects_id_idx" ON "_associations_v_rels" USING btree ("projects_id");
  CREATE INDEX "_associations_v_rels_education_id_idx" ON "_associations_v_rels" USING btree ("education_id");
  CREATE INDEX "_associations_v_rels_experiences_id_idx" ON "_associations_v_rels" USING btree ("experiences_id");
  CREATE INDEX "_associations_v_rels_professional_sections_id_idx" ON "_associations_v_rels" USING btree ("professional_sections_id");
  CREATE INDEX "site_settings_sources_order_idx" ON "site_settings_sources" USING btree ("_order");
  CREATE INDEX "site_settings_sources_parent_id_idx" ON "site_settings_sources" USING btree ("_parent_id");
  CREATE INDEX "site_settings_navigation_order_idx" ON "site_settings_navigation" USING btree ("_order");
  CREATE INDEX "site_settings_navigation_parent_id_idx" ON "site_settings_navigation" USING btree ("_parent_id");
  CREATE INDEX "site_settings_section_order_order_idx" ON "site_settings_section_order" USING btree ("_order");
  CREATE INDEX "site_settings_section_order_parent_id_idx" ON "site_settings_section_order" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_slug_idx" ON "site_settings" USING btree ("slug");
  CREATE INDEX "site_settings_seo_seo_image_idx" ON "site_settings" USING btree ("seo_image_id");
  CREATE INDEX "site_settings_resume_idx" ON "site_settings" USING btree ("resume_id");
  CREATE INDEX "site_settings_updated_at_idx" ON "site_settings" USING btree ("updated_at");
  CREATE INDEX "site_settings_created_at_idx" ON "site_settings" USING btree ("created_at");
  CREATE INDEX "site_settings__status_idx" ON "site_settings" USING btree ("_status");
  CREATE INDEX "site_settings_rels_order_idx" ON "site_settings_rels" USING btree ("order");
  CREATE INDEX "site_settings_rels_parent_idx" ON "site_settings_rels" USING btree ("parent_id");
  CREATE INDEX "site_settings_rels_path_idx" ON "site_settings_rels" USING btree ("path");
  CREATE INDEX "site_settings_rels_media_id_idx" ON "site_settings_rels" USING btree ("media_id");
  CREATE INDEX "_site_settings_v_version_sources_order_idx" ON "_site_settings_v_version_sources" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_sources_parent_id_idx" ON "_site_settings_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_navigation_order_idx" ON "_site_settings_v_version_navigation" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_navigation_parent_id_idx" ON "_site_settings_v_version_navigation" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_section_order_order_idx" ON "_site_settings_v_version_section_order" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_section_order_parent_id_idx" ON "_site_settings_v_version_section_order" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_parent_idx" ON "_site_settings_v" USING btree ("parent_id");
  CREATE INDEX "_site_settings_v_version_version_slug_idx" ON "_site_settings_v" USING btree ("version_slug");
  CREATE INDEX "_site_settings_v_version_seo_version_seo_image_idx" ON "_site_settings_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_site_settings_v_version_version_resume_idx" ON "_site_settings_v" USING btree ("version_resume_id");
  CREATE INDEX "_site_settings_v_version_version_updated_at_idx" ON "_site_settings_v" USING btree ("version_updated_at");
  CREATE INDEX "_site_settings_v_version_version_created_at_idx" ON "_site_settings_v" USING btree ("version_created_at");
  CREATE INDEX "_site_settings_v_version_version__status_idx" ON "_site_settings_v" USING btree ("version__status");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "_site_settings_v" USING btree ("updated_at");
  CREATE INDEX "_site_settings_v_latest_idx" ON "_site_settings_v" USING btree ("latest");
  CREATE INDEX "_site_settings_v_rels_order_idx" ON "_site_settings_v_rels" USING btree ("order");
  CREATE INDEX "_site_settings_v_rels_parent_idx" ON "_site_settings_v_rels" USING btree ("parent_id");
  CREATE INDEX "_site_settings_v_rels_path_idx" ON "_site_settings_v_rels" USING btree ("path");
  CREATE INDEX "_site_settings_v_rels_media_id_idx" ON "_site_settings_v_rels" USING btree ("media_id");
  CREATE INDEX "design_themes_updated_at_idx" ON "design_themes" USING btree ("updated_at");
  CREATE INDEX "design_themes_created_at_idx" ON "design_themes" USING btree ("created_at");
  CREATE INDEX "design_themes__status_idx" ON "design_themes" USING btree ("_status");
  CREATE INDEX "_design_themes_v_parent_idx" ON "_design_themes_v" USING btree ("parent_id");
  CREATE INDEX "_design_themes_v_version_version_updated_at_idx" ON "_design_themes_v" USING btree ("version_updated_at");
  CREATE INDEX "_design_themes_v_version_version_created_at_idx" ON "_design_themes_v" USING btree ("version_created_at");
  CREATE INDEX "_design_themes_v_version_version__status_idx" ON "_design_themes_v" USING btree ("version__status");
  CREATE INDEX "_design_themes_v_created_at_idx" ON "_design_themes_v" USING btree ("created_at");
  CREATE INDEX "_design_themes_v_updated_at_idx" ON "_design_themes_v" USING btree ("updated_at");
  CREATE INDEX "_design_themes_v_latest_idx" ON "_design_themes_v" USING btree ("latest");
  CREATE INDEX "publication_snapshots_updated_at_idx" ON "publication_snapshots" USING btree ("updated_at");
  CREATE INDEX "publication_snapshots_created_at_idx" ON "publication_snapshots" USING btree ("created_at");
  CREATE UNIQUE INDEX "publication_state_singleton_idx" ON "publication_state" USING btree ("singleton");
  CREATE INDEX "publication_state_snapshot_idx" ON "publication_state" USING btree ("snapshot_id");
  CREATE INDEX "publication_state_updated_at_idx" ON "publication_state" USING btree ("updated_at");
  CREATE INDEX "publication_state_created_at_idx" ON "publication_state" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_owners_id_idx" ON "payload_locked_documents_rels" USING btree ("owners_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_skills_id_idx" ON "payload_locked_documents_rels" USING btree ("skills_id");
  CREATE INDEX "payload_locked_documents_rels_experiences_id_idx" ON "payload_locked_documents_rels" USING btree ("experiences_id");
  CREATE INDEX "payload_locked_documents_rels_education_id_idx" ON "payload_locked_documents_rels" USING btree ("education_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_profile_id_idx" ON "payload_locked_documents_rels" USING btree ("profile_id");
  CREATE INDEX "payload_locked_documents_rels_professional_sections_id_idx" ON "payload_locked_documents_rels" USING btree ("professional_sections_id");
  CREATE INDEX "payload_locked_documents_rels_associations_id_idx" ON "payload_locked_documents_rels" USING btree ("associations_id");
  CREATE INDEX "payload_locked_documents_rels_site_settings_id_idx" ON "payload_locked_documents_rels" USING btree ("site_settings_id");
  CREATE INDEX "payload_locked_documents_rels_design_themes_id_idx" ON "payload_locked_documents_rels" USING btree ("design_themes_id");
  CREATE INDEX "payload_locked_documents_rels_publication_snapshots_id_idx" ON "payload_locked_documents_rels" USING btree ("publication_snapshots_id");
  CREATE INDEX "payload_locked_documents_rels_publication_state_id_idx" ON "payload_locked_documents_rels" USING btree ("publication_state_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_owners_id_idx" ON "payload_preferences_rels" USING btree ("owners_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "owners_sessions" CASCADE;
  DROP TABLE "owners" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "skills_sources" CASCADE;
  DROP TABLE "skills_aliases" CASCADE;
  DROP TABLE "skills" CASCADE;
  DROP TABLE "skills_rels" CASCADE;
  DROP TABLE "_skills_v_version_sources" CASCADE;
  DROP TABLE "_skills_v_version_aliases" CASCADE;
  DROP TABLE "_skills_v" CASCADE;
  DROP TABLE "_skills_v_rels" CASCADE;
  DROP TABLE "experiences_sources" CASCADE;
  DROP TABLE "experiences_roles" CASCADE;
  DROP TABLE "experiences" CASCADE;
  DROP TABLE "experiences_rels" CASCADE;
  DROP TABLE "_experiences_v_version_sources" CASCADE;
  DROP TABLE "_experiences_v_version_roles" CASCADE;
  DROP TABLE "_experiences_v" CASCADE;
  DROP TABLE "_experiences_v_rels" CASCADE;
  DROP TABLE "education_sources" CASCADE;
  DROP TABLE "education" CASCADE;
  DROP TABLE "education_rels" CASCADE;
  DROP TABLE "_education_v_version_sources" CASCADE;
  DROP TABLE "_education_v" CASCADE;
  DROP TABLE "_education_v_rels" CASCADE;
  DROP TABLE "projects_sources" CASCADE;
  DROP TABLE "projects_links" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_rels" CASCADE;
  DROP TABLE "_projects_v_version_sources" CASCADE;
  DROP TABLE "_projects_v_version_links" CASCADE;
  DROP TABLE "_projects_v" CASCADE;
  DROP TABLE "_projects_v_rels" CASCADE;
  DROP TABLE "posts_sources" CASCADE;
  DROP TABLE "posts_categories" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  DROP TABLE "_posts_v_version_sources" CASCADE;
  DROP TABLE "_posts_v_version_categories" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "_posts_v_rels" CASCADE;
  DROP TABLE "profile_sources" CASCADE;
  DROP TABLE "profile_links" CASCADE;
  DROP TABLE "profile_contact" CASCADE;
  DROP TABLE "profile" CASCADE;
  DROP TABLE "profile_rels" CASCADE;
  DROP TABLE "_profile_v_version_sources" CASCADE;
  DROP TABLE "_profile_v_version_links" CASCADE;
  DROP TABLE "_profile_v_version_contact" CASCADE;
  DROP TABLE "_profile_v" CASCADE;
  DROP TABLE "_profile_v_rels" CASCADE;
  DROP TABLE "professional_sections_sources" CASCADE;
  DROP TABLE "professional_sections" CASCADE;
  DROP TABLE "professional_sections_rels" CASCADE;
  DROP TABLE "_professional_sections_v_version_sources" CASCADE;
  DROP TABLE "_professional_sections_v" CASCADE;
  DROP TABLE "_professional_sections_v_rels" CASCADE;
  DROP TABLE "associations_sources" CASCADE;
  DROP TABLE "associations" CASCADE;
  DROP TABLE "associations_rels" CASCADE;
  DROP TABLE "_associations_v_version_sources" CASCADE;
  DROP TABLE "_associations_v" CASCADE;
  DROP TABLE "_associations_v_rels" CASCADE;
  DROP TABLE "site_settings_sources" CASCADE;
  DROP TABLE "site_settings_navigation" CASCADE;
  DROP TABLE "site_settings_section_order" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_rels" CASCADE;
  DROP TABLE "_site_settings_v_version_sources" CASCADE;
  DROP TABLE "_site_settings_v_version_navigation" CASCADE;
  DROP TABLE "_site_settings_v_version_section_order" CASCADE;
  DROP TABLE "_site_settings_v" CASCADE;
  DROP TABLE "_site_settings_v_rels" CASCADE;
  DROP TABLE "design_themes" CASCADE;
  DROP TABLE "_design_themes_v" CASCADE;
  DROP TABLE "publication_snapshots" CASCADE;
  DROP TABLE "publication_state" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_owners_role";
  DROP TYPE "public"."enum_media_kind";
  DROP TYPE "public"."enum_skills_status";
  DROP TYPE "public"."enum__skills_v_version_status";
  DROP TYPE "public"."enum_experiences_status";
  DROP TYPE "public"."enum__experiences_v_version_status";
  DROP TYPE "public"."enum_education_status";
  DROP TYPE "public"."enum__education_v_version_status";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum__projects_v_version_status";
  DROP TYPE "public"."enum_posts_kind";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_kind";
  DROP TYPE "public"."enum__posts_v_version_status";
  DROP TYPE "public"."enum_profile_status";
  DROP TYPE "public"."enum__profile_v_version_status";
  DROP TYPE "public"."enum_professional_sections_kind";
  DROP TYPE "public"."enum_professional_sections_status";
  DROP TYPE "public"."enum__professional_sections_v_version_kind";
  DROP TYPE "public"."enum__professional_sections_v_version_status";
  DROP TYPE "public"."enum_associations_status";
  DROP TYPE "public"."enum__associations_v_version_status";
  DROP TYPE "public"."enum_site_settings_status";
  DROP TYPE "public"."enum__site_settings_v_version_status";
  DROP TYPE "public"."enum_design_themes_status";
  DROP TYPE "public"."enum__design_themes_v_version_status";`);
}
