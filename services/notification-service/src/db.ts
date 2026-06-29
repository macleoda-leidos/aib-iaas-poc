import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.NOTIFICATION_DB_PATH || './data/notifications.db';
let db: Database.Database;

export function getNotificationDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initNotificationDb(): void {
  const database = getNotificationDb();
  database.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('info', 'action_required', 'success', 'warning', 'error')),
      channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms')),
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      link TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      read_at TEXT,
      expires_at TEXT,
      metadata JSON
    );
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(user_id, read);
  `);
  console.log('[Notification DB] Initialized');
}
