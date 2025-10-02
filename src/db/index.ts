import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePGlite } from 'drizzle-orm/pglite';
import { Pool } from 'pg';

import * as schema from '@/models/Schema';

const db: any = (() => {
  if (process.env.NODE_ENV === 'production') {
    // ✅ PRODUCTION: Force PostgreSQL Cloud only - NO FALLBACK

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required in production environment');
    }

    // Validate DATABASE_URL is not localhost
    if (
      process.env.DATABASE_URL.includes('127.0.0.1')
      || process.env.DATABASE_URL.includes('localhost')
    ) {
      throw new Error(
        'DATABASE_URL cannot be localhost in production. Use cloud PostgreSQL (Neon, Supabase, etc.)',
      );
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Required for Neon/Render/Supabase
    });

    return drizzlePg(pool, { schema });

    // NO AUTO-MIGRATE in production - migrations must be run manually before deploy
  } else {
    // ✅ DEVELOPMENT/TEST: Force PGLite only

    const client = new PGlite({ dataDir: './.local-db' });
    const dbInstance = drizzlePGlite(client, { schema });

    // Run PGLite migrations for development
    (async () => {
      try {
        // Create canonical schema for PGLite with all new fields
        const createSchemaSQL = `
          -- Create ENUMs
          CREATE TYPE IF NOT EXISTS project_status AS ENUM('planning', 'in_progress', 'on_hold', 'completed');
          CREATE TYPE IF NOT EXISTS task_status AS ENUM('waiting', 'in_progress', 'done');
          CREATE TYPE IF NOT EXISTS log_task_status AS ENUM('waiting', 'in_progress', 'done');
          CREATE TYPE IF NOT EXISTS media_kind AS ENUM('image', 'video', 'document');
          CREATE TYPE IF NOT EXISTS transaction_type AS ENUM('advance', 'expense');
          CREATE TYPE IF NOT EXISTS cost_type AS ENUM('material', 'labor', 'equipment', 'other');
          CREATE TYPE IF NOT EXISTS daily_log_status AS ENUM('draft', 'submitted', 'approved', 'declined');
          CREATE TYPE IF NOT EXISTS payment_status AS ENUM('pending', 'partial', 'paid');

          -- Create organizations table
          CREATE TABLE IF NOT EXISTS organizations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
          );

          -- Create projects table with canonical fields
          CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            org_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            status project_status DEFAULT 'planning',
            budget_total NUMERIC(15,2),
            currency TEXT DEFAULT 'VND',
            address TEXT,
            scale JSONB,
            investor_name TEXT,
            investor_phone TEXT,
            thumbnail_url TEXT,
            start_date DATE NOT NULL,
            end_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            deleted_at TIMESTAMP
          );

          -- Create categories table
          CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            org_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            budget NUMERIC(15,2),
            order_index INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            deleted_at TIMESTAMP
          );

          -- Create tasks table
          CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            org_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            category_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            status task_status DEFAULT 'waiting',
            priority INTEGER DEFAULT 1,
            estimated_hours NUMERIC(8,2),
            actual_hours NUMERIC(8,2),
            due_date DATE,
            assigned_to TEXT,
            order_index INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            deleted_at TIMESTAMP
          );

          -- Create daily_logs table with canonical fields
          CREATE TABLE IF NOT EXISTS daily_logs (
            id TEXT PRIMARY KEY,
            org_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            category_id TEXT NOT NULL,
            date DATE NOT NULL,
            reporter_id TEXT NOT NULL,
            notes TEXT,
            media JSONB NOT NULL,
            status daily_log_status DEFAULT 'draft',
            review_comment TEXT,
            qc_rating SMALLINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            deleted_at TIMESTAMP
          );

          -- Create daily_log_tasks table
          CREATE TABLE IF NOT EXISTS daily_log_tasks (
            id TEXT PRIMARY KEY,
            org_id TEXT NOT NULL,
            daily_log_id TEXT NOT NULL,
            task_id TEXT NOT NULL,
            status log_task_status DEFAULT 'waiting',
            progress INTEGER DEFAULT 0,
            notes TEXT,
            hours_worked NUMERIC(8,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            UNIQUE(daily_log_id, task_id)
          );

          -- Create media_assets table with canonical fields
          CREATE TABLE IF NOT EXISTS media_assets (
            id TEXT PRIMARY KEY,
            org_id TEXT NOT NULL,
            project_id TEXT,
            url TEXT NOT NULL,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            deleted_at TIMESTAMP
          );

          -- Create transactions table with canonical fields
          CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            org_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            date DATE NOT NULL,
            type transaction_type NOT NULL,
            amount NUMERIC(15,2) NOT NULL,
            currency TEXT DEFAULT 'VND',
            cost_type cost_type NOT NULL,
            description TEXT,
            invoice_no TEXT,
            vendor TEXT,
            payment_status payment_status DEFAULT 'pending',
            paid_amount NUMERIC(15,2) DEFAULT 0,
            payment_date DATE,
            attachments JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            deleted_at TIMESTAMP
          );

          -- Create share_links table with canonical fields
          CREATE TABLE IF NOT EXISTS share_links (
            id TEXT PRIMARY KEY,
            org_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            hide_finance BOOLEAN DEFAULT false,
            show_investor_contact BOOLEAN DEFAULT false,
            expires_at TIMESTAMP,
            created_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            deleted_at TIMESTAMP
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS projects_org_id_idx ON projects(org_id);
          CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
          CREATE INDEX IF NOT EXISTS categories_project_id_idx ON categories(project_id);
          CREATE INDEX IF NOT EXISTS tasks_category_id_idx ON tasks(category_id);
          CREATE INDEX IF NOT EXISTS daily_logs_project_id_idx ON daily_logs(project_id);
          CREATE INDEX IF NOT EXISTS daily_logs_date_idx ON daily_logs(date);
          CREATE INDEX IF NOT EXISTS daily_logs_status_idx ON daily_logs(status);
          CREATE INDEX IF NOT EXISTS transactions_project_id_idx ON transactions(project_id);
          CREATE INDEX IF NOT EXISTS transactions_payment_status_idx ON transactions(payment_status);
          CREATE INDEX IF NOT EXISTS share_links_token_idx ON share_links(token);

          -- Insert default organization
          INSERT INTO organizations (id, name, slug) 
          VALUES ('org_sample_123', 'Sample Organization', 'sample-org')
          ON CONFLICT (id) DO NOTHING;
        `;

        await client.exec(createSchemaSQL);
      } catch {
        // PGLite migration failed silently in development
      }
    })();

    return dbInstance;
  }
})();

export { db };
