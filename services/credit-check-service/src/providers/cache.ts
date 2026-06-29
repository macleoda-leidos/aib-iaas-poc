import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.CREDIT_CHECK_DB_PATH || './data/credit-check-cache.db';
let db: Database.Database;

export function initCreditCheckDb(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS credit_check_cache (
      cache_key TEXT PRIMARY KEY,
      result JSON NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cache_expires ON credit_check_cache(expires_at);
  `);

  console.log('[Credit Check Cache] Initialized');
}

export function getCachedResult(key: string): any | null {
  if (!db) return null;

  const row = db.prepare(
    'SELECT result FROM credit_check_cache WHERE cache_key = ? AND expires_at > datetime(\'now\')'
  ).get(key) as any;

  return row ? JSON.parse(row.result) : null;
}

export function cacheResult(key: string, result: any, ttlHours = 24): void {
  if (!db) return;

  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT OR REPLACE INTO credit_check_cache (cache_key, result, expires_at)
    VALUES (?, ?, ?)
  `).run(key, JSON.stringify(result), expiresAt);
}

export function clearExpiredCache(): void {
  if (!db) return;
  db.prepare('DELETE FROM credit_check_cache WHERE expires_at <= datetime(\'now\')').run();
}
