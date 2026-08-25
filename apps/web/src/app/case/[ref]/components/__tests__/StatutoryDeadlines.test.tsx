import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  dasCreditorObjection,
  ptdObjectionPeriod,
  dischargeDeadlines,
  creditorClaimsDue,
} from '@aib-iaas/statutory';
import StatutoryDeadlines from '../StatutoryDeadlines';

/**
 * Every render here injects `now`, so the countdowns are reproducible: a test that
 * lets the component read the wall clock passes or fails depending on the day it
 * runs. The ticking behaviour is exercised in its own describe at the bottom, which
 * is the only place fake timers are installed.
 *
 * Citations are asserted against the module value rather than a hardcoded string.
 * These figures move by Scottish statutory instrument, so a copied string would
 * leave the test passing against a component showing a superseded provision.
 *
 * No afterEach(cleanup) here — apps/web/src/test/setup.ts registers it at setup
 * time deliberately, because doing it inside afterEach deadlocks under fake timers.
 */

// 29 Jun 2026, the submission date on IAAS-2026-00012.
const SUBMITTED = '29 Jun 2026';
const SUBMITTED_ON = new Date(2026, 5, 29);

function renderDas(now: Date, debtCount = 4) {
  return render(
    <StatutoryDeadlines
      product="DAS"
      submittedAt={SUBMITTED}
      debtCount={debtCount}
      caseRef="IAAS-2026-00012"
      now={now}
    />
  );
}

