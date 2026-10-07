# Identity Federation + RS256/JWKS — Plan

Status: **RS256/JWKS foundation + a working mock OIDC flow delivered; real-IdP
cutover pending an IdP decision.**

Phase 1 gave the deployed API trustworthy identity using **HS256** with a single
injected secret, because one service both mints and verifies — the right choice
for a POC with no external IdP. GAP-007's production target is to delegate
authentication to a real Scottish Government identity provider and verify its
**asymmetrically-signed (RS256)** tokens against the provider's published
**JWKS**, holding no signing key locally. This document records what is built and
what remains.

## Delivered now (the verification foundation)

`@aib-iaas/auth` gained an RS256/JWKS capability, opt-in and separate from the
HS256 default so nothing in the live flow changes:

- `generateRsaKeyPair()` — 2048-bit RSA keypair in PEM (stands in for the IdP's
  keys in the POC; in production the public half comes from the IdP's JWKS).
- `signRs256(claims, privateKey, opts)` — the IdP's signing role.
- `verifyRs256(token, publicKey)` — the API's verification role, with the same
  guarantees as HS256 `verifyToken`: pinned algorithm, issuer, audience and a
  mandatory numeric `exp`.
- `publicKeyToJwk()` / `buildJwks()` — export a public key as the JWK/JWKS a
  provider publishes at `/.well-known/jwks.json`.
- Tested (`packages/auth/src/__tests__/rs256.test.ts`): sign/verify round-trip,
  JWKS shape, rejection of a token signed by a different key, expiry, garbage.

This proves the production verification path works. There is no external IdP to
verify against in this environment (ScotAccount / One Login are not reachable
here), so the flow below runs against a self-contained mock provider rather than
leaving the capability unused.

## Delivered now (the mock OIDC flow, modelling GOV.UK One Login)

A working OIDC **authorization-code + PKCE** flow, end-to-end, with both the mock
provider and the client living in the **gateway** (`services/api-gateway/src/oidc/`):

- `mockIdp.ts` — the provider: a per-process `generateRsaKeyPair()`, a signed
  authorization code bound to the PKCE challenge + nonce, an **RS256 ID token**
  carrying the IdP's own `iss`/`aud`, `verifyIdToken` (RS256 against the mock
  public key + nonce), a `getJwks()` (reusing `buildJwks`) and a discovery
  document. `jsonwebtoken` is used directly for the ID token because its
  `iss`/`aud` are the IdP's, not the app's — `verifyRs256` pins the app pair by
  design and so is not reused for it.
- `router.ts` — the client, mounted at `/api/auth/oidc`:
  - `GET /start` → builds a signed, short-TTL **state** token (PKCE
    `code_verifier`, `nonce`, validated `redirect`) and 302s to the mock
    authorize with the S256 `code_challenge`.
  - `GET /idp/authorize` → auto-approves a fixed demo subject (an account picker
    is a future enhancement) and 302s back with a signed code.
  - `GET /callback` → verifies state, **redeems the code in-process** (PKCE +
    RS256 ID-token verification), resolves the local user from the `email` claim,
    and mints the **same HS256 session the password path mints**
    (`buildClaims` → `signToken` → `recordSession`), handing it to the frontend
    in the URL fragment. Downstream middleware is therefore unchanged — an OIDC
    login is indistinguishable from a password login once complete.
  - `GET /idp/jwks.json` + `GET /idp/.well-known/openid-configuration` — the
    IdP's published key and discovery, for realism and to demonstrate what the
    production path would fetch.

Design notes: the token exchange + ID-token verification run **in-process**
(robust in the single deployed container, no self-HTTP, while still exercising
asymmetric RS256 + a real JWKS endpoint); the signed state token keeps the
handshake stateless (works on Render free / multiple instances); the post-login
`redirect` is origin-checked against the CORS allow-list to prevent an open
redirect. The demo subject maps to the inline-seeded Case Officer
(`demo@example.com` → role-officer / `aib_officer`), which is present in every
database — the in-memory test DB and the deployed disk alike — so the flow is
deterministic in both. The login page carries a *"Sign in with GOV.UK One Login"*
button (its own `data-demo`, deliberately **not** referenced by the scripted
demo, which drives the password + MFA path), and `apps/web/src/app/auth/callback`
is the fragment hand-off page. Tested in
`services/api-gateway/src/__tests__/oidc.test.ts`: full-flow session mint, plus
tampered-state (400), forged-code (401), open-redirect (400) and JWKS (200).

## Decision required before the real-IdP cutover

1. **Which IdP** — ScotAccount (SAML 2.0 / OIDC) or GOV.UK One Login (OIDC). This
   drives the protocol and the claim set. (The mock models **One Login / OIDC**.)
2. **Sandbox access** — real client credentials + registered redirect URIs for
   the chosen provider's sandbox.

## Plan to complete (OIDC — swapping the mock for the real IdP)

The mock already demonstrates the full authorization-code + PKCE handshake,
RS256 ID-token verification, a JWKS endpoint and claim→user mapping. Completing
federation is largely swapping the in-process mock for the real provider:

1. **Discovery + JWKS**: fetch the provider's OIDC discovery document and JWKS
   (replacing `mockIdp.discoveryDocument` / `getJwks`); cache keys with rotation
   (a `jwks-rsa`-style client, or periodic refresh of `buildJwks` inputs) and
   resolve the signing key per token `kid`. The current flow regenerates one
   per-process key and does not key on `kid` because it is both IdP and client.
2. **Real back-channel**: replace the in-process `mockIdp.exchange` with a real
   HTTPS POST to the provider's `token_endpoint`, and verify the returned ID
   token with `verifyRs256` against the resolved JWKS key (the `iss`/`aud` then
   become the real provider's). `/start`, the signed state, PKCE and `/callback`
   session-minting are unchanged.
3. **Claim mapping**: the mock maps a fixed subject to one seeded user;
   generalise to map the real IdP subject + claims to the local user, and
   **provision on first login** (currently it only resolves an existing account).
4. **MFA**: delegate the second factor to the IdP (`acr`/`amr` claims) and drop
   the seeded demo TOTP for federated accounts; keep server TOTP only for any
   remaining local accounts.
5. **Account picker**: the mock authorize auto-approves one subject; the real IdP
   presents its own login UI, so this disappears for real accounts (a local
   picker is only needed if the mock is kept for demos).
6. **Applicant identity**: once applicants authenticate via the IdP, extend
   ownership enforcement to the write-intake routes (`POST`/`PUT`/submit),
   retiring the anonymous capability-token read-back added as the interim
   closure (see GAP-005). This fully closes the applicant IDOR.
7. **RS256 session cutover (optional)**: the app session stays HS256 after the
   OIDC callback so nothing downstream changes; optionally switch internal
   verification to RS256 behind a flag where tokens originate at the IdP.
8. **Tests**: real-sandbox sign + API verify end-to-end; key-rotation handling;
   rejection of tokens from an unknown `kid`. (Mock state/nonce/PKCE/forged-code
   validation is already covered by `oidc.test.ts`.)

## .NET parity

The .NET service must verify the same tokens. `Microsoft.AspNetCore.Authentication.JwtBearer`
supports JWKS/OIDC authority configuration directly; see `docs/dotnet-auth-parity.md`.
