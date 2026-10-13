import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

// ─── Types ─────────────────────────────────────

export interface SlaEvent {
  id: string;
  applicationId: string;
  deadlineKind: string;
  milestone: string;
  dueAt: string | null;
  citation: string | null;
  firedAt: string;
}

export interface RecordSlaEventInput {
  applicationId: string;
  deadlineKind: string;
  milestone: string;
  dueAt?: string | null;
  citation?: string | null;
}

// ─── Repository ────────────────────────────────

/**
 * The idempotency ledger behind the statutory SLA worker. A row records that the
 * worker has already acted on one (application, statutory deadline, milestone)
 * combination, so a reminder is never fired twice — not across ticks, and not
 * across process restarts (the table lives on the persistent disk).
 *
 * The UNIQUE (application_id, deadline_kind, milestone) constraint IS the
 * idempotency key. `record()` writes with INSERT OR IGNORE and reports whether a
 * new row was actually written, so the worker can gate its audit + notification
 * writes on that boolean rather than on a pre-read set that could race.
 */
export class SlaEventRepository {
  constructor(private db: Database.Database) {}

  /**
   * Record that a milestone has fired. Returns true when a new row was written,
   * false when it already existed (the milestone was fired on an earlier tick).
   * The caller only notifies/audits when this returns true.
   */
  record(input: RecordSlaEventInput): boolean {
    const result = this.db.prepare(`
      INSERT OR IGNORE INTO sla_events (id, application_id, deadline_kind, milestone, due_at, citation, fired_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      input.applicationId,
      input.deadlineKind,
      input.milestone,
      input.dueAt ?? null,
      input.citation ?? null,
      new Date().toISOString()
    );
    return result.changes > 0;
  }

  /**
   * The milestone keys already fired for an application, in the engine's
   * `${applicationId}:${deadlineKind}:${milestone}` form so the worker can seed a
   * Set and skip re-emitting them without any mapping.
   */
  findKeysByApplication(applicationId: string): string[] {
    const rows = this.db.prepare(
      'SELECT application_id, deadline_kind, milestone FROM sla_events WHERE application_id = ?'
    ).all(applicationId) as any[];
    return rows.map(r => `${r.application_id}:${r.deadline_kind}:${r.milestone}`);
  }
}
