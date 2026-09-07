import { Router, Request, Response } from 'express';
import { driver } from '../db';
import {
  applicationsByStatus,
  applicationsByMonth,
  applicationsByRegion,
  recommendationsByProduct,
  debtStatistics,
  processingTimes,
  organisationActivity,
  paymentStatistics,
} from './reportQueries';

export const reportsRouter = Router();

/**
 * Management information, computed from the database.
 *
 * Every figure here except four application counts used to be a literal in this file —
 * product mix, monthly trend, geographic spread, debt bands, processing times, SLA
 * compliance. The `/statistics` page was wired to these endpoints all along, so it
 * looked live while displaying numbers that never moved. A stakeholder had no way to
 * tell which figures meant something, and a real one breaking would have gone unnoticed.
 *
 * They were literals because the tables were empty: a hundred applications existed with
 * no debts, no recommendations, no addresses and no audit trail, so an honest query
 * returned zero. The aggregation now lives in `./reportQueries.ts` and this file is the
 * route layer over it.
 *
 * Where a figure genuinely cannot be derived yet — integration uptime, credit-check
 * success rate, satisfaction — it is reported as `null` with a `derived: false` marker
 * rather than as a plausible number. A null renders as "—" and prompts the right
 * question; an invented 99.2% ends up in a board paper.
 */

/**
 * "Applications created in the last N days", in each dialect's own terms.
 *
 * SQLite's `datetime('now', '-7 days')` is not PostgreSQL syntax, and because
 * `created_at` is TEXT on one side and TIMESTAMPTZ on the other there is no portable
 * literal to compare against either. Bound as a parameter rather than interpolated, so
 * `days` can only ever be a number.
 */
function createdWithinDays(days: number): { sql: string; params: any[] } {
  return driver.dialect === 'postgres'
    ? {
        sql: 'SELECT COUNT(*) as count FROM applications WHERE created_at >= NOW() - (? * INTERVAL \'1 day\')',
        params: [days],
      }
    : {
        sql: "SELECT COUNT(*) as count FROM applications WHERE created_at >= datetime('now', ?)",
        params: [`-${days} days`],
      };
}

/**
 * Metrics no table records yet.
 *
 * Deliberately short, and it shrank: SLA compliance turned out to be derivable from
 * the audit trail (the proportion of decided cases inside the end-to-end target), so
 * it moved out of here and is now computed. What remains needs instrumentation that
 * does not exist — uptime needs a monitor with history, and credit-check success needs
 * the integration to record its outcomes.
 */
const NOT_YET_DERIVABLE = {
  creditCheckSuccessRate: null,
  integrationUptime: null,
} as const;

async function loadDashboard() {
  const week = createdWithinDays(7);
  const month = createdWithinDays(30);

  // Issued together rather than in sequence: this is one page load, and against Neon
  // each query is a network round trip.
  const [
    totalRow, weekRow, monthRow, byStatus, byProduct, monthly, regions, debts, timings, payments,
  ] = await Promise.all([
    driver.get('SELECT COUNT(*) as count FROM applications'),
    driver.get(week.sql, week.params),
    driver.get(month.sql, month.params),
    applicationsByStatus(driver),
    recommendationsByProduct(driver),
    applicationsByMonth(driver),
    applicationsByRegion(driver),
    debtStatistics(driver),
    processingTimes(driver),
    paymentStatistics(driver),
  ]);

  return {
    summary: {
      totalApplications: Number(totalRow.count),
      thisWeek: Number(weekRow.count),
      thisMonth: Number(monthRow.count),
      averageProcessingDays: timings.averageProcessingDays,
      decidedApplications: timings.decidedCount,
    },
    byStatus,
    byProduct,
    trends: {
      monthlyApplications: monthly,
    },
    performance: {
      averageTimeToReviewHours: timings.submissionToReviewHours,
      averageTimeToDecisionHours: timings.reviewToDecisionHours,
      averageEndToEndHours: timings.endToEndHours,
      slaCompliance: timings.slaCompliance,
      paymentSuccessRate: payments.successRate,
      feesCollected: payments.feeTotal,
      ...NOT_YET_DERIVABLE,
    },
    geographic: regions,
    financial: {
      totalDebtUnderManagement: debts.totalDebtUnderManagement,
      averageDebt: debts.averageDebt,
      medianDebt: debts.medianDebt,
      feesCollected: payments.feeTotal,
      debtBands: debts.debtBands,
    },
    // So a consumer can tell computed figures from absent ones without guessing.
    meta: {
      derivedFromDatabase: true,
      undeliverableMetrics: Object.keys(NOT_YET_DERIVABLE),
    },
  };
}

