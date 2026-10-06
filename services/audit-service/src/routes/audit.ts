import { Router, Request, Response } from 'express';
import { audit } from '../db';
// The audit trail shares the same trust root as the rest of the API, but this
// router verifies the signed token itself via @aib-iaas/auth rather than
// importing the gateway's Express middleware — that keeps audit-service a
// self-contained workspace (no cross-service source import, which also breaks
// its isolated `tsc --rootDir src` build). In the deployed consolidated-api the
// global authentication gate has already run; this is an idempotent re-check.
import { verifyToken } from '@aib-iaas/auth';
import { validate, auditEventSchema } from '@aib-iaas/validation';

export const auditRouter = Router();

interface Actor {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

/** Resolve the verified caller from the Bearer token, or null if absent/invalid. */
function actorFromRequest(req: Request): Actor | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    const claims = verifyToken(header.slice(7));
    return {
      userId: claims.userId,
      email: claims.email,
      role: claims.role,
      permissions: claims.permissions || [],
    };
  } catch {
    return null;
  }
}

// Record audit event. Authenticated, and the actor is derived from the verified
// token — the body's actor/actorId/actorName fields are ignored, so a caller can
// no longer attribute an event to someone else (H3). The timestamp is stamped by
// the repository server-side; the source IP is recorded alongside.
auditRouter.post('/events', validate(auditEventSchema), (req: Request, res: Response) => {
  try {
    const actor = actorFromRequest(req);
    if (!actor) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    const { applicationId, action, details } = req.body ?? {};
    const actorType = actor.role === 'debtor' ? 'applicant' : 'staff';
    const bodyDetails = details && typeof details === 'object' ? details : {};

    const event = audit.create({
      applicationId,
      action,
      actorId: actor.userId,
      actorName: actor.email,
      actorType,
      details: { ...bodyDetails, sourceIp: req.ip },
    });

    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    console.error('[Audit]', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message } });
  }
});

/** Reading the audit trail requires the audit.read permission. */
function requireAuditRead(req: Request, res: Response): Actor | null {
  const actor = actorFromRequest(req);
  if (!actor) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
    return null;
  }
  if (!actor.permissions.includes('audit.read')) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to read the audit trail.' } });
    return null;
  }
  return actor;
}

// Get audit trail for application.
auditRouter.get('/events/:applicationId', (req: Request, res: Response) => {
  try {
    if (!requireAuditRead(req, res)) return;
    const events = audit.findByApplication(req.params.applicationId);
    res.json({ success: true, data: events });
  } catch (error: any) {
    console.error('[Audit]', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message } });
  }
});

// Search/list audit events.
auditRouter.get('/events', (req: Request, res: Response) => {
  try {
    if (!requireAuditRead(req, res)) return;
    const { action, actorType, actorId, limit = '50' } = req.query;

    const events = audit.findAll({
      action: action as string | undefined,
      actorType: actorType as string | undefined,
      actorId: actorId as string | undefined,
      limit: parseInt(limit as string),
    });

    res.json({ success: true, data: events, meta: { count: events.length } });
  } catch (error: any) {
    console.error('[Audit]', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message } });
  }
});
