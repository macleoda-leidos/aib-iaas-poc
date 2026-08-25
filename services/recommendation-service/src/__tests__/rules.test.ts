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

  it('offers a repayment programme even for a very small debt', () => {
    // Was asserted as signposting on a £1,500 floor that no longer exists: SSI
    // 2023/9 reg.2 removed the MAP minimum in Feb 2023 and DAS never had one
    // (reg.21(1) — "one or more debts"). A debtor with £800 and £300 spare can
    // clear it in three months, so a programme is the correct advice.
    const result = calculateRecommendation({ ...baseInput, totalDebt: 800 });
    expect(result.recommendedProduct).toBe('debt_payment_programme');
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

  // The engine previously had gaps between its branches where an eligible debtor
  // matched nothing and fell through to the "does not clearly match standard
  // product criteria" default. These cases pin the boundaries shut.
  describe('eligibility gaps', () => {
    it('recommends DAS for debt in range with only a small surplus', () => {
      // Formerly fell through: too much surplus for MAP (caps at 50), not enough
      // for DAS (required over 100).
      const result = calculateRecommendation({
        ...baseInput,
        totalDebt: 20000,
        monthlyIncome: 1560,
        monthlyExpenditure: 1500,
      });
      expect(result.recommendedProduct).toBe('debt_arrangement_scheme');
      expect(result.confidence).toBe('low');
    });

    it('recommends DAS when assets sit between the MAP and PTD thresholds', () => {
      // Assets of £3,000 are above MAP's £2,000 ceiling but below PTD's £5,000
      // floor, so neither asset-based branch applies.
      const result = calculateRecommendation({
        ...baseInput,
        totalDebt: 15000,
        monthlyIncome: 1530,
        monthlyExpenditure: 1500,
        hasAssets: true,
        totalAssetValue: 3000,
      });
      expect(result.recommendedProduct).toBe('debt_arrangement_scheme');
    });

    it('recommends PTD on declared asset value even when hasAssets is unset', () => {
      // hasAssets is self-declared and independent of the value; requiring both
      // meant £50,000 of assets could be ignored entirely.
      const result = calculateRecommendation({
        ...baseInput,
        totalDebt: 30000,
        hasAssets: false,
        totalAssetValue: 50000,
      });
      expect(result.recommendedProduct).toBe('protected_trust_deed');
    });

    it('recommends sequestration with no surplus above the statutory minimum', () => {
      // £5,000 debt, no surplus, assets too high for MAP. Sequestration's
      // no-surplus arm formerly started at £10,000, stranding this debtor.
      const result = calculateRecommendation({
        ...baseInput,
        totalDebt: 5000,
        monthlyIncome: 1500,
        monthlyExpenditure: 1500,
        hasAssets: true,
        totalAssetValue: 4000,
      });
      expect(result.recommendedProduct).toBe('bankruptcy');
    });

    it('never falls through to the low-confidence default in the statutory debt range', () => {
      // Sweep rather than sample: any low-confidence signposting result is by
      // definition the "no branch matched" default.
      //
      // Bounded at £5,000 deliberately. Below that a fallthrough can be the
      // correct answer rather than a defect: £1,500-£3,000 sits under the
      // statutory minimum for a debtor application (s.2(8), Bankruptcy
      // (Scotland) Act 2016), and a debtor holding assets above MAP's £2,000
      // ceiling with debt too low for a trust deed may genuinely be best served
      // by advice on realising an asset. Asserting a product there would invent
      // a route the legislation does not provide.
      const unmatched: string[] = [];

      for (let debt = 5000; debt <= 30000; debt += 500) {
        for (let disposable = 0; disposable <= 300; disposable += 25) {
          for (const assets of [0, 1500, 3000, 6000, 20000]) {
            const result = calculateRecommendation({
              ...baseInput,
              totalDebt: debt,
              monthlyIncome: 1500 + disposable,
              monthlyExpenditure: 1500,
              hasAssets: assets > 0,
              totalAssetValue: assets,
            });

            if (result.recommendedProduct === 'signposting_advice' && result.confidence === 'low') {
              unmatched.push(`debt=${debt} disposable=${disposable} assets=${assets}`);
            }
          }
        }
      }

      expect(unmatched).toEqual([]);
    });
  });
});
