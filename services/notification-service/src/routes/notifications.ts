import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requirePermission, type AuthenticatedRequest } from '../middleware/rbac';
import { v4 as uuid } from 'uuid';
import { getNotificationDb } from '../db';

export const notificationRouter = Router();

/**
 * Notifications are case correspondence. Every route here was open: GET /user/:userId
 * returned any user's subject, body and metadata in the clear, DELETE destroyed any
 * notification, and POST /send wrote an arbitrary subject and body attributed to the
 * service to any user — a phishing primitive inside the product's own channel.
 *
 * Authentication was the first half and closed none of those on its own; it only required
 * the caller to log in first. What this file now also does:
 *
 *  - **Scopes the write paths.** `PATCH /:id/read`, `DELETE /:id` and
 *    `PATCH /user/:userId/read-all` took an id and checked nothing, so any authenticated
 *    user could mark read or destroy any other user's correspondence. Same IDOR class as
 *    the read path, and the destructive one.
 *  - **Requires `notifications.send` to send.** Introduced by migration
 *    `002-notifications-send-permission` and granted to the casework roles only.
 *  - **Handles errors.** There was not one `try` in the file. Every route calls
 *    better-sqlite3 synchronously, so a `NOT NULL` violation on `subject` — reachable by
 *    posting `{}` — threw into Express's default handler, which renders an HTML stack
 *    trace. This service also mounted no error handler at all.
 */
notificationRouter.use(authenticate);

/**
 * Whether the caller may act on someone else's correspondence.
 *
 * `users.read` is the marker already used for this in the read path, so the same code
 * governs the same question rather than the file growing a second vocabulary. A debtor
 * does not hold it; the casework and administrative roles do.
 */
function isStaff(req: Request): boolean {
  return (req as AuthenticatedRequest).user!.permissions.includes('users.read');
}

/** The user whose correspondence a request may touch. Staff may name one; nobody else can. */
function targetUserId(req: Request, param = 'userId'): string {
  const caller = (req as AuthenticatedRequest).user!;
  return isStaff(req) ? (req.params[param] || caller.userId) : caller.userId;
}

/**
 * Wraps a synchronous handler so a thrown SQLite error reaches the shared error handler
 * instead of Express's default HTML one.
 *
 * A helper rather than a try/catch per route because seven hand-written catch blocks is
 * seven chances to forget one, and forgetting one is invisible until the constraint fires.
 */
function guarded(handler: (req: Request, res: Response) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      handler(req, res);
    } catch (e) {
      next(e);
    }
  };
}

// Send notification
notificationRouter.post(
  '/send',
  requirePermission('notifications.send'),
  guarded((req, res) => {
    const db = getNotificationDb();
    const { userId, type, channel, subject, body, link, metadata } = req.body ?? {};

    // Validated here rather than relying on the NOT NULL constraint. The constraint does
    // stop the write, but it does so by throwing — a 500 for what is a malformed request.
    if (!userId || !subject || !body) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId, subject and body are required' },
      });
      return;
    }

    const id = uuid();
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, channel, subject, body, link, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, type || 'info', channel || 'in_app', subject, body, link, JSON.stringify(metadata || {}));

    // Placeholder: log what would be sent via email/SMS. Neither the recipient nor the
    // body is logged — this is a notification service, so its log would otherwise be a
    // copy of every message it has ever sent.
    if (channel === 'email' || channel === 'sms') {
      console.log(`[${channel.toUpperCase()} PLACEHOLDER] notification ${id} queued`);
    }

    res.status(201).json({ success: true, data: { id, channel: channel || 'in_app', sentAt: new Date().toISOString() } });
  })
);

