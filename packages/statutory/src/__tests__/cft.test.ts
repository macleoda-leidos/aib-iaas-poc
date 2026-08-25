import { describe, it, expect } from 'vitest';
import { assessContribution, INDICATIVE_TRIGGER_FIGURES, type CftInput } from '../cft';
import { MAP, DAS, SEQUESTRATION_MIN_DEBT, creditorClaimsApply, PTD_OBJECTION } from '../thresholds';

/**
 * Declared expenditure equals the trigger total exactly (£1,910), so declared and
 * trigger paths give the same answer and each test below isolates the one factor
 * it is about. An earlier fixture left childcare at £0 against a £250 trigger,
 * which silently made every case a trigger-total case.
 */
const baseInput: CftInput = {
  income: { wages: 2250, benefits: 0, pension: 0, other: 0 },
  expenditure: {
    rent: 700,
    councilTax: 140,
    utilities: 180,
    food: 300,
    transport: 160,
    insurance: 60,
    childcare: 250,
    other: 120,
  },
  triggerFigures: INDICATIVE_TRIGGER_FIGURES,
};

describe('Common Financial Tool assessment', () => {
  it('computes contribution as income less allowed expenditure', () => {
    const result = assessContribution(baseInput);
    expect(result.totalIncome).toBe(2250);
    expect(result.declaredExpenditure).toBe(1910);
    expect(result.contribution).toBe(340);
  });

  it('never returns a negative contribution', () => {
    // A deficit means the debtor can pay nothing, not that they owe a negative
    // amount — and a negative would corrupt any downstream total.
    const result = assessContribution({
      ...baseInput,
      income: { wages: 800, benefits: 0, pension: 0, other: 0 },
    });
    expect(result.contribution).toBe(0);
  });

  it('allows the trigger total when declared expenditure falls below it', () => {
    // reg.15 assesses against the GREATER of declared and trigger figures, so a
    // frugal debtor is not assessed as able to contribute the difference.
    const frugal = assessContribution({
      ...baseInput,
      expenditure: { ...baseInput.expenditure, food: 100, transport: 40 },
    });
    expect(frugal.declaredExpenditure).toBe(1590);
    expect(frugal.allowedExpenditure).toBe(1910); // full trigger total, not the lower declared figure
    expect(frugal.contribution).toBe(340);
  });

  it('records a per-category excess above its trigger figure', () => {
    const result = assessContribution({
      ...baseInput,
      expenditure: { ...baseInput.expenditure, rent: 900 },
    });
    expect(result.triggerExcesses).toHaveLength(1);
    expect(result.triggerExcesses[0]).toMatchObject({
      category: 'rent',
      declared: 900,
      trigger: 700,
      excess: 200,
    });
  });

  it('reports excesses per category rather than netting them off', () => {
    // A debtor under on food and over on transport still owes reg.17 evidence for
    // transport. Netting would hide what the duty attaches to.
    const result = assessContribution({
      ...baseInput,
      expenditure: { ...baseInput.expenditure, food: 100, transport: 400 },
    });
    const categories = result.triggerExcesses.map(e => e.category);
    expect(categories).toEqual(['transport']);
  });

  it('requires reg.17 evidence only when a trigger is exceeded', () => {
    expect(assessContribution(baseInput).evidenceRequired).toBe(false);
    expect(
      assessContribution({
        ...baseInput,
        expenditure: { ...baseInput.expenditure, rent: 900 },
      }).evidenceRequired
    ).toBe(true);
  });

  it('cites reg.17 when evidence is required', () => {
    const result = assessContribution({
      ...baseInput,
      expenditure: { ...baseInput.expenditure, rent: 900 },
    });
    expect(result.citations).toContain('Bankruptcy (Scotland) Regulations 2016 reg.17');
  });

  it('adds aliment and child support as an allowance — s.89(4)', () => {
    const result = assessContribution({ ...baseInput, alimentAndChildSupport: 200 });
    expect(result.allowedExpenditure).toBe(2110); // trigger total + 200
    expect(result.contribution).toBe(140);
    expect(result.citations).toContain('Bankruptcy (Scotland) Act 2016 s.89(4)');
  });

  it('protects guaranteed minimum pension income — s.89(3)', () => {
    // Reasonable expenditure must be at least the GMP, so no contribution can be
    // drawn from it.
    const result = assessContribution({
      ...baseInput,
      income: { wages: 0, benefits: 0, pension: 2200, other: 0 },
      guaranteedMinimumPension: 2200,
    });
    expect(result.allowedExpenditure).toBe(2200);
    expect(result.contribution).toBe(0);
    expect(result.citations).toContain('Bankruptcy (Scotland) Act 2016 s.89(3)');
  });

  it('caps the contingency allowance at 10% of contribution — reg.16', () => {
    // 10% of £150 is £15, under the £20 monthly cap.
    const result = assessContribution({
      ...baseInput,
      income: { wages: 2060, benefits: 0, pension: 0, other: 0 },
    });
    expect(result.contribution).toBe(150);
    expect(result.contingencyAllowance).toBe(15);
  });

  it('applies the absolute reg.16 cap when 10% would exceed it', () => {
    // 10% of £340 is £34, above the £20 monthly ceiling. Both limits bind.
    expect(assessContribution(baseInput).contingencyAllowance).toBe(20);
  });

  it('applies the weekly reg.16 cap when paid weekly', () => {
    expect(
      assessContribution({ ...baseInput, paymentFrequency: 'weekly' }).contingencyAllowance
    ).toBe(4.62);
  });

  it('allows a category as declared when no trigger is published for it', () => {
    // Inventing a trigger would fabricate an evidence obligation.
    const result = assessContribution({
      ...baseInput,
      triggerFigures: { rent: 700 },
      expenditure: { ...baseInput.expenditure, food: 500 },
    });
    expect(result.triggerExcesses.map(e => e.category)).not.toContain('food');
  });
});

