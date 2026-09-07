import type { DbDriver } from '@aib-iaas/database';

/**
 * Real aggregations for the reporting endpoints.
 *
 * Every figure the `/statistics` page displayed was a literal in `reports.ts` —
 * product mix, monthly trend, geographic spread, debt bands, processing times — apart
 * from four application counts. The page itself was wired to the API all along, so it
 * *looked* live while showing numbers that never changed. That is the worst of both
 * worlds: a stakeholder cannot tell which figures mean anything, and nobody notices
 * when the real ones break.
 *
 * They were literals because the tables behind them were empty: 100 applications
 * existed with no debts, no recommendations, no addresses and no audit trail, so a
 * genuine query would have returned zero for almost everything. Now that the demo
 * dataset populates those tables, the aggregate can be computed.
 *
 * Two conventions throughout:
 *
 *  - **`Number()` on every count and sum.** PostgreSQL returns `COUNT(*)` and
 *    `SUM(...)` as bigint/numeric, which `pg` hands back as strings to avoid losing
 *    precision. Left alone, `"12" + "5"` is `"125"` and every derived percentage is
 *    wrong.
 *  - **Dialect forks are named and isolated.** Only date formatting genuinely differs;
 *    it is confined to `monthExpression` so the rest reads as one query.
 */

/** `YYYY-MM` from a timestamp column, per dialect. */
function monthExpression(driver: DbDriver, column: string): string {
  return driver.dialect === 'postgres'
    ? `to_char(${column}, 'YYYY-MM')`
    : `strftime('%Y-%m', ${column})`;
}

const num = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * City → AiB reporting region. Held here rather than in the database because it is
 * presentation-layer grouping, not a fact about the address, and the regions are the
 * ones the statistics page already labels its chart with.
 */
const REGION_BY_CITY: Record<string, string> = {
  Edinburgh: 'Edinburgh & Lothians',
  Livingston: 'Edinburgh & Lothians',
  Glasgow: 'Glasgow & Clyde',
  Paisley: 'Glasgow & Clyde',
  Greenock: 'Glasgow & Clyde',
  Coatbridge: 'Glasgow & Clyde',
  Motherwell: 'Glasgow & Clyde',
  Hamilton: 'Glasgow & Clyde',
  Cumbernauld: 'Glasgow & Clyde',
  Kilmarnock: 'Glasgow & Clyde',
  Ayr: 'Glasgow & Clyde',
  Aberdeen: 'Aberdeen & NE',
  Dundee: 'Dundee & Tayside',
  Perth: 'Dundee & Tayside',
  Inverness: 'Highlands & Islands',
  'Fort William': 'Highlands & Islands',
  Oban: 'Highlands & Islands',
  Kirkcaldy: 'Fife',
  Dunfermline: 'Fife',
  'St Andrews': 'Fife',
  Stirling: 'Borders & South',
  Falkirk: 'Borders & South',
  Dumfries: 'Borders & South',
};

export interface StatusCount { status: string; count: number }
export interface ProductCount { product: string; count: number; percentage: number }
export interface MonthCount { month: string; count: number }
export interface RegionCount { region: string; applications: number; percentage: number }
export interface DebtBand { band: string; count: number; percentage: number }

/** Applications grouped by status. */
export async function applicationsByStatus(driver: DbDriver): Promise<StatusCount[]> {
  const rows = await driver.all('SELECT status, COUNT(*) as count FROM applications GROUP BY status ORDER BY status');
  return rows.map(r => ({ status: r.status, count: num(r.count) }));
}

/** Recommended products, with each product's share of all recommendations. */
export async function recommendationsByProduct(driver: DbDriver): Promise<ProductCount[]> {
  const rows = await driver.all(
    'SELECT product, COUNT(*) as count FROM recommendations GROUP BY product ORDER BY COUNT(*) DESC'
  );
  const total = rows.reduce((sum, r) => sum + num(r.count), 0);

  return rows.map(r => ({
    product: r.product,
    count: num(r.count),
    // Guarded: an empty recommendations table would otherwise divide by zero and
    // render "NaN%" on the chart.
    percentage: total === 0 ? 0 : Math.round((num(r.count) / total) * 1000) / 10,
  }));
}

