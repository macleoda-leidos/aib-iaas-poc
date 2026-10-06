import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenError, TOKEN_EXPIRED, type AccessTokenClaims } from '@aib-iaas/auth';
import { isSessionRevoked } from './sessionStore';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    roleLevel: number;
    organisationId?: string;
    permissions: string[];
    jti?: string;
  };
}

/**
 * Authentication middleware — verifies the signed bearer token and attaches the
 * user context.
 *
 * The token is now an HS256 JWT verified by @aib-iaas/auth (signature + issuer +
 * audience + a mandatory numeric exp). This replaces the old base64 decode,
 * which trusted whatever JSON the client sent — tokens were forgeable and a
 * token simply omitting `exp` never expired. verifyToken closes both.
 *
 * After the signature and expiry pass, a token carrying a `jti` is checked
 * against the session store so logout can actually invalidate it (see Stage 4 /
 * sessionStore). Tokens minted without a jti (only ever in unit tests) skip the
 * revocation check — every real login includes one.
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Provide a Bearer token.' },
    });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyToken<AccessTokenClaims>(token);

    if (payload.jti && isSessionRevoked(payload.jti)) {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Session ended. Please log in again.' },
      });
      return;
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      roleLevel: payload.roleLevel || 0,
      organisationId: payload.organisationId,
      permissions: payload.permissions || [],
      jti: payload.jti,
    };

    next();
  } catch (err) {
    const expired = err instanceof TokenError && err.code === TOKEN_EXPIRED;
    res.status(401).json({
      success: false,
      error: expired
        ? { code: 'TOKEN_EXPIRED', message: 'Session expired. Please log in again.' }
        : { code: 'INVALID_TOKEN', message: 'Invalid authentication token.' },
    });
  }
}

/**
 * Require specific permission(s) - middleware factory.
 * Usage: router.get('/admin', authenticate, requirePermission('application.read.all'), handler)
 */
export function requirePermission(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const hasAll = requiredPermissions.every(p => req.user!.permissions.includes(p));

    if (!hasAll) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action.',
          details: { required: requiredPermissions, granted: req.user.permissions },
        },
      });
      return;
    }

    next();
  };
}

/**
 * Require ANY of the specified permissions (OR logic).
 */
export function requireAnyPermission(...permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const hasAny = permissions.some(p => req.user!.permissions.includes(p));

    if (!hasAny) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions.' },
      });
      return;
    }

    next();
  };
}

/**
 * Require minimum role level (numeric hierarchy).
 * Higher level = more access. Useful for broad checks.
 */
export function requireRoleLevel(minLevel: number) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    if (req.user.roleLevel < minLevel) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Your role does not have sufficient access level.' },
      });
      return;
    }

    next();
  };
}

/**
 * Require a different permission depending on the HTTP method, for routers that
 * mix read and write on one mount (e.g. /api/users: GET→users.read,
 * POST→users.create, …). A method with no entry is left unrestricted, so the
 * router's own logic / the global gate still applies. Each entry may be a single
 * code or a list treated as any-of.
 */
export function requirePermissionByMethod(map: Record<string, string | string[]>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const required = map[req.method];
    if (!required) { next(); return; }
    const perms = Array.isArray(required) ? required : [required];
    requireAnyPermission(...perms)(req, res, next);
  };
}

/**
 * Optional authentication - attaches user if token present, but doesn't require it.
 * Useful for public endpoints that behave differently when authenticated.
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = verifyToken<AccessTokenClaims>(token);
      if (!payload.jti || !isSessionRevoked(payload.jti)) {
        req.user = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          roleLevel: payload.roleLevel || 0,
          organisationId: payload.organisationId,
          permissions: payload.permissions || [],
          jti: payload.jti,
        };
      }
    } catch { /* invalid/expired token is simply ignored for optional auth */ }
  }

  next();
}
