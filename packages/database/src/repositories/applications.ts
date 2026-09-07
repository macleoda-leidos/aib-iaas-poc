import type { DbDriver } from '../driver';
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
  /**
   * The debtor this application is about, and what ownership checks compare
   * against. Distinct from `assignedTo`, which is the member of staff handling it.
   * Null means no debtor owns it — a staff-created case, or one begun anonymously —
   * which a debtor can therefore never match.
   */
  debtorUserId: string | null;
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
  debtorUserId?: string | null;
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
  /**
   * Restrict to one debtor's applications. The route layer sets this from the
   * authenticated user rather than from the query string when the caller is a
   * debtor, so the filter cannot be widened by the client.
   */
  debtorUserId?: string;
  page?: number;
  pageSize?: number;
}

// ─── Repository ────────────────────────────────

export class ApplicationRepository {
  constructor(private driver: DbDriver) {}

  /** Purely local — no query, so it needs no driver and cannot fail mid-transaction. */
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
      debtorUserId: row.debtor_user_id ?? null,
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

  async create(input: CreateApplicationInput): Promise<Application> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const referenceNumber = input.referenceNumber || this.generateReferenceNumber();

    // An application and its applicant, addresses, debts, assets and income
    // together are one record as far as a caller is concerned — a half-written one
    // is worse than none. `tx` is threaded into every helper below rather than
    // reaching for `this.driver`, because under PostgreSQL only `tx` is bound to
    // the connection holding the transaction; anything else autocommits outside it
    // and survives the rollback.
    await this.driver.transaction(async tx => {
      await tx.run(`
        INSERT INTO applications (id, reference_number, status, debtor_user_id, system_checks, credit_check, assigned_to, submitted_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        referenceNumber,
        input.status || 'draft',
        input.debtorUserId ?? null,
        input.systemChecks ? JSON.stringify(input.systemChecks) : null,
        input.creditCheck ? JSON.stringify(input.creditCheck) : null,
        input.assignedTo || null,
        input.submittedAt || null,
        now,
        now,
      ]);

      if (input.applicant) {
        await this.insertApplicant(tx, id, input.applicant);
      }

      // Array.isArray, not truthiness. These come from a request body, and a JSON
      // object is truthy but not iterable — `for...of` over `{}` throws a TypeError,
      // which surfaced as a 500 rather than a 400. The `/apply` auto-save sends
      // `assets: {}` when the applicant has entered none, so this was reachable from
      // the real client; it only stayed hidden because the journey sends that field
      // on update (where it is ignored) rather than on create.
      if (Array.isArray(input.addresses)) {
        for (const addr of input.addresses) {
          await this.insertAddress(tx, id, addr);
        }
      }

      if (Array.isArray(input.debts)) {
        for (const debt of input.debts) {
          await this.insertDebt(tx, id, debt);
        }
      }

      if (Array.isArray(input.assets)) {
        for (const asset of input.assets) {
          await this.insertAsset(tx, id, asset);
        }
      }

      if (input.incomeExpenditure) {
        await this.insertIncomeExpenditure(tx, id, input.incomeExpenditure);
      }
    });

    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<Application | null> {
    const row = await this.driver.get('SELECT * FROM applications WHERE id = ?', [id]);
    return row ? this.mapApplicationRow(row) : null;
  }

  async findByReference(ref: string): Promise<Application | null> {
    const row = await this.driver.get('SELECT * FROM applications WHERE reference_number = ?', [ref]);
    return row ? this.mapApplicationRow(row) : null;
  }

  async list(params: ListApplicationsParams = {}): Promise<{ data: Application[]; total: number }> {
    const { status, assignedTo, debtorUserId, page = 1, pageSize = 20 } = params;
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

    if (debtorUserId) {
      conditions.push('debtor_user_id = ?');
      values.push(debtorUserId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await this.driver.get(`SELECT COUNT(*) as count FROM applications ${where}`, values);
    // Number(): PostgreSQL returns COUNT(*) as a bigint, which `pg` hands back as
    // a string. The route layer divides `total` by pageSize to get totalPages.
    const total = Number(countRow.count);

    const offset = (page - 1) * pageSize;
    const rows = await this.driver.all(
      `SELECT * FROM applications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return {
      data: rows.map(row => this.mapApplicationRow(row)),
      total,
    };
  }

  async update(id: string, data: Partial<CreateApplicationInput>): Promise<Application> {
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
    if (data.debtorUserId !== undefined) {
      // Reassignable, so that an application begun anonymously can be claimed by
      // the debtor once they authenticate. The route layer decides who may set it;
      // the repository only records it.
      sets.push('debtor_user_id = ?');
      values.push(data.debtorUserId || null);
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
    await this.driver.run(`UPDATE applications SET ${sets.join(', ')} WHERE id = ?`, values);

    // Update related entities if provided
    if (data.applicant) {
      const existing = await this.driver.get('SELECT id FROM applicants WHERE application_id = ?', [id]);
      if (existing) {
        await this.updateApplicant(this.driver, existing.id, data.applicant);
      } else {
        await this.insertApplicant(this.driver, id, data.applicant);
      }
    }

    if (data.incomeExpenditure) {
      const existing = await this.driver.get('SELECT id FROM income_expenditure WHERE application_id = ?', [id]);
      if (existing) {
        await this.driver.run('UPDATE income_expenditure SET income = ?, expenditure = ? WHERE id = ?', [
          JSON.stringify(data.incomeExpenditure.income),
          JSON.stringify(data.incomeExpenditure.expenditure),
          existing.id,
        ]);
      } else {
        await this.insertIncomeExpenditure(this.driver, id, data.incomeExpenditure);
      }
    }

    // Addresses, debts and assets are *replaced* rather than merged, because the
    // client that sends them is an auto-saving form which posts the whole current
    // list on every save — so the list it sends is the complete intended state, and
    // appending would duplicate every row on each keystroke.
    //
    // These were previously not handled here at all, so an applicant's addresses,
    // debts and assets were accepted by the endpoint and silently dropped.
    if (Array.isArray(data.addresses)) {
      await this.replaceAddresses(id, data.addresses);
    }
    if (Array.isArray(data.debts)) {
      await this.replaceDebts(id, data.debts);
    }
    if (Array.isArray(data.assets)) {
      await this.replaceAssets(id, data.assets);
    }

    return (await this.findById(id))!;
  }

  /**
   * Replace an application's addresses with exactly this list.
   *
   * Delete-then-insert inside one transaction: a failure part-way through must not
   * leave the application with no addresses, which is what a delete outside a
   * transaction would risk.
   */
  async replaceAddresses(applicationId: string, addresses: CreateAddressInput[]): Promise<void> {
    await this.driver.transaction(async tx => {
      await tx.run('DELETE FROM addresses WHERE application_id = ?', [applicationId]);
      for (const address of addresses) {
        await this.insertAddress(tx, applicationId, address);
      }
    });
  }

  /** Replace an application's debts with exactly this list. See `replaceAddresses`. */
  async replaceDebts(applicationId: string, debts: CreateDebtInput[]): Promise<void> {
    await this.driver.transaction(async tx => {
      await tx.run('DELETE FROM debts WHERE application_id = ?', [applicationId]);
      for (const debt of debts) {
        await this.insertDebt(tx, applicationId, debt);
      }
    });
  }

  /** Replace an application's assets with exactly this list. See `replaceAddresses`. */
  async replaceAssets(applicationId: string, assets: CreateAssetInput[]): Promise<void> {
    await this.driver.transaction(async tx => {
      await tx.run('DELETE FROM assets WHERE application_id = ?', [applicationId]);
      for (const asset of assets) {
        await this.insertAsset(tx, applicationId, asset);
      }
    });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    const now = new Date().toISOString();
    await this.driver.run('UPDATE applications SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);
  }

  async delete(id: string): Promise<void> {
    await this.driver.run('DELETE FROM applications WHERE id = ?', [id]);
  }

  // ─── Related entities ────────────────────────

  async addDebt(applicationId: string, debt: CreateDebtInput): Promise<Debt> {
    const id = await this.insertDebt(this.driver, applicationId, debt);
    const row = await this.driver.get('SELECT * FROM debts WHERE id = ?', [id]);
    return this.mapDebtRow(row);
  }

  async addAsset(applicationId: string, asset: CreateAssetInput): Promise<Asset> {
    const id = await this.insertAsset(this.driver, applicationId, asset);
    const row = await this.driver.get('SELECT * FROM assets WHERE id = ?', [id]);
    return this.mapAssetRow(row);
  }

  async addAddress(applicationId: string, address: CreateAddressInput): Promise<Address> {
    const id = await this.insertAddress(this.driver, applicationId, address);
    const row = await this.driver.get('SELECT * FROM addresses WHERE id = ?', [id]);
    return this.mapAddressRow(row);
  }

  async setApplicant(applicationId: string, applicant: CreateApplicantInput): Promise<Applicant> {
    const existing = await this.driver.get('SELECT id FROM applicants WHERE application_id = ?', [applicationId]);
    if (existing) {
      await this.updateApplicant(this.driver, existing.id, applicant);
      const row = await this.driver.get('SELECT * FROM applicants WHERE id = ?', [existing.id]);
      return this.mapApplicantRow(row);
    }
    const id = await this.insertApplicant(this.driver, applicationId, applicant);
    const row = await this.driver.get('SELECT * FROM applicants WHERE id = ?', [id]);
    return this.mapApplicantRow(row);
  }

  async setIncomeExpenditure(applicationId: string, ie: CreateIncomeExpenditureInput): Promise<IncomeExpenditure> {
    const existing = await this.driver.get('SELECT id FROM income_expenditure WHERE application_id = ?', [applicationId]);
    if (existing) {
      await this.driver.run('UPDATE income_expenditure SET income = ?, expenditure = ? WHERE id = ?', [
        JSON.stringify(ie.income),
        JSON.stringify(ie.expenditure),
        existing.id,
      ]);
      const row = await this.driver.get('SELECT * FROM income_expenditure WHERE id = ?', [existing.id]);
      return this.mapIncomeExpenditureRow(row);
    }
    const id = await this.insertIncomeExpenditure(this.driver, applicationId, ie);
    const row = await this.driver.get('SELECT * FROM income_expenditure WHERE id = ?', [id]);
    return this.mapIncomeExpenditureRow(row);
  }

  async getWithRelations(id: string): Promise<ApplicationWithRelations | null> {
    const app = await this.findById(id);
    if (!app) return null;

    const applicantRow = await this.driver.get('SELECT * FROM applicants WHERE application_id = ?', [id]);
    const addressRows = await this.driver.all('SELECT * FROM addresses WHERE application_id = ?', [id]);
    const debtRows = await this.driver.all('SELECT * FROM debts WHERE application_id = ?', [id]);
    const assetRows = await this.driver.all('SELECT * FROM assets WHERE application_id = ?', [id]);
    const ieRow = await this.driver.get('SELECT * FROM income_expenditure WHERE application_id = ?', [id]);

    return {
      ...app,
      applicant: applicantRow ? this.mapApplicantRow(applicantRow) : null,
      addresses: addressRows.map(r => this.mapAddressRow(r)),
      debts: debtRows.map(r => this.mapDebtRow(r)),
      assets: assetRows.map(r => this.mapAssetRow(r)),
      incomeExpenditure: ieRow ? this.mapIncomeExpenditureRow(ieRow) : null,
    };
  }

  async getDebts(applicationId: string): Promise<Debt[]> {
    const rows = await this.driver.all('SELECT * FROM debts WHERE application_id = ?', [applicationId]);
    return rows.map(r => this.mapDebtRow(r));
  }

  async getAssets(applicationId: string): Promise<Asset[]> {
    const rows = await this.driver.all('SELECT * FROM assets WHERE application_id = ?', [applicationId]);
    return rows.map(r => this.mapAssetRow(r));
  }

  async getAddresses(applicationId: string): Promise<Address[]> {
    const rows = await this.driver.all('SELECT * FROM addresses WHERE application_id = ?', [applicationId]);
    return rows.map(r => this.mapAddressRow(r));
  }

  async removeDebt(debtId: string): Promise<void> {
    await this.driver.run('DELETE FROM debts WHERE id = ?', [debtId]);
  }

  async removeAsset(assetId: string): Promise<void> {
    await this.driver.run('DELETE FROM assets WHERE id = ?', [assetId]);
  }

  async removeAddress(addressId: string): Promise<void> {
    await this.driver.run('DELETE FROM addresses WHERE id = ?', [addressId]);
  }

  // ─── Private helpers ─────────────────────────
  //
  // Each takes the driver to write through rather than using `this.driver`, so
  // create() can pass the transaction-bound one and have the inserts land inside
  // the transaction. Callers outside a transaction pass `this.driver`.

  private async insertApplicant(driver: DbDriver, applicationId: string, input: CreateApplicantInput): Promise<string> {
    const id = randomUUID();
    await driver.run(`
      INSERT INTO applicants (id, application_id, title, first_name, last_name, date_of_birth, ni_number, marital_status, dependants, employment, email, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
      input.phone || null,
    ]);
    return id;
  }

  private async updateApplicant(driver: DbDriver, id: string, input: Partial<CreateApplicantInput>): Promise<void> {
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
      await driver.run(`UPDATE applicants SET ${sets.join(', ')} WHERE id = ?`, values);
    }
  }

  private async insertAddress(driver: DbDriver, applicationId: string, input: CreateAddressInput): Promise<string> {
    const id = randomUUID();
    await driver.run(`
      INSERT INTO addresses (id, application_id, line1, line2, city, postcode, is_current, resident_from, resident_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, applicationId,
      input.line1,
      input.line2 || null,
      input.city,
      input.postcode,
      // A real boolean, not 1/0: is_current is BOOLEAN in PostgreSQL, which rejects
      // an integer. The SQLite adapter converts for its own INTEGER column.
      input.isCurrent ?? false,
      input.residentFrom || null,
      input.residentTo || null,
    ]);
    return id;
  }

  private async insertDebt(driver: DbDriver, applicationId: string, input: CreateDebtInput): Promise<string> {
    const id = randomUUID();
    await driver.run(`
      INSERT INTO debts (id, application_id, creditor, type, amount, monthly_payment, account_ref)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id, applicationId,
      input.creditor,
      input.type,
      input.amount,
      input.monthlyPayment ?? 0,
      input.accountRef || null,
    ]);
    return id;
  }

  private async insertAsset(driver: DbDriver, applicationId: string, input: CreateAssetInput): Promise<string> {
    const id = randomUUID();
    await driver.run(`
      INSERT INTO assets (id, application_id, type, description, value, outstanding, is_essential)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id, applicationId,
      input.type,
      input.description,
      input.value,
      input.outstanding ?? 0,
      // Boolean for the same reason as is_current above.
      input.isEssential ?? false,
    ]);
    return id;
  }

  private async insertIncomeExpenditure(driver: DbDriver, applicationId: string, input: CreateIncomeExpenditureInput): Promise<string> {
    const id = randomUUID();
    await driver.run(`
      INSERT INTO income_expenditure (id, application_id, income, expenditure)
      VALUES (?, ?, ?, ?)
    `, [
      id, applicationId,
      JSON.stringify(input.income),
      JSON.stringify(input.expenditure),
    ]);
    return id;
  }
}
