import { Router, Request, Response } from 'express';
import { canAssignRole } from '@aib-iaas/auth';
import { users } from '../db';
import { authenticate, requirePermission, type AuthenticatedRequest } from '../middleware/rbac';

export const usersRouter = Router();

/**
 * Every route here requires an authenticated caller with an explicit permission.
 *
 * Applied on the **router**, not at the mount point, deliberately: the deployment shim
 * (`services/consolidated-api/src/index.ts`) re-mounts routers by hand, so a guard
 * added only at a mount is invisible in the other topology — which is exactly how the
 * one authorised route in the repo shipped unauthenticated. A guard that travels with
 * the router cannot diverge.
 *
 * Before this, these routes were open. `POST /` took an attacker-chosen `roleId`, so
 * three unauthenticated requests — read the role ids from `/api/roles`, create a
 * `role-sysadmin` account, log in with any password — yielded a genuinely signed
 * session with all twenty permissions. `PUT /:id` was the same defect against an
 * existing account: any real officer could be promoted, demoted or deactivated.
 */
usersRouter.use(authenticate);

/**
 * Would assigning `roleId` give the target more authority than the caller holds?
 *
 * Returns a refusal message, or null to allow. Compared by role *level* rather than by
 * an allowlist of role ids, so a role added later inherits the rule rather than
 * silently bypassing it. An unknown `roleId` is refused too: the repository would
 * otherwise fail on a foreign key, returning a 500 for what is a bad request.
 */
async function wouldEscalate(req: AuthenticatedRequest, roleId?: string): Promise<string | null> {
  if (!roleId) return null;

  const target = await users.findRoleById(roleId);
  if (!target) return `Unknown role: ${roleId}`;

  if (!canAssignRole(req.user?.roleLevel ?? 0, target.level)) {
    return 'You cannot assign a role with more authority than your own.';
  }
  return null;
}

// List users with filtering
usersRouter.get('/', requirePermission('users.read'), async (req: Request, res: Response) => {
  try {
    const { role, organisationId, status } = req.query;

    const result = await users.list({
      role: role as string | undefined,
      organisationId: organisationId as string | undefined,
      status: status as string | undefined,
    });

    res.json({ success: true, data: result.data, meta: { totalCount: result.total } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Get user by ID
usersRouter.get('/:id', requirePermission('users.read'), async (req: Request, res: Response) => {
  try {
    const userWithRole = await users.findByIdWithRole(req.params.id);

    if (!userWithRole) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    // Get permissions
    const permissions = await users.getPermissionsForRole(userWithRole.roleId);

    res.json({ success: true, data: { ...userWithRole, permissions } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Create user
usersRouter.post('/', requirePermission('users.create'), async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, roleId, organisationId } = req.body;

    // A caller may not create an account more powerful than their own. Without this,
    // `users.create` is a privilege-escalation primitive for anyone holding it: a
    // senior officer (level 80) could mint themselves a system administrator (100).
    const escalation = await wouldEscalate(req as AuthenticatedRequest, roleId);
    if (escalation) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: escalation } });
      return;
    }

    const user = await users.create({
      email,
      firstName,
      lastName,
      roleId,
      organisationId,
    });

    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    // Both wordings, because the two backends phrase it differently: SQLite says
    // "UNIQUE constraint failed", PostgreSQL "duplicate key value violates unique
    // constraint". Matching only SQLite's would turn a duplicate email into a 500
    // under PostgreSQL instead of the 409 the client knows how to handle.
    if (error.message?.includes('UNIQUE constraint') || error.message?.includes('duplicate key value')) {
      res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Email already exists' } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  }
});

// Update user
usersRouter.put('/:id', requirePermission('users.update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await users.findById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const { firstName, lastName, roleId, organisationId, status } = req.body;

    // The escalation guard applies to the role being assigned, and separately to the
    // account being changed: a caller must not be able to demote or deactivate someone
    // above them, which is a denial-of-service against their own oversight.
    const escalation = await wouldEscalate(req as AuthenticatedRequest, roleId);
    if (escalation) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: escalation } });
      return;
    }

    const targetRole = await users.findRoleById(existing.roleId);
    const callerLevel = (req as AuthenticatedRequest).user?.roleLevel ?? 0;
    if (targetRole && targetRole.level > callerLevel) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You cannot modify an account with more authority than your own.' },
      });
      return;
    }

    const updated = await users.update(id, {
      firstName,
      lastName,
      displayName: firstName && lastName ? `${firstName} ${lastName}` : undefined,
      roleId,
      organisationId,
      status,
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Deactivate user
usersRouter.delete('/:id', requirePermission('users.delete'), async (req: Request, res: Response) => {
  try {
    const existing = await users.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    // Same reasoning as the update route: deactivating an account above your own level
    // is a denial of service against the person who oversees you.
    const targetRole = await users.findRoleById(existing.roleId);
    if (targetRole && targetRole.level > ((req as AuthenticatedRequest).user?.roleLevel ?? 0)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You cannot deactivate an account with more authority than your own.' },
      });
      return;
    }

    await users.update(req.params.id, { status: 'deactivated' });
    res.json({ success: true, data: { deactivated: true } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});
