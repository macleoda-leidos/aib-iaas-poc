// Disable latency and failures for fast, deterministic tests
process.env.MOCK_LATENCY_MIN_MS = '0';
process.env.MOCK_LATENCY_MAX_MS = '1';
process.env.MOCK_FAILURE_RATE = '0';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index';
import http from 'http';

let server: http.Server;
let baseUrl: string;

function request(method: string, path: string, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
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

describe('Mock Integrations - eDEN/DASH', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${(server.address() as any).port}`;
        resolve();
      });
    });
  });

  afterAll(() => { server?.close(); });

  describe('POST /api/eden/lookup', () => {
    it('returns found for surname starting with M', async () => {
      const res = await request('POST', '/api/eden/lookup', { lastName: 'Morrison' });
      expect(res.status).toBe(200);
      expect(res.data.system).toBe('eDEN');
      expect(res.data.status).toBe('success');
      expect(res.data.data.found).toBe(true);
      expect(res.data.data.arrangementReference).toMatch(/^DAS-ARR-/);
      expect(res.data.data.status).toBe('active');
      expect(res.data.data.monthlyPayment).toBeDefined();
      expect(res.data.data.creditorCount).toBe(4);
    });

    it('returns not_found for surname not starting with M', async () => {
      const res = await request('POST', '/api/eden/lookup', { lastName: 'Jones' });
      expect(res.status).toBe(200);
      expect(res.data.system).toBe('eDEN');
      expect(res.data.status).toBe('not_found');
      expect(res.data.data.found).toBe(false);
    });

    it('is case-insensitive for M check', async () => {
      const res = await request('POST', '/api/eden/lookup', { lastName: 'macleod' });
      expect(res.status).toBe(200);
      expect(res.data.data.found).toBe(true);
    });

    it('includes timestamp in response', async () => {
      const res = await request('POST', '/api/eden/lookup', { lastName: 'Test' });
      expect(res.data.timestamp).toBeDefined();
      expect(new Date(res.data.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('includes requestId in response', async () => {
      const res = await request('POST', '/api/eden/lookup', { lastName: 'Test' });
      expect(res.data.requestId).toBeDefined();
      expect(res.data.requestId.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/eden/arrangement/:id', () => {
    it('returns arrangement details for given ID', async () => {
      const res = await request('GET', '/api/eden/arrangement/DAS-ARR-2022-007834');
      expect(res.status).toBe(200);
      expect(res.data.system).toBe('eDEN');
      expect(res.data.status).toBe('success');
      expect(res.data.data.arrangementReference).toBe('DAS-ARR-2022-007834');
      expect(res.data.data.status).toBe('active');
      expect(res.data.data.debtorName).toBeDefined();
      expect(res.data.data.totalDebt).toBeDefined();
      expect(res.data.data.totalPaid).toBeDefined();
    });

    it('returns creditor list in arrangement details', async () => {
      const res = await request('GET', '/api/eden/arrangement/DAS-ARR-2022-007834');
      expect(res.data.data.creditors).toBeDefined();
      expect(res.data.data.creditors.length).toBe(4);
      expect(res.data.data.creditors[0]).toHaveProperty('name');
      expect(res.data.data.creditors[0]).toHaveProperty('originalDebt');
      expect(res.data.data.creditors[0]).toHaveProperty('outstanding');
    });

    it('includes timestamp and requestId', async () => {
      const res = await request('GET', '/api/eden/arrangement/TEST-ID');
      expect(res.data.timestamp).toBeDefined();
      expect(res.data.requestId).toBeDefined();
    });
  });
});

describe('Mock Integrations - Register of Insolvencies (RoI)', () => {
  let server2: http.Server;
  let baseUrl2: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server2 = app.listen(0, () => {
        baseUrl2 = `http://localhost:${(server2.address() as any).port}`;
        resolve();
      });
    });
  });

  afterAll(() => { server2?.close(); });

  function req(method: string, path: string, body?: any): Promise<{ status: number; data: any }> {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl2);
      const opts = { hostname: url.hostname, port: url.port, path: url.pathname, method, headers: { 'Content-Type': 'application/json' } };
      const r = http.request(opts, (res) => {
        let d = ''; res.on('data', c => d += c);
        res.on('end', () => { try { resolve({ status: res.statusCode || 0, data: JSON.parse(d) }); } catch { resolve({ status: res.statusCode || 0, data: d }); } });
      });
      r.on('error', reject);
      if (body) r.write(JSON.stringify(body));
      r.end();
    });
  }

  describe('POST /api/roi/search', () => {
    it('returns found for name containing TEST', async () => {
      const res = await req('POST', '/api/roi/search', { lastName: 'Testerton' });
      expect(res.status).toBe(200);
      expect(res.data.system).toBe('RoI');
      expect(res.data.status).toBe('success');
      expect(res.data.data.found).toBe(true);
      expect(res.data.data.entries.length).toBe(1);
    });

    it('entry includes expected fields', async () => {
      const res = await req('POST', '/api/roi/search', { lastName: 'TESTING' });
      const entry = res.data.data.entries[0];
      expect(entry.entryId).toMatch(/^ROI-/);
      expect(entry.entryType).toBe('sequestration');
      expect(entry.status).toBe('discharged');
      expect(entry.trustee).toBeDefined();
    });

    it('returns not_found for name without TEST', async () => {
      const res = await req('POST', '/api/roi/search', { lastName: 'Jones' });
      expect(res.status).toBe(200);
      expect(res.data.system).toBe('RoI');
      expect(res.data.status).toBe('not_found');
      expect(res.data.data.found).toBe(false);
      expect(res.data.data.entries).toEqual([]);
    });

    it('is case-insensitive for TEST check', async () => {
      const res = await req('POST', '/api/roi/search', { lastName: 'testcase' });
      expect(res.data.data.found).toBe(true);
    });

    it('includes timestamp and requestId', async () => {
      const res = await req('POST', '/api/roi/search', { lastName: 'Any' });
      expect(res.data.timestamp).toBeDefined();
      expect(res.data.requestId).toBeDefined();
    });
  });

  describe('GET /api/roi/entry/:id', () => {
    it('returns entry details for given ID', async () => {
      const res = await req('GET', '/api/roi/entry/ROI-2018-012345');
      expect(res.status).toBe(200);
      expect(res.data.system).toBe('RoI');
      expect(res.data.status).toBe('success');
      expect(res.data.data.entryId).toBe('ROI-2018-012345');
      expect(res.data.data.entryType).toBe('sequestration');
      expect(res.data.data.debtorName).toBeDefined();
      expect(res.data.data.totalDebt).toBeDefined();
      expect(res.data.data.courtReference).toBeDefined();
    });

    it('includes address and date info', async () => {
      const res = await req('GET', '/api/roi/entry/ROI-TEST');
      expect(res.data.data.address).toBeDefined();
      expect(res.data.data.dateRegistered).toBeDefined();
      expect(res.data.data.dateOfDischarge).toBeDefined();
    });

    it('includes requestId and timestamp', async () => {
      const res = await req('GET', '/api/roi/entry/SOME-ID');
      expect(res.data.requestId).toBeDefined();
      expect(res.data.timestamp).toBeDefined();
    });
  });
});
