import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

// ─── Types ─────────────────────────────────────

export type ClaimStatus = 'submitted' | 'accepted' | 'rejected';

export interface Claim {
  id: string;
  applicationId: string;
  creditorOrgId: string | null;
  creditorUserId: string | null;
  amount: number;
  basis: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClaimInput {
  applicationId: string;
  creditorOrgId?: string | null;
  creditorUserId?: string | null;
  amount: number;
  basis?: string | null;
}

// ─── Repository ────────────────────────────────

/**
 * Creditor claims against an application. A creditor submits a claim (amount +
 * basis); staff accept or reject it. Net-new resource for the creditor-portal
 * build-out (Phase 3 / E7b).
 */
export class ClaimRepository {
  constructor(private db: Database.Database) {}

  private mapRow(row: any): Claim {
    return {
      id: row.id,
      applicationId: row.application_id,
      creditorOrgId: row.creditor_org_id ?? null,
      creditorUserId: row.creditor_user_id ?? null,
      amount: row.amount,
      basis: row.basis ?? null,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  create(input: CreateClaimInput): Claim {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO claims (id, application_id, creditor_org_id, creditor_user_id, amount, basis, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?, ?)
    `).run(id, input.applicationId, input.creditorOrgId ?? null, input.creditorUserId ?? null, input.amount, input.basis ?? null, now, now);
    return {
      id, applicationId: input.applicationId, creditorOrgId: input.creditorOrgId ?? null,
      creditorUserId: input.creditorUserId ?? null, amount: input.amount, basis: input.basis ?? null,
      status: 'submitted', createdAt: now, updatedAt: now,
    };
  }

  findById(id: string): Claim | null {
    const row = this.db.prepare('SELECT * FROM claims WHERE id = ?').get(id) as any;
    return row ? this.mapRow(row) : null;
  }

  findByApplication(applicationId: string): Claim[] {
    const rows = this.db.prepare('SELECT * FROM claims WHERE application_id = ? ORDER BY created_at DESC').all(applicationId) as any[];
    return rows.map(r => this.mapRow(r));
  }

  findByCreditorOrg(creditorOrgId: string): Claim[] {
    const rows = this.db.prepare('SELECT * FROM claims WHERE creditor_org_id = ? ORDER BY created_at DESC').all(creditorOrgId) as any[];
    return rows.map(r => this.mapRow(r));
  }

  updateStatus(id: string, status: ClaimStatus): Claim | null {
    const now = new Date().toISOString();
    this.db.prepare('UPDATE claims SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
    return this.findById(id);
  }
}
