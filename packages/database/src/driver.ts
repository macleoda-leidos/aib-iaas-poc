/**
 * A single async query surface over both SQLite and PostgreSQL.
 *
 * The repositories were built on better-sqlite3, whose API is synchronous by
 * design, and `pg` is async only. Rather than fork every repository per driver,
 * they all target this interface: async everywhere, `?` placeholders everywhere,
 * and the adapter deals with the differences.
 *
 * Four of those differences are not optional:
 *
 *  - **Placeholders.** SQLite takes `?`; PostgreSQL takes `$1, $2, ...`. The
 *    repositories keep `?` and the PostgreSQL adapter rewrites them, so 129
 *    methods' worth of SQL did not have to be touched — and cannot drift apart
 *    per driver.
 *  - **Row shape.** `INSERT ... RETURNING` is PostgreSQL; better-sqlite3 reports
 *    `changes`/`lastInsertRowid` instead. `run()` therefore promises only what both
 *    can honestly provide: the number of rows affected.
 *  - **Booleans.** The SQLite schema declares flags `INTEGER`, the PostgreSQL one
 *    `BOOLEAN`, and neither driver will accept the other's representation:
 *    better-sqlite3 refuses to bind a boolean at all, and PostgreSQL rejects `1`
 *    for a boolean column. Repositories therefore bind real booleans and the
 *    SQLite adapter converts them, so no repository has to know which store it
 *    is talking to.
 *  - **Timestamps.** SQLite declares them `TEXT` and hands back the string;
 *    PostgreSQL declares them `TIMESTAMPTZ` and `pg` hydrates a JS `Date`. Left
 *    alone that would silently change the shape of every API response carrying a
 *    timestamp, so the PostgreSQL adapter converts back to an ISO string.
 *
 * Keeping the SQLite adapter's methods `async` despite better-sqlite3 being
 * synchronous is deliberate. A single call signature means the route layer awaits
 * unconditionally, so the driver in use can never change whether a caller needs
 * `await` — which is precisely the class of bug that would otherwise appear only
 * under PostgreSQL, in production.
 */

import type Database from 'better-sqlite3';
import type { Pool, PoolClient } from 'pg';

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
  /**
   * Run a set of statements atomically, rolling back on any failure.
   *
   * `work` receives the driver it must issue its statements through, and using
   * anything else silently escapes the transaction. Under PostgreSQL the
   * transaction lives on one connection checked out of the pool, so a statement
   * sent via the pool instead lands on a *different* connection and autocommits
   * outside the BEGIN/COMMIT — leaving the rollback with nothing to undo.
   */
  transaction<T>(work: (tx: DbDriver) => Promise<T>): Promise<T>;
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

/**
 * Convert booleans to the integers SQLite stores flags as.
 *
 * Not a nicety: better-sqlite3 refuses outright to bind a boolean ("SQLite3 can
 * only bind numbers, strings, bigints, buffers, and null"), so without this every
 * write touching a flag column throws. Doing it here rather than in the seven
 * repositories is what lets them bind the value the domain actually has.
 */
function toSqliteParams(params: any[]): any[] {
  return params.map(param => (typeof param === 'boolean' ? (param ? 1 : 0) : param));
}

class SqliteDriver implements DbDriver {
  readonly dialect = 'sqlite' as const;

  constructor(private db: Database.Database) {}

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return this.db.prepare(sql).get(...toSqliteParams(params)) as T | undefined;
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...toSqliteParams(params)) as T[];
  }

  async run(sql: string, params: any[] = []): Promise<RunResult> {
    const result = this.db.prepare(sql).run(...toSqliteParams(params));
    return { changes: result.changes };
  }

  async transaction<T>(work: (tx: DbDriver) => Promise<T>): Promise<T> {
    // better-sqlite3's own `transaction()` helper cannot be used here: it requires
    // a synchronous callback and throws if one returns a promise. Issuing the
    // statements directly is equivalent, since this driver holds a single
    // connection and nothing else writes to it concurrently.
    //
    // `this` is the transaction driver for the same reason: one connection means
    // every statement is already inside the BEGIN, so there is no separate
    // connection to hand out.
    await this.run('BEGIN');
    try {
      const result = await work(this);
      await this.run('COMMIT');
      return result;
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }
}

