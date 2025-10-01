import path from 'node:path';

import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';

import * as schema from '@/models/Schema';

import { Env } from './Env';

type GlobalDbState = {
  pgClient?: Client;
  pgDrizzle?: NodePgDatabase<typeof schema>;
};

const globalDbState = globalThis as typeof globalThis & { __db?: GlobalDbState };

if (!globalDbState.__db) {
  globalDbState.__db = {};
}

let drizzle;

if (Env.DATABASE_URL) {
  if (!globalDbState.__db.pgClient) {
    const client = new Client({
      connectionString: Env.DATABASE_URL,
    });
    await client.connect();

    globalDbState.__db.pgClient = client;
    globalDbState.__db.pgDrizzle = drizzlePg(client, { schema });
  }

  drizzle = globalDbState.__db.pgDrizzle!;

  // Run migrations on PostgreSQL
  try {
    console.log('Running PostgreSQL migrations...');
    await migratePg(drizzle, {
      migrationsFolder: path.join(process.cwd(), 'migrations'),
    });
    console.log('PostgreSQL migrations completed successfully');
  } catch (error) {
    console.warn('Migration failed, continuing without migrations:', error);
  }
} else {
  throw new Error('DATABASE_URL is required but not provided');
}

export const db = drizzle;

