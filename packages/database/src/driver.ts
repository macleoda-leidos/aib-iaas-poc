/**
 * A single async query surface over both SQLite and PostgreSQL.
 *
 * The repositories were built on better-sqlite3, whose API is synchronous by
 * design, and `pg` is async only. Rather than fork every repository per driver,
 * they all target this interface: async everywhere, `?` placeholders everywhere,
 * and the adapter deals with the differences.
 *
 * Two of those differences are not optional:
 *
 *  - **Placeholders.** SQLite takes `?`; PostgreSQL takes `$1, $2, ...`. The
 *    repositories keep `?` and the PostgreSQL adapter rewrites them, so 129
 *    methods' worth of SQL did not have to be touched — and cannot drift apart
 *    per driver.
 *  - **Row shape.** `INSERT ... RETURNING` is PostgreSQL; better-sqlite3 reports
 *    `changes`/`lastInsertRowid` instead. `run()` therefore promises only what both
 *    can honestly provide: the number of rows affected.
 *
 * Keeping the SQLite adapter's methods `async` despite better-sqlite3 being
 * synchronous is deliberate. A single call signature means the route layer awaits
 * unconditionally, so the driver in use can never change whether a caller needs
 * `await` — which is precisely the class of bug that would otherwise appear only
 * under PostgreSQL, in production.
 */

import type Database from 'better-sqlite3';
import type { Pool } from 'pg';

export interface RunResult {
  /** Rows inserted, updated or deleted. */
  changes: number;
}

export interface DbDriver {
  /** First matching row, or undefined. */
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  /** All matching rows. */
  all<T = any>(sql: string, params?: any[]): Promise<T[]>;
  /** A statement returning no rows. */
  run(sql: string, params?: any[]): Promise<RunResult>;
  /** Run a set of statements atomically, rolling back on any failure. */
  transaction<T>(work: () => Promise<T>): Promise<T>;
  readonly dialect: 'sqlite' | 'postgres';
}

/**
 * Rewrite `?` placeholders as `$1, $2, ...` for PostgreSQL.
 *
 * String literals are skipped: `WHERE note = 'why?'` contains a `?` that is data,
 * not a placeholder, and renumbering it would both corrupt the literal and shift
 * every subsequent parameter index by one. Single quotes are escaped by doubling in
 * SQL (`''`), which this handles by simply toggling in/out of the literal — a
 * doubled quote toggles twice and so leaves the state unchanged.
 */
export function toPostgresPlaceholders(sql: string): string {
  let out = '';
  let index = 0;
  let inString = false;

  for (const char of sql) {
    if (char === "'") inString = !inString;
    if (char === '?' && !inString) {
      index++;
      out += `$${index}`;
      continue;
    }
    out += char;
  }

  return out;
}

class SqliteDriver implements DbDriver {
  readonly dialect = 'sqlite' as const;

  constructor(private db: Database.Database) {}

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...params) as T[];
  }

  async run(sql: string, params: any[] = []): Promise<RunResult> {
    const result = this.db.prepare(sql).run(...params);
    return { changes: result.changes };
  }

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    // better-sqlite3's own `transaction()` helper cannot be used here: it requires
    // a synchronous callback and throws if one returns a promise. Issuing the
    // statements directly is equivalent, since this driver holds a single
    // connection and nothing else writes to it concurrently.
    await this.run('BEGIN');
    try {
      const result = await work();
      await this.run('COMMIT');
      return result;
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }
}

class PostgresDriver implements DbDriver {
  readonly dialect = 'postgres' as const;

  constructor(private pool: Pool) {}

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const result = await this.pool.query(toPostgresPlaceholders(sql), params);
    return result.rows[0] as T | undefined;
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await this.pool.query(toPostgresPlaceholders(sql), params);
    return result.rows as T[];
  }

  async run(sql: string, params: any[] = []): Promise<RunResult> {
    const result = await this.pool.query(toPostgresPlaceholders(sql), params);
    return { changes: result.rowCount ?? 0 };
  }

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    // A dedicated client, not the pool: BEGIN on a pooled connection would leave
    // the following statements free to land on a different connection, outside the
    // transaction it opened.
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work();
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export function createSqliteDriver(db: Database.Database): DbDriver {
  return new SqliteDriver(db);
}

export function createPostgresDriver(pool: Pool): DbDriver {
  return new PostgresDriver(pool);
}
