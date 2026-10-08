import type Database from 'better-sqlite3';
import { hashPassword, DEMO_MFA_SECRET } from '@aib-iaas/auth';
import { seedRbacSqlite, PERMISSIONS } from './rbac';

/**
 * One real bcrypt hash of the demo password, computed lazily and once per
 * process (bcrypt at cost 12 is deliberately slow). Every seed path writes this
 * for the demo accounts so login genuinely verifies a password rather than
 * accepting anything — the demo password stays "demo", which the login page
 * advertises. We can no longer paste a precomputed literal here because the
 * build host has no Node to generate one; computing it at seed time is
 * equivalent and keeps a single source of truth.
 */
let demoPasswordHash: string | undefined;
export function getDemoPasswordHash(): string {
  if (!demoPasswordHash) demoPasswordHash = hashPassword('demo');
  return demoPasswordHash;
}

/**
 * Add a column to an existing table only if it is missing. The deployed Render
 * disk is persistent, so `CREATE TABLE IF NOT EXISTS` never adds a column to a
 * table that already exists — a new column has to be migrated in explicitly.
 * Guarded on PRAGMA table_info so it is safe to run on every boot.
 */
function addColumnIfMissing(db: Database.Database, table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some(c => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

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
      mfa_secret TEXT,
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
      owner_user_id TEXT,
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

    -- ─── Staff notes ───────────────────────────
    -- Persisted case notes. Before this, POST /:id/notes only wrote the content
    -- into an audit event's details and returned an ephemeral object, so a note
    -- never survived to be read back. This is the first-class store.

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      author_id TEXT,
      author_name TEXT,
      note_type TEXT NOT NULL DEFAULT 'general',
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- ─── Creditor claims ───────────────────────
    -- A creditor's claim against an application (amount + basis), reviewed by
    -- staff (accept/reject). Net-new resource for the creditor portal build-out.

    CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      creditor_org_id TEXT,
      creditor_user_id TEXT,
      amount REAL NOT NULL,
      basis TEXT,
      status TEXT NOT NULL DEFAULT 'submitted',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- ─── Messages ──────────────────────────────
    -- Two-way secure correspondence between an applicant and the case team,
    -- threaded per application. The direction column records which side sent it.

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      sender_user_id TEXT,
      sender_name TEXT,
      direction TEXT NOT NULL DEFAULT 'staff',
      body TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
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

    -- ─── Notifications ─────────────────────────
    -- Unified in-app / email / sms notification store. This previously lived in a
    -- separate notification-service SQLite file the gateway could not reach, so
    -- lifecycle notifications were never surfaced. It is now part of the shared
    -- schema: the gateway writes (via NotificationRepository) and the notification
    -- routes read the same table.

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      channel TEXT NOT NULL DEFAULT 'in_app',
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      link TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      read_at TEXT,
      expires_at TEXT,
      metadata TEXT
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
    CREATE INDEX IF NOT EXISTS idx_notes_app ON notes(application_id);
    CREATE INDEX IF NOT EXISTS idx_claims_app ON claims(application_id);
    CREATE INDEX IF NOT EXISTS idx_claims_org ON claims(creditor_org_id);
    CREATE INDEX IF NOT EXISTS idx_messages_app ON messages(application_id);
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(user_id, read);
    CREATE INDEX IF NOT EXISTS idx_audit_app ON audit_events(application_id);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_events(action);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_payments_app ON payments(application_id);
  `);

  // ─── Idempotent migrations for persistent volumes ──
  // CREATE TABLE IF NOT EXISTS above is a no-op on a disk that already holds an
  // older schema, so columns added after first deploy have to be ALTERed in.
  addColumnIfMissing(db, 'users', 'mfa_secret', 'TEXT');
  addColumnIfMissing(db, 'applications', 'owner_user_id', 'TEXT');
  // Adviser submit-on-behalf (UC-09 / US-011): who submitted, and when authority
  // to act for the client was declared.
  addColumnIfMissing(db, 'applications', 'submitted_by_user_id', 'TEXT');
  addColumnIfMissing(db, 'applications', 'authority_declared_at', 'TEXT');

  // Roles, permissions and grants come from ./rbac so that SQLite and PostgreSQL
  // grant identical access. This used to be a hand-maintained list here, which
  // is how it came to omit three roles and use a permission vocabulary no other
  // file understood. Must run before the users below — role_id is a FK.
  seedRbacSqlite(db);

  // Purge permission codes withdrawn from the canonical vocabulary (GAP-011
  // residual #4). Seeding is INSERT OR IGNORE — it adds new codes but never
  // deletes obsolete ones, so a persistent volume created before a vocabulary
  // change keeps withdrawn codes (e.g. the old 'application.read.all',
  // 'audit.view') and the grants built on them. Default-deny must not evaluate
  // against stale grants. The FK on role_permissions is ON DELETE CASCADE, so
  // deleting the permission drops its orphaned grants with it. A no-op on a
  // freshly-seeded database (every code is already canonical).
  const canonicalCodes = PERMISSIONS.map(p => p.code);
  const placeholders = canonicalCodes.map(() => '?').join(', ');
  db.prepare(`DELETE FROM permissions WHERE code NOT IN (${placeholders})`).run(...canonicalCodes);

  // Seed default organisations and users for testing (matches original
  // api-gateway behaviour, for callers that use createRepositories() without
  // running the full seed).
  db.exec(`
    -- ─── Organisations ──────────────────────────

    INSERT OR IGNORE INTO organisations (id, name, type, parent_id, status, contact_email, address_city, address_postcode, created_at, updated_at)
    VALUES ('org-aib', 'Accountant in Bankruptcy', 'aib', NULL, 'active', 'info@aib.gov.uk', 'Edinburgh', 'EH6 6QQ', datetime('now'), datetime('now'));

    INSERT OR IGNORE INTO organisations (id, name, type, parent_id, status, contact_email, address_city, address_postcode, created_at, updated_at)
    VALUES ('org-cas', 'Citizens Advice Scotland', 'money_adviser', NULL, 'active', 'info@cas.org.uk', 'Edinburgh', 'EH3 7HT', datetime('now'), datetime('now'));

    INSERT OR IGNORE INTO organisations (id, name, type, parent_id, status, contact_email, address_city, address_postcode, created_at, updated_at)
    VALUES ('org-stepchange', 'StepChange Scotland', 'money_adviser', NULL, 'active', 'info@stepchange.org', 'Glasgow', 'G2 1DY', datetime('now'), datetime('now'));

    INSERT OR IGNORE INTO organisations (id, name, type, parent_id, status, contact_email, address_city, address_postcode, created_at, updated_at)
    VALUES ('org-creditor-1', 'Royal Bank of Scotland', 'creditor', NULL, 'active', 'debts@rbs.co.uk', 'Edinburgh', 'EH2 2YN', datetime('now'), datetime('now'));

    INSERT OR IGNORE INTO organisations (id, name, type, parent_id, status, contact_email, address_city, address_postcode, created_at, updated_at)
    VALUES ('org-trustee-1', 'Wylie & Bisset LLP', 'trustee', NULL, 'active', 'insolvency@wyliebisset.com', 'Glasgow', 'G2 4JR', datetime('now'), datetime('now'));
  `);

  // ─── Users ──────────────────────────────────
  // Written through a prepared statement (not db.exec) so the real bcrypt hash
  // can be bound as a parameter. password_hash is a genuine bcrypt('demo', 12)
  // for every account — login verifies it, so the old 'not-a-real-hash' would
  // now reject every sign-in. The demo password stays "demo".
  //
  // mfa_enabled is set on the two accounts the demo and the admin flow exercise;
  // both carry the fixed DEMO_MFA_SECRET so a real server-side TOTP check passes
  // with a code the login page can compute live. The scripted demo signs in as
  // the Case Officer (demo@example.com), so that account MUST have MFA enabled
  // for the demo's second-factor beat to be real rather than theatre.
  const demoHash = getDemoPasswordHash();
  const inlineUsers: Array<[string, string, string, string, string, string | null, number]> = [
    ['user-admin', 'admin@aib-poc.example.com', 'Admin', 'User', 'role-sysadmin', 'org-aib', 1],
    ['user-demo', 'demo@example.com', 'Demo', 'User', 'role-officer', 'org-aib', 1],
    ['user-cyberops', 'david.chen@aib.gov.uk', 'David', 'Chen', 'role-cyberops', 'org-aib', 0],
    ['user-stats', 'stats@aib.gov.uk', 'Analytics', 'User', 'role-statistician', 'org-aib', 0],
    ['user-adviser', 'adviser@cas.example.org', 'Karen', 'MacLeod', 'role-adviser', 'org-cas', 0],
    ['user-debtor', 'john.testerton@example.com', 'John', 'Testerton', 'role-debtor', null, 0],
  ];
  const insertInlineUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, first_name, last_name, display_name, role_id, organisation_id, status, password_hash, mfa_enabled, mfa_secret, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, datetime('now'), datetime('now'))
  `);
  for (const [id, email, firstName, lastName, roleId, orgId, mfaEnabled] of inlineUsers) {
    insertInlineUser.run(
      id, email, firstName, lastName, `${firstName} ${lastName}`, roleId, orgId,
      demoHash, mfaEnabled, mfaEnabled ? DEMO_MFA_SECRET : null
    );
  }

  // ─── Credential backfill for existing persistent volumes ──
  // INSERT OR IGNORE never touches a row that already exists, so demo users
  // seeded onto the persistent Render disk BEFORE the Phase-1 password/MFA change
  // keep their 'not-a-real-hash' placeholder (or a NULL hash, for users.json
  // accounts seeded without one) and could not log in after this deploys. Give
  // any user lacking a real bcrypt hash the demo hash, and (re)assert MFA on the
  // documented demo/admin accounts. Both guards make this a no-op once applied,
  // and a no-op on a freshly-seeded database (every row already has a $2… hash).
  const staleCreds = db
    .prepare(`SELECT COUNT(*) AS c FROM users WHERE password_hash IS NULL OR password_hash NOT LIKE '$2%'`)
    .get() as { c: number };
  if (staleCreds.c > 0) {
    db.prepare(`UPDATE users SET password_hash = ? WHERE password_hash IS NULL OR password_hash NOT LIKE '$2%'`).run(demoHash);
  }
  const setMfa = db.prepare(
    `UPDATE users SET mfa_enabled = 1, mfa_secret = ? WHERE email = ? AND (mfa_enabled = 0 OR mfa_secret IS NULL)`
  );
  for (const email of ['admin@aib-poc.example.com', 'demo@example.com', 'admin@aib.gov.scot', 'fiona.campbell@aib.gov.scot']) {
    setMfa.run(DEMO_MFA_SECRET, email);
  }
}
