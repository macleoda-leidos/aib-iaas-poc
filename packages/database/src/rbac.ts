import type Database from 'better-sqlite3';
import type { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * The single definition of who can do what.
 *
 * Roles, permissions and the grants between them used to be declared in three
 * places that had drifted apart: `schema.ts` invented a six-permission
 * vocabulary (`application.read.all`) and granted it to five of the ten roles,
 * `seed.ts` used the twenty-permission vocabulary from `permissions.json`, and
 * `pg-seed.ts` seeded no permissions at all — so on PostgreSQL every role held
 * nothing. Nothing surfaced any of it, because no deployed route checks a
 * permission (GAP-002 in docs/security-known-gaps.md). The moment authorisation
 * is switched on, a role with no grants is a locked-out user.
 *
 * So the data lives in `seed-data/` and both database backends apply it from
 * here. Grants are written as permission *codes* rather than ids because codes
 * are what `UserRepository.hasPermission` and `requirePermission` compare
 * against — a typo in a code is a silent authorisation failure, whereas a typo
 * in an id fails loudly below.
 */

export interface SeedRole {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  level: number;
}

export interface SeedPermission {
  id: string;
  code: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface RoleGrant {
  roleId: string;
  /** Permission codes, e.g. `applications.approve`. */
  permissions: string[];
}

function loadSeedData<T>(filename: string): T[] {
  return JSON.parse(readFileSync(join(__dirname, 'seed-data', filename), 'utf-8'));
}

export const ROLES: SeedRole[] = loadSeedData<SeedRole>('roles.json');
export const PERMISSIONS: SeedPermission[] = loadSeedData<SeedPermission>('permissions.json');
export const ROLE_GRANTS: RoleGrant[] = loadSeedData<RoleGrant>('role-permissions.json');

/**
 * Resolve the grants to (role id, permission id) pairs, which is what the
 * `role_permissions` join table stores.
 *
 * Throws rather than skipping an unresolvable entry. A dropped grant is
 * invisible until someone is denied access they should have had, and this runs
 * at seed time where a stack trace is cheap.
 */
export function resolveGrants(): Array<{ roleId: string; permissionId: string }> {
  const roleIds = new Set(ROLES.map(r => r.id));
  const idByCode = new Map(PERMISSIONS.map(p => [p.code, p.id]));

  return ROLE_GRANTS.flatMap(grant => {
    if (!roleIds.has(grant.roleId)) {
      throw new Error(`role-permissions.json grants to unknown role "${grant.roleId}"`);
    }

    return grant.permissions.map(code => {
      const permissionId = idByCode.get(code);
      if (!permissionId) {
        throw new Error(
          `role-permissions.json grants unknown permission "${code}" to ${grant.roleId}`
        );
      }
      return { roleId: grant.roleId, permissionId };
    });
  });
}

/** Apply roles, permissions and grants to SQLite. Idempotent. */
export function seedRbacSqlite(db: Database.Database): void {
  const grants = resolveGrants();

  const insertRole = db.prepare(
    'INSERT OR IGNORE INTO roles (id, name, display_name, description, level) VALUES (?, ?, ?, ?, ?)'
  );
  const insertPermission = db.prepare(
    'INSERT OR IGNORE INTO permissions (id, code, name, description, resource, action) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertGrant = db.prepare(
    'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)'
  );

  // One transaction: a half-applied RBAC table is worse than none, because it
  // looks seeded to the "already seeded, skipping" guards elsewhere.
  db.transaction(() => {
    for (const role of ROLES) {
      insertRole.run(role.id, role.name, role.displayName, role.description ?? null, role.level);
    }
    for (const p of PERMISSIONS) {
      insertPermission.run(p.id, p.code, p.name, p.description ?? null, p.resource, p.action);
    }
    for (const g of grants) {
      insertGrant.run(g.roleId, g.permissionId);
    }
  })();
}

/** Apply roles, permissions and grants to PostgreSQL. Idempotent. */
export async function seedRbacPostgres(pool: Pool): Promise<void> {
  const grants = resolveGrants();

  for (const role of ROLES) {
    await pool.query(
      `INSERT INTO roles (id, name, display_name, description, level)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
      [role.id, role.name, role.displayName, role.description ?? null, role.level]
    );
  }

  for (const p of PERMISSIONS) {
    await pool.query(
      `INSERT INTO permissions (id, code, name, description, resource, action)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
      [p.id, p.code, p.name, p.description ?? null, p.resource, p.action]
    );
  }

  for (const g of grants) {
    await pool.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       VALUES ($1, $2) ON CONFLICT (role_id, permission_id) DO NOTHING`,
      [g.roleId, g.permissionId]
    );
  }
}
