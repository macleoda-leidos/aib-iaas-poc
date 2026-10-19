import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Index parity between the SQLite (runtime) and PostgreSQL (persistent) schemas.
//
// SQLite is the runtime query engine; PostgreSQL (Neon) is the persistent store
// the data migrates to. The two schemas are hand-maintained in parallel, and the
// PG side had drifted to carry only 10 of SQLite's 24 secondary indexes — so FK
// joins the case screen relies on, and the session-token lookup on every
// authenticated request, would fall to sequential scans on PostgreSQL once the
// data outgrew the planner's happy path. Phase 3 closed that gap; this test keeps
// it closed by diffing the CREATE INDEX statements in both schema sources.
//
// We compare by the (table, columns) an index covers, not by index NAME, because
// one legitimate alias exists: SQLite's idx_applications_reference and PG's
// idx_applications_ref are the same index under different names. Comparing on the
// covered target makes that alias a non-difference without special-casing a name.

type IndexTarget = string; // normalised "table(col1,col2)"

function readSchema(relPath: string): string {
  return readFileSync(join(__dirname, '..', relPath), 'utf8');
}

/** Extract the set of "table(columns)" targets from every CREATE INDEX in a schema source. */
function indexTargets(sql: string): Set<IndexTarget> {
  const targets = new Set<IndexTarget>();
  // Match: CREATE INDEX [IF NOT EXISTS] <name> ON <table>(<cols>)
  const re = /CREATE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?[a-z_0-9]+\s+ON\s+([a-z_0-9]+)\s*\(([^)]+)\)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    const table = m[1].trim().toLowerCase();
    const cols = m[2]
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .join(',');
    targets.add(`${table}(${cols})`);
  }
  return targets;
}

describe('SQLite / PostgreSQL index parity', () => {
  const sqlite = indexTargets(readSchema('schema.ts'));
  const postgres = indexTargets(readSchema('pg-schema.ts'));

  it('SQLite schema defines the expected number of indexes (guards the baseline)', () => {
    // 24 secondary indexes as of Phase 3. If this changes, PG must change too —
    // which is exactly what the parity assertion below enforces.
    expect(sqlite.size).toBe(24);
  });

  it('every SQLite index has a matching PostgreSQL index on the same table+columns', () => {
    const missingInPg = [...sqlite].filter((t) => !postgres.has(t));
    expect(missingInPg, `PostgreSQL is missing indexes present in SQLite: ${missingInPg.join(', ')}`).toEqual([]);
  });

  it('PostgreSQL defines no stray indexes absent from SQLite', () => {
    const extraInPg = [...postgres].filter((t) => !sqlite.has(t));
    expect(extraInPg, `PostgreSQL has indexes with no SQLite counterpart: ${extraInPg.join(', ')}`).toEqual([]);
  });

  it('the two schemas index exactly the same set of table+column targets', () => {
    expect(postgres).toEqual(sqlite);
  });
});
