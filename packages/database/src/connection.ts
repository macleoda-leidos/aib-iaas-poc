import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

let db: Database.Database | null = null;

function resolvePath(): string {
  if (process.env.DATABASE_URL?.startsWith('file:')) {
    return process.env.DATABASE_URL.replace('file:', '');
  }
  return process.env.DATABASE_PATH || join(process.cwd(), 'data', 'iaas.db');
}

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = resolvePath();
    if (dbPath !== ':memory:') {
      const dir = dirname(dbPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
    db = new Database(dbPath);
    if (dbPath !== ':memory:') {
      db.pragma('journal_mode = WAL');
    }
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getDatabasePath(): string {
  return resolvePath();
}
