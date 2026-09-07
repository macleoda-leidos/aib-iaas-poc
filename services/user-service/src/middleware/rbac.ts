import { createAuthGuards, isDebtor, DEBTOR_ROLE, type AuthenticatedRequest } from '@aib-iaas/auth';
import { users } from '../db';

/**
 * This service's binding of the shared Express guards.
 *
 * It had none, which is why `POST /api/users` accepted an attacker-chosen `roleId`
 * from an unauthenticated caller: three requests — read the role ids, create a
 * `role-sysadmin` account, log in with any password — produced a genuinely signed
 * session holding all twenty permissions. No forgery involved, so Ed25519 tokens
 * bought nothing against it.
 */
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
