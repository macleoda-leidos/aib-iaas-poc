import { Router, Request, Response } from 'express';
import { users } from '../db';

export const authRouter = Router();

// Login - returns JWT-like token with role/permissions
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email is required' } });
      return;
    }

    const user = users.findByEmail(email);

    // POC: accept any password for seeded users with active status
    if (!user || user.status !== 'active') {
      res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
      return;
    }

    // Get user with role info
    const userWithRole = users.findByIdWithRole(user.id);
    if (!userWithRole) {
      res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
      return;
    }

    // Get permissions for this role
    const permissions = users.getPermissionsForRole(user.roleId);
    const permissionCodes = permissions.map(p => p.code);

    // Create session token
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      role: userWithRole.roleName,
      roleDisplayName: userWithRole.roleDisplayName,
      roleLevel: userWithRole.roleLevel,
      organisationId: user.organisationId,
      permissions: permissionCodes,
      exp: Date.now() + 8 * 60 * 60 * 1000,
    })).toString('base64');

    // Store session
    users.createSession(user.id, token, expiresAt);

    // Update last login via update
    users.update(user.id, {});

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          role: userWithRole.roleName,
          roleDisplayName: userWithRole.roleDisplayName,
          organisationId: user.organisationId,
          permissions: permissionCodes,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
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
    const token = authHeader.slice(7);
    users.deleteSession(token);
  }
  res.json({ success: true, data: { message: 'Logged out' } });
});

// Check permission
authRouter.post('/check-permission', (req: Request, res: Response) => {
  try {
    const { userId, permission } = req.body;
    const hasPermission = users.hasPermission(userId, permission);
    res.json({ success: true, data: { hasPermission, userId, permission } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});
