import { describe, it, expect } from 'vitest';
import { evaluateCase, summariseCase, OPEN_STATUSES, type CaseForSla } from '../sla/engine';

/**
 * Unit tests for the pure SLA evaluation engine. `now` is pinned on every call,
 * so these assert exact milestone transitions without a clock or a database.
 *
 * All dates are built with local-component constructors (new Date(y, m, d)) to
 * match how @aib-iaas/statutory does its day arithmetic — describeDeadline
 * compares at day granularity on local calendar fields, so this stays stable
 * regardless of the machine timezone.
 */

const APP_ID = 'app-under-test';

function dasCase(overrides: Partial<CaseForSla> = {}): CaseForSla {
  return {
    applicationId: APP_ID,
    referenceNumber: 'IAAS-2026-00001',
    product: 'DAS',
    submittedOn: new Date(2026, 5, 1), // 1 June 2026
    debtCount: 2, // >1 → DAS deemed consent applies on expiry
    assignedTo: 'user-officer',
    ...overrides,
  };
}

// DAS 21-day creditor objection runs from 1 June → due 22 June 2026.
const DAS_DUE = new Date(2026, 5, 22);

describe('SLA engine — evaluateCase', () => {
  it('fires "approaching" once inside the 1–7 day window', () => {
    const now = new Date(2026, 5, 17); // 5 days before 22 June
    const events = evaluateCase(dasCase(), now, new Set());

    expect(events).toHaveLength(1);
    expect(events[0].deadlineKind).toBe('creditor_objection');
    expect(events[0].milestone).toBe('approaching');
    expect(events[0].recipient).toBe('user-officer');
    expect(events[0].key).toBe(`${APP_ID}:creditor_objection:approaching`);
    expect(events[0].dueAt).toBe(DAS_DUE.toISOString());
  });

  it('does not fire "approaching" more than 7 days out', () => {
    const now = new Date(2026, 5, 10); // 12 days before due
    expect(evaluateCase(dasCase(), now, new Set())).toHaveLength(0);
  });

  it('fires "due_today" when 0 days remain', () => {
    const events = evaluateCase(dasCase(), DAS_DUE, new Set());
    expect(events).toHaveLength(1);
    expect(events[0].milestone).toBe('due_today');
    expect(events[0].notificationType).toBe('action_required');
  });

  it('fires "breached" once the deadline has expired, surfacing onExpiry + citation', () => {
    const now = new Date(2026, 5, 25); // 3 days after due
    const events = evaluateCase(dasCase(), now, new Set());

    expect(events).toHaveLength(1);
    expect(events[0].milestone).toBe('breached');
    expect(events[0].notificationType).toBe('error');
    // Legally literate messaging straight from the statute metadata.
    expect(events[0].body).toContain('deemed to consent');
    expect(events[0].body).toContain('reg.23(5)');
  });

  it('does not re-fire a milestone whose key is already in firedKeys', () => {
    const now = new Date(2026, 5, 25);
    const already = new Set([`${APP_ID}:creditor_objection:breached`]);
    expect(evaluateCase(dasCase(), now, already)).toHaveLength(0);
  });

  it('emits the MAP discharge clock but never a creditor-claims milestone (disapplied)', () => {
    // MAP discharge runs 6 months from 1 June → 1 Dec 2026. Approaching window.
    const now = new Date(2026, 10, 26); // 26 Nov 2026, 5 days before due
    const map = dasCase({ product: 'MAP' });
    const events = evaluateCase(map, now, new Set());

    expect(events.some(e => e.deadlineKind === 'discharge')).toBe(true);
    // s.122 is disapplied for MAP, so there is no creditor-claims clock to fire.
    expect(events.some(e => e.deadlineKind === 'creditor_claims')).toBe(false);
  });

  it('yields no events for an unmodelled product (DPP)', () => {
    const now = new Date(2026, 5, 25);
    expect(evaluateCase(dasCase({ product: 'DPP' }), now, new Set())).toHaveLength(0);
  });
});

describe('SLA engine — summariseCase', () => {
  const base = { product: 'DAS', submittedOn: new Date(2026, 5, 1), debtCount: 2 };

  it('is on_track when every clock is more than a week out', () => {
    const summary = summariseCase(base, new Date(2026, 5, 1));
    expect(summary?.status).toBe('on_track');
    expect(summary?.nextDeadline?.kind).toBe('creditor_objection');
  });

  it('is at_risk when a clock is imminent but not expired', () => {
    const summary = summariseCase(base, new Date(2026, 5, 17));
    expect(summary?.status).toBe('at_risk');
  });

  it('is overdue when a clock has expired', () => {
    const summary = summariseCase(base, new Date(2026, 6, 1));
    expect(summary?.status).toBe('overdue');
    // All DAS clocks expired → still surfaces the earliest as "next".
    expect(summary?.nextDeadline?.kind).toBe('creditor_objection');
  });

  it('returns null for an unmodelled product so no false SLA shows', () => {
    expect(summariseCase({ ...base, product: 'DPP' }, new Date(2026, 6, 1))).toBeNull();
  });
});

describe('SLA engine — OPEN_STATUSES', () => {
  it('covers the live statuses and excludes draft/terminal ones', () => {
    expect(OPEN_STATUSES).toContain('submitted');
    expect(OPEN_STATUSES).toContain('under_review');
    expect(OPEN_STATUSES).toContain('additional_info_required');
    expect(OPEN_STATUSES).toContain('recommendation_issued');
    expect(OPEN_STATUSES).not.toContain('draft');
    expect(OPEN_STATUSES).not.toContain('approved');
    expect(OPEN_STATUSES).not.toContain('rejected');
  });
});
