import { describe, it, expect } from 'vitest';
import { buildMiData, DATE_RANGES, type PeriodSlug } from '../miData';

const PERIODS: PeriodSlug[] = ['week', 'month', 'quarter', 'year'];

/** "1,234" / "94%" -> 1234 / 94, so KPI strings can be compared numerically. */
function kpiNumber(value: string): number {
  return Number(value.replace(/[,%]/g, ''));
}

function kpi(data: ReturnType<typeof buildMiData>, label: string): string {
  const found = data.kpis.find((k) => k.label === label);
  if (!found) throw new Error(`No KPI labelled "${label}"`);
  return found.value;
}

describe('buildMiData — period selection', () => {
  it('supports every period offered by the date-range picker', () => {
    // Guards against a slug being added to the picker with no baseline behind
    // it, which would render the whole page as undefined.
    for (const range of DATE_RANGES) {
      expect(() => buildMiData(range.slug)).not.toThrow();
      expect(buildMiData(range.slug).kpis).toHaveLength(4);
    }
  });

  it('produces a different application count for each period', () => {
    const counts = PERIODS.map((p) => kpiNumber(kpi(buildMiData(p), 'Applications Received')));

    // All four distinct — if the period argument were ignored (the bug this
    // guards), every entry would be identical.
    expect(new Set(counts).size).toBe(4);
  });

  it('scales volume monotonically as the period lengthens', () => {
    const [week, month, quarter, year] = PERIODS.map((p) => buildMiData(p));

    const apps = (d: typeof week) => kpiNumber(kpi(d, 'Applications Received'));
    expect(apps(week)).toBeLessThan(apps(month));
    expect(apps(month)).toBeLessThan(apps(quarter));
    expect(apps(quarter)).toBeLessThan(apps(year));
  });

  it('gives each period its own comparator label', () => {
    const comparators = PERIODS.map((p) => buildMiData(p).comparator);

    expect(comparators).toEqual(['last week', 'last month', 'last quarter', 'last year']);
    expect(new Set(comparators).size).toBe(4);
  });

  it('varies SLA compliance and satisfaction across periods, not just volume', () => {
    const slas = PERIODS.map((p) => buildMiData(p).slaCompliance);
    const satisfaction = PERIODS.map((p) => buildMiData(p).satisfaction);

    expect(new Set(slas).size).toBeGreaterThan(1);
    expect(new Set(satisfaction).size).toBeGreaterThan(1);
  });

  it('uses the week-specific processing averages only for the week period', () => {
    const week = buildMiData('week');
    const month = buildMiData('month');

    const dasWeek = week.productPerformance.find((p) => p.product === 'DAS')!;
    const dasMonth = month.productPerformance.find((p) => p.product === 'DAS')!;

    // Longer periods use the long-run average, which is the higher figure.
    expect(dasWeek.avgDays).not.toBe(dasMonth.avgDays);
    expect(dasWeek.avgDays).toBeLessThan(dasMonth.avgDays);
  });
});

describe('buildMiData — determinism', () => {
  it('returns identical figures on repeated calls for the same period', () => {
    for (const period of PERIODS) {
      expect(buildMiData(period)).toEqual(buildMiData(period));
    }
  });

  it('is not affected by having been called for another period in between', () => {
    // The builder mutates the arrays it derives (rounding-remainder fix-up), so
    // this catches accidental mutation of the shared module-level mixes.
    const first = buildMiData('month');
    buildMiData('year');
    buildMiData('week');
    const second = buildMiData('month');

    expect(second).toEqual(first);
  });

  it('hands out fresh objects, so a caller mutating a row cannot poison later calls', () => {
    const first = buildMiData('quarter');
    first.productPerformance[0].cases = -999;
    first.staffPerformance[0].decisions = -999;
    first.slaBreaches[0].daysOver = -999;

    const second = buildMiData('quarter');
    expect(second.productPerformance[0].cases).toBeGreaterThan(0);
    expect(second.staffPerformance[0].decisions).toBeGreaterThan(0);
    expect(second.slaBreaches[0].daysOver).toBeGreaterThan(0);
  });
});

