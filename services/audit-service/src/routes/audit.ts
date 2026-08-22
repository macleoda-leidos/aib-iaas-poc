import { Router, Request, Response } from 'express';
import { audit } from '../db';

export const auditRouter = Router();

// Record audit event
auditRouter.post('/events', (req: Request, res: Response) => {
  try {
    const { applicationId, action, actor, actorId, actorName, actorType, details } = req.body;

    const event = audit.create({
      applicationId,
      action,
      actorId: actorId || undefined,
      actorName: actorName || actor || undefined,
      actorType,
      details,
    });

    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Get audit trail for application
auditRouter.get('/events/:applicationId', (req: Request, res: Response) => {
  try {
    const events = audit.findByApplication(req.params.applicationId);
    res.json({ success: true, data: events });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Search/list audit events
auditRouter.get('/events', (req: Request, res: Response) => {
  try {
    const { action, actorType, actorId, limit = '50' } = req.query;

    const events = audit.findAll({
      action: action as string | undefined,
      actorType: actorType as string | undefined,
      actorId: actorId as string | undefined,
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: events,
      meta: { count: events.length },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});
