/**
 * GOV.UK One Login (OIDC) federation — client flow, mounted at /api/auth/oidc.
 *
 * A working OIDC authorization-code + PKCE flow against the self-contained mock
 * IdP in ./mockIdp.ts. The whole design is ADDITIVE and ends by minting the
 * SAME HS256 app session the password path mints (buildClaims → signToken →
 * recordSession), so every downstream middleware/handler is unchanged — an OIDC
 * login is indistinguishable from a password login after the fact.
 *
 * Flow (see docs/identity-federation-plan.md):
 *   GET /start           → 302 to /idp/authorize with PKCE S256 + state + nonce
 *   GET /idp/authorize   → auto-approve demo subject, 302 to /callback?code&state
 *   GET /callback        → verify state, redeem code in-process (PKCE + RS256 ID
 *                          token), resolve local user, mint HS256 session, 302
 *                          to the frontend redirect with #token=…&user=…
 *   GET /idp/jwks.json                           → the IdP's public JWKS
 *   GET /idp/.well-known/openid-configuration    → discovery document
 *
 * The browser-facing hops (/start, /idp/authorize, /callback) are real HTTP
 * redirects; the token exchange + ID-token verification run in-process, so the
 * flow is robust in the single deployed container with no self-HTTP. The state
 * token is a signed, short-TTL HS256 JWT carrying the PKCE verifier, nonce and
 * validated redirect, so the handshake is stateless (no server-side session
 * store — works on Render free / multiple instances).
 */

import { Router, Request, Response } from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import { signToken, verifyToken, buildClaims } from '@aib-iaas/auth';
import type { UserWithRole } from '@aib-iaas/database';
import { users } from '../db';
import { recordSession } from '../middleware/sessionStore';
import * as mockIdp from './mockIdp';

export const oidcRouter = Router();

// Matches the password path's access-token lifetime (auth.ts).
const ACCESS_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
// The state only has to survive the user's round trip through the IdP.
const STATE_TTL_SECONDS = 5 * 60;
// The client's registered redirect_uri — the back-channel callback below. Kept
// as a relative path so every internal hop is a same-origin relative redirect
// and the router never needs to know its own absolute base URL.
const CLIENT_CALLBACK_PATH = '/api/auth/oidc/callback';

/**
 * Origins a post-login redirect may target. Reuses CORS_ORIGIN (same posture as
 * the deployed CORS config), defaulting to the known Pages origin + localhost.
 * An open-redirect guard: without it, /start?redirect=https://evil could bounce
 * a freshly minted session token to an attacker.
 */
function allowedRedirectOrigins(): string[] {
  return process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
    : ['https://macleoda-leidos.github.io', 'http://localhost:3000', 'http://localhost:3010'];
}

function isAllowedRedirect(target: string): boolean {
  try {
    return allowedRedirectOrigins().includes(new URL(target).origin);
  } catch {
    return false;
  }
}

/**
 * Mint the app session exactly as routes/auth.ts issueAccessToken does: same
 * claims, same jti, same recorded session — so the OIDC callback and the
 * password login produce byte-for-byte equivalent tokens.
 */
function issueAppSession(userWithRole: UserWithRole): { token: string; permissions: string[] } {
  const permissions = users.getPermissionsForRole(userWithRole.roleId).map(p => p.code);
  const jti = randomUUID();
  const token = signToken(
    buildClaims(
      {
        id: userWithRole.id,
        email: userWithRole.email,
        roleName: userWithRole.roleName,
        roleLevel: userWithRole.roleLevel,
        organisationId: userWithRole.organisationId,
      },
      permissions,
      jti
    )
  );
  recordSession(jti, userWithRole.id, new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString());
  return { token, permissions };
}

/** Same user payload shape the password path returns (routes/auth.ts). */
function userPayload(userWithRole: UserWithRole, permissions: string[]) {
  return {
    id: userWithRole.id,
    email: userWithRole.email,
    name: userWithRole.displayName || `${userWithRole.firstName} ${userWithRole.lastName}`,
    role: userWithRole.roleName,
    roleDisplayName: userWithRole.roleDisplayName,
    organisationId: userWithRole.organisationId,
    permissions,
  };
}

interface OidcState {
  purpose?: string;
  codeVerifier: string;
  nonce: string;
  redirect: string;
}

