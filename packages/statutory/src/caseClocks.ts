/**
 * Maps a case to the statutory clocks its product actually gives it.
 *
 * `clocks.ts` computes each deadline from its own trigger date. This module
 * answers the question a caseworker asks instead: given this case, which clocks
 * are running? The two are separate because the mapping is a legal judgement —
 * which provisions bite on which product — while the arithmetic is not.
 *
 * Each product gets only the clocks the law gives it. A MAP case has no creditor
 * claims deadline because schedule 1 para 1(6) disapplies s.122 entirely, and a
 * MAP debtor is discharged at 6 months rather than 12. Showing a MAP case the
 * full-administration clocks would tell a debtor to wait twice as long as the law
 * requires.
 *
 * Dates in, dates out — nothing here reads the wall clock, so a case renders
 * identically in a test and a caseworker can ask where a deadline stood on any
 * given day.
 */

import {
  type Deadline,
  dasCreditorObjection,
  ptdObjectionPeriod,
  dischargeDeadlines,
  trusteeProposalsDue,
  creditorClaimsDue,
  lateClaimCutoff,
  accountingPeriodEnd,
} from './clocks';

/** The four products with deadlines modelled in `clocks.ts`. */
export type CaseProduct = 'das' | 'map' | 'ptd' | 'sequestration';

export interface CaseClock {
  deadline: Deadline;
  /**
   * How the trigger date was arrived at, for display.
   *
   * Only the application date is recorded on a case — there is no award date, no
   * registration date and no s.44(3) notice date anywhere in the record. So every
   * other trigger is modelled from the application date, and saying so is the
   * difference between decision support and a fabricated figure. A modelled award
   * date presented as a recorded one would be the one thing here that misleads.
   */
  derivation: string;
}

/**
 * A deadline that does NOT run for this product, stated rather than omitted.
 *
 * Silence would be ambiguous: a caseworker cannot tell "this product has no
 * claims deadline" from "the panel forgot about claims". Schedule 1 para 1(2)
 * requires AiB to state positively that no claims may be submitted in a MAP.
 */
export interface DisappliedDeadline {
  label: string;
  citation: string;
  reason: string;
}

export interface CaseClockSet {
  product: CaseProduct;
  /** Sorted by `due` ascending, so a renderer does no ordering of its own. */
  clocks: CaseClock[];
  disapplied: DisappliedDeadline[];
}

export interface CaseClockInput {
  product: CaseProduct;
  /** The application date recorded on the case — the only real date available. */
  submittedOn: Date;
  /**
   * Number of debts in the programme. Only DAS uses it, and it must be passed
   * rather than assumed: reg.23(5) confines deemed consent to programmes covering
   * more than one debt, so hardcoding it would approve a single-debt programme the
   * creditor never agreed to.
   */
  debtCount?: number;
}

/**
 * Display forms accepted for a product, mapped to the modelled product.
 *
 * Both the short code and the long form are accepted because the case record uses
 * both — `PROCESSING_TIMES` in the case detail page already keys on each. Lookup
 * is case-insensitive.
 *
 * 'DPP' is deliberately absent. The case record knows it, but `clocks.ts` models
 * no deadlines for it, so it resolves to null and a DPP case shows no panel. That
 * is the point of returning null rather than defaulting to a product: a wrong
 * countdown is worse than no countdown.
 */
const PRODUCT_FORMS: Record<string, CaseProduct> = {
  'das': 'das',
  'debt arrangement scheme (das)': 'das',
  'map': 'map',
  'minimal asset process (map)': 'map',
  'ptd': 'ptd',
  'protected trust deed (ptd)': 'ptd',
  'sequestration': 'sequestration',
  'sequestration (bankruptcy)': 'sequestration',
};

export function normaliseProduct(product: string): CaseProduct | null {
  return PRODUCT_FORMS[product.trim().toLowerCase()] ?? null;
}

/**
 * The creditor claims position, taken from the one branch that decides it.
 *
 * `creditorClaimsDue` returns null for MAP. Deriving both the clock and the
 * disapplication notice from that same null keeps them from disagreeing: there is
 * no path on which the panel shows a countdown and the notice simultaneously.
 */
