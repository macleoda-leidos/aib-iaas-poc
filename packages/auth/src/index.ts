/**
 * @aib-iaas/auth — the trust root for the IAAS POC.
 *
 * Before Phase 1 the deployed API had no trustworthy identity: tokens were
 * unsigned base64 JSON (forgeable by anyone), login never checked a password,
 * and "MFA" was client-side theatre. This package centralises the four things
 * that have to be trustworthy for anything downstream to be — token signing,
 * token verification, password hashing and TOTP — in one place that both the
 * api-gateway and the user-service mint and verify through, so the two login
 * endpoints can never diverge on how a token is produced or checked.
 *
 * Signing is HS256 with a single injected secret, because one service both
 * mints and verifies and HS256 is CommonJS-friendly under tsx. RS256/JWKS
 * against a real IdP (ScotAccount / GOV.UK One Login) is the production target
 * and is documented as such; HS256 closes the forgeability gap for the POC.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { generateKeyPairSync, createPublicKey } from 'node:crypto';

// ─── Configuration ─────────────────────────────

/**
 * The dev/test/CI fallback secret. Deliberately public and obviously insecure:
 * it exists so local runs and the test suite can sign and verify without any
 * setup, and getJwtSecret() refuses to fall back to it in production.
 */
export const DEV_JWT_SECRET = 'dev-only-insecure-secret-aib-iaas-poc';

const ISSUER = 'aib-iaas';
const AUDIENCE = 'aib-iaas-api';
/** Access-token lifetime. Matches the 8h the old base64 token advertised. */
const ACCESS_TOKEN_TTL_SECONDS = 8 * 60 * 60;
/** The MFA challenge is short-lived: just long enough to type a 6-digit code. */
export const MFA_CHALLENGE_TTL_SECONDS = 5 * 60;
const BCRYPT_COST = 12;

/**
 * A fixed, documented TOTP secret for the demo accounts. The scripted client
 * demo logs in and completes a real second factor, so the browser needs to be
 * able to compute a currently-valid code for an account whose secret is known.
 * Real accounts get a per-user secret from generateMfaSecret(); only the demo
 * seed accounts carry this one, and that it is public is a deliberate POC
 * concession. The login page embeds the same literal (see
 * apps/web/src/app/login/page.tsx) to drive the demo's MFA beat.
 */
export const DEMO_MFA_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

/**
 * Resolve the HS256 signing secret.
 *
 * Throws in production when JWT_SECRET is unset, so a misconfigured deploy fails
 * loudly at startup rather than silently signing every token with a secret that
 * is published in this source file. Dev, test and CI fall back to the fixed dev
 * secret so tokens are reproducible with no extra configuration.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length > 0) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET must be set in production — refusing to sign tokens with the public dev secret.'
    );
  }
  return DEV_JWT_SECRET;
}

// ─── Claims ────────────────────────────────────

export interface UserForClaims {
  id: string;
  email: string;
  roleName: string;
  roleLevel: number;
  organisationId?: string | null;
}

export interface AccessTokenClaims {
  userId: string;
  email: string;
  role: string;
  roleLevel: number;
  organisationId?: string;
  permissions: string[];
  jti?: string;
  /** Standard JWT claims, present after verifyToken. */
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
}

/**
 * The single access-token payload shape. Both login endpoints build their
 * claims through here so the token a user receives is identical whichever
 * router signed it — before this, the gateway emitted a thin token (no
 * permissions, no role level) while the user-service emitted a full one, and
 * middleware behaved differently depending on which door you came through.
 */
export function buildClaims(
  user: UserForClaims,
  permissions: string[],
  jti?: string
): Record<string, unknown> {
  const claims: Record<string, unknown> = {
    userId: user.id,
    email: user.email,
    role: user.roleName,
    roleLevel: user.roleLevel,
    permissions,
  };
  if (user.organisationId) claims.organisationId = user.organisationId;
  if (jti) claims.jti = jti;
  return claims;
}

// ─── Token signing / verification ──────────────

export interface SignOptions {
  /** Override the default access-token lifetime (seconds). */
  expiresInSeconds?: number;
}

export function signToken(claims: Record<string, unknown>, options: SignOptions = {}): string {
  const expiresIn = options.expiresInSeconds ?? ACCESS_TOKEN_TTL_SECONDS;
  return jwt.sign(claims, getJwtSecret(), {
    algorithm: 'HS256',
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn,
  });
}

export const TOKEN_EXPIRED = 'TOKEN_EXPIRED';
export const INVALID_TOKEN = 'INVALID_TOKEN';
export type TokenErrorCode = typeof TOKEN_EXPIRED | typeof INVALID_TOKEN;

/**
 * Thrown by verifyToken. Callers map `.code` onto their 401 envelope, keeping
 * the TOKEN_EXPIRED vs INVALID_TOKEN distinction the existing handlers expose.
 */
export class TokenError extends Error {
  constructor(public readonly code: TokenErrorCode) {
    super(code);
    this.name = 'TokenError';
  }
}

/**
 * Verify an HS256 token, pinning the algorithm, issuer and audience.
 *
 * Pinning `algorithms: ['HS256']` is what stops the classic "alg: none" and
 * algorithm-confusion forgeries. After the signature and standard claims pass,
 * we additionally assert a numeric `exp` is present: jsonwebtoken only enforces
 * expiry when the claim exists, so a token minted without `exp` would otherwise
 * never expire (L3 / GAP-016). Everything we sign sets `exp`, so a token without
 * one is either hand-rolled or tampered — reject it.
 */
