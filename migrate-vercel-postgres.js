// Migrate Vercel Postgres database
const { Client } = require('pg');

async function migrateVercelPostgres() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    console.log('Please set: export DATABASE_URL="postgres://..."');
    process.exit(1);
  }

  console.log('🔗 Migrating Vercel Postgres database...');
  console.log('📍 Connection string:', connectionString.replace(/:[^:@]+@/, ':***@'));

  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Vercel Postgres successfully!');

    // Create organizations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('✅ Created organizations table');

    // Create projects table
    await client.query(`
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
    `);
    console.log('✅ Created projects table');

    // Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        budget DECIMAL(15,2),
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP
      );
    `);
    console.log('✅ Created categories table');

    // Create tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'WAITING',
        priority INTEGER DEFAULT 1,
        estimated_hours DECIMAL(8,2),
        actual_hours DECIMAL(8,2),
        due_date TIMESTAMP,
        assigned_to TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP
      );
    `);
    console.log('✅ Created tasks table');

    // Create daily_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_logs (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        log_date DATE NOT NULL,
        weather TEXT,
        temperature DECIMAL(5,2),
        notes TEXT,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP
      );
    `);
    console.log('✅ Created daily_logs table');

    // Create daily_log_tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_log_tasks (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        daily_log_id TEXT NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'WAITING',
        progress INTEGER DEFAULT 0,
        notes TEXT,
        hours_worked DECIMAL(8,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE(daily_log_id, task_id)
      );
    `);
    console.log('✅ Created daily_log_tasks table');

    // Create media_assets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        daily_log_id TEXT REFERENCES daily_logs(id) ON DELETE CASCADE,
        cloudinary_public_id TEXT NOT NULL,
        cloudinary_url TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        kind TEXT NOT NULL DEFAULT 'IMAGE',
        filename TEXT,
        mime_type TEXT,
        size_bytes BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP
      );
    `);
    console.log('✅ Created media_assets table');

    // Create transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        description TEXT,
        reference TEXT,
        transaction_date TIMESTAMP NOT NULL,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP
      );
    `);
    console.log('✅ Created transactions table');

    // Create share_links table
    await client.query(`
      CREATE TABLE IF NOT EXISTS share_links (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        hide_financial BOOLEAN DEFAULT false,
        expires_at TIMESTAMP,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP
      );
    `);
    console.log('✅ Created share_links table');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS projects_org_id_idx ON projects(org_id);
      CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
      CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at);
      CREATE INDEX IF NOT EXISTS categories_project_id_idx ON categories(project_id);
      CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS tasks_category_id_idx ON tasks(category_id);
      CREATE INDEX IF NOT EXISTS daily_logs_project_id_idx ON daily_logs(project_id);
      CREATE INDEX IF NOT EXISTS daily_logs_log_date_idx ON daily_logs(log_date);
      CREATE INDEX IF NOT EXISTS daily_log_tasks_daily_log_id_idx ON daily_log_tasks(daily_log_id);
      CREATE INDEX IF NOT EXISTS media_assets_project_id_idx ON media_assets(project_id);
      CREATE INDEX IF NOT EXISTS transactions_project_id_idx ON transactions(project_id);
      CREATE INDEX IF NOT EXISTS share_links_project_id_idx ON share_links(project_id);
      CREATE INDEX IF NOT EXISTS share_links_token_idx ON share_links(token);
    `);
    console.log('✅ Created indexes');

    // Insert default organization
    await client.query(`
      INSERT INTO organizations (id, name, slug) 
      VALUES ('org_e2e_default', 'Default Organization', 'default-org')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Inserted default organization');

    // Insert sample projects
    await client.query(`
      INSERT INTO projects (id, org_id, name, description, status, budget, start_date, end_date, address, client_name, client_contact) 
      VALUES 
        ('proj_1', 'org_e2e_default', 'Test Project 1', 'Test description 1', 'PLANNING', 1000000, '2024-01-01', '2024-12-31', 'Test Address 1', 'Client 1', '0901234567'),
        ('proj_2', 'org_e2e_default', 'Test Project 2', 'Test description 2', 'IN_PROGRESS', 2000000, '2024-02-01', '2024-11-30', 'Test Address 2', 'Client 2', '0901234568'),
        ('proj_3', 'org_e2e_default', 'Test Project 3', 'Test description 3', 'DONE', 3000000, '2024-03-01', '2024-10-31', 'Test Address 3', 'Client 3', '0901234569')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Inserted sample projects');

    // Verify data
    const countResult = await client.query('SELECT COUNT(*) FROM projects');
    console.log('📈 Total projects:', countResult.rows[0].count);

    console.log('🎉 Vercel Postgres migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateVercelPostgres();
