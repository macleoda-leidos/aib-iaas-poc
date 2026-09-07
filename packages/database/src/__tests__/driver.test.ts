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
    const result = await driver.transaction(async tx => {
      await tx.run('INSERT INTO t VALUES (?)', ['a']);
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

  it('hands the work its own driver, which is this one', async () => {
    // SQLite holds a single connection, so there is no second connection to bind
    // a transaction to — but `work` must still receive a driver, or the callers
    // written against the PostgreSQL contract would pass `undefined` around.
    const { driver } = fakeSqlite();
    let received: unknown;
    await driver.transaction(async tx => {
      received = tx;
    });
    expect(received).toBe(driver);
  });

  describe('boolean parameters', () => {
    it('binds true as 1 and false as 0', async () => {
      // better-sqlite3 refuses booleans outright ("can only bind numbers, strings,
      // bigints, buffers, and null"), so an uncoerced flag is a hard failure on
      // every write touching is_current, is_essential or mfa_enabled.
      const { calls, driver } = fakeSqlite();
      await driver.run('INSERT INTO addresses (is_current) VALUES (?)', [true]);
      await driver.run('INSERT INTO addresses (is_current) VALUES (?)', [false]);
      expect(calls.map(c => c.params)).toEqual([[1], [0]]);
    });

    it('coerces on reads as well as writes', async () => {
      const { calls, driver } = fakeSqlite();
      await driver.get('SELECT * FROM assets WHERE is_essential = ?', [true]);
      await driver.all('SELECT * FROM assets WHERE is_essential = ?', [false]);
      expect(calls.map(c => c.params)).toEqual([[1], [0]]);
    });

    it('leaves every other parameter type alone', async () => {
      // Notably null and 0 — a blanket truthiness check would turn both into
      // something else.
      const { calls, driver } = fakeSqlite();
      await driver.run('INSERT INTO t VALUES (?, ?, ?, ?)', ['a', 0, null, 12.5]);
      expect(calls[0].params).toEqual(['a', 0, null, 12.5]);
    });
  });
});

