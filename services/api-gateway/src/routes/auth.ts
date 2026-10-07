import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import {
  signToken,
  verifyToken,
  buildClaims,
  verifyPassword,
  verifyTotpCode,
  TokenError,
  MFA_CHALLENGE_TTL_SECONDS,
  type AccessTokenClaims,
} from '@aib-iaas/auth';
import { users } from '../db';
import { recordSession, revokeSession } from '../middleware/sessionStore';
import { validate, loginSchema, verifyMfaSchema } from '@aib-iaas/validation';
import type { UserWithRole } from '@aib-iaas/database';

export const authRouter = Router();

/**
 * Authentication for the deployed gateway surface.
 *
 * This used to emit a thin, unsigned base64 token (no permissions, no role
 * level) and accept any password — including a hardcoded demo@example.com/demo
 * fallback that minted a token for a user that need not exist. All three are
 * gone: the token is a signed JWT whose claims are built through the same
 * buildClaims() the user-service uses, the password is verified with bcrypt,
 * and MFA accounts must clear a real second factor before any token is issued.
 *
 * Production target remains federation with ScotAccount / GOV.UK One Login
 * (GAP-007); HS256 closes the forgeability gap for the POC.
 */

const ACCESS_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const INVALID = { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };

function issueAccessToken(userWithRole: UserWithRole): { token: string; permissions: string[] } {
  const permissions = users.getPermissionsForRole(userWithRole.roleId).map(p => p.code);
  const jti = randomUUID();
  const token = signToken(
    buildClaims(
      {
        id: userWithRole.id,
        email: userWithRole.email,
        roleName: userWithRole.roleName,
        roleLevel: userWithRole.roleLevel,
        organisationId: userWithRole.organisationId,
      },
      permissions,
      jti
    )
  );
  recordSession(jti, userWithRole.id, new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString());
  return { token, permissions };
}

function userPayload(userWithRole: UserWithRole, permissions: string[]) {
  return {
    id: userWithRole.id,
    email: userWithRole.email,
    name: userWithRole.displayName || `${userWithRole.firstName} ${userWithRole.lastName}`,
    role: userWithRole.roleName,
    roleDisplayName: userWithRole.roleDisplayName,
    organisationId: userWithRole.organisationId,
    permissions,
  };
}

authRouter.post('/login', validate(loginSchema), (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};

    const user = users.findByEmail(email);

    if (!user || user.status !== 'active') {
      verifyPassword(password, user?.passwordHash ?? null); // constant-time-ish reject
      res.status(401).json({ success: false, error: INVALID });
      return;
    }
    if (!verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ success: false, error: INVALID });
      return;
    }

    const userWithRole = users.findByIdWithRole(user.id);
    if (!userWithRole) {
      res.status(401).json({ success: false, error: INVALID });
      return;
    }

    if (userWithRole.mfaEnabled) {
      const challenge = signToken(
        { purpose: 'mfa', userId: user.id, email: user.email },
        { expiresInSeconds: MFA_CHALLENGE_TTL_SECONDS }
      );
      res.json({ success: true, data: { mfaRequired: true, challenge } });
      return;
    }

    const { token, permissions } = issueAccessToken(userWithRole);
    res.json({ success: true, data: { token, user: userPayload(userWithRole, permissions) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

authRouter.post('/verify-mfa', validate(verifyMfaSchema), (req: Request, res: Response) => {
  try {
    const { challenge, code } = req.body ?? {};

    let claims: AccessTokenClaims & { purpose?: string; userId: string };
    try {
      claims = verifyToken(challenge);
    } catch (err) {
      const expired = err instanceof TokenError && err.code === 'TOKEN_EXPIRED';
      res.status(401).json({ success: false, error: { code: expired ? 'CHALLENGE_EXPIRED' : 'INVALID_CHALLENGE', message: 'MFA challenge invalid or expired. Please sign in again.' } });
      return;
    }

    if (claims.purpose !== 'mfa') {
      res.status(401).json({ success: false, error: { code: 'INVALID_CHALLENGE', message: 'Not an MFA challenge token.' } });
      return;
    }

    const userWithRole = users.findByIdWithRole(claims.userId);
    if (!userWithRole || userWithRole.status !== 'active' || !verifyTotpCode(userWithRole.mfaSecret, String(code))) {
      res.status(401).json({ success: false, error: { code: 'INVALID_MFA_CODE', message: 'Incorrect verification code.' } });
      return;
    }

    const { token, permissions } = issueAccessToken(userWithRole);
    res.json({ success: true, data: { token, user: userPayload(userWithRole, permissions) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
    return;
  }

  try {
    const payload = verifyToken<AccessTokenClaims>(authHeader.slice(7));
    res.json({
      success: true,
      data: { userId: payload.userId, email: payload.email, role: payload.role, permissions: payload.permissions },
    });
  } catch (err) {
    const expired = err instanceof TokenError && err.code === 'TOKEN_EXPIRED';
    res.status(401).json({ success: false, error: expired ? { code: 'TOKEN_EXPIRED', message: 'Token has expired' } : { code: 'INVALID_TOKEN', message: 'Invalid token' } });
  }
});

authRouter.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyToken<AccessTokenClaims>(authHeader.slice(7));
      if (payload.jti) revokeSession(payload.jti);
    } catch { /* already invalid/expired */ }
  }
  res.json({ success: true, data: { message: 'Logged out' } });
});
