import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initPgSchema } from '../pg-schema';

/**
 * Locks the three schema definitions together: SQLite (schema.ts), PostgreSQL
 * (pg-schema.ts), and the .NET EF Core mapping (services/dotnet-api).
 *
 * Both backends now read and write ONE PostgreSQL database, and only
 * `initPgSchema` creates it. That arrangement is only safe while the definitions
 * agree, and nothing at runtime would tell you if they stopped.
 *
 * The failure being guarded is specific and silent. EF's `EnsureCreated()` acts
 * only on a database with no tables, and `CREATE TABLE IF NOT EXISTS` skips tables
 * that exist — so whichever service reached an empty database first used to decide
 * the schema permanently. If the .NET service won, it created its 9-table subset
 * *without* columns the Node side requires, and the statements in pg-schema.ts then
 * declined to add them. No error at boot; wrong data later.
 *
 * These are source-text assertions rather than live-database ones on purpose: they
 * must run in CI with no PostgreSQL available, which is exactly where drift gets
 * introduced.
 */

const DB_SRC = join(__dirname, '..');
const DOTNET_SRC = join(__dirname, '..', '..', '..', '..', 'services', 'dotnet-api');

/** Capture the DDL without a database, as rbac.test.ts does. */
async function captureDdl(): Promise<string> {
  const queries: string[] = [];
  const pool = {
    query: async (sql: string) => {
      queries.push(sql);
      return { rows: [{ c: 0 }] };
    },
  } as never;

  await initPgSchema(pool);
  return queries.join('\n');
}

/** Table name → its column list, parsed from CREATE TABLE statements. */
function parseTables(ddl: string): Map<string, string[]> {
  const tables = new Map<string, string[]>();

  for (const match of ddl.matchAll(/CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\);/g)) {
    const [, name, body] = match;

    // Split on top-level commas only: a column definition can itself contain
    // parenthesised commas (composite PRIMARY KEY, REFERENCES with a column list),
    // and splitting naively invents columns called "permission_id)" and similar.
    const parts: string[] = [];
    let depth = 0;
    let current = '';
    for (const char of body) {
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (char === ',' && depth === 0) {
        parts.push(current);
        current = '';
        continue;
      }
      current += char;
    }
    parts.push(current);

    const columns = parts
      .map(p => p.trim())
      .filter(p => p.length > 0)
      // Table-level constraints are not columns.
      .filter(p => !/^(PRIMARY KEY|FOREIGN KEY|UNIQUE|CHECK|CONSTRAINT)\b/i.test(p))
      .map(p => p.split(/\s+/)[0]);

    tables.set(name, columns);
  }

  return tables;
}

