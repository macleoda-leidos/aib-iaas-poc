import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { createSqliteDriver, type DbDriver } from '../driver';
import { initializeSchema } from '../schema';
import { runMigrations } from '../migrations';
import { seedDemoDetail, type DemoSeedCounts } from '../seed-demo';

/**
 * The demo dataset's internal consistency.
 *
 * Six tables — addresses, debts, income_expenditure, recommendations, audit_events
 * and payments — were empty after every previous seeding path, while applications and
 * applicants were populated. A debt-advice demo whose applications have no debts shows
 * an empty creditor list on the case page and £0 total debt on every dashboard, which
 * is why several screens carried hardcoded figures instead.
 *
 * These tests assert *coherence* rather than counts, because incoherent demo data
 * invites precisely the questions a demo is meant to avoid: a case whose creditors do
 * not sum to its stated total, or whose recommendation contradicts its own figures, is
 * worse than no data.
 */

const APPLICATION_COUNT = 40;

/** The same spread the consolidated API's demo seed creates. */
const SEED_STATUSES = ['approved', 'submitted', 'under_review', 'draft', 'additional_info_required', 'rejected'];

let db: Database.Database;
let driver: DbDriver;
let counts: DemoSeedCounts;

beforeAll(async () => {
  db = new Database(':memory:');
  driver = createSqliteDriver(db);
  initializeSchema(db);
  await runMigrations(driver);

  // The applications the detail hangs off, with the same spread of statuses the real
  // caller creates — the seeder reads each status from the row, so a fixture where
  // every case is 'submitted' would exercise only one branch of the trail and produce
  // no recommendations at all.
  const insertApp = db.prepare(
    "INSERT INTO applications (id, reference_number, status, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))"
  );
  for (let i = 1; i <= APPLICATION_COUNT; i++) {
    insertApp.run(
      `app-seed-${String(i).padStart(4, '0')}`,
      `IAAS-2026-${String(i).padStart(5, '0')}`,
      SEED_STATUSES[i % SEED_STATUSES.length]
    );
  }

  counts = await seedDemoDetail(driver, APPLICATION_COUNT);
});

afterAll(() => db.close());

function rows<T = any>(sql: string, ...params: any[]): T[] {
  return db.prepare(sql).all(...params) as T[];
}

describe('every table a screen reads is populated', () => {
  it.each([
    ['addresses'],
    ['debts'],
    ['income_expenditure'],
    ['recommendations'],
    ['audit_events'],
    ['payments'],
  ])('%s has rows', table => {
    const count = (db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as any).c;
    expect(count).toBeGreaterThan(0);
  });

  it('gives every application at least one debt and one address', async () => {
    // The gap that mattered most: a debt application with no debts.
    const withoutDebts = rows(
      'SELECT a.id FROM applications a LEFT JOIN debts d ON d.application_id = a.id WHERE d.id IS NULL'
    );
    const withoutAddress = rows(
      'SELECT a.id FROM applications a LEFT JOIN addresses ad ON ad.application_id = a.id WHERE ad.id IS NULL'
    );

    expect(withoutDebts).toEqual([]);
    expect(withoutAddress).toEqual([]);
  });

  it('gives every application exactly one income/expenditure record', async () => {
    // The table has a UNIQUE constraint on application_id, so more than one would be
    // a failed insert rather than a duplicate — but zero would be a blank affordability
    // section on the case page.
    const perApplication = rows<{ n: number }>(
      'SELECT COUNT(*) as n FROM income_expenditure GROUP BY application_id'
    );
    expect(perApplication).toHaveLength(APPLICATION_COUNT);
    expect(perApplication.every(r => r.n === 1)).toBe(true);
  });
});

