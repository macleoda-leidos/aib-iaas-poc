'use client';

import { useState, useEffect, useMemo } from 'react';
import { caseClocks, normaliseProduct, describeDeadline, type CaseClock } from '@aib-iaas/statutory';

/**
 * Live statutory deadline countdowns for a case.
 *
 * The figures come from `@aib-iaas/statutory`, so each row carries the provision
 * it arises from and a caseworker challenged on a date has the citation to hand.
 *
 * Every row also states how its trigger date was derived. Only the application
 * date is recorded on a case — there is no award date, registration date or
 * s.44(3) notice date anywhere in the record — so the other triggers are modelled
 * from it. Showing that provenance is the difference between decision support and
 * a figure that looks recorded but is not.
 */

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Parse the case record's date format: '29 Jun 2026'.
 *
 * Tokenised against a month table rather than handed to `new Date(string)`, which
 * is only required to parse ISO 8601 — anything else is implementation-defined and
 * varies by engine. Returns null on anything unparseable so the caller can render
 * nothing rather than a countdown to an Invalid Date.
 */
function parseCaseDate(value: string): Date | null {
  const parts = value.trim().split(/\s+/);
  if (parts.length !== 3) return null;

  const day = Number(parts[0]);
  const month = MONTHS[parts[1].slice(0, 3).toLowerCase()];
  const year = Number(parts[2]);

  if (!Number.isInteger(day) || day < 1 || day > 31) return null;
  if (month === undefined) return null;
  if (!Number.isInteger(year) || year < 1900) return null;

  const parsed = new Date(year, month, day);
  // Rejects a day that overflowed its month — 31 Feb rolls into March.
  if (parsed.getMonth() !== month || parsed.getDate() !== day) return null;
  return parsed;
}

// Light/dark pairs per urgency, matching the vocabulary the rest of the case page
// already uses for risk: red for expired, amber for imminent, green otherwise.
const ROW_STYLES: Record<string, string> = {
  expired: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
  imminent: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
  live: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800',
};

const TEXT_STYLES: Record<string, string> = {
  expired: 'text-red-700 dark:text-red-400',
  imminent: 'text-amber-700 dark:text-amber-400',
  live: 'text-green-700 dark:text-green-400',
};

const BADGE_STYLES: Record<string, string> = {
  expired: 'bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-200',
  imminent: 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200',
  live: 'bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-200',
};

type Urgency = 'expired' | 'imminent' | 'live';

function urgencyOf(expired: boolean, imminent: boolean): Urgency {
  if (expired) return 'expired';
  if (imminent) return 'imminent';
  return 'live';
}

/** Countdown text. A deadline is live all day on its due date, so 0 is "today". */
function countdownLabel(daysRemaining: number): string {
  if (daysRemaining === 0) return 'Due today';
  if (daysRemaining === 1) return '1 day remaining';
  if (daysRemaining > 0) return `${daysRemaining} days remaining`;
  if (daysRemaining === -1) return 'Expired yesterday';
  return `Expired ${Math.abs(daysRemaining)} days ago`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface StatutoryDeadlinesProps {
  product: string;
  /** The case record's submission date, e.g. '29 Jun 2026'. */
  submittedAt: string;
  /** Debts in the programme — decides DAS deemed consent under reg.23(5). */
  debtCount: number;
  caseRef: string;
  /**
   * Fixed "now", injected by tests so a render is reproducible. Defaults to the
   * wall clock. When supplied, the ticking interval is not started.
   */
  now?: Date;
}

export default function StatutoryDeadlines({
  product,
  submittedAt,
  debtCount,
  caseRef,
  now,
}: StatutoryDeadlinesProps) {
  // Initialised from the prop when given, so the first render is already
  // deterministic — reading Date.now() in the render body would make the output
  // depend on when it ran.
  const [tick, setTick] = useState<Date>(() => now ?? new Date());

  useEffect(() => {
    // An injected date never ticks: a test that pinned "now" must stay pinned.
    if (now) return;

    // A plain interval, deliberately not useVisiblePolling. That hook exists to
    // stop background tabs spending the shared per-IP rate-limit budget on
    // network requests; a deadline tick issues no request. It also fires its
    // callback on mount and on every visibility change, which would make renders
    // depend on document.hidden.
    //
    // 60 seconds because describeDeadline compares at day granularity — a faster
    // interval re-renders without changing a digit.
    const id = setInterval(() => setTick(new Date()), 60_000);
    return () => clearInterval(id);
  }, [now]);

  const clockSet = useMemo(() => {
    const normalised = normaliseProduct(product);
    if (!normalised) return null;

    const submittedOn = parseCaseDate(submittedAt);
    if (!submittedOn) return null;

    return caseClocks({ product: normalised, submittedOn, debtCount });
  }, [product, submittedAt, debtCount]);

  // An unmodelled product (DPP has no deadlines in statute we model) or an
  // unparseable date renders nothing rather than guessing at a countdown.
  if (!clockSet) return null;

  return (
    <div data-demo="case-statutory-deadlines" className="space-y-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Statutory deadlines running on {caseRef}, computed from the legislation and updated live. Each
        row cites the provision it arises from.
      </p>

      <div className="space-y-2">
        {clockSet.clocks.map((clock: CaseClock) => {
          const { daysRemaining, expired, imminent } = describeDeadline(clock.deadline, tick);
          const urgency = urgencyOf(expired, imminent);

          return (
            <div
              key={clock.deadline.kind}
              data-demo={`case-statutory-deadline-${clock.deadline.kind}`}
              className={`border rounded p-3 ${ROW_STYLES[urgency]}`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className={`text-sm font-bold ${TEXT_STYLES[urgency]}`}>{clock.deadline.label}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Due {formatDate(clock.deadline.due)}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${BADGE_STYLES[urgency]}`}>
                  {countdownLabel(daysRemaining)}
                </span>
              </div>

              {/* The legally interesting field: what expiry itself causes, where
                  silence has effect. */}
              {clock.deadline.onExpiry && (
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-2">
                  <span className="font-bold">On expiry: </span>
                  {clock.deadline.onExpiry}
                </p>
              )}

              <p className="text-xs font-mono text-gray-500 dark:text-gray-500 mt-2">
                {clock.deadline.citation}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                Basis: {clock.derivation}
              </p>
            </div>
          );
        })}
      </div>

      {/* Deadlines that do NOT run for this product, stated rather than omitted —
          silence cannot distinguish "no such period" from "panel forgot it". */}
      {clockSet.disapplied.map((entry) => (
        <div
          key={entry.citation}
          className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded p-3"
        >
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{entry.label}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{entry.reason}</p>
          <p className="text-xs font-mono text-gray-500 dark:text-gray-500 mt-2">{entry.citation}</p>
        </div>
      ))}
    </div>
  );
}
