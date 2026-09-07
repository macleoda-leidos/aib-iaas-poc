import { randomUUID, sign as cryptoSign, verify as cryptoVerify } from 'crypto';
import { getSigningKeys } from './keys';

/**
 * Signed access tokens (JWT, EdDSA/Ed25519).
 *
 * This replaces a token that was a base64-encoded JSON object with no signature
 * at all: anyone could edit the payload and mint themselves an admin session, and
 * because the authorisation layer read its permission list straight out of that
 * payload, the whole RBAC model was decorative. Everything below exists to make
 * a token's contents unforgeable, so a decision taken on the strength of them is
 * worth something.
 *
 * Two design choices are load-bearing:
 *
 *  - **`alg` is not negotiable.** The header is parsed but its `alg` is required
 *    to be exactly `EdDSA`. Accepting whatever the token asks for is the classic
 *    JWT vulnerability: a caller sends `alg: "none"`, or swaps in `HS256` and
 *    signs with the public key as the HMAC secret, and verification agrees.
 *  - **Permissions are not in the token.** Only identity is. Authorisation is
 *    resolved per request from the database, so a role change or a revocation
 *    takes effect immediately rather than at the next login. A token is proof of
 *    *who*, never of *what they may do*.
 */

/** Seconds, per RFC 7519 — not milliseconds. */
const DEFAULT_TTL_SECONDS = 8 * 60 * 60;

const ISSUER = 'aib-iaas';
const AUDIENCE = 'aib-iaas-api';

export interface AccessTokenClaims {
  /** Subject: the user id. */
  sub: string;
  email: string;
  role: string;
  roleLevel: number;
  organisationId?: string | null;
  /** Token id, also the session identifier this token is bound to. */
  jti: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface IssueTokenInput {
  userId: string;
  email: string;
  role: string;
  roleLevel?: number;
  organisationId?: string | null;
  /** Override the lifetime, in seconds. */
  ttlSeconds?: number;
  /** Override the clock, for tests. */
  now?: Date;
}

export type VerifyFailure =
  | 'malformed'
  | 'unsupported-algorithm'
  | 'bad-signature'
  | 'expired'
  | 'wrong-issuer'
  | 'wrong-audience';

export type VerifyResult =
  | { valid: true; claims: AccessTokenClaims }
  | { valid: false; reason: VerifyFailure };

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
 * Mint a signed access token.
 *
 * Returns the token and its `jti`, because the caller must record the `jti` as a
 * session before the token is of any use — see `verifyAccessToken`'s contract
 * about revocation being the caller's job.
 */
export function issueAccessToken(input: IssueTokenInput): {
  token: string;
  jti: string;
  claims: AccessTokenClaims;
  expiresAt: string;
} {
  const { privateKey } = getSigningKeys();
  const issuedAt = Math.floor((input.now?.getTime() ?? Date.now()) / 1000);
  const ttl = input.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const jti = randomUUID();

  const claims: AccessTokenClaims = {
    sub: input.userId,
    email: input.email,
    role: input.role,
    roleLevel: input.roleLevel ?? 0,
    organisationId: input.organisationId ?? null,
    jti,
    iat: issuedAt,
    exp: issuedAt + ttl,
    iss: ISSUER,
    aud: AUDIENCE,
  };

  const header = base64UrlEncode(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
  const payload = base64UrlEncode(JSON.stringify(claims));
  const signature = base64UrlEncode(cryptoSign(null, Buffer.from(`${header}.${payload}`), privateKey));

  return {
    token: `${header}.${payload}.${signature}`,
    jti,
    claims,
    expiresAt: new Date(claims.exp * 1000).toISOString(),
  };
}

/**
 * Verify a token's signature and registered claims.
 *
 * A `valid: true` result means only that the token was issued by the holder of
 * the signing key, has not expired, and is addressed to this API. It says nothing
 * about whether the session is still live — a logged-out or revoked token still
 * verifies until it expires. Callers must check the `jti` against stored sessions;
 * `authenticate` in the API gateway does exactly that.
 *
 * Returns a reason rather than throwing so callers can distinguish "log in again"
 * from "this token is not one of ours", which are different messages to a user and
 * different signals in a log.
 */
export function verifyAccessToken(token: string, options: { now?: Date } = {}): VerifyResult {
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, reason: 'malformed' };

  const [headerPart, payloadPart, signaturePart] = parts;
  if (!headerPart || !payloadPart || !signaturePart) return { valid: false, reason: 'malformed' };

  let header: { alg?: unknown; typ?: unknown };
  let claims: AccessTokenClaims;
  try {
    header = JSON.parse(base64UrlDecode(headerPart).toString('utf8'));
    claims = JSON.parse(base64UrlDecode(payloadPart).toString('utf8'));
  } catch {
    return { valid: false, reason: 'malformed' };
  }

  // Checked before the signature, and pinned to one value. `alg: "none"` and
  // algorithm substitution are only exploitable against a verifier that lets the
  // token choose how it will be checked.
  if (header.alg !== 'EdDSA') return { valid: false, reason: 'unsupported-algorithm' };

  if (!claims || typeof claims !== 'object' || typeof claims.sub !== 'string' || typeof claims.jti !== 'string') {
    return { valid: false, reason: 'malformed' };
  }

  const { publicKey } = getSigningKeys();
  let signatureOk = false;
  try {
    signatureOk = cryptoVerify(
      null,
      Buffer.from(`${headerPart}.${payloadPart}`),
      publicKey,
      base64UrlDecode(signaturePart)
    );
  } catch {
    // Defensive, and known to be unreachable for a malformed signature: Node's
    // Ed25519 verify returns false for a signature of any wrong length rather than
    // throwing. It is kept for the case that would throw — an unusable key object,
    // from a `JWT_PUBLIC_KEY` that parsed but is not an Ed25519 key — where the
    // alternative is a 500 on every request instead of a clear rejection.
    return { valid: false, reason: 'bad-signature' };
  }
  if (!signatureOk) return { valid: false, reason: 'bad-signature' };

  // Registered claims are checked only after the signature, so their values are
  // known to be the ones we issued rather than attacker-chosen.
  if (claims.iss !== ISSUER) return { valid: false, reason: 'wrong-issuer' };
  if (claims.aud !== AUDIENCE) return { valid: false, reason: 'wrong-audience' };

  const nowSeconds = Math.floor((options.now?.getTime() ?? Date.now()) / 1000);
  if (typeof claims.exp !== 'number' || claims.exp <= nowSeconds) {
    return { valid: false, reason: 'expired' };
  }

  return { valid: true, claims };
}

/** Lifetime of a freshly issued token, in seconds. Exported for session bookkeeping. */
export const accessTokenTtlSeconds = DEFAULT_TTL_SECONDS;
