import type { DbDriver } from '../driver';
import { randomUUID } from 'crypto';

/**
 * Consent records.
 *
 * `POST /api/credit-check/consent` returned 201 with a fresh uuid, a `recordedAt`
 * timestamp and the note "Consent recorded for audit purposes", and executed no write at
 * all — there was no `consents` table. `POST /run` separately set `consentRecorded: true`
 * on every response, having recorded nothing.
 *
 * UK GDPR Art. 7(1) requires the controller to be able to demonstrate that consent was
 * given. A receipt with nothing behind it is worse than returning 501, because the
 * receipt is precisely what an audit or a subject access request would rely on — it
 * makes the absence of a record look like the presence of one. (GAP-018)
 *
 * Withdrawal is modelled as a timestamp rather than a deletion, because "this person
 * withdrew consent on 3 March" is itself a fact the controller must be able to
 * demonstrate; deleting the row would leave no evidence that the later refusal to run a
 * check was correct.
 */

export interface Consent {
  id: string;
  applicationId: string;
  debtorId: string | null;
  consentType: string;
  consentGiven: boolean;
  recordedAt: string;
  /** When this consent stops authorising anything. Enforced by `findLive`. */
  expiresAt: string;
  recordedBy: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  withdrawnAt: string | null;
}

export interface RecordConsentInput {
  applicationId: string;
  debtorId?: string | null;
  consentType?: string;
  consentGiven: boolean;
  /** The authenticated caller who recorded it. Distinct from the subject. */
  recordedBy?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  /** Overrides the default validity period. */
  expiresAt?: string;
}

/**
 * How long a consent authorises checks for.
 *
 * The route this replaces returned `expiresAt: now + 90 days` on every response and
 * enforced nothing — there was no record to expire. Ninety days is kept because it was the
 * figure already published to clients, but it is now a stored column that `findLive`
 * checks, so the response states a fact rather than a decoration.
 *
 * No statute fixes this. UK GDPR does not time-limit consent, but the ICO's guidance is
 * that it should be refreshed at appropriate intervals, and a consent that never expires
 * means one tick authorises credit searches indefinitely.
 */
export const CONSENT_VALIDITY_DAYS = 90;

export class ConsentRepository {
  constructor(private driver: DbDriver) {}

  private mapRow(row: any): Consent {
    return {
      id: row.id,
      applicationId: row.application_id,
      debtorId: row.debtor_id ?? null,
      consentType: row.consent_type,
      // Boolean(): SQLite stores this as INTEGER 0/1, PostgreSQL as a real BOOLEAN. This
      // tolerates both, which is what lets one row mapper serve both backends.
      consentGiven: Boolean(row.consent_given),
      recordedAt: row.recorded_at,
      expiresAt: row.expires_at,
      recordedBy: row.recorded_by ?? null,
      ipAddress: row.ip_address ?? null,
      userAgent: row.user_agent ?? null,
      withdrawnAt: row.withdrawn_at ?? null,
    };
  }

  async record(input: RecordConsentInput): Promise<Consent> {
    const id = randomUUID();
    const recordedAt = new Date().toISOString();
    const consentType = input.consentType || 'credit_check';
    const expiresAt =
      input.expiresAt ??
      new Date(Date.now() + CONSENT_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString();

    await this.driver.run(
      `INSERT INTO consents
         (id, application_id, debtor_id, consent_type, consent_given, recorded_at, expires_at, recorded_by, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.applicationId,
        input.debtorId ?? null,
        consentType,
        // Bound as a real boolean, not 1/0: the driver coerces for SQLite, and PostgreSQL
        // rejects an integer for a BOOLEAN column outright.
        input.consentGiven,
        recordedAt,
        expiresAt,
        input.recordedBy ?? null,
        input.ipAddress ?? null,
        input.userAgent ?? null,
      ]
    );

    return {
      id,
      applicationId: input.applicationId,
      debtorId: input.debtorId ?? null,
      consentType,
      consentGiven: input.consentGiven,
      recordedAt,
      expiresAt,
      recordedBy: input.recordedBy ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      withdrawnAt: null,
    };
  }

  async findById(id: string): Promise<Consent | null> {
    const row = await this.driver.get('SELECT * FROM consents WHERE id = ?', [id]);
    return row ? this.mapRow(row) : null;
  }

  /**
   * The live consent for this application and type, if there is one.
   *
   * "Live" means given, not withdrawn, and not expired — all three. Ordered newest first
   * so a re-consent after a withdrawal supersedes it rather than being shadowed by the
   * older row.
   *
   * Expiry is compared in JavaScript rather than in SQL. The dialects disagree about
   * `now()` and about how a TEXT timestamp compares to a TIMESTAMPTZ one, and a comparison
   * that silently behaves differently per backend is precisely the class of bug the driver
   * abstraction exists to avoid — here it would mean an expired consent authorising a
   * credit search on one backend and not the other.
   */
  async findLive(applicationId: string, consentType = 'credit_check'): Promise<Consent | null> {
    const rows = await this.driver.all(
      `SELECT * FROM consents
        WHERE application_id = ? AND consent_type = ? AND consent_given = ? AND withdrawn_at IS NULL
        ORDER BY recorded_at DESC`,
      [applicationId, consentType, true]
    );

    const now = Date.now();
    const live = rows.map(r => this.mapRow(r)).find(c => new Date(c.expiresAt).getTime() > now);
    return live ?? null;
  }

  /** Every consent event for an application, oldest first — the audit view. */
  async listForApplication(applicationId: string): Promise<Consent[]> {
    const rows = await this.driver.all(
      'SELECT * FROM consents WHERE application_id = ? ORDER BY recorded_at ASC',
      [applicationId]
    );
    return rows.map(r => this.mapRow(r));
  }

  /**
   * Withdraw a consent. Returns the updated record, or null if the id is unknown or it
   * was already withdrawn — an idempotent withdrawal must not report success twice, or a
   * caller cannot tell whether their request did anything.
   */
  async withdraw(id: string): Promise<Consent | null> {
    const existing = await this.findById(id);
    if (!existing || existing.withdrawnAt) return null;

    const withdrawnAt = new Date().toISOString();
    await this.driver.run('UPDATE consents SET withdrawn_at = ? WHERE id = ? AND withdrawn_at IS NULL', [
      withdrawnAt,
      id,
    ]);

    return { ...existing, withdrawnAt };
  }
}
