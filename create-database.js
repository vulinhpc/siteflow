// Create database for migration
const { Client } = require('pg');

async function createDatabase() {
  // Connect to postgres database to create siteflow database
  const connectionString = process.env.DATABASE_URL?.replace('/siteflow', '/postgres') || 'postgresql://postgres:Khacbiet1!@localhost:5432/postgres?sslmode=disable';

  console.log('🔗 Creating database...');
  console.log('📍 Connection string:', connectionString.replace(/:[^:@]+@/, ':***@'));

  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL successfully!');

    // Create database
    await client.query('CREATE DATABASE siteflow;');
    console.log('✅ Created siteflow database');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️ Database siteflow already exists');
    } else {
      console.error('❌ Database creation failed:', error.message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

createDatabase();
