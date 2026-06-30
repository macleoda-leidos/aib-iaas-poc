import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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

  it('POST /api/auth/login returns token for known user', async () => {
    const res = await request('POST', '/api/auth/login', { email: 'admin@aib-poc.example.com', password: 'any' });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.token).toBeDefined();
    expect(res.data.data.user.role).toBe('admin');
  });

  it('POST /api/auth/login accepts demo user', async () => {
    const res = await request('POST', '/api/auth/login', { email: 'demo@example.com', password: 'demo' });
    expect(res.status).toBe(200);
    expect(res.data.data.token).toBeDefined();
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

  it('GET /api/auth/me returns user from valid token', async () => {
    const login = await request('POST', '/api/auth/login', { email: 'demo@example.com', password: 'demo' });
    const token = login.data.data.token;
    const res = await request('GET', '/api/auth/me', undefined, { Authorization: `Bearer ${token}` });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.email).toBe('demo@example.com');
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
