import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAllClients,
  createBasysClient,
  createEdenClient,
  createDasClient,
  createCftClient,
  createMoratoriumClient,
  createRoiClient,
  createCreditClient,
} from '../factory';

describe('Integration Factory', () => {
  describe('createAllClients', () => {
    it('returns an object with 7 clients', () => {
      const clients = createAllClients({ mode: 'mock', failureRate: 0 });
      const keys = Object.keys(clients);
      expect(keys).toHaveLength(7);
      expect(keys).toContain('basys');
      expect(keys).toContain('eden');
      expect(keys).toContain('das');
      expect(keys).toContain('cft');
      expect(keys).toContain('moratorium');
      expect(keys).toContain('roi');
      expect(keys).toContain('credit');
    });

    it('each client has a healthCheck method', () => {
      const clients = createAllClients({ mode: 'mock', failureRate: 0 });
      expect(typeof clients.basys.healthCheck).toBe('function');
      expect(typeof clients.eden.healthCheck).toBe('function');
      expect(typeof clients.das.healthCheck).toBe('function');
      expect(typeof clients.cft.healthCheck).toBe('function');
      expect(typeof clients.moratorium.healthCheck).toBe('function');
      expect(typeof clients.roi.healthCheck).toBe('function');
      expect(typeof clients.credit.healthCheck).toBe('function');
    });

    it('basys client has lookup method', () => {
      const clients = createAllClients({ mode: 'mock', failureRate: 0 });
      expect(typeof clients.basys.lookup).toBe('function');
    });

    it('eden client has lookup method', () => {
      const clients = createAllClients({ mode: 'mock', failureRate: 0 });
      expect(typeof clients.eden.lookup).toBe('function');
    });

    it('das client has lookup method', () => {
      const clients = createAllClients({ mode: 'mock', failureRate: 0 });
      expect(typeof clients.das.lookup).toBe('function');
    });

    it('cft client has lookup method', () => {
      const clients = createAllClients({ mode: 'mock', failureRate: 0 });
      expect(typeof clients.cft.lookup).toBe('function');
    });

    it('moratorium client has check method', () => {
      const clients = createAllClients({ mode: 'mock', failureRate: 0 });
      expect(typeof clients.moratorium.check).toBe('function');
    });

    it('roi client has search method', () => {
      const clients = createAllClients({ mode: 'mock', failureRate: 0 });
      expect(typeof clients.roi.search).toBe('function');
    });

    it('credit client has runCheck method', () => {
      const clients = createAllClients({ mode: 'mock', failureRate: 0 });
      expect(typeof clients.credit.runCheck).toBe('function');
    });
  });

  describe('BasysMockClient matching logic', () => {
    it('returns found for NI number ending in A', async () => {
      const client = createBasysClient({ mode: 'mock', failureRate: 0 });
      const result = await client.lookup({ niNumber: 'CD654321A', firstName: 'Bob', lastName: 'Jones' });
      expect(result.found).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data!.caseRef).toBeTruthy();
      expect(result.system).toBe('BASYS');
    });

    it('returns found for surname SMITH regardless of NI', async () => {
      const client = createBasysClient({ mode: 'mock', failureRate: 0 });
      const result = await client.lookup({ niNumber: 'ZZ999999B', firstName: 'Jane', lastName: 'Smith' });
      expect(result.found).toBe(true);
      expect(result.data!.debtorName).toContain('Smith');
    });

    it('returns not found for non-matching criteria', async () => {
      const client = createBasysClient({ mode: 'mock', failureRate: 0 });
      const result = await client.lookup({ niNumber: 'AB123456B', firstName: 'Alice', lastName: 'Brown' });
      expect(result.found).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  describe('EdenMockClient matching logic', () => {
    it('returns found for surname starting with M', async () => {
      const client = createEdenClient({ mode: 'mock', failureRate: 0 });
      const result = await client.lookup({ niNumber: 'AB123456C', firstName: 'David', lastName: 'Murray' });
      expect(result.found).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data!.arrangementRef).toBeTruthy();
      expect(result.system).toBe('eDEN');
    });

    it('returns not found for surname not starting with M', async () => {
      const client = createEdenClient({ mode: 'mock', failureRate: 0 });
      const result = await client.lookup({ niNumber: 'AB123456C', firstName: 'David', lastName: 'Anderson' });
      expect(result.found).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  describe('CreditMockClient', () => {
    it('produces deterministic score from NI hash', async () => {
      const client = createCreditClient({ mode: 'mock', failureRate: 0 });
      const result1 = await client.runCheck({ niNumber: 'AB123456C', consentGiven: true });
      const result2 = await client.runCheck({ niNumber: 'AB123456C', consentGiven: true });

      expect(result1.data!.score).toBe(result2.data!.score);
      expect(result1.data!.result).toBe(result2.data!.result);
    });

    it('score is in range 200-799', async () => {
      const client = createCreditClient({ mode: 'mock', failureRate: 0 });
      const result = await client.runCheck({ niNumber: 'ZZ999999D', consentGiven: true });
      expect(result.data!.score).toBeGreaterThanOrEqual(200);
      expect(result.data!.score).toBeLessThan(800);
    });

    it('requires consent — returns error without it', async () => {
      const client = createCreditClient({ mode: 'mock', failureRate: 0 });
      const result = await client.runCheck({ niNumber: 'AB123456C', consentGiven: false });
      expect(result.found).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('consent');
    });
  });

  describe('Latency simulation', () => {
    it('all clients simulate latency (responses take >= 50ms)', async () => {
      const clients = createAllClients({ mode: 'mock', failureRate: 0 });

      const start = Date.now();
      await clients.basys.lookup({ niNumber: 'AB123456C' });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(50);
    });

    it('response includes responseTime metric', async () => {
      const client = createBasysClient({ mode: 'mock', failureRate: 0 });
      const result = await client.lookup({ niNumber: 'AB123456C' });
      expect(result.responseTime).toBeGreaterThanOrEqual(50);
      expect(result.responseTime).toBeLessThan(500);
    });
  });

  describe('Failure rate option', () => {
    it('failureRate 0 never produces errors', async () => {
      const client = createBasysClient({ mode: 'mock', failureRate: 0 });
      const results = await Promise.all(
        Array.from({ length: 10 }, () => client.lookup({ niNumber: 'AB123456A' }))
      );
      expect(results.every(r => !r.error)).toBe(true);
    });
  });

  describe('Live mode throws', () => {
    it('createBasysClient throws for live mode', () => {
      expect(() => createBasysClient({ mode: 'live' })).toThrow('not yet implemented');
    });

    it('createEdenClient throws for live mode', () => {
      expect(() => createEdenClient({ mode: 'live' })).toThrow('not yet implemented');
    });

    it('createDasClient throws for live mode', () => {
      expect(() => createDasClient({ mode: 'live' })).toThrow('not yet implemented');
    });

    it('createCftClient throws for live mode', () => {
      expect(() => createCftClient({ mode: 'live' })).toThrow('not yet implemented');
    });

    it('createMoratoriumClient throws for live mode', () => {
      expect(() => createMoratoriumClient({ mode: 'live' })).toThrow('not yet implemented');
    });

    it('createRoiClient throws for live mode', () => {
      expect(() => createRoiClient({ mode: 'live' })).toThrow('not yet implemented');
    });

    it('createCreditClient throws for live mode', () => {
      expect(() => createCreditClient({ mode: 'live' })).toThrow('not yet implemented');
    });
  });
});
