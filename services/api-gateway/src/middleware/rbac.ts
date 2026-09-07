import { Response } from 'express';
import { createAuthGuards, isDebtor, DEBTOR_ROLE, type AuthenticatedRequest } from '@aib-iaas/auth';
import { users } from '../db';

/**
 * This service's binding of the shared Express guards.
 *
 * The implementation moved to `@aib-iaas/auth` because it living here was the reason
 * every other service went unguarded — `POST /api/users` took an attacker-chosen
 * `roleId` from an unauthenticated caller, so three requests produced a legitimately
 * signed admin session and signing the tokens had bought nothing. One implementation,
 * injected per service, is what stops that recurring.
 *
 * The export surface is unchanged so existing imports and tests are unaffected.
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

/**
 * Whether `req` may act on an application owned by `debtorUserId`.
 *
 * The check a permission cannot express. `applications.read` answers "may this caller
 * read applications", never "may this caller read *this* application", so a debtor
 * holding it could read every other debtor's case by changing the id in the URL — an
 * IDOR, and a UK GDPR Article 32 problem rather than a code-quality one.
 *
 * Ownership only constrains debtors. Staff and advisers work across cases by design and
 * are governed by their permissions instead; an application with no `debtorUserId` is
 * owned by nobody, so a debtor never matches it.
 *
 * Anonymous callers are not restricted here, because no deployed application route
 * requires authentication yet (GAP-002) and pretending otherwise would give false
 * assurance. This closes the authenticated half of the finding.
 */
export function ownsApplication(
  req: AuthenticatedRequest,
  application: { debtorUserId: string | null }
): boolean {
  if (!isDebtor(req)) return true;
  return application.debtorUserId !== null && application.debtorUserId === req.user!.userId;
}

/**
 * Deny with the same 404 an unknown id would produce.
 *
 * Deliberately not 403: answering "forbidden" for a case that exists and "not found"
 * for one that does not turns the endpoint into an oracle for which reference numbers
 * are real, which is worth more to an attacker than the refusal costs them.
 */
export function denyApplicationAccess(res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Application not found' },
  });
}
