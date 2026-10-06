import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { signToken, buildClaims } from '@aib-iaas/auth';
import { app } from '../index';
import http from 'http';

// Verifies the deployed-shape default-deny posture (C2): every protected route
// requires a valid token, authorisation is enforced per resource, and only the
// documented public allow-list is reachable anonymously. The consolidated-api is
// excluded from coverage (deployment wiring), but this behaviour is the whole
// point of Phase 1 and must be proven somewhere.

let server: http.Server;
let baseUrl: string;

function request(method: string, path: string, body?: any, headers: Record<string, string> = {}): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers: { 'Content-Type': 'application/json', ...headers } },
      res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve({ status: res.statusCode || 0, data: JSON.parse(d) }); } catch { resolve({ status: res.statusCode || 0, data: d }); } }); }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const adminToken = () => signToken(buildClaims(
  { id: 'user-admin', email: 'admin@aib-poc.example.com', roleName: 'system_admin', roleLevel: 100, organisationId: 'org-aib' },
  ['users.read', 'organisations.read', 'audit.read', 'reports.read', 'credit_check.read', 'documents.read']
));
const debtorToken = () => signToken(buildClaims(
  { id: 'user-debtor', email: 'john.testerton@example.com', roleName: 'debtor', roleLevel: 10 },
  ['applications.read']
));

describe('Consolidated API — default-deny access control', () => {
  beforeAll(async () => {
    await new Promise<void>(r => { server = app.listen(0, () => { baseUrl = `http://localhost:${(server.address() as any).port}`; r(); }); });
  });
  afterAll(() => { server?.close(); });

  describe('public allow-list is reachable anonymously', () => {
    it('GET /api/health → 200', async () => {
      expect((await request('GET', '/api/health')).status).toBe(200);
    });
    it('GET / (root) → 200', async () => {
      expect((await request('GET', '/')).status).toBe(200);
    });
    it('GET /api/postcode/:postcode → 200', async () => {
      expect((await request('GET', '/api/postcode/EH1%201AA')).status).toBe(200);
    });
    it('POST /api/applications (anonymous intake) → 201', async () => {
      const res = await request('POST', '/api/applications', { applicant: { firstName: 'Anon', lastName: 'Applicant' } });
      expect(res.status).toBe(201);
    });
  });

  describe('protected routes reject anonymous requests with 401', () => {
    const protectedRoutes: Array<[string, string]> = [
      ['GET', '/api/users'],
      ['GET', '/api/organisations'],
      ['GET', '/api/audit/events'],
      ['GET', '/api/reports/dashboard'],
      ['GET', '/api/applications'],
      ['GET', '/api/credit-check/history'],
    ];
    it.each(protectedRoutes)('%s %s → 401', async (method, path) => {
      const res = await request(method, path);
      expect(res.status).toBe(401);
    });
  });

  describe('authorisation is enforced for authenticated callers', () => {
    it('GET /api/users with a token lacking users.read → 403', async () => {
      const res = await request('GET', '/api/users', undefined, { Authorization: `Bearer ${debtorToken()}` });
      expect(res.status).toBe(403);
    });

    it('GET /api/users with a token holding users.read → 200', async () => {
      const res = await request('GET', '/api/users', undefined, { Authorization: `Bearer ${adminToken()}` });
      expect(res.status).toBe(200);
    });
  });

  describe('brute-force limiter (M1) and revocation (1h)', () => {
    it('locks out after repeated login attempts (6th → 429)', async () => {
      const creds = { email: 'brute@test.example', password: 'wrong' };
      // First 5 attempts are ordinary rejections; the 6th trips the limiter.
      for (let i = 0; i < 5; i++) {
        const res = await request('POST', '/api/auth/login', creds);
        expect(res.status).toBe(401);
      }
      const blocked = await request('POST', '/api/auth/login', creds);
      expect(blocked.status).toBe(429);
      expect(blocked.data.error.code).toBe('RATE_LIMITED');
    });

    it('rejects a token after logout', async () => {
      const login = await request('POST', '/api/auth/login', { email: 'adviser@cas.example.org', password: 'demo' });
      const token = login.data.data.token;
      expect(token).toBeDefined();

      const before = await request('GET', '/api/auth/me', undefined, { Authorization: `Bearer ${token}` });
      expect(before.status).toBe(200);

      const out = await request('POST', '/api/auth/logout', {}, { Authorization: `Bearer ${token}` });
      expect(out.status).toBe(200);

      const after = await request('GET', '/api/auth/me', undefined, { Authorization: `Bearer ${token}` });
      expect(after.status).toBe(401);
    });
  });
});
