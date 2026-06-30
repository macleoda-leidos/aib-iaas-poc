// Set env BEFORE importing app (latency middleware reads at module level)
process.env.MOCK_LATENCY_MIN_MS = '0';
process.env.MOCK_LATENCY_MAX_MS = '1';
process.env.MOCK_FAILURE_RATE = '0';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index';
import http from 'http';

let server: http.Server;
let baseUrl: string;

function request(method: string, path: string, body?: any): Promise<{ status: number; data: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = { hostname: url.hostname, port: url.port, path: url.pathname, method, headers: { 'Content-Type': 'application/json' } };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve({ status: res.statusCode || 0, data: JSON.parse(data), headers: res.headers }); } catch { resolve({ status: res.statusCode || 0, data, headers: res.headers }); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('Mock Integrations - HTTP Endpoints', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(() => { server?.close(); });

  it('GET /api/mock/health returns all systems healthy', async () => {
    const res = await request('GET', '/api/mock/health');
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('healthy');
    expect(res.data.systems.length).toBe(8);
  });

  it('POST /api/basys/lookup returns found for surname SMITH', async () => {
    const res = await request('POST', '/api/basys/lookup', { lastName: 'SMITH', dateOfBirth: '1980-01-01' });
    expect(res.status).toBe(200);
    expect(res.data.system).toBe('BASYS');
    expect(res.data.data.found).toBe(true);
    expect(res.data.data.caseReference).toMatch(/^SEQ-/);
  });

  it('POST /api/basys/lookup returns not_found for unknown name', async () => {
    const res = await request('POST', '/api/basys/lookup', { lastName: 'NOBODY', dateOfBirth: '1990-01-01' });
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('not_found');
    expect(res.data.data.found).toBe(false);
  });

  it('POST /api/eden/lookup returns found for surname starting with M', async () => {
    const res = await request('POST', '/api/eden/lookup', { lastName: 'Morrison' });
    expect(res.status).toBe(200);
    expect(res.data.data.found).toBe(true);
    expect(res.data.data.arrangementReference).toMatch(/^DAS-ARR-/);
  });

  it('POST /api/das/lookup returns found for debt in range', async () => {
    const res = await request('POST', '/api/das/lookup', { totalDebt: 10000 });
    expect(res.status).toBe(200);
    expect(res.data.data.found).toBe(true);
    expect(res.data.data.programmeReference).toMatch(/^DPP-/);
  });

  it('POST /api/das/lookup returns not_found for high debt', async () => {
    const res = await request('POST', '/api/das/lookup', { totalDebt: 50000 });
    expect(res.status).toBe(200);
    expect(res.data.data.found).toBe(false);
  });

  it('POST /api/cft/lookup always returns providers', async () => {
    const res = await request('POST', '/api/cft/lookup', {});
    expect(res.status).toBe(200);
    expect(res.data.data.found).toBe(true);
    expect(res.data.data.providers.length).toBeGreaterThan(0);
  });

  it('POST /api/moratorium/check returns found for EH postcode', async () => {
    const res = await request('POST', '/api/moratorium/check', { postcode: 'EH1 1AA' });
    expect(res.status).toBe(200);
    expect(res.data.data.found).toBe(true);
    expect(res.data.data.moratoriumReference).toMatch(/^MOR-/);
  });

  it('POST /api/moratorium/check returns not_found for G postcode', async () => {
    const res = await request('POST', '/api/moratorium/check', { postcode: 'G1 1AA' });
    expect(res.status).toBe(200);
    expect(res.data.data.found).toBe(false);
  });

  it('POST /api/roi/search returns found for name containing TEST', async () => {
    const res = await request('POST', '/api/roi/search', { lastName: 'Testerton' });
    expect(res.status).toBe(200);
    expect(res.data.data.found).toBe(true);
    expect(res.data.data.entries.length).toBeGreaterThan(0);
  });

  it('POST /api/credit-check/run returns credit score', async () => {
    const res = await request('POST', '/api/credit-check/run', { firstName: 'John', lastName: 'Test', dateOfBirth: '1985-01-01', address: { line1: '1 Test', postcode: 'EH1 1AA' } });
    expect(res.status).toBe(200);
    expect(res.data.data.creditScore).toBeGreaterThanOrEqual(200);
    expect(res.data.data.creditScore).toBeLessThanOrEqual(800);
    expect(res.data.data.provider).toContain('PLACEHOLDER');
  });

  it('all responses have X-Mock-Service header', async () => {
    const res = await request('POST', '/api/basys/lookup', { lastName: 'Test' });
    expect(res.headers['x-mock-service']).toBe('true');
  });

  it('all responses have timestamp', async () => {
    const res = await request('POST', '/api/basys/lookup', { lastName: 'Test' });
    expect(res.data.timestamp).toBeDefined();
    expect(new Date(res.data.timestamp).getTime()).toBeGreaterThan(0);
  });
});
