import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as drizzlePglite, type PgliteDatabase } from 'drizzle-orm/pglite';
import { Client } from 'pg';

import * as schema from '@/models/Schema';

import { Env } from './Env';

type GlobalDbState = {
  pgClient?: Client;
  pgDrizzle?: NodePgDatabase<typeof schema>;
  pgliteClient?: PGlite;
  pgliteDrizzle?: PgliteDatabase<typeof schema>;
  pgliteMigrated?: boolean;
};

const globalDbState = globalThis as typeof globalThis & { __db?: GlobalDbState };

if (!globalDbState.__db) {
  globalDbState.__db = {};
}


let drizzle;

if (Env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
  if (!globalDbState.__db.pgClient) {
    const client = new Client({
      connectionString: Env.DATABASE_URL,
    });
    await client.connect();

    globalDbState.__db.pgClient = client;
    globalDbState.__db.pgDrizzle = drizzlePg(client, { schema });
  }

  drizzle = globalDbState.__db.pgDrizzle!;

  // Only run migrations in development, not in production
  if (process.env.NODE_ENV === 'development') {
    try {
      await migratePg(drizzle, {
        migrationsFolder: path.join(process.cwd(), 'migrations'),
      });
    } catch (error) {
      console.warn('Migration failed, continuing without migrations:', error);
    }
  }
} else {
  if (!globalDbState.__db.pgliteClient) {
    const client = new PGlite();
    await client.waitReady;

    globalDbState.__db.pgliteClient = client;
    try {
      await runPgliteMigrations(client);
      globalDbState.__db.pgliteMigrated = true;
    } catch (error) {
      console.warn('PGLite migration failed, continuing without migrations:', error);
      globalDbState.__db.pgliteMigrated = true; // Mark as migrated to avoid retry
    }
    globalDbState.__db.pgliteDrizzle = drizzlePglite(client, { schema });
  } else if (!globalDbState.__db.pgliteMigrated && globalDbState.__db.pgliteClient) {
    try {
      await runPgliteMigrations(globalDbState.__db.pgliteClient);
      globalDbState.__db.pgliteMigrated = true;
    } catch (error) {
      console.warn('PGLite migration failed, continuing without migrations:', error);
      globalDbState.__db.pgliteMigrated = true; // Mark as migrated to avoid retry
    }
  }

  drizzle = globalDbState.__db.pgliteDrizzle!;
}

export const db = drizzle;

async function runPgliteMigrations(client: PGlite) {
  // Create basic schema for PGLite
  const createSchemaSQL = `
    -- Create organizations table
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Create projects table
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'PLANNING',
      budget DECIMAL(15,2),
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      address TEXT,
      client_name VARCHAR(255),
      client_contact VARCHAR(255),
      thumbnail_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      deleted_at TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS projects_org_id_idx ON projects(org_id);
    CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
    CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at);

    -- Insert default organization
    INSERT OR IGNORE INTO organizations (id, name, slug) 
    VALUES ('org_e2e_default', 'Default Organization', 'default-org');
  `;

  try {
    await client.exec(createSchemaSQL);
    console.log('PGLite schema created successfully');
  } catch (error) {
    console.warn('PGLite schema creation failed:', error);
    throw error;
  }
}
