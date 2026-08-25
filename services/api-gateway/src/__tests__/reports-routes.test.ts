import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index';
import http from 'http';

let server: http.Server;
let baseUrl: string;

// Create a valid admin token with reports.read permission
function adminToken(): string {
  return Buffer.from(JSON.stringify({
    userId: 'USR-001',
    email: 'admin@aib.example.gov.scot',
    role: 'system_admin',
    roleLevel: 100,
    permissions: ['reports.read', 'applications.read'],
    exp: Date.now() + 60 * 60 * 1000,
  })).toString('base64');
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
      const token = Buffer.from(JSON.stringify({
        userId: 'USR-009',
        email: 'debtor@example.com',
        role: 'debtor',
        roleLevel: 10,
        // A real debtor's grant set: applications.read, but no reports.read.
        permissions: ['applications.read'],
        exp: Date.now() + 60000,
      })).toString('base64');

      const res = await request('GET', '/api/reports/dashboard', { Authorization: `Bearer ${token}` });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/reports/dashboard', () => {
    it('returns dashboard data with valid auth', async () => {
      const res = await request('GET', '/api/reports/dashboard', { Authorization: `Bearer ${adminToken()}` });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.summary).toBeDefined();
      expect(res.data.data.summary.totalApplications).toBeGreaterThanOrEqual(0);
    });

    it('dashboard contains byStatus data', async () => {
      const res = await request('GET', '/api/reports/dashboard', { Authorization: `Bearer ${adminToken()}` });
      expect(res.data.data.byStatus).toBeDefined();
      expect(Array.isArray(res.data.data.byStatus)).toBe(true);
    });

    it('dashboard contains byProduct data', async () => {
      const res = await request('GET', '/api/reports/dashboard', { Authorization: `Bearer ${adminToken()}` });
      expect(res.data.data.byProduct).toBeDefined();
      expect(res.data.data.byProduct.length).toBeGreaterThan(0);
      expect(res.data.data.byProduct[0]).toHaveProperty('product');
      expect(res.data.data.byProduct[0]).toHaveProperty('count');
    });

    it('dashboard contains trends data', async () => {
      const res = await request('GET', '/api/reports/dashboard', { Authorization: `Bearer ${adminToken()}` });
      expect(res.data.data.trends).toBeDefined();
      expect(res.data.data.trends.weeklyApplications).toBeDefined();
      expect(res.data.data.trends.monthlyApplications).toBeDefined();
    });

    it('dashboard contains performance data', async () => {
      const res = await request('GET', '/api/reports/dashboard', { Authorization: `Bearer ${adminToken()}` });
      expect(res.data.data.performance).toBeDefined();
      expect(res.data.data.performance.creditCheckSuccessRate).toBeDefined();
    });

    it('dashboard contains geographic data', async () => {
      const res = await request('GET', '/api/reports/dashboard', { Authorization: `Bearer ${adminToken()}` });
      expect(res.data.data.geographic).toBeDefined();
      expect(res.data.data.geographic.length).toBeGreaterThan(0);
    });

    it('dashboard contains financial data', async () => {
      const res = await request('GET', '/api/reports/dashboard', { Authorization: `Bearer ${adminToken()}` });
      expect(res.data.data.financial).toBeDefined();
      expect(res.data.data.financial.debtBands).toBeDefined();
    });
  });

  describe('GET /api/reports/by-product', () => {
    it('returns product breakdown with valid auth', async () => {
      const res = await request('GET', '/api/reports/by-product', { Authorization: `Bearer ${adminToken()}` });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.products).toBeDefined();
      expect(res.data.data.products.length).toBeGreaterThan(0);
    });

    it('each product entry has expected fields', async () => {
      const res = await request('GET', '/api/reports/by-product', { Authorization: `Bearer ${adminToken()}` });
      const product = res.data.data.products[0];
      expect(product).toHaveProperty('product');
      expect(product).toHaveProperty('code');
      expect(product).toHaveProperty('active');
      expect(product).toHaveProperty('completed');
      expect(product).toHaveProperty('avgDebt');
    });
  });

  describe('GET /api/reports/organisation-activity', () => {
    it('returns organisation data with valid auth', async () => {
      const res = await request('GET', '/api/reports/organisation-activity', { Authorization: `Bearer ${adminToken()}` });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.organisations).toBeDefined();
      expect(res.data.data.organisations.length).toBeGreaterThan(0);
    });

    it('filters by orgType query parameter', async () => {
      const res = await request('GET', '/api/reports/organisation-activity?orgType=money_adviser', { Authorization: `Bearer ${adminToken()}` });
      expect(res.status).toBe(200);
      const orgs = res.data.data.organisations;
      orgs.forEach((org: any) => {
        expect(org.type).toBe('money_adviser');
      });
    });
  });

  describe('GET /api/reports/processing-times', () => {
    it('returns processing time data with valid auth', async () => {
      const res = await request('GET', '/api/reports/processing-times', { Authorization: `Bearer ${adminToken()}` });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.averages).toBeDefined();
      expect(res.data.data.slaCompliance).toBeDefined();
    });

    it('averages contain expected time measurements', async () => {
      const res = await request('GET', '/api/reports/processing-times', { Authorization: `Bearer ${adminToken()}` });
      const avg = res.data.data.averages;
      expect(avg.submissionToReview).toBeDefined();
      expect(avg.submissionToReview.hours).toBeDefined();
      expect(avg.submissionToReview.target).toBeDefined();
      expect(avg.totalEndToEnd).toBeDefined();
    });

    it('slaCompliance includes target percentage', async () => {
      const res = await request('GET', '/api/reports/processing-times', { Authorization: `Bearer ${adminToken()}` });
      expect(res.data.data.slaCompliance.withinTarget).toBeDefined();
      expect(res.data.data.slaCompliance.withinTarget).toBeGreaterThan(0);
    });
  });
});
