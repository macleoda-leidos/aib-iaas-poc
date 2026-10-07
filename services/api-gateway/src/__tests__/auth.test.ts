import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { currentTotpCode, DEMO_MFA_SECRET } from '@aib-iaas/auth';
import { app } from '../index';
import http from 'http';

let server: http.Server;
let baseUrl: string;

function request(method: string, path: string, body?: any, headers?: Record<string, string>): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const opts = { hostname: url.hostname, port: url.port, path: url.pathname, method, headers: { 'Content-Type': 'application/json', ...headers } };
    const req = http.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve({ status: res.statusCode || 0, data: JSON.parse(d) }); } catch { resolve({ status: res.statusCode || 0, data: d }); } }); });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('API Gateway - Auth', () => {
  beforeAll(async () => { await new Promise<void>(r => { server = app.listen(0, () => { baseUrl = `http://localhost:${(server.address() as any).port}`; r(); }); }); });
  afterAll(() => { server?.close(); });

  it('POST /api/auth/login returns mfaRequired (not a token) for an MFA account', async () => {
    // admin@aib-poc.example.com is seeded MFA-enabled. H4: no token before the
    // second factor is proven.
    const res = await request('POST', '/api/auth/login', { email: 'admin@aib-poc.example.com', password: 'demo' });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.mfaRequired).toBe(true);
    expect(res.data.data.challenge).toBeDefined();
    expect(res.data.data.token).toBeUndefined();
  });

  it('POST /api/auth/login returns a token for a non-MFA account', async () => {
    const res = await request('POST', '/api/auth/login', { email: 'adviser@cas.example.org', password: 'demo' });
    expect(res.status).toBe(200);
    expect(res.data.data.token).toBeDefined();
    expect(res.data.data.user.role).toBe('money_adviser');
    expect(res.data.data.user.permissions.length).toBeGreaterThan(0);
  });

  it('POST /api/auth/login rejects a wrong password', async () => {
    const res = await request('POST', '/api/auth/login', { email: 'adviser@cas.example.org', password: 'not-the-password' });
    expect(res.status).toBe(401);
    expect(res.data.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /api/auth/login rejects unknown user', async () => {
    const res = await request('POST', '/api/auth/login', { email: 'unknown@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.data.success).toBe(false);
  });

  it('POST /api/auth/login rejects missing email', async () => {
    const res = await request('POST', '/api/auth/login', { password: 'test' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login rejects an unknown field (Zod .strict)', async () => {
    const res = await request('POST', '/api/auth/login', { email: 'adviser@cas.example.org', password: 'demo', isAdmin: true });
    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/auth/login rejects a malformed email', async () => {
    const res = await request('POST', '/api/auth/login', { email: 'not-an-email', password: 'demo' });
    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/auth/verify-mfa issues a token for a correct TOTP', async () => {
    const login = await request('POST', '/api/auth/login', { email: 'admin@aib-poc.example.com', password: 'demo' });
    const challenge = login.data.data.challenge;
    const code = currentTotpCode(DEMO_MFA_SECRET);

    const res = await request('POST', '/api/auth/verify-mfa', { challenge, code });
    expect(res.status).toBe(200);
    expect(res.data.data.token).toBeDefined();
    expect(res.data.data.user.role).toBe('system_admin');
  });

  it('POST /api/auth/verify-mfa rejects an incorrect TOTP', async () => {
    const login = await request('POST', '/api/auth/login', { email: 'admin@aib-poc.example.com', password: 'demo' });
    const res = await request('POST', '/api/auth/verify-mfa', { challenge: login.data.data.challenge, code: '000000' });
    expect(res.status).toBe(401);
    expect(res.data.error.code).toBe('INVALID_MFA_CODE');
  });

  it('GET /api/auth/me returns user from valid token', async () => {
    const login = await request('POST', '/api/auth/login', { email: 'adviser@cas.example.org', password: 'demo' });
    const token = login.data.data.token;
    const res = await request('GET', '/api/auth/me', undefined, { Authorization: `Bearer ${token}` });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.email).toBe('adviser@cas.example.org');
  });

  it('GET /api/auth/me rejects missing token', async () => {
    const res = await request('GET', '/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me rejects invalid token', async () => {
    const res = await request('GET', '/api/auth/me', undefined, { Authorization: 'Bearer invalidtoken' });
    expect(res.status).toBe(401);
  });
});
