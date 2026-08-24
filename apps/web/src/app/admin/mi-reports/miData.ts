// Management-information figures for the admin MI reports page.
//
// Extracted out of page.tsx deliberately: this is a Next.js App Router page
// file, and Next only permits a specific set of named exports from those
// (metadata, generateMetadata, dynamic, revalidate, ...). Exporting buildMiData
// from page.tsx to make it testable fails the build/typecheck, so the data
// builder lives here and the page imports it.

export const DATE_RANGES = [
  { slug: 'week', label: 'This Week' },
  { slug: 'month', label: 'This Month' },
  { slug: 'quarter', label: 'This Quarter' },
  { slug: 'year', label: 'This Year' },
] as const;

export type PeriodSlug = typeof DATE_RANGES[number]['slug'];

// Per-period baselines. Longer periods average out the good and bad weeks, so
// compliance and satisfaction drift down slightly while volume scales up — the
// figures are hand-tuned rather than derived so no two metrics move in lockstep.
const PERIOD_BASELINES: Record<PeriodSlug, {
  applications: number;
  decisions: number;
  slaCompliance: number;
  staffUtilisation: number;
  breachCount: number;
  comparator: string;
  trends: { applications: string; decisions: string; sla: string; utilisation: string };
  processingDelta: string;
  satisfaction: string;
  priorSla: number;
}> = {
  week: {
    applications: 47, decisions: 38, slaCompliance: 96, staffUtilisation: 79, breachCount: 2,
    comparator: 'last week',
    trends: { applications: '+12%', decisions: '+8%', sla: '+3%', utilisation: '+5%' },
    processingDelta: '-0.4 days', satisfaction: '4.4/5', priorSla: 93,
  },
  month: {
    applications: 188, decisions: 164, slaCompliance: 94, staffUtilisation: 82, breachCount: 3,
    comparator: 'last month',
    trends: { applications: '+9%', decisions: '+11%', sla: '+2%', utilisation: '+4%' },
    processingDelta: '-0.8 days', satisfaction: '4.3/5', priorSla: 92,
  },
  quarter: {
    applications: 564, decisions: 502, slaCompliance: 92, staffUtilisation: 85, breachCount: 4,
    comparator: 'last quarter',
    trends: { applications: '+6%', decisions: '+7%', sla: '-1%', utilisation: '+3%' },
    processingDelta: '-0.3 days', satisfaction: '4.2/5', priorSla: 93,
  },
  year: {
    applications: 2350, decisions: 2148, slaCompliance: 91, staffUtilisation: 88, breachCount: 5,
    comparator: 'last year',
    trends: { applications: '+18%', decisions: '+16%', sla: '+4%', utilisation: '+7%' },
    processingDelta: '-1.6 days', satisfaction: '4.1/5', priorSla: 87,
  },
};

// Product mix is stable across periods; cases are apportioned from the period
// total so the product table always reconciles to Applications Received.
const PRODUCT_MIX = [
  { product: 'DAS', share: 0.51, weekAvgDays: 4.2, longRunAvgDays: 4.9, completionRate: 92 },
  { product: 'MAP', share: 0.26, weekAvgDays: 2.8, longRunAvgDays: 3.1, completionRate: 96 },
  { product: 'PTD', share: 0.17, weekAvgDays: 6.1, longRunAvgDays: 6.8, completionRate: 88 },
  { product: 'Sequestration', share: 0.06, weekAvgDays: 8.5, longRunAvgDays: 9.4, completionRate: 97 },
];

const STAFF_MIX = [
  { name: 'Karen MacLeod', share: 0.38, avgDays: 3.8, slaCompliance: 99 },
  { name: 'James Wilson', share: 0.33, avgDays: 4.1, slaCompliance: 94 },
  { name: 'Sarah Mitchell', share: 0.29, avgDays: 5.2, slaCompliance: 88 },
];

const BREACH_POOL = [
  { ref: 'IAAS-2026-00067', daysOver: 2, assignee: 'Sarah Mitchell', product: 'PTD' },
  { ref: 'IAAS-2026-00072', daysOver: 1, assignee: 'James Wilson', product: 'DAS' },
  { ref: 'IAAS-2026-00081', daysOver: 3, assignee: 'Sarah Mitchell', product: 'Sequestration' },
  { ref: 'IAAS-2026-00094', daysOver: 5, assignee: 'James Wilson', product: 'PTD' },
  { ref: 'IAAS-2026-00108', daysOver: 4, assignee: 'Karen MacLeod', product: 'DAS' },
];

export interface MiKpi {
  label: string;
  value: string;
  icon: string;
  trend: string;
}

export interface MiProductRow {
  product: string;
  cases: number;
  avgDays: number;
  completionRate: string;
}

export interface MiStaffRow {
  name: string;
  decisions: number;
  avgDays: number;
  slaCompliance: string;
}

export interface MiBreachRow {
  ref: string;
  daysOver: number;
  assignee: string;
  product: string;
}

export interface MiData {
  kpis: MiKpi[];
  productPerformance: MiProductRow[];
  staffPerformance: MiStaffRow[];
  slaBreaches: MiBreachRow[];
  avgProcessingDays: string;
  comparator: string;
  trends: { applications: string; decisions: string; sla: string; utilisation: string };
  processingDelta: string;
  satisfaction: string;
  slaCompliance: number;
  priorSla: number;
}

export function buildMiData(period: PeriodSlug): MiData {
  const base = PERIOD_BASELINES[period];

  // Apportion by share, then push any rounding remainder onto the largest
  // product so the column still sums to the headline application count.
  const productPerformance = PRODUCT_MIX.map((p) => ({
    product: p.product,
    cases: Math.round(base.applications * p.share),
    avgDays: period === 'week' ? p.weekAvgDays : p.longRunAvgDays,
    completionRate: `${p.completionRate}%`,
  }));
  const productRemainder = base.applications - productPerformance.reduce((s, p) => s + p.cases, 0);
  productPerformance[0].cases += productRemainder;

  const staffPerformance = STAFF_MIX.map((s) => ({
    name: s.name,
    decisions: Math.round(base.decisions * s.share),
    avgDays: s.avgDays,
    slaCompliance: `${s.slaCompliance}%`,
  }));
  const staffRemainder = base.decisions - staffPerformance.reduce((s, r) => s + r.decisions, 0);
  staffPerformance[0].decisions += staffRemainder;

  // Kept as a fixed-1dp string so a whole number still renders as "5.0 days".
  const avgProcessingDays = (
    productPerformance.reduce((s, p) => s + p.avgDays * p.cases, 0) / base.applications
  ).toFixed(1);

  return {
    kpis: [
      { label: 'Applications Received', value: base.applications.toLocaleString(), icon: '📥', trend: base.trends.applications },
      { label: 'Decisions Made', value: base.decisions.toLocaleString(), icon: '✅', trend: base.trends.decisions },
      { label: 'SLA Compliance', value: `${base.slaCompliance}%`, icon: '⏱️', trend: base.trends.sla },
      { label: 'Staff Utilisation', value: `${base.staffUtilisation}%`, icon: '👥', trend: base.trends.utilisation },
    ],
    productPerformance,
    staffPerformance,
    // Copy each row: the pool is module-level, so handing out the same object
    // references would let a caller mutating a row corrupt every later call.
    slaBreaches: BREACH_POOL.slice(0, base.breachCount).map((b) => ({ ...b })),
    avgProcessingDays,
    comparator: base.comparator,
    trends: base.trends,
    processingDelta: base.processingDelta,
    satisfaction: base.satisfaction,
    slaCompliance: base.slaCompliance,
    priorSla: base.priorSla,
  };
}