function claimsPosition(
  noticeModelledOn: Date,
  product: 'sequestration' | 'map'
): { clock?: CaseClock; disapplied?: DisappliedDeadline } {
  const deadline = creditorClaimsDue(noticeModelledOn, product);

  if (deadline === null) {
    return {
      disapplied: {
        label: 'No creditor claims deadline',
        citation: 'Bankruptcy (Scotland) Act 2016 sch.1 para 1(6)',
        reason:
          'No claims may be submitted in a Minimal Asset Process — s.122 is disapplied, so there is no claims period to run.',
      },
    };
  }

  return {
    clock: {
      deadline,
      derivation:
        'Runs 120 days from the s.44(3) notice to creditors. That notice date is not recorded on this case, so it is modelled as the application date.',
    },
  };
}

/**
 * Which clocks run on this case.
 *
 * `moratoriumDeadlines`, `contributionOrderEffectiveFrom` and
 * `dischargeEffectiveFrom` are deliberately NOT mapped. Each is triggered by a
 * notification event — a register entry, a notified decision — that has not
 * occurred on any case in the record. Mapping them would mean inventing the date
 * they run from, and an invented date is worse than an absent clock. Same
 * discipline `thresholds.ts` states as "anything that could not be verified is
 * absent rather than guessed".
 */
export function caseClocks(input: CaseClockInput): CaseClockSet {
  const { product, submittedOn, debtCount = 0 } = input;
  const clocks: CaseClock[] = [];
  const disapplied: DisappliedDeadline[] = [];

  // The application date is the only recorded date, so every modelled trigger is
  // the same day rather than an invented offset from it. Stated per clock in
  // `derivation` so nothing here reads as a recorded fact.
  const APPLIED = 'the application date recorded on this case';

  if (product === 'das') {
    clocks.push({
      deadline: dasCreditorObjection(submittedOn, debtCount),
      derivation: `Runs 21 days from the date the programme was applied for — ${APPLIED}.`,
    });
  }

  if (product === 'ptd') {
    clocks.push({
      deadline: ptdObjectionPeriod(submittedOn),
      derivation: `Runs 5 weeks from registration of the reg.9 notice. The registration date is not recorded on this case, so it is modelled as ${APPLIED}.`,
    });
  }

  if (product === 'map' || product === 'sequestration') {
    const dischargeDerivation = `Runs from the date sequestration was awarded. No award date is recorded on this case, so it is modelled as ${APPLIED}.`;

    for (const deadline of dischargeDeadlines(submittedOn, product)) {
      clocks.push({ deadline, derivation: dischargeDerivation });
    }

    const claims = claimsPosition(submittedOn, product);
    if (claims.clock) clocks.push(claims.clock);
    if (claims.disapplied) disapplied.push(claims.disapplied);
  }

  if (product === 'sequestration') {
    clocks.push({
      deadline: trusteeProposalsDue(submittedOn),
      derivation: `Runs 12 weeks from award, modelled as ${APPLIED}.`,
    });

    const period = accountingPeriodEnd(submittedOn);
    clocks.push({
      deadline: period,
      derivation: `The first accounting period runs 12 months from award, modelled as ${APPLIED}. A shortened period may be agreed but must be at least 6 months.`,
    });

    clocks.push({
      // `from` is normalised to the case trigger. lateClaimCutoff models a cutoff
      // instant, so it reports from === due; within a case set every clock runs
      // from the same modelled trigger, which is what the countdown is measured
      // against.
      deadline: { ...lateClaimCutoff(period.due), from: submittedOn },
      derivation:
        'Falls 8 weeks before the accounting period ends, and so is modelled from that period rather than recorded. Admission of a late claim is discretionary and additionally requires exceptional circumstances.',
    });
  }

  // Sorted here rather than in the component: ordering deadlines by urgency is
  // part of what the clock set means, not a presentation choice.
  clocks.sort((a, b) => a.deadline.due.getTime() - b.deadline.due.getTime());

  return { product, clocks, disapplied };
}
