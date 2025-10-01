import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePGlite } from 'drizzle-orm/pglite';
import { Pool } from 'pg';

import * as schema from '@/models/Schema';

let db: any;

if (process.env.NODE_ENV === 'production') {
  // ✅ PRODUCTION: Force PostgreSQL Cloud only - NO FALLBACK
  console.log('[DB] Production mode detected');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production environment');
  }

  // Validate DATABASE_URL is not localhost
  if (process.env.DATABASE_URL.includes('127.0.0.1') || process.env.DATABASE_URL.includes('localhost')) {
    throw new Error('DATABASE_URL cannot be localhost in production. Use cloud PostgreSQL (Neon, Supabase, etc.)');
  }

  // Log masked DATABASE_URL for debugging
  const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@');
  console.log('[DB] Connecting to PostgreSQL Cloud:', maskedUrl);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Required for Neon/Render/Supabase
  });

  // Test connection immediately
  (async () => {
    try {
      console.log('[DB] Testing connection...');
      await pool.query('SELECT 1');
      console.log('[DB] ✅ Connected to Postgres Cloud');
    } catch (error) {
      console.error('[DB] ❌ Connection failed:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })();

  db = drizzlePg(pool, { schema });

  // NO AUTO-MIGRATE in production - migrations must be run manually before deploy
} else {
  // ✅ DEVELOPMENT/TEST: Force PGLite only
  console.log('[DB] Development mode detected');
  console.log('[DB] Using PGLite local database...');

  const client = new PGlite({ dataDir: './.local-db' });
  db = drizzlePGlite(client, { schema });
  console.log('[DB] ✅ Using PGlite local');

  // Run PGLite migrations for development
  (async () => {
    try {
      console.log('[DB] Running PGLite migrations...');

      // Create basic schema for PGLite - simplified to avoid errors
      const createSchemaSQL = `
        -- Create organizations table
        CREATE TABLE IF NOT EXISTS organizations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        -- Create projects table
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          org_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'PLANNING',
          budget TEXT,
          start_date TIMESTAMP,
          end_date TIMESTAMP,
          address TEXT,
          client_name TEXT,
          client_contact TEXT,
          thumbnail_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          deleted_at TIMESTAMP
        );

        -- Insert default organization
        INSERT INTO organizations (id, name, slug) 
        VALUES ('org_sample_123', 'Sample Organization', 'sample-org')
        ON CONFLICT (id) DO NOTHING;
      `;

      await client.exec(createSchemaSQL);
      console.log('[DB] ✅ PGLite schema created successfully');
    } catch (error) {
      console.warn('[DB] ⚠️ PGLite migration failed:', error);
    }
  })();
}

export { db };
