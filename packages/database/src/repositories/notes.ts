import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

// ─── Types ─────────────────────────────────────

export interface Note {
  id: string;
  applicationId: string;
  authorId: string | null;
  authorName: string | null;
  noteType: string;
  content: string;
  createdAt: string;
}

export interface CreateNoteInput {
  applicationId: string;
  authorId?: string | null;
  authorName?: string | null;
  noteType?: string;
  content: string;
}

// ─── Repository ────────────────────────────────

/**
 * Persisted case notes. The author is supplied by the caller from the verified
 * token (never the request body) — the applications route derives it the same
 * way it derives the audit actor.
 */
export class NoteRepository {
  constructor(private db: Database.Database) {}

  private mapRow(row: any): Note {
    return {
      id: row.id,
      applicationId: row.application_id,
      authorId: row.author_id ?? null,
      authorName: row.author_name ?? null,
      noteType: row.note_type,
      content: row.content,
      createdAt: row.created_at,
    };
  }

  create(input: CreateNoteInput): Note {
    const id = randomUUID();
    const now = new Date().toISOString();
    const noteType = input.noteType || 'general';

    this.db.prepare(`
      INSERT INTO notes (id, application_id, author_id, author_name, note_type, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, input.applicationId, input.authorId ?? null, input.authorName ?? null, noteType, input.content, now);

    return {
      id,
      applicationId: input.applicationId,
      authorId: input.authorId ?? null,
      authorName: input.authorName ?? null,
      noteType,
      content: input.content,
      createdAt: now,
    };
  }

  findByApplication(applicationId: string): Note[] {
    const rows = this.db.prepare(
      'SELECT * FROM notes WHERE application_id = ? ORDER BY created_at DESC'
    ).all(applicationId) as any[];
    return rows.map(r => this.mapRow(r));
  }
}
