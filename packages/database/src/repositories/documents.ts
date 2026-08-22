import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

// ─── Types ─────────────────────────────────────

export interface Document {
  id: string;
  applicationId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  storagePath: string;
  scanStatus: string;
  scanResult: any | null;
  uploadedAt: string;
}

export interface CreateDocumentInput {
  applicationId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  storagePath: string;
}

// ─── Repository ────────────────────────────────

export class DocumentRepository {
  constructor(private db: Database.Database) {}

  private mapRow(row: any): Document {
    return {
      id: row.id,
      applicationId: row.application_id,
      filename: row.filename,
      originalName: row.original_name,
      mimeType: row.mime_type,
      size: row.size,
      category: row.category,
      storagePath: row.storage_path,
      scanStatus: row.scan_status,
      scanResult: row.scan_result ? JSON.parse(row.scan_result) : null,
      uploadedAt: row.uploaded_at,
    };
  }

  create(input: CreateDocumentInput): Document {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO documents (id, application_id, filename, original_name, mime_type, size, category, storage_path, scan_status, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      id,
      input.applicationId,
      input.filename,
      input.originalName,
      input.mimeType,
      input.size,
      input.category,
      input.storagePath,
      now
    );

    return {
      id,
      applicationId: input.applicationId,
      filename: input.filename,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      category: input.category,
      storagePath: input.storagePath,
      scanStatus: 'pending',
      scanResult: null,
      uploadedAt: now,
    };
  }

  findById(id: string): Document | null {
    const row = this.db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as any;
    return row ? this.mapRow(row) : null;
  }

  findByApplication(applicationId: string): Document[] {
    const rows = this.db.prepare(
      'SELECT * FROM documents WHERE application_id = ? ORDER BY uploaded_at DESC'
    ).all(applicationId) as any[];
    return rows.map(r => this.mapRow(r));
  }

  findByCategory(applicationId: string, category: string): Document[] {
    const rows = this.db.prepare(
      'SELECT * FROM documents WHERE application_id = ? AND category = ? ORDER BY uploaded_at DESC'
    ).all(applicationId, category) as any[];
    return rows.map(r => this.mapRow(r));
  }

  updateScanStatus(id: string, status: string, result?: any): void {
    this.db.prepare(
      'UPDATE documents SET scan_status = ?, scan_result = ? WHERE id = ?'
    ).run(status, result ? JSON.stringify(result) : null, id);
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  }

  deleteByApplication(applicationId: string): void {
    this.db.prepare('DELETE FROM documents WHERE application_id = ?').run(applicationId);
  }
}
