import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { signToken, buildClaims } from '@aib-iaas/auth';
import { app } from '../index';
import { audit, notifications } from '../db';
import http from 'http';

// Integration tests for the API Gateway application endpoints
// Uses the actual Express app with SQLite (in-memory for tests)

let server: http.Server;
let baseUrl: string;

// A staff token for the routes that default-deny now protects (list, notes).
// Not a debtor, so applications are not owner-scoped (see ownership tests).
function staffToken(): string {
  return signToken(
    buildClaims({ id: 'USR-OFFICER', email: 'officer@aib.example', roleName: 'aib_officer', roleLevel: 60 }, ['applications.read', 'applications.update'])
  );
}

// A token that additionally holds applications.assign (senior/officer in RBAC).
function assignerToken(): string {
  return signToken(
    buildClaims({ id: 'USR-SENIOR', email: 'senior@aib.example', roleName: 'aib_senior_officer', roleLevel: 80 }, ['applications.read', 'applications.update', 'applications.assign'])
  );
}

function request(method: string, path: string, body?: any, headers?: Record<string, string>): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode || 0, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode || 0, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('API Gateway - Applications', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(() => { server?.close(); });

  it('GET /api/health returns healthy', async () => {
    const res = await request('GET', '/api/health');
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('healthy');
  });

  it('POST /api/applications creates an application', async () => {
    const res = await request('POST', '/api/applications', {
      applicant: { firstName: 'Test', lastName: 'User' },
    });
    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    expect(res.data.data.id).toBeDefined();
    expect(res.data.data.referenceNumber).toMatch(/^IAAS-\d{4}-\d+$/);
    expect(res.data.data.status).toBe('draft');
  });

  it('GET /api/applications/:id requires the capability token when anonymous', async () => {
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Get', lastName: 'Test' } });
    const id = create.data.data.id;
    const cap = create.data.data.capabilityToken;
    expect(cap).toBeDefined();

    // A guessed id with no capability is refused (read-IDOR closed), as a 404.
    const noCap = await request('GET', `/api/applications/${id}`);
    expect(noCap.status).toBe(404);

    // The capability token issued at create reads it back.
    const res = await request('GET', `/api/applications/${id}`, undefined, { 'X-Application-Capability': cap });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.applicant.firstName).toBe('Get');
  });

  it('GET /api/applications/:id returns 404 for unknown ID', async () => {
    const res = await request('GET', '/api/applications/nonexistent-id');
    expect(res.status).toBe(404);
    expect(res.data.success).toBe(false);
  });

  it('PUT /api/applications/:id updates the application', async () => {
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Old', lastName: 'Name' } });
    const id = create.data.data.id;

    const res = await request('PUT', `/api/applications/${id}`, { applicant: { firstName: 'New', lastName: 'Name' } });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  it('POST /api/applications/:id/submit changes status to submitted', async () => {
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Submit', lastName: 'Me' } });
    const id = create.data.data.id;

    const res = await request('POST', `/api/applications/${id}/submit`, {});
    expect(res.status).toBe(200);
    expect(res.data.data.status).toBe('submitted');
  });

  it('PUT on submitted application returns 400', async () => {
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Lock', lastName: 'Me' } });
    const id = create.data.data.id;
    await request('POST', `/api/applications/${id}/submit`, {});

    const res = await request('PUT', `/api/applications/${id}`, { applicant: { firstName: 'Changed' } });
    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('INVALID_STATE');
  });

  it('GET /api/applications requires authentication (default-deny)', async () => {
    const res = await request('GET', '/api/applications?page=1&pageSize=5');
    expect(res.status).toBe(401);
  });

  it('GET /api/applications lists applications with pagination', async () => {
    const res = await request('GET', '/api/applications?page=1&pageSize=5', undefined, { Authorization: `Bearer ${staffToken()}` });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.meta).toBeDefined();
    expect(res.data.meta.page).toBe(1);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  it('GET /api/postcode/:postcode returns addresses', async () => {
    const res = await request('GET', '/api/postcode/EH1%201AA');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.addresses.length).toBeGreaterThan(0);
    expect(res.data.data.addresses[0].city).toBe('Edinburgh');
  });

  it('POST /api/applications/:id/notes adds a staff note', async () => {
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Note', lastName: 'Test' } });
    const id = create.data.data.id;

    const res = await request('POST', `/api/applications/${id}/notes`, {
      content: 'Test note content',
      noteType: 'review',
    }, { Authorization: `Bearer ${staffToken()}` });
    expect(res.status).toBe(201);
    expect(res.data.data.content).toBe('Test note content');
    expect(res.data.data.noteType).toBe('review');
  });

  it('GET /api/applications/:id/notes returns the persisted note (survives the request)', async () => {
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Persist', lastName: 'Note' } });
    const id = create.data.data.id;

    await request('POST', `/api/applications/${id}/notes`, { content: 'A persisted note', noteType: 'review' }, { Authorization: `Bearer ${staffToken()}` });

    const res = await request('GET', `/api/applications/${id}/notes`, undefined, { Authorization: `Bearer ${staffToken()}` });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
    expect(res.data.data.length).toBe(1);
    expect(res.data.data[0].content).toBe('A persisted note');
    expect(res.data.data[0].noteType).toBe('review');
    expect(res.data.data[0].authorName).toBe('officer@aib.example');
  });

  it('GET /api/applications/:id/notes refuses an applicant (debtor) — notes are staff-internal', async () => {
    const debtor = signToken(buildClaims({ id: 'debtor-notes', email: 'd@debtor.example', roleName: 'debtor', roleLevel: 10 }, ['applications.read']));
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Deb', lastName: 'Tor' } }, { Authorization: `Bearer ${debtor}` });
    const id = create.data.data.id;

    const res = await request('GET', `/api/applications/${id}/notes`, undefined, { Authorization: `Bearer ${debtor}` });
    expect(res.status).toBe(403);
    expect(res.data.error.code).toBe('FORBIDDEN');
  });

  it('PATCH /api/applications/:id/assign assigns to a staff user and persists', async () => {
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Assign', lastName: 'Me' } });
    const id = create.data.data.id;

    const res = await request('PATCH', `/api/applications/${id}/assign`, { assignedTo: 'user-demo' }, { Authorization: `Bearer ${assignerToken()}` });
    expect(res.status).toBe(200);
    expect(res.data.data.assignedTo).toBe('user-demo');

    const list = await request('GET', '/api/applications?assignedTo=user-demo&pageSize=100', undefined, { Authorization: `Bearer ${assignerToken()}` });
    expect(list.data.data.some((a: any) => a.id === id)).toBe(true);
  });

  it('PATCH /api/applications/:id/assign rejects a token without applications.assign (403)', async () => {
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'No', lastName: 'Assign' } });
    const id = create.data.data.id;

    const res = await request('PATCH', `/api/applications/${id}/assign`, { assignedTo: 'user-demo' }, { Authorization: `Bearer ${staffToken()}` });
    expect(res.status).toBe(403);
    expect(res.data.error.details.required).toContain('applications.assign');
  });

  it('PATCH /api/applications/:id/assign rejects an unknown assignee (400)', async () => {
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Bad', lastName: 'Assignee' } });
    const id = create.data.data.id;

    const res = await request('PATCH', `/api/applications/${id}/assign`, { assignedTo: 'nope-not-a-user' }, { Authorization: `Bearer ${assignerToken()}` });
    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('INVALID_ASSIGNEE');
  });

  it('PATCH assign with null clears the assignment, and ?assignedTo=unassigned finds it', async () => {
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Un', lastName: 'Assign' } });
    const id = create.data.data.id;
    await request('PATCH', `/api/applications/${id}/assign`, { assignedTo: 'user-demo' }, { Authorization: `Bearer ${assignerToken()}` });

    const clear = await request('PATCH', `/api/applications/${id}/assign`, { assignedTo: null }, { Authorization: `Bearer ${assignerToken()}` });
    expect(clear.status).toBe(200);
    expect(clear.data.data.assignedTo).toBeNull();

    const list = await request('GET', '/api/applications?assignedTo=unassigned&pageSize=100', undefined, { Authorization: `Bearer ${assignerToken()}` });
    expect(list.data.data.some((a: any) => a.id === id)).toBe(true);
  });

  it('fires an in-app notification to the owner on submit and on a status change', async () => {
    const owner = signToken(buildClaims({ id: 'owner-notif', email: 'o@debtor.example', roleName: 'debtor', roleLevel: 10 }, ['applications.read', 'applications.create', 'applications.submit']));
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Notif', lastName: 'Owner' } }, { Authorization: `Bearer ${owner}` });
    const id = create.data.data.id;

    await request('POST', `/api/applications/${id}/submit`, {}, { Authorization: `Bearer ${owner}` });
    expect(notifications.findByUser('owner-notif', { limit: 50 }).some(n => n.subject === 'Application submitted')).toBe(true);

    // A senior moving it to under_review fires a second notification to the owner.
    const senior = signToken(buildClaims({ id: 'senior-n', email: 'sn@aib.example', roleName: 'aib_senior_officer', roleLevel: 80 }, ['applications.update']));
    await request('PATCH', `/api/applications/${id}/status`, { status: 'under_review' }, { Authorization: `Bearer ${senior}` });
    expect(notifications.findByUser('owner-notif', { limit: 50 }).some(n => n.subject.includes('under review'))).toBe(true);
  });

  it('resolves an application by REFERENCE NUMBER for staff actions (the case screen only knows the ref)', async () => {
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Ref', lastName: 'Lookup' } }, { Authorization: `Bearer ${assignerToken()}` });
    const ref = create.data.data.referenceNumber;
    await request('POST', `/api/applications/${create.data.data.id}/submit`, {}, { Authorization: `Bearer ${assignerToken()}` });

    // Transition BY REFERENCE NUMBER (not the opaque id).
    const res = await request('PATCH', `/api/applications/${ref}/status`, { status: 'under_review' }, { Authorization: `Bearer ${assignerToken()}` });
    expect(res.status).toBe(200);

    // Notes by reference number persist and read back.
    await request('POST', `/api/applications/${ref}/notes`, { content: 'via ref' }, { Authorization: `Bearer ${assignerToken()}` });
    const notesRes = await request('GET', `/api/applications/${ref}/notes`, undefined, { Authorization: `Bearer ${assignerToken()}` });
    expect(notesRes.data.data.some((n: any) => n.content === 'via ref')).toBe(true);
  });

  it('creditor submits a claim; staff reads and accepts it (E7b)', async () => {
    const creditor = signToken(buildClaims({ id: 'cred-1', email: 'c@rbs.example', roleName: 'creditor', roleLevel: 30, organisationId: 'org-rbs' }, ['applications.read', 'claims.create', 'claims.read']));
    const manager = signToken(buildClaims({ id: 'mgr-1', email: 'm@aib.example', roleName: 'aib_officer', roleLevel: 60, organisationId: 'org-aib' }, ['applications.read', 'claims.read', 'claims.manage']));
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Claim', lastName: 'Target' } });
    const id = create.data.data.id;

    const submit = await request('POST', `/api/applications/${id}/claims`, { amount: 5000, basis: 'Credit card arrears' }, { Authorization: `Bearer ${creditor}` });
    expect(submit.status).toBe(201);
    expect(submit.data.data.status).toBe('submitted');
    const claimId = submit.data.data.id;

    const list = await request('GET', `/api/applications/${id}/claims`, undefined, { Authorization: `Bearer ${manager}` });
    expect(list.status).toBe(200);
    expect(list.data.data.some((c: any) => c.id === claimId)).toBe(true);

    const decide = await request('PATCH', `/api/claims/${claimId}`, { status: 'accepted' }, { Authorization: `Bearer ${manager}` });
    expect(decide.status).toBe(200);
    expect(decide.data.data.status).toBe('accepted');
  });

  it('rejects a claim submission without claims.create (403)', async () => {
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'No', lastName: 'Claim' } });
    const id = create.data.data.id;
    const weak = signToken(buildClaims({ id: 'ro-claim', email: 'ro@x.example', roleName: 'aib_readonly', roleLevel: 20 }, ['applications.read', 'claims.read']));
    const res = await request('POST', `/api/applications/${id}/claims`, { amount: 100 }, { Authorization: `Bearer ${weak}` });
    expect(res.status).toBe(403);
  });

  it('records an adviser submit-on-behalf and scopes the adviser caseload (E7a)', async () => {
    const adviser = signToken(buildClaims({ id: 'adv-1', email: 'adv@cas.example', roleName: 'money_adviser', roleLevel: 50, organisationId: 'org-cas' }, ['applications.create', 'applications.read', 'applications.submit']));
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Client', lastName: 'OnBehalf' }, authorityDeclared: true }, { Authorization: `Bearer ${adviser}` });
    expect(create.status).toBe(201);
    const id = create.data.data.id;
    expect(create.data.data.submittedByUserId).toBe('adv-1');
    expect(create.data.data.authorityDeclaredAt).toBeTruthy();

    const list = await request('GET', '/api/applications?pageSize=200', undefined, { Authorization: `Bearer ${adviser}` });
    expect(list.status).toBe(200);
    expect(list.data.data.length).toBeGreaterThan(0);
    expect(list.data.data.every((a: any) => a.submittedByUserId === 'adv-1')).toBe(true);
    expect(list.data.data.some((a: any) => a.id === id)).toBe(true);
  });

  it('does not let the submitter fields be injected via the create body', async () => {
    const adviser = signToken(buildClaims({ id: 'adv-2', email: 'adv2@cas.example', roleName: 'money_adviser', roleLevel: 50, organisationId: 'org-cas' }, ['applications.create', 'applications.read']));
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Spoof', lastName: 'Attempt' }, submittedByUserId: 'victim', authorityDeclaredAt: '2020-01-01' }, { Authorization: `Bearer ${adviser}` });
    expect(create.status).toBe(201);
    // No authorityDeclared → not on-behalf → submitter is null, never the body value.
    expect(create.data.data.submittedByUserId).toBeNull();
  });

  it('supports two-way applicant/staff messaging with direction derived from the token (E6)', async () => {
    const owner = signToken(buildClaims({ id: 'msg-owner', email: 'mo@debtor.example', roleName: 'debtor', roleLevel: 10 }, ['applications.read', 'applications.create']));
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Msg', lastName: 'Owner' } }, { Authorization: `Bearer ${owner}` });
    const id = create.data.data.id;

    const fromApplicant = await request('POST', `/api/applications/${id}/messages`, { body: 'When will my application be reviewed?' }, { Authorization: `Bearer ${owner}` });
    expect(fromApplicant.status).toBe(201);
    expect(fromApplicant.data.data.direction).toBe('applicant');

    const staff = signToken(buildClaims({ id: 'msg-staff', email: 'ms@aib.example', roleName: 'aib_officer', roleLevel: 60 }, ['applications.read', 'applications.update']));
    const fromStaff = await request('POST', `/api/applications/${id}/messages`, { body: 'We are reviewing it now.' }, { Authorization: `Bearer ${staff}` });
    expect(fromStaff.status).toBe(201);
    expect(fromStaff.data.data.direction).toBe('staff');

    const thread = await request('GET', `/api/applications/${id}/messages`, undefined, { Authorization: `Bearer ${staff}` });
    expect(thread.status).toBe(200);
    expect(thread.data.data.length).toBe(2);
    expect(thread.data.data[0].body).toContain('When will');
    expect(thread.data.data[1].direction).toBe('staff');
  });

  it("a debtor cannot read another debtor's messages (404)", async () => {
    const a = signToken(buildClaims({ id: 'msg-a', email: 'a@debtor.example', roleName: 'debtor', roleLevel: 10 }, ['applications.read', 'applications.create']));
    const b = signToken(buildClaims({ id: 'msg-b', email: 'b@debtor.example', roleName: 'debtor', roleLevel: 10 }, ['applications.read']));
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Priv', lastName: 'Ate' } }, { Authorization: `Bearer ${a}` });
    const id = create.data.data.id;
    await request('POST', `/api/applications/${id}/messages`, { body: 'private' }, { Authorization: `Bearer ${a}` });

    const asB = await request('GET', `/api/applications/${id}/messages`, undefined, { Authorization: `Bearer ${b}` });
    expect(asB.status).toBe(404);
  });

  describe('ownership (H1) and attribution (H3)', () => {
    const debtorA = signToken(buildClaims({ id: 'debtor-A', email: 'a@debtor.example', roleName: 'debtor', roleLevel: 10 }, ['applications.read']));
    const debtorB = signToken(buildClaims({ id: 'debtor-B', email: 'b@debtor.example', roleName: 'debtor', roleLevel: 10 }, ['applications.read']));
    const senior = signToken(buildClaims({ id: 'senior-1', email: 'senior@aib.example', roleName: 'aib_senior_officer', roleLevel: 80 }, ['applications.read', 'applications.update', 'applications.approve', 'applications.reject']));

    it("a debtor cannot read another debtor's application (404, not 403)", async () => {
      const create = await request('POST', '/api/applications', { applicant: { firstName: 'Own', lastName: 'Er' } }, { Authorization: `Bearer ${debtorA}` });
      const id = create.data.data.id;

      const asB = await request('GET', `/api/applications/${id}`, undefined, { Authorization: `Bearer ${debtorB}` });
      expect(asB.status).toBe(404);

      const asA = await request('GET', `/api/applications/${id}`, undefined, { Authorization: `Bearer ${debtorA}` });
      expect(asA.status).toBe(200);

      // Anonymous without the capability token is now refused (read-IDOR closed)...
      const anon = await request('GET', `/api/applications/${id}`);
      expect(anon.status).toBe(404);

      // ...but the capability token issued at create still reads it back.
      const withCap = await request('GET', `/api/applications/${id}`, undefined, { 'X-Application-Capability': create.data.data.capabilityToken });
      expect(withCap.status).toBe(200);
    });

    it('rejects an approve from a token without applications.approve (403)', async () => {
      const create = await request('POST', '/api/applications', { applicant: { firstName: 'No', lastName: 'Approve' } }, { Authorization: `Bearer ${debtorA}` });
      const id = create.data.data.id;
      await request('POST', `/api/applications/${id}/submit`, {}, { Authorization: `Bearer ${debtorA}` });

      // staffToken() is an officer: has applications.update, not applications.approve.
      const res = await request('PATCH', `/api/applications/${id}/status`, { status: 'approved' }, { Authorization: `Bearer ${staffToken()}` });
      expect(res.status).toBe(403);
    });

    it('attributes a status change to the token actor, not a literal', async () => {
      const create = await request('POST', '/api/applications', { applicant: { firstName: 'Attr', lastName: 'Ib' } }, { Authorization: `Bearer ${debtorA}` });
      const id = create.data.data.id;
      await request('POST', `/api/applications/${id}/submit`, {}, { Authorization: `Bearer ${debtorA}` });

      const res = await request('PATCH', `/api/applications/${id}/status`, { status: 'under_review' }, { Authorization: `Bearer ${senior}` });
      expect(res.status).toBe(200);

      const statusEvent = audit.findByApplication(id).find((e: any) => e.action === 'status_changed_to_under_review');
      expect(statusEvent?.actorName).toBe('senior@aib.example');
      expect(statusEvent?.actorName).not.toBe('aib_staff');
    });
  });
});