/**
 * Both `Pool` and `PoolClient` expose `query()`, which is all the read/write
 * methods need. Naming that overlap is what lets the pooled driver and the
 * transaction-bound driver share one implementation instead of two copies that
 * could drift.
 */
interface PgQueryable {
  query(sql: string, params?: any[]): Promise<{ rows: any[]; rowCount: number | null }>;
}

/**
 * Convert `Date` values in a row to ISO strings, matching what SQLite returns for
 * the same column.
 *
 * Deliberately shallow — one pass over the row's own values. Rows are flat
 * records straight from `pg`; the only nested structures in this schema are JSON
 * held in TEXT columns, which the repositories parse themselves and which must
 * not be walked into here.
 *
 * The alternative was retyping the PostgreSQL columns to TEXT to match SQLite.
 * That is cheaper but wrong: the .NET API reads the same Neon database through EF
 * Core with `DateTime` properties, so it would break endpoint parity on the other
 * backend. The divergence belongs in the adapter.
 */
function normalisePgRow(row: any): any {
  if (row === null || typeof row !== 'object') return row;

  let normalised: any = row;
  for (const key of Object.keys(row)) {
    if (row[key] instanceof Date) {
      // Copy lazily, so rows with no timestamp column are returned untouched.
      if (normalised === row) normalised = { ...row };
      normalised[key] = row[key].toISOString();
    }
  }
  return normalised;
}

/** The query surface shared by the pooled driver and its transaction-bound form. */
abstract class PostgresQueries implements DbDriver {
  readonly dialect = 'postgres' as const;

  constructor(protected queryable: PgQueryable) {}

  abstract transaction<T>(work: (tx: DbDriver) => Promise<T>): Promise<T>;

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const result = await this.queryable.query(toPostgresPlaceholders(sql), params);
    const row = result.rows[0];
    return (row === undefined ? undefined : normalisePgRow(row)) as T | undefined;
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await this.queryable.query(toPostgresPlaceholders(sql), params);
    return result.rows.map(normalisePgRow) as T[];
  }

  async run(sql: string, params: any[] = []): Promise<RunResult> {
    const result = await this.queryable.query(toPostgresPlaceholders(sql), params);
    return { changes: result.rowCount ?? 0 };
  }
}

class PostgresDriver extends PostgresQueries {
  constructor(private pool: Pool) {
    super(pool);
  }

  async transaction<T>(work: (tx: DbDriver) => Promise<T>): Promise<T> {
    // A dedicated client, not the pool: BEGIN on a pooled connection would leave
    // the following statements free to land on a different connection, outside the
    // transaction it opened. Handing `work` a driver bound to that same client is
    // what makes the guarantee real rather than merely intended — before this, the
    // callback took no argument and so had no choice but to go back through the
    // pool, bracketing an empty transaction while the writes it was supposed to
    // protect autocommitted one by one.
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(new PostgresTransactionDriver(client));
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

class PostgresTransactionDriver extends PostgresQueries {
  constructor(client: PoolClient) {
    super(client);
  }

  async transaction<T>(work: (tx: DbDriver) => Promise<T>): Promise<T> {
    // Already inside a transaction on this connection. PostgreSQL has no nested
    // BEGIN, and issuing a second one only warns and is ignored, so the work runs
    // as part of the transaction already open — whose rollback covers it.
    return work(this);
  }
}

export function createSqliteDriver(db: Database.Database): DbDriver {
  return new SqliteDriver(db);
}

export function createPostgresDriver(pool: Pool): DbDriver {
  return new PostgresDriver(pool);
}
