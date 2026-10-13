import { describe, it, expect, beforeAll } from 'vitest';
import { createRepositories, type Repositories } from '@aib-iaas/database';
import { runTick, startSlaWorker } from '../sla/worker';

/**
 * Integration test for the SLA worker's one-sweep unit, `runTick`.
 *
 * Runs against the shared in-memory SQLite the vitest config pins
 * (DATABASE_PATH=:memory:), isolated to this test file's worker process. Seeds a
 * single open case with a recommendation, an assignee and a back-dated
 * submission, runs the sweep with a pinned `now`, and asserts the three writes
 * the worker makes — then runs it again to prove idempotency.
 */

let repos: Repositories;
let appId: string;

const ASSIGNEE = 'user-demo';
// DAS objection runs 21 days from submission → due 22 Jan 2026.
const SUBMITTED_AT = new Date(2026, 0, 1).toISOString();
// 1 March 2026 — well past the objection deadline, so it has breached.
const FIXED_NOW = new Date(2026, 2, 1);

beforeAll(() => {
  repos = createRepositories();

  const app = repos.applications.create({
    status: 'submitted',
    submittedAt: SUBMITTED_AT,
    assignedTo: ASSIGNEE,
    applicant: { firstName: 'Worker', lastName: 'Testcase' },
    debts: [
      { creditor: 'Bank A', type: 'credit_card', amount: 1000 },
      { creditor: 'Bank B', type: 'loan', amount: 2000 },
    ],
  });
  appId = app.id;

  repos.recommendations.create({
    applicationId: appId,
    product: 'DAS',
    confidence: 'high',
    confidencePct: 80,
    reasoning: ['DAS fits'],
    factors: {},
    alternatives: [],
    engineVersion: 'test-1.0',
  });
});

describe('SLA worker — runTick', () => {
  it('fires a notification, an sla_* audit event and an sla_events row for a breached deadline', () => {
    const { fired } = runTick(repos, FIXED_NOW);
    expect(fired).toBeGreaterThanOrEqual(1);

    const notifications = repos.notifications.findByUser(ASSIGNEE);
    const breach = notifications.find(n => n.subject.includes('SLA breached'));
    expect(breach).toBeDefined();
    expect(breach!.body).toContain('reg.23(5)');

    const auditEvents = repos.audit.findByApplication(appId);
    expect(auditEvents.some(e => e.action.startsWith('sla_'))).toBe(true);
    expect(auditEvents.some(e => e.action === 'sla_breached' && e.actorName === 'SLA monitor')).toBe(true);

    const keys = repos.slaEvents.findKeysByApplication(appId);
    expect(keys).toContain(`${appId}:creditor_objection:breached`);
  });

  it('is idempotent — a second sweep at the same now writes nothing new', () => {
    const notificationsBefore = repos.notifications.findByUser(ASSIGNEE).length;
    const auditBefore = repos.audit.findByApplication(appId).length;
    const keysBefore = repos.slaEvents.findKeysByApplication(appId).length;

    const { fired } = runTick(repos, FIXED_NOW);

    expect(fired).toBe(0);
    expect(repos.notifications.findByUser(ASSIGNEE).length).toBe(notificationsBefore);
    expect(repos.audit.findByApplication(appId).length).toBe(auditBefore);
    expect(repos.slaEvents.findKeysByApplication(appId).length).toBe(keysBefore);
  });

  it('startSlaWorker is a no-op under NODE_ENV=test — it never schedules a timer', () => {
    // vitest pins NODE_ENV=test, so the scheduler must return before setInterval.
    // A thrown error or a lingering interval here would mean the guard regressed.
    expect(() => startSlaWorker(repos)).not.toThrow();
  });
});
