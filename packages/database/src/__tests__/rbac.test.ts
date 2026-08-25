import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRepositories, closeDatabase } from '../index';
import type { Repositories } from '../index';
import { PERMISSIONS, ROLES, ROLE_GRANTS, resolveGrants, seedRbacPostgres } from '../rbac';
import { initPgSchema } from '../pg-schema';

/**
 * Guards the access-control seed data.
 *
 * Before Sprint 30 this was defined three times over and the copies disagreed:
 * `schema.ts` granted a six-permission vocabulary to five of the roles,
 * `seed.ts` granted a twenty-permission vocabulary to eight, and the PostgreSQL
 * path created no permission tables at all. Every one of those is invisible
 * today because no deployed route checks a permission (GAP-002) — a role with
 * zero grants behaves exactly like a role with every grant. These tests are
 * what makes the difference observable before authorisation is switched on and
 * the same defect becomes a lockout.
 */

describe('RBAC reference data', () => {
  it('resolves every grant to a real role and permission', () => {
    // resolveGrants throws on an unknown role or code, so this is the whole
    // referential-integrity check in one line.
    expect(() => resolveGrants()).not.toThrow();
    expect(resolveGrants().length).toBeGreaterThan(50);
  });

  it('grants at least one permission to every role', () => {
    const granted = new Set(ROLE_GRANTS.map(g => g.roleId));
    const ungranted = ROLES.filter(r => !granted.has(r.id)).map(r => r.id);

    // The original defect: role-creditor, role-readonly and role-supplier were
    // seeded with no permissions whatsoever.
    expect(ungranted).toEqual([]);
  });

  it('grants every permission to at least one role', () => {
    const grantedCodes = new Set(ROLE_GRANTS.flatMap(g => g.permissions));
    const orphaned = PERMISSIONS.filter(p => !grantedCodes.has(p.code)).map(p => p.code);

    // A permission nobody holds is either a modelling gap or a typo. Either way
    // it should be a decision, not a surprise.
    expect(orphaned).toEqual([]);
  });

  it('has unique role ids, role names and permission codes', () => {
    expect(new Set(ROLES.map(r => r.id)).size).toBe(ROLES.length);
    expect(new Set(ROLES.map(r => r.name)).size).toBe(ROLES.length);
    expect(new Set(PERMISSIONS.map(p => p.id)).size).toBe(PERMISSIONS.length);
    expect(new Set(PERMISSIONS.map(p => p.code)).size).toBe(PERMISSIONS.length);
  });

  it('grants no permission twice to the same role', () => {
    const duplicated = ROLE_GRANTS.filter(
      g => new Set(g.permissions).size !== g.permissions.length
    ).map(g => g.roleId);

    expect(duplicated).toEqual([]);
  });

  it('names every permission code after its own resource and action', () => {
    // hasPermission compares codes, so a code that disagrees with its
    // resource/action columns makes the table impossible to reason about.
    const mismatched = PERMISSIONS.filter(p => p.code !== `${p.resource}.${p.action}`).map(
      p => p.code
    );

    expect(mismatched).toEqual([]);
  });

  it('matches the UserRole union in shared-types', () => {
    // Read the source rather than the type: a TS union does not survive to
    // runtime, and this drifting is how aib_readonly came to exist in one place
    // and cyberops_analyst in another.
    const source = readFileSync(
      join(__dirname, '..', '..', '..', 'shared-types', 'src', 'rbac.ts'),
      'utf8'
    );
    const union = source.match(/export type UserRole =([\s\S]*?);/)?.[1];
    expect(union).toBeDefined();

    const declared = [...union!.matchAll(/'([^']+)'/g)].map(m => m[1]).sort();
    expect(declared).toEqual(ROLES.map(r => r.name).sort());
  });
});

