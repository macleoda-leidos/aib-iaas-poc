import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getNotificationDb } from '../db';

export const notificationRouter = Router();

// Send notification
notificationRouter.post('/send', (req: Request, res: Response) => {
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

// Send bulk notifications (e.g., creditor notifications for a case)
notificationRouter.post('/send-bulk', (req: Request, res: Response) => {
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

// Get notifications for a user
notificationRouter.get('/user/:userId', (req: Request, res: Response) => {
  const db = getNotificationDb();
  const { userId } = req.params;
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

// Mark notification as read
notificationRouter.patch('/:id/read', (req: Request, res: Response) => {
  const db = getNotificationDb();
  db.prepare('UPDATE notifications SET read = 1, read_at = datetime(\'now\') WHERE id = ?').run(req.params.id);
  res.json({ success: true, data: { read: true } });
});

// Mark all notifications as read for a user
notificationRouter.patch('/user/:userId/read-all', (req: Request, res: Response) => {
  const db = getNotificationDb();
  const result = db.prepare('UPDATE notifications SET read = 1, read_at = datetime(\'now\') WHERE user_id = ? AND read = 0').run(req.params.userId);
  res.json({ success: true, data: { markedRead: result.changes } });
});

// Delete notification
notificationRouter.delete('/:id', (req: Request, res: Response) => {
  const db = getNotificationDb();
  db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
  res.json({ success: true, data: { deleted: true } });
});

// Get notification preferences (placeholder)
notificationRouter.get('/preferences/:userId', (req: Request, res: Response) => {
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
