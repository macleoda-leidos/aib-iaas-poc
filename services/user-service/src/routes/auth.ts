import { Router, Request, Response } from 'express';
import { issueAccessToken, verifyAccessToken } from '@aib-iaas/auth';
import { users } from '../db';

export const authRouter = Router();

// Login - returns JWT-like token with role/permissions
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email is required' } });
      return;
    }

    const user = await users.findByEmail(email);

    // POC: accept any password for seeded users with active status
    if (!user || user.status !== 'active') {
      res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
      return;
    }

    // Get user with role info
    const userWithRole = await users.findByIdWithRole(user.id);
    if (!userWithRole) {
      res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
      return;
    }

    // Permissions are returned to the client so it can render the right controls.
    // They are deliberately *not* put in the token — the API resolves them from the
    // database on each request, so this list is a UI hint, never the authority.
    const permissions = await users.getPermissionsForRole(user.roleId);
    const permissionCodes = permissions.map(p => p.code);

    // Signed with Ed25519 and carrying identity only. The token this replaced was
    // unsigned base64 that any client could rewrite.
    const { token, expiresAt } = issueAccessToken({
      userId: user.id,
      email: user.email,
      role: userWithRole.roleName,
      roleLevel: userWithRole.roleLevel,
      organisationId: user.organisationId,
    });

    // Recorded before the token is returned: `authenticate` rejects a token with no
    // matching session, so a token that reached a client without this row would be
    // dead on arrival — and deleting the row is what makes logout immediate.
    await users.createSession(user.id, token, expiresAt);

    // Update last login via update
    await users.update(user.id, {});

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
authRouter.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const verified = verifyAccessToken(token);

    if (!verified.valid) {
      const expired = verified.reason === 'expired';
      res.status(401).json({
        success: false,
        error: expired
          ? { code: 'TOKEN_EXPIRED', message: 'Session expired' }
          : { code: 'INVALID_TOKEN', message: 'Invalid token' },
      });
      return;
    }

    // The session check matters as much here as on a protected route: this endpoint
    // is what the frontend asks "am I still logged in?", and answering yes from the
    // token alone would keep a logged-out client believing it had a session.
    if (!(await users.findSessionByToken(token))) {
      res.status(401).json({ success: false, error: { code: 'SESSION_ENDED', message: 'Session is no longer valid' } });
      return;
    }

    // Permissions come from the database, so this reflects the user's access now
    // rather than at the moment the token was minted.
    const permissions = (await users.getPermissionsForUser(verified.claims.sub)).map(p => p.code);

    res.json({
      success: true,
      data: {
        userId: verified.claims.sub,
        email: verified.claims.email,
        role: verified.claims.role,
        roleLevel: verified.claims.roleLevel,
        organisationId: verified.claims.organisationId,
        permissions,
        exp: verified.claims.exp,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Logout
authRouter.post('/logout', async (req: Request, res: Response) => {
  // The only handler here that had no try/catch. Express 4 does not observe a
  // rejected promise returned by a handler, so once deleteSession became async an
  // unreachable database would have produced an unhandled rejection and a request
  // that never answers, rather than an error response.
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      await users.deleteSession(token);
    }
    res.json({ success: true, data: { message: 'Logged out' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Check permission
authRouter.post('/check-permission', async (req: Request, res: Response) => {
  try {
    const { userId, permission } = req.body;
    const hasPermission = await users.hasPermission(userId, permission);
    res.json({ success: true, data: { hasPermission, userId, permission } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});
