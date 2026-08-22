import { describe, it, expect } from 'vitest';
import { createAllClients } from '../index';

describe('Integration Mock Clients', () => {
  // Use zero failure rate so tests are deterministic
  const clients = createAllClients({ failureRate: 0 });

  it('basys client returns IntegrationResult', async () => {
    const result = await clients.basys.lookup({
      niNumber: 'AB123456A',
      firstName: 'John',
      lastName: 'Smith',
    });

    expect(result).toBeDefined();
    expect(result.system).toBe('BASYS');
    expect(result.responseTime).toBeGreaterThanOrEqual(0);
    expect(typeof result.found).toBe('boolean');
    // NI ending in 'A' or surname SMITH should be found
    expect(result.found).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.data!.caseRef).toBeTruthy();
    expect(result.data!.type).toBeTruthy();
  });

  it('eden client returns IntegrationResult', async () => {
    const result = await clients.eden.lookup({
      niNumber: 'CD987654B',
      firstName: 'Alice',
      lastName: 'Brown',
    });

    expect(result).toBeDefined();
    expect(result.system).toBe('eDEN');
    expect(result.responseTime).toBeGreaterThanOrEqual(0);
    expect(typeof result.found).toBe('boolean');
    // data is null if not found, or an object if found
    if (result.found) {
      expect(result.data).not.toBeNull();
    } else {
      expect(result.data).toBeNull();
    }
  });

  it('credit client returns deterministic score', async () => {
    const niNumber = 'AB123456C';

    const result1 = await clients.credit.runCheck({
      niNumber,
      consentGiven: true,
    });

    const result2 = await clients.credit.runCheck({
      niNumber,
      consentGiven: true,
    });

    expect(result1).toBeDefined();
    expect(result1.system).toBe('CreditCheck');
    expect(result1.found).toBe(true);
    expect(result1.data).not.toBeNull();
    expect(result1.data!.score).toBeGreaterThanOrEqual(200);
    expect(result1.data!.score).toBeLessThan(800);
    expect(['PASS', 'FAIL']).toContain(result1.data!.result);
    expect(result1.data!.provider).toContain('SyntheticCredit');

    // Same NI number should produce the same score (deterministic)
    expect(result1.data!.score).toBe(result2.data!.score);
    expect(result1.data!.result).toBe(result2.data!.result);
  });

  it('credit client requires consent', async () => {
    const result = await clients.credit.runCheck({
      niNumber: 'AB123456C',
      consentGiven: false,
    });

    expect(result.found).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error).toContain('consent');
  });

  it('all clients have healthCheck method', async () => {
    const basysHealth = await clients.basys.healthCheck();
    const edenHealth = await clients.eden.healthCheck();
    const dasHealth = await clients.das.healthCheck();
    const cftHealth = await clients.cft.healthCheck();
    const moratoriumHealth = await clients.moratorium.healthCheck();
    const roiHealth = await clients.roi.healthCheck();
    const creditHealth = await clients.credit.healthCheck();

    expect(basysHealth).toBe(true);
    expect(edenHealth).toBe(true);
    expect(dasHealth).toBe(true);
    expect(cftHealth).toBe(true);
    expect(moratoriumHealth).toBe(true);
    expect(roiHealth).toBe(true);
    expect(creditHealth).toBe(true);
  });

  it('factory creates all 7 clients', () => {
    const allClients = createAllClients();

    expect(allClients).toBeDefined();
    expect(Object.keys(allClients)).toHaveLength(7);
    expect(allClients.basys).toBeDefined();
    expect(allClients.eden).toBeDefined();
    expect(allClients.das).toBeDefined();
    expect(allClients.cft).toBeDefined();
    expect(allClients.moratorium).toBeDefined();
    expect(allClients.roi).toBeDefined();
    expect(allClients.credit).toBeDefined();
  });

  it('basys client returns not found for non-matching NI', async () => {
    const result = await clients.basys.lookup({
      niNumber: 'ZZ999999B', // Does not end in 'A'
      firstName: 'Nobody',
      lastName: 'Johnson', // Not SMITH
    });

    expect(result.found).toBe(false);
    expect(result.data).toBeNull();
    expect(result.system).toBe('BASYS');
  });
});
