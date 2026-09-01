import { describe, it, expect, vi } from 'vitest';
import {
  toPostgresPlaceholders,
  createSqliteDriver,
  createPostgresDriver,
} from '../driver';

/**
 * The driver adapter is what lets one set of repositories serve both SQLite and
 * PostgreSQL, so a defect here is a defect in every query the API makes.
 *
 * The placeholder rewriter gets the most attention because it is the piece that
 * would fail *only* against PostgreSQL — the driver that cannot be exercised
 * without a live server — and because getting it subtly wrong corrupts data rather
 * than erroring. Every case below is pure logic and runs anywhere.
 */

describe('toPostgresPlaceholders', () => {
  it('numbers placeholders from one, in order', () => {
    expect(toPostgresPlaceholders('INSERT INTO t (a, b, c) VALUES (?, ?, ?)')).toBe(
      'INSERT INTO t (a, b, c) VALUES ($1, $2, $3)'
    );
  });

  it('leaves SQL without placeholders untouched', () => {
    expect(toPostgresPlaceholders('SELECT * FROM applications')).toBe(
      'SELECT * FROM applications'
    );
  });

  it('numbers across clauses, not within them', () => {
    // A WHERE placeholder must continue the sequence started by SET, or an UPDATE
    // writes the filter value into the column.
    expect(toPostgresPlaceholders('UPDATE t SET a = ?, b = ? WHERE id = ?')).toBe(
      'UPDATE t SET a = $1, b = $2 WHERE id = $3'
    );
  });

  it('reaches double digits', () => {
    const sql = `INSERT INTO audit_events VALUES (${Array(11).fill('?').join(', ')})`;
    expect(toPostgresPlaceholders(sql)).toContain('$10, $11');
  });

  describe('question marks inside string literals', () => {
    it('does not treat one as a placeholder', () => {
      // The dangerous case. Renumbering a literal '?' both corrupts the string and
      // shifts every later index by one, so the wrong values bind silently.
      expect(toPostgresPlaceholders("SELECT * FROM t WHERE note = 'why?' AND id = ?")).toBe(
        "SELECT * FROM t WHERE note = 'why?' AND id = $1"
      );
    });

    it('keeps numbering correct for placeholders after a literal', () => {
      expect(
        toPostgresPlaceholders("UPDATE t SET a = ?, note = 'huh?' , b = ? WHERE id = ?")
      ).toBe("UPDATE t SET a = $1, note = 'huh?' , b = $2 WHERE id = $3");
    });

    it('handles an escaped quote without losing track of the literal', () => {
      // '' is SQL's escape for a single quote. It toggles the in-string state twice,
      // so the '?' after it is still data.
      const sql = "SELECT * FROM t WHERE note = 'it''s odd? really' AND id = ?";
      expect(toPostgresPlaceholders(sql)).toBe(
        "SELECT * FROM t WHERE note = 'it''s odd? really' AND id = $1"
      );
    });
  });
});

describe('SQLite driver', () => {
  function fakeSqlite() {
    const calls: Array<{ sql: string; params: any[] }> = [];
    const db = {
      prepare(sql: string) {
        return {
          get: (...params: any[]) => {
            calls.push({ sql, params });
            return { id: 'row-1' };
          },
          all: (...params: any[]) => {
            calls.push({ sql, params });
            return [{ id: 'row-1' }, { id: 'row-2' }];
          },
          run: (...params: any[]) => {
            calls.push({ sql, params });
            return { changes: 1, lastInsertRowid: 1 };
          },
        };
      },
    } as never;
    return { calls, driver: createSqliteDriver(db) };
  }

  it('resolves rather than returning synchronously', async () => {
    // The point of wrapping a synchronous driver: callers await unconditionally, so
    // swapping the driver can never change whether an await is required.
    const { driver } = fakeSqlite();
    const result = driver.get('SELECT 1');
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toEqual({ id: 'row-1' });
  });

  it('passes ? placeholders through unchanged', async () => {
    const { calls, driver } = fakeSqlite();
    await driver.all('SELECT * FROM t WHERE a = ? AND b = ?', ['x', 'y']);
    expect(calls[0].sql).toBe('SELECT * FROM t WHERE a = ? AND b = ?');
    expect(calls[0].params).toEqual(['x', 'y']);
  });

  it('reports only the row count from run', async () => {
    const { driver } = fakeSqlite();
    await expect(driver.run('DELETE FROM t WHERE id = ?', ['1'])).resolves.toEqual({
      changes: 1,
    });
  });

  it('reports its dialect', () => {
    expect(fakeSqlite().driver.dialect).toBe('sqlite');
  });

  it('defaults to no parameters when none are given', async () => {
    // Every method takes params optionally; repositories call several without any.
    const { calls, driver } = fakeSqlite();
    await driver.all('SELECT * FROM roles');
    await driver.run('DELETE FROM sessions');
    expect(calls.map(c => c.params)).toEqual([[], []]);
  });

  it('commits a successful transaction', async () => {
    const { calls, driver } = fakeSqlite();
    const result = await driver.transaction(async () => {
      await driver.run('INSERT INTO t VALUES (?)', ['a']);
      return 'done';
    });

    expect(result).toBe('done');
    expect(calls.map(c => c.sql)).toEqual([
      'BEGIN',
      'INSERT INTO t VALUES (?)',
      'COMMIT',
    ]);
  });

  it('rolls back and rethrows when the work fails', async () => {
    const { calls, driver } = fakeSqlite();
    await expect(
      driver.transaction(async () => {
        throw new Error('constraint violated');
      })
    ).rejects.toThrow('constraint violated');

    // ROLLBACK, and no COMMIT — a half-applied write would be worse than a failure.
    expect(calls.map(c => c.sql)).toEqual(['BEGIN', 'ROLLBACK']);
  });
});

