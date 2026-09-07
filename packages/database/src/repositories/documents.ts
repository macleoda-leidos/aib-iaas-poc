import type { DbDriver } from '../driver';
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
  constructor(private driver: DbDriver) {}

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

  async create(input: CreateDocumentInput): Promise<Document> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.driver.run(`
      INSERT INTO documents (id, application_id, filename, original_name, mime_type, size, category, storage_path, scan_status, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [
      id,
      input.applicationId,
      input.filename,
      input.originalName,
      input.mimeType,
      input.size,
      input.category,
      input.storagePath,
      now,
    ]);

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

  async findById(id: string): Promise<Document | null> {
    const row = await this.driver.get('SELECT * FROM documents WHERE id = ?', [id]);
    return row ? this.mapRow(row) : null;
  }

  async findByApplication(applicationId: string): Promise<Document[]> {
    const rows = await this.driver.all(
      'SELECT * FROM documents WHERE application_id = ? ORDER BY uploaded_at DESC',
      [applicationId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async findByCategory(applicationId: string, category: string): Promise<Document[]> {
    const rows = await this.driver.all(
      'SELECT * FROM documents WHERE application_id = ? AND category = ? ORDER BY uploaded_at DESC',
      [applicationId, category]
    );
    return rows.map(r => this.mapRow(r));
  }

  async updateScanStatus(id: string, status: string, result?: any): Promise<void> {
    await this.driver.run(
      'UPDATE documents SET scan_status = ?, scan_result = ? WHERE id = ?',
      [status, result ? JSON.stringify(result) : null, id]
    );
  }

  async delete(id: string): Promise<void> {
    await this.driver.run('DELETE FROM documents WHERE id = ?', [id]);
  }

  async deleteByApplication(applicationId: string): Promise<void> {
    await this.driver.run('DELETE FROM documents WHERE application_id = ?', [applicationId]);
  }
}
