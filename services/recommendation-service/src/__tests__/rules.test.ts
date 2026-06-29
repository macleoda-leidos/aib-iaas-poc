import { describe, it, expect } from 'vitest';
import { calculateRecommendation } from '../engine/rules';

describe('Recommendation Rules Engine', () => {
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

  it('should recommend signposting for very low debt', () => {
    const result = calculateRecommendation({ ...baseInput, totalDebt: 800 });
    expect(result.recommendedProduct).toBe('signposting_advice');
    expect(result.confidence).toBe('high');
  });

  it('should recommend DPP for low debt with ability to pay', () => {
    const result = calculateRecommendation({
      ...baseInput,
      totalDebt: 3000,
      monthlyIncome: 2000,
      monthlyExpenditure: 1700,
    });
    expect(result.recommendedProduct).toBe('debt_payment_programme');
  });

  it('should recommend DAS for medium debt with disposable income', () => {
    const result = calculateRecommendation({
      ...baseInput,
      totalDebt: 15000,
      monthlyIncome: 2000,
      monthlyExpenditure: 1700,
    });
    expect(result.recommendedProduct).toBe('debt_arrangement_scheme');
  });

  it('should recommend MAP for minimal assets and low income', () => {
    const result = calculateRecommendation({
      ...baseInput,
      totalDebt: 8000,
      monthlyIncome: 900,
      monthlyExpenditure: 880,
      employmentStatus: 'unemployed',
      totalAssetValue: 500,
    });
    expect(result.recommendedProduct).toBe('minimal_asset_process');
  });

  it('should recommend PTD for debt with significant assets', () => {
    const result = calculateRecommendation({
      ...baseInput,
      totalDebt: 30000,
      hasAssets: true,
      totalAssetValue: 15000,
    });
    expect(result.recommendedProduct).toBe('protected_trust_deed');
  });

  it('should recommend bankruptcy for very high debt', () => {
    const result = calculateRecommendation({
      ...baseInput,
      totalDebt: 50000,
      monthlyIncome: 1500,
      monthlyExpenditure: 1600,
    });
    expect(result.recommendedProduct).toBe('bankruptcy');
  });

  it('should recommend signposting when existing active case found', () => {
    const result = calculateRecommendation({
      ...baseInput,
      existingCases: [{ system: 'DAS', found: true, caseStatus: 'Active DPP' }],
    });
    expect(result.recommendedProduct).toBe('signposting_advice');
  });

  it('should recommend moratorium when moratorium is active', () => {
    const result = calculateRecommendation({
      ...baseInput,
      hasMoratorium: true,
    });
    expect(result.recommendedProduct).toBe('moratorium');
  });

  it('should always return factors array', () => {
    const result = calculateRecommendation(baseInput);
    expect(result.factors).toBeDefined();
    expect(result.factors.length).toBeGreaterThan(0);
  });

  it('should always return reasoning array', () => {
    const result = calculateRecommendation(baseInput);
    expect(result.reasoning).toBeDefined();
    expect(result.reasoning.length).toBeGreaterThan(0);
  });
});
