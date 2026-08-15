// Set env before importing app to use temp DB path
process.env.CREDIT_CHECK_DB_PATH = ':memory:';

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

describe('Credit Check Service - Routes', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${(server.address() as any).port}`;
        resolve();
      });
    });
  });

  afterAll(() => { server?.close(); });

  describe('POST /api/credit-check/run', () => {
    const validInput = {
      applicationId: 'APP-001',
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: '1985-03-15',
      nationalInsuranceNumber: 'AB123456A',
      currentAddress: { line1: '1 Test St', postcode: 'EH1 1AA', city: 'Edinburgh' },
      consentGiven: true,
    };

    it('returns credit check result with consent given', async () => {
      const res = await request('POST', '/api/credit-check/run', validInput);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.creditScore).toBeDefined();
      expect(res.data.data.applicationId).toBe('APP-001');
      expect(res.data.data.provider).toBeDefined();
      expect(res.data.data.consentRecorded).toBe(true);
      expect(res.data.data.sandbox).toBe(true);
    });

    it('rejects when consent is not given', async () => {
      const res = await request('POST', '/api/credit-check/run', { ...validInput, consentGiven: false });
      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
      expect(res.data.error.code).toBe('CONSENT_REQUIRED');
    });

    it('returns cached result on duplicate request', async () => {
      // First request - sets cache
      const res1 = await request('POST', '/api/credit-check/run', validInput);
      expect(res1.status).toBe(200);

      // Second request with same person - should hit cache
      const res2 = await request('POST', '/api/credit-check/run', validInput);
      expect(res2.status).toBe(200);
      expect(res2.data.data.fromCache).toBe(true);
    });

    it('rejects invalid provider', async () => {
      const res = await request('POST', '/api/credit-check/run', {
        ...validInput,
        lastName: 'InvalidProviderTest',
        nationalInsuranceNumber: 'ZZ000000Z',
        provider: 'nonexistent',
      });
      expect(res.status).toBe(400);
      expect(res.data.error.code).toBe('INVALID_PROVIDER');
    });

    it('uses synthetic provider by default', async () => {
      const res = await request('POST', '/api/credit-check/run', {
        ...validInput,
        lastName: 'UniqueNameForDefault',
        nationalInsuranceNumber: 'ZZ999999A',
      });
      expect(res.status).toBe(200);
      expect(res.data.data.provider).toContain('Synthetic');
    });

    it('uses experian provider when specified', async () => {
      const res = await request('POST', '/api/credit-check/run', {
        ...validInput,
        lastName: 'ExperianTest',
        nationalInsuranceNumber: 'EX123456A',
        provider: 'experian',
      });
      expect(res.status).toBe(200);
      expect(res.data.data.provider).toContain('Experian');
    });

    it('uses equifax provider when specified', async () => {
      const res = await request('POST', '/api/credit-check/run', {
        ...validInput,
        lastName: 'EquifaxTest',
        nationalInsuranceNumber: 'EQ123456A',
        provider: 'equifax',
      });
      expect(res.status).toBe(200);
      expect(res.data.data.provider).toContain('Equifax');
    });

    it('includes disclaimer in response', async () => {
      const res = await request('POST', '/api/credit-check/run', {
        ...validInput,
        lastName: 'DisclaimerTest',
        nationalInsuranceNumber: 'DT123456A',
      });
      expect(res.status).toBe(200);
      expect(res.data.data.disclaimer).toContain('PLACEHOLDER');
    });
  });

  describe('GET /api/credit-check/history/:applicationId', () => {
    it('returns history for application', async () => {
      const res = await request('GET', '/api/credit-check/history/APP-001');
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.applicationId).toBe('APP-001');
      expect(res.data.data.checks).toBeDefined();
    });
  });

  describe('GET /api/credit-check/providers', () => {
    it('returns available providers', async () => {
      const res = await request('GET', '/api/credit-check/providers');
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.length).toBe(3);
    });

    it('each provider has expected fields', async () => {
      const res = await request('GET', '/api/credit-check/providers');
      const provider = res.data.data[0];
      expect(provider).toHaveProperty('id');
      expect(provider).toHaveProperty('name');
      expect(provider).toHaveProperty('displayName');
      expect(provider).toHaveProperty('status');
      expect(provider).toHaveProperty('sandbox');
      expect(provider).toHaveProperty('features');
      expect(provider.sandbox).toBe(true);
    });
  });

  describe('POST /api/credit-check/consent', () => {
    it('records consent', async () => {
      const res = await request('POST', '/api/credit-check/consent', {
        applicationId: 'APP-001',
        debtorId: 'DEB-001',
        consentType: 'credit_check',
        consentGiven: true,
      });
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.consentId).toBeDefined();
      expect(res.data.data.applicationId).toBe('APP-001');
      expect(res.data.data.consentGiven).toBe(true);
      expect(res.data.data.recordedAt).toBeDefined();
      expect(res.data.data.expiresAt).toBeDefined();
    });

    it('uses default consentType if not provided', async () => {
      const res = await request('POST', '/api/credit-check/consent', {
        applicationId: 'APP-002',
        debtorId: 'DEB-002',
        consentGiven: true,
      });
      expect(res.status).toBe(201);
      expect(res.data.data.consentType).toBe('credit_check');
    });
  });

  describe('GET /api/health', () => {
    it('returns healthy status', async () => {
      const res = await request('GET', '/api/health');
      expect(res.status).toBe(200);
      expect(res.data.status).toBe('healthy');
      expect(res.data.service).toBe('credit-check-service');
      expect(res.data.providers).toBeDefined();
    });
  });
});