describe('buildMiData — table/KPI reconciliation', () => {
  it('product case counts sum exactly to the Applications Received headline', () => {
    for (const period of PERIODS) {
      const data = buildMiData(period);
      const total = data.productPerformance.reduce((s, p) => s + p.cases, 0);

      // Apportioning by share then rounding loses/gains a case; the remainder
      // fix-up must make the column tie back to the KPI exactly.
      expect(total).toBe(kpiNumber(kpi(data, 'Applications Received')));
    }
  });

  it('staff decision counts sum exactly to the Decisions Made headline', () => {
    for (const period of PERIODS) {
      const data = buildMiData(period);
      const total = data.staffPerformance.reduce((s, r) => s + r.decisions, 0);

      expect(total).toBe(kpiNumber(kpi(data, 'Decisions Made')));
    }
  });

  it('never reports more decisions than applications received', () => {
    for (const period of PERIODS) {
      const data = buildMiData(period);
      expect(kpiNumber(kpi(data, 'Decisions Made')))
        .toBeLessThanOrEqual(kpiNumber(kpi(data, 'Applications Received')));
    }
  });

  it('keeps every apportioned row positive (no zero/negative rows from rounding)', () => {
    for (const period of PERIODS) {
      const data = buildMiData(period);
      for (const row of data.productPerformance) expect(row.cases).toBeGreaterThan(0);
      for (const row of data.staffPerformance) expect(row.decisions).toBeGreaterThan(0);
    }
  });

  it('avgProcessingDays is the case-weighted mean of the product rows', () => {
    for (const period of PERIODS) {
      const data = buildMiData(period);
      const totalCases = data.productPerformance.reduce((s, p) => s + p.cases, 0);
      const expected =
        data.productPerformance.reduce((s, p) => s + p.avgDays * p.cases, 0) / totalCases;

      expect(Number(data.avgProcessingDays)).toBeCloseTo(expected, 1);
    }
  });

  it('formats avgProcessingDays to one decimal place so it renders as "N.N days"', () => {
    for (const period of PERIODS) {
      expect(buildMiData(period).avgProcessingDays).toMatch(/^\d+\.\d$/);
    }
  });

  it('avgProcessingDays sits within the range of the product averages', () => {
    for (const period of PERIODS) {
      const data = buildMiData(period);
      const days = data.productPerformance.map((p) => p.avgDays);
      const mean = Number(data.avgProcessingDays);

      // A weighted mean can never fall outside the min/max of its inputs.
      expect(mean).toBeGreaterThanOrEqual(Math.min(...days));
      expect(mean).toBeLessThanOrEqual(Math.max(...days));
    }
  });

  it('lists a breach row count matching the period baseline, growing with period length', () => {
    const counts = PERIODS.map((p) => buildMiData(p).slaBreaches.length);

    expect(counts).toEqual([2, 3, 4, 5]);
    // Every breach must be a real pool entry, not undefined from over-slicing.
    for (const period of PERIODS) {
      for (const breach of buildMiData(period).slaBreaches) {
        expect(breach.ref).toMatch(/^IAAS-\d{4}-\d{5}$/);
        expect(breach.daysOver).toBeGreaterThan(0);
      }
    }
  });

  it('attributes every SLA breach to an officer who appears in the staff table', () => {
    for (const period of PERIODS) {
      const data = buildMiData(period);
      const officers = data.staffPerformance.map((s) => s.name);

      for (const breach of data.slaBreaches) {
        expect(officers).toContain(breach.assignee);
      }
    }
  });

  it('attributes every SLA breach to a product that appears in the product table', () => {
    for (const period of PERIODS) {
      const data = buildMiData(period);
      const products = data.productPerformance.map((p) => p.product);

      for (const breach of data.slaBreaches) {
        expect(products).toContain(breach.product);
      }
    }
  });

  it('exposes percentage KPIs as plausible percentages', () => {
    for (const period of PERIODS) {
      const data = buildMiData(period);

      for (const label of ['SLA Compliance', 'Staff Utilisation']) {
        const raw = kpi(data, label);
        expect(raw).toMatch(/^\d+%$/);
        const value = kpiNumber(raw);
        expect(value).toBeGreaterThan(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it('SLA compliance KPI agrees with the numeric slaCompliance field', () => {
    for (const period of PERIODS) {
      const data = buildMiData(period);
      // The page renders the KPI card from one and the trend arrow from the
      // other; if they disagree the card contradicts itself.
      expect(kpi(data, 'SLA Compliance')).toBe(`${data.slaCompliance}%`);
    }
  });

  it('SLA trend direction matches the movement from priorSla to slaCompliance', () => {
    for (const period of PERIODS) {
      const data = buildMiData(period);
      const improved = data.slaCompliance >= data.priorSla;

      // A "+3%" badge next to a figure that actually fell would be a reporting
      // error, and this is exactly the kind of hand-tuned table that drifts.
      expect(data.trends.sla.startsWith(improved ? '+' : '-')).toBe(true);
    }
  });

  it('gives every KPI a label, a value and a trend badge', () => {
    for (const period of PERIODS) {
      for (const k of buildMiData(period).kpis) {
        expect(k.label).toBeTruthy();
        expect(k.value).toBeTruthy();
        expect(k.trend).toMatch(/^[+-]\d+%$/);
        expect(k.icon).toBeTruthy();
      }
    }
  });

  it('thousand-separates large headline figures', () => {
    // 2,350 must not render as "2350" in the KPI card.
    expect(kpi(buildMiData('year'), 'Applications Received')).toBe('2,350');
    expect(kpi(buildMiData('week'), 'Applications Received')).toBe('47');
  });
});
