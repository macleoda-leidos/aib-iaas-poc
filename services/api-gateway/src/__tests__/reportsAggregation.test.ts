import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app } from '../index';
import { issueAccessToken, generateKeyPairPem, resetSigningKeys } from '@aib-iaas/auth';
import { users, applications, recommendations, audit } from '../db';

/**
 * The reporting aggregates, asserted against a dataset this file inserts.
 *
 * Every figure these endpoints returned used to be a literal in `routes/reports.ts` —
 * six hardcoded products, twelve hardcoded months, seven hardcoded regions, a fixed
 * 87% SLA compliance — apart from four application counts. The `/statistics` page was
 * wired to the API all along, so it *looked* live while showing numbers that never moved.
 *
 * The tests that covered it asserted those arrays were **present and non-empty**, which
 * was guaranteed by them being hardcoded: every one would have passed with the database
 * dropped. That is the shape of gap worth hunting for — an assertion about the form of a
 * response rather than the correctness of a computation.
 *
 * So each test here inserts known inputs and asserts the computed output. The debt
 * figures are chosen to land in three different bands, and the audit trail is stamped
 * with deliberate 2-hour and 24-hour gaps, so the expected values are arithmetic rather
 * than whatever the code happens to produce.
 */

let server: http.Server;
let baseUrl: string;
let adminBearer: string;

const originalKeys = { priv: process.env.JWT_PRIVATE_KEY, pub: process.env.JWT_PUBLIC_KEY };

/** Debt totals of 3k / 18k / 35k, landing in three distinct bands. */
const CASES = [
  { ref: 'RPT-A', status: 'approved', city: 'Edinburgh', debts: [3_000], product: 'MAP', total: 3_000 },
  { ref: 'RPT-B', status: 'approved', city: 'Glasgow', debts: [12_000, 6_000], product: 'DAS', total: 18_000 },
  { ref: 'RPT-C', status: 'rejected', city: 'Glasgow', debts: [30_000, 5_000], product: 'Sequestration', total: 35_000 },
];

function request(method: string, path: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminBearer}` },
      },
      res => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode || 0, data: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode || 0, data }); }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

beforeAll(async () => {
  const keys = generateKeyPairPem();
  process.env.JWT_PRIVATE_KEY = keys.privateKey;
  process.env.JWT_PUBLIC_KEY = keys.publicKey;
  resetSigningKeys();

  const issued = issueAccessToken({
    userId: 'user-admin', email: 'admin@aib-poc.example.com', role: 'system_admin', roleLevel: 100,
  });
  await users.createSession('user-admin', issued.token, issued.expiresAt);
  adminBearer = issued.token;

  for (const c of CASES) {
    const created = await applications.create({
      referenceNumber: c.ref,
      status: c.status,
      addresses: [{ line1: '1 Test Street', city: c.city, postcode: 'EH1 1AA', isCurrent: true }],
      debts: c.debts.map((amount, i) => ({ creditor: `Creditor ${i + 1}`, type: 'credit_card', amount })),
    });

    await recommendations.create({
      applicationId: created.id,
      product: c.product,
      confidence: 'high',
      confidencePct: 80,
      reasoning: ['seeded for the reporting test'],
      factors: {},
      alternatives: [],
      engineVersion: '2.1.0',
    });

    // Deliberate gaps: submitted -> under_review is 2h, under_review -> decision 24h.
    const base = Date.parse('2026-06-01T09:00:00Z');
    const at = (hours: number) => new Date(base + hours * 3_600_000).toISOString();
    await audit.create({ applicationId: created.id, action: 'application_created', actorType: 'applicant', timestamp: at(0) });
    await audit.create({ applicationId: created.id, action: 'application_submitted', actorType: 'applicant', timestamp: at(1) });
    await audit.create({ applicationId: created.id, action: 'status_changed_to_under_review', actorType: 'staff', timestamp: at(3) });
    await audit.create({
      applicationId: created.id,
      action: c.status === 'rejected' ? 'status_changed_to_rejected' : 'status_changed_to_approved',
      actorType: 'staff',
      timestamp: at(27),
    });
  }

  await new Promise<void>(resolve => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${(server.address() as any).port}`;
      resolve();
    });
  });
});

afterAll(() => {
  server?.close();
  if (originalKeys.priv === undefined) delete process.env.JWT_PRIVATE_KEY;
  else process.env.JWT_PRIVATE_KEY = originalKeys.priv;
  if (originalKeys.pub === undefined) delete process.env.JWT_PUBLIC_KEY;
  else process.env.JWT_PUBLIC_KEY = originalKeys.pub;
  resetSigningKeys();
});