describe('PostgreSQL driver', () => {
  /**
   * Pool and client statements are recorded separately on purpose. Which of the
   * two ran a given statement is the whole question for transactions, and a single
   * combined log cannot answer it — which is exactly why the original suite passed
   * against a `transaction()` that bracketed an empty transaction.
   */
  function fakePool(rows: any[] = [{ id: 'row-1' }]) {
    const queries: Array<{ sql: string; params: any[] }> = [];
    const clientQueries: Array<{ sql: string; params: any[] }> = [];
    const client = {
      query: vi.fn(async (sql: string, params: any[] = []) => {
        clientQueries.push({ sql, params });
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
    return { queries, clientQueries, client, driver: createPostgresDriver(pool) };
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

    it('issues the work’s statements on the transaction’s own connection', async () => {
      // The defect this replaces: `work` took no argument, so every statement
      // inside it went back through `pool.query` — a different connection from the
      // one holding the BEGIN. The writes autocommitted individually and the
      // COMMIT/ROLLBACK applied to an empty transaction. Asserting on BEGIN and
      // COMMIT alone cannot see that; asserting *where* the write went can.
      const { queries, clientQueries, driver } = fakePool();
      await driver.transaction(async tx => {
        await tx.run('INSERT INTO debts (id) VALUES (?)', ['d-1']);
        await tx.get('SELECT * FROM debts WHERE id = ?', ['d-1']);
      });

      expect(clientQueries.map(q => q.sql)).toEqual([
        'BEGIN',
        'INSERT INTO debts (id) VALUES ($1)',
        'SELECT * FROM debts WHERE id = $1',
        'COMMIT',
      ]);
      // Nothing escaped to the pool, where it would have committed on its own.
      expect(queries).toEqual([]);
    });

    it('rolls back the work’s statements, which never reached the pool', async () => {
      const { queries, clientQueries, driver } = fakePool();
      await expect(
        driver.transaction(async tx => {
          await tx.run('INSERT INTO debts (id) VALUES (?)', ['d-1']);
          throw new Error('duplicate reference number');
        })
      ).rejects.toThrow('duplicate reference number');

      expect(clientQueries.map(q => q.sql)).toEqual([
        'BEGIN',
        'INSERT INTO debts (id) VALUES ($1)',
        'ROLLBACK',
      ]);
      // The insert is inside the rolled-back transaction, so it leaves nothing
      // behind. Had it gone via the pool it would have survived the rollback.
      expect(queries).toEqual([]);
    });

    it('keeps a nested transaction on the same connection', async () => {
      // PostgreSQL has no nested BEGIN. A repository helper that opens its own
      // transaction while already inside one must join the outer one, not start a
      // second that the driver would have to fake.
      const { clientQueries, driver } = fakePool();
      await driver.transaction(async tx =>
        tx.transaction(async inner => {
          await inner.run('INSERT INTO assets (id) VALUES (?)', ['a-1']);
        })
      );

      expect(clientQueries.map(q => q.sql)).toEqual([
        'BEGIN',
        'INSERT INTO assets (id) VALUES ($1)',
        'COMMIT',
      ]);
    });
  });

  describe('timestamp normalisation', () => {
    // `pg` hydrates TIMESTAMPTZ into a JS Date; better-sqlite3 returns the stored
    // string. Passed through, the same endpoint would serialise a different
    // timestamp format per backend — no error, just a changed response shape.
    const created = new Date('2026-06-02T10:00:00.000Z');

    it('converts Date values to ISO strings on get', async () => {
      const { driver } = fakePool([{ id: 'a', created_at: created }]);
      await expect(driver.get('SELECT * FROM applications')).resolves.toEqual({
        id: 'a',
        created_at: '2026-06-02T10:00:00.000Z',
      });
    });

    it('converts them on all, for every row', async () => {
      const { driver } = fakePool([
        { id: 'a', created_at: created },
        { id: 'b', created_at: new Date('2026-07-01T00:00:00.000Z') },
      ]);
      const rows = await driver.all('SELECT * FROM applications');
      expect(rows.map(r => r.created_at)).toEqual([
        '2026-06-02T10:00:00.000Z',
        '2026-07-01T00:00:00.000Z',
      ]);
    });

    it('leaves nulls, strings and numbers as they are', async () => {
      // A nullable timestamp such as submitted_at must stay null, not become the
      // epoch or the string "null".
      const { driver } = fakePool([
        { id: 'a', submitted_at: null, status: 'draft', dependants: 0 },
      ]);
      await expect(driver.get('SELECT * FROM applications')).resolves.toEqual({
        id: 'a',
        submitted_at: null,
        status: 'draft',
        dependants: 0,
      });
    });

    it('does not walk into JSON held in a TEXT column', async () => {
      // system_checks and details are JSON strings the repositories parse
      // themselves. Normalising must stay shallow or it would have to guess which
      // strings are structured.
      const { driver } = fakePool([
        { id: 'a', system_checks: '{"basys":{"checkedAt":"2026-06-02"}}' },
      ]);
      await expect(driver.get('SELECT * FROM applications')).resolves.toEqual({
        id: 'a',
        system_checks: '{"basys":{"checkedAt":"2026-06-02"}}',
      });
    });

    it('passes booleans through untouched', async () => {
      // PostgreSQL returns real booleans, which the row mappers already handle.
      const { driver } = fakePool([{ id: 'a', is_current: true, is_essential: false }]);
      await expect(driver.get('SELECT * FROM addresses')).resolves.toEqual({
        id: 'a',
        is_current: true,
        is_essential: false,
      });
    });

    it('normalises inside a transaction too', async () => {
      const { driver } = fakePool([{ id: 'a', created_at: created }]);
      const row = await driver.transaction(tx => tx.get('SELECT * FROM applications'));
      expect(row).toEqual({ id: 'a', created_at: '2026-06-02T10:00:00.000Z' });
    });

    it('returns a row that is not an object unchanged', async () => {
      // Defensive: `pg` returns objects for every query this codebase makes, but
      // normalising walks Object.keys() and a null row would throw on the way in —
      // turning an empty result into a crash rather than an empty result.
      const { driver } = fakePool([null, 'scalar']);
      await expect(driver.all('SELECT 1')).resolves.toEqual([null, 'scalar']);
    });
  });
});
