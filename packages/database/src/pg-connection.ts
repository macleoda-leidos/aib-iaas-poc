import { Pool } from 'pg';

let pool: Pool | null = null;

export function isPostgresEnabled(): boolean {
  return (process.env.DATABASE_URL || '').startsWith('postgresql://');
}

export function getPgPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL!.replace('sslmode=require', 'sslmode=no-verify');
    pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_URL!.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
      max: 5,
    });
  }
  return pool;
}

export async function closePgPool(): Promise<void> {
  if (pool) { await pool.end(); pool = null; }
}