describe('product mix', () => {
  it('counts each recommended product', async () => {
    const res = await request('GET', '/api/reports/dashboard');
    const byProduct: any[] = res.data.data.byProduct;

    for (const c of CASES) {
      const entry = byProduct.find(p => p.product === c.product);
      expect(entry, c.product).toBeDefined();
      expect(entry.count).toBeGreaterThanOrEqual(1);
    }
  });

  it('reports shares that add up to 100%', async () => {
    // A pie chart whose slices do not sum is visibly wrong to an audience, and the
    // arithmetic is the whole content of the endpoint.
    const res = await request('GET', '/api/reports/dashboard');
    const total = res.data.data.byProduct.reduce((sum: number, p: any) => sum + p.percentage, 0);

    expect(total).toBeGreaterThan(99);
    expect(total).toBeLessThan(101);
  });

  it('reports the average debt of the people recommended each product', async () => {
    // The figure that makes the product mix interpretable, and it must be the mean of
    // the *applications*' totals, not of individual creditor balances.
    const res = await request('GET', '/api/reports/by-product');
    const products: any[] = res.data.data.products;

    expect(products.find(p => p.product === 'MAP').avgDebt).toBe(3_000);
    expect(products.find(p => p.product === 'Sequestration').avgDebt).toBe(35_000);
    expect(products.find(p => p.product === 'DAS').avgDebt).toBe(18_000);
  });

  it('counts only approved cases as completed', async () => {
    const res = await request('GET', '/api/reports/by-product');
    const products: any[] = res.data.data.products;

    expect(products.find(p => p.product === 'Sequestration').completed).toBe(0);
    expect(products.find(p => p.product === 'MAP').completed).toBe(1);
  });
});

describe('debt statistics', () => {
  it('sums total debt under management', async () => {
    const res = await request('GET', '/api/reports/dashboard');
    const expected = CASES.reduce((sum, c) => sum + c.total, 0);

    // Other suites create applications without debts, which must not change this.
    expect(res.data.data.financial.totalDebtUnderManagement).toBeGreaterThanOrEqual(expected);
  });

  it('bands by application total, not by individual debt', async () => {
    // Case B is two debts of £12k and £6k. Banding those separately would place it in
    // "£5k-£15k" twice instead of "£15k-£25k" once — understating every debtor with
    // several creditors, which is most of them.
    const res = await request('GET', '/api/reports/dashboard');
    const bands = res.data.data.financial.debtBands;
    const count = (band: string) => bands.find((b: any) => b.band === band)?.count ?? 0;

    expect(count('<£5k')).toBeGreaterThanOrEqual(1);
    expect(count('£15k-£25k')).toBeGreaterThanOrEqual(1);
    expect(count('£25k-£50k')).toBeGreaterThanOrEqual(1);
  });

  it('reports a median as well as a mean', async () => {
    // Debt distributions are skewed by a few very large cases, so a mean alone
    // overstates the typical applicant's position.
    const res = await request('GET', '/api/reports/dashboard');
    expect(res.data.data.financial.medianDebt).toBeGreaterThan(0);
    expect(res.data.data.financial.averageDebt).toBeGreaterThan(0);
  });

  it('returns numbers, not the strings PostgreSQL would hand back', async () => {
    // SUM() and COUNT() come back as strings from `pg` to preserve bigint precision.
    // Unconverted, every derived percentage is string concatenation.
    const res = await request('GET', '/api/reports/dashboard');
    expect(typeof res.data.data.financial.totalDebtUnderManagement).toBe('number');
    expect(typeof res.data.data.summary.totalApplications).toBe('number');
    res.data.data.byProduct.forEach((p: any) => expect(typeof p.count).toBe('number'));
  });
});

describe('geography', () => {
  it('collapses cities into reporting regions', async () => {
    // Two Glasgow cases become one region entry. A per-city list would not match the
    // labels the statistics chart uses.
    const res = await request('GET', '/api/reports/dashboard');
    const regions: any[] = res.data.data.geographic;

    const glasgow = regions.find(r => r.region === 'Glasgow & Clyde');
    expect(glasgow).toBeDefined();
    expect(glasgow.applications).toBeGreaterThanOrEqual(2);
    expect(regions.find(r => r.region === 'Edinburgh & Lothians')).toBeDefined();
  });

  it('counts current addresses only', async () => {
    // A debtor who has moved twice has three address rows. Counting all of them would
    // triple-count them and inflate whichever regions people leave.
    const created = await applications.create({
      referenceNumber: `RPT-MOVED-${Date.now()}`,
      addresses: [
        { line1: '1 Now Street', city: 'Aberdeen', postcode: 'AB10 1EF', isCurrent: true },
        { line1: '2 Then Street', city: 'Aberdeen', postcode: 'AB11 5BB', isCurrent: false },
        { line1: '3 Before Street', city: 'Aberdeen', postcode: 'AB12 3SS', isCurrent: false },
      ],
    });
    expect(created.id).toBeTruthy();

    const res = await request('GET', '/api/reports/dashboard');
    const aberdeen = res.data.data.geographic.find((r: any) => r.region === 'Aberdeen & NE');
    expect(aberdeen.applications).toBe(1);
  });
});

