import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getNotificationDb } from '../db';
// Verify the signed token inline via @aib-iaas/auth rather than importing the
// gateway's Express middleware — that keeps notification-service a self-contained
// workspace (no cross-service source import, which would also break its isolated
// `tsc --rootDir src` build). In the deployed consolidated-api the global
// authentication gate has already run and set req.user; this re-reads it, and
// falls back to verifying the Bearer token itself when run standalone (where the
// service has no gate of its own). Same idiom as audit-service.
import { verifyToken } from '@aib-iaas/auth';

export const notificationRouter = Router();

/** The verified caller: req.user when the global gate set it, else the Bearer token. */
interface Caller { userId: string; role: string; permissions: string[]; }

function callerFromRequest(req: Request): Caller | null {
  // Prefer req.user: in consolidated-api the global gate already verified the
  // token AND checked session revocation (jti). Re-verifying here would skip that
  // revocation check, so only fall back to the raw token when no gate ran.
  const u = (req as any).user;
  if (u?.userId) return { userId: u.userId, role: u.role, permissions: u.permissions || [] };
  const header = req.headers?.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    const claims = verifyToken(header.slice(7));
    return { userId: claims.userId, role: claims.role, permissions: claims.permissions || [] };
  } catch {
    return null;
  }
}

/** Staff = any authenticated non-applicant. Notifications are per-user; staff may
 *  read/manage any user's notifications, an applicant only their own. */
function isStaff(caller: Caller | null): caller is Caller {
  return !!caller && caller.role !== 'debtor';
}

/**
 * Ownership guard for a per-user resource. Returns the caller when access is
 * allowed; otherwise sends the right status (401 unauthenticated, 404 on an
 * ownership mismatch — 404 not 403, matching the application-IDOR idiom so the
 * endpoint never confirms another user's id exists) and returns null.
 */
function requireOwnerOrStaff(req: Request, res: Response, ownerUserId: string): Caller | null {
  const caller = callerFromRequest(req);
  if (!caller) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
    return null;
  }
  if (!isStaff(caller) && caller.userId !== ownerUserId) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
    return null;
  }
  return caller;
}

/**
 * Guard a notification addressed by its id: authenticate first, then resolve the
 * row and confirm the caller owns it (or is staff). A missing row and a row owned
 * by someone else are BOTH reported as 404 to an authenticated caller, so the
 * endpoint never reveals whether an id it will not act on exists. Returns the
 * owning user_id when allowed, or null (after sending the response) when refused.
 */
function requireNotificationAccess(req: Request, res: Response, id: string): string | null {
  const caller = callerFromRequest(req);
  if (!caller) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
    return null;
  }
  const row = getNotificationDb().prepare('SELECT user_id FROM notifications WHERE id = ?').get(id) as { user_id: string } | undefined;
  if (!row || (!isStaff(caller) && caller.userId !== row.user_id)) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
    return null;
  }
  return row.user_id;
}

// Send notification. Server-to-user, never self-service — gated to staff. (A1)
notificationRouter.post('/send', (req: Request, res: Response) => {
  const caller = callerFromRequest(req);
  if (!caller) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
    return;
  }
  if (!isStaff(caller)) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only staff may send notifications.' } });
    return;
  }

  const db = getNotificationDb();
  const { userId, type, channel, subject, body, link, metadata } = req.body;
  const id = uuid();

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, channel, subject, body, link, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, type || 'info', channel || 'in_app', subject, body, link, JSON.stringify(metadata || {}));

  // Placeholder: log what would be sent via email/SMS
  if (channel === 'email') {
    console.log(`[EMAIL PLACEHOLDER] To: ${userId} Subject: ${subject}`);
  } else if (channel === 'sms') {
    console.log(`[SMS PLACEHOLDER] To: ${userId} Message: ${body?.slice(0, 160)}`);
  }

  res.status(201).json({ success: true, data: { id, channel, sentAt: new Date().toISOString() } });
});

// Send bulk notifications (e.g., creditor notifications for a case). Staff-only. (A1)
notificationRouter.post('/send-bulk', (req: Request, res: Response) => {
  const caller = callerFromRequest(req);
  if (!caller) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
    return;
  }
  if (!isStaff(caller)) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only staff may send notifications.' } });
    return;
  }

  const db = getNotificationDb();
  const { userIds, type, channel, subject, body, link } = req.body;

  const insert = db.prepare(`
    INSERT INTO notifications (id, user_id, type, channel, subject, body, link) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const ids: string[] = [];
  const tx = db.transaction(() => {
    for (const userId of userIds || []) {
      const id = uuid();
      insert.run(id, userId, type || 'info', channel || 'in_app', subject, body, link);
      ids.push(id);
    }
  });
  tx();

  res.status(201).json({ success: true, data: { sent: ids.length, ids } });
});

// Get notifications for a user. The caller must own :userId or be staff. (A1)
notificationRouter.get('/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!requireOwnerOrStaff(req, res, userId)) return;

  const db = getNotificationDb();
  const { unreadOnly, limit = '20' } = req.query;

  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  const params: any[] = [userId];

  if (unreadOnly === 'true') {
    sql += ' AND read = 0';
  }

  sql += ' ORDER BY sent_at DESC LIMIT ?';
  params.push(parseInt(limit as string));

  const notifications = db.prepare(sql).all(...params) as any[];
  const unreadCount = (db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(userId) as any).count;

  res.json({
    success: true,
    data: {
      notifications: notifications.map(n => ({ ...n, metadata: n.metadata ? JSON.parse(n.metadata) : null })),
      unreadCount,
    },
  });
});

// Mark notification as read. The row's user_id must match the caller (or staff). (A1)
notificationRouter.patch('/:id/read', (req: Request, res: Response) => {
  if (!requireNotificationAccess(req, res, req.params.id)) return;
  getNotificationDb().prepare('UPDATE notifications SET read = 1, read_at = datetime(\'now\') WHERE id = ?').run(req.params.id);
  res.json({ success: true, data: { read: true } });
});

// Mark all notifications as read for a user. Owner or staff. (A1)
notificationRouter.patch('/user/:userId/read-all', (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!requireOwnerOrStaff(req, res, userId)) return;
  const db = getNotificationDb();
  const result = db.prepare('UPDATE notifications SET read = 1, read_at = datetime(\'now\') WHERE user_id = ? AND read = 0').run(userId);
  res.json({ success: true, data: { markedRead: result.changes } });
});

// Delete notification. The row's user_id must match the caller (or staff). (A1)
notificationRouter.delete('/:id', (req: Request, res: Response) => {
  if (!requireNotificationAccess(req, res, req.params.id)) return;
  getNotificationDb().prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
  res.json({ success: true, data: { deleted: true } });
});

// Get notification preferences (placeholder). Owner or staff. (A1)
notificationRouter.get('/preferences/:userId', (req: Request, res: Response) => {
  if (!requireOwnerOrStaff(req, res, req.params.userId)) return;
  res.json({
    success: true,
    data: {
      userId: req.params.userId,
      preferences: {
        in_app: true,
        email: true,
        sms: false,
        digest: 'immediate', // immediate | daily | weekly
        categories: {
          application_updates: { in_app: true, email: true },
          payment_reminders: { in_app: true, email: true, sms: true },
          system_alerts: { in_app: true },
          case_updates: { in_app: true, email: true },
        },
      },
      note: 'PLACEHOLDER: Notification preferences would be stored and enforced in production.',
    },
  });
});