/** Applications created per calendar month, oldest first. */
export async function applicationsByMonth(driver: DbDriver, limit = 12): Promise<MonthCount[]> {
  const month = monthExpression(driver, 'created_at');
  const rows = await driver.all(
    `SELECT ${month} as month, COUNT(*) as count FROM applications GROUP BY ${month} ORDER BY ${month} DESC LIMIT ?`,
    [limit]
  );
  // Queried newest-first so LIMIT keeps the most recent months, then reversed for a
  // chart that reads left to right.
  return rows.map(r => ({ month: r.month, count: num(r.count) })).reverse();
}

/**
 * Where applicants live, by reporting region.
 *
 * Counts current addresses only. Including previous addresses would count a debtor who
 * has moved twice three times over, and inflate whichever regions people leave.
 */
export async function applicationsByRegion(driver: DbDriver): Promise<RegionCount[]> {
  const rows = await driver.all(
    'SELECT city, COUNT(*) as count FROM addresses WHERE is_current = ? GROUP BY city',
    [true]
  );

  const byRegion = new Map<string, number>();
  for (const row of rows) {
    const region = REGION_BY_CITY[row.city] ?? 'Other';
    byRegion.set(region, (byRegion.get(region) ?? 0) + num(row.count));
  }

  const total = [...byRegion.values()].reduce((sum, n) => sum + n, 0);
  return [...byRegion.entries()]
    .map(([region, applications]) => ({
      region,
      applications,
      percentage: total === 0 ? 0 : Math.round((applications / total) * 1000) / 10,
    }))
    .sort((a, b) => b.applications - a.applications);
}

/**
 * Debt totals and the distribution across bands.
 *
 * Banded per *application* rather than per debt: "£15k–£25k" describes a person's
 * situation, and banding individual creditor balances would put a debtor with ten
 * small debts in the lowest band when their total is the highest.
 */
export async function debtStatistics(driver: DbDriver): Promise<{
  totalDebtUnderManagement: number;
  averageDebt: number;
  medianDebt: number;
  debtBands: DebtBand[];
}> {
  const perApplication = await driver.all(
    'SELECT application_id, SUM(amount) as total FROM debts GROUP BY application_id'
  );
  const totals = perApplication.map(r => num(r.total)).sort((a, b) => a - b);

  if (totals.length === 0) {
    return { totalDebtUnderManagement: 0, averageDebt: 0, medianDebt: 0, debtBands: [] };
  }

  const sum = totals.reduce((s, t) => s + t, 0);
  const bands: Array<{ band: string; test: (total: number) => boolean }> = [
    { band: '<£5k', test: t => t < 5_000 },
    { band: '£5k-£15k', test: t => t >= 5_000 && t < 15_000 },
    { band: '£15k-£25k', test: t => t >= 15_000 && t < 25_000 },
    { band: '£25k-£50k', test: t => t >= 25_000 && t < 50_000 },
    { band: '>£50k', test: t => t >= 50_000 },
  ];

  return {
    totalDebtUnderManagement: sum,
    averageDebt: Math.round(sum / totals.length),
    // Median as well as mean: debt distributions are skewed by a few very large
    // cases, so the mean alone overstates the typical applicant's position.
    medianDebt: totals[Math.floor(totals.length / 2)],
    debtBands: bands.map(({ band, test }) => {
      const count = totals.filter(test).length;
      return { band, count, percentage: Math.round((count / totals.length) * 1000) / 10 };
    }),
  };
}

/**
 * Processing durations, derived from the audit trail.
 *
 * The audit events are the only record of when a case moved between states, so they
 * are the only honest source for this. Cases that have not reached a stage contribute
 * nothing to that stage's average rather than counting as zero — averaging in
 * not-yet-happened as instant is how a service reports an SLA it is not meeting.
 */
