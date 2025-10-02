import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePGlite } from "drizzle-orm/pglite";
import { Pool } from "pg";

import * as schema from "@/models/Schema";

const db: any = (() => {
  if (process.env.NODE_ENV === "production") {
    // ✅ PRODUCTION: Force PostgreSQL Cloud only - NO FALLBACK

    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required in production environment");
    }

    // Validate DATABASE_URL is not localhost
    if (
      process.env.DATABASE_URL.includes("127.0.0.1") ||
      process.env.DATABASE_URL.includes("localhost")
    ) {
      throw new Error(
        "DATABASE_URL cannot be localhost in production. Use cloud PostgreSQL (Neon, Supabase, etc.)",
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

    const client = new PGlite({ dataDir: "./.local-db" });
    const dbInstance = drizzlePGlite(client, { schema });

    // Run PGLite migrations for development
    (async () => {
      try {
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
            start_date TIMESTAMP NOT NULL,
            end_date TIMESTAMP,
            address TEXT,
            client_name TEXT,
            client_contact TEXT,
            thumbnail_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            deleted_at TIMESTAMP
          );

          -- Create project_members table
          CREATE TABLE IF NOT EXISTS project_members (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            deleted_at TIMESTAMP,
            UNIQUE(project_id, user_id, role)
          );

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