export function verifyToken<T = AccessTokenClaims>(token: string): T {
  let decoded: jwt.JwtPayload | string;
  try {
    decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw new TokenError(TOKEN_EXPIRED);
    throw new TokenError(INVALID_TOKEN);
  }

  if (typeof decoded !== 'object' || decoded === null || typeof decoded.exp !== 'number') {
    throw new TokenError(INVALID_TOKEN);
  }
  return decoded as T;
}

// ─── Password hashing ──────────────────────────

// A real bcrypt hash to compare against when an account is missing or has no
// password set. Computed lazily (and once) so processes that only verify tokens
// never pay for it, but a login against a missing/null-hash account still does
// the full cost-12 compare — otherwise rejecting an unknown user would be
// measurably faster than rejecting a known one with a wrong password, which is a
// user-enumeration oracle.
let dummyHash: string | undefined;
function getDummyHash(): string {
  if (!dummyHash) dummyHash = bcrypt.hashSync('aib-iaas-timing-dummy', BCRYPT_COST);
  return dummyHash;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_COST);
}

/**
 * Verify a password against a stored hash. Returns false (never throws) when the
 * hash is null/absent, after spending the same time a real comparison would.
 */
export function verifyPassword(password: string, hash: string | null | undefined): boolean {
  if (!hash) {
    bcrypt.compareSync(password, getDummyHash());
    return false;
  }
  return bcrypt.compareSync(password, hash);
}

// ─── TOTP (second factor) ──────────────────────

// Allow one 30-second step either side of now, so a code typed as the window
// rolls over still verifies. otplib defaults to SHA-1 / 6 digits / 30s, which
// is what every authenticator app and the browser demo helper assume.
authenticator.options = { window: 1 };

export function generateMfaSecret(): string {
  return authenticator.generateSecret();
}

export function verifyTotpCode(secret: string | null | undefined, code: string): boolean {
  if (!secret || !code) return false;
  try {
    return authenticator.check(code, secret);
  } catch {
    return false;
  }
}

/** Current TOTP code for a secret. Used by tests and the demo only. */
export function currentTotpCode(secret: string): string {
  return authenticator.generate(secret);
}

// ─── RS256 / JWKS (federation foundation) ──────
//
// The POC signs HS256 with a shared secret because one service both mints and
// verifies (see the module header). Real IdP federation (ScotAccount / GOV.UK
// One Login) is asymmetric: the IdP signs RS256 with its private key and the API
// verifies against the IdP's published JWKS, holding no signing key. These
// helpers are that verification path, so the production shape is proven and
// tested now; they are opt-in and do not change the HS256 default. See
// docs/identity-federation-plan.md for how they slot into an OIDC flow.

export interface RsaKeyPair {
  privateKey: string;
  publicKey: string;
}

/** Generate a 2048-bit RSA keypair in PEM. Stands in for the IdP's keys in the
 *  POC; in production the public half comes from the IdP's JWKS. */
export function generateRsaKeyPair(): RsaKeyPair {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { privateKey, publicKey };
}

export interface Rs256SignOptions extends SignOptions {
  kid?: string;
}

/** Sign an RS256 token with a PEM private key (the IdP's role). */
export function signRs256(claims: Record<string, unknown>, privateKeyPem: string, options: Rs256SignOptions = {}): string {
  return jwt.sign(claims, privateKeyPem, {
    algorithm: 'RS256',
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: options.expiresInSeconds ?? ACCESS_TOKEN_TTL_SECONDS,
    ...(options.kid ? { keyid: options.kid } : {}),
  });
}

/**
 * Verify an RS256 token against a PEM public key (or the one resolved from a
 * JWKS). Same guarantees as verifyToken: pinned algorithm, issuer, audience, and
 * a mandatory numeric exp.
 */
export function verifyRs256<T = AccessTokenClaims>(token: string, publicKeyPem: string): T {
  let decoded: jwt.JwtPayload | string;
  try {
    decoded = jwt.verify(token, publicKeyPem, {
      algorithms: ['RS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw new TokenError(TOKEN_EXPIRED);
    throw new TokenError(INVALID_TOKEN);
  }
  if (typeof decoded !== 'object' || decoded === null || typeof decoded.exp !== 'number') {
    throw new TokenError(INVALID_TOKEN);
  }
  return decoded as T;
}

export interface Jwk {
  kty: string;
  n?: string;
  e?: string;
  kid: string;
  alg: string;
  use: string;
}

/** Export a PEM public key as a JWK (the entry a JWKS endpoint publishes). */
export function publicKeyToJwk(publicKeyPem: string, kid = 'aib-iaas-rs256'): Jwk {
  const jwk = createPublicKey(publicKeyPem).export({ format: 'jwk' }) as Record<string, string>;
  return { ...(jwk as any), kid, alg: 'RS256', use: 'sig' };
}

/** Build a JWKS document ({ keys: [...] }) for serving at /.well-known/jwks.json. */
export function buildJwks(publicKeyPem: string, kid = 'aib-iaas-rs256'): { keys: Jwk[] } {
  return { keys: [publicKeyToJwk(publicKeyPem, kid)] };
}