// Send bulk notifications (e.g., creditor notifications for a case)
notificationRouter.post(
  '/send-bulk',
  requirePermission('notifications.send'),
  guarded((req, res) => {
    const db = getNotificationDb();
    const { userIds, type, channel, subject, body, link } = req.body ?? {};

    if (!Array.isArray(userIds) || !userIds.length || !subject || !body) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userIds (non-empty array), subject and body are required' },
      });
      return;
    }

    // Bounded. A bulk send is a fan-out primitive, and an unbounded one is a way to fill
    // the store — or somebody's inbox — from a single request.
    if (userIds.length > 500) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'A bulk send may address at most 500 recipients' },
      });
      return;
    }

    const insert = db.prepare(`
      INSERT INTO notifications (id, user_id, type, channel, subject, body, link) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const ids: string[] = [];
    // The transaction matters: a partial bulk send tells some creditors and not others,
    // with no record of where it stopped.
    const tx = db.transaction(() => {
      for (const userId of userIds) {
        const id = uuid();
        insert.run(id, userId, type || 'info', channel || 'in_app', subject, body, link);
        ids.push(id);
      }
    });
    tx();

    res.status(201).json({ success: true, data: { sent: ids.length, ids } });
  })
);

// Get notifications for a user
notificationRouter.get(
  '/user/:userId',
  guarded((req, res) => {
    // Scoped to the caller. The path parameter is ignored for anyone who is not staff:
    // it used to be honoured for any userId, so one authenticated user could read
    // another's correspondence by changing the URL.
    const userId = targetUserId(req);
    const db = getNotificationDb();
    const { unreadOnly, limit = '20' } = req.query;

    let sql = 'SELECT * FROM notifications WHERE user_id = ?';
    const params: any[] = [userId];

    if (unreadOnly === 'true') {
      sql += ' AND read = 0';
    }

    sql += ' ORDER BY sent_at DESC LIMIT ?';
    // Clamped. `parseInt` had no ceiling and no NaN guard, and better-sqlite3 stores NaN
    // as NULL — `LIMIT NULL` in SQLite means *no limit*, so `?limit=abc` returned the
    // whole table.
    const requested = Number(limit);
    params.push(Number.isFinite(requested) && requested > 0 ? Math.min(Math.floor(requested), 100) : 20);

    const notifications = db.prepare(sql).all(...params) as any[];
    const unreadCount = (db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(userId) as any).count;

    res.json({
      success: true,
      data: {
        notifications: notifications.map(n => ({ ...n, metadata: n.metadata ? JSON.parse(n.metadata) : null })),
        unreadCount,
      },
    });
  })
);

// Mark notification as read
notificationRouter.patch(
  '/:id/read',
  guarded((req, res) => {
    const db = getNotificationDb();
    const caller = (req as AuthenticatedRequest).user!;

    // Ownership is in the WHERE clause rather than in a preceding read. A check-then-act
    // pair can be raced, and more importantly it makes "not mine" and "does not exist"
    // two code paths that have to agree — here they are the same zero-row result.
    const sql = isStaff(req)
      ? "UPDATE notifications SET read = 1, read_at = datetime('now') WHERE id = ?"
      : "UPDATE notifications SET read = 1, read_at = datetime('now') WHERE id = ? AND user_id = ?";
    const params = isStaff(req) ? [req.params.id] : [req.params.id, caller.userId];

    const result = db.prepare(sql).run(...params);

    // 404 rather than 403, so the endpoint is not an existence oracle: distinguishing
    // "someone else's" from "no such notification" would let a caller enumerate ids.
    if (result.changes === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
      return;
    }

    res.json({ success: true, data: { read: true } });
  })
);

// Mark all notifications as read for a user
notificationRouter.patch(
  '/user/:userId/read-all',
  guarded((req, res) => {
    const db = getNotificationDb();
    const userId = targetUserId(req);

    const result = db
      .prepare("UPDATE notifications SET read = 1, read_at = datetime('now') WHERE user_id = ? AND read = 0")
      .run(userId);

    res.json({ success: true, data: { markedRead: result.changes } });
  })
);

// Delete notification
notificationRouter.delete(
  '/:id',
  guarded((req, res) => {
    const db = getNotificationDb();
    const caller = (req as AuthenticatedRequest).user!;

    // The destructive one, and the one that had no check at all: any authenticated user
    // could destroy any other user's correspondence by id.
    const sql = isStaff(req)
      ? 'DELETE FROM notifications WHERE id = ?'
      : 'DELETE FROM notifications WHERE id = ? AND user_id = ?';
    const params = isStaff(req) ? [req.params.id] : [req.params.id, caller.userId];

    const result = db.prepare(sql).run(...params);

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
      return;
    }

    res.json({ success: true, data: { deleted: true } });
  })
);

// Get notification preferences (placeholder)
notificationRouter.get(
  '/preferences/:userId',
  guarded((req, res) => {
    // Scoped like the other /user routes even though the payload is static: returning
    // someone else's preferences would still confirm that the user id exists.
    const userId = targetUserId(req);

    res.json({
      success: true,
      data: {
        userId,
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
  })
);
