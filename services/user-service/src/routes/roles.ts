import { Router, Request, Response } from 'express';
import { getUserDb } from '../db';

export const rolesRouter = Router();

// List all roles with permission counts
rolesRouter.get('/', (_req: Request, res: Response) => {
  const db = getUserDb();
  const roles = db.prepare(`
    SELECT r.*, COUNT(rp.permission_id) as permission_count,
      (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id AND u.status = 'active') as active_users
    FROM roles r
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    GROUP BY r.id
    ORDER BY r.level DESC
  `).all();

  res.json({ success: true, data: roles });
});

// Get role with all permissions
rolesRouter.get('/:id', (req: Request, res: Response) => {
  const db = getUserDb();
  const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id);

  if (!role) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } });
    return;
  }

  const permissions = db.prepare(`
    SELECT p.* FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role_id = ?
    ORDER BY p.resource, p.action
  `).all(req.params.id);

  res.json({ success: true, data: { ...role, permissions } });
});

// Get permissions matrix (all roles x all permissions)
rolesRouter.get('/matrix/full', (_req: Request, res: Response) => {
  const db = getUserDb();
  const roles = db.prepare('SELECT * FROM roles ORDER BY level DESC').all() as any[];
  const permissions = db.prepare('SELECT * FROM permissions ORDER BY resource, action').all() as any[];
  const mappings = db.prepare('SELECT * FROM role_permissions').all() as any[];

  const matrix = roles.map(role => ({
    ...role,
    permissions: permissions.map(perm => ({
      ...perm,
      granted: mappings.some(m => m.role_id === role.id && m.permission_id === perm.id),
    })),
  }));

  res.json({ success: true, data: { roles, permissions, matrix } });
});
