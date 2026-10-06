/**
 * Server-side session registry for token revocation (Stage 4 / 1h).
 *
 * Every signed access token carries a `jti`; login records that jti as a row in
 * the existing `sessions` table, and logout deletes it. `authenticate` treats a
 * token whose jti is no longer present as revoked, so logout finally invalidates
 * a token for real — previously nothing read the session row back, and a "logged
 * out" token kept working until its 8-hour expiry.
 *
 * `users` is the same repository singleton the gateway and consolidated-api
 * already initialise, so recording a session here and reading it back in
 * `authenticate` operate on one store.
 */
import { users } from '../db';

/** Record a freshly minted token's jti so it can later be revoked. */
export function recordSession(jti: string, userId: string, expiresAtIso: string): void {
  users.createSession(userId, jti, expiresAtIso);
}

/** True when the jti has no live session row — i.e. it was logged out / revoked. */
export function isSessionRevoked(jti: string): boolean {
  return !users.findSessionByToken(jti);
}

/** Revoke a token by removing its session row (logout). */
export function revokeSession(jti: string): void {
  users.deleteSession(jti);
}
