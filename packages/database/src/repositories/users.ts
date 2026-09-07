import type { DbDriver } from '../driver';
import { randomUUID } from 'crypto';

/**
 * The session handle for a token: its `jti` claim.
 *
 * Read without verifying, deliberately. This is an *index lookup key*, not a trust
 * decision — the caller has already verified the signature before asking (see
 * `authenticate` in `@aib-iaas/auth`), and a forged token simply yields a `jti` that
 * matches no row. Verifying here too would make this package depend on the signing keys
 * for no gain.
 *
 * Falls back to the whole token when there is no parseable `jti`, so a caller passing
 * something that is not a JWT still gets a stable, non-matching key rather than a crash.
 */
function extractJti(token: string): string {
  const parts = token.split('.');
  if (parts.length !== 3) return token;

  try {
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return typeof claims?.jti === 'string' ? claims.jti : token;
  } catch {
    return token;
  }
}

// ─── Types ─────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  roleId: string;
  organisationId: string | null;
  status: string;
  passwordHash: string | null;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithRole extends User {
  roleName: string;
  roleDisplayName: string;
  roleLevel: number;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  level: number;
  createdAt: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  roleId: string;
  organisationId?: string;
  status?: string;
  passwordHash?: string;
  mfaEnabled?: boolean;
}

export interface ListUsersParams {
  role?: string;
  roleId?: string;
  organisationId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

// ─── Repository ────────────────────────────────

export class UserRepository {
  constructor(private driver: DbDriver) {}

