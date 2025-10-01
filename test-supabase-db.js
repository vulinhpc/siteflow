// Test script for Supabase database connection
const { Client } = require('pg');

async function testSupabaseDatabase() {
  // Supabase free tier connection string (replace with real one)
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@db.abcdefghijklmnop.supabase.co:5432/postgres?sslmode=require';

  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    console.log('Please set: export DATABASE_URL="postgresql://..."');
    process.exit(1);
  }

  console.log('🔗 Testing Supabase database connection...');
  console.log('📍 Connection string:', connectionString.replace(/:[^:@]+@/, ':***@'));

  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database successfully!');

    // Test query
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);

    // Check if projects table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'projects'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Projects table exists');

      // Count projects
      const countResult = await client.query('SELECT COUNT(*) FROM projects');
      console.log('📈 Projects count:', countResult.rows[0].count);
    } else {
      console.log('⚠️  Projects table does not exist - need to run migrations');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testSupabaseDatabase();
