import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getAuditDb } from '../db';

export const auditRouter = Router();

// Record audit event
auditRouter.post('/events', (req: Request, res: Response) => {
  const db = getAuditDb();
  const { applicationId, action, actor, actorType, details } = req.body;
  const id = uuid();

  db.prepare(`
    INSERT INTO audit_events (id, application_id, action, actor, actor_type, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, applicationId, action, actor, actorType, JSON.stringify(details || {}));

  res.status(201).json({ success: true, data: { id, timestamp: new Date().toISOString() } });
});

// Get audit trail for application
auditRouter.get('/events/:applicationId', (req: Request, res: Response) => {
  const db = getAuditDb();
  const rows = db.prepare(
    'SELECT * FROM audit_events WHERE application_id = ? ORDER BY timestamp DESC'
  ).all(req.params.applicationId) as any[];

  res.json({
    success: true,
    data: rows.map(r => ({ ...r, details: r.details ? JSON.parse(r.details) : null })),
  });
});

// Search/list audit events
auditRouter.get('/events', (req: Request, res: Response) => {
  const db = getAuditDb();
  const { action, actor, actorType, limit = '50' } = req.query;

  let sql = 'SELECT * FROM audit_events WHERE 1=1';
  const params: any[] = [];

  if (action) { sql += ' AND action = ?'; params.push(action); }
  if (actor) { sql += ' AND actor = ?'; params.push(actor); }
  if (actorType) { sql += ' AND actor_type = ?'; params.push(actorType); }

  sql += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(parseInt(limit as string));

  const rows = db.prepare(sql).all(...params) as any[];

  res.json({
    success: true,
    data: rows.map(r => ({ ...r, details: r.details ? JSON.parse(r.details) : null })),
    meta: { count: rows.length },
  });
});
