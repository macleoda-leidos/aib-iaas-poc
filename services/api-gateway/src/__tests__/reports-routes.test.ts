import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index';
import http from 'http';
import { issueAccessToken, generateKeyPairPem, resetSigningKeys } from '@aib-iaas/auth';
import { users } from '../db';

let server: http.Server;
let baseUrl: string;

/**
 * Tokens are minted for *real seeded users* with *real sessions*, because the route
 * no longer takes the caller's word for anything: the signature is verified, the
 * session is looked up, and the permission set comes from the database. A synthetic
 * `USR-001` with a hand-written permission list — which is what these tests used —
 * cannot satisfy any of those three, and its acceptance was the finding.
 *
 * `user-admin` holds reports.read via role-sysadmin; `user-debtor` does not.
 */
let adminBearer: string;
let debtorBearer: string;

async function login(userId: string, email: string, role: string, roleLevel: number): Promise<string> {
  const { token, expiresAt } = issueAccessToken({ userId, email, role, roleLevel });
  await users.createSession(userId, token, expiresAt);
  return token;
}

function adminToken(): string {
  return adminBearer;
}

function request(method: string, path: string, headers?: Record<string, string>): Promise<{ status: number; data: any }> {
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
    req.end();
  });
}

describe('API Gateway - Reports Routes', () => {
  beforeAll(async () => {
    const keys = generateKeyPairPem();
    process.env.JWT_PRIVATE_KEY = keys.privateKey;
    process.env.JWT_PUBLIC_KEY = keys.publicKey;
    resetSigningKeys();

    adminBearer = await login('user-admin', 'admin@aib-poc.example.com', 'system_admin', 100);
    debtorBearer = await login('user-debtor', 'john.testerton@example.com', 'debtor', 10);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${(server.address() as any).port}`;
        resolve();
      });
    });
  });

  afterAll(() => { server?.close(); });

  describe('Authentication requirement', () => {
    it('GET /api/reports/dashboard requires authentication', async () => {
      const res = await request('GET', '/api/reports/dashboard');
      expect(res.status).toBe(401);
    });

    it('GET /api/reports/dashboard rejects user without reports.read permission', async () => {
      // The debtor's grants are whatever the database says — this asserts against the
      // seeded RBAC data rather than a permission list the test invented, so it would
      // catch a seeding change that accidentally handed debtors report access.
      const res = await request('GET', '/api/reports/dashboard', { Authorization: `Bearer ${debtorBearer}` });
      expect(res.status).toBe(403);
    });

    it('GET /api/reports/dashboard rejects a forged unsigned token', async () => {
      // Regression: this is the token format the route accepted before signing, and
      // it granted itself reports.read simply by saying so.
      const forged = Buffer.from(JSON.stringify({
        userId: 'user-admin',
        email: 'admin@aib-poc.example.com',
        role: 'system_admin',
        roleLevel: 100,
        permissions: ['reports.read'],
        exp: Date.now() + 60000,
      })).toString('base64');

      const res = await request('GET', '/api/reports/dashboard', { Authorization: `Bearer ${forged}` });
      expect(res.status).toBe(401);
    });
  });

  /**
   * The aggregate values are asserted in reportsAggregation.test.ts, against a dataset
   * that file inserts. What remains here is the authorisation surface — these routes are
   * the only permission-gated ones in the repo — plus the reachability of each endpoint.
   *
   * The assertions this replaces checked that byProduct, trends and geographic were
   * present and non-empty. That was guaranteed by their being hardcoded, so every one
   * would have passed with the database dropped.
   */
  describe.each([
    ["/api/reports/dashboard"],
    ["/api/reports/by-product"],
    ["/api/reports/organisation-activity"],
    ["/api/reports/processing-times"],
  ])("%s", (path) => {
    it("answers 200 to an authorised caller", async () => {
      const res = await request("GET", path, { Authorization: `Bearer ${adminToken()}` });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it("refuses an unauthenticated caller", async () => {
      const res = await request("GET", path);
      expect(res.status).toBe(401);
    });

    it("refuses a caller without reports.read", async () => {
      const res = await request("GET", path, { Authorization: `Bearer ${debtorBearer}` });
      expect(res.status).toBe(403);
    });
  });
});
