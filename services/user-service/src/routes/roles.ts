import { Router, Request, Response } from 'express';
import { users } from '../db';

export const rolesRouter = Router();

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
