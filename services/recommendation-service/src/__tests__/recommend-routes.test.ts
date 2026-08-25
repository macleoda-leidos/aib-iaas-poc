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

describe('Recommendation Service - Routes', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${(server.address() as any).port}`;
        resolve();
      });
    });
  });

  afterAll(() => { server?.close(); });

  describe('POST /api/recommend', () => {
    const baseInput = {
      totalDebt: 12000,
      numberOfCreditors: 3,
      monthlyIncome: 2000,
      monthlyExpenditure: 1700,
      employmentStatus: 'employed',
      hasAssets: false,
      totalAssetValue: 0,
      existingCases: [],
      hasMoratorium: false,
    };

    it('returns a recommendation for valid input', async () => {
      const res = await request('POST', '/api/recommend', baseInput);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.recommendedProduct).toBeDefined();
      expect(res.data.data.confidence).toBeDefined();
      expect(res.data.data.factors).toBeDefined();
      expect(res.data.data.reasoning).toBeDefined();
    });

    it('recommends DAS for medium debt with disposable income', async () => {
      const res = await request('POST', '/api/recommend', {
        ...baseInput,
        totalDebt: 15000,
        monthlyIncome: 2000,
        monthlyExpenditure: 1700,
      });
      expect(res.status).toBe(200);
      expect(res.data.data.recommendedProduct).toBe('debt_arrangement_scheme');
    });

    it('recommends a repayment programme for very low debt', async () => {
      // See rules.test.ts — the £1,500 floor this once asserted was abolished.
      const res = await request('POST', '/api/recommend', { ...baseInput, totalDebt: 800 });
      expect(res.status).toBe(200);
      expect(res.data.data.recommendedProduct).toBe('debt_payment_programme');
    });

    it('recommends moratorium when moratorium is active', async () => {
      const res = await request('POST', '/api/recommend', { ...baseInput, hasMoratorium: true });
      expect(res.status).toBe(200);
      expect(res.data.data.recommendedProduct).toBe('moratorium');
    });

    it('recommends MAP for low income unemployed with low assets', async () => {
      const res = await request('POST', '/api/recommend', {
        ...baseInput,
        totalDebt: 8000,
        monthlyIncome: 900,
        monthlyExpenditure: 880,
        employmentStatus: 'unemployed',
        totalAssetValue: 500,
      });
      expect(res.status).toBe(200);
      expect(res.data.data.recommendedProduct).toBe('minimal_asset_process');
    });

    it('recommends bankruptcy for very high debt with no disposable income', async () => {
      const res = await request('POST', '/api/recommend', {
        ...baseInput,
        totalDebt: 50000,
        monthlyIncome: 1500,
        monthlyExpenditure: 1600,
      });
      expect(res.status).toBe(200);
      expect(res.data.data.recommendedProduct).toBe('bankruptcy');
    });

    it('recommends PTD for debt with significant assets', async () => {
      const res = await request('POST', '/api/recommend', {
        ...baseInput,
        totalDebt: 30000,
        hasAssets: true,
        totalAssetValue: 15000,
      });
      expect(res.status).toBe(200);
      expect(res.data.data.recommendedProduct).toBe('protected_trust_deed');
    });
  });

  describe('POST /api/recommend/explain', () => {
    it('returns an explanation for a product', async () => {
      const res = await request('POST', '/api/recommend/explain', {
        product: 'bankruptcy',
        factors: ['high_debt', 'no_disposable_income'],
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.explanation).toBeDefined();
      expect(res.data.data.explanation).toContain('sequestration');
    });

    it('returns explanation for DAS', async () => {
      const res = await request('POST', '/api/recommend/explain', {
        product: 'debt_arrangement_scheme',
        factors: [],
      });
      expect(res.status).toBe(200);
      expect(res.data.data.explanation).toContain('DAS');
    });

    it('returns signposting explanation for unknown product', async () => {
      const res = await request('POST', '/api/recommend/explain', {
        product: 'unknown_thing',
        factors: [],
      });
      expect(res.status).toBe(200);
      expect(res.data.data.explanation).toContain('advice');
    });
  });

  describe('GET /api/health', () => {
    it('returns healthy status', async () => {
      const res = await request('GET', '/api/health');
      expect(res.status).toBe(200);
      expect(res.data.status).toBe('healthy');
      expect(res.data.service).toBe('recommendation-service');
    });
  });
});