describe('PostgreSQL driver', () => {
  function fakePool(rows: any[] = [{ id: 'row-1' }]) {
    const queries: Array<{ sql: string; params: any[] }> = [];
    const client = {
      query: vi.fn(async (sql: string, params: any[] = []) => {
        queries.push({ sql, params });
        return { rows, rowCount: rows.length };
      }),
      release: vi.fn(),
    };
    const pool = {
      query: async (sql: string, params: any[] = []) => {
        queries.push({ sql, params });
        return { rows, rowCount: rows.length };
      },
      connect: async () => client,
    } as never;
    return { queries, client, driver: createPostgresDriver(pool) };
  }

  it('rewrites placeholders before querying', async () => {
    const { queries, driver } = fakePool();
    await driver.get('SELECT * FROM t WHERE a = ? AND b = ?', ['x', 'y']);
    expect(queries[0].sql).toBe('SELECT * FROM t WHERE a = $1 AND b = $2');
    expect(queries[0].params).toEqual(['x', 'y']);
  });

  it('returns the first row from get, not the result object', async () => {
    const { driver } = fakePool([{ id: 'a' }, { id: 'b' }]);
    await expect(driver.get('SELECT * FROM t')).resolves.toEqual({ id: 'a' });
  });

  it('returns undefined from get when nothing matched', async () => {
    // Must be undefined, matching better-sqlite3 — repositories test the result for
    // falsiness to decide between a row and null.
    const { driver } = fakePool([]);
    await expect(driver.get('SELECT * FROM t')).resolves.toBeUndefined();
  });

  it('returns every row from all', async () => {
    const { driver } = fakePool([{ id: 'a' }, { id: 'b' }]);
    await expect(driver.all('SELECT * FROM t')).resolves.toHaveLength(2);
  });

  it('maps rowCount onto changes', async () => {
    const { driver } = fakePool([{ id: 'a' }]);
    await expect(driver.run('DELETE FROM t')).resolves.toEqual({ changes: 1 });
  });

  it('treats a null rowCount as zero changes', async () => {
    const queries: Array<{ sql: string }> = [];
    const pool = {
      query: async (sql: string) => {
        queries.push({ sql });
        return { rows: [], rowCount: null };
      },
    } as never;
    await expect(createPostgresDriver(pool).run('SELECT 1')).resolves.toEqual({
      changes: 0,
    });
  });

  it('reports its dialect', () => {
    expect(fakePool().driver.dialect).toBe('postgres');
  });

  describe('transactions', () => {
    it('runs on a dedicated client and releases it', async () => {
      // Not the pool: BEGIN on a pooled connection leaves the following statements
      // free to land on a different connection, outside the transaction.
      const { client, driver } = fakePool();
      await driver.transaction(async () => 'ok');

      expect(client.query).toHaveBeenCalledWith('BEGIN');
      expect(client.query).toHaveBeenCalledWith('COMMIT');
      expect(client.release).toHaveBeenCalled();
    });

    it('rolls back and still releases the client on failure', async () => {
      const { client, driver } = fakePool();
      await expect(
        driver.transaction(async () => {
          throw new Error('boom');
        })
      ).rejects.toThrow('boom');

      expect(client.query).toHaveBeenCalledWith('ROLLBACK');
      // A leaked client would exhaust the pool — which on Neon's free tier is small.
      expect(client.release).toHaveBeenCalled();
    });

    it('releases the client even if the rollback itself fails', async () => {
      // The worst case: the connection is already broken, so ROLLBACK throws too.
      // Without the finally, that client is never returned and the pool bleeds one
      // connection per failure until nothing can be served at all.
      const client = {
        query: vi.fn(async (sql: string) => {
          if (sql === 'ROLLBACK') throw new Error('connection lost');
          return { rows: [], rowCount: 0 };
        }),
        release: vi.fn(),
      };
      const pool = { connect: async () => client } as never;

      await expect(
        createPostgresDriver(pool).transaction(async () => {
          throw new Error('original failure');
        })
      ).rejects.toThrow('connection lost');

      expect(client.release).toHaveBeenCalled();
    });

    it('defaults to no parameters when none are given', async () => {
      const { queries, driver } = fakePool();
      await driver.all('SELECT * FROM roles');
      expect(queries[0].params).toEqual([]);
    });
  });
});
