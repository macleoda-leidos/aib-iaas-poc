import type { DbDriver } from '../driver';
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
  constructor(private driver: DbDriver) {}

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

  async create(input: CreatePaymentInput): Promise<Payment> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.driver.run(`
      INSERT INTO payments (id, application_id, amount, currency, status, provider, provider_ref, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      input.applicationId,
      input.amount,
      input.currency || 'GBP',
      input.status || 'pending',
      input.provider || null,
      input.providerRef || null,
      now,
    ]);

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

  async findById(id: string): Promise<Payment | null> {
    const row = await this.driver.get('SELECT * FROM payments WHERE id = ?', [id]);
    return row ? this.mapRow(row) : null;
  }

  async findByApplication(applicationId: string): Promise<Payment[]> {
    const rows = await this.driver.all(
      'SELECT * FROM payments WHERE application_id = ? ORDER BY created_at DESC',
      [applicationId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async updateStatus(id: string, status: string): Promise<void> {
    const paidAt = status === 'completed' ? new Date().toISOString() : null;
    await this.driver.run('UPDATE payments SET status = ?, paid_at = ? WHERE id = ?', [status, paidAt, id]);
  }

  async setProviderRef(id: string, provider: string, providerRef: string): Promise<void> {
    await this.driver.run('UPDATE payments SET provider = ?, provider_ref = ? WHERE id = ?', [provider, providerRef, id]);
  }
}
