-- Migration: Explicit Schema Updates
-- Add columns to projects, daily_logs, transactions, share_links tables

-- ============================================================================
-- PROJECTS TABLE - ADD COLUMNS
-- ============================================================================

-- Add budget_total column
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "budget_total" numeric(15,2);

-- Add currency column with default
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'VND';

-- Add address column
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "address" text;

-- Add scale column (jsonb)
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "scale" jsonb;

-- Add investor_name column
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "investor_name" text;

-- Add investor_phone column
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "investor_phone" text;

-- Add description column
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "description" text;

-- Add thumbnail_url column
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "thumbnail_url" text;

-- Add end_date column
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "end_date" date;

-- ============================================================================
-- DAILY_LOGS TABLE - RENAME AND ADD COLUMNS
-- ============================================================================

-- Rename log_date to date (if log_date exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'daily_logs' AND column_name = 'log_date') THEN
        ALTER TABLE "daily_logs" RENAME COLUMN "log_date" TO "date";
    END IF;
END $$;

-- Add status enum and column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'daily_log_status') THEN
        CREATE TYPE "daily_log_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'DECLINED');
    END IF;
END $$;

ALTER TABLE "daily_logs" ADD COLUMN IF NOT EXISTS "status" "daily_log_status" DEFAULT 'DRAFT';

-- Add review_comment column
ALTER TABLE "daily_logs" ADD COLUMN IF NOT EXISTS "review_comment" text;

-- Add qc_rating column (smallint for 1-5 rating)
ALTER TABLE "daily_logs" ADD COLUMN IF NOT EXISTS "qc_rating" smallint;

-- ============================================================================
-- TRANSACTIONS TABLE - ADD COLUMNS
-- ============================================================================

-- Add payment_status enum and column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE "payment_status" AS ENUM('PENDING', 'PARTIAL', 'PAID');
    END IF;
END $$;

ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "payment_status" "payment_status" DEFAULT 'PENDING';

-- Add paid_amount column with default 0
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "paid_amount" numeric(15,2) DEFAULT 0;

-- Add payment_date column
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "payment_date" date;

-- Add attachments column (jsonb array)
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "attachments" jsonb;

-- ============================================================================
-- SHARE_LINKS TABLE - ADD COLUMNS
-- ============================================================================

-- Add hide_finance column with default false
ALTER TABLE "share_links" ADD COLUMN IF NOT EXISTS "hide_finance" boolean DEFAULT false;

-- Add show_investor_contact column with default false
ALTER TABLE "share_links" ADD COLUMN IF NOT EXISTS "show_investor_contact" boolean DEFAULT false;

-- ============================================================================
-- CREATE INDEXES FOR NEW COLUMNS
-- ============================================================================

-- Index for daily_logs.status
CREATE INDEX IF NOT EXISTS "daily_logs_status_idx" ON "daily_logs" ("status");

-- Index for transactions.payment_status
CREATE INDEX IF NOT EXISTS "transactions_payment_status_idx" ON "transactions" ("payment_status");

-- Index for daily_logs.date (if renamed)
CREATE INDEX IF NOT EXISTS "daily_logs_date_idx" ON "daily_logs" ("date");
DROP INDEX IF EXISTS "daily_logs_log_date_idx";

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN "projects"."budget_total" IS 'Total project budget in specified currency';
COMMENT ON COLUMN "projects"."scale" IS 'Project scale information (area, floors, etc.) in JSON format';
COMMENT ON COLUMN "daily_logs"."qc_rating" IS 'Quality control rating from 1 to 5';
COMMENT ON COLUMN "transactions"."payment_status" IS 'Payment status: PENDING, PARTIAL, or PAID';
COMMENT ON COLUMN "transactions"."attachments" IS 'Payment receipts and documents in JSON array format';
