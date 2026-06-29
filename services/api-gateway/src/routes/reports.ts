import { Router, Request, Response } from 'express';
import { getDatabase } from '../db';

export const reportsRouter = Router();

// Dashboard analytics summary
reportsRouter.get('/dashboard', (_req: Request, res: Response) => {
  const db = getDatabase();

  const total = (db.prepare('SELECT COUNT(*) as count FROM applications').get() as any).count;
  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM applications GROUP BY status
  `).all() as any[];

  const thisWeek = (db.prepare(`
    SELECT COUNT(*) as count FROM applications WHERE created_at >= datetime('now', '-7 days')
  `).get() as any).count;

  const thisMonth = (db.prepare(`
    SELECT COUNT(*) as count FROM applications WHERE created_at >= datetime('now', '-30 days')
  `).get() as any).count;

  // Synthetic additional data for POC demo
  res.json({
    success: true,
    data: {
      summary: {
        totalApplications: total || 156,
        thisWeek: thisWeek || 12,
        thisMonth: thisMonth || 47,
        averageProcessingDays: 3.2,
      },
      byStatus: byStatus.length > 0 ? byStatus : [
        { status: 'draft', count: 8 },
        { status: 'submitted', count: 12 },
        { status: 'under_review', count: 15 },
        { status: 'additional_info_required', count: 5 },
        { status: 'recommendation_issued', count: 28 },
        { status: 'accepted', count: 72 },
        { status: 'rejected', count: 11 },
        { status: 'withdrawn', count: 5 },
      ],
      byProduct: [
        { product: 'debt_arrangement_scheme', count: 45, percentage: 28.8 },
        { product: 'minimal_asset_process', count: 32, percentage: 20.5 },
        { product: 'protected_trust_deed', count: 28, percentage: 17.9 },
        { product: 'bankruptcy', count: 18, percentage: 11.5 },
        { product: 'debt_payment_programme', count: 15, percentage: 9.6 },
        { product: 'moratorium', count: 8, percentage: 5.1 },
        { product: 'signposting_advice', count: 10, percentage: 6.4 },
      ],
      trends: {
        weeklyApplications: [
          { week: 'W1 Mar', count: 10 },
          { week: 'W2 Mar', count: 14 },
          { week: 'W3 Mar', count: 11 },
          { week: 'W4 Mar', count: 12 },
        ],
        monthlyApplications: [
          { month: 'Dec 2023', count: 38 },
          { month: 'Jan 2024', count: 42 },
          { month: 'Feb 2024', count: 45 },
          { month: 'Mar 2024', count: 47 },
        ],
      },
      performance: {
        averageTimeToRecommendation: '2.1 days',
        averageTimeToDecision: '5.4 days',
        creditCheckSuccessRate: '94%',
        integrationUptime: '99.2%',
      },
    },
  });
});

// Applications by product type
reportsRouter.get('/by-product', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      products: [
        { product: 'Debt Arrangement Scheme', code: 'das', active: 45, completed: 120, avgDebt: 15200, avgDuration: '4.2 years' },
        { product: 'Minimal Asset Process', code: 'map', active: 32, completed: 89, avgDebt: 7800, avgDuration: '6 months' },
        { product: 'Protected Trust Deed', code: 'ptd', active: 28, completed: 65, avgDebt: 32000, avgDuration: '4 years' },
        { product: 'Sequestration', code: 'seq', active: 18, completed: 42, avgDebt: 48000, avgDuration: '1 year' },
        { product: 'Debt Payment Programme', code: 'dpp', active: 15, completed: 55, avgDebt: 3500, avgDuration: '2.1 years' },
        { product: 'Moratorium', code: 'mor', active: 8, completed: 34, avgDebt: 12000, avgDuration: '6 weeks' },
      ],
    },
  });
});

// Organisation activity report
reportsRouter.get('/organisation-activity', (req: Request, res: Response) => {
  const { orgType } = req.query;

  res.json({
    success: true,
    data: {
      organisations: [
        { name: 'Citizens Advice Scotland', type: 'money_adviser', applications: 34, approved: 28, rejected: 3, pending: 3 },
        { name: 'StepChange Scotland', type: 'money_adviser', applications: 22, approved: 18, rejected: 2, pending: 2 },
        { name: 'Royal Bank of Scotland', type: 'creditor', casesInvolved: 45, claimsValue: 234000, dividendsReceived: 28000 },
        { name: 'Sample Insolvency Practitioners', type: 'trustee', activeCases: 34, completedThisYear: 12, estatesManaged: 1200000 },
      ].filter(o => !orgType || o.type === orgType),
    },
  });
});

// Processing time report
reportsRouter.get('/processing-times', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      averages: {
        submissionToReview: { hours: 4.2, target: 8 },
        reviewToRecommendation: { hours: 48, target: 72 },
        recommendationToDecision: { hours: 72, target: 120 },
        totalEndToEnd: { hours: 124, target: 240 },
      },
      slaCompliance: {
        withinTarget: 87,
        breached: 13,
        note: '87% of applications processed within SLA targets',
      },
    },
  });
});
