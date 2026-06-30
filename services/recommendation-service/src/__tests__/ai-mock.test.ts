import { describe, it, expect } from 'vitest';
import { getAiExplanation } from '../engine/ai-mock';

describe('AI Mock Explanation Generator', () => {
  it('returns explanation for bankruptcy', () => {
    const result = getAiExplanation('bankruptcy');
    expect(result).toContain('sequestration');
    expect(result).toContain('legal process');
  });

  it('returns explanation for DAS', () => {
    const result = getAiExplanation('debt_arrangement_scheme');
    expect(result).toContain('DAS');
    expect(result).toContain('repay');
  });

  it('returns explanation for MAP', () => {
    const result = getAiExplanation('minimal_asset_process');
    expect(result).toContain('MAP');
    expect(result).toContain('simplified');
  });

  it('returns explanation for PTD', () => {
    const result = getAiExplanation('protected_trust_deed');
    expect(result).toContain('Trust Deed');
    expect(result).toContain('creditors');
  });

  it('returns explanation for DPP', () => {
    const result = getAiExplanation('debt_payment_programme');
    expect(result).toContain('DPP');
    expect(result).toContain('repay');
  });

  it('returns explanation for moratorium', () => {
    const result = getAiExplanation('moratorium');
    expect(result).toContain('moratorium');
    expect(result).toContain('breathing space');
  });

  it('returns signposting for unknown product', () => {
    const result = getAiExplanation('unknown_product');
    expect(result).toContain('advice');
  });

  it('all explanations contain disclaimer', () => {
    const products = ['bankruptcy', 'debt_arrangement_scheme', 'minimal_asset_process', 'protected_trust_deed', 'moratorium', 'signposting_advice'];
    products.forEach(p => {
      const result = getAiExplanation(p);
      expect(result).toContain('not constitute');
    });
  });
});
