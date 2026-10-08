import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import {
  signToken,
  verifyToken,
  buildClaims,
  verifyPassword,
  verifyTotpCode,
  hashPassword,
  TokenError,
  MFA_CHALLENGE_TTL_SECONDS,
  type AccessTokenClaims,
} from '@aib-iaas/auth';
import { users, notifications } from '../db';
import { recordSession, revokeSession } from '../middleware/sessionStore';
import { validate, loginSchema, verifyMfaSchema, setPasswordSchema, forgotPasswordSchema, inviteUserSchema } from '@aib-iaas/validation';
import type { UserWithRole } from '@aib-iaas/database';
import type { AuthenticatedRequest } from '../middleware/rbac';

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
/** A set-password link is valid for 24 hours (invite and reset share this). */
const SET_PASSWORD_TTL_SECONDS = 24 * 60 * 60;

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

// ─── User self-service: invite + password reset (E9) ──
//
// Closes the gap that API-created users have no password and so could never log
// in. An invite (admin action) or a forgotten-password request issues a signed,
// short-TTL set-password token; /set-password redeems it and writes a bcrypt
// hash. The two redemption-adjacent routes are the only new public endpoints
// (added to the accessPolicy allow-list); they are pre-token by necessity.

/** Issue a signed, single-purpose, short-TTL token that authorises setting a password. */
function issueSetPasswordToken(userId: string): string {
  return signToken({ purpose: 'set-password', userId }, { expiresInSeconds: SET_PASSWORD_TTL_SECONDS });
}

// Invite a user to set their password (admin action — requires users.create or
// system.admin; the global gate has already authenticated the caller). The POC
// has no mail gateway, so the token is also returned to the inviter and fired as
// an email-channel notification stub.
authRouter.post('/invite', validate(inviteUserSchema), (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }
    const perms = req.user.permissions || [];
    if (!perms.includes('users.create') && !perms.includes('system.admin')) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Inviting users requires users.create.' } });
      return;
    }
    const user = users.findById(req.body.userId);
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }
    const token = issueSetPasswordToken(user.id);
    try {
      notifications.create({
        userId: user.id, type: 'action_required', channel: 'email',
        subject: 'Set your AiB account password',
        body: 'You have been invited to the AiB IAAS portal. Follow the link to set your password.',
        link: `/auth/set-password?token=${token}`,
      });
    } catch { /* notification is best-effort */ }
    res.json({ success: true, data: { userId: user.id, setPasswordToken: token } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Redeem a set-password token (public). Verifies the signed token, then writes the
// new bcrypt hash. A bad/expired token is a generic 400 — it never reveals whether
// a user exists.
authRouter.post('/set-password', validate(setPasswordSchema), (req: Request, res: Response) => {
  const { token, password } = req.body ?? {};
  let claims: { purpose?: string; userId?: string };
  try {
    claims = verifyToken<{ purpose?: string; userId?: string }>(token);
  } catch (err) {
    const expired = err instanceof TokenError && err.code === 'TOKEN_EXPIRED';
    res.status(400).json({ success: false, error: { code: expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN', message: 'This set-password link is invalid or has expired.' } });
    return;
  }
  if (claims.purpose !== 'set-password' || !claims.userId) {
    res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'This set-password link is invalid.' } });
    return;
  }
  const user = users.findById(claims.userId);
  if (!user || user.status !== 'active') {
    res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'This set-password link is invalid.' } });
    return;
  }
  users.setPasswordHash(user.id, hashPassword(password));
  res.json({ success: true, data: { message: 'Password set. You can now sign in.' } });
});

// Request a password-reset link (public). Always returns success so it cannot be
// used to enumerate which emails have accounts.
authRouter.post('/forgot-password', validate(forgotPasswordSchema), (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  const user = users.findByEmail(email);
  if (user && user.status === 'active') {
    const token = issueSetPasswordToken(user.id);
    try {
      notifications.create({
        userId: user.id, type: 'action_required', channel: 'email',
        subject: 'Reset your AiB password',
        body: 'A password reset was requested for your account. Follow the link to choose a new password.',
        link: `/auth/set-password?token=${token}`,
      });
    } catch { /* best-effort */ }
  }
  res.json({ success: true, data: { message: 'If an account exists for that email, a reset link has been sent.' } });
});
