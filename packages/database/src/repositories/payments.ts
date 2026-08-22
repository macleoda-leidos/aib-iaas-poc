import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

// ─── Types ─────────────────────────────────────

export interface Payment {
  id: string;
  applicationId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  providerRef: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface CreatePaymentInput {
  applicationId: string;
  amount: number;
  currency?: string;
  status?: string;
  provider?: string;
  providerRef?: string;
}

// ─── Repository ────────────────────────────────

export class PaymentRepository {
  constructor(private db: Database.Database) {}

  private mapRow(row: any): Payment {
    return {
      id: row.id,
      applicationId: row.application_id,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      provider: row.provider,
      providerRef: row.provider_ref,
      paidAt: row.paid_at,
      createdAt: row.created_at,
    };
  }

  create(input: CreatePaymentInput): Payment {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO payments (id, application_id, amount, currency, status, provider, provider_ref, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.applicationId,
      input.amount,
      input.currency || 'GBP',
      input.status || 'pending',
      input.provider || null,
      input.providerRef || null,
      now
    );

    return {
      id,
      applicationId: input.applicationId,
      amount: input.amount,
      currency: input.currency || 'GBP',
      status: input.status || 'pending',
      provider: input.provider || null,
      providerRef: input.providerRef || null,
      paidAt: null,
      createdAt: now,
    };
  }

  findById(id: string): Payment | null {
    const row = this.db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as any;
    return row ? this.mapRow(row) : null;
  }

  findByApplication(applicationId: string): Payment[] {
    const rows = this.db.prepare(
      'SELECT * FROM payments WHERE application_id = ? ORDER BY created_at DESC'
    ).all(applicationId) as any[];
    return rows.map(r => this.mapRow(r));
  }

  updateStatus(id: string, status: string): void {
    const paidAt = status === 'completed' ? new Date().toISOString() : null;
    this.db.prepare('UPDATE payments SET status = ?, paid_at = ? WHERE id = ?').run(status, paidAt, id);
  }

  setProviderRef(id: string, provider: string, providerRef: string): void {
    this.db.prepare('UPDATE payments SET provider = ?, provider_ref = ? WHERE id = ?').run(provider, providerRef, id);
  }
}
