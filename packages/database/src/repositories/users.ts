import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

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
  constructor(private db: Database.Database) {}

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

  findByEmail(email: string): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    return row ? this.mapRow(row) : null;
  }

  findById(id: string): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    return row ? this.mapRow(row) : null;
  }

  findByIdWithRole(id: string): UserWithRole | null {
    const row = this.db.prepare(`
      SELECT u.*, r.name as role_name, r.display_name as role_display_name, r.level as role_level
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).get(id) as any;

    if (!row) return null;
    return {
      ...this.mapRow(row),
      roleName: row.role_name,
      roleDisplayName: row.role_display_name,
      roleLevel: row.role_level,
    };
  }

  list(params: ListUsersParams = {}): { data: User[]; total: number } {
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

    const countRow = this.db.prepare(
      `SELECT COUNT(*) as count FROM users u LEFT JOIN roles r ON u.role_id = r.id ${where}`
    ).get(...values) as any;
    const total = countRow.count;

    const offset = (page - 1) * pageSize;
    const rows = this.db.prepare(
      `SELECT u.* FROM users u LEFT JOIN roles r ON u.role_id = r.id ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`
    ).all(...values, pageSize, offset) as any[];

    return {
      data: rows.map(row => this.mapRow(row)),
      total,
    };
  }

  create(input: CreateUserInput): User {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO users (id, email, first_name, last_name, display_name, role_id, organisation_id, status, password_hash, mfa_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.email,
      input.firstName,
      input.lastName,
      input.displayName || `${input.firstName} ${input.lastName}`,
      input.roleId,
      input.organisationId || null,
      input.status || 'active',
      input.passwordHash || null,
      input.mfaEnabled ? 1 : 0,
      now,
      now
    );

    return this.findById(id)!;
  }

  update(id: string, data: Partial<CreateUserInput>): User {
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
    if (data.mfaEnabled !== undefined) { sets.push('mfa_enabled = ?'); values.push(data.mfaEnabled ? 1 : 0); }

    values.push(id);
    this.db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }

  // ─── Roles ──────────────────────────────────

  findRoleById(id: string): Role | null {
    const row = this.db.prepare('SELECT * FROM roles WHERE id = ?').get(id) as any;
    return row ? this.mapRoleRow(row) : null;
  }

  findRoleByName(name: string): Role | null {
    const row = this.db.prepare('SELECT * FROM roles WHERE name = ?').get(name) as any;
    return row ? this.mapRoleRow(row) : null;
  }

  listRoles(): Role[] {
    const rows = this.db.prepare('SELECT * FROM roles ORDER BY level DESC').all() as any[];
    return rows.map(r => this.mapRoleRow(r));
  }

  // ─── Permissions ────────────────────────────

  getPermissionsForRole(roleId: string): Permission[] {
    const rows = this.db.prepare(`
      SELECT p.* FROM permissions p
      JOIN role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = ?
      ORDER BY p.resource, p.action
    `).all(roleId) as any[];

    return rows.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      resource: r.resource,
      action: r.action,
    }));
  }

  getPermissionsForUser(userId: string): Permission[] {
    const user = this.findById(userId);
    if (!user) return [];
    return this.getPermissionsForRole(user.roleId);
  }

  hasPermission(userId: string, permissionCode: string): boolean {
    const row = this.db.prepare(`
      SELECT 1 FROM users u
      JOIN role_permissions rp ON rp.role_id = u.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE u.id = ? AND p.code = ?
    `).get(userId, permissionCode) as any;
    return !!row;
  }

  // ─── Sessions ───────────────────────────────

  createSession(userId: string, token: string, expiresAt: string): Session {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, token, expiresAt, now);

    return { id, userId, token, expiresAt, createdAt: now };
  }

  findSessionByToken(token: string): Session | null {
    const row = this.db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as any;
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }

  deleteSession(token: string): void {
    this.db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }

  deleteExpiredSessions(): number {
    const now = new Date().toISOString();
    const result = this.db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
    return result.changes;
  }
}
