import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getUserDb } from '../db';

export const authRouter = Router();

// Login - returns JWT-like token with role/permissions
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const db = getUserDb();

  if (!email) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email is required' } });
    return;
  }

  const user = db.prepare(`
    SELECT u.*, r.name as role_name, r.display_name as role_display_name, r.level as role_level
    FROM users u JOIN roles r ON u.role_id = r.id
    WHERE u.email = ? AND u.status = 'active'
  `).get(email) as any;

  // POC: accept any password for seeded users
  if (!user) {
    res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    return;
  }

  // Get permissions for this role
  const permissions = db.prepare(`
    SELECT p.code FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role_id = ?
  `).all(user.role_id) as any[];

  const permissionCodes = permissions.map((p: any) => p.code);

  // Create session token
  const token = Buffer.from(JSON.stringify({
    userId: user.id,
    email: user.email,
    role: user.role_name,
    roleDisplayName: user.role_display_name,
    roleLevel: user.role_level,
    organisationId: user.organisation_id,
    permissions: permissionCodes,
    exp: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
  })).toString('base64');

  // Store session
  const sessionId = uuid();
  db.prepare(`INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`)
    .run(sessionId, user.id, token, new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString());

  // Update last login
  db.prepare('UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?').run(user.id);

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        displayName: user.display_name,
        role: user.role_name,
        roleDisplayName: user.role_display_name,
        organisationId: user.organisation_id,
        permissions: permissionCodes,
      },
    },
  });
});

// Validate token and return user context
authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());

    if (payload.exp < Date.now()) {
      res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Session expired' } });
      return;
    }

    res.json({ success: true, data: payload });
  } catch {
    res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
  }
});

// Logout
authRouter.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const db = getUserDb();
    const token = authHeader.slice(7);
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  res.json({ success: true, data: { message: 'Logged out' } });
});

// Check permission
authRouter.post('/check-permission', (req: Request, res: Response) => {
  const { userId, permission } = req.body;
  const db = getUserDb();

  const result = db.prepare(`
    SELECT COUNT(*) as count FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    JOIN users u ON u.role_id = rp.role_id
    WHERE u.id = ? AND p.code = ?
  `).get(userId, permission) as any;

  res.json({ success: true, data: { hasPermission: result.count > 0, userId, permission } });
});
