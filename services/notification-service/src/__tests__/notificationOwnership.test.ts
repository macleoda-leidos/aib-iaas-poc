import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { bearerFor, useFixedSigningKeys, ADMIN, DEBTOR } from '../../../../tests/helpers/authHeaders';
import { app } from '../index';
import { getNotificationDb } from '../db';
import { createRepositories } from '@aib-iaas/database';
import { clearPermissionCache } from '../middleware/rbac';

/**
 * Ownership and authorisation on the notification routes.
 *
 * Authentication landed here first and closed none of the following on its own — it only
 * required the caller to log in before doing them:
 *
 *  - `PATCH /:id/read` and `DELETE /:id` took an id and checked nothing, so any
 *    authenticated user could mark read or **destroy** any other user's case
 *    correspondence.
 *  - `PATCH /user/:userId/read-all` honoured the path parameter for everyone.
 *  - `POST /send` let any authenticated caller — a debtor included — write an arbitrary
 *    subject and body to any userId, attributed to the service.
 *
 * Every case below asserts across the boundary between **two different debtors**, because
 * a test with one debtor cannot tell "scoped to me" from "scoped to nobody" — which is
 * exactly how the original suite passed over an unscoped DELETE.
 */

let server: http.Server;
let baseUrl: string;

let debtorA: Record<string, string>;
let debtorB: Record<string, string>;
let staff: Record<string, string>;

let debtorBId: string;

const originalKeys = { priv: process.env.JWT_PRIVATE_KEY, pub: process.env.JWT_PUBLIC_KEY };

function request(
  method: string,
  path: string,
  opts: { body?: any; headers?: Record<string, string> } = {}
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
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
    if (opts.body !== undefined) req.write(JSON.stringify(opts.body));
    req.end();
  });
}

