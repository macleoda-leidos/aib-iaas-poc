/**
 * The pure evaluation core of the statutory SLA worker.
 *
 * No I/O lives here. Like `@aib-iaas/statutory` and the `StatutoryDeadlines`
 * component it mirrors, `now` is injected — so a case evaluates identically in a
 * test and a caseworker can ask where a deadline stood on any given day. The
 * worker (`worker.ts`) is the only part that touches the database; this module
 * turns a case plus a clock into the list of reminders that are due, and nothing
 * else. That split is what makes the legally-hard logic testable without a DB.
 *
 * The engine never decides anything. Several statutory expiries are themselves
 * legal acts (DAS deemed consent under reg.23(5), PTD accession) and every real
 * decision in this codebase is gated by a permissioned human. So the output is
 * awareness — notify + audit + flag — never a status transition.
 */

import {
  caseClocks,
  describeDeadline,
  normaliseProduct,
  type Deadline,
  type DeadlineKind,
  type DeadlineStatus,
} from '@aib-iaas/statutory';

/**
 * The statuses on which statutory clocks are live. `draft` has no `submitted_at`,
 * so nothing to measure against; `approved`/`rejected` are terminal. Keeping the
 * list here (rather than in the worker) lets the worker page the queue by status
 * without knowing which statuses matter.
 */
export const OPEN_STATUSES = [
  'submitted',
  'under_review',
  'additional_info_required',
  'recommendation_issued',
] as const;

/** A milestone fires once per (case, deadline); the idempotency key carries which. */
export type SlaMilestone = 'approaching' | 'due_today' | 'breached';

/** The live SLA posture of a case, surfaced on the staff queue. */
export type SlaStatus = 'on_track' | 'at_risk' | 'overdue';

/** Matches the NotificationType union the gateway's `notify()` helper accepts. */
export type SlaNotificationType = 'info' | 'action_required' | 'warning' | 'error';

export interface CaseForSla {
  applicationId: string;
  referenceNumber: string;
  /** Raw product string — short ('DAS') or long form; `normaliseProduct` resolves it. */
  product: string;
  /** The recorded submission date — the only real date a case carries. */
  submittedOn: Date;
  /** Debts in the programme. Only DAS uses it (reg.23(5) deemed-consent gate). */
  debtCount: number;
  /** The assigned caseworker to notify, or null if the case is unassigned. */
  assignedTo: string | null;
}

export interface SlaEvent {
  /** `${applicationId}:${deadlineKind}:${milestone}` — the idempotency key. */
  key: string;
  applicationId: string;
  referenceNumber: string;
  deadlineKind: DeadlineKind;
  milestone: SlaMilestone;
  /** ISO due date of the deadline this event is about. */
  dueAt: string;
  citation: string;
  /** Who to notify, or null (unassigned) — then only the audit event is written. */
  recipient: string | null;
  notificationType: SlaNotificationType;
  subject: string;
  body: string;
}

