import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app } from '../index';
import { issueAccessToken, generateKeyPairPem, resetSigningKeys } from '@aib-iaas/auth';
import { applications, users } from '../db';

/**
 * Resource ownership on the application routes.
 *
 * The defect these cover: `GET /api/applications/:id` checked that the caller held
 * a permission, never that the application was theirs. `applications.read` answers
 * "may this caller read applications" — so a debtor holding it could read any other
 * debtor's full case, including name, date of birth, NI number, addresses, debts,
 * assets and income, by changing the id in the URL. An IDOR, and a UK GDPR
 * Article 32 failure rather than a code-quality one.
 *
 * Every test here uses two *different* debtors and asserts across the boundary
 * between them, because a test with one debtor cannot tell "scoped to me" from
 * "scoped to nobody" — which is how the original suite passed.
 */

let server: http.Server;
let baseUrl: string;

let debtorA: string;
let debtorB: string;
let officer: string;

/** Applications owned by each debtor, plus one owned by nobody. */
let appOfA: string;
let appOfB: string;
let unowned: string;

const originalKeys = { priv: process.env.JWT_PRIVATE_KEY, pub: process.env.JWT_PUBLIC_KEY };

function request(
  method: string,
  path: string,
  opts: { body?: any; token?: string } = {}
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

    const req = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers },
      res => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode || 0, data: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode || 0, data }); }
        });
      }
    );
    req.on('error', reject);
    if (opts.body) req.write(JSON.stringify(opts.body));
    req.end();
  });
}

async function login(userId: string, email: string, role: string, roleLevel: number): Promise<string> {
  const { token, expiresAt } = issueAccessToken({ userId, email, role, roleLevel });
  await users.createSession(userId, token, expiresAt);
  return token;
}