/** Insert a notification directly, so a test is not set up through the route it is testing. */
function seedNotification(userId: string, subject = 'Case update'): string {
  const id = `notif-test-${Math.random().toString(36).slice(2, 10)}`;
  getNotificationDb()
    .prepare('INSERT INTO notifications (id, user_id, type, channel, subject, body) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, userId, 'info', 'in_app', subject, 'Body text');
  return id;
}

function readFlag(id: string): number | undefined {
  const row = getNotificationDb().prepare('SELECT read FROM notifications WHERE id = ?').get(id) as any;
  return row?.read;
}

function exists(id: string): boolean {
  return Boolean(getNotificationDb().prepare('SELECT 1 FROM notifications WHERE id = ?').get(id));
}

beforeAll(async () => {
  useFixedSigningKeys();
  const { users } = createRepositories();

  // A second debtor, because the seed ships one and the whole point is to assert across
  // the boundary between two of them.
  const email = `notif-debtor-b-${Date.now()}@example.com`;
  await users.create({ email, firstName: 'Morag', lastName: 'Sinclair', roleId: 'role-debtor' });
  const created = await users.findByEmail(email);
  debtorBId = created!.id;

  debtorA = await bearerFor(DEBTOR);
  debtorB = await bearerFor({ userId: debtorBId, email, role: 'debtor', roleLevel: 10 });
  staff = await bearerFor(ADMIN);

  // Permissions are resolved from the database and cached for 5s. The migration that adds
  // `notifications.send` may have run after a cache entry was populated by another suite
  // in the same process.
  clearPermissionCache();

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
});

describe('DELETE /:id', () => {
  it("refuses a debtor another user's notification, and leaves it intact", async () => {
    // The destructive finding. This previously returned 200 and the row was gone.
    const theirs = seedNotification(debtorBId);

    const res = await request('DELETE', `/api/notifications/${theirs}`, { headers: debtorA });

    expect(res.status).toBe(404);
    expect(exists(theirs)).toBe(true);
  });

  it('lets a debtor delete their own', async () => {
    // The other half: scoping must not be so tight that it scopes to nobody.
    const mine = seedNotification(DEBTOR.userId);

    const res = await request('DELETE', `/api/notifications/${mine}`, { headers: debtorA });

    expect(res.status).toBe(200);
    expect(exists(mine)).toBe(false);
  });

  it('answers 404 rather than 403, so the endpoint is not an existence oracle', async () => {
    // Distinguishing "someone else's" from "no such notification" would let a caller
    // enumerate which ids are real.
    const theirs = seedNotification(debtorBId);

    const forbidden = await request('DELETE', `/api/notifications/${theirs}`, { headers: debtorA });
    const absent = await request('DELETE', '/api/notifications/notif-does-not-exist', { headers: debtorA });

    expect(forbidden.status).toBe(absent.status);
    expect(forbidden.data.error.code).toBe(absent.data.error.code);
    expect(forbidden.data.error.message).toBe(absent.data.error.message);
  });

  it('lets staff delete any notification', async () => {
    const theirs = seedNotification(debtorBId);
    const res = await request('DELETE', `/api/notifications/${theirs}`, { headers: staff });
    expect(res.status).toBe(200);
  });
});

describe('PATCH /:id/read', () => {
  it("refuses a debtor another user's notification, and leaves it unread", async () => {
    const theirs = seedNotification(debtorBId);

    const res = await request('PATCH', `/api/notifications/${theirs}/read`, { headers: debtorA });

    expect(res.status).toBe(404);
    expect(readFlag(theirs)).toBe(0);
  });

  it('lets a debtor mark their own read', async () => {
    const mine = seedNotification(DEBTOR.userId);

    const res = await request('PATCH', `/api/notifications/${mine}/read`, { headers: debtorA });

    expect(res.status).toBe(200);
    expect(readFlag(mine)).toBe(1);
  });
});

describe('PATCH /user/:userId/read-all', () => {
  it("ignores a userId naming someone else and marks only the caller's own", async () => {
    // The path parameter was honoured for everyone, so a debtor could clear another
    // user's unread state — destroying the signal that they had never seen a case update.
    const theirs = seedNotification(debtorBId);
    const mine = seedNotification(DEBTOR.userId);

    const res = await request('PATCH', `/api/notifications/user/${debtorBId}/read-all`, { headers: debtorA });

    expect(res.status).toBe(200);
    expect(readFlag(theirs)).toBe(0);
    expect(readFlag(mine)).toBe(1);
  });

  it('honours the userId for staff, who work across cases', async () => {
    const theirs = seedNotification(debtorBId);

    const res = await request('PATCH', `/api/notifications/user/${debtorBId}/read-all`, { headers: staff });

    expect(res.status).toBe(200);
    expect(readFlag(theirs)).toBe(1);
  });
});

describe('GET /user/:userId', () => {
  it("never returns another user's correspondence", async () => {
    const theirs = seedNotification(debtorBId, 'Sinclair case decision');
    seedNotification(DEBTOR.userId, 'Testerton case decision');

    const res = await request('GET', `/api/notifications/user/${debtorBId}?limit=100`, { headers: debtorA });

    expect(res.status).toBe(200);
    const ids = res.data.data.notifications.map((n: any) => n.id);
    expect(ids).not.toContain(theirs);
    // Not merely absent from the list — the subject must not leak anywhere in the body.
    expect(JSON.stringify(res.data)).not.toContain('Sinclair case decision');
  });

  it('reports an unread count for the caller, not for the userId asked about', async () => {
    // A scoped list with an unscoped count would leak how much correspondence another
    // user has.
    const res = await request('GET', `/api/notifications/user/${debtorBId}?limit=100`, { headers: debtorA });
    const own = await request('GET', `/api/notifications/user/${DEBTOR.userId}?limit=100`, { headers: debtorA });

    expect(res.data.data.unreadCount).toBe(own.data.data.unreadCount);
  });
});

describe('GET /preferences/:userId', () => {
  it('does not confirm another user id exists', async () => {
    const res = await request('GET', `/api/notifications/preferences/${debtorBId}`, { headers: debtorA });
    expect(res.data.data.userId).toBe(DEBTOR.userId);
  });
});

describe('POST /send requires notifications.send', () => {
  it('refuses a debtor outright', async () => {
    // The phishing primitive: a message attributed to the service, in the product's own
    // channel, addressed to anyone. Authentication alone did not stop it.
    const res = await request('POST', '/api/notifications/send', {
      headers: debtorA,
      body: {
        userId: debtorBId,
        subject: 'Action required: confirm your bank details',
        body: 'Follow this link to verify your account.',
      },
    });

    expect(res.status).toBe(403);
    expect(res.data.error.code).toBe('FORBIDDEN');
  });

  it('does not write the notification it refused', async () => {
    // A 403 that still inserted would be worse than no check, because the message would
    // arrive and the response would say it had not.
    const before = (getNotificationDb()
      .prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ?')
      .get(debtorBId) as any).c;

    await request('POST', '/api/notifications/send', {
      headers: debtorA,
      body: { userId: debtorBId, subject: 'Phishing attempt', body: 'Click here' },
    });

    const after = (getNotificationDb()
      .prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ?')
      .get(debtorBId) as any).c;

    expect(after).toBe(before);
  });

  it('allows a role that holds the permission', async () => {
    const res = await request('POST', '/api/notifications/send', {
      headers: staff,
      body: { userId: debtorBId, subject: 'Your application has been received', body: 'No action needed.' },
    });

    expect(res.status).toBe(201);
  });

  it('refuses a debtor a bulk send', async () => {
    const res = await request('POST', '/api/notifications/send-bulk', {
      headers: debtorA,
      body: { userIds: [debtorBId, DEBTOR.userId], subject: 'Notice', body: 'Text' },
    });

    expect(res.status).toBe(403);
  });
});

describe('errors are handled rather than thrown', () => {
  it('answers 400 for a send with no subject, not 500', async () => {
    // `subject` is NOT NULL. There was not one try/catch in the file, so this threw
    // synchronously out of better-sqlite3 and — with no error handler mounted on this
    // service — reached Express's default handler, which renders an HTML stack trace
    // naming the table and column.
    const res = await request('POST', '/api/notifications/send', {
      headers: staff,
      body: { userId: debtorBId, body: 'No subject given' },
    });

    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('VALIDATION_ERROR');
  });

  it('answers 400 for an entirely empty send body', async () => {
    const res = await request('POST', '/api/notifications/send', { headers: staff, body: {} });
    expect(res.status).toBe(400);
  });

  it('never returns an HTML body', async () => {
    // What Express's default handler produces. A JSON client parsing this reports it as
    // an unknown error, which the frontend renders as "backend offline".
    for (const body of [{}, { userId: 'x' }, { subject: 'x' }]) {
      const res = await request('POST', '/api/notifications/send', { headers: staff, body });
      expect(typeof res.data, JSON.stringify(body)).toBe('object');
      expect(res.status).toBeLessThan(500);
    }
  });

  it('rejects a bulk send above the recipient ceiling', async () => {
    // Unbounded fan-out from a single request. 501 recipients rather than 500 so the
    // boundary itself is pinned.
    const res = await request('POST', '/api/notifications/send-bulk', {
      headers: staff,
      body: { userIds: Array.from({ length: 501 }, (_, i) => `user-${i}`), subject: 'S', body: 'B' },
    });

    expect(res.status).toBe(400);
    expect(res.data.error.message).toContain('500');
  });

  it('accepts a bulk send at the ceiling', async () => {
    const res = await request('POST', '/api/notifications/send-bulk', {
      headers: staff,
      body: { userIds: Array.from({ length: 500 }, (_, i) => `bulk-user-${i}`), subject: 'S', body: 'B' },
    });

    expect(res.status).toBe(201);
    expect(res.data.data.sent).toBe(500);
  });
});

describe('an anonymous caller reaches nothing', () => {
  it.each([
    ['GET', '/api/notifications/user/user-debtor'],
    ['POST', '/api/notifications/send'],
    ['POST', '/api/notifications/send-bulk'],
    ['PATCH', '/api/notifications/some-id/read'],
    ['PATCH', '/api/notifications/user/user-debtor/read-all'],
    ['DELETE', '/api/notifications/some-id'],
    ['GET', '/api/notifications/preferences/user-debtor'],
  ])('%s %s is 401', async (method, path) => {
    // No request body deliberately. `authenticate` answers 401 without consuming the
    // body — correct for an auth guard, since reading a body from a caller you have
    // already rejected is work done for an attacker — but it means the server can close
    // the socket while the client is still writing, and the client sees ECONNRESET
    // instead of the 401. That is a property of the test client, not of the service.
    const res = await request(method, path);
    expect(res.status).toBe(401);
  });
});