  private mapRow(row: any): User {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      displayName: row.display_name,
      roleId: row.role_id,
      organisationId: row.organisation_id,
      status: row.status,
      passwordHash: row.password_hash,
      mfaEnabled: Boolean(row.mfa_enabled),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRoleRow(row: any): Role {
    return {
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description,
      level: row.level,
      createdAt: row.created_at,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.driver.get('SELECT * FROM users WHERE email = ?', [email]);
    return row ? this.mapRow(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.driver.get('SELECT * FROM users WHERE id = ?', [id]);
    return row ? this.mapRow(row) : null;
  }

  async findByIdWithRole(id: string): Promise<UserWithRole | null> {
    const row = await this.driver.get(`
      SELECT u.*, r.name as role_name, r.display_name as role_display_name, r.level as role_level
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [id]);

    if (!row) return null;
    return {
      ...this.mapRow(row),
      roleName: row.role_name,
      roleDisplayName: row.role_display_name,
      roleLevel: row.role_level,
    };
  }

  async list(params: ListUsersParams = {}): Promise<{ data: User[]; total: number }> {
    const { role, roleId, organisationId, status, page = 1, pageSize = 50 } = params;
    const conditions: string[] = [];
    const values: any[] = [];

    if (roleId) {
      conditions.push('u.role_id = ?');
      values.push(roleId);
    } else if (role) {
      conditions.push('r.name = ?');
      values.push(role);
    }

    if (organisationId) {
      conditions.push('u.organisation_id = ?');
      values.push(organisationId);
    }

    if (status) {
      conditions.push('u.status = ?');
      values.push(status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await this.driver.get(
      `SELECT COUNT(*) as count FROM users u LEFT JOIN roles r ON u.role_id = r.id ${where}`,
      values
    );
    // Number(): PostgreSQL returns COUNT(*) as a bigint, which `pg` hands back as
    // a string. `total` is declared a number and callers do arithmetic on it.
    const total = Number(countRow.count);

    const offset = (page - 1) * pageSize;
    const rows = await this.driver.all(
      `SELECT u.* FROM users u LEFT JOIN roles r ON u.role_id = r.id ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return {
      data: rows.map(row => this.mapRow(row)),
      total,
    };
  }

  async create(input: CreateUserInput): Promise<User> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.driver.run(`
      INSERT INTO users (id, email, first_name, last_name, display_name, role_id, organisation_id, status, password_hash, mfa_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      input.email,
      input.firstName,
      input.lastName,
      input.displayName || `${input.firstName} ${input.lastName}`,
      input.roleId,
      input.organisationId || null,
      input.status || 'active',
      input.passwordHash || null,
      // A real boolean, not 1/0. mfa_enabled is BOOLEAN in PostgreSQL, which
      // rejects an integer outright; the SQLite adapter converts for its own
      // INTEGER column.
      input.mfaEnabled ?? false,
      now,
      now,
    ]);

    return (await this.findById(id))!;
  }

  async update(id: string, data: Partial<CreateUserInput>): Promise<User> {
    const now = new Date().toISOString();
    const sets: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (data.email !== undefined) { sets.push('email = ?'); values.push(data.email); }
    if (data.firstName !== undefined) { sets.push('first_name = ?'); values.push(data.firstName); }
    if (data.lastName !== undefined) { sets.push('last_name = ?'); values.push(data.lastName); }
    if (data.displayName !== undefined) { sets.push('display_name = ?'); values.push(data.displayName); }
    if (data.roleId !== undefined) { sets.push('role_id = ?'); values.push(data.roleId); }
    if (data.organisationId !== undefined) { sets.push('organisation_id = ?'); values.push(data.organisationId); }
    if (data.status !== undefined) { sets.push('status = ?'); values.push(data.status); }
    if (data.passwordHash !== undefined) { sets.push('password_hash = ?'); values.push(data.passwordHash); }
    // Bound as a boolean for the same reason as create() above.
    if (data.mfaEnabled !== undefined) { sets.push('mfa_enabled = ?'); values.push(data.mfaEnabled); }

    values.push(id);
    await this.driver.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);

    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    await this.driver.run('DELETE FROM users WHERE id = ?', [id]);
  }

  // ─── Roles ──────────────────────────────────

  async findRoleById(id: string): Promise<Role | null> {
    const row = await this.driver.get('SELECT * FROM roles WHERE id = ?', [id]);
    return row ? this.mapRoleRow(row) : null;
  }

  async findRoleByName(name: string): Promise<Role | null> {
    const row = await this.driver.get('SELECT * FROM roles WHERE name = ?', [name]);
    return row ? this.mapRoleRow(row) : null;
  }

  async listRoles(): Promise<Role[]> {
    const rows = await this.driver.all('SELECT * FROM roles ORDER BY level DESC');
    return rows.map(r => this.mapRoleRow(r));
  }

  // ─── Permissions ────────────────────────────

  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const rows = await this.driver.all(`
      SELECT p.* FROM permissions p
      JOIN role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = ?
      ORDER BY p.resource, p.action
    `, [roleId]);

    return rows.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      resource: r.resource,
      action: r.action,
    }));
  }

  async getPermissionsForUser(userId: string): Promise<Permission[]> {
    const user = await this.findById(userId);
    if (!user) return [];
    return this.getPermissionsForRole(user.roleId);
  }

  async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const row = await this.driver.get(`
      SELECT 1 FROM users u
      JOIN role_permissions rp ON rp.role_id = u.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE u.id = ? AND p.code = ?
    `, [userId, permissionCode]);
    return !!row;
  }

  // ─── Sessions ───────────────────────────────

  /**
   * Record a session for a token.
   *
   * Stores the token's `jti` claim, **not the token**. The `sessions` table used to hold
   * whole bearer tokens in plaintext, which made it a store of live, directly replayable
   * credentials for the length of their eight-hour life: any read of it — a backup, a
   * read replica, a debug `SELECT *`, an operator with database access — was immediate
   * session hijack for every logged-in user, with no cracking step in between.
   *
   * The `jti` is a random UUID that identifies the session without being usable as one,
   * so the table becomes useless to a reader while revocation still works. `jwt.ts`
   * always intended this: "Callers must check the `jti` against stored sessions."
   *
   * The column keeps its name for compatibility; what changed is what goes in it.
   */
  async createSession(userId: string, token: string, expiresAt: string): Promise<Session> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const jti = extractJti(token);

    await this.driver.run(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, userId, jti, expiresAt, now]);

    // The token is returned to the caller, which is where it belongs; only the handle
    // was persisted.
    return { id, userId, token, expiresAt, createdAt: now };
  }

  /** Look a session up from a presented token, by the token's `jti`. */
  async findSessionByToken(token: string): Promise<Session | null> {
    const row = await this.driver.get('SELECT * FROM sessions WHERE token = ?', [extractJti(token)]);
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }

  async deleteSession(token: string): Promise<void> {
    await this.driver.run('DELETE FROM sessions WHERE token = ?', [extractJti(token)]);
  }

  async deleteExpiredSessions(): Promise<number> {
    const now = new Date().toISOString();
    const result = await this.driver.run('DELETE FROM sessions WHERE expires_at < ?', [now]);
    return result.changes;
  }
}