describe('RBAC seeding — SQLite', () => {
  let repos: Repositories;

  beforeAll(() => {
    repos = createRepositories();
  });

  afterAll(() => {
    closeDatabase();
  });

  it('seeds every canonical role', () => {
    const seeded = repos.users.listRoles().map(r => r.id).sort();
    expect(seeded).toEqual(ROLES.map(r => r.id).sort());
  });

  it('gives every seeded role the grants the reference data specifies', () => {
    const expected = new Map(ROLE_GRANTS.map(g => [g.roleId, [...g.permissions].sort()]));

    for (const role of ROLES) {
      const actual = repos.users
        .getPermissionsForRole(role.id)
        .map(p => p.code)
        .sort();
      expect(actual, `grants for ${role.id}`).toEqual(expected.get(role.id));
    }
  });

  it('leaves no role with zero permissions', () => {
    const empty = ROLES.filter(r => repos.users.getPermissionsForRole(r.id).length === 0).map(
      r => r.id
    );
    expect(empty).toEqual([]);
  });

  it('seeds no permission outside the canonical vocabulary', () => {
    // schema.ts used to add application.read.all, application.write and four
    // others that nothing else in the repo recognised.
    const codes = new Set(PERMISSIONS.map(p => p.code));
    const seeded = ROLES.flatMap(r => repos.users.getPermissionsForRole(r.id).map(p => p.code));
    expect([...new Set(seeded.filter(c => !codes.has(c)))]).toEqual([]);
  });

  it('answers hasPermission from the seeded grants', () => {
    // reports.read is the code the one authorised route in the repo requires.
    expect(repos.users.hasPermission('user-admin', 'reports.read')).toBe(true);
    expect(repos.users.hasPermission('user-debtor', 'reports.read')).toBe(false);
    expect(repos.users.hasPermission('user-debtor', 'applications.submit')).toBe(true);
    expect(repos.users.hasPermission('user-admin', 'no.such.permission')).toBe(false);
  });
});

describe('RBAC seeding — PostgreSQL', () => {
  /**
   * Records the SQL a Pool would have run. There is no PostgreSQL in CI, and the
   * failure being guarded against is structural — tables never created, inserts
   * never issued — which a recording double catches exactly as well as a live
   * connection would.
   */
  function fakePool(existingRowCount = '0') {
    const queries: string[] = [];
    return {
      queries,
      pool: {
        query: async (sql: string) => {
          queries.push(sql);
          return { rows: [{ c: existingRowCount }] };
        },
      } as never,
    };
  }

  it('creates the permission tables', async () => {
    const { queries, pool } = fakePool();
    await initPgSchema(pool);

    const ddl = queries.join('\n');
    // These two tables were absent entirely, so every role on PostgreSQL held
    // nothing and getPermissionsForRole could not even be answered.
    expect(ddl).toMatch(/CREATE TABLE IF NOT EXISTS permissions\b/);
    expect(ddl).toMatch(/CREATE TABLE IF NOT EXISTS role_permissions\b/);
  });

  it('inserts roles, permissions and grants', async () => {
    const { queries, pool } = fakePool();
    await seedRbacPostgres(pool);

    const count = (table: string) =>
      queries.filter(q => q.includes(`INSERT INTO ${table} `)).length;

    expect(count('roles')).toBe(ROLES.length);
    expect(count('permissions')).toBe(PERMISSIONS.length);
    expect(count('role_permissions')).toBe(resolveGrants().length);
  });

  it('seeds grants before the already-seeded guard can skip them', async () => {
    const { seedPgDatabase } = await import('../pg-seed');
    // A non-zero count makes the "already seeded — skipping" branch fire, which
    // is the case that matters: an existing Neon database. RBAC must already be
    // in by then. The old guard counted `roles`, and roles were the one thing it
    // did insert, so any database seeded before permissions existed skipped them
    // on every subsequent run, permanently.
    const { queries, pool } = fakePool('9');

    await seedPgDatabase(pool);

    expect(queries.some(q => q.includes('INSERT INTO role_permissions '))).toBe(true);
    // Confirm the early return really did fire, or the assertion above is
    // testing the ordinary path and proves nothing about the guard.
    expect(queries.some(q => q.includes('INSERT INTO organisations '))).toBe(false);
  });
});
