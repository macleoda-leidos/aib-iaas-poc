import { describe, it, expect } from 'vitest';
import { SyntheticCreditProvider } from '../providers/synthetic';

describe('Synthetic Credit Provider', () => {
  const provider = new SyntheticCreditProvider();
  const baseInput = { firstName: 'John', lastName: 'Testerton', dateOfBirth: '1985-03-15', currentAddress: { line1: '1 Test St', postcode: 'EH1 1AA', city: 'Edinburgh' } };

  it('returns deterministic score for same input', async () => {
    const r1 = await provider.runCheck(baseInput);
    const r2 = await provider.runCheck(baseInput);
    expect(r1.creditScore).toBe(r2.creditScore);
  });

  it('score is within valid range 200-950', async () => {
    const result = await provider.runCheck(baseInput);
    expect(result.creditScore).toBeGreaterThanOrEqual(200);
    expect(result.creditScore).toBeLessThanOrEqual(950);
  });

  it('returns correct score band', async () => {
    const result = await provider.runCheck(baseInput);
    expect(['excellent', 'good', 'fair', 'poor', 'very_poor']).toContain(result.scoreBand);
  });

  it('sets bankruptcyFlag for NI ending in B', async () => {
    const result = await provider.runCheck({ ...baseInput, nationalInsuranceNumber: 'AB123456B' });
    expect(result.bankruptcyFlag).toBe(true);
  });

  it('does not set bankruptcyFlag for NI ending in C', async () => {
    const result = await provider.runCheck({ ...baseInput, nationalInsuranceNumber: 'AB123456C' });
    expect(result.bankruptcyFlag).toBe(false);
  });

  it('returns account summaries', async () => {
    const result = await provider.runCheck(baseInput);
    expect(result.accountSummary.length).toBeGreaterThan(0);
    expect(result.accountSummary[0]).toHaveProperty('type');
    expect(result.accountSummary[0]).toHaveProperty('balance');
  });

  it('returns address links including current address', async () => {
    const result = await provider.runCheck(baseInput);
    expect(result.addressLinks.length).toBeGreaterThan(0);
    expect(result.addressLinks[0].postcode).toBe('EH1 1AA');
  });

  it('different people get different scores', async () => {
    const r1 = await provider.runCheck(baseInput);
    const r2 = await provider.runCheck({ ...baseInput, lastName: 'DifferentPerson' });
    // Very unlikely to be the same (not impossible, but statistically negligible)
    expect(r1.creditScore).not.toBe(r2.creditScore);
  });
});
