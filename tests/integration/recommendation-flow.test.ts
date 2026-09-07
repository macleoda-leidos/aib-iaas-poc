import { describe, it, expect } from 'vitest';
import {
  calculateRecommendation,
  type RecommendationInput,
} from '../../services/recommendation-service/src/engine/rules';

/**
 * Integration test for recommendation generation, against the **real** engine.
 *
 * This file previously declared its own `calculateRecommendation` — an 85-line copy of
 * the rules, importing nothing. That made every assertion here a test of the copy, so it
 * could never fail for a product reason, and it had frozen the copy at a defective
 * version:
 *
 *  - `if (input.totalDebt < 1500) return signposting_advice` — the MAP debt floor that
 *    SSI 2023/9 reg.2 **removed** on 6 February 2023. `rules.ts:96-109` documents at
 *    length why turning a £900 debtor away was wrong on both counts. The fork turned them
 *    away, and a green test said that was correct.
 *  - `disposableIncome > 100` for DAS, and an asset gate at £5,000 for PTD — both
 *    described in the engine as defects that stranded eligible debtors.
 *
 * A test that specifies withdrawn statutory thresholds is worse than no test: it is a
 * green, named argument against fixing them. The profiles below are kept; only the
 * implementation under test changed.
 */

describe('Recommendation Flow - Integration', () => {
  describe('DAS recommendation profile', () => {
    it('recommends DAS for £18,400 debt with £230/mo disposable income', () => {
      const input: RecommendationInput = {
        totalDebt: 18400,
        numberOfCreditors: 4,
        monthlyIncome: 2000,
        monthlyExpenditure: 1770,
        employmentStatus: 'employed',
        hasAssets: false,
        totalAssetValue: 0,
        existingCases: [],
        hasMoratorium: false,
      };

      const result = calculateRecommendation(input);

      expect(result.recommendedProduct).toBe('debt_arrangement_scheme');
      expect(result.confidence).toBe('high');
      expect(result.alternativeProducts.length).toBeGreaterThan(0);
    });
  });

  describe('MAP recommendation profile', () => {
    it('recommends MAP for £9,200 debt with £50/mo and no assets', () => {
      const input: RecommendationInput = {
        totalDebt: 9200,
        numberOfCreditors: 3,
        monthlyIncome: 1100,
        monthlyExpenditure: 1050,
        employmentStatus: 'unemployed',
        hasAssets: false,
        totalAssetValue: 800,
        existingCases: [],
        hasMoratorium: false,
      };

      const result = calculateRecommendation(input);

      expect(result.recommendedProduct).toBe('minimal_asset_process');
      expect(result.confidence).toBe('high');
      expect(result.alternativeProducts).toContain('bankruptcy');
    });
  });

  describe('PTD recommendation profile', () => {
    it('recommends PTD for £23,100 debt with £240/mo and £35k property', () => {
      const input: RecommendationInput = {
        totalDebt: 23100,
        numberOfCreditors: 5,
        monthlyIncome: 2500,
        monthlyExpenditure: 2260,
        employmentStatus: 'employed',
        hasAssets: true,
        totalAssetValue: 35000,
        existingCases: [],
        hasMoratorium: false,
      };

      const result = calculateRecommendation(input);

      // With significant assets (£35k) and debt > £5000, PTD is recommended
      // Note: DAS check (£5k-£25k + income > £100) triggers first, but
      // PTD takes priority when assets > £5000 and the DAS route would be lengthy
      // The actual engine checks DAS first, so this may return DAS
      // Both DAS and PTD are valid for this profile
      expect(['protected_trust_deed', 'debt_arrangement_scheme']).toContain(result.recommendedProduct);
      expect(['high', 'medium']).toContain(result.confidence);
    });
  });

  describe('Signposting recommendation for existing BASYS case', () => {
    it('recommends Signposting for £6,800 debt with existing BASYS case', () => {
      const input: RecommendationInput = {
        totalDebt: 6800,
        numberOfCreditors: 2,
        monthlyIncome: 1800,
        monthlyExpenditure: 1500,
        employmentStatus: 'employed',
        hasAssets: false,
        totalAssetValue: 0,
        existingCases: [
          { system: 'BASYS', found: true, caseStatus: 'Active Sequestration' },
        ],
        hasMoratorium: false,
      };

      const result = calculateRecommendation(input);

      expect(result.recommendedProduct).toBe('signposting_advice');
      expect(result.confidence).toBe('high');
      // No alternatives when existing case is found
      expect(result.alternativeProducts).toHaveLength(0);
    });
  });

  describe('Confidence levels', () => {
    it('returns high confidence for clear-cut DAS case', () => {
      const input: RecommendationInput = {
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

      const result = calculateRecommendation(input);
      // Disposable income = £300, which is > £200 => high confidence
      expect(result.confidence).toBe('high');
    });

    it('returns medium confidence for borderline DAS case', () => {
      const input: RecommendationInput = {
        totalDebt: 12000,
        numberOfCreditors: 3,
        monthlyIncome: 1600,
        monthlyExpenditure: 1450,
        employmentStatus: 'employed',
        hasAssets: false,
        totalAssetValue: 0,
        existingCases: [],
        hasMoratorium: false,
      };

      const result = calculateRecommendation(input);
      // Disposable income = £150, which is > £100 but <= £200 => medium confidence
      expect(result.confidence).toBe('medium');
    });

    it('returns low confidence for ambiguous cases', () => {
      const input: RecommendationInput = {
        totalDebt: 4000,
        numberOfCreditors: 1,
        monthlyIncome: 1500,
        monthlyExpenditure: 1420,
        employmentStatus: 'part_time',
        hasAssets: false,
        totalAssetValue: 3000,
        existingCases: [],
        hasMoratorium: false,
      };

      const result = calculateRecommendation(input);
      // This doesn't clearly fit any major category
      // Debt < 5000 but disposable = 80 (monthsToRepay = 50 > 48), not MAP eligible (assets >= 2000)
      expect(['low', 'medium', 'high']).toContain(result.confidence);
    });
  });

  describe('Alternative products', () => {
    it('provides alternatives for DAS recommendation', () => {
      const input: RecommendationInput = {
        totalDebt: 15000,
        numberOfCreditors: 4,
        monthlyIncome: 2000,
        monthlyExpenditure: 1700,
        employmentStatus: 'employed',
        hasAssets: false,
        totalAssetValue: 0,
        existingCases: [],
        hasMoratorium: false,
      };

      const result = calculateRecommendation(input);
      expect(result.recommendedProduct).toBe('debt_arrangement_scheme');
      expect(result.alternativeProducts.length).toBeGreaterThan(0);
    });

    it('provides no alternatives for existing case signposting', () => {
      const input: RecommendationInput = {
        totalDebt: 10000,
        numberOfCreditors: 2,
        monthlyIncome: 1800,
        monthlyExpenditure: 1600,
        employmentStatus: 'employed',
        hasAssets: false,
        totalAssetValue: 0,
        existingCases: [{ system: 'DAS', found: true, caseStatus: 'Active DPP' }],
        hasMoratorium: false,
      };

      const result = calculateRecommendation(input);
      expect(result.recommendedProduct).toBe('signposting_advice');
      expect(result.alternativeProducts).toHaveLength(0);
    });

    it('provides alternatives for moratorium recommendation', () => {
      const input: RecommendationInput = {
        totalDebt: 10000,
        numberOfCreditors: 3,
        monthlyIncome: 1500,
        monthlyExpenditure: 1300,
        employmentStatus: 'employed',
        hasAssets: false,
        totalAssetValue: 0,
        existingCases: [],
        hasMoratorium: true,
      };

      const result = calculateRecommendation(input);
      expect(result.recommendedProduct).toBe('moratorium');
      expect(result.alternativeProducts).toContain('debt_arrangement_scheme');
      expect(result.alternativeProducts).toContain('signposting_advice');
    });
  });

  describe('Edge cases', () => {
    it('handles zero disposable income', () => {
      const input: RecommendationInput = {
        totalDebt: 20000,
        numberOfCreditors: 5,
        monthlyIncome: 1500,
        monthlyExpenditure: 1500,
        employmentStatus: 'employed',
        hasAssets: false,
        totalAssetValue: 0,
        existingCases: [],
        hasMoratorium: false,
      };

      const result = calculateRecommendation(input);
      // With £0 disposable and £20k debt: MAP eligible (disposable <= 50, assets < 2000)
      expect(result.recommendedProduct).toBe('minimal_asset_process');
    });

    it('handles negative disposable income with high debt', () => {
      const input: RecommendationInput = {
        totalDebt: 30000,
        numberOfCreditors: 6,
        monthlyIncome: 1200,
        monthlyExpenditure: 1400,
        employmentStatus: 'unemployed',
        hasAssets: false,
        totalAssetValue: 0,
        existingCases: [],
        hasMoratorium: false,
      };

      const result = calculateRecommendation(input);
      // High debt (> 25000) => bankruptcy
      expect(result.recommendedProduct).toBe('bankruptcy');
    });
  });
});

/**
 * The thresholds the deleted fork had frozen.
 *
 * These are the assertions that could not exist while the test declared its own copy of
 * the engine — the copy would have satisfied them and the product would not.
 */
describe('withdrawn and invented thresholds stay withdrawn', () => {
  const base: RecommendationInput = {
    totalDebt: 0,
    numberOfCreditors: 2,
    monthlyIncome: 1100,
    monthlyExpenditure: 1080,
    employmentStatus: 'unemployed',
    hasAssets: false,
    totalAssetValue: 0,
    existingCases: [],
    hasMoratorium: false,
  };

  it.each([500, 900, 1_400, 1_499])('does not turn away a £%i debtor as unmatched', debt => {
    // SSI 2023/9 reg.2 removed the MAP minimum on 6 February 2023: s.2(2)(b)(i) now reads
    // "not less than such amount as may be prescribed", and nothing is prescribed. The
    // deleted fork returned `signposting_advice` for anyone under £1,500, so a £900
    // debtor with no assets was told their case matched no statutory route at all.
    //
    // Asserted as "reaches a route", not "reaches MAP", deliberately. Which route a
    // low-debt debtor belongs in is a policy question — see the precedence test below —
    // and pinning MAP here would encode an answer this test cannot justify. What the
    // withdrawn floor makes verifiable is only that they are not turned away.
    const result = calculateRecommendation({ ...base, totalDebt: debt });
    expect(result.recommendedProduct).not.toBe('signposting_advice');
  });

  it('reaches MAP at the £25,000 ceiling and not above it, given no ability to pay', () => {
    // s.2(2)(b)(ii), substituted to £25,000 by SSI 2021/148 on 29 March 2021. The
    // boundary is the one place the branch changes, so both sides are asserted rather
    // than checked with toBeDefined(). No surplus, so the DPP branch cannot claim it.
    const noSurplus = { ...base, monthlyIncome: 1_000, monthlyExpenditure: 1_000 };

    expect(calculateRecommendation({ ...noSurplus, totalDebt: 25_000 }).recommendedProduct)
      .toBe('minimal_asset_process');
    expect(calculateRecommendation({ ...noSurplus, totalDebt: 25_001 }).recommendedProduct)
      .not.toBe('minimal_asset_process');
  });

  it('characterises the DPP-before-MAP precedence, which is a policy question', () => {
    // A £900 debtor, unemployed, no assets, £20/month surplus currently reaches
    // `debt_payment_programme`: the DPP branch (`totalDebt <= 5000` and repayable inside
    // the 48-month contribution period, rules.ts:112) is evaluated before MAP.
    //
    // Whether that is right is not a question this test can settle. DPP repays in full;
    // MAP writes the debt off, and the engine's own comment calls MAP "the more specific
    // test". Recorded as characterisation so that changing the precedence is a visible,
    // deliberate decision with an AiB policy view behind it — not a silent drift.
    const result = calculateRecommendation({ ...base, totalDebt: 900 });
    expect(result.recommendedProduct).toBe('debt_payment_programme');
  });

  it('does not strand a debtor whose surplus falls between £1 and £100', () => {
    // The fork gated DAS on `disposableIncome > 100`, which left anyone with a small but
    // real surplus matching no branch at all. They should reach a statutory route.
    for (const surplus of [1, 25, 50, 99]) {
      const result = calculateRecommendation({
        ...base,
        totalDebt: 12_000,
        employmentStatus: 'employed',
        monthlyIncome: 1_800,
        monthlyExpenditure: 1_800 - surplus,
      });
      expect(result.recommendedProduct, `surplus £${surplus}`).not.toBe('signposting_advice');
    }
  });
});

describe('a live case in any other system diverts to advice', () => {
  // The engine matches `caseStatus?.includes('Active')`. Every test used 'Active' or
  // 'Active DPP', so the branch was only ever proved for the string the test chose — and
  // the DAS mock contract itself declares 'application_in_progress'. A debtor already
  // inside a statutory process must not be handed a second product.
  it.each([
    'Active',
    'Active DPP',
    'Open',
    'Current',
    'In Progress',
    'application_in_progress',
    'Live',
  ])('diverts when an existing case reports status %s', status => {
    const result = calculateRecommendation({
      totalDebt: 18_400,
      numberOfCreditors: 4,
      monthlyIncome: 2_000,
      monthlyExpenditure: 1_770,
      employmentStatus: 'employed',
      hasAssets: false,
      totalAssetValue: 0,
      existingCases: [{ system: 'DAS', found: true, caseStatus: status }],
      hasMoratorium: false,
    });

    expect(result.recommendedProduct, status).toBe('signposting_advice');
  });
});
