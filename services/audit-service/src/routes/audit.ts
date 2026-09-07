import { Router, Request, Response } from 'express';
import { audit } from '../db';
import { authenticate, requirePermission, type AuthenticatedRequest } from '../middleware/rbac';

export const auditRouter = Router();

/**
 * The audit trail is the statutory record, and it was completely open.
 *
 * Reads returned the entire trail to anyone — `?limit=10000000` with no ceiling — and
 * writes took `actorName` straight from the request body, so a caller could forge an
 * event attributed to `admin@aib.gov`. An audit trail that is neither confidential nor
 * attributable is not an audit trail.
 *
 * On the router rather than the mount, so the guard cannot diverge between the
 * standalone service and the deployment shim.
 */
auditRouter.use(authenticate);

/**
 * Clamp a caller-supplied limit.
 *
 * `parseInt(req.query.limit)` had no ceiling and no NaN guard. Two consequences: any
 * caller could request the whole table, and `?limit=abc` produced NaN — which behaves
 * *differently per backend*, since SQLite binds it as NULL and `LIMIT NULL` means no
 * limit at all, while PostgreSQL rejects it and returns a 500.
 */
function clampLimit(raw: unknown, fallback = 50, ceiling = 200): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), ceiling);
}

// Record audit event
auditRouter.post('/events', requirePermission('audit.read'), async (req: Request, res: Response) => {
  try {
    const { applicationId, action, details } = req.body;
    const caller = (req as AuthenticatedRequest).user!;

    // The actor is taken from the **verified token**, never from the body. It used to
    // come from `actorId`/`actorName`/`actor`, so any caller could write an event
    // attributed to someone else — which makes every entry in the trail deniable, and
    // is the specific defect GAP-006 records. A record of who did what is worthless if
    // the "who" is supplied by whoever is being recorded.
    const event = await audit.create({
      applicationId,
      action,
      actorId: caller.userId,
      actorName: caller.email,
      actorType: caller.role,
      details,
    });

    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Get audit trail for application
auditRouter.get('/events/:applicationId', requirePermission('audit.read'), async (req: Request, res: Response) => {
  try {
    const events = await audit.findByApplication(req.params.applicationId);
    res.json({ success: true, data: events });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Search/list audit events
auditRouter.get('/events', requirePermission('audit.read'), async (req: Request, res: Response) => {
  try {
    const { action, actorType, actorId, limit = '50' } = req.query;

    const events = await audit.findAll({
      action: action as string | undefined,
      actorType: actorType as string | undefined,
      actorId: actorId as string | undefined,
      limit: clampLimit(limit),
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
