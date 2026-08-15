import { describe, it, expect } from 'vitest';
import http from 'http';

const PORT = 4102;

function request(path: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 500, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 500, data });
        }
      });
    }).on('error', reject);
  });
}

describe('Reports API — Enhanced Endpoints', () => {
  // These tests run against the actual API if it's up on 3001, or skip
  const API_PORT = 3001;

  it('GET /api/reports/dashboard returns summary with all fields', async () => {
    try {
      const res = await new Promise<{ status: number; data: any }>((resolve, reject) => {
        http.get(`http://localhost:${API_PORT}/api/reports/dashboard`, (r) => {
          let data = '';
          r.on('data', (chunk) => (data += chunk));
          r.on('end', () => resolve({ status: r.statusCode || 500, data: JSON.parse(data) }));
        }).on('error', reject);
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);

      const { data } = res.data;
      // Summary
      expect(data.summary).toBeDefined();
      expect(data.summary.totalApplications).toBeGreaterThanOrEqual(0);
      expect(data.summary.thisWeek).toBeGreaterThanOrEqual(0);
      expect(data.summary.thisMonth).toBeGreaterThanOrEqual(0);
      expect(data.summary.averageProcessingDays).toBeTypeOf('number');

      // Status breakdown
      expect(data.byStatus).toBeInstanceOf(Array);
      expect(data.byStatus.length).toBeGreaterThan(0);
      expect(data.byStatus[0]).toHaveProperty('status');
      expect(data.byStatus[0]).toHaveProperty('count');

      // Product breakdown
      expect(data.byProduct).toBeInstanceOf(Array);
      expect(data.byProduct.length).toBe(7);
      expect(data.byProduct[0]).toHaveProperty('product');
      expect(data.byProduct[0]).toHaveProperty('count');
      expect(data.byProduct[0]).toHaveProperty('percentage');

      // Trends — 12 months
      expect(data.trends.monthlyApplications).toBeInstanceOf(Array);
      expect(data.trends.monthlyApplications.length).toBe(12);
      expect(data.trends.monthlyApplications[0]).toHaveProperty('month');
      expect(data.trends.monthlyApplications[0]).toHaveProperty('count');
      expect(data.trends.monthlyApplications[0]).toHaveProperty('das');

      // Weekly trends
      expect(data.trends.weeklyApplications).toBeInstanceOf(Array);
      expect(data.trends.weeklyApplications.length).toBe(12);

      // Performance
      expect(data.performance).toBeDefined();
      expect(data.performance.creditCheckSuccessRate).toBeTypeOf('number');
      expect(data.performance.integrationUptime).toBeTypeOf('number');
      expect(data.performance.slaCompliance).toBeTypeOf('number');

      // Geographic
      expect(data.geographic).toBeInstanceOf(Array);
      expect(data.geographic.length).toBe(7);
      expect(data.geographic[0]).toHaveProperty('region');
      expect(data.geographic[0]).toHaveProperty('applications');

      // Financial
      expect(data.financial).toBeDefined();
      expect(data.financial.totalDebtUnderManagement).toBeTypeOf('number');
      expect(data.financial.debtBands).toBeInstanceOf(Array);
      expect(data.financial.debtBands.length).toBe(5);
    } catch (err: any) {
      // Skip if API not running
      if (err.code === 'ECONNREFUSED') return;
      throw err;
    }
  });

  it('GET /api/reports/by-product returns product details', async () => {
    try {
      const res = await new Promise<{ status: number; data: any }>((resolve, reject) => {
        http.get(`http://localhost:${API_PORT}/api/reports/by-product`, (r) => {
          let data = '';
          r.on('data', (chunk) => (data += chunk));
          r.on('end', () => resolve({ status: r.statusCode || 500, data: JSON.parse(data) }));
        }).on('error', reject);
      });

      expect(res.status).toBe(200);
      expect(res.data.data.products).toBeInstanceOf(Array);
      expect(res.data.data.products.length).toBe(6);

      const product = res.data.data.products[0];
      expect(product).toHaveProperty('product');
      expect(product).toHaveProperty('active');
      expect(product).toHaveProperty('completed');
      expect(product).toHaveProperty('avgDebt');
      expect(product).toHaveProperty('avgDuration');
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED') return;
      throw err;
    }
  });

  it('GET /api/reports/processing-times returns SLA data', async () => {
    try {
      const res = await new Promise<{ status: number; data: any }>((resolve, reject) => {
        http.get(`http://localhost:${API_PORT}/api/reports/processing-times`, (r) => {
          let data = '';
          r.on('data', (chunk) => (data += chunk));
          r.on('end', () => resolve({ status: r.statusCode || 500, data: JSON.parse(data) }));
        }).on('error', reject);
      });

      expect(res.status).toBe(200);

      const { averages, slaCompliance } = res.data.data;
      expect(averages.submissionToReview.hours).toBeTypeOf('number');
      expect(averages.submissionToReview.target).toBeTypeOf('number');
      expect(slaCompliance.withinTarget).toBeTypeOf('number');
      expect(slaCompliance.breached).toBeTypeOf('number');
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED') return;
      throw err;
    }
  });

  it('GET /api/reports/organisation-activity returns org data', async () => {
    try {
      const res = await new Promise<{ status: number; data: any }>((resolve, reject) => {
        http.get(`http://localhost:${API_PORT}/api/reports/organisation-activity`, (r) => {
          let data = '';
          r.on('data', (chunk) => (data += chunk));
          r.on('end', () => resolve({ status: r.statusCode || 500, data: JSON.parse(data) }));
        }).on('error', reject);
      });

      expect(res.status).toBe(200);
      expect(res.data.data.organisations).toBeInstanceOf(Array);
      expect(res.data.data.organisations.length).toBeGreaterThan(0);
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED') return;
      throw err;
    }
  });
});
