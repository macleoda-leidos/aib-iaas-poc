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

describe('Integration Orchestrator - /api/integrations', () => {
  beforeAll(async () => {
    // Set mock integrations URL to something that won't connect
    // This tests the graceful error handling paths
    process.env.MOCK_INTEGRATIONS_URL = 'http://localhost:19999';
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${(server.address() as any).port}`;
        resolve();
      });
    });
  });

  afterAll(() => { server?.close(); });

  const checkAllInput = {
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: '1985-03-15',
    nationalInsuranceNumber: 'AB123456C',
    postcode: 'EH1 1AA',
    totalDebt: 15000,
  };

  describe('POST /api/integrations/check-all', () => {
    it('runs all 6 system checks and returns results array', async () => {
      const res = await request('POST', '/api/integrations/check-all', checkAllInput);

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.results).toHaveLength(6);
      expect(res.data.data.requestId).toBeDefined();
      expect(res.data.data.timestamp).toBeDefined();
    });

    it('returns results with system name, status, found boolean, and responseTime', async () => {
      const res = await request('POST', '/api/integrations/check-all', checkAllInput);

      const results = res.data.data.results;
      for (const result of results) {
        expect(result).toHaveProperty('system');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('found');
        expect(result).toHaveProperty('responseTime');
        expect(typeof result.responseTime).toBe('number');
        expect(typeof result.found).toBe('boolean');
      }
    });

    it('handles system connection failures gracefully (does not crash)', async () => {
      const res = await request('POST', '/api/integrations/check-all', checkAllInput);

      // Even if all systems fail, we get a 200 with error results
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.results).toHaveLength(6);

      // All should be errors since mock service is not running
      const errorResults = res.data.data.results.filter((r: any) => r.status === 'error');
      expect(errorResults.length).toBe(6);
    });

    it('reports found=false for all failed checks', async () => {
      const res = await request('POST', '/api/integrations/check-all', checkAllInput);

      for (const result of res.data.data.results) {
        if (result.status === 'error') {
          expect(result.found).toBe(false);
        }
      }
    });

    it('summary includes totalChecks, casesFound, and errors counts', async () => {
      const res = await request('POST', '/api/integrations/check-all', checkAllInput);

      const summary = res.data.data.summary;
      expect(summary).toHaveProperty('totalChecks', 6);
      expect(summary).toHaveProperty('casesFound');
      expect(summary).toHaveProperty('errors');
      expect(typeof summary.casesFound).toBe('number');
      expect(typeof summary.errors).toBe('number');
      expect(summary.totalChecks).toBe(6);
    });

    it('includes all 6 systems: BASYS, eDEN, DAS, CFT, Moratorium, RoI', async () => {
      const res = await request('POST', '/api/integrations/check-all', checkAllInput);

      const systems = res.data.data.results.map((r: any) => r.system);
      expect(systems).toContain('BASYS');
      expect(systems).toContain('eDEN');
      expect(systems).toContain('DAS');
      expect(systems).toContain('CFT');
      expect(systems).toContain('Moratorium');
      expect(systems).toContain('RoI');
    });

    it('all checks run in parallel (completes within timeout, not 6x timeout)', async () => {
      const start = Date.now();
      const res = await request('POST', '/api/integrations/check-all', checkAllInput);
      const elapsed = Date.now() - start;

      expect(res.status).toBe(200);
      // If sequential with 5s timeout each, would take 30s
      // Parallel should complete much faster (connection refused is nearly instant)
      expect(elapsed).toBeLessThan(10000);
    });
  });

  describe('POST /api/integrations/check/:system', () => {
    it('returns 400 for unknown system', async () => {
      const res = await request('POST', '/api/integrations/check/unknown_system', checkAllInput);

      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
      expect(res.data.error.code).toBe('INVALID_SYSTEM');
      expect(res.data.error.message).toContain('Unknown system: unknown_system');
    });

    it('attempts to check a valid system (returns 502 when backend unavailable)', async () => {
      const res = await request('POST', '/api/integrations/check/basys', checkAllInput);

      // Backend is not running so we expect a 502
      expect(res.status).toBe(502);
      expect(res.data.success).toBe(false);
      expect(res.data.error.code).toBe('INTEGRATION_ERROR');
    });
  });

  describe('GET /api/health', () => {
    it('returns healthy status', async () => {
      const res = await request('GET', '/api/health');

      expect(res.status).toBe(200);
      expect(res.data.status).toBe('healthy');
      expect(res.data.service).toBe('integration-orchestrator');
    });
  });
});
