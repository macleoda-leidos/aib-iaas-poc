import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

// ─── Types ─────────────────────────────────────

export interface AuditEvent {
  id: string;
  applicationId: string | null;
  action: string;
  actorId: string | null;
  actorName: string | null;
  actorType: string;
  details: any | null;
  timestamp: string;
}

export interface CreateAuditEventInput {
  applicationId?: string;
  action: string;
  actorId?: string;
  actorName?: string;
  actorType: string;
  details?: any;
  timestamp?: string;
}

export interface ListAuditEventsParams {
  applicationId?: string;
  action?: string;
  actorType?: string;
  actorId?: string;
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
}

// ─── Repository ────────────────────────────────

export class AuditRepository {
  constructor(private db: Database.Database) {}

  private mapRow(row: any): AuditEvent {
    return {
      id: row.id,
      applicationId: row.application_id,
      action: row.action,
      actorId: row.actor_id,
      actorName: row.actor_name,
      actorType: row.actor_type,
      details: row.details ? JSON.parse(row.details) : null,
      timestamp: row.timestamp,
    };
  }

  create(input: CreateAuditEventInput): AuditEvent {
    const id = randomUUID();
    const timestamp = input.timestamp || new Date().toISOString();

    this.db.prepare(`
      INSERT INTO audit_events (id, application_id, action, actor_id, actor_name, actor_type, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.applicationId || null,
      input.action,
      input.actorId || null,
      input.actorName || null,
      input.actorType,
      input.details ? JSON.stringify(input.details) : null,
      timestamp
    );

    return {
      id,
      applicationId: input.applicationId || null,
      action: input.action,
      actorId: input.actorId || null,
      actorName: input.actorName || null,
      actorType: input.actorType,
      details: input.details || null,
      timestamp,
    };
  }

  findById(id: string): AuditEvent | null {
    const row = this.db.prepare('SELECT * FROM audit_events WHERE id = ?').get(id) as any;
    return row ? this.mapRow(row) : null;
  }

  findByApplication(applicationId: string): AuditEvent[] {
    const rows = this.db.prepare(
      'SELECT * FROM audit_events WHERE application_id = ? ORDER BY timestamp ASC'
    ).all(applicationId) as any[];
    return rows.map(r => this.mapRow(r));
  }

  findAll(params: ListAuditEventsParams = {}): AuditEvent[] {
    const { action, actorType, actorId, applicationId, limit = 100, offset = 0, from, to } = params;
    const conditions: string[] = [];
    const values: any[] = [];

    if (applicationId) {
      conditions.push('application_id = ?');
      values.push(applicationId);
    }
    if (action) {
      conditions.push('action = ?');
      values.push(action);
    }
    if (actorType) {
      conditions.push('actor_type = ?');
      values.push(actorType);
    }
    if (actorId) {
      conditions.push('actor_id = ?');
      values.push(actorId);
    }
    if (from) {
      conditions.push('timestamp >= ?');
      values.push(from);
    }
    if (to) {
      conditions.push('timestamp <= ?');
      values.push(to);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = this.db.prepare(
      `SELECT * FROM audit_events ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`
    ).all(...values, limit, offset) as any[];

    return rows.map(r => this.mapRow(r));
  }

  count(params: Omit<ListAuditEventsParams, 'limit' | 'offset'> = {}): number {
    const { action, actorType, actorId, applicationId, from, to } = params;
    const conditions: string[] = [];
    const values: any[] = [];

    if (applicationId) {
      conditions.push('application_id = ?');
      values.push(applicationId);
    }
    if (action) {
      conditions.push('action = ?');
      values.push(action);
    }
    if (actorType) {
      conditions.push('actor_type = ?');
      values.push(actorType);
    }
    if (actorId) {
      conditions.push('actor_id = ?');
      values.push(actorId);
    }
    if (from) {
      conditions.push('timestamp >= ?');
      values.push(from);
    }
    if (to) {
      conditions.push('timestamp <= ?');
      values.push(to);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const row = this.db.prepare(`SELECT COUNT(*) as count FROM audit_events ${where}`).get(...values) as any;
    return row.count;
  }
}
