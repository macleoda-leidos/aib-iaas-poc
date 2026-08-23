import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index';
import http from 'http';

let server: http.Server;
let baseUrl: string;

function request(method: string, path: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode || 0, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode || 0, data }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

describe('API Gateway - Postcode Lookup', () => {
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

  it('GET /api/postcode/EH1 1AA returns Edinburgh addresses', async () => {
    const res = await request('GET', '/api/postcode/EH1%201AA');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.postcode).toBe('EH1 1AA');
    expect(res.data.data.addresses).toHaveLength(3);
    expect(res.data.data.addresses[0].city).toBe('Edinburgh');
    expect(res.data.data.addresses[0].country).toBe('Scotland');
  });

  it('GET /api/postcode/G1 2AB returns Glasgow addresses', async () => {
    const res = await request('GET', '/api/postcode/G1%202AB');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.postcode).toBe('G1 2AB');
    expect(res.data.data.addresses).toHaveLength(3);
    expect(res.data.data.addresses[0].city).toBe('Glasgow');
  });

  it('GET /api/postcode/DD1 3CD returns Dundee addresses', async () => {
    const res = await request('GET', '/api/postcode/DD1%203CD');
    expect(res.status).toBe(200);
    expect(res.data.data.addresses).toHaveLength(2);
    expect(res.data.data.addresses[0].city).toBe('Dundee');
  });

  it('GET /api/postcode/AB10 1AB returns Aberdeen addresses', async () => {
    const res = await request('GET', '/api/postcode/AB10%201AB');
    expect(res.status).toBe(200);
    expect(res.data.data.addresses).toHaveLength(2);
    expect(res.data.data.addresses[0].city).toBe('Aberdeen');
  });

  it('returns synthetic addresses for unknown Edinburgh postcode', async () => {
    const res = await request('GET', '/api/postcode/EH3%205AA');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.addresses).toHaveLength(3);
    expect(res.data.data.addresses[0].city).toBe('Edinburgh');
    expect(res.data.data.note).toContain('PLACEHOLDER');
  });

  it('returns synthetic addresses for unknown Glasgow postcode', async () => {
    const res = await request('GET', '/api/postcode/G42%209XX');
    expect(res.status).toBe(200);
    expect(res.data.data.addresses[0].city).toBe('Glasgow');
  });

  it('returns synthetic addresses for Stirling postcode (FK prefix)', async () => {
    const res = await request('GET', '/api/postcode/FK8%201NJ');
    expect(res.status).toBe(200);
    expect(res.data.data.addresses[0].city).toBe('Stirling');
  });

  it('returns synthetic addresses for Inverness postcode (IV prefix)', async () => {
    const res = await request('GET', '/api/postcode/IV2%203AA');
    expect(res.status).toBe(200);
    expect(res.data.data.addresses[0].city).toBe('Inverness');
  });

  it('returns Sample Town for unrecognised postcode prefix', async () => {
    const res = await request('GET', '/api/postcode/SW1A%201AA');
    expect(res.status).toBe(200);
    expect(res.data.data.addresses[0].city).toBe('Sample Town');
  });

  it('addresses have correct structure with id, line1, city, postcode, country', async () => {
    const res = await request('GET', '/api/postcode/EH1%201AA');
    const addr = res.data.data.addresses[0];
    expect(addr.id).toMatch(/^ADDR-\d+$/);
    expect(addr.line1).toBeTruthy();
    expect(addr.city).toBeTruthy();
    expect(addr.postcode).toBe('EH1 1AA');
    expect(addr.country).toBe('Scotland');
  });
});