describe('the figures are internally consistent', () => {
  it('has debts that sum to a plausible total for each case', async () => {
    // Each case's creditors are allocated shares of one total, with the last taking
    // the remainder — so rounding can never make the parts disagree with the whole.
    const perCase = rows<{ application_id: string; total: number; n: number }>(
      'SELECT application_id, SUM(amount) as total, COUNT(*) as n FROM debts GROUP BY application_id'
    );

    for (const c of perCase) {
      expect(c.n, c.application_id).toBeGreaterThanOrEqual(2);
      expect(c.total, c.application_id).toBeGreaterThan(1_000);
      expect(c.total, c.application_id).toBeLessThan(50_000);
      // Integer pence-free amounts: money stored as a float that is not a round
      // number is how aggregation drift starts.
      expect(Number.isInteger(c.total), c.application_id).toBe(true);
    }
  });

  it('never records a negative or zero debt', async () => {
    // The remainder-allocation approach could in principle hand the last creditor a
    // negative amount if the shares overshot.
    const bad = rows('SELECT id, amount FROM debts WHERE amount <= 0');
    expect(bad).toEqual([]);
  });

  it('gives exactly one current address per application', async () => {
    // Two "current" addresses is a data-quality bug the case page would render as a
    // contradiction.
    const currents = rows<{ n: number }>(
      'SELECT COUNT(*) as n FROM addresses WHERE is_current = 1 GROUP BY application_id'
    );
    expect(currents).toHaveLength(APPLICATION_COUNT);
    expect(currents.every(r => r.n === 1)).toBe(true);
  });

  it('recommends a product consistent with the case it belongs to', async () => {
    // The recommendation is derived from each case's own debt and surplus rather than
    // picked at random, so a reviewer comparing the two cannot find a contradiction.
    const recs = rows<{ product: string; factors: string; confidence_pct: number }>(
      'SELECT product, factors, confidence_pct FROM recommendations'
    );
    expect(recs.length).toBeGreaterThan(0);

    for (const rec of recs) {
      const factors = JSON.parse(rec.factors);
      expect(rec.confidence_pct).toBeGreaterThan(0);
      expect(rec.confidence_pct).toBeLessThanOrEqual(100);

      // The two thresholds the engine's branches turn on.
      if (rec.product === 'MAP') expect(factors.totalDebt).toBeLessThan(5_000);
      if (rec.product === 'PTD') expect(factors.hasRealisableAssets).toBe(true);
      if (rec.product === 'DAS') expect(factors.surplusIncome).toBeGreaterThanOrEqual(50);
    }
  });

  it('stores recommendation JSON columns as parseable JSON', async () => {
    // reasoning/factors/alternatives are NOT NULL TEXT holding JSON, and the row
    // mapper calls JSON.parse unconditionally — malformed content is a 500 on read.
    for (const rec of rows<any>('SELECT reasoning, factors, alternatives FROM recommendations')) {
      expect(() => JSON.parse(rec.reasoning)).not.toThrow();
      expect(() => JSON.parse(rec.factors)).not.toThrow();
      expect(() => JSON.parse(rec.alternatives)).not.toThrow();
      expect(Array.isArray(JSON.parse(rec.reasoning))).toBe(true);
    }
  });

  it('does not recommend anything for a draft or freshly submitted case', async () => {
    // A recommendation before review would misrepresent the workflow.
    const premature = rows(`
      SELECT r.id FROM recommendations r
      JOIN applications a ON a.id = r.application_id
      WHERE a.status IN ('draft', 'submitted')
    `);
    expect(premature).toEqual([]);
  });
});

