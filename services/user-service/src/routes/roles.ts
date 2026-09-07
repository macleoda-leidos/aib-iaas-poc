import { Router, Request, Response } from 'express';
import { users } from '../db';
import { authenticate, requirePermission } from '../middleware/rbac';

export const rolesRouter = Router();

/**
 * The role and permission vocabulary is not public.
 *
 * It was step one of a privilege-escalation chain: an unauthenticated caller read every
 * roleId here, then passed `role-sysadmin` to the equally unguarded POST /api/users.
 * Requiring `users.read` is the right gate — the people who need the role list are the
 * people who administer users.
 *
 * On the router rather than the mount, so it cannot diverge between the standalone
 * service and the deployment shim.
 */
rolesRouter.use(authenticate, requirePermission('users.read'));

// List all roles
rolesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const roles = await users.listRoles();
    res.json({ success: true, data: roles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Get role with all permissions
rolesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const role = await users.findRoleById(req.params.id);

    if (!role) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } });
      return;
    }

    const permissions = await users.getPermissionsForRole(req.params.id);
    res.json({ success: true, data: { ...role, permissions } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Get permissions matrix (all roles x all permissions)
rolesRouter.get('/matrix/full', async (_req: Request, res: Response) => {
  try {
    const roles = await users.listRoles();

    // One query per role, issued together rather than in sequence — ten roles
    // against Neon would otherwise be ten serial round trips for one page.
    const matrix = await Promise.all(roles.map(async role => {
      const permissions = await users.getPermissionsForRole(role.id);
      return {
        ...role,
        permissions,
      };
    }));

    res.json({ success: true, data: { roles, matrix } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});
