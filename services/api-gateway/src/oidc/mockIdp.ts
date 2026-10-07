/**
 * Mock GOV.UK One Login (OIDC) provider — the IdP half of the federation demo.
 *
 * GAP-007's production target is to delegate authentication to a real Scottish
 * Government IdP and verify its RS256 ID tokens against the IdP's published JWKS.
 * No such IdP is reachable in the POC environment, so this module stands one up
 * in-process: it owns a per-process RSA keypair, issues RS256 ID tokens with its
 * OWN issuer/audience (not the app's), and publishes the matching JWKS. The
 * router (./router.ts) is the client half.
 *
 * Why `jsonwebtoken` directly rather than `@aib-iaas/auth.signRs256`/`verifyRs256`:
 * those helpers pin the APP's issuer/audience (`aib-iaas` / `aib-iaas-api`) by
 * design, because they model the API verifying its own future RS256 session
 * tokens. An ID token from an IdP carries the IDP's `iss`/`aud`, so it needs its
 * own sign/verify with the IdP's claims. `buildJwks` IS reused, because the JWKS
 * shape is identical regardless of whose key it describes.
 *
 * The token exchange + ID-token verification run in-process (see router.ts), so
 * the browser-facing redirects are real HTTP but the back-channel never leaves
 * the process — robust in the single deployed container, no self-HTTP.
 */

import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { generateRsaKeyPair, buildJwks, type Jwk } from '@aib-iaas/auth';

// The IdP's identity. Deliberately distinct from the app's ISSUER/AUDIENCE so an
// ID token can never be confused with — or replayed as — an app session token.
const IDP_ISSUER = 'https://mock-one-login.aib-iaas.poc';
/** OAuth client_id the gateway registers as. Checked at /idp/authorize. */
export const CLIENT_ID = 'aib-iaas-poc-client';
/** Key id advertised in the JWKS and stamped on every ID token (`kid`). */
const IDP_KID = 'mock-one-login-key-1';

/**
 * The fixed demo subject the mock IdP auto-approves, mapping to the seeded Case
 * Officer `demo@example.com` (role-officer / aib_officer).
 *
 * Why this account specifically: it is inserted by `initializeSchema` (the
 * inline seed that runs for EVERY database — the in-memory test DB and the
 * deployed disk alike), so the callback's email→user resolution is deterministic
 * in both. The richer `seed-data/users.json` staff (e.g. ross.mackenzie@…) are
 * only loaded by the full `seedDatabase` on deploy, so a subject pointing at them
 * would resolve in production but 401 in the test suite. Federation legitimately
 * bypasses the account's local MFA flag — the IdP has already asserted the
 * identity. An account picker on the authorize screen is a noted future
 * enhancement; a fixed subject keeps the demo and the test deterministic.
 */
export const DEMO_SUBJECT = 'urn:fdc:gov.uk:2022:mock-aib-case-officer';
const DEMO_EMAIL = 'demo@example.com';

/** Short lifetimes: a code lives only long enough to be redeemed immediately. */
const CODE_TTL_SECONDS = 2 * 60;
const ID_TOKEN_TTL_SECONDS = 5 * 60;

// Per-process keypair. Regenerated on every boot — fine for a mock, and it means
// the private key never touches disk or config. In production the public half
// would be fetched from the real IdP's JWKS instead.
//
// Single-process assumption: the authorization code is signed with THIS key, so
// the authorize→callback hop must land on the same process to verify. The
// deployment is a single Render container, so that always holds. (Only the state
// token — signed with the shared JWT_SECRET — is genuinely cross-instance; a
// real IdP would hold its signing key centrally, removing the assumption.)
const keyPair = generateRsaKeyPair();

/** Standard base64url(SHA-256(verifier)) — the PKCE "S256" transform (RFC 7636). */
export function codeChallengeFor(codeVerifier: string): string {
  return createHash('sha256').update(codeVerifier).digest('base64url');
}