describe('StatutoryDeadlines', () => {
  describe('DAS — reg.23(5)', () => {
    it('shows the 21-day objection window with its citation', () => {
      renderDas(new Date(2026, 6, 1));

      expect(screen.getByText('DAS creditor objection period')).toBeTruthy();
      // 29 Jun + 21 days = 20 Jul 2026.
      expect(screen.getByText(/Due 20 July 2026/)).toBeTruthy();
      expect(screen.getByText(dasCreditorObjection(SUBMITTED_ON, 4).citation)).toBeTruthy();
    });

    it('states deemed consent for a multi-debt programme', () => {
      renderDas(new Date(2026, 6, 1));
      expect(screen.getByText(/deemed to consent/)).toBeTruthy();
    });

    it('states that a single-debt programme gets no deemed consent', () => {
      renderDas(new Date(2026, 6, 1), 1);
      expect(screen.getByText(/No deemed consent/)).toBeTruthy();
    });

    it('shows the provenance of the trigger date', () => {
      renderDas(new Date(2026, 6, 1));
      expect(screen.getByText(/Basis:/)).toBeTruthy();
    });
  });

  describe('MAP — s.140(1) and sch.1 para 1(6)', () => {
    function renderMap(now = new Date(2026, 6, 1)) {
      return render(
        <StatutoryDeadlines
          product="Minimal Asset Process (MAP)"
          submittedAt={SUBMITTED}
          debtCount={4}
          caseRef="IAAS-2026-00011"
          now={now}
        />
      );
    }

    it('shows automatic discharge at 6 months', () => {
      renderMap();
      // 29 Jun 2026 + 6 months = 29 Dec 2026, NOT the 12 months a full
      // administration would get.
      expect(screen.getByText(/Due 29 December 2026/)).toBeTruthy();
      expect(screen.getByText(dischargeDeadlines(SUBMITTED_ON, 'map')[0].citation)).toBeTruthy();
    });

    it('states the s.122 disapplication', () => {
      renderMap();
      expect(screen.getByText(/No claims may be submitted/)).toBeTruthy();
      expect(screen.getByText(/sch.1 para 1\(6\)/)).toBeTruthy();
    });

    it('shows no creditor claims countdown', () => {
      renderMap();
      // creditorClaimsDue returns null for MAP, so the label must not appear at
      // all — a countdown here would invite creditors into a process that does
      // not exist for this product.
      expect(screen.queryByText('Creditor claims deadline')).toBeNull();
    });

    it('shows the provenance of the modelled award date', () => {
      renderMap();
      expect(screen.getByText(/No award date is recorded on this case/)).toBeTruthy();
    });
  });

  describe('sequestration — full administration', () => {
    function renderSeq(now = new Date(2026, 6, 1)) {
      return render(
        <StatutoryDeadlines
          product="Sequestration"
          submittedAt={SUBMITTED}
          debtCount={3}
          caseRef="IAAS-2026-00009"
          now={now}
        />
      );
    }

    it('shows all five clocks', () => {
      const { container } = renderSeq();
      expect(container.querySelectorAll('[data-demo^="case-statutory-deadline-"]')).toHaveLength(5);
    });

    it('makes discharge available at 12 months, not 6', () => {
      const { container } = renderSeq();
      // 29 Jun 2026 + 12 months. Conflating this with MAP's 6 months would tell a
      // debtor the wrong date by half a year.
      //
      // Scoped to the discharge row: the accounting period also ends 12 months
      // from award under s.130(2), so an unscoped query matches both.
      const row = container.querySelector('[data-demo="case-statutory-deadline-discharge"]')!;
      expect(row.textContent).toContain('Due 29 June 2027');
    });

    it('shows the creditor claims deadline with its citation', () => {
      renderSeq();
      expect(screen.getByText('Creditor claims deadline')).toBeTruthy();
      expect(
        screen.getByText(creditorClaimsDue(SUBMITTED_ON, 'sequestration')!.citation)
      ).toBeTruthy();
    });

    it('states nothing as disapplied', () => {
      renderSeq();
      expect(screen.queryByText(/No claims may be submitted/)).toBeNull();
    });

    it('shows the provenance of the trigger date', () => {
      renderSeq();
      expect(screen.getAllByText(/Basis:/).length).toBeGreaterThan(0);
    });
  });

  describe('PTD — reg.10(2)', () => {
    function renderPtd() {
      return render(
        <StatutoryDeadlines
          product="Protected Trust Deed (PTD)"
          submittedAt={SUBMITTED}
          debtCount={3}
          caseRef="IAAS-2026-00010"
          now={new Date(2026, 6, 1)}
        />
      );
    }

    it('shows the 5-week objection window with its citation', () => {
      renderPtd();
      expect(screen.getByText('PTD creditor objection period')).toBeTruthy();
      // 29 Jun + 35 days = 3 Aug 2026.
      expect(screen.getByText(/Due 3 August 2026/)).toBeTruthy();
      expect(screen.getByText(ptdObjectionPeriod(SUBMITTED_ON).citation)).toBeTruthy();
    });

    it('shows the provenance of the modelled registration date', () => {
      renderPtd();
      expect(screen.getByText(/registration date is not recorded/)).toBeTruthy();
    });
  });

  describe('urgency colours, driven purely by the injected date', () => {
    // The DAS objection on this case is due 20 July 2026.
    const styleOf = (container: HTMLElement) =>
      container.querySelector('[data-demo="case-statutory-deadline-creditor_objection"]')!.className;

    it('is amber with exactly 7 days remaining', () => {
      const { container } = renderDas(new Date(2026, 6, 13));
      expect(screen.getByText('7 days remaining')).toBeTruthy();
      expect(styleOf(container)).toContain('amber');
    });

    it('is green with 8 days remaining', () => {
      const { container } = renderDas(new Date(2026, 6, 12));
      expect(screen.getByText('8 days remaining')).toBeTruthy();
      expect(styleOf(container)).toContain('green');
    });

    it('is not expired on the due date itself', () => {
      // Statutory periods are counted in days, so the deadline is live all day.
      const { container } = renderDas(new Date(2026, 6, 20));
      expect(screen.getByText('Due today')).toBeTruthy();
      expect(styleOf(container)).not.toContain('red');
      expect(styleOf(container)).toContain('amber');
    });

    it('is red the day after', () => {
      const { container } = renderDas(new Date(2026, 6, 21));
      expect(screen.getByText('Expired yesterday')).toBeTruthy();
      expect(styleOf(container)).toContain('red');
    });

    it('counts the days since a longer-expired deadline', () => {
      renderDas(new Date(2026, 6, 25));
      expect(screen.getByText('Expired 5 days ago')).toBeTruthy();
    });

    it('reads "1 day remaining" in the singular', () => {
      renderDas(new Date(2026, 6, 19));
      expect(screen.getByText('1 day remaining')).toBeTruthy();
    });
  });

  describe('unmodelled input renders nothing rather than guessing', () => {
    it('renders nothing for DPP', () => {
      // PROCESSING_TIMES knows DPP but clocks.ts models no deadlines for it, so a
      // panel here could only show a countdown from the wrong statute.
      const { container } = render(
        <StatutoryDeadlines
          product="DPP"
          submittedAt={SUBMITTED}
          debtCount={2}
          caseRef="IAAS-2026-00008"
          now={new Date(2026, 6, 1)}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing for an unparseable submission date', () => {
      const { container } = render(
        <StatutoryDeadlines
          product="DAS"
          submittedAt="not a date"
          debtCount={4}
          caseRef="IAAS-2026-00012"
          now={new Date(2026, 6, 1)}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing for a date that overflows its month', () => {
      const { container } = render(
        <StatutoryDeadlines
          product="DAS"
          submittedAt="31 Feb 2026"
          debtCount={4}
          caseRef="IAAS-2026-00012"
          now={new Date(2026, 6, 1)}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('demo hooks', () => {
    it('puts both hooks in the DOM', () => {
      // demoSelectors.test.ts checks the source text; this checks they survive to
      // the rendered markup.
      const { container } = renderDas(new Date(2026, 6, 1));
      expect(container.querySelector('[data-demo="case-statutory-deadlines"]')).toBeTruthy();
      expect(
        container.querySelector('[data-demo="case-statutory-deadline-creditor_objection"]')
      ).toBeTruthy();
    });
  });

  describe('ticking', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('recomputes the countdown as time passes when no date is injected', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 6, 12)); // 8 days out

      render(
        <StatutoryDeadlines
          product="DAS"
          submittedAt={SUBMITTED}
          debtCount={4}
          caseRef="IAAS-2026-00012"
        />
      );
      expect(screen.getByText('8 days remaining')).toBeTruthy();

      // A day plus one interval period, so the 60s tick fires on the new date.
      act(() => {
        vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 60_000);
      });

      expect(screen.getByText('7 days remaining')).toBeTruthy();
    });

    it('never ticks when a date is injected', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 6, 12));

      renderDas(new Date(2026, 6, 1)); // 19 days out
      expect(screen.getByText('19 days remaining')).toBeTruthy();

      act(() => {
        vi.advanceTimersByTime(10 * 60_000);
      });

      // Pinned: the injected date must survive any amount of elapsed time.
      expect(screen.getByText('19 days remaining')).toBeTruthy();
    });

    it('clears its interval on unmount', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 6, 12));
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { unmount } = render(
        <StatutoryDeadlines
          product="DAS"
          submittedAt={SUBMITTED}
          debtCount={4}
          caseRef="IAAS-2026-00012"
        />
      );
      unmount();

      act(() => {
        vi.advanceTimersByTime(5 * 60_000);
      });

      // A surviving interval would setState on an unmounted component.
      expect(errors).not.toHaveBeenCalled();
      errors.mockRestore();
    });
  });
});
