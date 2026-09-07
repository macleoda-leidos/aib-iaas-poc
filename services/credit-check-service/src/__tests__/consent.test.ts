import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { adminHeaders } from '../../../../tests/helpers/authHeaders';
import { app } from '../index';
import { createRepositories, CONSENT_VALIDITY_DAYS } from '@aib-iaas/database';
import { cacheKeyFor } from '../providers/cache';

/**
 * Consent, and the cache key — the two halves of GAP-018.
 *
 * **Consent was not recorded.** `POST /consent` destructured the body, minted a `uuid()`,
 * returned 201 with `recordedAt`, an `expiresAt` 90 days out and the note "Consent recorded
 * for audit purposes", and executed no write at all — there was no `consents` table.
 * `POST /run` separately set `consentRecorded: true` on every response having recorded
 * nothing. UK GDPR Art. 7(1) requires the controller to be able to *demonstrate* consent,
 * and a receipt with nothing behind it is worse than a 501: it makes the absence of a
 * record look like the presence of one.
 *
 * **The cache was keyed on the person.** `${niNumber || lastName}-${dateOfBirth}` on a
 * 24-hour TTL, read before any provider call. So a second, separate application for the
 * same person got the cached result and the new consent was never exercised — one consent
 * silently authorising checks for a day — and the `lastName` fallback (NI number is
 * optional on this form) meant two people sharing a surname and date of birth received each
 * other's credit data.
 *
 * Every assertion below reads back out of the database, or compares two *different*
 * applications. Asserting on the write's own response is what let the no-op pass: a 201 was
 * never in doubt.
 */

let server: http.Server;
let baseUrl: string;
let auth: Record<string, string> = {};

const { consents } = createRepositories();

function request(method: string, path: string, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: { 'Content-Type': 'application/json', ...auth },
      },
      res => {
        let d = '';
        res.on('data', c => (d += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode || 0, data: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode || 0, data: d }); }
        });
      }
    );
    req.on('error', reject);
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

/** A distinct application id per test, so cache and consent state cannot leak between them. */
let seq = 0;
const nextApp = () => `APP-CONSENT-${Date.now()}-${seq++}`;

function runBody(applicationId: string, overrides: Record<string, any> = {}) {
  return {
    applicationId,
    firstName: 'Alistair',
    lastName: 'Morrison',
    dateOfBirth: '1982-03-14',
    nationalInsuranceNumber: 'AB123456C',
    currentAddress: { line1: '14 Craigmillar Park', postcode: 'EH16 5PB', city: 'Edinburgh' },
    consentGiven: true,
    ...overrides,
  };
}

