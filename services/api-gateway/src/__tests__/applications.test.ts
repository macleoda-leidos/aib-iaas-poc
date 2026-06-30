import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index';
import http from 'http';

// Integration tests for the API Gateway application endpoints
// Uses the actual Express app with SQLite (in-memory for tests)

let server: http.Server;
let baseUrl: string;

function request(method: string, path: string, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
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
      debtorDetails: { firstName: 'Test', lastName: 'User' },
    });
    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    expect(res.data.data.id).toBeDefined();
    expect(res.data.data.referenceNumber).toMatch(/^IAAS-\d{4}-\d+$/);
    expect(res.data.data.status).toBe('draft');
  });

  it('GET /api/applications/:id retrieves the application', async () => {
    const create = await request('POST', '/api/applications', { debtorDetails: { firstName: 'Get', lastName: 'Test' } });
    const id = create.data.data.id;

    const res = await request('GET', `/api/applications/${id}`);
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.debtorDetails.firstName).toBe('Get');
  });

  it('GET /api/applications/:id returns 404 for unknown ID', async () => {
    const res = await request('GET', '/api/applications/nonexistent-id');
    expect(res.status).toBe(404);
    expect(res.data.success).toBe(false);
  });

  it('PUT /api/applications/:id updates the application', async () => {
    const create = await request('POST', '/api/applications', { debtorDetails: { firstName: 'Old', lastName: 'Name' } });
    const id = create.data.data.id;

    const res = await request('PUT', `/api/applications/${id}`, { debtorDetails: { firstName: 'New', lastName: 'Name' } });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  it('POST /api/applications/:id/submit changes status to submitted', async () => {
    const create = await request('POST', '/api/applications', { debtorDetails: { firstName: 'Submit', lastName: 'Me' } });
    const id = create.data.data.id;

    const res = await request('POST', `/api/applications/${id}/submit`, {});
    expect(res.status).toBe(200);
    expect(res.data.data.status).toBe('submitted');
  });

  it('PUT on submitted application returns 400', async () => {
    const create = await request('POST', '/api/applications', { debtorDetails: { firstName: 'Lock', lastName: 'Me' } });
    const id = create.data.data.id;
    await request('POST', `/api/applications/${id}/submit`, {});

    const res = await request('PUT', `/api/applications/${id}`, { debtorDetails: { firstName: 'Changed' } });
    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('INVALID_STATE');
  });

  it('GET /api/applications lists applications with pagination', async () => {
    const res = await request('GET', '/api/applications?page=1&pageSize=5');
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
    const create = await request('POST', '/api/applications', { debtorDetails: { firstName: 'Note', lastName: 'Test' } });
    const id = create.data.data.id;

    const res = await request('POST', `/api/applications/${id}/notes`, {
      content: 'Test note content',
      noteType: 'review',
      authorName: 'Test Officer',
    });
    expect(res.status).toBe(201);
    expect(res.data.data.content).toBe('Test note content');
    expect(res.data.data.noteType).toBe('review');
  });
});
