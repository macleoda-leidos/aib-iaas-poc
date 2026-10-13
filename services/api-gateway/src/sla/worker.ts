/**
 * The statutory SLA worker — the background job that makes the deadline engine
 * *act*.
 *
 * `runTick` is the testable unit: it walks every open application, resolves its
 * statutory clocks server-side via the pure engine, and — idempotently — writes
 * an immutable audit event and (where the case is assigned) an in-app
 * notification for each deadline milestone as it is reached. It never transitions
 * a case: raising awareness is the whole job, because the expiries themselves are
 * legal acts that a permissioned human must action.
 *
 * `startSlaWorker` is the only stateful part — a module-singleton `setInterval`,
 * started from both API entry points (standalone gateway and the deployed
 * consolidated container). Only one of those runs per process, and the singleton
 * guard covers the rest, so there is never double-scheduling.
 */

import { getDatabase, type Repositories } from '@aib-iaas/database';
import { normaliseProduct } from '@aib-iaas/statutory';
import { OPEN_STATUSES, evaluateCase, type CaseForSla, type SlaEvent } from './engine';

const PAGE_SIZE = 100;

/**
 * Persist one event in a single transaction: record it in the idempotency ledger
 * first, and only when that INSERT actually wrote a row (i.e. this milestone has
 * not fired before) go on to audit and notify. Gating on the write result rather
 * than the pre-read `firedKeys` set closes the window where two ticks race on the
 * same milestone — the UNIQUE constraint is the real guarantee.
 *
 * Returns true when the event was newly recorded (and so acted on).
 */
function commitEvent(repos: Repositories, ev: SlaEvent): boolean {
  const db = getDatabase();
  const txn = db.transaction(() => {
    const written = repos.slaEvents.record({
      applicationId: ev.applicationId,
      deadlineKind: ev.deadlineKind,
      milestone: ev.milestone,
      dueAt: ev.dueAt,
      citation: ev.citation,
    });
    if (!written) return false;

    repos.audit.create({
      applicationId: ev.applicationId,
      action: `sla_${ev.milestone}`,
      actorType: 'system',
      actorName: 'SLA monitor',
      details: {
        deadlineKind: ev.deadlineKind,
        milestone: ev.milestone,
        dueAt: ev.dueAt,
        citation: ev.citation,
        referenceNumber: ev.referenceNumber,
      },
    });

    // Unassigned cases still get the audit trail; only a notification needs a
    // recipient. The staff-queue SLA badge surfaces them regardless of assignment.
    if (ev.recipient) {
      repos.notifications.create({
        userId: ev.recipient,
        channel: 'in_app',
        type: ev.notificationType,
        subject: ev.subject,
        body: ev.body,
        link: `/case/${ev.referenceNumber}`,
      });
    }
    return true;
  });

  return txn() as boolean;
}

/** Resolve a single application into the engine's input, or null if it has no
 *  modelled clock to run (no recommendation, unmodelled product, no submission). */
function resolveCase(repos: Repositories, app: {
  id: string;
  referenceNumber: string;
  assignedTo: string | null;
  submittedAt: string | null;
}): CaseForSla | null {
  if (!app.submittedAt) return null;

  // The product lives on the recommendation (the applications table has none).
  const rec = repos.recommendations.findByApplication(app.id);
  if (!rec || !normaliseProduct(rec.product)) return null;

  const submittedOn = new Date(app.submittedAt);
  if (Number.isNaN(submittedOn.getTime())) return null;

  return {
    applicationId: app.id,
    referenceNumber: app.referenceNumber,
    product: rec.product,
    submittedOn,
    debtCount: repos.applications.getDebts(app.id).length,
    assignedTo: app.assignedTo,
  };
}

/**
 * One sweep of the live queue. Pure in its inputs (`now` is injected), so a test
 * can back-date a case, pin `now`, and assert exactly what fires. Each case is
 * wrapped in try/catch so one bad row can never halt the sweep — the same
 * fail-safe posture as the gateway's `notify()` helper.
 */
export function runTick(repos: Repositories, now: Date = new Date()): { fired: number } {
  let fired = 0;

  for (const status of OPEN_STATUSES) {
    let page = 1;
    for (;;) {
      const { data, total } = repos.applications.list({ status, page, pageSize: PAGE_SIZE });
      for (const app of data) {
        try {
          const kase = resolveCase(repos, app);
          if (!kase) continue;
          const firedKeys = new Set(repos.slaEvents.findKeysByApplication(app.id));
          for (const ev of evaluateCase(kase, now, firedKeys)) {
            if (commitEvent(repos, ev)) fired++;
          }
        } catch (e) {
          console.error(`[SLA worker] case ${app.referenceNumber} failed`, e);
        }
      }
      if (data.length === 0 || page * PAGE_SIZE >= total) break;
      page++;
    }
  }

  return { fired };
}

// ─── Scheduler ─────────────────────────────────

let started = false;

/**
 * Start the background sweep. Idempotent (module-singleton guard), a no-op under
 * tests and when explicitly disabled. Cadence from SLA_WORKER_INTERVAL_MS
 * (default 5 minutes). An initial tick runs a few seconds after boot so the demo
 * lights up without waiting a full interval.
 */
export function startSlaWorker(repos: Repositories): void {
  if (process.env.NODE_ENV === 'test') return;
  if (process.env.SLA_WORKER_ENABLED === 'false') return;
  if (started) return;
  started = true;

  const intervalMs = Number(process.env.SLA_WORKER_INTERVAL_MS) || 5 * 60 * 1000;

  const tick = () => {
    try {
      const { fired } = runTick(repos);
      if (fired > 0) console.log(`[SLA worker] fired ${fired} reminder(s)`);
    } catch (e) {
      console.error('[SLA worker] tick failed', e);
    }
  };

  console.log(`[SLA worker] started — sweeping every ${Math.round(intervalMs / 1000)}s`);
  // Delay the first sweep so it never competes with request-serving at boot. The
  // listener keeps the process alive; unref so the interval alone never does.
  const kickoff = setTimeout(tick, 3000);
  if (typeof kickoff.unref === 'function') kickoff.unref();
  const timer = setInterval(tick, intervalMs);
  if (typeof timer.unref === 'function') timer.unref();
}