describe('the audit trail reads as a history', () => {
  it('orders each application’s events forward in time', async () => {
    // The case timeline renders these in order; equal or descending timestamps make
    // it read as though the decision preceded the application.
    const applicationIds = rows<{ application_id: string }>(
      'SELECT DISTINCT application_id FROM audit_events'
    ).map(r => r.application_id);

    for (const id of applicationIds) {
      const timestamps = rows<{ timestamp: string }>(
        'SELECT timestamp FROM audit_events WHERE application_id = ? ORDER BY id',
        id
      ).map(r => r.timestamp);

      const sorted = [...timestamps].sort();
      expect(timestamps, id).toEqual(sorted);
      expect(new Set(timestamps).size, id).toBe(timestamps.length);
    }
  });

  it('always begins with the application being created', async () => {
    const firsts = rows<{ action: string }>(`
      SELECT action FROM audit_events e
      WHERE e.id = (SELECT MIN(id) FROM audit_events WHERE application_id = e.application_id)
    `);
    expect(firsts.every(f => f.action === 'application_created')).toBe(true);
  });

  it('attributes every event to an actor type', async () => {
    // actor_type is NOT NULL and drives the filter on the audit page.
    const unattributed = rows(
      "SELECT id FROM audit_events WHERE actor_type IS NULL OR actor_type = ''"
    );
    expect(unattributed).toEqual([]);
    expect(
      new Set(rows<{ actor_type: string }>('SELECT DISTINCT actor_type FROM audit_events').map(r => r.actor_type))
    ).toEqual(new Set(['applicant', 'staff', 'system']));
  });
});

describe('payments', () => {
  it('charges the same fee on every case that has one', async () => {
    const amounts = new Set(rows<{ amount: number }>('SELECT DISTINCT amount FROM payments').map(r => r.amount));
    expect(amounts).toEqual(new Set([90]));
  });

  it('sets paid_at exactly when the payment completed', async () => {
    // A completed payment with no timestamp, or a failed one with a timestamp, both
    // read as a reconciliation error.
    const inconsistent = rows(`
      SELECT id FROM payments
      WHERE (status = 'completed' AND paid_at IS NULL)
         OR (status != 'completed' AND paid_at IS NOT NULL)
    `);
    expect(inconsistent).toEqual([]);
  });

  it('takes no payment on a draft', async () => {
    const draftPayments = rows(`
      SELECT p.id FROM payments p JOIN applications a ON a.id = p.application_id WHERE a.status = 'draft'
    `);
    expect(draftPayments).toEqual([]);
  });
});

describe('re-running it', () => {
  it('changes nothing', async () => {
    // Every service boot may call this. Duplicating a hundred cases' debts on each
    // restart would make the demo's figures climb.
    const before = (db.prepare('SELECT COUNT(*) as c FROM debts').get() as any).c;
    await seedDemoDetail(driver, APPLICATION_COUNT);
    const after = (db.prepare('SELECT COUNT(*) as c FROM debts').get() as any).c;

    expect(after).toBe(before);
  });

  it('reports what it wrote', async () => {
    expect(counts.debts).toBeGreaterThan(APPLICATION_COUNT);
    expect(counts.addresses).toBeGreaterThanOrEqual(APPLICATION_COUNT);
    expect(counts.incomeExpenditure).toBe(APPLICATION_COUNT);
    expect(counts.auditEvents).toBeGreaterThan(APPLICATION_COUNT);
  });
});

describe('determinism', () => {
  it('produces identical data on a second, separate database', async () => {
    // No Math.random anywhere: the scripted demo narrates specific figures, and tests
    // assert on specific cases, so the dataset must be byte-identical every run.
    const other = new Database(':memory:');
    try {
      const otherDriver = createSqliteDriver(other);
      initializeSchema(other);
      await runMigrations(otherDriver);

      const insertApp = other.prepare(
        "INSERT INTO applications (id, reference_number, status, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))"
      );
      for (let i = 1; i <= APPLICATION_COUNT; i++) {
        insertApp.run(`app-seed-${String(i).padStart(4, '0')}`, `IAAS-2026-${String(i).padStart(5, '0')}`, SEED_STATUSES[i % SEED_STATUSES.length]);
      }
      await seedDemoDetail(otherDriver, APPLICATION_COUNT);

      const fingerprint = (handle: Database.Database) =>
        JSON.stringify(handle.prepare('SELECT id, creditor, amount FROM debts ORDER BY id').all());

      expect(fingerprint(other)).toBe(fingerprint(db));
    } finally {
      other.close();
    }
  });
});
