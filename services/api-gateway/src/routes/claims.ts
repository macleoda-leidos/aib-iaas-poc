import { Router, Response } from 'express';
import { claims, audit } from '../db';
import { requirePermission, type AuthenticatedRequest } from '../middleware/rbac';
import { validate, claimUpdateSchema } from '@aib-iaas/validation';

/**
 * Creditor-claims routes that are not scoped to a single application in the URL:
 *   GET   /api/claims/mine   — the caller's organisation's claims (creditor view)
 *   PATCH /api/claims/:id    — accept/reject a claim (staff, claims.manage)
 *
 * The application-scoped routes (POST/GET /api/applications/:id/claims) live on
 * the applications router. The global default-deny gate has already authenticated
 * every request here, so these only add the per-action permission check.
 */
export const claimsRouter = Router();

// A creditor's own organisation's claims across all applications.
claimsRouter.get('/mine', requirePermission('claims.read'), (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.organisationId;
  res.json({ success: true, data: orgId ? claims.findByCreditorOrg(orgId) : [] });
});

// Accept or reject a claim (staff decision).
claimsRouter.patch('/:id', requirePermission('claims.manage'), validate(claimUpdateSchema), (req: AuthenticatedRequest, res: Response) => {
  const existing = claims.findById(req.params.id);
  if (!existing) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Claim not found' } });
    return;
  }
  const updated = claims.updateStatus(req.params.id, req.body.status);
  audit.create({
    applicationId: existing.applicationId,
    action: `claim_${req.body.status}`,
    actorId: req.user?.userId,
    actorName: req.user?.email || 'staff',
    actorType: 'staff',
    details: { claimId: existing.id },
  });
  res.json({ success: true, data: updated });
});
