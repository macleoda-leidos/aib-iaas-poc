import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { resolveStorePath } from '@aib-iaas/observability';

/**
 * `resolveStorePath` rather than a bare `||` fallback: `./data/...` resolves under the
 * container's working directory rather than the persistent disk at `/data`, so this
 * cache was silently discarded on every spin-down. Warns in production rather than
 * relocating (GAP-019).
 */
const DB_PATH = resolveStorePath('CREDIT_CHECK_DB_PATH', './data/credit-check-cache.db').path;
let db: Database.Database;

/** The resolved path, for the readiness probe and for tests. */
export function creditCheckDbPath(): string {
  return DB_PATH;
}

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

/**
 * The cache key for one credit check.
 *
 * The old key was `${nationalInsuranceNumber || lastName}-${dateOfBirth}`, read before any
 * provider call and written after. Three things were wrong with it, in order of severity:
 *
 *  1. **It crossed applications.** A second, entirely separate application for the same
 *     person got the cached result — so the new consent was never exercised against the
 *     provider. One consent silently authorised every check for 24 hours, which is not
 *     what the person consented to and not what the audit record would show.
 *  2. **The `lastName` fallback collided people.** Two different applicants sharing a
 *     surname and a date of birth — and NI number is optional on this form — received each
 *     other's credit data. Not a near miss: MacDonald plus a shared DOB is a realistic
 *     collision in a Scottish caseload.
 *  3. **It put an NI number in a database key in plaintext**, where it appears in the
 *     primary-key index on disk.
 *
 * Now keyed on the application, plus a SHA-256 of the identity tuple so that changing the
 * name or date of birth mid-application correctly misses the cache. The identity part is
 * hashed rather than stored: this file's purpose does not require reading it back.
 */
export function cacheKeyFor(input: {
  applicationId?: string;
  nationalInsuranceNumber?: string;
  lastName?: string;
  dateOfBirth?: string;
}): string {
  const identity = crypto
    .createHash('sha256')
    .update([input.nationalInsuranceNumber ?? '', input.lastName ?? '', input.dateOfBirth ?? ''].join('|'))
    .digest('hex')
    .slice(0, 32);

  // No applicationId means no scope to cache within, so the key is made unique per call
  // rather than shared across whoever happens to have the same details. Failing to cache
  // is the safe direction; the cost is one extra provider call.
  const scope = input.applicationId || `unscoped-${crypto.randomUUID()}`;
  return `${scope}:${identity}`;
}

export function getCachedResult(key: string): any | null {
  if (!db) return null;

  const row = db.prepare(
    'SELECT result FROM credit_check_cache WHERE cache_key = ? AND expires_at > datetime(\'now\')'
  ).get(key) as any;

  return row ? JSON.parse(row.result) : null;
}

/**
 * TTL is one hour, not twenty-four.
 *
 * The purpose of this cache is "do not bill the provider twice for a double-click or a
 * retry within one sitting", not "remember this person for a day". A day-long window was
 * what made one consent stretch across multiple checks; an hour matches how long an
 * applicant actually spends on the journey.
 */
export function cacheResult(key: string, result: any, ttlHours = 1): void {
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