// ─── 1. Begin the flow ─────────────────────────
oidcRouter.get('/start', (req: Request, res: Response) => {
  const redirect = String(req.query.redirect ?? '');
  if (!redirect || !isAllowedRedirect(redirect)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_REDIRECT', message: 'redirect is missing or not an allowed origin.' },
    });
    return;
  }

  // PKCE: a high-entropy verifier kept only inside the signed state; its S256
  // challenge is all the IdP ever sees.
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = mockIdp.codeChallengeFor(codeVerifier);
  const nonce = randomBytes(16).toString('base64url');

  const state = signToken(
    { purpose: 'oidc_state', codeVerifier, nonce, redirect } satisfies OidcState,
    { expiresInSeconds: STATE_TTL_SECONDS }
  );

  const params = new URLSearchParams({
    response_type: 'code',
    scope: 'openid email',
    client_id: mockIdp.CLIENT_ID,
    redirect_uri: CLIENT_CALLBACK_PATH,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    nonce,
  });
  res.redirect(`/api/auth/oidc/idp/authorize?${params.toString()}`);
});

// ─── 2. Mock IdP authorize endpoint ────────────
// The browser lands here as if at GOV.UK One Login. We auto-approve the fixed
// demo subject (an account picker is a future enhancement) and bounce back to
// the client callback with a signed code.
oidcRouter.get('/idp/authorize', (req: Request, res: Response) => {
  const q = req.query as Record<string, string | undefined>;
  if (
    q.client_id !== mockIdp.CLIENT_ID ||
    q.redirect_uri !== CLIENT_CALLBACK_PATH ||
    !q.code_challenge ||
    q.code_challenge_method !== 'S256' ||
    !q.state ||
    !q.nonce
  ) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_AUTHORIZE_REQUEST', message: 'Malformed OIDC authorize request.' },
    });
    return;
  }

  const code = mockIdp.authorizeRedirectCode(mockIdp.DEMO_SUBJECT, q.nonce, q.code_challenge);
  const params = new URLSearchParams({ code, state: q.state });
  res.redirect(`${q.redirect_uri}?${params.toString()}`);
});

// ─── 3. Client callback (back-channel + session) ─
oidcRouter.get('/callback', (req: Request, res: Response) => {
  const code = String(req.query.code ?? '');
  const state = String(req.query.state ?? '');

  // (a) State is our own signed HS256 token: tamper / expiry / wrong purpose → 400.
  let st: OidcState;
  try {
    st = verifyToken<OidcState>(state);
  } catch {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'OIDC state is invalid or expired.' } });
    return;
  }
  if (st.purpose !== 'oidc_state' || !isAllowedRedirect(st.redirect)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'OIDC state is invalid.' } });
    return;
  }

  // (b) Redeem the code in-process: PKCE binding + RS256 ID-token verification.
  // A forged code (wrong signature), a PKCE mismatch or a bad ID token → 401.
  let email: string;
  try {
    const idToken = mockIdp.exchange(code, st.codeVerifier);
    const claims = mockIdp.verifyIdToken(idToken, st.nonce);
    email = String(claims.email ?? '');
  } catch {
    res.status(401).json({ success: false, error: { code: 'OIDC_EXCHANGE_FAILED', message: 'Authorization code could not be verified.' } });
    return;
  }

  // (c) Resolve the local user from the verified email claim. The fixed demo
  // subject maps to a seeded staff account; provisioning on first login is a
  // documented future step (identity-federation-plan.md).
  const user = email ? users.findByEmail(email) : null;
  const userWithRole = user ? users.findByIdWithRole(user.id) : null;
  if (!userWithRole || userWithRole.status !== 'active') {
    res.status(401).json({ success: false, error: { code: 'OIDC_NO_LOCAL_USER', message: 'Federated identity has no active local account.' } });
    return;
  }

  // (d) Mint the SAME HS256 app session the password path mints, and hand it to
  // the frontend in the URL fragment (never the query string — a fragment is not
  // sent to any server and stays out of access logs).
  const { token, permissions } = issueAppSession(userWithRole);
  const payload = encodeURIComponent(JSON.stringify(userPayload(userWithRole, permissions)));
  res.redirect(`${st.redirect}#token=${encodeURIComponent(token)}&user=${payload}`);
});

// ─── 4. Realism endpoints (the IdP's published keys + discovery) ─
oidcRouter.get('/idp/jwks.json', (_req: Request, res: Response) => {
  res.json(mockIdp.getJwks());
});

oidcRouter.get('/idp/.well-known/openid-configuration', (req: Request, res: Response) => {
  res.json(mockIdp.discoveryDocument(`${req.protocol}://${req.get('host')}`));
});