// Dashboard analytics summary
reportsRouter.get('/dashboard', async (_req: Request, res: Response) => {
  // Express 4 does not observe a rejected promise returned by a handler, so without
  // this an unreachable database would hang the request rather than answer it.
  try {
    res.json({ success: true, data: await loadDashboard() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * Applications by product.
 *
 * Joins recommendations to their applications' debts, so `avgDebt` is the mean total
 * debt of the people recommended each product — which is the figure that makes the
 * product mix interpretable. Previously six hardcoded rows.
 */
reportsRouter.get('/by-product', async (_req: Request, res: Response) => {
  try {
    const rows = await driver.all(`
      SELECT r.product,
             COUNT(DISTINCT r.application_id) as recommended,
             AVG(t.total) as avg_debt,
             SUM(CASE WHEN a.status IN ('approved', 'accepted') THEN 1 ELSE 0 END) as completed
      FROM recommendations r
      JOIN applications a ON a.id = r.application_id
      LEFT JOIN (SELECT application_id, SUM(amount) as total FROM debts GROUP BY application_id) t
             ON t.application_id = r.application_id
      GROUP BY r.product
      ORDER BY COUNT(DISTINCT r.application_id) DESC
    `);

    res.json({
      success: true,
      data: {
        products: rows.map(r => ({
          product: r.product,
          recommended: Number(r.recommended),
          completed: Number(r.completed),
          // Rounded to the pound: a mean of integer debts is not itself an integer,
          // and pence on an average debt figure implies a precision it does not have.
          avgDebt: r.avg_debt === null ? null : Math.round(Number(r.avg_debt)),
        })),
        meta: { derivedFromDatabase: true },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * Organisation activity.
 *
 * Reports what can be derived. Applications carry no `organisation_id`, so a
 * per-organisation caseload cannot be computed — that is stated in `meta` rather than
 * filled with plausible numbers, because a fabricated caseload is precisely the figure
 * a stakeholder would quote back.
 */
reportsRouter.get('/organisation-activity', async (req: Request, res: Response) => {
  try {
    const orgType = typeof req.query.orgType === 'string' ? req.query.orgType : undefined;

    res.json({
      success: true,
      data: {
        organisations: await organisationActivity(driver, orgType),
        meta: {
          derivedFromDatabase: true,
          note: 'Per-organisation caseload is not reported: applications carry no organisation_id, so it cannot be derived.',
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * Processing times, from the audit trail — the only record of when a case moved
 * between states.
 *
 * Cases that have not reached a stage contribute nothing to that stage's average
 * rather than counting as zero. Averaging in not-yet-happened as instant is how a
 * service reports an SLA it is not meeting.
 */
reportsRouter.get('/processing-times', async (_req: Request, res: Response) => {
  try {
    const timings = await processingTimes(driver);

    // Targets are policy, not data — they belong in configuration and are stated here
    // as the constants they are, so a breach is visible against a named target.
    res.json({
      success: true,
      data: {
        averages: {
          submissionToReview: { hours: timings.submissionToReviewHours, target: 8 },
          reviewToDecision: { hours: timings.reviewToDecisionHours, target: 72 },
          totalEndToEnd: { hours: timings.endToEndHours, target: 240 },
        },
        sampleSize: timings.decidedCount,
        meta: {
          derivedFromDatabase: true,
          note: 'Averages exclude applications that have not yet reached the stage being measured.',
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});
