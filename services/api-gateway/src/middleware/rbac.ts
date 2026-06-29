import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    roleLevel: number;
    organisationId?: string;
    permissions: string[];
  };
}

/**
 * Authentication middleware - validates bearer token and attaches user context.
 * In production: validates JWT signature, checks token expiry, verifies against revocation list.
 * POC: decodes base64 token from user-service.
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
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());

    if (payload.exp && payload.exp < Date.now()) {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Session expired. Please log in again.' },
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
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token.' },
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
 * Optional authentication - attaches user if token present, but doesn't require it.
 * Useful for public endpoints that behave differently when authenticated.
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      if (!payload.exp || payload.exp >= Date.now()) {
        req.user = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          roleLevel: payload.roleLevel || 0,
          organisationId: payload.organisationId,
          permissions: payload.permissions || [],
        };
      }
    } catch { /* ignore invalid token for optional auth */ }
  }

  next();
}
