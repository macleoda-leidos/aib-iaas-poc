import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getUserDb } from '../db';

export const usersRouter = Router();

// List users with filtering
usersRouter.get('/', (req: Request, res: Response) => {
  const db = getUserDb();
  const { role, organisationId, status, search } = req.query;

  let sql = `SELECT u.*, r.name as role_name, r.display_name as role_display_name
    FROM users u JOIN roles r ON u.role_id = r.id WHERE 1=1`;
  const params: any[] = [];

  if (role) { sql += ' AND r.name = ?'; params.push(role); }
  if (organisationId) { sql += ' AND u.organisation_id = ?'; params.push(organisationId); }
  if (status) { sql += ' AND u.status = ?'; params.push(status); }
  if (search) { sql += ' AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  sql += ' ORDER BY u.created_at DESC';

  const users = db.prepare(sql).all(...params);
  res.json({ success: true, data: users, meta: { totalCount: users.length } });
});

// Get user by ID
usersRouter.get('/:id', (req: Request, res: Response) => {
  const db = getUserDb();
  const user = db.prepare(`
    SELECT u.*, r.name as role_name, r.display_name as role_display_name, r.description as role_description
    FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?
  `).get(req.params.id) as any;

  if (!user) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    return;
  }

  // Get permissions
  const permissions = db.prepare(`
    SELECT p.code, p.name, p.resource, p.action FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role_id = ?
  `).all(user.role_id);

  res.json({ success: true, data: { ...user, permissions } });
});

// Create user
usersRouter.post('/', (req: Request, res: Response) => {
  const db = getUserDb();
  const { email, firstName, lastName, roleId, organisationId } = req.body;
  const id = `USR-${uuid().slice(0, 8).toUpperCase()}`;

  try {
    db.prepare(`
      INSERT INTO users (id, email, first_name, last_name, display_name, role_id, organisation_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, email, firstName, lastName, `${firstName} ${lastName}`, roleId, organisationId || null);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint')) {
      res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Email already exists' } });
    } else {
      throw error;
    }
  }
});

// Update user
usersRouter.put('/:id', (req: Request, res: Response) => {
  const db = getUserDb();
  const { firstName, lastName, roleId, organisationId, status } = req.body;

  db.prepare(`
    UPDATE users SET
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      display_name = COALESCE(?, display_name),
      role_id = COALESCE(?, role_id),
      organisation_id = COALESCE(?, organisation_id),
      status = COALESCE(?, status),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(firstName, lastName, firstName && lastName ? `${firstName} ${lastName}` : null, roleId, organisationId, status, req.params.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: user });
});

// Deactivate user
usersRouter.delete('/:id', (req: Request, res: Response) => {
  const db = getUserDb();
  db.prepare('UPDATE users SET status = \'deactivated\', updated_at = datetime(\'now\') WHERE id = ?').run(req.params.id);
  res.json({ success: true, data: { deactivated: true } });
});
