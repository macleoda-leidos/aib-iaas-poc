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
 *                          (?select=1 opts into the account picker)
 *   GET /idp/authorize   → approve the selected subject (default: Case Officer),
 *                          or show the account picker when prompt=select_account;
 *                          302 to /callback?code&state
 *   GET /callback        → verify state, redeem code in-process (PKCE + RS256 ID
 *                          token), resolve-or-provision local user, mint HS256
 *                          session, 302 to the frontend redirect with #token=…&user=…
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

/**
 * Provision a local account for an IdP-asserted identity on first login. The IdP
 * has already verified the email, so an unseen one is a new citizen rather than an
 * error: create a low-privilege applicant/debtor account (active) so they can
 * proceed. Real-IdP claim mapping would enrich name/claims from the ID token; the
 * POC derives a display name from the email local-part. Returns null only if the
 * debtor role is somehow absent (it is always seeded).
 */
function provisionFederatedUser(email: string) {
  const role = users.findRoleByName('debtor');
  if (!role) return null;
  const local = email.split('@')[0] || 'citizen';
  const firstName = local.charAt(0).toUpperCase() + local.slice(1);
  return users.create({
    email,
    firstName,
    lastName: 'Federated',
    roleId: role.id,
    status: 'active',
  });
}

/** Minimal HTML escape for the static picker labels (defence in depth). */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

/**
 * The mock account picker, modelling the GOV.UK One Login account-selection screen.
 * Each option re-enters /idp/authorize carrying the SAME OIDC parameters plus the
 * chosen `sub`, so selecting one continues the exact same handshake.
 */
function renderPicker(q: Record<string, string | undefined>): string {
  const base = new URLSearchParams({
    response_type: 'code',
    scope: 'openid email',
    client_id: q.client_id!,
    redirect_uri: q.redirect_uri!,
    code_challenge: q.code_challenge!,
    code_challenge_method: 'S256',
    state: q.state!,
    nonce: q.nonce!,
  });
  const items = mockIdp.DEMO_SUBJECTS.map(s => {
    const p = new URLSearchParams(base);
    p.set('sub', s.sub);
    return `<li><a href="/api/auth/oidc/idp/authorize?${p.toString()}">${escapeHtml(s.label)}</a></li>`;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Mock GOV.UK One Login — choose account</title></head>`
    + `<body><h1>Mock GOV.UK One Login</h1>`
    + `<p>POC mock of the One Login account picker. Choose a demo identity to continue.</p>`
    + `<ul>${items}</ul></body></html>`;
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
  // Opt-in account picker for interactive demos (e.g. the "Sign in with GOV.UK One
  // Login" button via ?select=1). Omitted by default so programmatic clients and
  // oidc.test.ts get the deterministic Case Officer auto-approve.
  if (String(req.query.select ?? '') === '1') params.set('prompt', 'select_account');
  res.redirect(`/api/auth/oidc/idp/authorize?${params.toString()}`);
});

// ─── 2. Mock IdP authorize endpoint ────────────
// The browser lands here as if at GOV.UK One Login. With an explicit
// prompt=select_account (and no subject yet) we present a minimal account picker;
// otherwise we approve the selected subject — defaulting to the Case Officer — and
// bounce back to the client callback with a signed code bound to that identity.
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

  // Account picker — only when explicitly requested and no subject chosen yet, so
  // the default handshake (and oidc.test.ts, which sets neither) is unchanged.
  if (q.prompt === 'select_account' && !q.sub) {
    res.set('Content-Type', 'text/html; charset=utf-8').send(renderPicker(q));
    return;
  }

  // Resolve the selected identity. No selection → the Case Officer (the default);
  // an unknown sub is rejected rather than silently defaulted.
  const chosen = mockIdp.findDemoSubject(q.sub || mockIdp.DEMO_SUBJECT);
  if (!chosen) {
    res.status(400).json({
      success: false,
      error: { code: 'UNKNOWN_SUBJECT', message: 'Unknown account selection.' },
    });
    return;
  }

  const code = mockIdp.authorizeRedirectCode(chosen.sub, q.nonce, q.code_challenge, chosen.email);
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

  // (c) Resolve the local user from the verified email claim. A seeded identity
  // maps to its existing account; an unseen (IdP-verified) email is provisioned a
  // low-privilege applicant/debtor account on first login, rather than being
  // rejected — the identity-federation "provision on first login" step.
  let user = email ? users.findByEmail(email) : null;
  if (!user && email) {
    user = provisionFederatedUser(email);
  }
  const userWithRole = user ? users.findByIdWithRole(user.id) : null;
  if (!userWithRole || userWithRole.status !== 'active') {
    // Reached only when the email claim was empty or provisioning failed.
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
