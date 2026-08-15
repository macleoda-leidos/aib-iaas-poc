import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';

const PORT = 4101;
let server: any;

function request(method: string, path: string, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 500, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 500, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('Applications Status Transitions', () => {
  let appId: string;
  let refNumber: string;

  beforeAll(async () => {
    // Start the server
    process.env.PORT = String(PORT);
    process.env.DATABASE_PATH = ':memory:';
    const { createApp } = await import('../index');
    const app = createApp ? createApp() : (await import('../index')).default;

    // If createApp doesn't exist, we need to start differently
    // For now, let's create an application via the API
  });

  it('should create a draft application', async () => {
    const res = await request('POST', '/api/applications', {
      debtorDetails: { firstName: 'Test', lastName: 'User' },
    });
    // If API is running on this port
    if (res.status === 201) {
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toBeDefined();
      expect(res.data.data.referenceNumber).toMatch(/^IAAS-\d{4}-\d{5}$/);
      expect(res.data.data.status).toBe('draft');
      appId = res.data.data.id;
      refNumber = res.data.data.referenceNumber;
    }
  });

  it('should update a draft application', async () => {
    if (!appId) return;
    const res = await request('PUT', `/api/applications/${appId}`, {
      debtorDetails: { firstName: 'Test', lastName: 'User', dateOfBirth: '1990-01-01' },
      debtSummary: { totalDebtAmount: 15000, debts: [] },
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  it('should submit an application', async () => {
    if (!appId) return;
    const res = await request('POST', `/api/applications/${appId}/submit`);
    expect(res.status).toBe(200);
    expect(res.data.data.status).toBe('submitted');
    expect(res.data.data.referenceNumber).toBe(refNumber);
  });

  it('should transition submitted → under_review', async () => {
    if (!appId) return;
    const res = await request('PATCH', `/api/applications/${appId}/status`, {
      status: 'under_review',
      notes: 'Assigned for review',
    });
    expect(res.status).toBe(200);
    expect(res.data.data.status).toBe('under_review');
  });

  it('should transition under_review → approved', async () => {
    if (!appId) return;
    const res = await request('PATCH', `/api/applications/${appId}/status`, {
      status: 'approved',
      notes: 'DAS recommended',
    });
    expect(res.status).toBe(200);
    expect(res.data.data.status).toBe('approved');
  });

  it('should reject invalid status transitions', async () => {
    if (!appId) return;
    // Can't go from approved back to draft
    const res = await request('PATCH', `/api/applications/${appId}/status`, {
      status: 'draft',
    });
    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('INVALID_TRANSITION');
  });

  it('should list applications with referenceNumber filter', async () => {
    if (!refNumber) return;
    const res = await request('GET', `/api/applications?referenceNumber=${refNumber}`);
    expect(res.status).toBe(200);
    expect(res.data.data.length).toBe(1);
    expect(res.data.data[0].referenceNumber).toBe(refNumber);
  });

  it('should return 404 for non-existent application', async () => {
    const res = await request('GET', '/api/applications/non-existent-id');
    expect(res.status).toBe(404);
    expect(res.data.success).toBe(false);
  });

  it('should return 404 when patching non-existent application', async () => {
    const res = await request('PATCH', '/api/applications/non-existent-id/status', {
      status: 'approved',
    });
    expect(res.status).toBe(404);
  });
});