export interface SlaSummary {
  status: SlaStatus;
  /**
   * The deadline the queue should surface: the soonest clock still running, or —
   * when every clock has already expired — the earliest-overdue one.
   */
  nextDeadline?: {
    kind: DeadlineKind;
    label: string;
    /** ISO due date. */
    due: string;
    daysRemaining: number;
    citation: string;
  };
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** British-style date for human-facing notification copy, computed without a locale. */
function formatDue(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Which milestone, if any, a deadline sits at relative to `now`.
 *
 * A deadline is in exactly one state at a given moment, so this returns at most
 * one milestone. Over the life of a case the clock passes through each in turn —
 * approaching (1–7 days out), due_today (0), breached (expired) — and the
 * idempotency key carries the milestone, so each fires exactly once.
 */
function milestoneFor(status: DeadlineStatus): SlaMilestone | null {
  if (status.expired) return 'breached';
  if (status.daysRemaining === 0) return 'due_today';
  if (status.imminent && status.daysRemaining >= 1 && status.daysRemaining <= 7) return 'approaching';
  return null;
}

/** Build the notification shape for a milestone, surfacing the statute metadata. */
function buildEvent(
  input: CaseForSla,
  deadline: Deadline,
  status: DeadlineStatus,
  milestone: SlaMilestone,
): SlaEvent {
  const ref = input.referenceNumber;
  const due = formatDue(deadline.due);

  let notificationType: SlaNotificationType;
  let subject: string;
  let body: string;

  if (milestone === 'approaching') {
    notificationType = 'warning';
    const days = status.daysRemaining === 1 ? '1 day' : `${status.daysRemaining} days`;
    subject = `SLA approaching: ${deadline.label} (${ref})`;
    body = `The ${deadline.label.toLowerCase()} on ${ref} is due in ${days}, on ${due}. ${deadline.citation}.`;
  } else if (milestone === 'due_today') {
    notificationType = 'action_required';
    subject = `SLA due today: ${deadline.label} (${ref})`;
    body = `The ${deadline.label.toLowerCase()} on ${ref} is due today (${due}). ${deadline.citation}.`;
  } else {
    notificationType = 'error';
    subject = `SLA breached: ${deadline.label} (${ref})`;
    // Lead with what the expiry itself causes, where silence has legal effect —
    // this is the legally literate part the statute metadata already carries.
    const consequence = deadline.onExpiry ? ` ${deadline.onExpiry}.` : '';
    body = `The ${deadline.label.toLowerCase()} on ${ref} lapsed on ${due}.${consequence} ${deadline.citation}.`;
  }

  return {
    key: `${input.applicationId}:${deadline.kind}:${milestone}`,
    applicationId: input.applicationId,
    referenceNumber: ref,
    deadlineKind: deadline.kind,
    milestone,
    dueAt: deadline.due.toISOString(),
    citation: deadline.citation,
    recipient: input.assignedTo,
    notificationType,
    subject,
    body,
  };
}

/**
 * Evaluate one case against `now`, returning the reminders due but not yet fired.
 *
 * Clocks come from `@aib-iaas/statutory`, so a MAP case has no creditor-claims
 * milestone (s.122 is disapplied — `caseClocks` never emits that clock), and an
 * unmodelled product (DPP) resolves to null and yields no events. `firedKeys` is
 * the set already recorded in `sla_events`; any key present is skipped.
 */
export function evaluateCase(input: CaseForSla, now: Date, firedKeys: Set<string>): SlaEvent[] {
  const product = normaliseProduct(input.product);
  if (!product) return [];

  const { clocks } = caseClocks({
    product,
    submittedOn: input.submittedOn,
    debtCount: input.debtCount,
  });

  const events: SlaEvent[] = [];
  for (const { deadline } of clocks) {
    const status = describeDeadline(deadline, now);
    const milestone = milestoneFor(status);
    if (!milestone) continue;

    const key = `${input.applicationId}:${deadline.kind}:${milestone}`;
    if (firedKeys.has(key)) continue;

    events.push(buildEvent(input, deadline, status, milestone));
  }
  return events;
}

/**
 * The live SLA posture for the staff queue: overdue if any clock has expired,
 * else at_risk if any is imminent (0–7 days), else on_track. `nextDeadline` is the
 * soonest clock still running — or, when all have expired, the earliest overdue —
 * so the queue can show "what's next" alongside the badge.
 *
 * Returns null for an unmodelled product (DPP) so such a case shows no false SLA,
 * and null when the product has no modelled clocks at all.
 */
export function summariseCase(
  input: { product: string; submittedOn: Date; debtCount: number },
  now: Date,
): SlaSummary | null {
  const product = normaliseProduct(input.product);
  if (!product) return null;

  const { clocks } = caseClocks({
    product,
    submittedOn: input.submittedOn,
    debtCount: input.debtCount,
  });
  if (clocks.length === 0) return null;

  let overdue = false;
  let atRisk = false;
  // clocks are sorted by due ascending, so the first non-expired clock is the soonest.
  let next: { deadline: Deadline; status: DeadlineStatus } | null = null;

  for (const { deadline } of clocks) {
    const status = describeDeadline(deadline, now);
    if (status.expired) overdue = true;
    else if (status.imminent) atRisk = true;
    if (!status.expired && next === null) next = { deadline, status };
  }

  // Every clock expired → surface the earliest (first) as the overdue "next".
  if (next === null) {
    const deadline = clocks[0].deadline;
    next = { deadline, status: describeDeadline(deadline, now) };
  }

  const status: SlaStatus = overdue ? 'overdue' : atRisk ? 'at_risk' : 'on_track';
  return {
    status,
    nextDeadline: {
      kind: next.deadline.kind,
      label: next.deadline.label,
      due: next.deadline.due.toISOString(),
      daysRemaining: next.status.daysRemaining,
      citation: next.deadline.citation,
    },
  };
}
