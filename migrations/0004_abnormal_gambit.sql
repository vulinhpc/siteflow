CREATE TYPE "public"."daily_log_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'DECLINED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PARTIAL', 'PAID');--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "end_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "daily_logs" ADD COLUMN "status" "daily_log_status" DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_logs" ADD COLUMN "review_comment" text;--> statement-breakpoint
ALTER TABLE "daily_logs" ADD COLUMN "qc_rating" smallint;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "budget_total" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "currency" text DEFAULT 'VND';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "scale" json;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "investor_name" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "investor_phone" text;--> statement-breakpoint
ALTER TABLE "share_links" ADD COLUMN "hide_finance" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "share_links" ADD COLUMN "show_investor_contact" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "paid_amount" numeric(15, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_date" date;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "attachments" json;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_logs_status_idx" ON "daily_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_payment_status_idx" ON "transactions" USING btree ("payment_status");