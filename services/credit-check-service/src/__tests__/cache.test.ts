// Use in-memory DB for isolated cache testing
process.env.CREDIT_CHECK_DB_PATH = ':memory:';

import { describe, it, expect, beforeAll } from 'vitest';
import { initCreditCheckDb, getCachedResult, cacheResult, clearExpiredCache } from '../providers/cache';

describe('Credit Check Cache', () => {
  beforeAll(() => {
    initCreditCheckDb();
  });

  it('returns null for non-existent cache key', () => {
    const result = getCachedResult('nonexistent-key');
    expect(result).toBeNull();
  });

  it('stores and retrieves a cached result', () => {
    const testData = { creditScore: 750, status: 'clear' };
    cacheResult('test-key-1', testData, 24);

    const retrieved = getCachedResult('test-key-1');
    expect(retrieved).toEqual(testData);
  });

  it('cacheResult accepts custom TTL without error', () => {
    // Verify various TTL values are accepted
    expect(() => cacheResult('ttl-test-1', { score: 100 }, 1)).not.toThrow();
    expect(() => cacheResult('ttl-test-48', { score: 200 }, 48)).not.toThrow();
    expect(() => cacheResult('ttl-test-default', { score: 300 })).not.toThrow();

    // All should be retrievable since they haven't expired
    expect(getCachedResult('ttl-test-1')).toEqual({ score: 100 });
    expect(getCachedResult('ttl-test-48')).toEqual({ score: 200 });
    expect(getCachedResult('ttl-test-default')).toEqual({ score: 300 });
  });

  it('overwrites existing cache entry with same key', () => {
    cacheResult('overwrite-key', { score: 100 }, 24);
    cacheResult('overwrite-key', { score: 200 }, 24);

    const result = getCachedResult('overwrite-key');
    expect(result).toEqual({ score: 200 });
  });

  it('clearExpiredCache removes old entries without error', () => {
    cacheResult('will-expire', { data: 'old' }, 0);
    // Should not throw
    expect(() => clearExpiredCache()).not.toThrow();
  });

  it('clearExpiredCache does not remove valid entries', () => {
    cacheResult('still-valid', { data: 'fresh' }, 24);
    clearExpiredCache();

    const result = getCachedResult('still-valid');
    expect(result).toEqual({ data: 'fresh' });
  });

  it('handles complex nested objects', () => {
    const complex = {
      creditScore: 650,
      accountSummary: [
        { type: 'credit_card', balance: 3000, provider: 'Test Bank' },
        { type: 'loan', balance: 10000, provider: 'Loans Ltd' },
      ],
      riskIndicators: [{ category: 'payment_history', severity: 'medium' }],
    };
    cacheResult('complex-key', complex, 24);

    const retrieved = getCachedResult('complex-key');
    expect(retrieved).toEqual(complex);
    expect(retrieved.accountSummary).toHaveLength(2);
  });
});
