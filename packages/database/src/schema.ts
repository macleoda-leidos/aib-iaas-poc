import type Database from 'better-sqlite3';

/**
 * Initialize all tables matching the Prisma schema.
 * Safe to call multiple times (CREATE TABLE IF NOT EXISTS).
 */
export function initializeSchema(db: Database.Database): void {
  db.exec(`
    -- ─── Identity & Access ─────────────────────

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      level INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      resource TEXT NOT NULL,
      action TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );

    -- ─── Organisations (before users due to FK) ─

    CREATE TABLE IF NOT EXISTS organisations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      parent_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      registration_number TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      address_line1 TEXT,
      address_city TEXT,
      address_postcode TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (parent_id) REFERENCES organisations(id)
    );

    -- ─── Users ─────────────────────────────────

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      display_name TEXT,
      role_id TEXT NOT NULL,
      organisation_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      password_hash TEXT,
      mfa_enabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (organisation_id) REFERENCES organisations(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ─── Applications (Core Domain) ────────────

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      reference_number TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      system_checks TEXT,
      credit_check TEXT,
      assigned_to TEXT,
      submitted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applicants (
      id TEXT PRIMARY KEY,
      application_id TEXT UNIQUE NOT NULL,
      title TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth TEXT,
      ni_number TEXT,
      marital_status TEXT,
      dependants INTEGER NOT NULL DEFAULT 0,
      employment TEXT,
      email TEXT,
      phone TEXT,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      line1 TEXT NOT NULL,
      line2 TEXT,
      city TEXT NOT NULL,
      postcode TEXT NOT NULL,
      is_current INTEGER NOT NULL DEFAULT 0,
      resident_from TEXT,
      resident_to TEXT,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      creditor TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      monthly_payment REAL NOT NULL DEFAULT 0,
      account_ref TEXT,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      value REAL NOT NULL,
      outstanding REAL NOT NULL DEFAULT 0,
      is_essential INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS income_expenditure (
      id TEXT PRIMARY KEY,
      application_id TEXT UNIQUE NOT NULL,
      income TEXT NOT NULL,
      expenditure TEXT NOT NULL,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- ─── Documents ─────────────────────────────

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      category TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      scan_status TEXT NOT NULL DEFAULT 'pending',
      scan_result TEXT,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- ─── Recommendations ───────────────────────

    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      application_id TEXT UNIQUE NOT NULL,
      product TEXT NOT NULL,
      confidence TEXT NOT NULL,
      confidence_pct INTEGER NOT NULL,
      reasoning TEXT NOT NULL,
      factors TEXT NOT NULL,
      alternatives TEXT NOT NULL,
      engine_version TEXT NOT NULL,
      generated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- ─── Audit ─────────────────────────────────

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      application_id TEXT,
      action TEXT NOT NULL,
      actor_id TEXT,
      actor_name TEXT,
      actor_type TEXT NOT NULL,
      details TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    -- ─── Payments ──────────────────────────────

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'GBP',
      status TEXT NOT NULL DEFAULT 'pending',
      provider TEXT,
      provider_ref TEXT,
      paid_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    -- ─── Indexes ───────────────────────────────

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
    CREATE INDEX IF NOT EXISTS idx_users_org ON users(organisation_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_organisations_type ON organisations(type);
    CREATE INDEX IF NOT EXISTS idx_organisations_parent ON organisations(parent_id);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_applications_reference ON applications(reference_number);
    CREATE INDEX IF NOT EXISTS idx_applicants_app ON applicants(application_id);
    CREATE INDEX IF NOT EXISTS idx_addresses_app ON addresses(application_id);
    CREATE INDEX IF NOT EXISTS idx_debts_app ON debts(application_id);
    CREATE INDEX IF NOT EXISTS idx_assets_app ON assets(application_id);
    CREATE INDEX IF NOT EXISTS idx_documents_app ON documents(application_id);
    CREATE INDEX IF NOT EXISTS idx_audit_app ON audit_events(application_id);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_events(action);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_payments_app ON payments(application_id);
  `);
}
