import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/audit.db';
let db: Database.Database;

export function getAuditDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initAuditDb(): void {
  const database = getAuditDb();
  database.exec(`
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      application_id TEXT,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      actor_type TEXT NOT NULL CHECK (actor_type IN ('applicant', 'system', 'staff')),
      details JSON,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_audit_app ON audit_events(application_id);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_events(action);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp);
  `);
  console.log('[Audit DB] Initialized');
}
