export {
  issueAccessToken,
  verifyAccessToken,
  accessTokenTtlSeconds,
} from './jwt';
export type {
  AccessTokenClaims,
  IssueTokenInput,
  VerifyResult,
  VerifyFailure,
} from './jwt';

export { getSigningKeys, resetSigningKeys, generateKeyPairPem } from './keys';

// Express guards, built once here and injected per service. They used to live in
// api-gateway, which is why every other service was unguarded.
export { createAuthGuards, isDebtor, canAssignRole, DEBTOR_ROLE } from './express';
export type {
  AuthGuards,
  AuthGuardDeps,
  AuthenticatedRequest,
  AuthenticatedUser,
} from './express';
