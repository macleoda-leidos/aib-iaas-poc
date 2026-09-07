// Use in-memory DB for isolated tests
process.env.USER_DB_PATH = ':memory:';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index';
import http from 'http';
import { issueAccessToken } from '@aib-iaas/auth';

let server: http.Server;
let baseUrl: string;

function request(method: string, path: string, body?: any, headers?: Record<string, string>): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode || 0, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode || 0, data: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Bearer header for the seeded system administrator.
 *
 * The user and role routes now require an authenticated caller with an explicit
 * permission. They previously required nothing, and the tests in this file asserted
 * that open behaviour — so adding the guards turned fourteen of them red, which was the
 * correct signal rather than a regression.
 *
 * Obtained by logging in through the real endpoint rather than by minting a token
 * directly, so these tests also exercise the login → session → guard path end to end.
 */
let adminAuth: Record<string, string>;

describe('User Service - Routes', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${(server.address() as any).port}`;
        resolve();
      });
    });

    const login = await request('POST', '/api/auth/login', {
      email: 'admin@aib-poc.example.com',
      password: 'any',
    });
    adminAuth = { Authorization: `Bearer ${login.data.data.token}` };
  });

  afterAll(() => { server?.close(); });

  /**
   * The privilege-escalation chain that was open, as a regression test.
   *
   * Three unauthenticated requests used to yield a *legitimately signed* administrator
   * session: read every roleId from `/api/roles`, create an account naming
   * `role-sysadmin`, then log in with any password. No forgery was involved, so signing
   * the tokens had bought nothing against it — which is why each step is pinned here
   * separately rather than as one flow.
   */
  describe('privilege escalation is closed', () => {
    it('will not list roles to an anonymous caller', async () => {
      // Step one: the roleId vocabulary was the reconnaissance the rest depended on.
      const res = await request('GET', '/api/roles');
      expect(res.status).toBe(401);
    });

    it('will not create an account for an anonymous caller', async () => {
      const res = await request('POST', '/api/users', {
        email: `anon-${Date.now()}@evil.test`,
        firstName: 'Mal',
        lastName: 'Actor',
        roleId: 'role-sysadmin',
      });
      expect(res.status).toBe(401);
    });

    it('will not let an anonymous caller change an existing account', async () => {
      // The same defect against a real officer: role and status came from the body, so
      // any staff account could be promoted, demoted or deactivated.
      const res = await request('PUT', '/api/users/user-demo', { roleId: 'role-debtor', status: 'deactivated' });
      expect(res.status).toBe(401);

      const stillIntact = await request('GET', '/api/users/user-demo', undefined, adminAuth);
      expect(stillIntact.data.data.status).toBe('active');
    });

    it('will not let a caller assign a role above their own level', async () => {
      // `users.create` without this is an escalation primitive for anyone holding it: a
      // senior officer at level 80 could mint themselves a system administrator at 100.
      const senior = await request('POST', '/api/users', {
        email: `senior-${Date.now()}@aib.test`,
        firstName: 'Sen',
        lastName: 'Officer',
        roleId: 'role-senior',
      }, adminAuth);
      expect(senior.status).toBe(201);

      const seniorLogin = await request('POST', '/api/auth/login', { email: senior.data.data.email, password: 'any' });
      const seniorAuth = { Authorization: `Bearer ${seniorLogin.data.data.token}` };

      // Allowed: a role below their own.
      const allowed = await request('POST', '/api/users', {
        email: `officer-${Date.now()}@aib.test`, firstName: 'A', lastName: 'B', roleId: 'role-officer',
      }, seniorAuth);
      expect(allowed.status).toBe(201);

      // Refused: a role above their own.
      const refused = await request('POST', '/api/users', {
        email: `esc-${Date.now()}@aib.test`, firstName: 'E', lastName: 'S', roleId: 'role-sysadmin',
      }, seniorAuth);
      expect(refused.status).toBe(403);
      expect(refused.data.error.message).toContain('more authority than your own');
    });

    it('will not let a caller modify an account above their own level', async () => {
      // Otherwise demoting or deactivating your own supervisor is a denial of service
      // against the person who oversees you.
      const seniorLogin = await request('POST', '/api/auth/login', { email: 'admin@aib-poc.example.com', password: 'any' });
      void seniorLogin;

      const senior = await request('POST', '/api/users', {
        email: `senior2-${Date.now()}@aib.test`, firstName: 'Sen', lastName: 'Two', roleId: 'role-senior',
      }, adminAuth);
      const seniorAuth = { Authorization: `Bearer ${(await request('POST', '/api/auth/login', { email: senior.data.data.email, password: 'any' })).data.data.token}` };

      const res = await request('PUT', '/api/users/user-admin', { roleId: 'role-debtor' }, seniorAuth);
      expect(res.status).toBe(403);
    });

    it('refuses an unknown roleId as a bad request, not a server error', async () => {
      // The repository would otherwise fail on a foreign key, turning a malformed
      // request into a 500.
      const res = await request('POST', '/api/users', {
        email: `unknown-${Date.now()}@aib.test`, firstName: 'A', lastName: 'B', roleId: 'role-does-not-exist',
      }, adminAuth);
      expect(res.status).toBe(403);
      expect(res.data.error.message).toContain('Unknown role');
    });

    it('does not disclose the caller’s own permission set in a 403', async () => {
      // The 403 body used to return `granted` beside `required`, handing an attacker
      // both the permission they needed and the full list they held.
      const debtorLogin = await request('POST', '/api/auth/login', { email: 'john.testerton@example.com', password: 'any' });
      const res = await request('GET', '/api/users', undefined, {
        Authorization: `Bearer ${debtorLogin.data.data.token}`,
      });

      expect(res.status).toBe(403);
      expect(res.data.error.details).toHaveProperty('required');
      expect(res.data.error.details).not.toHaveProperty('granted');
    });

    it('still allows login itself, which is mounted under the guarded prefix', async () => {
      // `/api/users/auth` sits under `/api/users`, and Express matches mount prefixes in
      // registration order — so once `usersRouter` carried router-level `authenticate`,
      // mounting it first made login unreachable and locked everyone out. The
      // consolidated API mounts the auth router first for this reason.
      const res = await request('POST', '/api/auth/login', { email: 'admin@aib-poc.example.com', password: 'any' });
      expect(res.status).toBe(200);
      expect(res.data.data.token).toBeDefined();
    });
  });

  describe('GET /api/health', () => {
    it('returns healthy status', async () => {
      const res = await request('GET', '/api/health');
      expect(res.status).toBe(200);
      expect(res.data.status).toBe('healthy');
      expect(res.data.service).toBe('user-service');
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns token for seeded admin user', async () => {
      const res = await request('POST', '/api/auth/login', { email: 'admin@aib-poc.example.com', password: 'any' });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.token).toBeDefined();
      expect(res.data.data.user.role).toBe('system_admin');
      expect(res.data.data.user.permissions).toBeDefined();
      expect(res.data.data.user.permissions.length).toBeGreaterThan(0);
    });

    it('returns token for seeded adviser user', async () => {
      const res = await request('POST', '/api/auth/login', { email: 'adviser@cas.example.org', password: 'any' });
      expect(res.status).toBe(200);
      expect(res.data.data.user.role).toBe('money_adviser');
    });

    it('returns token for seeded debtor user', async () => {
      const res = await request('POST', '/api/auth/login', { email: 'john.testerton@example.com', password: 'any' });
      expect(res.status).toBe(200);
      expect(res.data.data.user.role).toBe('debtor');
    });

    it('rejects missing email', async () => {
      const res = await request('POST', '/api/auth/login', { password: 'test' });
      expect(res.status).toBe(400);
      expect(res.data.error.code).toBe('INVALID_INPUT');
    });

    it('rejects unknown email', async () => {
      const res = await request('POST', '/api/auth/login', { email: 'notexist@example.com', password: 'test' });
      expect(res.status).toBe(401);
      expect(res.data.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns user from valid token', async () => {
      const loginRes = await request('POST', '/api/auth/login', { email: 'admin@aib-poc.example.com', password: 'test' });
      const token = loginRes.data.data.token;

      const res = await request('GET', '/api/auth/me', undefined, { Authorization: `Bearer ${token}` });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.email).toBe('admin@aib-poc.example.com');
    });

    it('rejects missing token', async () => {
      const res = await request('GET', '/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.data.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects invalid token', async () => {
      const res = await request('GET', '/api/auth/me', undefined, { Authorization: 'Bearer invalidtoken' });
      expect(res.status).toBe(401);
      expect(res.data.error.code).toBe('INVALID_TOKEN');
    });

    it('rejects expired token', async () => {
      // A genuinely signed token that has lapsed, which is the only way to reach
      // TOKEN_EXPIRED now: an unsigned one is refused as INVALID_TOKEN before its
      // expiry is ever consulted, since an unverified claim about time is worth no
      // more than an unverified claim about role.
      const { token } = issueAccessToken({
        userId: 'user-admin',
        email: 'admin@aib-poc.example.com',
        role: 'system_admin',
        ttlSeconds: -10,
      });

      const res = await request('GET', '/api/auth/me', undefined, { Authorization: `Bearer ${token}` });
      expect(res.status).toBe(401);
      expect(res.data.error.code).toBe('TOKEN_EXPIRED');
    });

    it('rejects an unsigned token as invalid rather than expired', async () => {
      const legacy = Buffer.from(JSON.stringify({
        userId: 'user-admin',
        email: 'admin@aib-poc.example.com',
        role: 'system_admin',
        exp: Date.now() + 60_000,
      })).toString('base64');

      const res = await request('GET', '/api/auth/me', undefined, { Authorization: `Bearer ${legacy}` });
      expect(res.status).toBe(401);
      expect(res.data.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('logs out successfully', async () => {
      const loginRes = await request('POST', '/api/auth/login', { email: 'admin@aib-poc.example.com', password: 'test' });
      const token = loginRes.data.data.token;

      const res = await request('POST', '/api/auth/logout', {}, { Authorization: `Bearer ${token}` });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.message).toBe('Logged out');
    });

    it('returns success even without token', async () => {
      const res = await request('POST', '/api/auth/logout', {});
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('makes the token unusable immediately afterwards', async () => {
      // The point of validating sessions server-side. Before this, logout deleted a
      // row nothing consulted, so the token it "revoked" kept working for its full
      // eight-hour life.
      const loginRes = await request('POST', '/api/auth/login', { email: 'admin@aib-poc.example.com', password: 'test' });
      const token = loginRes.data.data.token;

      const before = await request('GET', '/api/auth/me', undefined, { Authorization: `Bearer ${token}` });
      expect(before.status).toBe(200);

      await request('POST', '/api/auth/logout', {}, { Authorization: `Bearer ${token}` });

      const after = await request('GET', '/api/auth/me', undefined, { Authorization: `Bearer ${token}` });
      expect(after.status).toBe(401);
      expect(after.data.error.code).toBe('SESSION_ENDED');
    });
  });

  describe('POST /api/auth/check-permission', () => {
    it('returns true for admin with assigned permission', async () => {
      const res = await request('POST', '/api/auth/check-permission', {
        userId: 'user-admin',
        // Codes come from seed-data/permissions.json via rbac.ts. This asserted
        // 'application.read.all' — one of the invented codes that only ever
        // existed in schema.ts's parallel grant table, removed when the three
        // divergent RBAC definitions were consolidated (GAP-011).
        permission: 'applications.read',
      });
      expect(res.status).toBe(200);
      expect(res.data.data.hasPermission).toBe(true);
    });

    it('returns false for debtor with admin permission', async () => {
      const res = await request('POST', '/api/auth/check-permission', {
        userId: 'user-debtor',
        permission: 'system.admin',
      });
      expect(res.status).toBe(200);
      expect(res.data.data.hasPermission).toBe(false);
    });
  });

  describe('GET /api/users', () => {
    it('lists all users', async () => {
      const res = await request('GET', '/api/users', undefined, adminAuth);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
      expect(res.data.meta.totalCount).toBeGreaterThan(0);
    });

    it('filters by role', async () => {
      const res = await request('GET', '/api/users?role=debtor', undefined, adminAuth);
      expect(res.status).toBe(200);
      // All returned users should have role-debtor as their roleId
      res.data.data.forEach((user: any) => {
        expect(user.roleId).toBe('role-debtor');
      });
    });

    it('filters by status', async () => {
      const res = await request('GET', '/api/users?status=active', undefined, adminAuth);
      expect(res.status).toBe(200);
      res.data.data.forEach((user: any) => {
        expect(user.status).toBe('active');
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns user by ID', async () => {
      const res = await request('GET', '/api/users/user-admin', undefined, adminAuth);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toBe('user-admin');
      expect(res.data.data.email).toBe('admin@aib-poc.example.com');
      expect(res.data.data.permissions).toBeDefined();
    });

    it('returns 404 for unknown user ID', async () => {
      const res = await request('GET', '/api/users/NONEXISTENT', undefined, adminAuth);
      expect(res.status).toBe(404);
      expect(res.data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/users', () => {
    const uniqueSuffix = Date.now();

    it('creates a new user', async () => {
      const res = await request('POST', '/api/users', {
        email: `newuser-${uniqueSuffix}@test.example.com`,
        firstName: 'New',
        lastName: 'User',
        roleId: 'role-debtor',
      }, adminAuth);
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toBeDefined();
      expect(res.data.data.email).toBe(`newuser-${uniqueSuffix}@test.example.com`);
    });

    it('rejects duplicate email', async () => {
      const dupEmail = `duplicate-${uniqueSuffix}@test.example.com`;
      // First create
      await request('POST', '/api/users', {
        email: dupEmail,
        firstName: 'Dup',
        lastName: 'User',
        roleId: 'role-debtor',
      }, adminAuth);
      // Try duplicate
      const res = await request('POST', '/api/users', {
        email: dupEmail,
        firstName: 'Dup2',
        lastName: 'User2',
        roleId: 'role-debtor',
      }, adminAuth);
      expect(res.status).toBe(409);
      expect(res.data.error.code).toBe('DUPLICATE');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('updates a user', async () => {
      const res = await request('PUT', '/api/users/user-debtor', {
        firstName: 'Jonathan',
        lastName: 'Testerton',
      }, adminAuth);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.firstName).toBe('Jonathan');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('deactivates a user', async () => {
      // Create a user to deactivate
      const create = await request('POST', '/api/users', {
        email: `todelete-${Date.now()}@test.example.com`,
        firstName: 'Delete',
        lastName: 'Me',
        roleId: 'role-debtor',
      }, adminAuth);
      const id = create.data.data.id;

      const res = await request('DELETE', `/api/users/${id}`, undefined, adminAuth);
      expect(res.status).toBe(200);
      expect(res.data.data.deactivated).toBe(true);

      // Verify the user is deactivated
      const check = await request('GET', `/api/users/${id}`, undefined, adminAuth);
      expect(check.data.data.status).toBe('deactivated');
    });
  });

  describe('GET /api/roles', () => {
    it('lists all roles', async () => {
      const res = await request('GET', '/api/roles', undefined, adminAuth);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/roles/:id', () => {
    it('returns role with permissions', async () => {
      const res = await request('GET', '/api/roles/role-sysadmin', undefined, adminAuth);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.name).toBe('system_admin');
      expect(res.data.data.permissions).toBeDefined();
      expect(res.data.data.permissions.length).toBeGreaterThan(0);
    });

    it('returns 404 for unknown role', async () => {
      const res = await request('GET', '/api/roles/ROLE-NONEXISTENT', undefined, adminAuth);
      expect(res.status).toBe(404);
      expect(res.data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/roles/matrix/full', () => {
    it('returns full permissions matrix', async () => {
      const res = await request('GET', '/api/roles/matrix/full', undefined, adminAuth);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.roles).toBeDefined();
      expect(res.data.data.matrix).toBeDefined();
      expect(res.data.data.matrix.length).toBeGreaterThan(0);
    });

    it('matrix entries have permissions array', async () => {
      const res = await request('GET', '/api/roles/matrix/full', undefined, adminAuth);
      const firstRole = res.data.data.matrix[0];
      expect(firstRole.permissions).toBeDefined();
      expect(Array.isArray(firstRole.permissions)).toBe(true);
    });
  });
});
