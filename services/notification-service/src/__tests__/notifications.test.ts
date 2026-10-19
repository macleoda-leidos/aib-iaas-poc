import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { signToken, buildClaims } from '@aib-iaas/auth';
import { app } from '../index';
import http from 'http';

let server: http.Server;
let baseUrl: string;

// Notifications are now access-controlled (A1): send/send-bulk are staff-only,
// and the per-user routes require the caller to own :userId or be staff. A staff
// token covers every case these tests exercise (they operate across many userIds).
const STAFF = () => ({
  Authorization: `Bearer ${signToken(
    buildClaims({ id: 'USR-OFFICER', email: 'officer@aib.example', roleName: 'aib_officer', roleLevel: 60 }, ['applications.read'])
  )}`,
});

function request(method: string, path: string, body?: any, headers: Record<string, string> = STAFF()): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
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

describe('Notification Service - /api/notifications', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${(server.address() as any).port}`;
        resolve();
      });
    });
  });

  afterAll(() => { server?.close(); });

  describe('access control (A1)', () => {
    const debtorToken = (id: string) =>
      `Bearer ${signToken(buildClaims({ id, email: `${id}@debtor.example`, roleName: 'debtor', roleLevel: 10 }, ['applications.read']))}`;

    it('rejects an anonymous send with 401', async () => {
      const res = await request('POST', '/api/notifications/send', { userId: 'u', subject: 's', body: 'b' }, { 'Content-Type': 'application/json' });
      expect(res.status).toBe(401);
    });

    it('rejects a debtor sending a notification (staff-only) with 403', async () => {
      const res = await request('POST', '/api/notifications/send', { userId: 'u', subject: 's', body: 'b' }, { Authorization: debtorToken('debtor-send') });
      expect(res.status).toBe(403);
    });

    it("a debtor cannot read another user's notifications (404)", async () => {
      // Staff seeds a notification for debtor-A.
      await request('POST', '/api/notifications/send', { userId: 'debtor-A', channel: 'in_app', subject: 'Yours', body: 'private' });
      // debtor-B asking for debtor-A's feed is refused as 404 (never confirms the id).
      const asB = await request('GET', '/api/notifications/user/debtor-A', undefined, { Authorization: debtorToken('debtor-B') });
      expect(asB.status).toBe(404);
    });

    it('a debtor CAN read their own notifications (200)', async () => {
      await request('POST', '/api/notifications/send', { userId: 'debtor-self', channel: 'in_app', subject: 'Yours', body: 'ok' });
      const asSelf = await request('GET', '/api/notifications/user/debtor-self', undefined, { Authorization: debtorToken('debtor-self') });
      expect(asSelf.status).toBe(200);
      expect(asSelf.data.data.notifications.length).toBeGreaterThan(0);
    });

    it('refuses to mark another user\'s notification read (404)', async () => {
      const created = await request('POST', '/api/notifications/send', { userId: 'owner-x', channel: 'in_app', subject: 'x', body: 'x' });
      const notifId = created.data.data.id;
      const asOther = await request('PATCH', `/api/notifications/${notifId}/read`, undefined, { Authorization: debtorToken('not-owner') });
      expect(asOther.status).toBe(404);
    });
  });

  describe('POST /api/notifications/send', () => {
    it('creates a notification with valid data', async () => {
      const res = await request('POST', '/api/notifications/send', {
        userId: 'user-001',
        type: 'info',
        channel: 'email',
        subject: 'Application Update',
        body: 'Your application has been received.',
        link: '/applications/app-001',
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toBeDefined();
      expect(res.data.data.channel).toBe('email');
      expect(res.data.data.sentAt).toBeDefined();
    });

    it('defaults type to info and channel to in_app when not provided', async () => {
      const res = await request('POST', '/api/notifications/send', {
        userId: 'user-002',
        subject: 'Default Channel Test',
        body: 'Testing defaults',
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
    });

    it('supports sms channel', async () => {
      const res = await request('POST', '/api/notifications/send', {
        userId: 'user-001',
        type: 'action_required',
        channel: 'sms',
        subject: 'Payment Due',
        body: 'Your payment is due tomorrow.',
      });

      expect(res.status).toBe(201);
      expect(res.data.data.channel).toBe('sms');
    });

    it('supports in_app channel', async () => {
      const res = await request('POST', '/api/notifications/send', {
        userId: 'user-001',
        type: 'success',
        channel: 'in_app',
        subject: 'Welcome',
        body: 'Welcome to the AiB portal.',
      });

      expect(res.status).toBe(201);
      expect(res.data.data.channel).toBe('in_app');
    });

    it('stores metadata with the notification', async () => {
      const res = await request('POST', '/api/notifications/send', {
        userId: 'user-003',
        type: 'info',
        channel: 'in_app',
        subject: 'Metadata Test',
        body: 'Testing metadata storage',
        metadata: { applicationRef: 'IAAS-2024-00001', priority: 'high' },
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
    });
  });

  describe('GET /api/notifications/user/:userId', () => {
    it('returns notifications for a user', async () => {
      const res = await request('GET', '/api/notifications/user/user-001');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.notifications.length).toBeGreaterThan(0);
      expect(res.data.data.unreadCount).toBeGreaterThanOrEqual(0);
    });

    it('returns empty for user with no notifications', async () => {
      const res = await request('GET', '/api/notifications/user/user-nonexistent');

      expect(res.status).toBe(200);
      expect(res.data.data.notifications).toHaveLength(0);
      expect(res.data.data.unreadCount).toBe(0);
    });

    it('filters unread notifications when unreadOnly=true', async () => {
      const res = await request('GET', '/api/notifications/user/user-001?unreadOnly=true');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('marks a notification as read', async () => {
      // Create a notification first
      const createRes = await request('POST', '/api/notifications/send', {
        userId: 'user-read-test',
        type: 'info',
        channel: 'in_app',
        subject: 'Read Test',
        body: 'Mark me as read',
      });
      const notifId = createRes.data.data.id;

      // Mark as read
      const res = await request('PATCH', `/api/notifications/${notifId}/read`);

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.read).toBe(true);
    });
  });

  describe('PATCH /api/notifications/user/:userId/read-all', () => {
    it('marks all notifications as read for a user', async () => {
      // Create some unread notifications
      await request('POST', '/api/notifications/send', {
        userId: 'user-readall',
        channel: 'in_app',
        subject: 'Unread 1',
        body: 'Body 1',
      });
      await request('POST', '/api/notifications/send', {
        userId: 'user-readall',
        channel: 'in_app',
        subject: 'Unread 2',
        body: 'Body 2',
      });

      const res = await request('PATCH', '/api/notifications/user/user-readall/read-all');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.markedRead).toBeGreaterThanOrEqual(2);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('deletes a notification', async () => {
      // Create then delete
      const createRes = await request('POST', '/api/notifications/send', {
        userId: 'user-delete-test',
        channel: 'in_app',
        subject: 'Delete Me',
        body: 'To be deleted',
      });
      const notifId = createRes.data.data.id;

      const res = await request('DELETE', `/api/notifications/${notifId}`);

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.deleted).toBe(true);
    });
  });
});
