/**
 * Common Financial Tool — the statutory assessment of a debtor's contribution.
 *
 * Scotland's specified method is the **Common Financial Statement**, per reg.15
 * of the Bankruptcy (Scotland) Regulations 2016. This matters because England and
 * Wales replaced the CFS with the Standard Financial Statement, so UK-wide debt
 * tooling generally implements the SFS — and reg.15 has never been amended to
 * follow. Verified: the consolidated instrument mentions the Common Financial
 * Statement ten times and the Standard Financial Statement not at all.
 *
 * What the CFS does is compare expenditure against published **trigger figures**.
 * A trigger figure is not a cap: expenditure above it is allowed where it is
 * reasonable, but reg.17 then requires a statement explaining the excess and
 * evidence supporting it. So the output here records which categories exceeded
 * their trigger and what evidence is therefore owed, rather than silently
 * clamping the numbers.
 */

/** Monthly trigger figures by household composition. */
export interface TriggerFigures {
  /** Category key -> monthly trigger amount in pounds. */
  [category: string]: number;
}

export interface CftIncome {
  wages: number;
  benefits: number;
  pension: number;
  other: number;
}

export interface CftExpenditure {
  rent: number;
  councilTax: number;
  utilities: number;
  food: number;
  transport: number;
  insurance: number;
  childcare: number;
  other: number;
}

export interface CftInput {
  income: CftIncome;
  expenditure: CftExpenditure;
  triggerFigures: TriggerFigures;
  /**
   * Guaranteed minimum pension income, which s.89(3) protects: reasonable
   * expenditure must be at least this much, so a debtor on GMP cannot be assessed
   * as having a contribution drawn from it.
   */
  guaranteedMinimumPension?: number;
  /**
   * Aliment for the debtor and "relevant obligations" — child support under the
   * Child Support Act 1991. s.89(4) requires an allowance for these, so they are
   * additive to assessed expenditure rather than something to be squeezed.
   */
  alimentAndChildSupport?: number;
  /** Payment frequency, which caps the reg.16 contingency allowance. */
  paymentFrequency?: 'weekly' | 'fortnightly' | 'monthly';
}

export interface TriggerExcess {
  category: string;
  declared: number;
  trigger: number;
  excess: number;
}

export interface CftAssessment {
  totalIncome: number;
  /** Expenditure actually declared by the debtor. */
  declaredExpenditure: number;
  /**
   * Expenditure allowed for the assessment: the greater of declared and trigger
   * totals, plus the mandatory s.89(4) allowances, and never less than the
   * protected GMP floor.
   */
  allowedExpenditure: number;
  /** Income less allowed expenditure. Never negative — a deficit is not a contribution. */
  contribution: number;
  /** Categories above their trigger figure, each needing reg.17 evidence. */
  triggerExcesses: TriggerExcess[];
  /** True where reg.17 requires a supporting statement and evidence. */
  evidenceRequired: boolean;
  /** Maximum reg.16 contingency allowance for this contribution and frequency. */
  contingencyAllowance: number;
  citations: string[];
}

/** reg.16 absolute caps on the contingency allowance, by payment frequency. */
const CONTINGENCY_CAPS = {
  weekly: 4.62,
  fortnightly: 9.23,
  monthly: 20,
} as const;

const CONTINGENCY_MAX_PERCENT = 0.1;

function sum(values: number[]): number {
  return values.reduce((total, v) => total + (Number.isFinite(v) ? v : 0), 0);
}

/** Round to whole pence, so repeated arithmetic cannot drift. */
function toPence(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Assess a debtor's contribution under the Common Financial Statement.
 *
 * The trigger comparison is per category, not on the total: a debtor may be under
 * on food and over on transport, and reg.17 asks about each excess individually.
 * Netting them off would hide exactly what the evidence duty attaches to.
 */
export function assessContribution(input: CftInput): CftAssessment {
  const totalIncome = toPence(
    sum([input.income.wages, input.income.benefits, input.income.pension, input.income.other])
  );

  const expenditureEntries = Object.entries(input.expenditure) as Array<
    [keyof CftExpenditure, number]
  >;
  const declaredExpenditure = toPence(sum(expenditureEntries.map(([, v]) => v)));

  const triggerExcesses: TriggerExcess[] = [];
  let triggerTotal = 0;

  for (const [category, declared] of expenditureEntries) {
    const trigger = input.triggerFigures[category];
    // A category with no published trigger is allowed as declared — inventing a
    // figure would fabricate an evidence obligation.
    if (!Number.isFinite(trigger)) {
      triggerTotal += declared;
      continue;
    }

    triggerTotal += trigger;
    if (declared > trigger) {
      triggerExcesses.push({
        category,
        declared: toPence(declared),
        trigger: toPence(trigger),
        excess: toPence(declared - trigger),
      });
    }
  }

  // reg.15: assessed against the greater of what was declared and the trigger
  // figures. A debtor spending under the triggers is not assessed as though they
  // could contribute the difference.
  let allowedExpenditure = Math.max(declaredExpenditure, toPence(triggerTotal));

  // s.89(4): aliment and child support are allowances on top, not candidates for
  // reduction.
  allowedExpenditure += input.alimentAndChildSupport ?? 0;

  // s.89(3): reasonable expenditure must not be assessed below guaranteed
  // minimum pension income.
  const gmp = input.guaranteedMinimumPension ?? 0;
  if (gmp > allowedExpenditure) allowedExpenditure = gmp;

  allowedExpenditure = toPence(allowedExpenditure);

  // A deficit means no contribution, not a negative one.
  const contribution = toPence(Math.max(0, totalIncome - allowedExpenditure));

  const cap = CONTINGENCY_CAPS[input.paymentFrequency ?? 'monthly'];
  const contingencyAllowance = toPence(Math.min(contribution * CONTINGENCY_MAX_PERCENT, cap));

  const citations = ['Bankruptcy (Scotland) Regulations 2016 reg.15'];
  if (triggerExcesses.length > 0) {
    citations.push('Bankruptcy (Scotland) Regulations 2016 reg.17');
  }
  if (contingencyAllowance > 0) {
    citations.push('Bankruptcy (Scotland) Regulations 2016 reg.16');
  }
  if (gmp > 0) citations.push('Bankruptcy (Scotland) Act 2016 s.89(3)');
  if ((input.alimentAndChildSupport ?? 0) > 0) {
    citations.push('Bankruptcy (Scotland) Act 2016 s.89(4)');
  }

  return {
    totalIncome,
    declaredExpenditure,
    allowedExpenditure,
    contribution,
    triggerExcesses,
    evidenceRequired: triggerExcesses.length > 0,
    contingencyAllowance,
    citations,
  };
}

/**
 * Indicative monthly trigger figures for the POC.
 *
 * The real CFS trigger figures are published annually and licensed; these are
 * plausible stand-ins so the assessment can be demonstrated end to end. Labelled
 * clearly because presenting invented numbers as the published set would be the
 * kind of error this module exists to avoid.
 */
export const INDICATIVE_TRIGGER_FIGURES: TriggerFigures = {
  rent: 700,
  councilTax: 140,
  utilities: 180,
  food: 300,
  transport: 160,
  insurance: 60,
  childcare: 250,
  other: 120,
};
