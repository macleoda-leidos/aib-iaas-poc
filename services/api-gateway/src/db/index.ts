import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/iaas.db';

let db: Database.Database;

export function getDatabase(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDatabase(): void {
  const database = getDatabase();

  database.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      reference_number TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      data JSON NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      submitted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'uploaded',
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      application_id TEXT,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      actor_type TEXT NOT NULL,
      details JSON,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'applicant',
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Seed default admin user (password: admin123 - POC only)
    INSERT OR IGNORE INTO users (id, email, name, role, password_hash)
    VALUES ('USR-ADMIN-001', 'admin@aib-poc.example.com', 'AiB Admin (POC)', 'admin', 'poc-placeholder-hash');

    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_applications_reference ON applications(reference_number);
    CREATE INDEX IF NOT EXISTS idx_documents_application ON documents(application_id);
    CREATE INDEX IF NOT EXISTS idx_audit_application ON audit_events(application_id);
  `);

  console.log('[Database] Initialized successfully');
}
