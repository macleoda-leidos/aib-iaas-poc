import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { signToken, buildClaims } from '@aib-iaas/auth';
import { app } from '../index';
import { audit } from '../db';
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

  it('GET /api/applications/:id retrieves the application', async () => {
    const create = await request('POST', '/api/applications', { applicant: { firstName: 'Get', lastName: 'Test' } });
    const id = create.data.data.id;

    const res = await request('GET', `/api/applications/${id}`);
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

      // Anonymous capability-URL read-back is still allowed (POC, pre-identity).
      const anon = await request('GET', `/api/applications/${id}`);
      expect(anon.status).toBe(200);
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
