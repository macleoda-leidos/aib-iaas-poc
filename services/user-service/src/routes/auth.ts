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
import { validate, loginSchema, verifyMfaSchema } from '@aib-iaas/validation';
import type { UserWithRole } from '@aib-iaas/database';

export const authRouter = Router();

const ACCESS_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const INVALID = { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };

/**
 * Mint an access token for a fully-authenticated user: a per-token `jti` is
 * recorded as a session row so logout can revoke it, and the signed claims are
 * built through @aib-iaas/auth.buildClaims so this endpoint and the gateway's
 * emit an identical token.
 */
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
  users.createSession(userWithRole.id, jti, new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString());
  users.update(userWithRole.id, {}); // touch updated_at (last login)
  return { token, permissions };
}

function userPayload(userWithRole: UserWithRole, permissions: string[]) {
  return {
    id: userWithRole.id,
    email: userWithRole.email,
    firstName: userWithRole.firstName,
    lastName: userWithRole.lastName,
    displayName: userWithRole.displayName,
    role: userWithRole.roleName,
    roleDisplayName: userWithRole.roleDisplayName,
    organisationId: userWithRole.organisationId,
    permissions,
  };
}

// Login — verifies the password, then either issues a token or (for MFA
// accounts) returns a short-lived challenge. No token is issued before the
// second factor is proven (fixes H4).
authRouter.post('/login', validate(loginSchema), (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};

    const user = users.findByEmail(email);

    // Spend the hashing time even when the account is missing or inactive, so a
    // bad email is not measurably faster to reject than a bad password (no
    // user-enumeration oracle). No default-to-success path remains.
    if (!user || user.status !== 'active') {
      verifyPassword(password, user?.passwordHash ?? null);
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

// Verify the second factor. Consumes the login challenge, checks a real TOTP
// against the user's seeded secret, and only then issues the access token.
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

// Validate token and return user context
authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
    return;
  }

  try {
    const payload = verifyToken(authHeader.slice(7));
    res.json({ success: true, data: payload });
  } catch (err) {
    const expired = err instanceof TokenError && err.code === 'TOKEN_EXPIRED';
    res.status(401).json({ success: false, error: expired ? { code: 'TOKEN_EXPIRED', message: 'Session expired' } : { code: 'INVALID_TOKEN', message: 'Invalid token' } });
  }
});

// Logout — revoke the token's session so it stops authenticating immediately.
authRouter.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyToken<AccessTokenClaims>(authHeader.slice(7));
      if (payload.jti) users.deleteSession(payload.jti);
    } catch { /* already invalid/expired — nothing to revoke */ }
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