beforeAll(async () => {
  const keys = generateKeyPairPem();
  process.env.JWT_PRIVATE_KEY = keys.privateKey;
  process.env.JWT_PUBLIC_KEY = keys.publicKey;
  resetSigningKeys();

  // A second debtor, because the seed ships only one and the whole point is to
  // assert across the boundary between two of them.
  await users.create({
    email: `debtor-b-${Date.now()}@example.com`,
    firstName: 'Morag',
    lastName: 'Sinclair',
    roleId: 'role-debtor',
  });
  const created = await users.findByEmail((await users.list({ role: 'debtor' })).data
    .map(u => u.email)
    .find(e => e.startsWith('debtor-b-'))!);

  debtorA = await login('user-debtor', 'john.testerton@example.com', 'debtor', 10);
  debtorB = await login(created!.id, created!.email, 'debtor', 10);
  officer = await login('user-demo', 'demo@example.com', 'aib_officer', 60);

  appOfA = (await applications.create({ debtorUserId: 'user-debtor', applicant: { firstName: 'John', lastName: 'Testerton' } })).id;
  appOfB = (await applications.create({ debtorUserId: created!.id, applicant: { firstName: 'Morag', lastName: 'Sinclair' } })).id;
  unowned = (await applications.create({ applicant: { firstName: 'Nobody', lastName: 'Owns' } })).id;

  await new Promise<void>(resolve => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${(server.address() as any).port}`;
      resolve();
    });
  });
});

afterAll(() => {
  server?.close();
  if (originalKeys.priv === undefined) delete process.env.JWT_PRIVATE_KEY;
  else process.env.JWT_PRIVATE_KEY = originalKeys.priv;
  if (originalKeys.pub === undefined) delete process.env.JWT_PUBLIC_KEY;
  else process.env.JWT_PUBLIC_KEY = originalKeys.pub;
  resetSigningKeys();
});

describe('GET /api/applications/:id', () => {
  it('lets a debtor read their own application', async () => {
    const res = await request('GET', `/api/applications/${appOfA}`, { token: debtorA });
    expect(res.status).toBe(200);
    expect(res.data.data.id).toBe(appOfA);
  });

  it("refuses a debtor another debtor's application", async () => {
    // The finding. Before ownership checks this returned 200 with the other
    // debtor's applicant, addresses, debts, assets and income.
    const res = await request('GET', `/api/applications/${appOfB}`, { token: debtorA });
    expect(res.status).toBe(404);
    expect(res.data.data).toBeUndefined();
  });

  it('answers 404 rather than 403, so the endpoint is not an existence oracle', async () => {
    // Distinguishing "exists but forbidden" from "does not exist" would let a
    // caller enumerate which application ids and reference numbers are real, which
    // is worth more than the refusal costs them.
    const forbidden = await request('GET', `/api/applications/${appOfB}`, { token: debtorA });
    const absent = await request('GET', '/api/applications/does-not-exist-at-all', { token: debtorA });

    expect(forbidden.status).toBe(absent.status);
    expect(forbidden.data.error.code).toBe(absent.data.error.code);
    expect(forbidden.data.error.message).toBe(absent.data.error.message);
  });

  it('refuses a debtor an application owned by nobody', async () => {
    // Null ownership must fail closed. Treating "no owner" as "anyone's" would
    // expose every staff-created and anonymously-started case to every debtor.
    const res = await request('GET', `/api/applications/${unowned}`, { token: debtorA });
    expect(res.status).toBe(404);
  });

  it('lets staff read any application', async () => {
    // Ownership constrains debtors only; staff work across cases by design and are
    // governed by permissions instead.
    for (const id of [appOfA, appOfB, unowned]) {
      const res = await request('GET', `/api/applications/${id}`, { token: officer });
      expect(res.status).toBe(200);
    }
  });
});

describe('GET /api/applications (list)', () => {
  it("returns only the debtor's own applications", async () => {
    const res = await request('GET', '/api/applications?pageSize=100', { token: debtorA });
    expect(res.status).toBe(200);

    const ids: string[] = res.data.data.map((a: any) => a.id);
    expect(ids).toContain(appOfA);
    expect(ids).not.toContain(appOfB);
    expect(ids).not.toContain(unowned);
  });

  it('cannot be widened by asking for another debtor', async () => {
    // The filter is set from the verified token, so a query parameter naming
    // someone else is ignored rather than honoured.
    const res = await request('GET', `/api/applications?debtorUserId=${encodeURIComponent('any-other-user')}&pageSize=100`, {
      token: debtorA,
    });

    const ids: string[] = res.data.data.map((a: any) => a.id);
    expect(ids).toContain(appOfA);
    expect(ids).not.toContain(appOfB);
  });

  it('reports a total consistent with the rows returned', async () => {
    // A scoped list with an unscoped count would leak how many cases exist in total.
    const res = await request('GET', '/api/applications?pageSize=100', { token: debtorA });
    expect(res.data.meta.totalCount).toBe(res.data.data.length);
  });

  it('shows staff the whole list', async () => {
    const res = await request('GET', '/api/applications?pageSize=100', { token: officer });
    const ids: string[] = res.data.data.map((a: any) => a.id);
    expect(ids).toContain(appOfA);
    expect(ids).toContain(appOfB);
  });
});

describe('writes', () => {
  it("refuses a debtor an update to another debtor's application", async () => {
    const res = await request('PUT', `/api/applications/${appOfB}`, {
      token: debtorA,
      body: { debtorDetails: { firstName: 'Hijacked' } },
    });
    expect(res.status).toBe(404);
  });

  it("refuses a debtor submitting another debtor's application", async () => {
    const res = await request('POST', `/api/applications/${appOfB}/submit`, { token: debtorA });
    expect(res.status).toBe(404);
  });

  it('does not let a debtor reassign ownership of their own application', async () => {
    // The PUT handler forwards the whole body to the repository, so `debtorUserId`
    // has to be stripped — otherwise a debtor could give their case away, or take
    // an unowned one.
    const res = await request('PUT', `/api/applications/${appOfA}`, {
      token: debtorA,
      body: { debtorUserId: 'user-admin' },
    });
    expect(res.status).toBe(200);

    const after = await applications.findById(appOfA);
    expect(after!.debtorUserId).toBe('user-debtor');
  });

  it('stamps ownership from the token on create, ignoring the body', async () => {
    // A client that could nominate the owner could plant an application in someone
    // else's account.
    const res = await request('POST', '/api/applications', {
      token: debtorA,
      body: { debtorUserId: 'user-admin', applicant: { firstName: 'Ann', lastName: 'Other' } },
    });
    expect(res.status).toBe(201);

    const created = await applications.findById(res.data.data.id);
    expect(created!.debtorUserId).toBe('user-debtor');
  });
});

describe('the update route cannot decide a statutory outcome', () => {
  /**
   * `PATCH /:id/status` refuses debtors and enforces `validTransitions`. `PUT /:id`
   * enforced neither, and stripped only `debtorUserId` — so `status`, `assignedTo` and
   * `submittedAt` all passed through to the repository.
   *
   * A debtor who owns a draft is exactly who the ownership check is meant to let
   * through, so ownership cannot catch this: they could `PUT {"status":"approved"}` and
   * decide their own sequestration, which is the outcome the status route exists to
   * prevent.
   */
  it('ignores a status sent by the owning debtor', async () => {
    const created = await applications.create({ debtorUserId: 'user-debtor', status: 'draft' });

    const res = await request('PUT', `/api/applications/${created.id}`, {
      token: debtorA,
      body: { status: 'approved' },
    });
    expect(res.status).toBe(200);

    // The write succeeds — it is a legitimate update of the fields they may set — but
    // the status is untouched.
    expect((await applications.findById(created.id))!.status).toBe('draft');
  });

  it('ignores a status sent by staff, who must use the status route', async () => {
    // Not a permission question: the transition matrix and the audit entry both live on
    // PATCH /:id/status, so a status set through PUT would bypass both even for someone
    // entitled to change it.
    const created = await applications.create({ status: 'draft' });

    await request('PUT', `/api/applications/${created.id}`, {
      token: officer,
      body: { status: 'approved' },
    });

    expect((await applications.findById(created.id))!.status).toBe('draft');
  });

  it('ignores assignedTo and submittedAt from the body', async () => {
    // Same class: assignment is a caseworker action and submission has its own route,
    // which stamps the time server-side.
    const created = await applications.create({ debtorUserId: 'user-debtor', status: 'draft' });

    await request('PUT', `/api/applications/${created.id}`, {
      token: debtorA,
      body: { assignedTo: 'user-admin', submittedAt: '2020-01-01T00:00:00.000Z' },
    });

    const after = await applications.findById(created.id);
    expect(after!.assignedTo).toBeNull();
    expect(after!.submittedAt).toBeNull();
  });

  it('cannot create an application that is already approved', async () => {
    // The create route spreads `status: 'draft'` first, so a body-supplied status would
    // have overridden it — an application could be born decided.
    const res = await request('POST', '/api/applications', {
      token: debtorA,
      body: { status: 'approved', applicant: { firstName: 'Pre', lastName: 'Approved' } },
    });
    expect(res.status).toBe(201);
    expect(res.data.data.status).toBe('draft');
  });

  it('still saves the applicant’s own answers on the same request', async () => {
    // The fix withholds three fields, not the whole body. If it went too far the
    // journey's auto-save would silently stop working.
    const created = await applications.create({ debtorUserId: 'user-debtor', status: 'draft' });

    await request('PUT', `/api/applications/${created.id}`, {
      token: debtorA,
      body: {
        status: 'approved',
        debtorDetails: { firstName: 'Real', lastName: 'Answer' },
      },
    });

    const stored = await applications.getWithRelations(created.id);
    expect(stored!.applicant!.firstName).toBe('Real');
    expect(stored!.status).toBe('draft');
  });
});

describe('staff-only casework', () => {
  it('refuses a debtor a status change on their own application', async () => {
    // Ownership is the wrong test here — owning the case is precisely what must not
    // grant it. A debtor moving their own application to `approved` would be
    // deciding their own sequestration.
    await applications.updateStatus(appOfA, 'submitted');
    const res = await request('PATCH', `/api/applications/${appOfA}/status`, {
      token: debtorA,
      body: { status: 'under_review' },
    });

    expect(res.status).toBe(403);
    expect(res.data.error.code).toBe('FORBIDDEN');
    expect((await applications.findById(appOfA))!.status).toBe('submitted');
  });

  it('refuses a debtor adding a case note', async () => {
    // Notes are the reviewer's record and are displayed as such, so a debtor
    // writing one would be putting words in a caseworker's mouth.
    const res = await request('POST', `/api/applications/${appOfA}/notes`, {
      token: debtorA,
      body: { content: 'Please approve this', noteType: 'general' },
    });
    expect(res.status).toBe(403);
  });

  it('allows staff both', async () => {
    const status = await request('PATCH', `/api/applications/${appOfA}/status`, {
      token: officer,
      body: { status: 'under_review' },
    });
    expect(status.status).toBe(200);

    const note = await request('POST', `/api/applications/${appOfA}/notes`, {
      token: officer,
      body: { content: 'Reviewed income evidence.', noteType: 'general' },
    });
    expect(note.status).toBe(201);
  });
});

describe('forged and absent credentials', () => {
  it('refuses an anonymous caller outright', async () => {
    // GAP-002, now closed. This assertion was inverted: it previously asserted 200 and
    // existed to fail loudly the moment authentication was required, so that the
    // register would be updated rather than quietly drifting. It did exactly that.
    //
    // Until this changed, ownership, per-request permissions and body validation were
    // all real for a caller who identified themselves and bypassable by one who did
    // not — worse than no control, because it reads as one.
    const res = await request('GET', `/api/applications/${appOfB}`);
    expect(res.status).toBe(401);
    expect(res.data.data).toBeUndefined();
  });

  it('refuses an unsigned token claiming to be the owning debtor', async () => {
    // Ownership is only as strong as the identity beneath it. This assertion could not
    // be written while anonymous access succeeded: whether the forgery was honoured or
    // ignored, the request returned 200 with the data either way, so the test could not
    // distinguish the two outcomes and passed regardless. With a token now required,
    // an unverifiable one is a straightforward 401.
    const forged = Buffer.from(
      JSON.stringify({ userId: 'user-debtor', role: 'debtor', exp: Date.now() + 60_000 })
    ).toString('base64');

    const res = await request('GET', `/api/applications/${appOfB}`, { token: forged });
    expect(res.status).toBe(401);
    expect(res.data.error.code).toBe('INVALID_TOKEN');
  });

  it('refuses a forged token naming a member of staff', async () => {
    // The escalation a forgery would be *for*: claiming an officer identity to reach a
    // case the forger does not own. Checked on the status route, where a real officer
    // would succeed, so the test fails if the signature check were ever bypassed.
    const forged = Buffer.from(
      JSON.stringify({ userId: 'user-demo', role: 'aib_officer', roleLevel: 60, exp: Date.now() + 60_000 })
    ).toString('base64');

    const res = await request('PATCH', `/api/applications/${appOfA}/status`, {
      token: forged,
      body: { status: 'under_review' },
    });
    expect(res.status).toBe(401);
  });

  it('refuses a signed token with no live session', async () => {
    // Signed by us and unexpired, but never registered — or logged out since. The
    // session lookup is what makes revocation immediate.
    const { token } = issueAccessToken({
      userId: 'user-debtor', email: 'john.testerton@example.com', role: 'debtor', roleLevel: 10,
    });

    const res = await request('GET', `/api/applications/${appOfA}`, { token });
    expect(res.status).toBe(401);
    expect(res.data.error.code).toBe('SESSION_ENDED');
  });
});