describe('statutory thresholds', () => {
  it('carries a citation for every figure', () => {
    // A caseworker challenged on a figure needs the provision, so the citation is
    // data rather than a comment.
    expect(SEQUESTRATION_MIN_DEBT.citation).toContain('s.2(8)');
    expect(MAP.maxDebt.citation).toContain('s.2(2)(b)(ii)');
    expect(MAP.vehicleDisregard.citation).toContain('s.2(3)(b)');
  });

  it('records that MAP has NO minimum debt', () => {
    // SSI 2023/9 reg.2 removed the £1,500 floor and nothing replaced it. Outside
    // sources still cite £1,500, which would wrongly turn applicants away.
    expect(MAP.minDebt.value).toBeNull();
    expect(MAP.minDebt.amendedBy).toContain('SSI 2023/9');
  });

  it('records the amending instrument where a figure has moved', () => {
    expect(MAP.maxDebt.value).toBe(25000);
    expect(MAP.maxDebt.amendedBy).toContain('SSI 2021/148');
    expect(MAP.maxDebt.effectiveFrom).toBe('2021-03-29');
  });

  it('sets no monetary minimum for DAS', () => {
    // reg.21(1) permits a programme for "one or more debts"; the widely repeated
    // "£5,000 and two debts" has no basis in the regulations.
    expect(DAS.minDebts.value).toBe(1);
    expect(Object.keys(DAS)).not.toContain('minDebt');
  });

  it('disapplies creditor claims for MAP', () => {
    expect(creditorClaimsApply('sequestration')).toBe(true);
    expect(creditorClaimsApply('map')).toBe(false);
  });

  it('keeps the PTD objection thresholds asymmetric', () => {
    // Majority by count, but only a third by value — reg.10(2).
    expect(PTD_OBJECTION.majorityInNumber.value).toBe(0.5);
    expect(PTD_OBJECTION.fractionInValue.value).toBeCloseTo(1 / 3);
  });
});
