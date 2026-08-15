// Use in-memory DB for isolated tests
process.env.USER_DB_PATH = ':memory:';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index';
import http from 'http';

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

describe('User Service - Routes', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${(server.address() as any).port}`;
        resolve();
      });
    });
  });

  afterAll(() => { server?.close(); });

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
      const res = await request('POST', '/api/auth/login', { email: 'admin@aib.example.gov.scot', password: 'any' });
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
      const loginRes = await request('POST', '/api/auth/login', { email: 'admin@aib.example.gov.scot', password: 'test' });
      const token = loginRes.data.data.token;

      const res = await request('GET', '/api/auth/me', undefined, { Authorization: `Bearer ${token}` });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.email).toBe('admin@aib.example.gov.scot');
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
      const expiredToken = Buffer.from(JSON.stringify({
        userId: 'USR-001',
        email: 'admin@aib.example.gov.scot',
        role: 'system_admin',
        exp: Date.now() - 10000,
      })).toString('base64');

      const res = await request('GET', '/api/auth/me', undefined, { Authorization: `Bearer ${expiredToken}` });
      expect(res.status).toBe(401);
      expect(res.data.error.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('logs out successfully', async () => {
      const loginRes = await request('POST', '/api/auth/login', { email: 'admin@aib.example.gov.scot', password: 'test' });
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
  });

  describe('POST /api/auth/check-permission', () => {
    it('returns true for admin with any permission', async () => {
      const res = await request('POST', '/api/auth/check-permission', {
        userId: 'USR-001',
        permission: 'application.read.all',
      });
      expect(res.status).toBe(200);
      expect(res.data.data.hasPermission).toBe(true);
    });

    it('returns false for debtor with admin permission', async () => {
      const res = await request('POST', '/api/auth/check-permission', {
        userId: 'USR-009',
        permission: 'user.manage',
      });
      expect(res.status).toBe(200);
      expect(res.data.data.hasPermission).toBe(false);
    });
  });

  describe('GET /api/users', () => {
    it('lists all users', async () => {
      const res = await request('GET', '/api/users');
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
      expect(res.data.meta.totalCount).toBeGreaterThan(0);
    });

    it('filters by role', async () => {
      const res = await request('GET', '/api/users?role=debtor');
      expect(res.status).toBe(200);
      res.data.data.forEach((user: any) => {
        expect(user.role_name).toBe('debtor');
      });
    });

    it('filters by status', async () => {
      const res = await request('GET', '/api/users?status=active');
      expect(res.status).toBe(200);
      res.data.data.forEach((user: any) => {
        expect(user.status).toBe('active');
      });
    });

    it('searches by name', async () => {
      const res = await request('GET', '/api/users?search=Karen');
      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeGreaterThan(0);
      expect(res.data.data[0].first_name).toBe('Karen');
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns user by ID', async () => {
      const res = await request('GET', '/api/users/USR-001');
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toBe('USR-001');
      expect(res.data.data.email).toBe('admin@aib.example.gov.scot');
      expect(res.data.data.permissions).toBeDefined();
    });

    it('returns 404 for unknown user ID', async () => {
      const res = await request('GET', '/api/users/NONEXISTENT');
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
        roleId: 'ROLE-DEBTOR',
      });
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toMatch(/^USR-/);
      expect(res.data.data.email).toBe(`newuser-${uniqueSuffix}@test.example.com`);
    });

    it('rejects duplicate email', async () => {
      const dupEmail = `duplicate-${uniqueSuffix}@test.example.com`;
      // First create
      await request('POST', '/api/users', {
        email: dupEmail,
        firstName: 'Dup',
        lastName: 'User',
        roleId: 'ROLE-DEBTOR',
      });
      // Try duplicate
      const res = await request('POST', '/api/users', {
        email: dupEmail,
        firstName: 'Dup2',
        lastName: 'User2',
        roleId: 'ROLE-DEBTOR',
      });
      expect(res.status).toBe(409);
      expect(res.data.error.code).toBe('DUPLICATE');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('updates a user', async () => {
      const res = await request('PUT', '/api/users/USR-009', {
        firstName: 'Jonathan',
        lastName: 'Testerton',
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.first_name).toBe('Jonathan');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('deactivates a user', async () => {
      // Create a user to deactivate
      const create = await request('POST', '/api/users', {
        email: `todelete-${Date.now()}@test.example.com`,
        firstName: 'Delete',
        lastName: 'Me',
        roleId: 'ROLE-DEBTOR',
      });
      const id = create.data.data.id;

      const res = await request('DELETE', `/api/users/${id}`);
      expect(res.status).toBe(200);
      expect(res.data.data.deactivated).toBe(true);

      // Verify the user is deactivated
      const check = await request('GET', `/api/users/${id}`);
      expect(check.data.data.status).toBe('deactivated');
    });
  });

  describe('GET /api/roles', () => {
    it('lists all roles', async () => {
      const res = await request('GET', '/api/roles');
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
    });

    it('roles include permission count', async () => {
      const res = await request('GET', '/api/roles');
      const role = res.data.data[0];
      expect(role).toHaveProperty('permission_count');
      expect(role).toHaveProperty('active_users');
    });
  });

  describe('GET /api/roles/:id', () => {
    it('returns role with permissions', async () => {
      const res = await request('GET', '/api/roles/ROLE-SYSADMIN');
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.name).toBe('system_admin');
      expect(res.data.data.permissions).toBeDefined();
      expect(res.data.data.permissions.length).toBeGreaterThan(0);
    });

    it('returns 404 for unknown role', async () => {
      const res = await request('GET', '/api/roles/ROLE-NONEXISTENT');
      expect(res.status).toBe(404);
      expect(res.data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/roles/matrix/full', () => {
    it('returns full permissions matrix', async () => {
      const res = await request('GET', '/api/roles/matrix/full');
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.roles).toBeDefined();
      expect(res.data.data.permissions).toBeDefined();
      expect(res.data.data.matrix).toBeDefined();
      expect(res.data.data.matrix.length).toBeGreaterThan(0);
    });

    it('matrix entries have permissions with granted flag', async () => {
      const res = await request('GET', '/api/roles/matrix/full');
      const firstRole = res.data.data.matrix[0];
      expect(firstRole.permissions).toBeDefined();
      expect(firstRole.permissions[0]).toHaveProperty('granted');
    });
  });
});