describe('schema parity', () => {
  describe('the parser itself', () => {
    it('does not mistake a composite primary key for a column', async () => {
      // role_permissions ends in "PRIMARY KEY (role_id, permission_id)". A naive
      // split on commas yields a phantom column and makes every other assertion
      // here unreliable, so pin it.
      const tables = parseTables(await captureDdl());
      expect(tables.get('role_permissions')).toEqual(['role_id', 'permission_id']);
    });

    it('finds every table', async () => {
      // A regex that silently stopped matching would make the comparisons below
      // vacuously true.
      const tables = parseTables(await captureDdl());
      // 16 domain tables plus `consents`, added with GAP-018. Deliberately a literal: the
      // point of this case is that the regex above has not silently stopped matching, and a
      // derived figure would move with the bug.
      expect(tables.size).toBe(17);
    });
  });

  describe('SQLite and PostgreSQL define the same shape', () => {
    it('declares the same tables in both', async () => {
      const pg = parseTables(await captureDdl());
      const sqlite = parseTables(readFileSync(join(DB_SRC, 'schema.ts'), 'utf8'));

      expect([...pg.keys()].sort()).toEqual([...sqlite.keys()].sort());
    });

    it('declares the same columns in every table', async () => {
      // Types legitimately differ — INTEGER/BOOLEAN, REAL/DOUBLE PRECISION,
      // datetime('now')/NOW(). Column NAMES may not: the repositories issue the
      // same SQL against both drivers.
      const pg = parseTables(await captureDdl());
      const sqlite = parseTables(readFileSync(join(DB_SRC, 'schema.ts'), 'utf8'));

      const divergent: string[] = [];
      for (const [table, pgColumns] of pg) {
        const sqliteColumns = sqlite.get(table);
        if (!sqliteColumns) continue;
        const a = [...pgColumns].sort().join(',');
        const b = [...sqliteColumns].sort().join(',');
        if (a !== b) divergent.push(`${table}: pg=[${a}] sqlite=[${b}]`);
      }

      expect(divergent).toEqual([]);
    });
  });

  describe('the .NET EF model is a safe subset', () => {
    const dbContext = () => readFileSync(join(DOTNET_SRC, 'Data', 'IaasDbContext.cs'), 'utf8');

    /**
     * Program.cs with comments stripped.
     *
     * Needed because that file explains this very arrangement at length, and the
     * prose names `EnsureCreated()` and `SeedData.Initialize` more often than the
     * code calls them. Counting raw occurrences measured the comments.
     */
    const programCode = () =>
      readFileSync(join(DOTNET_SRC, 'Program.cs'), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(line => !line.trim().startsWith('//'))
        .join('\n');

    it('creates no PostgreSQL schema of its own', () => {
      // The whole basis of shared-database safety: EnsureCreated() may only run on
      // the SQLite path, where nothing else owns the file.
      const code = programCode();
      expect(code.match(/EnsureCreated\(\)/g) ?? []).toHaveLength(1);

      // And that one call must sit in the else (SQLite) branch.
      const branch = code.slice(code.indexOf('if (usingPostgres)'));
      const elseIndex = branch.indexOf('else');
      expect(elseIndex).toBeGreaterThan(-1);
      expect(branch.slice(0, elseIndex)).not.toContain('EnsureCreated()');
      expect(branch.slice(elseIndex)).toContain('EnsureCreated()');
    });

    it('maps only tables that exist in the shared schema', async () => {
      // A ToTable() naming something pg-schema.ts does not create would query a
      // table that is never made.
      const pg = parseTables(await captureDdl());
      const mapped = [...dbContext().matchAll(/ToTable\("(\w+)"\)/g)].map(m => m[1]);

      expect(mapped.length).toBeGreaterThan(0);
      expect(mapped.filter(t => !pg.has(t))).toEqual([]);
    });

    it('maps only columns that exist in the shared schema', async () => {
      // The important direction. The EF model omitting a column is fine — Node
      // still reads and writes it. Referencing one that does not exist is not.
      const pg = parseTables(await captureDdl());
      const source = dbContext();

      // Each ToTable("x") opens a block; HasColumnName calls until the next
      // ToTable belong to it.
      const blocks = source.split(/ToTable\("(\w+)"\)/).slice(1);
      const unknown: string[] = [];

      for (let i = 0; i < blocks.length; i += 2) {
        const table = blocks[i];
        const body = blocks[i + 1] ?? '';
        const columns = pg.get(table);
        if (!columns) continue;

        for (const [, column] of body.matchAll(/HasColumnName\("(\w+)"\)/g)) {
          if (!columns.includes(column)) unknown.push(`${table}.${column}`);
        }
      }

      expect(unknown).toEqual([]);
    });

    it('does not seed PostgreSQL, where Node owns the data', () => {
      // Node's dataset is canonical. The .NET seed defines 5 roles with different
      // ids ('role-system_admin' vs 'role-sysadmin'), so running both would leave
      // two disjoint role sets and users referencing neither.
      const code = programCode();
      expect(code.match(/SeedData\.Initialize/g) ?? []).toHaveLength(1);

      const branch = code.slice(code.indexOf('if (usingPostgres)'));
      const elseIndex = branch.indexOf('else');
      expect(branch.slice(0, elseIndex)).not.toContain('SeedData.Initialize');
      expect(branch.slice(elseIndex)).toContain('SeedData.Initialize');
    });
  });

  describe('columns the .NET model omits but Node depends on', () => {
    // Explicit rather than incidental: these are the columns whose absence from a
    // .NET-created schema would have broken the Node side. Listing them means
    // deleting one from pg-schema.ts fails here loudly.
    const required: Array<[string, string[]]> = [
      ['applications', ['system_checks', 'credit_check']],
      ['recommendations', ['reasoning', 'factors', 'alternatives']],
      ['audit_events', ['actor_id']],
      ['users', ['display_name', 'organisation_id', 'password_hash', 'mfa_enabled']],
      ['organisations', ['parent_id', 'registration_number', 'metadata']],
    ];

    it.each(required)('keeps %s.%s in the shared schema', async (table, columns) => {
      const pg = parseTables(await captureDdl());
      const actual = pg.get(table);
      expect(actual).toBeDefined();
      for (const column of columns) {
        expect(actual).toContain(column);
      }
    });

    it('still declares the NOT NULL recommendation columns', async () => {
      // These are NOT NULL here but absent from the EF model. Harmless today
      // because the .NET recommendation engine is stateless and never writes this
      // table — if that changes, its inserts will fail until the model maps them.
      const ddl = await captureDdl();
      const recommendations = ddl.match(/CREATE TABLE IF NOT EXISTS recommendations \(([\s\S]*?)\);/)?.[1];
      expect(recommendations).toBeDefined();
      expect(recommendations).toMatch(/reasoning TEXT NOT NULL/);
      expect(recommendations).toMatch(/factors TEXT NOT NULL/);
      expect(recommendations).toMatch(/alternatives TEXT NOT NULL/);
    });
  });
});
