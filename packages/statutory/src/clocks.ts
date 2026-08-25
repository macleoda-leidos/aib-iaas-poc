/**
 * Statutory deadlines for Scotland's debt solutions.
 *
 * Each clock is computed from a trigger date and carries its provision, so a
 * caseworker can see not just when something is due but why. Dates in, dates
 * out — nothing here reads the wall clock except `describeDeadline`, which takes
 * "now" as an argument so results stay reproducible in tests.
 *
 * The subtle one is deemed consent. Under DAS a creditor who does not respond
 * within 21 days is *deemed to consent*, and under a PTD silence counts as
 * acceding. Neither is "no answer yet" — on expiry the silence becomes a
 * positive legal act, so it is modelled as a computed state with an auditable
 * basis rather than as an absent response.
 */

export type DeadlineKind =
  | 'creditor_objection'
  | 'discharge'
  | 'discharge_effective'
  | 'contribution_order_effective'
  | 'trustee_proposals'
  | 'creditor_claims'
  | 'late_claims_cutoff'
  | 'moratorium_expiry'
  | 'moratorium_reuse_bar'
  | 'accounting_period_end';

export interface Deadline {
  kind: DeadlineKind;
  /** Short label for a case timeline. */
  label: string;
  /** The provision this deadline arises from. */
  citation: string;
  /** When the clock started. */
  from: Date;
  /** When it expires. */
  due: Date;
  /**
   * What expiry causes, where silence has legal effect. Present only for the
   * deadlines where nothing happening IS the outcome.
   */
  onExpiry?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Add days without drifting across a daylight-saving boundary.
 *
 * Scotland moves to BST in March and back in October, so a term computed by
 * adding milliseconds to a date either side of those Sundays lands an hour out
 * and can report the wrong calendar day. Statutory periods are counted in days,
 * not elapsed time, so the arithmetic is done on the calendar fields.
 */
export function addDays(from: Date, days: number): Date {
  const result = new Date(from);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(from: Date, months: number): Date {
  const result = new Date(from);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  // Clamp an overflowed short month: 31 Jan + 1 month would otherwise land on
  // 2 or 3 March rather than the end of February.
  if (result.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    result.setDate(0);
  }
  return result;
}

/**
 * DAS creditor objection window — 21 days, with deemed consent on expiry.
 *
 * reg.23(5) confines deemed consent to programmes covering MORE THAN ONE debt.
 * For a single-debt programme silence is not consent, so the caller must say
 * which it is: treating a single-debt non-response as consent would approve a
 * programme the creditor never agreed to.
 */
export function dasCreditorObjection(requestedOn: Date, debtCount: number): Deadline {
  const multiDebt = debtCount > 1;
  return {
    kind: 'creditor_objection',
    label: 'DAS creditor objection period',
    citation: 'Debt Arrangement Scheme (Scotland) Regulations 2011 reg.23(5)',
    from: requestedOn,
    due: addDays(requestedOn, 21),
    onExpiry: multiDebt
      ? 'Non-responding creditors are deemed to consent'
      : 'No deemed consent — single-debt programme requires express consent',
  };
}

/**
 * Protected trust deed objection window — 5 weeks from registration.
 *
 * The period runs from registration of the reg.9 notice, not from the date the
 * trust deed was granted.
 */
export function ptdObjectionPeriod(registeredOn: Date): Deadline {
  return {
    kind: 'creditor_objection',
    label: 'PTD creditor objection period',
    citation: 'Protected Trust Deeds (Scotland) Regulations 2013 reg.2, reg.10(2)',
    from: registeredOn,
    due: addDays(registeredOn, 35),
    onExpiry:
      'Trust deed deemed acceded to unless a majority in number, or no fewer than one third in value, objected',
  };
}

/**
 * Discharge from sequestration.
 *
 * MAP discharges automatically at 6 months under s.140(1) with no 14-day delay.
 * Full administration is different in both respects: discharge becomes available
 * at 12 months (ss.137-138) and then cannot take effect until 14 days after the
 * decision is notified. Conflating the two would tell a MAP debtor to wait twice
 * as long as the law requires.
 */
export function dischargeDeadlines(
  awardedOn: Date,
  product: 'sequestration' | 'map'
): Deadline[] {
  if (product === 'map') {
    return [
      {
        kind: 'discharge',
        label: 'Automatic discharge (MAP)',
        citation: 'Bankruptcy (Scotland) Act 2016 s.140(1)',
        from: awardedOn,
        due: addMonths(awardedOn, 6),
        onExpiry: 'Debtor is discharged automatically — no decision required',
      },
    ];
  }

  return [
    {
      kind: 'discharge',
      label: 'Discharge available from',
      citation: 'Bankruptcy (Scotland) Act 2016 ss.137-138',
      from: awardedOn,
      due: addMonths(awardedOn, 12),
    },
  ];
}

/**
 * The 14-day delay before a discharge decision takes effect (ss.137-138).
 * Runs from notification of the decision, not from the 12-month anniversary.
 */
export function dischargeEffectiveFrom(notifiedOn: Date): Deadline {
  return {
    kind: 'discharge_effective',
    label: 'Discharge takes effect',
    citation: 'Bankruptcy (Scotland) Act 2016 ss.137-138',
    from: notifiedOn,
    due: addDays(notifiedOn, 14),
  };
}

/** Trustee's initial contribution proposals — 12 weeks from award (s.90(2)). */
export function trusteeProposalsDue(awardedOn: Date): Deadline {
  return {
    kind: 'trustee_proposals',
    label: 'Trustee initial proposals due',
    citation: 'Bankruptcy (Scotland) Act 2016 s.90(2)',
    from: awardedOn,
    due: addDays(awardedOn, 84),
  };
}

/** A debtor contribution order cannot take effect for 14 days (s.90(9)). */
export function contributionOrderEffectiveFrom(notifiedOn: Date): Deadline {
  return {
    kind: 'contribution_order_effective',
    label: 'Contribution order takes effect',
    citation: 'Bankruptcy (Scotland) Act 2016 s.90(9)',
    from: notifiedOn,
    due: addDays(notifiedOn, 14),
  };
}

/**
 * Creditor claim deadline — 120 days from the s.44(3) notice (s.122(5)).
 *
 * Returns null for MAP: schedule 1 para 1(6) disapplies s.122, and AiB must
 * positively state that no claims may be submitted. A countdown here would be
 * inviting creditors into a process that does not exist for this product.
 */
export function creditorClaimsDue(
  noticeGivenOn: Date,
  product: 'sequestration' | 'map'
): Deadline | null {
  if (product === 'map') return null;

  return {
    kind: 'creditor_claims',
    label: 'Creditor claims deadline',
    citation: 'Bankruptcy (Scotland) Act 2016 s.122(5)',
    from: noticeGivenOn,
    due: addDays(noticeGivenOn, 120),
  };
}

/**
 * Last date a late claim may still be admitted — 8 weeks before the accounting
 * period ends (s.122(6)).
 *
 * Admission is discretionary and additionally requires exceptional circumstances
 * that prevented timely submission, so this bounds the window rather than
 * guaranteeing acceptance.
 */
export function lateClaimCutoff(accountingPeriodEnd: Date): Deadline {
  return {
    kind: 'late_claims_cutoff',
    label: 'Last date for a late claim',
    citation: 'Bankruptcy (Scotland) Act 2016 s.122(6)',
    from: addDays(accountingPeriodEnd, -56),
    due: addDays(accountingPeriodEnd, -56),
    onExpiry: 'Late claims may no longer be admitted, even in exceptional circumstances',
  };
}

/**
 * Accounting period end — 12 months, first running from the award (s.130(2)).
 * A shortened period may be agreed but must be at least 6 months (s.130(5)).
 */
export function accountingPeriodEnd(startedOn: Date): Deadline {
  return {
    kind: 'accounting_period_end',
    label: 'Accounting period ends',
    citation: 'Bankruptcy (Scotland) Act 2016 s.130(2)',
    from: startedOn,
    due: addMonths(startedOn, 12),
  };
}

/**
 * Moratorium clocks — 6 months' protection, plus the 12-month bar on giving a
 * further notice (s.198(1)(b)(i), s.195(2)).
 *
 * Both run from the register-of-insolvencies entry, so the reuse bar outlasts the
 * protection by six months. Debtors emerging from a moratorium routinely ask when
 * they can use one again; the answer is not "now".
 */
export function moratoriumDeadlines(registeredOn: Date): Deadline[] {
  return [
    {
      kind: 'moratorium_expiry',
      label: 'Moratorium protection ends',
      citation: 'Bankruptcy (Scotland) Act 2016 s.198(1)(b)(i)',
      from: registeredOn,
      due: addMonths(registeredOn, 6),
      onExpiry: 'Diligence may resume unless a debt solution is in place',
    },
    {
      kind: 'moratorium_reuse_bar',
      label: 'Earliest date a further moratorium notice may be given',
      citation: 'Bankruptcy (Scotland) Act 2016 s.195(2)',
      from: registeredOn,
      due: addMonths(registeredOn, 12),
    },
  ];
}

export interface DeadlineStatus {
  daysRemaining: number;
  expired: boolean;
  /** Within a week of expiry — the threshold at which a case needs attention. */
  imminent: boolean;
}

/**
 * Position of a deadline relative to `now`.
 *
 * `now` is a parameter rather than `new Date()` so the same case renders
 * identically in a test, and so a caseworker can ask "where did this stand on
 * the date of the decision?".
 */
export function describeDeadline(deadline: Deadline, now: Date): DeadlineStatus {
  // Compared at day granularity: statutory periods are counted in days, so a
  // deadline at 09:00 has not "expired" at 14:00 on the day before.
  const startOfDay = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const daysRemaining = Math.round((startOfDay(deadline.due) - startOfDay(now)) / DAY_MS);

  return {
    daysRemaining,
    expired: daysRemaining < 0,
    imminent: daysRemaining >= 0 && daysRemaining <= 7,
  };
}
