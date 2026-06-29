import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.USER_DB_PATH || './data/users.db';
let db: Database.Database;

export function getUserDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initUserDb(): void {
  const database = getUserDb();

  database.exec(`
    -- Roles define what a user can do
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      level INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Permissions are granular actions
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      resource TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'submit', 'approve', 'reject', 'assign', 'export', 'admin'))
    );

    -- Role-permission mapping
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (permission_id) REFERENCES permissions(id)
    );

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      display_name TEXT,
      role_id TEXT NOT NULL,
      organisation_id TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_approval', 'deactivated')),
      last_login_at TEXT,
      password_hash TEXT NOT NULL DEFAULT 'poc-placeholder',
      mfa_enabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    -- User sessions (for POC token management)
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
    CREATE INDEX IF NOT EXISTS idx_users_org ON users(organisation_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  `);

  seedRolesAndUsers(database);
  console.log('[User DB] Initialized with RBAC seed data');
}

function seedRolesAndUsers(db: Database.Database): void {
  const insertRole = db.prepare('INSERT OR IGNORE INTO roles (id, name, display_name, description, level) VALUES (?, ?, ?, ?, ?)');
  const insertPerm = db.prepare('INSERT OR IGNORE INTO permissions (id, code, name, description, resource, action) VALUES (?, ?, ?, ?, ?, ?)');
  const insertRP = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, email, first_name, last_name, display_name, role_id, organisation_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  // ===== ROLES =====
  insertRole.run('ROLE-SYSADMIN', 'system_admin', 'System Administrator', 'Full system access - AiB IT', 100);
  insertRole.run('ROLE-AIB-SENIOR', 'aib_senior_officer', 'AiB Senior Officer', 'Senior case management and approvals', 90);
  insertRole.run('ROLE-AIB-OFFICER', 'aib_officer', 'AiB Case Officer', 'Case management and processing', 80);
  insertRole.run('ROLE-AIB-READONLY', 'aib_readonly', 'AiB Read-Only', 'View cases and reports only', 70);
  insertRole.run('ROLE-ADVISER', 'money_adviser', 'Money Adviser', 'Submit and manage applications on behalf of debtors', 50);
  insertRole.run('ROLE-CREDITOR', 'creditor', 'Creditor', 'View relevant cases, submit claims, vote on proposals', 40);
  insertRole.run('ROLE-SUPPLIER', 'supplier', 'Supplier/Trustee', 'Manage cases as appointed trustee or payment distributor', 45);
  insertRole.run('ROLE-DEBTOR', 'debtor', 'Debtor/Applicant', 'Self-service application and case view', 10);

  // ===== PERMISSIONS =====
  const perms = [
    ['PERM-APP-CREATE', 'application.create', 'Create Application', 'Create new applications', 'application', 'create'],
    ['PERM-APP-READ-OWN', 'application.read.own', 'Read Own Applications', 'View own applications', 'application', 'read'],
    ['PERM-APP-READ-ALL', 'application.read.all', 'Read All Applications', 'View all applications', 'application', 'read'],
    ['PERM-APP-UPDATE', 'application.update', 'Update Application', 'Edit application details', 'application', 'update'],
    ['PERM-APP-SUBMIT', 'application.submit', 'Submit Application', 'Submit application for processing', 'application', 'submit'],
    ['PERM-APP-APPROVE', 'application.approve', 'Approve Application', 'Approve/reject applications', 'application', 'approve'],
    ['PERM-APP-ASSIGN', 'application.assign', 'Assign Application', 'Assign to officer', 'application', 'assign'],
    ['PERM-NOTE-CREATE', 'note.create', 'Add Notes', 'Add staff notes to applications', 'note', 'create'],
    ['PERM-NOTE-READ', 'note.read', 'Read Notes', 'View notes on applications', 'note', 'read'],
    ['PERM-DOC-UPLOAD', 'document.upload', 'Upload Documents', 'Upload supporting documents', 'document', 'create'],
    ['PERM-DOC-READ', 'document.read', 'View Documents', 'View/download documents', 'document', 'read'],
    ['PERM-DOC-DELETE', 'document.delete', 'Delete Documents', 'Delete uploaded documents', 'document', 'delete'],
    ['PERM-CREDIT-RUN', 'credit_check.run', 'Run Credit Check', 'Initiate credit check', 'credit_check', 'create'],
    ['PERM-CREDIT-VIEW', 'credit_check.view', 'View Credit Check', 'View credit check results', 'credit_check', 'read'],
    ['PERM-INTEGRATIONS', 'integrations.run', 'Run System Checks', 'Run cross-system integration checks', 'integration', 'create'],
    ['PERM-PAYMENT-INIT', 'payment.initiate', 'Initiate Payment', 'Start payment process', 'payment', 'create'],
    ['PERM-PAYMENT-VIEW', 'payment.view', 'View Payments', 'View payment status', 'payment', 'read'],
    ['PERM-AUDIT-VIEW', 'audit.view', 'View Audit Trail', 'View audit events', 'audit', 'read'],
    ['PERM-USER-MANAGE', 'user.manage', 'Manage Users', 'Create/edit/deactivate users', 'user', 'admin'],
    ['PERM-ORG-MANAGE', 'organisation.manage', 'Manage Organisations', 'Create/edit organisations', 'organisation', 'admin'],
    ['PERM-REPORTS', 'reports.view', 'View Reports', 'Access management reports', 'report', 'read'],
    ['PERM-EXPORT', 'data.export', 'Export Data', 'Export application/report data', 'data', 'export'],
    ['PERM-RECOMMEND', 'recommendation.view', 'View Recommendations', 'See product recommendations', 'recommendation', 'read'],
  ];
  perms.forEach(p => insertPerm.run(...p));

  // ===== ROLE-PERMISSION MAPPINGS =====
  // System Admin - everything
  perms.forEach(p => insertRP.run('ROLE-SYSADMIN', p[0]));

  // AiB Senior Officer
  ['PERM-APP-READ-ALL', 'PERM-APP-APPROVE', 'PERM-APP-ASSIGN', 'PERM-NOTE-CREATE', 'PERM-NOTE-READ', 'PERM-DOC-READ', 'PERM-CREDIT-VIEW', 'PERM-INTEGRATIONS', 'PERM-PAYMENT-VIEW', 'PERM-AUDIT-VIEW', 'PERM-REPORTS', 'PERM-EXPORT', 'PERM-RECOMMEND', 'PERM-USER-MANAGE'].forEach(p => insertRP.run('ROLE-AIB-SENIOR', p));

  // AiB Officer
  ['PERM-APP-READ-ALL', 'PERM-APP-UPDATE', 'PERM-NOTE-CREATE', 'PERM-NOTE-READ', 'PERM-DOC-READ', 'PERM-CREDIT-RUN', 'PERM-CREDIT-VIEW', 'PERM-INTEGRATIONS', 'PERM-PAYMENT-VIEW', 'PERM-AUDIT-VIEW', 'PERM-RECOMMEND'].forEach(p => insertRP.run('ROLE-AIB-OFFICER', p));

  // AiB Read-Only
  ['PERM-APP-READ-ALL', 'PERM-NOTE-READ', 'PERM-DOC-READ', 'PERM-CREDIT-VIEW', 'PERM-PAYMENT-VIEW', 'PERM-AUDIT-VIEW', 'PERM-REPORTS', 'PERM-RECOMMEND'].forEach(p => insertRP.run('ROLE-AIB-READONLY', p));

  // Money Adviser
  ['PERM-APP-CREATE', 'PERM-APP-READ-OWN', 'PERM-APP-UPDATE', 'PERM-APP-SUBMIT', 'PERM-NOTE-CREATE', 'PERM-NOTE-READ', 'PERM-DOC-UPLOAD', 'PERM-DOC-READ', 'PERM-CREDIT-RUN', 'PERM-CREDIT-VIEW', 'PERM-INTEGRATIONS', 'PERM-PAYMENT-INIT', 'PERM-PAYMENT-VIEW', 'PERM-RECOMMEND'].forEach(p => insertRP.run('ROLE-ADVISER', p));

  // Creditor
  ['PERM-APP-READ-OWN', 'PERM-DOC-READ', 'PERM-PAYMENT-VIEW', 'PERM-RECOMMEND'].forEach(p => insertRP.run('ROLE-CREDITOR', p));

  // Supplier/Trustee
  ['PERM-APP-READ-OWN', 'PERM-APP-UPDATE', 'PERM-NOTE-CREATE', 'PERM-NOTE-READ', 'PERM-DOC-UPLOAD', 'PERM-DOC-READ', 'PERM-PAYMENT-VIEW', 'PERM-RECOMMEND'].forEach(p => insertRP.run('ROLE-SUPPLIER', p));

  // Debtor
  ['PERM-APP-CREATE', 'PERM-APP-READ-OWN', 'PERM-APP-UPDATE', 'PERM-APP-SUBMIT', 'PERM-DOC-UPLOAD', 'PERM-DOC-READ', 'PERM-DOC-DELETE', 'PERM-PAYMENT-INIT', 'PERM-PAYMENT-VIEW', 'PERM-RECOMMEND'].forEach(p => insertRP.run('ROLE-DEBTOR', p));

  // ===== SEED USERS =====
  insertUser.run('USR-001', 'admin@aib.example.gov.scot', 'System', 'Administrator', 'System Admin', 'ROLE-SYSADMIN', 'ORG-AIB-001', 'active');
  insertUser.run('USR-002', 'senior.officer@aib.example.gov.scot', 'Karen', 'MacLeod', 'Karen MacLeod', 'ROLE-AIB-SENIOR', 'ORG-AIB-001', 'active');
  insertUser.run('USR-003', 'officer@aib.example.gov.scot', 'James', 'Wilson', 'James Wilson', 'ROLE-AIB-OFFICER', 'ORG-AIB-002', 'active');
  insertUser.run('USR-004', 'readonly@aib.example.gov.scot', 'Reporting', 'User', 'Reporting User', 'ROLE-AIB-READONLY', 'ORG-AIB-004', 'active');
  insertUser.run('USR-005', 'adviser@cas.example.org', 'Fiona', 'Campbell', 'Fiona Campbell', 'ROLE-ADVISER', 'ORG-MA-002', 'active');
  insertUser.run('USR-006', 'adviser2@stepchange.example.org', 'David', 'Thomson', 'David Thomson', 'ROLE-ADVISER', 'ORG-MA-004', 'active');
  insertUser.run('USR-007', 'collections@rbs.example.com', 'Sarah', 'Mitchell', 'Sarah Mitchell', 'ROLE-CREDITOR', 'ORG-CR-001', 'active');
  insertUser.run('USR-008', 'trustee@sample-ip.example.com', 'Robert', 'Henderson', 'Robert Henderson', 'ROLE-SUPPLIER', 'ORG-TR-001', 'active');
  insertUser.run('USR-009', 'john.testerton@example.com', 'John', 'Testerton', 'John Testerton', 'ROLE-DEBTOR', null, 'active');
  insertUser.run('USR-010', 'margaret.h@example.com', 'Margaret', 'Highdebt', 'Margaret Highdebt', 'ROLE-DEBTOR', null, 'active');
}
