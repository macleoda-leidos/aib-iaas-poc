import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccessToken, type VerifyFailure } from './jwt';

/**
 * Express guards, built once and injected with whatever can look up sessions and
 * permissions.
 *
 * These lived in `services/api-gateway/src/middleware/rbac.ts`, which meant every
 * other service either imported across a service boundary or went unguarded. It went
 * unguarded: `POST /api/users` accepted an attacker-chosen `roleId` from an
 * unauthenticated caller, so three requests produced a *legitimately signed*
 * admin session — no forgery, so signing the tokens had bought nothing.
 *
 * Duplicating the middleware per service would have reproduced the divergence that
 * caused it, so it lives here and each service injects its own repositories. One
 * implementation, several bindings.
 */

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  roleLevel: number;
  organisationId?: string;
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * What the guards need from the data layer, named as functions rather than as a
 * repository so this package keeps no dependency on `@aib-iaas/database`.
 */
export interface AuthGuardDeps {
  /** Resolve a stored session for a presented token, or undefined/null if none. */
  findSessionByToken(token: string): Promise<{ userId: string } | null | undefined>;
  /** The caller's current permission codes, read fresh from the database. */
  getPermissionsForUser(userId: string): Promise<Array<{ code: string }>>;
}

/**
 * Permissions are read per request rather than taken from the token, so granting or
 * revoking access takes effect immediately. The cache only stops a burst from one
 * client issuing a query each; its lifetime is short enough that "immediately"
 * remains true in any sense an operator cares about.
 *
 * Session validity is deliberately **not** cached — that would reintroduce the window
 * where a logged-out token still works.
 */
const PERMISSION_CACHE_TTL_MS = 5_000;
const PERMISSION_CACHE_MAX_ENTRIES = 1_000;

export interface AuthGuards {
  authenticate: RequestHandler;
  optionalAuth: RequestHandler;
  requirePermission(...codes: string[]): RequestHandler;
  requireAnyPermission(...codes: string[]): RequestHandler;
  requireRoleLevel(minLevel: number): RequestHandler;
  clearPermissionCache(userId?: string): void;
}

export function createAuthGuards(deps: AuthGuardDeps): AuthGuards {
  const permissionCache = new Map<string, { codes: string[]; expiresAt: number }>();

  async function resolvePermissions(userId: string): Promise<string[]> {
    const cached = permissionCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) return cached.codes;

    const codes = (await deps.getPermissionsForUser(userId)).map(p => p.code);

    // Keyed by user id, so growth is unbounded in the number of distinct callers.
    // Clearing wholesale at the ceiling is crude but predictable, and at this TTL the
    // cache refills in seconds.
    if (permissionCache.size >= PERMISSION_CACHE_MAX_ENTRIES) permissionCache.clear();
    permissionCache.set(userId, { codes, expiresAt: Date.now() + PERMISSION_CACHE_TTL_MS });
    return codes;
  }

  /** A rejected token says which of the two problems it is, and no more. */
  function reject(res: Response, reason: VerifyFailure): void {
    if (reason === 'expired') {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Session expired. Please log in again.' },
      });
      return;
    }
    // Everything else — bad signature, unsupported algorithm, wrong audience — is
    // reported identically. Telling a caller how their forgery was detected helps
    // them iterate on it.
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token.' },
    });
  }

  /**
   * Verify the bearer token's signature, confirm the session behind it is live, and
   * attach the caller's identity and current permissions. All three checks matter —
   * any one missing leaves the other two looking like a complete story.
   */
  const authenticate: RequestHandler = async (req, res, next) => {
    const request = req as AuthenticatedRequest;
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required. Provide a Bearer token.' },
      });
      return;
    }

    const token = authHeader.slice(7);
    const verified = verifyAccessToken(token);
    if (!verified.valid) {
      reject(res, verified.reason);
      return;
    }

    try {
      const session = await deps.findSessionByToken(token);
      if (!session) {
        res.status(401).json({
          success: false,
          error: { code: 'SESSION_ENDED', message: 'Session is no longer valid. Please log in again.' },
        });
        return;
      }

      request.user = {
        userId: verified.claims.sub,
        email: verified.claims.email,
        role: verified.claims.role,
        roleLevel: verified.claims.roleLevel || 0,
        organisationId: verified.claims.organisationId ?? undefined,
        permissions: await resolvePermissions(verified.claims.sub),
      };

      next();
    } catch (error: any) {
      // A database that cannot answer must not read as "no permissions" — that would
      // render as a 403 and look like a policy decision. Fail as the server error it is.
      next(error);
    }
  };

  /**
   * Attach the caller if a token is present, without requiring one.
   *
   * "Optional" governs whether a token is *required*, not whether it is *checked*: an
   * unverifiable token is ignored entirely rather than half-trusted, or this would be
   * the way round every other guard.
   */
  const optionalAuth: RequestHandler = async (req, _res, next) => {
    const request = req as AuthenticatedRequest;
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const verified = verifyAccessToken(token);
        if (verified.valid && (await deps.findSessionByToken(token))) {
          request.user = {
            userId: verified.claims.sub,
            email: verified.claims.email,
            role: verified.claims.role,
            roleLevel: verified.claims.roleLevel || 0,
            organisationId: verified.claims.organisationId ?? undefined,
            permissions: await resolvePermissions(verified.claims.sub),
          };
        }
      } catch { /* ignore an unusable token for optional auth */ }
    }

    next();
  };

  function requirePermission(...required: string[]): RequestHandler {
    return (req, res, next) => {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }

      if (!required.every(code => user.permissions.includes(code))) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to perform this action.',
            // `required` only. The caller's own granted list used to be returned
            // beside it, which handed an attacker both the permission they needed and
            // the full set they held.
            details: { required },
          },
        });
        return;
      }

      next();
    };
  }

  function requireAnyPermission(...permissions: string[]): RequestHandler {
    return (req, res, next) => {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }

      if (!permissions.some(code => user.permissions.includes(code))) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions.' },
        });
        return;
      }

      next();
    };
  }

  function requireRoleLevel(minLevel: number): RequestHandler {
    return (req, res, next) => {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }

      if (user.roleLevel < minLevel) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Your role does not have sufficient access level.' },
        });
        return;
      }

      next();
    };
  }

  function clearPermissionCache(userId?: string): void {
    if (userId) permissionCache.delete(userId);
    else permissionCache.clear();
  }

  return { authenticate, optionalAuth, requirePermission, requireAnyPermission, requireRoleLevel, clearPermissionCache };
}

/** The role whose access is scoped to its own records rather than granted across the service. */
export const DEBTOR_ROLE = 'debtor';

/** Is this caller a debtor, and therefore limited to their own records? */
export function isDebtor(req: { user?: AuthenticatedUser }): boolean {
  return req.user?.role === DEBTOR_ROLE;
}

/**
 * Refuse a role change that would grant the target more authority than the caller has.
 *
 * Without this, `users.update` is a privilege-escalation primitive for anyone who holds
 * it: an officer could promote themselves, or a colleague, to system administrator.
 * Compared by level rather than by an allowlist so a new role inherits the rule.
 */
export function canAssignRole(callerRoleLevel: number, targetRoleLevel: number): boolean {
  return targetRoleLevel <= callerRoleLevel;
}
