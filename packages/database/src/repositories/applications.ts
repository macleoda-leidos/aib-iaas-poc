import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

// ─── Types ─────────────────────────────────────

export interface Applicant {
  id: string;
  applicationId: string;
  title: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  niNumber: string | null;
  maritalStatus: string | null;
  dependants: number;
  employment: string | null;
  email: string | null;
  phone: string | null;
}

export interface Address {
  id: string;
  applicationId: string;
  line1: string;
  line2: string | null;
  city: string;
  postcode: string;
  isCurrent: boolean;
  residentFrom: string | null;
  residentTo: string | null;
}

export interface Debt {
  id: string;
  applicationId: string;
  creditor: string;
  type: string;
  amount: number;
  monthlyPayment: number;
  accountRef: string | null;
}

export interface Asset {
  id: string;
  applicationId: string;
  type: string;
  description: string;
  value: number;
  outstanding: number;
  isEssential: boolean;
}

export interface IncomeExpenditure {
  id: string;
  applicationId: string;
  income: Record<string, number>;
  expenditure: Record<string, number>;
}

export interface Application {
  id: string;
  referenceNumber: string;
  status: string;
  systemChecks: any | null;
  creditCheck: any | null;
  assignedTo: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationWithRelations extends Application {
  applicant: Applicant | null;
  addresses: Address[];
  debts: Debt[];
  assets: Asset[];
  incomeExpenditure: IncomeExpenditure | null;
}

// ─── Input Types ───────────────────────────────

export interface CreateApplicantInput {
  title?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  niNumber?: string;
  maritalStatus?: string;
  dependants?: number;
  employment?: string;
  email?: string;
  phone?: string;
}

export interface CreateAddressInput {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  isCurrent?: boolean;
  residentFrom?: string;
  residentTo?: string;
}

export interface CreateDebtInput {
  creditor: string;
  type: string;
  amount: number;
  monthlyPayment?: number;
  accountRef?: string;
}

export interface CreateAssetInput {
  type: string;
  description: string;
  value: number;
  outstanding?: number;
  isEssential?: boolean;
}

export interface CreateIncomeExpenditureInput {
  income: Record<string, number>;
  expenditure: Record<string, number>;
}

export interface CreateApplicationInput {
  referenceNumber?: string;
  status?: string;
  applicant?: CreateApplicantInput;
  addresses?: CreateAddressInput[];
  debts?: CreateDebtInput[];
  assets?: CreateAssetInput[];
  incomeExpenditure?: CreateIncomeExpenditureInput;
  systemChecks?: any;
  creditCheck?: any;
  assignedTo?: string;
  submittedAt?: string;
}

export interface ListApplicationsParams {
  status?: string;
  assignedTo?: string;
  page?: number;
  pageSize?: number;
}

// ─── Repository ────────────────────────────────

export class ApplicationRepository {
  constructor(private db: Database.Database) {}

  private generateReferenceNumber(): string {
    const year = new Date().getFullYear();
    const seq = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `IAAS-${year}-${seq}`;
  }

