import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index';
import http from 'http';

let server: http.Server;
let baseUrl: string;

function request(method: string, path: string, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode || 0, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode || 0, data: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('Audit Service - /api/audit/events', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${(server.address() as any).port}`;
        resolve();
      });
    });
  });

  afterAll(() => { server?.close(); });

  describe('POST /api/audit/events', () => {
    it('creates an audit event with valid data', async () => {
      const res = await request('POST', '/api/audit/events', {
        applicationId: 'app-001',
        action: 'application_created',
        actor: 'user@example.com',
        actorType: 'applicant',
        details: { step: 'initial' },
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toBeDefined();
      expect(res.data.data.timestamp).toBeDefined();
    });

    it('creates an audit event with system actorType', async () => {
      const res = await request('POST', '/api/audit/events', {
        applicationId: 'app-002',
        action: 'recommendation_generated',
        actor: 'recommendation-engine',
        actorType: 'system',
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
    });

    it('creates an audit event with staff actorType', async () => {
      const res = await request('POST', '/api/audit/events', {
        applicationId: 'app-003',
        action: 'status_changed',
        actor: 'admin@aib.gov',
        actorType: 'staff',
        details: { newStatus: 'under_review' },
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
    });
  });

  describe('GET /api/audit/events/:applicationId', () => {
    it('returns events for a specific application', async () => {
      // Use a unique application ID to avoid interference from other test runs
      const appId = `app-test-${Date.now()}`;
      await request('POST', '/api/audit/events', {
        applicationId: appId,
        action: 'created',
        actor: 'user1',
        actorType: 'applicant',
      });
      await request('POST', '/api/audit/events', {
        applicationId: appId,
        action: 'submitted',
        actor: 'user1',
        actorType: 'applicant',
      });

      const res = await request('GET', `/api/audit/events/${appId}`);

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.length).toBe(2);
    });

    it('returns events sorted by timestamp descending', async () => {
      // Create events with a unique app ID
      const appId = `app-sort-${Date.now()}`;
      await request('POST', '/api/audit/events', {
        applicationId: appId,
        action: 'first_event',
        actor: 'user1',
        actorType: 'applicant',
      });
      await request('POST', '/api/audit/events', {
        applicationId: appId,
        action: 'second_event',
        actor: 'user1',
        actorType: 'applicant',
      });

      const res = await request('GET', `/api/audit/events/${appId}`);

      expect(res.status).toBe(200);
      const events = res.data.data;
      expect(events.length).toBe(2);
      // Each event should have a timestamp field
      for (const event of events) {
        expect(event.timestamp).toBeDefined();
      }
      // Verify ordering: timestamps are non-increasing (descending)
      for (let i = 1; i < events.length; i++) {
        expect(events[i - 1].timestamp >= events[i].timestamp).toBe(true);
      }
    });

    it('returns empty array for application with no events', async () => {
      const res = await request('GET', '/api/audit/events/nonexistent-app');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toEqual([]);
    });
  });

  describe('GET /api/audit/events (with query params)', () => {
    it('filters events by action', async () => {
      const res = await request('GET', '/api/audit/events?action=application_created');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      for (const event of res.data.data) {
        expect(event.action).toBe('application_created');
      }
    });

    it('filters events by actor', async () => {
      const res = await request('GET', '/api/audit/events?actor=user@example.com');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      for (const event of res.data.data) {
        expect(event.actor).toBe('user@example.com');
      }
    });

    it('filters events by actorType', async () => {
      const res = await request('GET', '/api/audit/events?actorType=staff');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      for (const event of res.data.data) {
        expect(event.actor_type).toBe('staff');
      }
    });

    it('returns meta with count', async () => {
      const res = await request('GET', '/api/audit/events');

      expect(res.status).toBe(200);
      expect(res.data.meta).toBeDefined();
      expect(res.data.meta.count).toBeGreaterThanOrEqual(0);
    });
  });
});
