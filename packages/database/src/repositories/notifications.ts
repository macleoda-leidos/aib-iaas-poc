import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

// ─── Types ─────────────────────────────────────

export type NotificationType = 'info' | 'action_required' | 'success' | 'warning' | 'error';
export type NotificationChannel = 'in_app' | 'email' | 'sms';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  channel: string;
  subject: string;
  body: string;
  link: string | null;
  read: boolean;
  sentAt: string;
  readAt: string | null;
  expiresAt: string | null;
  metadata: any | null;
}

export interface CreateNotificationInput {
  userId: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  subject: string;
  body: string;
  link?: string | null;
  metadata?: Record<string, any> | null;
  expiresAt?: string | null;
}

// ─── Repository ────────────────────────────────

/**
 * Unified notification store. The gateway writes lifecycle notifications through
 * `create()` on the same shared connection the notification routes read, so an
 * in-app notification fired on (say) a status change is immediately visible via
 * GET /api/notifications/user/:id. Email/SMS "delivery" is a console.log stub —
 * the real GOV.UK Notify integration is a documented future step.
 */
export class NotificationRepository {
  constructor(private db: Database.Database) {}

  private mapRow(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      channel: row.channel,
      subject: row.subject,
      body: row.body,
      link: row.link ?? null,
      read: Boolean(row.read),
      sentAt: row.sent_at,
      readAt: row.read_at ?? null,
      expiresAt: row.expires_at ?? null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    };
  }

  create(input: CreateNotificationInput): Notification {
    const id = randomUUID();
    const now = new Date().toISOString();
    const type = input.type || 'info';
    const channel = input.channel || 'in_app';
    const metadata = input.metadata ? JSON.stringify(input.metadata) : null;

    this.db.prepare(`
      INSERT INTO notifications (id, user_id, type, channel, subject, body, link, read, sent_at, expires_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run(id, input.userId, type, channel, input.subject, input.body, input.link ?? null, now, input.expiresAt ?? null, metadata);

    // Placeholder delivery for the non-in-app channels (no real gateway in the POC).
    if (channel === 'email') {
      console.log(`[EMAIL PLACEHOLDER] To: ${input.userId} Subject: ${input.subject}`);
    } else if (channel === 'sms') {
      console.log(`[SMS PLACEHOLDER] To: ${input.userId} Message: ${input.body?.slice(0, 160)}`);
    }

    return {
      id, userId: input.userId, type, channel,
      subject: input.subject, body: input.body, link: input.link ?? null,
      read: false, sentAt: now, readAt: null, expiresAt: input.expiresAt ?? null,
      metadata: input.metadata ?? null,
    };
  }

  findByUser(userId: string, opts: { unreadOnly?: boolean; limit?: number } = {}): Notification[] {
    const { unreadOnly = false, limit = 20 } = opts;
    let sql = 'SELECT * FROM notifications WHERE user_id = ?';
    if (unreadOnly) sql += ' AND read = 0';
    sql += ' ORDER BY sent_at DESC LIMIT ?';
    const rows = this.db.prepare(sql).all(userId, limit) as any[];
    return rows.map(r => this.mapRow(r));
  }

  unreadCount(userId: string): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(userId) as any;
    return row.count;
  }

  markRead(id: string): void {
    this.db.prepare("UPDATE notifications SET read = 1, read_at = datetime('now') WHERE id = ?").run(id);
  }

  markAllRead(userId: string): number {
    const result = this.db.prepare("UPDATE notifications SET read = 1, read_at = datetime('now') WHERE user_id = ? AND read = 0").run(userId);
    return result.changes;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
  }
}
