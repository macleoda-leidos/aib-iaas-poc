import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.ORG_DB_PATH || './data/organisations.db';
let db: Database.Database;

export function getOrgDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initOrgDb(): void {
  const database = getOrgDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS organisations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('aib', 'money_adviser', 'creditor', 'supplier', 'trustee', 'payment_distributor', 'government')),
      parent_id TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deregistered', 'pending_approval')),
      registration_number TEXT,
      regulated_by TEXT,
      address_line1 TEXT,
      address_city TEXT,
      address_postcode TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      website TEXT,
      metadata JSON,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (parent_id) REFERENCES organisations(id)
    );

    CREATE TABLE IF NOT EXISTS organisation_relationships (
      id TEXT PRIMARY KEY,
      parent_org_id TEXT NOT NULL,
      child_org_id TEXT NOT NULL,
      relationship_type TEXT NOT NULL CHECK (relationship_type IN ('subsidiary', 'branch', 'franchise', 'partner', 'contracted_supplier', 'delegated_authority')),
      status TEXT NOT NULL DEFAULT 'active',
      effective_from TEXT NOT NULL DEFAULT (datetime('now')),
      effective_to TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (parent_org_id) REFERENCES organisations(id),
      FOREIGN KEY (child_org_id) REFERENCES organisations(id)
    );

    CREATE INDEX IF NOT EXISTS idx_org_type ON organisations(type);
    CREATE INDEX IF NOT EXISTS idx_org_parent ON organisations(parent_id);
    CREATE INDEX IF NOT EXISTS idx_org_status ON organisations(status);
    CREATE INDEX IF NOT EXISTS idx_rel_parent ON organisation_relationships(parent_org_id);
    CREATE INDEX IF NOT EXISTS idx_rel_child ON organisation_relationships(child_org_id);
  `);

  // Seed with AiB org hierarchy and sample organisations
  seedOrganisations(database);
  console.log('[Organisation DB] Initialized with seed data');
}

function seedOrganisations(db: Database.Database): void {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO organisations (id, name, type, parent_id, status, registration_number, contact_email, address_city, address_postcode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRel = db.prepare(`
    INSERT OR IGNORE INTO organisation_relationships (id, parent_org_id, child_org_id, relationship_type, status)
    VALUES (?, ?, ?, ?, 'active')
  `);

  // AiB Organisation Hierarchy
  insert.run('ORG-AIB-001', 'Accountant in Bankruptcy', 'aib', null, 'active', 'SG-AIB-001', 'admin@aib.example.gov.scot', 'Kilwinning', 'KA13 6AA');
  insert.run('ORG-AIB-002', 'AiB - Case Administration', 'aib', 'ORG-AIB-001', 'active', null, 'cases@aib.example.gov.scot', 'Kilwinning', 'KA13 6AA');
  insert.run('ORG-AIB-003', 'AiB - DAS Team', 'aib', 'ORG-AIB-001', 'active', null, 'das@aib.example.gov.scot', 'Kilwinning', 'KA13 6AA');
  insert.run('ORG-AIB-004', 'AiB - Policy & Compliance', 'aib', 'ORG-AIB-001', 'active', null, 'policy@aib.example.gov.scot', 'Kilwinning', 'KA13 6AA');

  // Money Advisers
  insert.run('ORG-MA-001', 'Citizens Advice Scotland', 'money_adviser', null, 'active', 'MA-CAS-001', 'info@cas.example.org', 'Edinburgh', 'EH3 6ST');
  insert.run('ORG-MA-002', 'CAS - Edinburgh Bureau', 'money_adviser', 'ORG-MA-001', 'active', 'MA-CAS-EDI', 'edinburgh@cas.example.org', 'Edinburgh', 'EH1 2AA');
  insert.run('ORG-MA-003', 'CAS - Glasgow Bureau', 'money_adviser', 'ORG-MA-001', 'active', 'MA-CAS-GLA', 'glasgow@cas.example.org', 'Glasgow', 'G2 1AB');
  insert.run('ORG-MA-004', 'StepChange Scotland', 'money_adviser', null, 'active', 'MA-SC-001', 'info@stepchange.example.org', 'Glasgow', 'G1 1AA');
  insert.run('ORG-MA-005', 'Highland Debt Solutions Ltd', 'money_adviser', null, 'suspended', 'MA-HDS-001', 'info@hds.example.com', 'Inverness', 'IV1 1AA');

  // Creditors
  insert.run('ORG-CR-001', 'Royal Bank of Scotland (Sample)', 'creditor', null, 'active', 'CR-RBS-001', 'debt@rbs.example.com', 'Edinburgh', 'EH2 2YN');
  insert.run('ORG-CR-002', 'Barclays Bank (Sample)', 'creditor', null, 'active', 'CR-BAR-001', 'collections@barclays.example.com', 'London', 'E14 5HP');
  insert.run('ORG-CR-003', 'HMRC Scotland (Sample)', 'creditor', null, 'active', 'CR-HMRC-001', 'debt@hmrc.example.gov.uk', 'Edinburgh', 'EH1 1AA');
  insert.run('ORG-CR-004', 'Glasgow City Council (Sample)', 'creditor', null, 'active', 'CR-GCC-001', 'council-tax@gcc.example.gov.uk', 'Glasgow', 'G2 1DU');

  // Suppliers / Trustees
  insert.run('ORG-TR-001', 'Sample Insolvency Practitioners LLP', 'trustee', null, 'active', 'IP-2019-0045', 'admin@sample-ip.example.com', 'Edinburgh', 'EH1 2AA');
  insert.run('ORG-TR-002', 'Test Trustees & Co', 'trustee', null, 'active', 'TR-2018-0123', 'info@test-trustees.example.com', 'Glasgow', 'G2 1BB');

  // Payment Distributors (Suppliers)
  insert.run('ORG-SUP-001', 'Sample Payment Services Ltd', 'payment_distributor', null, 'active', 'PD-SPS-001', 'ops@sps.example.com', 'Edinburgh', 'EH4 1AA');
  insert.run('ORG-SUP-002', 'DAS Admin Systems Ltd', 'supplier', null, 'active', 'SUP-DAS-001', 'support@dasadmin.example.com', 'Glasgow', 'G3 7AA');

  // Relationships
  insertRel.run('REL-001', 'ORG-AIB-001', 'ORG-AIB-002', 'subsidiary');
  insertRel.run('REL-002', 'ORG-AIB-001', 'ORG-AIB-003', 'subsidiary');
  insertRel.run('REL-003', 'ORG-AIB-001', 'ORG-AIB-004', 'subsidiary');
  insertRel.run('REL-004', 'ORG-MA-001', 'ORG-MA-002', 'branch');
  insertRel.run('REL-005', 'ORG-MA-001', 'ORG-MA-003', 'branch');
  insertRel.run('REL-006', 'ORG-AIB-001', 'ORG-SUP-001', 'contracted_supplier');
  insertRel.run('REL-007', 'ORG-AIB-001', 'ORG-SUP-002', 'contracted_supplier');
}
