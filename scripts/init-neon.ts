/**
 * Initialize Neon PostgreSQL database
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/init-neon.ts
 *
 * Or set DATABASE_URL in your .env file and run:
 *   npx tsx scripts/init-neon.ts
 */
import { Pool } from 'pg';
import { initPgSchema } from '../packages/database/src/pg-schema';
import { seedPgDatabase } from '../packages/database/src/pg-seed';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith('postgresql://')) {
    console.error('❌ DATABASE_URL not set or not a PostgreSQL connection string');
    console.error('');
    console.error('Usage:');
    console.error('  DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" npx tsx scripts/init-neon.ts');
    process.exit(1);
  }

  console.log('🔌 Connecting to Neon PostgreSQL...');
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

  try {
    // Test connection
    const { rows } = await pool.query('SELECT version()');
    console.log(`✅ Connected: ${rows[0].version.split(',')[0]}`);

    // Create schema
    console.log('📋 Creating tables...');
    await initPgSchema(pool);

    // Seed data
    console.log('🌱 Seeding data...');
    await seedPgDatabase(pool);

    // Verify
    const roles = await pool.query('SELECT COUNT(*) as c FROM roles');
    const users = await pool.query('SELECT COUNT(*) as c FROM users');
    const orgs = await pool.query('SELECT COUNT(*) as c FROM organisations');
    const apps = await pool.query('SELECT COUNT(*) as c FROM applications');

    console.log('');
    console.log('📊 Database state:');
    console.log(`   Roles: ${roles.rows[0].c}`);
    console.log(`   Users: ${users.rows[0].c}`);
    console.log(`   Organisations: ${orgs.rows[0].c}`);
    console.log(`   Applications: ${apps.rows[0].c}`);
    console.log('');
    console.log('✅ Neon PostgreSQL initialized successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Set DATABASE_URL in Render environment variables');
    console.log('  2. Redeploy the iaas-api service');
    console.log('  3. Data will persist permanently across deploys');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
