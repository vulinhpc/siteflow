import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePGlite } from "drizzle-orm/pglite";

import * as schema from '@/models/Schema';

let db: any;

if (process.env.NODE_ENV === "production") {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing in production");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  db = drizzlePg(pool, { schema });
  console.log("[DB] ✅ Connected to Postgres Cloud");
} else {
  const client = new PGlite({ dataDir: "./.local-db" });
  db = drizzlePGlite(client, { schema });
  console.log("[DB] Using PGlite local");
}

export { db };