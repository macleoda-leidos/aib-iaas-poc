import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index';
import http from 'http';

let server: http.Server;
let baseUrl: string;

function request(method: string, path: string): Promise<{ status: number; data: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    http.request({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers: { 'Content-Type': 'application/json' } }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode || 0, data: JSON.parse(d), headers: res.headers }); } catch { resolve({ status: res.statusCode || 0, data: d, headers: res.headers }); } });
    }).on('error', reject).end();
  });
}

describe('API Gateway - Reports Export', () => {
  beforeAll(async () => { await new Promise<void>(r => { server = app.listen(0, () => { baseUrl = `http://localhost:${(server.address() as any).port}`; r(); }); }); });
  afterAll(() => { server?.close(); });

  it('GET /api/reports/export/weekly-report returns CSV', async () => {
    const res = await request('GET', '/api/reports/export/weekly-report');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('IAAS_Weekly_Report');
    expect(res.data).toContain('EXECUTIVE SUMMARY');
    expect(res.data).toContain('APPLICATIONS BY STATUS');
    expect(res.data).toContain('FINANCIAL ANALYSIS');
  });

  it('GET /api/reports/export/monthly-report returns CSV', async () => {
    const res = await request('GET', '/api/reports/export/monthly-report');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.data).toContain('Monthly Summary');
  });

  it('weekly report contains all 10 sections', async () => {
    const res = await request('GET', '/api/reports/export/weekly-report');
    const sections = ['EXECUTIVE SUMMARY', 'APPLICATIONS BY STATUS', 'RECOMMENDED PRODUCTS', 'FINANCIAL ANALYSIS', 'SYSTEM INTEGRATION HEALTH', 'ORGANISATION ACTIVITY', 'STAFF PRODUCTIVITY', 'CREDITOR IMPACT', 'COMPLIANCE', 'FORECAST'];
    sections.forEach(section => {
      expect(res.data).toContain(section);
    });
  });
});
