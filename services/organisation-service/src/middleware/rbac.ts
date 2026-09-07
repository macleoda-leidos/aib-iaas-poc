import { createAuthGuards, isDebtor, DEBTOR_ROLE, type AuthenticatedRequest } from '@aib-iaas/auth';
import { createRepositories } from '@aib-iaas/database';

/**
 * This service's binding of the shared Express guards.
 *
 * The guards themselves live in `@aib-iaas/auth`; only the data-layer wiring is here.
 * They used to live in `api-gateway`, which is why every other service was
 * unauthenticated — reaching across a service boundary for middleware was awkward
 * enough that nobody did it, and the routes went unguarded instead.
 *
 * `createRepositories()` is cheap: both connection constructors are lazy, so this
 * costs nothing until the first query.
 */
const { users } = createRepositories();

const guards = createAuthGuards({
  findSessionByToken: token => users.findSessionByToken(token),
  getPermissionsForUser: userId => users.getPermissionsForUser(userId),
});

export const authenticate = guards.authenticate;
export const optionalAuth = guards.optionalAuth;
export const requirePermission = guards.requirePermission;
export const requireAnyPermission = guards.requireAnyPermission;
export const requireRoleLevel = guards.requireRoleLevel;
export const clearPermissionCache = guards.clearPermissionCache;

export { isDebtor, DEBTOR_ROLE };
export type { AuthenticatedRequest };
