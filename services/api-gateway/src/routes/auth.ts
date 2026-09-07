import { Router, Request, Response } from 'express';
import { issueAccessToken, verifyAccessToken } from '@aib-iaas/auth';
import { users } from '../db';

export const authRouter = Router();

/**
 * Authentication for the POC.
 *
 * The token is a real signed JWT (Ed25519) bound to a server-side session, so it
 * cannot be forged or edited and can be revoked. What remains synthetic is
 * *credential checking*: any password is accepted for a seeded user, because no
 * password hashes exist to check against (`users.password_hash` is the literal
 * string 'not-a-real-hash' in the seed). That is tracked as GAP-003 and is the
 * remaining half of the identity story — see docs/security-known-gaps.md.
 *
 * In production this would delegate to the Scottish Government Identity Service
 * (ScotAccount) over OIDC, and MFA would be the IdP's policy rather than ours.
 */

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Email and password are required' },
      });
      return;
    }

    // A real user is now required. The previous version synthesised a
    // 'USR-DEMO-001' user when `demo@example.com` was not found — unreachable, since
    // that address is seeded as `user-demo`, and unusable now in any case: a session
    // row carries a foreign key to `users`, so an id that exists only in a token
    // could not have one.
    const user = await users.findByEmail(email);
    if (!user || user.status !== 'active') {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
      return;
    }

    const withRole = await users.findByIdWithRole(user.id);

    const { token, expiresAt } = issueAccessToken({
      userId: user.id,
      email: user.email,
      role: withRole?.roleName ?? 'applicant',
      roleLevel: withRole?.roleLevel ?? 0,
      organisationId: user.organisationId,
    });

    await users.createSession(user.id, token, expiresAt);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.displayName || `${user.firstName} ${user.lastName}`,
          role: withRole?.roleName ?? 'applicant',
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

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
          ? { code: 'TOKEN_EXPIRED', message: 'Token has expired' }
          : { code: 'INVALID_TOKEN', message: 'Invalid token' },
      });
      return;
    }

    // Same reasoning as the user-service equivalent: the frontend treats this as
    // "am I still logged in?", so it must consult the session and not just the token.
    if (!(await users.findSessionByToken(token))) {
      res.status(401).json({ success: false, error: { code: 'SESSION_ENDED', message: 'Session is no longer valid' } });
      return;
    }

    res.json({
      success: true,
      data: { userId: verified.claims.sub, email: verified.claims.email, role: verified.claims.role },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});