describe('trends', () => {
  it('groups applications by calendar month', async () => {
    const res = await request('GET', '/api/reports/dashboard');
    const monthly: any[] = res.data.data.trends.monthlyApplications;

    expect(monthly.length).toBeGreaterThan(0);
    expect(monthly[0].month).toMatch(/^\d{4}-\d{2}$/);
    expect(typeof monthly[0].count).toBe('number');
  });

  it('orders months oldest first, so a chart reads left to right', async () => {
    const res = await request('GET', '/api/reports/dashboard');
    const months = res.data.data.trends.monthlyApplications.map((m: any) => m.month);

    expect([...months].sort((a: string, b: string) => a.localeCompare(b))).toEqual(months);
  });
});

describe('processing times', () => {
  it('derives the stage averages from the audit trail', async () => {
    // The trail was stamped with 2h and 24h gaps, so these are checked as values.
    const res = await request('GET', '/api/reports/processing-times');
    const averages = res.data.data.averages;

    expect(averages.submissionToReview.hours).toBeCloseTo(2, 1);
    expect(averages.reviewToDecision.hours).toBeCloseTo(24, 1);
    expect(averages.totalEndToEnd.hours).toBeCloseTo(27, 1);
  });

  it('reports the sample size the averages rest on', async () => {
    // An average over three cases and an average over three thousand are different
    // claims. Publishing one without the other invites over-reading it.
    const res = await request('GET', '/api/reports/processing-times');
    expect(res.data.data.sampleSize).toBeGreaterThanOrEqual(CASES.length);
  });

  it('excludes a case that has not reached the stage being measured', async () => {
    // A draft has no submission event. Counting it as zero hours would report an SLA
    // the service is not meeting — the specific way this kind of metric lies.
    const before = await request('GET', '/api/reports/processing-times');
    await applications.create({ referenceNumber: `RPT-DRAFT-${Date.now()}`, status: 'draft' });
    const after = await request('GET', '/api/reports/processing-times');

    expect(after.data.data.averages.submissionToReview.hours)
      .toBe(before.data.data.averages.submissionToReview.hours);
  });

  it('states each stage target alongside the measurement', async () => {
    const res = await request('GET', '/api/reports/processing-times');
    expect(res.data.data.averages.submissionToReview.target).toBe(8);
    expect(res.data.data.averages.totalEndToEnd.target).toBe(240);
  });
});

describe('honesty about what cannot be derived', () => {
  it('reports undeliverable metrics as null rather than as plausible numbers', async () => {
    // Integration uptime and credit-check success rate have no table behind them. A
    // null renders as "—" and prompts the right question; the invented 99.2% and 94%
    // these used to return end up in a board paper.
    const res = await request('GET', '/api/reports/dashboard');
    const performance = res.data.data.performance;

    expect(performance.integrationUptime).toBeNull();
    expect(performance.creditCheckSuccessRate).toBeNull();
  });

  it('computes SLA compliance rather than reporting it as underivable', async () => {
    // It started out in the underivable list and came out of it: the proportion of
    // decided cases that reached a decision inside the end-to-end target *is* derivable
    // from the audit trail. The seeded cases decide in 27 hours against a 240-hour
    // target, so every one of them complies.
    const res = await request('GET', '/api/reports/dashboard');

    expect(res.data.data.performance.slaCompliance).toBe(100);
    expect(res.data.data.meta.undeliverableMetrics).not.toContain('slaCompliance');
  });

  it('names them, so a consumer need not guess which figures are real', async () => {
    const res = await request('GET', '/api/reports/dashboard');
    expect(res.data.data.meta.derivedFromDatabase).toBe(true);
    expect(res.data.data.meta.undeliverableMetrics).toContain('integrationUptime');
  });

  it('says plainly that per-organisation caseload cannot be derived', async () => {
    // Applications carry no organisation_id, so a caseload per organisation would be
    // fabricated — and it is exactly the figure a stakeholder would quote back.
    const res = await request('GET', '/api/reports/organisation-activity');
    expect(res.data.data.meta.note).toContain('organisation_id');
  });

  it('reports the organisation data it does have', async () => {
    const res = await request('GET', '/api/reports/organisation-activity');
    expect(res.data.data.organisations.length).toBeGreaterThan(0);
    expect(res.data.data.organisations[0]).toHaveProperty('userCount');
    expect(typeof res.data.data.organisations[0].userCount).toBe('number');
  });

  it('filters organisations by type', async () => {
    const res = await request('GET', '/api/reports/organisation-activity?orgType=money_adviser');
    const orgs: any[] = res.data.data.organisations;

    expect(orgs.length).toBeGreaterThan(0);
    orgs.forEach(org => expect(org.type).toBe('money_adviser'));
  });
});
