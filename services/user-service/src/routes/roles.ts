import { Router, Request, Response } from 'express';
import { users } from '../db';

export const rolesRouter = Router();

// The authenticated user is populated upstream by the deployed consolidated-api's
// global gate; the role-permission editing endpoints read it to enforce
// system.admin. (In the standalone dev service there is no gate, so these writes
// are refused — which is the safe default.)
interface MaybeAuthedRequest extends Request {
  user?: { permissions?: string[] };
}

function requireSystemAdmin(req: MaybeAuthedRequest, res: Response): boolean {
  if (!(req.user?.permissions || []).includes('system.admin')) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Editing role permissions requires system.admin.' } });
    return false;
  }
  return true;
}

// List all roles
rolesRouter.get('/', (_req: Request, res: Response) => {
  try {
    const roles = users.listRoles();
    res.json({ success: true, data: roles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Get role with all permissions
rolesRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const role = users.findRoleById(req.params.id);

    if (!role) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } });
      return;
    }

    const permissions = users.getPermissionsForRole(req.params.id);
    res.json({ success: true, data: { ...role, permissions } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Get permissions matrix (all roles x all permissions)
rolesRouter.get('/matrix/full', (_req: Request, res: Response) => {
  try {
    const roles = users.listRoles();

    const matrix = roles.map(role => {
      const permissions = users.getPermissionsForRole(role.id);
      return {
        ...role,
        permissions,
      };
    });

    res.json({ success: true, data: { roles, matrix } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Grant a permission (by code) to a role. system.admin only. Grants are editable;
// the permission code set itself is fixed (an unknown code is rejected, not created).
rolesRouter.post('/:id/permissions', (req: MaybeAuthedRequest, res: Response) => {
  try {
    if (!requireSystemAdmin(req, res)) return;
    const { code } = req.body ?? {};
    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'A permission code is required.' } });
      return;
    }
    if (!users.findRoleById(req.params.id)) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } });
      return;
    }
    if (!users.grantPermission(req.params.id, code)) {
      res.status(400).json({ success: false, error: { code: 'UNKNOWN_PERMISSION', message: `Unknown permission code '${code}'.` } });
      return;
    }
    res.json({ success: true, data: { roleId: req.params.id, permissions: users.getPermissionsForRole(req.params.id) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Revoke a permission (by code) from a role. system.admin only.
rolesRouter.delete('/:id/permissions/:code', (req: MaybeAuthedRequest, res: Response) => {
  try {
    if (!requireSystemAdmin(req, res)) return;
    if (!users.findRoleById(req.params.id)) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } });
      return;
    }
    users.revokePermission(req.params.id, req.params.code);
    res.json({ success: true, data: { roleId: req.params.id, permissions: users.getPermissionsForRole(req.params.id) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});
