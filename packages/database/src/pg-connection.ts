import { Pool } from 'pg';

let pool: Pool | null = null;

export function isPostgresEnabled(): boolean {
  return (process.env.DATABASE_URL || '').startsWith('postgresql://');
}

/**
 * Certificate verification is on.
 *
 * This used to rewrite a caller-supplied `sslmode=require` down to `sslmode=no-verify`
 * and set `rejectUnauthorized: false`. The connection was then encrypted but
 * *unauthenticated*: anyone able to intercept the path to the database could present
 * their own certificate and read or rewrite every query — the queries carrying NI
 * numbers, addresses, debts and income. CWE-295, and a predictable ITHC finding on the
 * data tier.
 *
 * Neon's chain roots in ISRG, so the system trust store is sufficient and no CA bundle
 * needs shipping. `DATABASE_CA_CERT` is honoured for a provider that needs an explicit
 * root.
 *
 * `DATABASE_SSL_INSECURE=true` restores the old behaviour for a local proxy with a
 * self-signed certificate, and is refused outright in production rather than trusted —
 * the previous arrangement's real cost was that it applied everywhere, silently.
 */
function sslConfig(): { ca?: string; rejectUnauthorized: boolean } | undefined {
  const url = process.env.DATABASE_URL ?? '';
  // A local, unencrypted Postgres (docker-compose) needs no TLS at all.
  if (url.includes('sslmode=disable')) return undefined;

  if (process.env.DATABASE_SSL_INSECURE === 'true') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'DATABASE_SSL_INSECURE=true is refused in production: it disables certificate ' +
        'verification on a connection carrying personal financial data.'
      );
    }
    console.warn(
      '[Database] DATABASE_SSL_INSECURE=true — certificate verification is DISABLED. ' +
      'Never set this outside local development.'
    );
    return { rejectUnauthorized: false };
  }

  return { ca: process.env.DATABASE_CA_CERT, rejectUnauthorized: true };
}

export function getPgPool(): Pool {
  if (!pool) {
    pool = new Pool({
      // Passed through unmodified. Rewriting the caller's sslmode was how verification
      // came to be off everywhere.
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig(),
      max: 5,
      // Without these, a Neon suspension mid-session leaves requests hanging on a dead
      // socket for the OS default — minutes, from the caller's point of view.
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return pool;
}

export async function closePgPool(): Promise<void> {
  if (pool) { await pool.end(); pool = null; }
}
