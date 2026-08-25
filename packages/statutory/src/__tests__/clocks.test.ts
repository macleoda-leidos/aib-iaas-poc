import { describe, it, expect } from 'vitest';
import {
  addDays,
  addMonths,
  dasCreditorObjection,
  ptdObjectionPeriod,
  dischargeDeadlines,
  dischargeEffectiveFrom,
  trusteeProposalsDue,
  contributionOrderEffectiveFrom,
  creditorClaimsDue,
  lateClaimCutoff,
  accountingPeriodEnd,
  moratoriumDeadlines,
  describeDeadline,
} from '../clocks';

/**
 * Each case names the provision it checks. If a figure changes by SSI, the
 * failing test should say which instrument needs revisiting.
 */
describe('statutory clocks', () => {
  describe('date arithmetic', () => {
    it('adds days across the BST transition without drifting a day', () => {
      // Clocks go forward on 29 March 2026. Adding 86_400_000 ms per day across
      // that boundary lands an hour short and can report the previous date.
      const before = new Date(2026, 2, 27);
      expect(addDays(before, 7).getDate()).toBe(3);
      expect(addDays(before, 7).getMonth()).toBe(3); // April
    });

    it('clamps a month addition that would overflow a short month', () => {
      // 31 January + 1 month must be the end of February, not 2/3 March.
      const jan31 = new Date(2026, 0, 31);
      const result = addMonths(jan31, 1);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28);
    });

    it('handles a leap year February', () => {
      const jan31 = new Date(2028, 0, 31);
      expect(addMonths(jan31, 1).getDate()).toBe(29);
    });
  });

  describe('DAS creditor objection — reg.23(5)', () => {
    it('runs for 21 days', () => {
      const requested = new Date(2026, 5, 1);
      const deadline = dasCreditorObjection(requested, 3);
      expect(deadline.due).toEqual(new Date(2026, 5, 22));
    });

    it('deems consent on expiry for a multi-debt programme', () => {
      const deadline = dasCreditorObjection(new Date(2026, 5, 1), 3);
      expect(deadline.onExpiry).toContain('deemed to consent');
    });

    it('does NOT deem consent for a single-debt programme', () => {
      // reg.23(5) confines deemed consent to programmes for more than one debt.
      // Treating silence as consent here would approve a programme no creditor
      // agreed to.
      const deadline = dasCreditorObjection(new Date(2026, 5, 1), 1);
      expect(deadline.onExpiry).toContain('No deemed consent');
      expect(deadline.onExpiry).not.toContain('are deemed to consent');
    });
  });

  describe('PTD objection — reg.2 / reg.10(2)', () => {
    it('runs 5 weeks from registration', () => {
      const registered = new Date(2026, 5, 1);
      expect(ptdObjectionPeriod(registered).due).toEqual(new Date(2026, 6, 6));
    });

    it('records both objection thresholds on expiry', () => {
      const deadline = ptdObjectionPeriod(new Date(2026, 5, 1));
      expect(deadline.onExpiry).toContain('majority in number');
      expect(deadline.onExpiry).toContain('one third in value');
    });
  });

  describe('discharge', () => {
    it('discharges MAP automatically at 6 months — s.140(1)', () => {
      const awarded = new Date(2026, 0, 15);
      const [deadline] = dischargeDeadlines(awarded, 'map');
      expect(deadline.due).toEqual(new Date(2026, 6, 15));
      expect(deadline.citation).toContain('s.140(1)');
      expect(deadline.onExpiry).toContain('automatically');
    });

    it('makes full administration discharge available at 12 months — ss.137-138', () => {
      const awarded = new Date(2026, 0, 15);
      const [deadline] = dischargeDeadlines(awarded, 'sequestration');
      expect(deadline.due).toEqual(new Date(2027, 0, 15));
    });

    it('does not attach a 14-day effect delay to MAP', () => {
      // The 14-day rule is ss.137-138 only. MAP discharge under s.140(1) is
      // automatic, so surfacing a delay would overstate the wait.
      const deadlines = dischargeDeadlines(new Date(2026, 0, 15), 'map');
      expect(deadlines.some(d => d.kind === 'discharge_effective')).toBe(false);
    });

    it('delays discharge effect by 14 days from notification — ss.137-138', () => {
      const notified = new Date(2027, 0, 20);
      expect(dischargeEffectiveFrom(notified).due).toEqual(new Date(2027, 1, 3));
    });
  });

  describe('contribution orders', () => {
    it('requires trustee proposals within 12 weeks of award — s.90(2)', () => {
      const awarded = new Date(2026, 0, 1);
      // 12 weeks = 84 days, not 3 calendar months.
      expect(trusteeProposalsDue(awarded).due).toEqual(new Date(2026, 2, 26));
    });

    it('delays a DCO taking effect by 14 days — s.90(9)', () => {
      const notified = new Date(2026, 3, 1);
      expect(contributionOrderEffectiveFrom(notified).due).toEqual(new Date(2026, 3, 15));
    });
  });

  describe('creditor claims — s.122', () => {
    it('falls due 120 days after notice', () => {
      const notice = new Date(2026, 0, 1);
      expect(creditorClaimsDue(notice, 'sequestration')!.due).toEqual(new Date(2026, 4, 1));
    });

    it('does not apply to MAP at all', () => {
      // Schedule 1 para 1(6) disapplies s.122 for MAP, and para 1(2) requires AiB
      // to state no claims may be submitted. A countdown would invite creditors
      // into a process that does not exist for this product.
      expect(creditorClaimsDue(new Date(2026, 0, 1), 'map')).toBeNull();
    });

    it('closes the late-claim window 8 weeks before the accounting period ends', () => {
      const periodEnd = new Date(2026, 11, 31);
      expect(lateClaimCutoff(periodEnd).due).toEqual(new Date(2026, 10, 5));
    });
  });

  describe('accounting period — s.130(2)', () => {
    it('runs 12 months from the award', () => {
      const awarded = new Date(2026, 5, 10);
      expect(accountingPeriodEnd(awarded).due).toEqual(new Date(2027, 5, 10));
    });
  });

  describe('moratorium — ss.195(2), 198(1)(b)(i)', () => {
    it('protects for 6 months from the register entry', () => {
      const registered = new Date(2026, 2, 1);
      const expiry = moratoriumDeadlines(registered).find(d => d.kind === 'moratorium_expiry')!;
      expect(expiry.due).toEqual(new Date(2026, 8, 1));
    });

    it('bars a further notice for 12 months — outlasting the protection', () => {
      // The reuse bar runs from the same trigger as the protection, so it extends
      // six months beyond it. Debtors routinely assume they can reapply the day
      // protection lapses.
      const registered = new Date(2026, 2, 1);
      const bar = moratoriumDeadlines(registered).find(d => d.kind === 'moratorium_reuse_bar')!;
      expect(bar.due).toEqual(new Date(2027, 2, 1));

      const expiry = moratoriumDeadlines(registered).find(d => d.kind === 'moratorium_expiry')!;
      expect(bar.due.getTime()).toBeGreaterThan(expiry.due.getTime());
    });
  });

  describe('describeDeadline', () => {
    const deadline = dasCreditorObjection(new Date(2026, 5, 1), 3); // due 22 June

    it('counts days remaining', () => {
      expect(describeDeadline(deadline, new Date(2026, 5, 15)).daysRemaining).toBe(7);
    });

    it('is not expired on the due date itself', () => {
      // Statutory periods are counted in days, so a deadline is live all day.
      const status = describeDeadline(deadline, new Date(2026, 5, 22));
      expect(status.daysRemaining).toBe(0);
      expect(status.expired).toBe(false);
    });

    it('expires the day after', () => {
      expect(describeDeadline(deadline, new Date(2026, 5, 23)).expired).toBe(true);
    });

    it('ignores the time of day', () => {
      // A deadline at 09:00 has not passed at 14:00 the day before.
      const morning = describeDeadline(deadline, new Date(2026, 5, 21, 9, 0));
      const evening = describeDeadline(deadline, new Date(2026, 5, 21, 23, 30));
      expect(morning.daysRemaining).toBe(evening.daysRemaining);
    });

    it('flags a deadline within a week as imminent', () => {
      expect(describeDeadline(deadline, new Date(2026, 5, 16)).imminent).toBe(true);
      expect(describeDeadline(deadline, new Date(2026, 5, 10)).imminent).toBe(false);
    });

    it('does not flag an expired deadline as imminent', () => {
      const status = describeDeadline(deadline, new Date(2026, 6, 1));
      expect(status.expired).toBe(true);
      expect(status.imminent).toBe(false);
    });
  });
});
