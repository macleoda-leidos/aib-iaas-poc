import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

// ─── Types ─────────────────────────────────────

export type MessageDirection = 'applicant' | 'staff';

export interface Message {
  id: string;
  applicationId: string;
  senderUserId: string | null;
  senderName: string | null;
  direction: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface CreateMessageInput {
  applicationId: string;
  senderUserId?: string | null;
  senderName?: string | null;
  direction: MessageDirection;
  body: string;
}

// ─── Repository ────────────────────────────────

/**
 * Two-way secure correspondence between an applicant and the case team, threaded
 * per application. Net-new for Phase 2 (E6); pairs with a notification to the
 * counterparty on each new message.
 */
export class MessageRepository {
  constructor(private db: Database.Database) {}

  private mapRow(row: any): Message {
    return {
      id: row.id,
      applicationId: row.application_id,
      senderUserId: row.sender_user_id ?? null,
      senderName: row.sender_name ?? null,
      direction: row.direction,
      body: row.body,
      read: Boolean(row.read),
      createdAt: row.created_at,
    };
  }

  create(input: CreateMessageInput): Message {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO messages (id, application_id, sender_user_id, sender_name, direction, body, read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, input.applicationId, input.senderUserId ?? null, input.senderName ?? null, input.direction, input.body, now);
    return {
      id, applicationId: input.applicationId, senderUserId: input.senderUserId ?? null,
      senderName: input.senderName ?? null, direction: input.direction, body: input.body,
      read: false, createdAt: now,
    };
  }

  findByApplication(applicationId: string): Message[] {
    const rows = this.db.prepare('SELECT * FROM messages WHERE application_id = ? ORDER BY created_at ASC').all(applicationId) as any[];
    return rows.map(r => this.mapRow(r));
  }

  /** Mark every message in the opposite direction as read (the reader's inbox). */
  markReadForReader(applicationId: string, readerDirection: MessageDirection): number {
    const senderSide: MessageDirection = readerDirection === 'staff' ? 'applicant' : 'staff';
    const result = this.db.prepare('UPDATE messages SET read = 1 WHERE application_id = ? AND direction = ? AND read = 0').run(applicationId, senderSide);
    return result.changes;
  }
}