beforeAll(async () => {
  auth = await adminHeaders();
  await new Promise<void>(resolve => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${(server.address() as any).port}`;
      resolve();
    });
  });
});

afterAll(() => server?.close());

describe('POST /consent actually writes a record', () => {
  it('stores a row that can be read back out of the database', async () => {
    const applicationId = nextApp();

    const res = await request('POST', '/api/credit-check/consent', {
      applicationId,
      debtorId: 'user-debtor',
      consentType: 'credit_check',
      consentGiven: true,
    });
    expect(res.status).toBe(201);

    // The assertion the original could never have passed.
    const stored = await consents.findById(res.data.data.consentId);
    expect(stored).not.toBeNull();
    expect(stored!.applicationId).toBe(applicationId);
    expect(stored!.consentGiven).toBe(true);
    expect(stored!.withdrawnAt).toBeNull();
  });

  it('records who took the consent, and from where', async () => {
    // The circumstances are what make a consent record defensible rather than merely
    // present: "we have a row" is weaker than "recorded by this user, from this address,
    // with this client, at this time".
    const applicationId = nextApp();
    const res = await request('POST', '/api/credit-check/consent', { applicationId, consentGiven: true });

    const stored = await consents.findById(res.data.data.consentId);
    expect(stored!.recordedBy).toBe('user-admin');
    expect(stored!.ipAddress).toBeTruthy();
    expect(stored!.userAgent === null || typeof stored!.userAgent === 'string').toBe(true);
  });

  it('records a refusal as a refusal, rather than not at all', async () => {
    // "They said no" is itself a fact the controller must be able to demonstrate — it is
    // what makes a later refusal to run a check defensible.
    const applicationId = nextApp();
    const res = await request('POST', '/api/credit-check/consent', { applicationId, consentGiven: false });
    expect(res.status).toBe(201);

    const stored = await consents.findById(res.data.data.consentId);
    expect(stored!.consentGiven).toBe(false);
    // And it does not count as consent.
    expect(await consents.findLive(applicationId)).toBeNull();
  });

  it('refuses to record consent with no application to attach it to', async () => {
    const res = await request('POST', '/api/credit-check/consent', { consentGiven: true });
    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('VALIDATION_ERROR');
  });

  it('refuses a missing consentGiven rather than defaulting it', async () => {
    // Defaulting to true would manufacture consent; defaulting to false would silently
    // discard a real one. Neither is acceptable, so it must be stated.
    const res = await request('POST', '/api/credit-check/consent', { applicationId: nextApp() });
    expect(res.status).toBe(400);
    expect(res.data.error.message).toContain('consentGiven');
  });

  it('sets an expiry that is stored, not merely reported', async () => {
    // The old response computed `now + 90 days` per call and enforced nothing, because
    // there was no record for it to be a property of.
    const applicationId = nextApp();
    const res = await request('POST', '/api/credit-check/consent', { applicationId, consentGiven: true });

    const stored = await consents.findById(res.data.data.consentId);
    expect(stored!.expiresAt).toBe(res.data.data.expiresAt);

    const days = (new Date(stored!.expiresAt).getTime() - new Date(stored!.recordedAt).getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(CONSENT_VALIDITY_DAYS);
  });
});

describe('POST /run requires a consent record, not a claim', () => {
  it('refuses when no consent has been recorded and none is offered', async () => {
    const res = await request('POST', '/api/credit-check/run', runBody(nextApp(), { consentGiven: undefined }));
    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('CONSENT_REQUIRED');
  });

  it('refuses an explicit false even when a live consent exists', async () => {
    // Consent is withdrawable at any time under Art. 7(3), so a present "no" outranks a
    // stored "yes" — the applicant's most current statement wins.
    const applicationId = nextApp();
    await request('POST', '/api/credit-check/consent', { applicationId, consentGiven: true });
    expect(await consents.findLive(applicationId)).not.toBeNull();

    const res = await request('POST', '/api/credit-check/run', runBody(applicationId, { consentGiven: false }));
    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('CONSENT_REQUIRED');
  });

  it('writes a record when consent is supplied inline, rather than only asserting it', async () => {
    // The /apply journey submits consent and the check in one request. That still works —
    // what changed is that the claim becomes a durable record *before* the provider is
    // called, instead of instead of it.
    const applicationId = nextApp();
    expect(await consents.findLive(applicationId)).toBeNull();

    const res = await request('POST', '/api/credit-check/run', runBody(applicationId));
    expect(res.status).toBe(200);

    const live = await consents.findLive(applicationId);
    expect(live).not.toBeNull();
    expect(res.data.data.consentId).toBe(live!.id);
  });

  it('points consentRecorded at the row that makes it true', async () => {
    // It was a hard-coded `true` sitting next to no record at all.
    const applicationId = nextApp();
    const res = await request('POST', '/api/credit-check/run', runBody(applicationId));

    expect(res.data.data.consentRecorded).toBe(true);
    expect(await consents.findById(res.data.data.consentId)).not.toBeNull();
  });

  it('refuses once consent is withdrawn', async () => {
    const applicationId = nextApp();
    const recorded = await request('POST', '/api/credit-check/consent', { applicationId, consentGiven: true });

    const withdrawn = await request('DELETE', `/api/credit-check/consent/${recorded.data.data.consentId}`);
    expect(withdrawn.status).toBe(200);

    const res = await request('POST', '/api/credit-check/run', runBody(applicationId, { consentGiven: undefined }));
    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('CONSENT_REQUIRED');
  });

  it('refuses once consent has expired', async () => {
    // A consent that never expires means one tick authorises credit searches for ever.
    const applicationId = nextApp();
    await consents.record({
      applicationId,
      consentGiven: true,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });

    expect(await consents.findLive(applicationId)).toBeNull();

    const res = await request('POST', '/api/credit-check/run', runBody(applicationId, { consentGiven: undefined }));
    expect(res.status).toBe(400);
  });

  it('keeps the withdrawal on record rather than deleting the row', async () => {
    // "They withdrew on 3 March" is itself demonstrable-consent evidence; deleting it would
    // leave nothing to justify the later refusal.
    const applicationId = nextApp();
    const recorded = await request('POST', '/api/credit-check/consent', { applicationId, consentGiven: true });
    await request('DELETE', `/api/credit-check/consent/${recorded.data.data.consentId}`);

    const stored = await consents.findById(recorded.data.data.consentId);
    expect(stored).not.toBeNull();
    expect(stored!.withdrawnAt).toBeTruthy();
    expect(stored!.consentGiven).toBe(true); // what they said, unaltered
  });

  it('does not report a second withdrawal as a success', async () => {
    const applicationId = nextApp();
    const recorded = await request('POST', '/api/credit-check/consent', { applicationId, consentGiven: true });

    expect((await request('DELETE', `/api/credit-check/consent/${recorded.data.data.consentId}`)).status).toBe(200);
    expect((await request('DELETE', `/api/credit-check/consent/${recorded.data.data.consentId}`)).status).toBe(404);
  });

  it('lets a re-consent after a withdrawal supersede it', async () => {
    // Ordering matters: with the older withdrawn row picked first, someone who changed
    // their mind back could never proceed.
    const applicationId = nextApp();
    const first = await request('POST', '/api/credit-check/consent', { applicationId, consentGiven: true });
    await request('DELETE', `/api/credit-check/consent/${first.data.data.consentId}`);

    const second = await request('POST', '/api/credit-check/consent', { applicationId, consentGiven: true });

    const live = await consents.findLive(applicationId);
    expect(live!.id).toBe(second.data.data.consentId);
  });
});

describe('GET /consent/:applicationId is the audit view', () => {
  it('returns every event in order, including the withdrawal', async () => {
    const applicationId = nextApp();
    const first = await request('POST', '/api/credit-check/consent', { applicationId, consentGiven: true });
    await request('DELETE', `/api/credit-check/consent/${first.data.data.consentId}`);
    await request('POST', '/api/credit-check/consent', { applicationId, consentGiven: true });

    const res = await request('GET', `/api/credit-check/consent/${applicationId}`);
    expect(res.status).toBe(200);
    expect(res.data.data.consents).toHaveLength(2);
    expect(res.data.data.consents[0].withdrawnAt).toBeTruthy();
    expect(res.data.data.live).not.toBeNull();
  });

  it('reports no live consent for an application that has none', async () => {
    const res = await request('GET', `/api/credit-check/consent/${nextApp()}`);
    expect(res.data.data.consents).toEqual([]);
    expect(res.data.data.live).toBeNull();
  });
});

describe('the cache key is scoped to an application, not to a person', () => {
  const identity = {
    lastName: 'Morrison',
    dateOfBirth: '1982-03-14',
    nationalInsuranceNumber: 'AB123456C',
  };

  it('gives two applications for the same person different keys', () => {
    // The defect that let one consent authorise a check on an unrelated application.
    expect(cacheKeyFor({ ...identity, applicationId: 'APP-1' }))
      .not.toBe(cacheKeyFor({ ...identity, applicationId: 'APP-2' }));
  });

  it('gives the same application and person the same key, so a retry still hits', () => {
    // The cache must still do its job: not billing the provider twice for a double-click.
    expect(cacheKeyFor({ ...identity, applicationId: 'APP-1' }))
      .toBe(cacheKeyFor({ ...identity, applicationId: 'APP-1' }));
  });

  it('does not collide two people sharing a surname and date of birth', () => {
    // The old key fell back to `lastName` whenever the optional NI number was absent, so
    // two MacDonalds born the same day swapped credit reports.
    const a = cacheKeyFor({ applicationId: 'APP-1', lastName: 'MacDonald', dateOfBirth: '1975-06-02' });
    const b = cacheKeyFor({ applicationId: 'APP-2', lastName: 'MacDonald', dateOfBirth: '1975-06-02' });
    expect(a).not.toBe(b);
  });

  it('misses the cache when the identity changes mid-application', () => {
    // A corrected date of birth is a different person as far as a credit search is
    // concerned, so it must not return the earlier answer.
    expect(cacheKeyFor({ ...identity, applicationId: 'APP-1' }))
      .not.toBe(cacheKeyFor({ ...identity, dateOfBirth: '1982-03-15', applicationId: 'APP-1' }));
  });

  it('never puts an NI number in the key', () => {
    // The key is a primary key on disk. Hashed rather than stored, because nothing here
    // needs to read it back.
    const key = cacheKeyFor({ ...identity, applicationId: 'APP-1' });
    expect(key).not.toContain('AB123456C');
    expect(key).not.toContain('Morrison');
    expect(key).not.toContain('1982-03-14');
  });

  it('does not share a key between callers when there is no application to scope it to', () => {
    // No applicationId means no scope, so failing to cache is the safe direction — the
    // alternative is sharing a result between whoever happens to have matching details.
    expect(cacheKeyFor(identity)).not.toBe(cacheKeyFor(identity));
  });
});

describe('the cache does not cross applications end to end', () => {
  it('calls the provider again for a second application with the same person', async () => {
    // The behavioural form of the key test. Two applications, identical applicant: the
    // second must be a real check, not a replay — otherwise the second consent bought
    // nothing.
    const first = await request('POST', '/api/credit-check/run', runBody(nextApp()));
    const second = await request('POST', '/api/credit-check/run', runBody(nextApp()));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.data.data.fromCache).toBeUndefined();
    // Different consent records, so the audit trail shows two authorised checks.
    expect(second.data.data.consentId).not.toBe(first.data.data.consentId);
  });

  it('still serves a repeat of the same request from cache', async () => {
    const applicationId = nextApp();
    await request('POST', '/api/credit-check/run', runBody(applicationId));
    const again = await request('POST', '/api/credit-check/run', runBody(applicationId));

    expect(again.data.data.fromCache).toBe(true);
  });
});
