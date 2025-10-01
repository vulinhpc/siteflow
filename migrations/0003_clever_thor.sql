DROP INDEX IF EXISTS "project_members_project_user_idx";--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "start_date" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "project_members_project_user_role_idx" ON "project_members" USING btree ("project_id","user_id","role");