export async function processingTimes(driver: DbDriver, endToEndTargetHours = 240): Promise<{
  submissionToReviewHours: number | null;
  reviewToDecisionHours: number | null;
  endToEndHours: number | null;
  averageProcessingDays: number | null;
  slaCompliance: number | null;
  decidedCount: number;
}> {
  const events = await driver.all<{ application_id: string; action: string; timestamp: string }>(
    `SELECT application_id, action, timestamp FROM audit_events
     WHERE action IN ('application_created', 'application_submitted', 'status_changed_to_under_review',
                      'status_changed_to_approved', 'status_changed_to_rejected')
     ORDER BY application_id, timestamp`
  );

  const byApplication = new Map<string, Record<string, number>>();
  for (const event of events) {
    const at = new Date(event.timestamp).getTime();
    if (!Number.isFinite(at)) continue;
    const seen = byApplication.get(event.application_id) ?? {};
    // First occurrence wins: a case sent back for more information can pass through
    // 'under_review' twice, and the first transition is the one the SLA measures.
    const key = event.action.startsWith('status_changed_to_') && event.action !== 'status_changed_to_under_review'
      ? 'decided'
      : event.action;
    if (seen[key] === undefined) seen[key] = at;
    byApplication.set(event.application_id, seen);
  }

  const hours = (from: number, to: number) => (to - from) / 3_600_000;
  const submissionToReview: number[] = [];
  const reviewToDecision: number[] = [];
  const endToEnd: number[] = [];

  for (const stamps of byApplication.values()) {
    if (stamps.application_submitted !== undefined && stamps.status_changed_to_under_review !== undefined) {
      submissionToReview.push(hours(stamps.application_submitted, stamps.status_changed_to_under_review));
    }
    if (stamps.status_changed_to_under_review !== undefined && stamps.decided !== undefined) {
      reviewToDecision.push(hours(stamps.status_changed_to_under_review, stamps.decided));
    }
    if (stamps.application_created !== undefined && stamps.decided !== undefined) {
      endToEnd.push(hours(stamps.application_created, stamps.decided));
    }
  }

  const mean = (values: number[]) =>
    values.length === 0 ? null : Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;

  const endToEndMean = mean(endToEnd);

  // SLA compliance is genuinely derivable — the proportion of *decided* cases that
  // reached a decision inside the target. Measured over decided cases only: a case
  // still in progress has not breached anything yet, and counting it either way would
  // move the figure for a reason unrelated to performance.
  const withinTarget = endToEnd.filter(hours => hours <= endToEndTargetHours).length;

  return {
    submissionToReviewHours: mean(submissionToReview),
    reviewToDecisionHours: mean(reviewToDecision),
    endToEndHours: endToEndMean,
    averageProcessingDays: endToEndMean === null ? null : Math.round((endToEndMean / 24) * 10) / 10,
    slaCompliance:
      endToEnd.length === 0 ? null : Math.round((withinTarget / endToEnd.length) * 1000) / 10,
    decidedCount: endToEnd.length,
  };
}

/**
 * Per-organisation activity.
 *
 * Applications are not yet linked to the organisation that submitted them — there is
 * no `organisation_id` on `applications` — so this reports what can actually be
 * derived: each organisation's registered details and its users' involvement. The
 * missing link is stated in the response rather than filled with plausible numbers,
 * because a fabricated per-organisation caseload is exactly the figure a stakeholder
 * would quote back.
 */
export async function organisationActivity(driver: DbDriver, orgType?: string): Promise<Array<{
  id: string; name: string; type: string; status: string; userCount: number;
}>> {
  const rows = await driver.all(
    `SELECT o.id, o.name, o.type, o.status, COUNT(u.id) as user_count
     FROM organisations o
     LEFT JOIN users u ON u.organisation_id = o.id
     ${orgType ? 'WHERE o.type = ?' : ''}
     GROUP BY o.id, o.name, o.type, o.status
     ORDER BY o.name`,
    orgType ? [orgType] : []
  );

  return rows.map(r => ({
    id: r.id, name: r.name, type: r.type, status: r.status, userCount: num(r.user_count),
  }));
}

/** Payment throughput, for the financial panel. */
export async function paymentStatistics(driver: DbDriver): Promise<{
  collected: number; failed: number; feeTotal: number; successRate: number | null;
}> {
  const rows = await driver.all(
    'SELECT status, COUNT(*) as count, SUM(amount) as total FROM payments GROUP BY status'
  );

  let collected = 0;
  let failed = 0;
  let feeTotal = 0;
  for (const row of rows) {
    if (row.status === 'completed') {
      collected = num(row.count);
      feeTotal = num(row.total);
    } else {
      failed += num(row.count);
    }
  }

  const attempted = collected + failed;
  return {
    collected,
    failed,
    feeTotal,
    successRate: attempted === 0 ? null : Math.round((collected / attempted) * 1000) / 10,
  };
}
