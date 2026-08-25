/**
 * Statutory thresholds for Scotland's debt solutions, each carrying the
 * provision it comes from.
 *
 * Every monetary figure in the Bankruptcy (Scotland) Act 2016 is expressed as
 * "£X or such other amount as may be prescribed" — Ministers change them by
 * Scottish statutory instrument, without touching primary legislation. Several
 * have already moved: the MAP debt ceiling became £25,000 in 2021 (SSI 2021/148),
 * the trustee proposal window went from 6 to 12 weeks the same year, and the
 * moratorium went from 6 weeks to 6 months in 2022. So these are configuration
 * with an effective date, not constants, and `citation` is part of the data
 * rather than a comment: a caseworker challenged on a figure needs the provision.
 *
 * Verified against legislation.gov.uk. Anything that could not be verified is
 * absent rather than guessed.
 */

export interface Threshold<T> {
  value: T;
  /** The provision this figure comes from, quotable to a caseworker. */
  citation: string;
  /** Set where the current value differs from the one originally enacted. */
  amendedBy?: string;
  /** ISO date the current value took effect, where known. */
  effectiveFrom?: string;
}

function threshold<T>(
  value: T,
  citation: string,
  extra?: { amendedBy?: string; effectiveFrom?: string }
): Threshold<T> {
  return { value, citation, ...extra };
}

/**
 * Minimum debt for a debtor application for sequestration.
 * s.2(8)(a): "not less than £3,000 or such sum as may be prescribed".
 */
export const SEQUESTRATION_MIN_DEBT = threshold(
  3000,
  'Bankruptcy (Scotland) Act 2016 s.2(8)(a)'
);

/** Minimal Asset Process eligibility — s.2(2) and s.2(3). */
export const MAP = {
  maxDebt: threshold(25000, 'Bankruptcy (Scotland) Act 2016 s.2(2)(b)(ii)', {
    amendedBy: 'SSI 2021/148 reg.4(2)',
    effectiveFrom: '2021-03-29',
  }),

  /**
   * There is NO MAP minimum debt. s.2(2)(b)(i) now reads "not less than such
   * amount as may be prescribed" — SSI 2023/9 reg.2 removed the £1,500 figure
   * and nothing has been prescribed since. Modelled explicitly as null because
   * "no minimum" is a deliberate policy position that outside sources still get
   * wrong, and a missing key would read as an oversight.
   */
  minDebt: threshold<number | null>(
    null,
    'Bankruptcy (Scotland) Act 2016 s.2(2)(b)(i) — no amount currently prescribed',
    { amendedBy: 'SSI 2023/9 reg.2', effectiveFrom: '2023-02-06' }
  ),

  maxTotalAssets: threshold(2000, 'Bankruptcy (Scotland) Act 2016 s.2(2)(c)'),
  maxSingleAsset: threshold(1000, 'Bankruptcy (Scotland) Act 2016 s.2(2)(d)'),

  /** s.2(2)(e) — the one condition with no "or as prescribed" escape. */
  mustNotOwnLand: threshold(true, 'Bankruptcy (Scotland) Act 2016 s.2(2)(e)'),

  /**
   * s.2(3)(b) — note s.2(3), not s.2(2): a vehicle under this value is not
   * counted as an asset at all, but only where the debtor "reasonably requires
   * the use of a vehicle".
   */
  vehicleDisregard: threshold(3000, 'Bankruptcy (Scotland) Act 2016 s.2(3)(b)'),
} as const;

/**
 * Debt Arrangement Scheme eligibility.
 *
 * Deliberately holds no monetary minimum: reg.21(1) permits a programme for
 * "one or more debts", and the instrument prescribes no debt floor. The
 * often-repeated "£5,000 and at least two debts" has no basis in the
 * regulations — asserting it would wrongly turn people away.
 */
export const DAS = {
  minDebts: threshold(1, 'Debt Arrangement Scheme (Scotland) Regulations 2011 reg.21(1)'),
} as const;

/** Debtor contribution order — ss.90, 91. */
export const DCO = {
  /** s.91(2)(a). A default, not a cap: (2)(b) and (2)(c) allow shorter and longer. */
  defaultPeriodMonths: threshold(48, 'Bankruptcy (Scotland) Act 2016 s.91(2)(a)'),
} as const;

/**
 * Common Financial Tool contingency allowance — SSI 2016/397 reg.16.
 *
 * Both limits apply: the allowance is up to 10% of the contribution, capped in
 * absolute terms by payment frequency.
 */
export const CFT_CONTINGENCY = {
  maxPercentOfContribution: threshold(10, 'Bankruptcy (Scotland) Regulations 2016 reg.16'),
  maxWeekly: threshold(4.62, 'Bankruptcy (Scotland) Regulations 2016 reg.16'),
  maxFortnightly: threshold(9.23, 'Bankruptcy (Scotland) Regulations 2016 reg.16'),
  maxMonthly: threshold(20, 'Bankruptcy (Scotland) Regulations 2016 reg.16'),
} as const;

/**
 * Protected trust deed creditor objection thresholds — SSI 2013/318 reg.10(2).
 *
 * Protection is defeated if EITHER is met, so both must be evaluated. Note the
 * asymmetry: a simple majority by count, but only a third by value.
 */
export const PTD_OBJECTION = {
  majorityInNumber: threshold(
    0.5,
    'Protected Trust Deeds (Scotland) Regulations 2013 reg.10(2) — majority in number'
  ),
  fractionInValue: threshold(
    1 / 3,
    'Protected Trust Deeds (Scotland) Regulations 2013 reg.10(2) — no fewer than one third in value'
  ),
} as const;

/**
 * Whether creditors may submit claims under s.122 for a given product.
 *
 * Schedule 1 para 1(6) disapplies s.122 for MAP entirely, and para 1(2) requires
 * AiB to state that no claims may be submitted. Applying the 120-day claim clock
 * to a MAP case would invent a process the debtor is statutorily exempt from.
 */
export function creditorClaimsApply(product: 'sequestration' | 'map'): boolean {
  return product !== 'map';
}
