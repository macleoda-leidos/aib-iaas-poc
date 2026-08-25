import { describe, it, expect } from 'vitest';

import { calculateRecommendation } from '../engine/rules';

describe('Recommendation Engine — Full Coverage', () => {
  // No statutory minimum debt exists for MAP (SSI 2023/9 reg.2) or DAS
  // (reg.21(1)), so a small debt with a surplus gets a programme, not a brush-off.
  it('recommends a repayment programme for a small debt with surplus income', () => {
    const result = calculateRecommendation({
      totalDebt: 1200, numberOfCreditors: 1, monthlyIncome: 2000,
      monthlyExpenditure: 1800, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    expect(result.recommendedProduct).toBe('debt_payment_programme');
  });

  it('recommends DPP for debt £1,500-£5,000 with repayment capacity', () => {
    const result = calculateRecommendation({
      totalDebt: 3000, numberOfCreditors: 2, monthlyIncome: 2500,
      monthlyExpenditure: 2300, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    expect(result.recommendedProduct).toBe('debt_payment_programme');
  });

  it('recommends DAS for debt £5,000-£25,000 with disposable > £100', () => {
    const result = calculateRecommendation({
      totalDebt: 18000, numberOfCreditors: 4, monthlyIncome: 2600,
      monthlyExpenditure: 2370, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    expect(result.recommendedProduct).toBe('debt_arrangement_scheme');
    expect(result.confidence).toBe('high');
  });

  it('recommends PTD when significant assets present', () => {
    const result = calculateRecommendation({
      totalDebt: 30000, numberOfCreditors: 3, monthlyIncome: 2600,
      monthlyExpenditure: 2360, employmentStatus: 'self_employed',
      hasAssets: true, totalAssetValue: 35000, existingCases: [], hasMoratorium: false
    });
    expect(result.recommendedProduct).toBe('protected_trust_deed');
  });

  it('recommends MAP for low income, low assets, debt in range', () => {
    const result = calculateRecommendation({
      totalDebt: 9200, numberOfCreditors: 4, monthlyIncome: 1100,
      monthlyExpenditure: 1060, employmentStatus: 'unemployed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    expect(result.recommendedProduct).toBe('minimal_asset_process');
  });

  it('recommends bankruptcy for very high debt', () => {
    const result = calculateRecommendation({
      totalDebt: 45000, numberOfCreditors: 8, monthlyIncome: 1500,
      monthlyExpenditure: 1500, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    expect(result.recommendedProduct).toBe('bankruptcy');
  });

  it('recommends signposting when existing active case found', () => {
    const result = calculateRecommendation({
      totalDebt: 18000, numberOfCreditors: 4, monthlyIncome: 2600,
      monthlyExpenditure: 2370, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0,
      existingCases: [{ system: 'BASYS', found: true, caseStatus: 'Active' }],
      hasMoratorium: false
    });
    expect(result.recommendedProduct).toBe('signposting_advice');
  });

  it('recommends moratorium when active', () => {
    const result = calculateRecommendation({
      totalDebt: 18000, numberOfCreditors: 4, monthlyIncome: 2600,
      monthlyExpenditure: 2370, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: true
    });
    expect(result.recommendedProduct).toBe('moratorium');
  });

  it('returns reasoning array', () => {
    const result = calculateRecommendation({
      totalDebt: 18000, numberOfCreditors: 4, monthlyIncome: 2600,
      monthlyExpenditure: 2370, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    expect(result.reasoning).toBeDefined();
    expect(result.reasoning.length).toBeGreaterThan(0);
  });

  it('returns factors array', () => {
    const result = calculateRecommendation({
      totalDebt: 18000, numberOfCreditors: 4, monthlyIncome: 2600,
      monthlyExpenditure: 2370, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    expect(result.factors).toBeDefined();
    expect(result.factors.length).toBeGreaterThan(0);
  });

  it('returns alternative products', () => {
    const result = calculateRecommendation({
      totalDebt: 18000, numberOfCreditors: 4, monthlyIncome: 2600,
      monthlyExpenditure: 2370, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    expect(result.alternativeProducts).toBeDefined();
    expect(result.alternativeProducts.length).toBeGreaterThan(0);
  });

  it('handles zero income gracefully', () => {
    const result = calculateRecommendation({
      totalDebt: 10000, numberOfCreditors: 3, monthlyIncome: 0,
      monthlyExpenditure: 0, employmentStatus: 'unemployed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    expect(result.recommendedProduct).toBeDefined();
  });

  it('handles negative disposable income', () => {
    const result = calculateRecommendation({
      totalDebt: 15000, numberOfCreditors: 5, monthlyIncome: 1000,
      monthlyExpenditure: 1200, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    expect(result.recommendedProduct).toBeDefined();
  });

  it('confidence is high, medium, or low', () => {
    const result = calculateRecommendation({
      totalDebt: 18000, numberOfCreditors: 4, monthlyIncome: 2600,
      monthlyExpenditure: 2370, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    expect(['high', 'medium', 'low']).toContain(result.confidence);
  });

  it('DAS confidence is high when clearly eligible', () => {
    const result = calculateRecommendation({
      totalDebt: 15000, numberOfCreditors: 3, monthlyIncome: 3000,
      monthlyExpenditure: 2500, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    expect(result.confidence).toBe('high');
  });

  it('PTD confidence is medium for borderline cases', () => {
    const result = calculateRecommendation({
      totalDebt: 8000, numberOfCreditors: 2, monthlyIncome: 2200,
      monthlyExpenditure: 2000, employmentStatus: 'self_employed',
      hasAssets: true, totalAssetValue: 6000, existingCases: [], hasMoratorium: false
    });
    expect(result.confidence).toBe('medium');
  });

  it('factors include debt level assessment', () => {
    const result = calculateRecommendation({
      totalDebt: 18000, numberOfCreditors: 4, monthlyIncome: 2600,
      monthlyExpenditure: 2370, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    const debtFactor = result.factors.find(f => f.factor.toLowerCase().includes('debt'));
    expect(debtFactor).toBeDefined();
  });

  it('factors include disposable income', () => {
    const result = calculateRecommendation({
      totalDebt: 18000, numberOfCreditors: 4, monthlyIncome: 2600,
      monthlyExpenditure: 2370, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    const incomeFactor = result.factors.find(f => f.factor.toLowerCase().includes('income') || f.factor.toLowerCase().includes('disposable'));
    expect(incomeFactor).toBeDefined();
  });

  it('boundary: debt exactly £1,500 goes to DPP not signposting', () => {
    const result = calculateRecommendation({
      totalDebt: 1500, numberOfCreditors: 1, monthlyIncome: 2000,
      monthlyExpenditure: 1900, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    expect(result.recommendedProduct).not.toBe('signposting_advice');
  });

  it('boundary: debt exactly £25,000', () => {
    const result = calculateRecommendation({
      totalDebt: 25000, numberOfCreditors: 6, monthlyIncome: 2800,
      monthlyExpenditure: 2600, employmentStatus: 'employed',
      hasAssets: false, totalAssetValue: 0, existingCases: [], hasMoratorium: false
    });
    expect(result.recommendedProduct).toBeDefined();
  });
});
