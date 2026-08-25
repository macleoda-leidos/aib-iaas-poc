import { describe, it, expect } from 'vitest';
import { normaliseProduct, caseClocks } from '../caseClocks';

/**
 * Each case names the provision it checks, so a figure changed by SSI produces a
 * failure that says which instrument needs revisiting.
 *
 * Every date here is a fixed literal — never `new Date()`. A test that reads the
 * wall clock passes or fails depending on the day it runs.
 */
describe('case clocks', () => {
  const APPLIED = new Date(2026, 5, 1); // 1 June 2026

  describe('normaliseProduct', () => {
    it('accepts the short code for every modelled product', () => {
      expect(normaliseProduct('DAS')).toBe('das');
      expect(normaliseProduct('MAP')).toBe('map');
      expect(normaliseProduct('PTD')).toBe('ptd');
      expect(normaliseProduct('Sequestration')).toBe('sequestration');
    });

    it('accepts the long display form the case record also uses', () => {
      expect(normaliseProduct('Debt Arrangement Scheme (DAS)')).toBe('das');
      expect(normaliseProduct('Minimal Asset Process (MAP)')).toBe('map');
      expect(normaliseProduct('Protected Trust Deed (PTD)')).toBe('ptd');
      expect(normaliseProduct('Sequestration (Bankruptcy)')).toBe('sequestration');
    });

    it('is case-insensitive and tolerates surrounding whitespace', () => {
      expect(normaliseProduct('das')).toBe('das');
      expect(normaliseProduct('  Map  ')).toBe('map');
      expect(normaliseProduct('SEQUESTRATION (BANKRUPTCY)')).toBe('sequestration');
    });

    it('returns null for DPP — a product with no deadlines modelled', () => {
      // The case record knows DPP, but clocks.ts models nothing for it. Returning
      // null means a DPP case shows no panel; defaulting to another product would
      // show it a countdown from the wrong statute.
      expect(normaliseProduct('DPP')).toBeNull();
      expect(normaliseProduct('Debt Payment Programme (DPP)')).toBeNull();
    });

    it('returns null for empty and unrecognised input', () => {
      expect(normaliseProduct('')).toBeNull();
      expect(normaliseProduct('   ')).toBeNull();
      expect(normaliseProduct('not a product')).toBeNull();
    });
  });

  describe('DAS — reg.23(5)', () => {
    it('runs a single 21-day objection clock', () => {
      const set = caseClocks({ product: 'das', submittedOn: APPLIED, debtCount: 4 });
      expect(set.clocks).toHaveLength(1);
      expect(set.clocks[0].deadline.due).toEqual(new Date(2026, 5, 22));
      expect(set.clocks[0].deadline.kind).toBe('creditor_objection');
    });

    it('deems consent on expiry where the programme covers more than one debt', () => {
      const set = caseClocks({ product: 'das', submittedOn: APPLIED, debtCount: 4 });
      expect(set.clocks[0].deadline.onExpiry).toContain('deemed to consent');
    });

    it('does NOT deem consent for a single-debt programme', () => {
      // reg.23(5) confines deemed consent to programmes covering more than one
      // debt. The negative assertion is the one that matters: without it a
      // substring match would pass against "No deemed consent" too.
      const set = caseClocks({ product: 'das', submittedOn: APPLIED, debtCount: 1 });
      expect(set.clocks[0].deadline.onExpiry).toContain('No deemed consent');
      expect(set.clocks[0].deadline.onExpiry).not.toContain('are deemed to consent');
    });

    it('deems consent at the two-debt boundary', () => {
      const set = caseClocks({ product: 'das', submittedOn: APPLIED, debtCount: 2 });
      expect(set.clocks[0].deadline.onExpiry).toContain('deemed to consent');
    });

    it('does not deem consent when no debt count is known', () => {
      // Defaulting to deemed consent on absent data would approve a programme on
      // the strength of a figure nobody supplied.
      const set = caseClocks({ product: 'das', submittedOn: APPLIED, debtCount: 0 });
      expect(set.clocks[0].deadline.onExpiry).toContain('No deemed consent');
      const noCount = caseClocks({ product: 'das', submittedOn: APPLIED });
      expect(noCount.clocks[0].deadline.onExpiry).toContain('No deemed consent');
    });

    it('runs none of the sequestration clocks', () => {
      const set = caseClocks({ product: 'das', submittedOn: APPLIED, debtCount: 4 });
      expect(set.clocks.some(c => c.deadline.kind === 'discharge')).toBe(false);
      expect(set.disapplied).toEqual([]);
    });
  });

  describe('PTD — reg.10(2)', () => {
    it('runs a 5-week objection clock', () => {
      const set = caseClocks({ product: 'ptd', submittedOn: APPLIED });
      expect(set.clocks).toHaveLength(1);
      expect(set.clocks[0].deadline.due).toEqual(new Date(2026, 6, 6));
      expect(set.clocks[0].deadline.onExpiry).toContain('majority in number');
    });
  });

  describe('discharge — s.140(1) versus ss.137-138', () => {
    it('discharges MAP at 6 months and sequestration at 12 from the same date', () => {
      // The most important assertion in this file. Conflating the two tells a MAP
      // debtor to wait twice as long as the law requires.
      const map = caseClocks({ product: 'map', submittedOn: APPLIED });
      const seq = caseClocks({ product: 'sequestration', submittedOn: APPLIED });

      const mapDischarge = map.clocks.find(c => c.deadline.kind === 'discharge')!;
      const seqDischarge = seq.clocks.find(c => c.deadline.kind === 'discharge')!;

      expect(mapDischarge.deadline.due).toEqual(new Date(2026, 11, 1)); // 1 Dec 2026
      expect(seqDischarge.deadline.due).toEqual(new Date(2027, 5, 1)); // 1 Jun 2027
      expect(mapDischarge.deadline.due.getTime()).toBeLessThan(seqDischarge.deadline.due.getTime());
    });

    it('records MAP discharge as automatic, citing s.140(1)', () => {
      const set = caseClocks({ product: 'map', submittedOn: APPLIED });
      const discharge = set.clocks.find(c => c.deadline.kind === 'discharge')!;
      expect(discharge.deadline.citation).toContain('s.140(1)');
      expect(discharge.deadline.onExpiry).toContain('automatically');
    });
  });

  describe('MAP — sch.1 para 1(6)', () => {
    const set = caseClocks({ product: 'map', submittedOn: APPLIED });

    it('runs no creditor claims clock', () => {
      expect(set.clocks.some(c => c.deadline.kind === 'creditor_claims')).toBe(false);
    });

    it('states the s.122 disapplication rather than silently omitting it', () => {
      // Silence would be ambiguous — a caseworker cannot tell "no claims period"
      // from "the panel forgot claims". Para 1(2) requires the position be stated.
      expect(set.disapplied).toHaveLength(1);
      expect(set.disapplied[0].citation).toContain('sch.1 para 1(6)');
      expect(set.disapplied[0].reason).toContain('No claims may be submitted');
    });

    it('runs none of the full-administration clocks', () => {
      const kinds = set.clocks.map(c => c.deadline.kind);
      expect(kinds).not.toContain('trustee_proposals');
      expect(kinds).not.toContain('accounting_period_end');
      expect(kinds).not.toContain('late_claims_cutoff');
      expect(kinds).not.toContain('creditor_claims');
    });

    it('runs only the discharge clock', () => {
      expect(set.clocks).toHaveLength(1);
      expect(set.clocks[0].deadline.kind).toBe('discharge');
    });
  });

  describe('sequestration — full administration', () => {
    const set = caseClocks({ product: 'sequestration', submittedOn: APPLIED });
    const kindOf = (kind: string) => set.clocks.find(c => c.deadline.kind === kind)!;

    it('runs all five clocks with nothing disapplied', () => {
      expect(set.clocks).toHaveLength(5);
      expect(set.disapplied).toEqual([]);
    });

    it('sets trustee proposals 12 weeks from award — s.90(2)', () => {
      // 84 days, not 3 calendar months.
      expect(kindOf('trustee_proposals').deadline.due).toEqual(new Date(2026, 7, 24));
    });

    it('sets creditor claims 120 days from the notice — s.122(5)', () => {
      expect(kindOf('creditor_claims').deadline.due).toEqual(new Date(2026, 8, 29));
    });

    it('ends the first accounting period at 12 months — s.130(2)', () => {
      expect(kindOf('accounting_period_end').deadline.due).toEqual(new Date(2027, 5, 1));
    });

    it('closes the late-claim window 8 weeks before that period ends — s.122(6)', () => {
      expect(kindOf('late_claims_cutoff').deadline.due).toEqual(new Date(2027, 3, 6));
    });

    it('does not map clocks whose trigger has not occurred', () => {
      // moratorium, contribution-order effect and discharge effect all run from a
      // notification event absent from the case record. Mapping them would mean
      // inventing the date they run from.
      const kinds = set.clocks.map(c => c.deadline.kind);
      expect(kinds).not.toContain('moratorium_expiry');
      expect(kinds).not.toContain('moratorium_reuse_bar');
      expect(kinds).not.toContain('contribution_order_effective');
      expect(kinds).not.toContain('discharge_effective');
    });
  });

  describe('invariants across every product', () => {
    const sets = [
      caseClocks({ product: 'das', submittedOn: APPLIED, debtCount: 4 }),
      caseClocks({ product: 'ptd', submittedOn: APPLIED }),
      caseClocks({ product: 'map', submittedOn: APPLIED }),
      caseClocks({ product: 'sequestration', submittedOn: APPLIED }),
    ];

    it('cites a provision on every clock', () => {
      for (const set of sets) {
        for (const clock of set.clocks) {
          expect(clock.deadline.citation.length).toBeGreaterThan(0);
        }
      }
    });

    it('states a derivation on every clock', () => {
      // The provenance line is what keeps a modelled trigger from reading as a
      // recorded one.
      for (const set of sets) {
        for (const clock of set.clocks) {
          expect(clock.derivation.length).toBeGreaterThan(0);
        }
      }
    });

    it('has every deadline fall after the date it runs from', () => {
      for (const set of sets) {
        for (const clock of set.clocks) {
          expect(clock.deadline.due.getTime()).toBeGreaterThan(clock.deadline.from.getTime());
        }
      }
    });

    it('returns clocks in ascending order of due date', () => {
      for (const set of sets) {
        const dues = set.clocks.map(c => c.deadline.due.getTime());
        expect(dues).toEqual([...dues].sort((a, b) => a - b));
      }
    });

    it('reports the product it was asked about', () => {
      expect(sets.map(s => s.product)).toEqual(['das', 'ptd', 'map', 'sequestration']);
    });
  });

  describe('date arithmetic through the mapping', () => {
    it('does not drift a day across the BST transition', () => {
      // Clocks go forward on 29 March 2026. Millisecond arithmetic lands an hour
      // short and reports 16 April instead of the 17th.
      const set = caseClocks({ product: 'das', submittedOn: new Date(2026, 2, 27), debtCount: 4 });
      expect(set.clocks[0].deadline.due.getDate()).toBe(17);
      expect(set.clocks[0].deadline.due.getMonth()).toBe(3); // April
    });

    it('clamps a 6-month MAP discharge that would overflow a short month', () => {
      // 31 August + 6 months must be the end of February, not 3 March.
      const set = caseClocks({ product: 'map', submittedOn: new Date(2026, 7, 31) });
      const discharge = set.clocks.find(c => c.deadline.kind === 'discharge')!;
      expect(discharge.deadline.due).toEqual(new Date(2027, 1, 28));
    });
  });
});
