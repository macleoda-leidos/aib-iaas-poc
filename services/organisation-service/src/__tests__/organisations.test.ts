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

describe('Organisation Service - /api/organisations', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${(server.address() as any).port}`;
        resolve();
      });
    });
  });

  afterAll(() => { server?.close(); });

  describe('GET /api/organisations', () => {
    it('returns all organisations', async () => {
      const res = await request('GET', '/api/organisations');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
      expect(res.data.meta.totalCount).toBeGreaterThan(0);
    });

    it('filters by type when query param provided', async () => {
      const res = await request('GET', '/api/organisations?type=money_adviser');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      for (const org of res.data.data) {
        expect(org.type).toBe('money_adviser');
      }
    });

    it('filters by status', async () => {
      const res = await request('GET', '/api/organisations?status=active');

      expect(res.status).toBe(200);
      for (const org of res.data.data) {
        expect(org.status).toBe('active');
      }
    });
  });

  describe('GET /api/organisations/:id', () => {
    it('returns single organisation with children', async () => {
      const res = await request('GET', '/api/organisations/org-aib');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toBe('org-aib');
      expect(res.data.data.name).toBe('Accountant in Bankruptcy');
      expect(res.data.data.children).toBeDefined();
    });

    it('returns 404 for unknown ID', async () => {
      const res = await request('GET', '/api/organisations/ORG-NONEXIST-999');

      expect(res.status).toBe(404);
      expect(res.data.success).toBe(false);
      expect(res.data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/organisations', () => {
    it('creates a new organisation with required fields', async () => {
      const res = await request('POST', '/api/organisations', {
        name: 'Test Money Adviser Ltd',
        type: 'money_adviser',
        contactEmail: 'info@test-ma.example.com',
        addressCity: 'Edinburgh',
        addressPostcode: 'EH1 1AA',
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toBeDefined();
      expect(res.data.data.name).toBe('Test Money Adviser Ltd');
      expect(res.data.data.type).toBe('money_adviser');
    });

    it('creates organisation with parent relationship', async () => {
      const res = await request('POST', '/api/organisations', {
        name: 'Test Sub-Office',
        type: 'money_adviser',
        parentId: 'org-cas',
        addressCity: 'Glasgow',
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.parentId).toBe('org-cas');
    });
  });

  describe('PUT /api/organisations/:id', () => {
    it('updates an existing organisation', async () => {
      const res = await request('PUT', '/api/organisations/org-stepchange', {
        name: 'StepChange Scotland Updated',
        contactEmail: 'updated@stepchange.example.org',
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.name).toBe('StepChange Scotland Updated');
    });

    it('returns 404 when updating non-existent organisation', async () => {
      const res = await request('PUT', '/api/organisations/ORG-FAKE-999', {
        name: 'This should fail',
      });

      expect(res.status).toBe(404);
      expect(res.data.success).toBe(false);
      expect(res.data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/organisations/type/:type', () => {
    it('returns active organisations filtered by type', async () => {
      const res = await request('GET', '/api/organisations/type/trustee');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      for (const org of res.data.data) {
        expect(org.type).toBe('trustee');
      }
    });
  });

  describe('Organisation type validation', () => {
    it('supports all valid organisation types', async () => {
      // Verify seed data includes multiple types
      const res = await request('GET', '/api/organisations');
      const types = [...new Set(res.data.data.map((o: any) => o.type))];

      expect(types).toContain('aib');
      expect(types).toContain('money_adviser');
      expect(types).toContain('creditor');
      expect(types).toContain('trustee');
    });
  });
});
