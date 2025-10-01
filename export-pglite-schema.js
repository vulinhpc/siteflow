// Export PGLite schema to SQL file
const { PGlite } = require('@electric-sql/pglite');
const fs = require('fs');

async function exportSchema() {
  console.log('🔗 Creating PGLite database...');
  
  const client = new PGlite({ dataDir: './.local-db' });
  
  try {
    // Create schema
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
      INSERT INTO organizations (id, name, slug) 
      VALUES ('org_e2e_default', 'Default Organization', 'default-org')
      ON CONFLICT (id) DO NOTHING;

      -- Insert sample projects
      INSERT INTO projects (id, org_id, name, description, status, budget, start_date, end_date, address, client_name, client_contact) 
      VALUES 
        ('proj_1', 'org_e2e_default', 'Test Project 1', 'Test description 1', 'PLANNING', 1000000, '2024-01-01', '2024-12-31', 'Test Address 1', 'Client 1', '0901234567'),
        ('proj_2', 'org_e2e_default', 'Test Project 2', 'Test description 2', 'IN_PROGRESS', 2000000, '2024-02-01', '2024-11-30', 'Test Address 2', 'Client 2', '0901234568'),
        ('proj_3', 'org_e2e_default', 'Test Project 3', 'Test description 3', 'DONE', 3000000, '2024-03-01', '2024-10-31', 'Test Address 3', 'Client 3', '0901234569')
      ON CONFLICT (id) DO NOTHING;
    `;

    await client.exec(createSchemaSQL);
    console.log('✅ Schema created in PGLite');

    // Export schema to SQL file
    const schemaSQL = `
-- SiteFlow Database Schema
-- Generated from PGLite for production use

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
INSERT INTO organizations (id, name, slug) 
VALUES ('org_e2e_default', 'Default Organization', 'default-org')
ON CONFLICT (id) DO NOTHING;

-- Insert sample projects
INSERT INTO projects (id, org_id, name, description, status, budget, start_date, end_date, address, client_name, client_contact) 
VALUES 
  ('proj_1', 'org_e2e_default', 'Test Project 1', 'Test description 1', 'PLANNING', 1000000, '2024-01-01', '2024-12-31', 'Test Address 1', 'Client 1', '0901234567'),
  ('proj_2', 'org_e2e_default', 'Test Project 2', 'Test description 2', 'IN_PROGRESS', 2000000, '2024-02-01', '2024-11-30', 'Test Address 2', 'Client 2', '0901234568'),
  ('proj_3', 'org_e2e_default', 'Test Project 3', 'Test description 3', 'DONE', 3000000, '2024-03-01', '2024-10-31', 'Test Address 3', 'Client 3', '0901234569')
ON CONFLICT (id) DO NOTHING;
    `;

    fs.writeFileSync('production-schema.sql', schemaSQL);
    console.log('✅ Schema exported to production-schema.sql');

    // Verify data
    const countResult = await client.query('SELECT COUNT(*) FROM projects');
    console.log('📈 Total projects in PGLite:', countResult.rows[0].count);

    console.log('🎉 Schema export completed successfully!');
    console.log('📁 Use production-schema.sql to create schema in your cloud database');
  } catch (error) {
    console.error('❌ Schema export failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

exportSchema();
