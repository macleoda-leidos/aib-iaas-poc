import type { DbDriver } from '../driver';
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
  constructor(private driver: DbDriver) {}

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

  async create(input: CreateAuditEventInput): Promise<AuditEvent> {
    const id = randomUUID();
    const timestamp = input.timestamp || new Date().toISOString();

    await this.driver.run(`
      INSERT INTO audit_events (id, application_id, action, actor_id, actor_name, actor_type, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      input.applicationId || null,
      input.action,
      input.actorId || null,
      input.actorName || null,
      input.actorType,
      input.details ? JSON.stringify(input.details) : null,
      timestamp,
    ]);

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

  async findById(id: string): Promise<AuditEvent | null> {
    const row = await this.driver.get('SELECT * FROM audit_events WHERE id = ?', [id]);
    return row ? this.mapRow(row) : null;
  }

  async findByApplication(applicationId: string): Promise<AuditEvent[]> {
    const rows = await this.driver.all(
      'SELECT * FROM audit_events WHERE application_id = ? ORDER BY timestamp ASC',
      [applicationId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async findAll(params: ListAuditEventsParams = {}): Promise<AuditEvent[]> {
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

    const rows = await this.driver.all(
      `SELECT * FROM audit_events ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return rows.map(r => this.mapRow(r));
  }

  async count(params: Omit<ListAuditEventsParams, 'limit' | 'offset'> = {}): Promise<number> {
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
    const row = await this.driver.get(`SELECT COUNT(*) as count FROM audit_events ${where}`, values);
    // Number(), not the raw value: COUNT(*) is int8 in PostgreSQL and `pg` hands
    // back bigints as strings rather than lose precision. Left alone this would
    // return "5" where the signature promises 5, and callers doing arithmetic on
    // it — pagination's totalPages — would concatenate instead of add.
    return Number(row.count);
  }
}