  private mapApplicationRow(row: any): Application {
    return {
      id: row.id,
      referenceNumber: row.reference_number,
      status: row.status,
      systemChecks: row.system_checks ? JSON.parse(row.system_checks) : null,
      creditCheck: row.credit_check ? JSON.parse(row.credit_check) : null,
      assignedTo: row.assigned_to,
      submittedAt: row.submitted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapApplicantRow(row: any): Applicant {
    return {
      id: row.id,
      applicationId: row.application_id,
      title: row.title,
      firstName: row.first_name,
      lastName: row.last_name,
      dateOfBirth: row.date_of_birth,
      niNumber: row.ni_number,
      maritalStatus: row.marital_status,
      dependants: row.dependants,
      employment: row.employment,
      email: row.email,
      phone: row.phone,
    };
  }

  private mapAddressRow(row: any): Address {
    return {
      id: row.id,
      applicationId: row.application_id,
      line1: row.line1,
      line2: row.line2,
      city: row.city,
      postcode: row.postcode,
      isCurrent: Boolean(row.is_current),
      residentFrom: row.resident_from,
      residentTo: row.resident_to,
    };
  }

  private mapDebtRow(row: any): Debt {
    return {
      id: row.id,
      applicationId: row.application_id,
      creditor: row.creditor,
      type: row.type,
      amount: row.amount,
      monthlyPayment: row.monthly_payment,
      accountRef: row.account_ref,
    };
  }

  private mapAssetRow(row: any): Asset {
    return {
      id: row.id,
      applicationId: row.application_id,
      type: row.type,
      description: row.description,
      value: row.value,
      outstanding: row.outstanding,
      isEssential: Boolean(row.is_essential),
    };
  }

  private mapIncomeExpenditureRow(row: any): IncomeExpenditure {
    return {
      id: row.id,
      applicationId: row.application_id,
      income: JSON.parse(row.income),
      expenditure: JSON.parse(row.expenditure),
    };
  }

  create(input: CreateApplicationInput): Application {
    const id = randomUUID();
    const now = new Date().toISOString();
    const referenceNumber = input.referenceNumber || this.generateReferenceNumber();

    const insertApp = this.db.prepare(`
      INSERT INTO applications (id, reference_number, status, system_checks, credit_check, assigned_to, submitted_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      insertApp.run(
        id,
        referenceNumber,
        input.status || 'draft',
        input.systemChecks ? JSON.stringify(input.systemChecks) : null,
        input.creditCheck ? JSON.stringify(input.creditCheck) : null,
        input.assignedTo || null,
        input.submittedAt || null,
        now,
        now
      );

      if (input.applicant) {
        this.insertApplicant(id, input.applicant);
      }

      if (input.addresses) {
        for (const addr of input.addresses) {
          this.insertAddress(id, addr);
        }
      }

      if (input.debts) {
        for (const debt of input.debts) {
          this.insertDebt(id, debt);
        }
      }

      if (input.assets) {
        for (const asset of input.assets) {
          this.insertAsset(id, asset);
        }
      }

      if (input.incomeExpenditure) {
        this.insertIncomeExpenditure(id, input.incomeExpenditure);
      }
    });

    transaction();

    return this.findById(id)!;
  }

  findById(id: string): Application | null {
    const row = this.db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as any;
    return row ? this.mapApplicationRow(row) : null;
  }

  findByReference(ref: string): Application | null {
    const row = this.db.prepare('SELECT * FROM applications WHERE reference_number = ?').get(ref) as any;
    return row ? this.mapApplicationRow(row) : null;
  }

  list(params: ListApplicationsParams = {}): { data: Application[]; total: number } {
    const { status, assignedTo, page = 1, pageSize = 20 } = params;
    const conditions: string[] = [];
    const values: any[] = [];

    if (status) {
      conditions.push('status = ?');
      values.push(status);
    }

    if (assignedTo) {
      conditions.push('assigned_to = ?');
      values.push(assignedTo);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = this.db.prepare(`SELECT COUNT(*) as count FROM applications ${where}`).get(...values) as any;
    const total = countRow.count;

    const offset = (page - 1) * pageSize;
    const rows = this.db.prepare(
      `SELECT * FROM applications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...values, pageSize, offset) as any[];

    return {
      data: rows.map(row => this.mapApplicationRow(row)),
      total,
    };
  }

  update(id: string, data: Partial<CreateApplicationInput>): Application {
    const now = new Date().toISOString();
    const sets: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (data.status !== undefined) {
      sets.push('status = ?');
      values.push(data.status);
    }
    if (data.assignedTo !== undefined) {
      sets.push('assigned_to = ?');
      values.push(data.assignedTo);
    }
    if (data.submittedAt !== undefined) {
      sets.push('submitted_at = ?');
      values.push(data.submittedAt);
    }
    if (data.systemChecks !== undefined) {
      sets.push('system_checks = ?');
      values.push(JSON.stringify(data.systemChecks));
    }
    if (data.creditCheck !== undefined) {
      sets.push('credit_check = ?');
      values.push(JSON.stringify(data.creditCheck));
    }

    values.push(id);
    this.db.prepare(`UPDATE applications SET ${sets.join(', ')} WHERE id = ?`).run(...values);

    // Update related entities if provided
    if (data.applicant) {
      const existing = this.db.prepare('SELECT id FROM applicants WHERE application_id = ?').get(id) as any;
      if (existing) {
        this.updateApplicant(existing.id, data.applicant);
      } else {
        this.insertApplicant(id, data.applicant);
      }
    }

    if (data.incomeExpenditure) {
      const existing = this.db.prepare('SELECT id FROM income_expenditure WHERE application_id = ?').get(id) as any;
      if (existing) {
        this.db.prepare('UPDATE income_expenditure SET income = ?, expenditure = ? WHERE id = ?').run(
          JSON.stringify(data.incomeExpenditure.income),
          JSON.stringify(data.incomeExpenditure.expenditure),
          existing.id
        );
      } else {
        this.insertIncomeExpenditure(id, data.incomeExpenditure);
      }
    }

    return this.findById(id)!;
  }

  updateStatus(id: string, status: string): void {
    const now = new Date().toISOString();
    this.db.prepare('UPDATE applications SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM applications WHERE id = ?').run(id);
  }

  // ─── Related entities ────────────────────────

  addDebt(applicationId: string, debt: CreateDebtInput): Debt {
    const id = this.insertDebt(applicationId, debt);
    const row = this.db.prepare('SELECT * FROM debts WHERE id = ?').get(id) as any;
    return this.mapDebtRow(row);
  }

  addAsset(applicationId: string, asset: CreateAssetInput): Asset {
    const id = this.insertAsset(applicationId, asset);
    const row = this.db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as any;
    return this.mapAssetRow(row);
  }

  addAddress(applicationId: string, address: CreateAddressInput): Address {
    const id = this.insertAddress(applicationId, address);
    const row = this.db.prepare('SELECT * FROM addresses WHERE id = ?').get(id) as any;
    return this.mapAddressRow(row);
  }

  setApplicant(applicationId: string, applicant: CreateApplicantInput): Applicant {
    const existing = this.db.prepare('SELECT id FROM applicants WHERE application_id = ?').get(applicationId) as any;
    if (existing) {
      this.updateApplicant(existing.id, applicant);
      const row = this.db.prepare('SELECT * FROM applicants WHERE id = ?').get(existing.id) as any;
      return this.mapApplicantRow(row);
    }
    const id = this.insertApplicant(applicationId, applicant);
    const row = this.db.prepare('SELECT * FROM applicants WHERE id = ?').get(id) as any;
    return this.mapApplicantRow(row);
  }

  setIncomeExpenditure(applicationId: string, ie: CreateIncomeExpenditureInput): IncomeExpenditure {
    const existing = this.db.prepare('SELECT id FROM income_expenditure WHERE application_id = ?').get(applicationId) as any;
    if (existing) {
      this.db.prepare('UPDATE income_expenditure SET income = ?, expenditure = ? WHERE id = ?').run(
        JSON.stringify(ie.income),
        JSON.stringify(ie.expenditure),
        existing.id
      );
      const row = this.db.prepare('SELECT * FROM income_expenditure WHERE id = ?').get(existing.id) as any;
      return this.mapIncomeExpenditureRow(row);
    }
    const id = this.insertIncomeExpenditure(applicationId, ie);
    const row = this.db.prepare('SELECT * FROM income_expenditure WHERE id = ?').get(id) as any;
    return this.mapIncomeExpenditureRow(row);
  }

  getWithRelations(id: string): ApplicationWithRelations | null {
    const app = this.findById(id);
    if (!app) return null;

    const applicantRow = this.db.prepare('SELECT * FROM applicants WHERE application_id = ?').get(id) as any;
    const addressRows = this.db.prepare('SELECT * FROM addresses WHERE application_id = ?').all(id) as any[];
    const debtRows = this.db.prepare('SELECT * FROM debts WHERE application_id = ?').all(id) as any[];
    const assetRows = this.db.prepare('SELECT * FROM assets WHERE application_id = ?').all(id) as any[];
    const ieRow = this.db.prepare('SELECT * FROM income_expenditure WHERE application_id = ?').get(id) as any;

    return {
      ...app,
      applicant: applicantRow ? this.mapApplicantRow(applicantRow) : null,
      addresses: addressRows.map(r => this.mapAddressRow(r)),
      debts: debtRows.map(r => this.mapDebtRow(r)),
      assets: assetRows.map(r => this.mapAssetRow(r)),
      incomeExpenditure: ieRow ? this.mapIncomeExpenditureRow(ieRow) : null,
    };
  }

  getDebts(applicationId: string): Debt[] {
    const rows = this.db.prepare('SELECT * FROM debts WHERE application_id = ?').all(applicationId) as any[];
    return rows.map(r => this.mapDebtRow(r));
  }

  getAssets(applicationId: string): Asset[] {
    const rows = this.db.prepare('SELECT * FROM assets WHERE application_id = ?').all(applicationId) as any[];
    return rows.map(r => this.mapAssetRow(r));
  }

  getAddresses(applicationId: string): Address[] {
    const rows = this.db.prepare('SELECT * FROM addresses WHERE application_id = ?').all(applicationId) as any[];
    return rows.map(r => this.mapAddressRow(r));
  }

  removeDebt(debtId: string): void {
    this.db.prepare('DELETE FROM debts WHERE id = ?').run(debtId);
  }

  removeAsset(assetId: string): void {
    this.db.prepare('DELETE FROM assets WHERE id = ?').run(assetId);
  }

  removeAddress(addressId: string): void {
    this.db.prepare('DELETE FROM addresses WHERE id = ?').run(addressId);
  }

  // ─── Private helpers ─────────────────────────

  private insertApplicant(applicationId: string, input: CreateApplicantInput): string {
    const id = randomUUID();
    this.db.prepare(`
      INSERT INTO applicants (id, application_id, title, first_name, last_name, date_of_birth, ni_number, marital_status, dependants, employment, email, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, applicationId,
      input.title || null,
      input.firstName,
      input.lastName,
      input.dateOfBirth || null,
      input.niNumber || null,
      input.maritalStatus || null,
      input.dependants ?? 0,
      input.employment || null,
      input.email || null,
      input.phone || null
    );
    return id;
  }

  private updateApplicant(id: string, input: Partial<CreateApplicantInput>): void {
    const sets: string[] = [];
    const values: any[] = [];

    if (input.title !== undefined) { sets.push('title = ?'); values.push(input.title || null); }
    if (input.firstName !== undefined) { sets.push('first_name = ?'); values.push(input.firstName); }
    if (input.lastName !== undefined) { sets.push('last_name = ?'); values.push(input.lastName); }
    if (input.dateOfBirth !== undefined) { sets.push('date_of_birth = ?'); values.push(input.dateOfBirth || null); }
    if (input.niNumber !== undefined) { sets.push('ni_number = ?'); values.push(input.niNumber || null); }
    if (input.maritalStatus !== undefined) { sets.push('marital_status = ?'); values.push(input.maritalStatus || null); }
    if (input.dependants !== undefined) { sets.push('dependants = ?'); values.push(input.dependants); }
    if (input.employment !== undefined) { sets.push('employment = ?'); values.push(input.employment || null); }
    if (input.email !== undefined) { sets.push('email = ?'); values.push(input.email || null); }
    if (input.phone !== undefined) { sets.push('phone = ?'); values.push(input.phone || null); }

    if (sets.length > 0) {
      values.push(id);
      this.db.prepare(`UPDATE applicants SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    }
  }

  private insertAddress(applicationId: string, input: CreateAddressInput): string {
    const id = randomUUID();
    this.db.prepare(`
      INSERT INTO addresses (id, application_id, line1, line2, city, postcode, is_current, resident_from, resident_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, applicationId,
      input.line1,
      input.line2 || null,
      input.city,
      input.postcode,
      input.isCurrent ? 1 : 0,
      input.residentFrom || null,
      input.residentTo || null
    );
    return id;
  }

  private insertDebt(applicationId: string, input: CreateDebtInput): string {
    const id = randomUUID();
    this.db.prepare(`
      INSERT INTO debts (id, application_id, creditor, type, amount, monthly_payment, account_ref)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, applicationId,
      input.creditor,
      input.type,
      input.amount,
      input.monthlyPayment ?? 0,
      input.accountRef || null
    );
    return id;
  }

  private insertAsset(applicationId: string, input: CreateAssetInput): string {
    const id = randomUUID();
    this.db.prepare(`
      INSERT INTO assets (id, application_id, type, description, value, outstanding, is_essential)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, applicationId,
      input.type,
      input.description,
      input.value,
      input.outstanding ?? 0,
      input.isEssential ? 1 : 0
    );
    return id;
  }

  private insertIncomeExpenditure(applicationId: string, input: CreateIncomeExpenditureInput): string {
    const id = randomUUID();
    this.db.prepare(`
      INSERT INTO income_expenditure (id, application_id, income, expenditure)
      VALUES (?, ?, ?, ?)
    `).run(
      id, applicationId,
      JSON.stringify(input.income),
      JSON.stringify(input.expenditure)
    );
    return id;
  }
}