/** The JWKS the IdP publishes at /idp/jwks.json. Reuses the shared builder. */
export function getJwks(): { keys: Jwk[] } {
  return buildJwks(keyPair.publicKey, IDP_KID);
}

/**
 * Authorization step: having "authenticated" the subject, issue a signed
 * authorization code bound to the PKCE challenge and the nonce. Signed with the
 * IdP's private key so a forged code (any other signer) fails redemption. The
 * `purpose` claim stops a stray ID token being replayed here.
 */
export function authorizeRedirectCode(sub: string, nonce: string, codeChallenge: string): string {
  return jwt.sign(
    { purpose: 'oidc_code', sub, nonce, cc: codeChallenge },
    keyPair.privateKey,
    { algorithm: 'RS256', expiresIn: CODE_TTL_SECONDS, keyid: IDP_KID }
  );
}

/**
 * Token endpoint (in-process): verify the authorization code's signature, bind it
 * to the caller via PKCE (the presented verifier must hash to the challenge the
 * code was issued against), then mint the RS256 ID token. Throws on any failure
 * — the router maps that to a 401.
 */
export function exchange(code: string, codeVerifier: string): string {
  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(code, keyPair.publicKey, { algorithms: ['RS256'] }) as jwt.JwtPayload;
  } catch {
    throw new Error('invalid authorization code');
  }
  if (decoded.purpose !== 'oidc_code' || typeof decoded.sub !== 'string') {
    throw new Error('not an authorization code');
  }
  // PKCE: proves the party redeeming the code is the party that started the flow.
  if (codeChallengeFor(codeVerifier) !== decoded.cc) {
    throw new Error('PKCE verification failed');
  }

  return jwt.sign(
    { email: DEMO_EMAIL, email_verified: true, nonce: decoded.nonce },
    keyPair.privateKey,
    {
      algorithm: 'RS256',
      issuer: IDP_ISSUER,
      audience: CLIENT_ID,
      subject: decoded.sub,
      expiresIn: ID_TOKEN_TTL_SECONDS,
      keyid: IDP_KID,
    }
  );
}

export interface IdTokenClaims extends jwt.JwtPayload {
  email?: string;
  email_verified?: boolean;
  nonce?: string;
}

/**
 * The client's verification of the ID token: RS256 against the IdP's public key
 * (the JWKS key in production), pinning the IdP's issuer and audience, then the
 * nonce binds the token to this specific flow (replay defence). Throws on any
 * failure — the router maps that to a 401.
 */
export function verifyIdToken(idToken: string, expectedNonce: string): IdTokenClaims {
  let decoded: IdTokenClaims;
  try {
    decoded = jwt.verify(idToken, keyPair.publicKey, {
      algorithms: ['RS256'],
      issuer: IDP_ISSUER,
      audience: CLIENT_ID,
    }) as IdTokenClaims;
  } catch {
    throw new Error('invalid ID token');
  }
  if (!decoded.nonce || decoded.nonce !== expectedNonce) {
    throw new Error('ID token nonce mismatch');
  }
  return decoded;
}

/**
 * OIDC discovery document, served at
 * /idp/.well-known/openid-configuration for realism and to demonstrate the
 * document the production path would fetch. `token_endpoint` is advertised for
 * shape only — redemption actually happens in-process (see exchange()).
 */
export function discoveryDocument(baseUrl: string) {
  return {
    issuer: IDP_ISSUER,
    authorization_endpoint: `${baseUrl}/api/auth/oidc/idp/authorize`,
    token_endpoint: `${baseUrl}/api/auth/oidc/idp/token`,
    jwks_uri: `${baseUrl}/api/auth/oidc/idp/jwks.json`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    scopes_supported: ['openid', 'email'],
    claims_supported: ['sub', 'email', 'email_verified', 'nonce', 'iss', 'aud', 'exp', 'iat'],
    code_challenge_methods_supported: ['S256'],
  };
}
