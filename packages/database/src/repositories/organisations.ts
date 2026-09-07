import type { DbDriver } from '../driver';
import { randomUUID } from 'crypto';

// ─── Types ─────────────────────────────────────

export interface Organisation {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  status: string;
  registrationNumber: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  addressLine1: string | null;
  addressCity: string | null;
  addressPostcode: string | null;
  metadata: any | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganisationInput {
  name: string;
  type: string;
  parentId?: string;
  status?: string;
  registrationNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  addressLine1?: string;
  addressCity?: string;
  addressPostcode?: string;
  metadata?: any;
}

export interface ListOrganisationsParams {
  type?: string;
  status?: string;
  parentId?: string;
  page?: number;
  pageSize?: number;
}

// ─── Repository ────────────────────────────────

export class OrganisationRepository {
  constructor(private driver: DbDriver) {}

  private mapRow(row: any): Organisation {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      parentId: row.parent_id,
      status: row.status,
      registrationNumber: row.registration_number,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      addressLine1: row.address_line1,
      addressCity: row.address_city,
      addressPostcode: row.address_postcode,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<Organisation | null> {
    const row = await this.driver.get('SELECT * FROM organisations WHERE id = ?', [id]);
    return row ? this.mapRow(row) : null;
  }

  async findByName(name: string): Promise<Organisation | null> {
    const row = await this.driver.get('SELECT * FROM organisations WHERE name = ?', [name]);
    return row ? this.mapRow(row) : null;
  }

  async list(params: ListOrganisationsParams = {}): Promise<{ data: Organisation[]; total: number }> {
    const { type, status, parentId, page = 1, pageSize = 50 } = params;
    const conditions: string[] = [];
    const values: any[] = [];

    if (type) {
      conditions.push('type = ?');
      values.push(type);
    }
    if (status) {
      conditions.push('status = ?');
      values.push(status);
    }
    if (parentId !== undefined) {
      if (parentId === null) {
        conditions.push('parent_id IS NULL');
      } else {
        conditions.push('parent_id = ?');
        values.push(parentId);
      }
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await this.driver.get(`SELECT COUNT(*) as count FROM organisations ${where}`, values);
    // Number(): PostgreSQL returns COUNT(*) as a bigint, which `pg` hands back as
    // a string. `total` is declared a number and callers do arithmetic on it.
    const total = Number(countRow.count);

    const offset = (page - 1) * pageSize;
    const rows = await this.driver.all(
      `SELECT * FROM organisations ${where} ORDER BY name ASC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return {
      data: rows.map(row => this.mapRow(row)),
      total,
    };
  }

  async create(input: CreateOrganisationInput): Promise<Organisation> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.driver.run(`
      INSERT INTO organisations (id, name, type, parent_id, status, registration_number, contact_email, contact_phone, address_line1, address_city, address_postcode, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      input.name,
      input.type,
      input.parentId || null,
      input.status || 'active',
      input.registrationNumber || null,
      input.contactEmail || null,
      input.contactPhone || null,
      input.addressLine1 || null,
      input.addressCity || null,
      input.addressPostcode || null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      now,
      now,
    ]);

    return (await this.findById(id))!;
  }

  async update(id: string, data: Partial<CreateOrganisationInput>): Promise<Organisation> {
    const now = new Date().toISOString();
    const sets: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
    if (data.type !== undefined) { sets.push('type = ?'); values.push(data.type); }
    if (data.parentId !== undefined) { sets.push('parent_id = ?'); values.push(data.parentId || null); }
    if (data.status !== undefined) { sets.push('status = ?'); values.push(data.status); }
    if (data.registrationNumber !== undefined) { sets.push('registration_number = ?'); values.push(data.registrationNumber || null); }
    if (data.contactEmail !== undefined) { sets.push('contact_email = ?'); values.push(data.contactEmail || null); }
    if (data.contactPhone !== undefined) { sets.push('contact_phone = ?'); values.push(data.contactPhone || null); }
    if (data.addressLine1 !== undefined) { sets.push('address_line1 = ?'); values.push(data.addressLine1 || null); }
    if (data.addressCity !== undefined) { sets.push('address_city = ?'); values.push(data.addressCity || null); }
    if (data.addressPostcode !== undefined) { sets.push('address_postcode = ?'); values.push(data.addressPostcode || null); }
    if (data.metadata !== undefined) { sets.push('metadata = ?'); values.push(data.metadata ? JSON.stringify(data.metadata) : null); }

    values.push(id);
    await this.driver.run(`UPDATE organisations SET ${sets.join(', ')} WHERE id = ?`, values);

    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    await this.driver.run('DELETE FROM organisations WHERE id = ?', [id]);
  }

  async getChildren(parentId: string): Promise<Organisation[]> {
    const rows = await this.driver.all('SELECT * FROM organisations WHERE parent_id = ? ORDER BY name', [parentId]);
    return rows.map(r => this.mapRow(r));
  }
}
