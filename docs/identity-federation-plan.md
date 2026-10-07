# Identity Federation + RS256/JWKS — Plan

Status: **foundation delivered; full federation pending an IdP decision.**

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

This proves the production verification path works; it is not yet wired into the
login flow because there is no IdP to verify against in the POC environment
(ScotAccount / One Login are not reachable here, and the plan deliberately kept
HS256 for the self-contained demo).

## Decision required before completing it

1. **Which IdP** — ScotAccount (SAML 2.0 / OIDC) or GOV.UK One Login (OIDC). This
   drives the protocol and the claim set.
2. **POC vs real** — stand up a mock OIDC provider for the demo (the
   `services/identity-service` mock-federation routes are the natural home), or
   integrate the real provider's sandbox.

## Plan to complete (OIDC assumed)

1. **Discovery + JWKS**: fetch the provider's OIDC discovery document and JWKS;
   cache keys with rotation (a `jwks-rsa`-style client, or periodic refresh of
   `buildJwks` inputs). Resolve the signing key per token `kid`.
2. **Authorization-code flow**: add `/api/auth/oidc/start` (redirect to the IdP
   with PKCE + state/nonce) and `/api/auth/oidc/callback` (exchange code →
   verify the ID token with `verifyRs256` against the resolved JWKS key →
   establish the session). Keep the existing HS256 session token for internal
   calls, or switch internal verification to RS256 behind a flag.
3. **Claim mapping**: map the IdP subject + claims to the local user (`userId`,
   `email`, `role`, `roleLevel`, `permissions`), provisioning on first login.
4. **MFA**: delegate the second factor to the IdP (`acr`/`amr` claims) and drop
   the seeded demo TOTP for federated accounts; keep server TOTP only for any
   remaining local accounts.
5. **Applicant identity**: once applicants authenticate via the IdP, extend
   ownership enforcement to the write-intake routes (`POST`/`PUT`/submit),
   retiring the anonymous capability-token read-back added as the interim
   closure (see GAP-005). This fully closes the applicant IDOR.
6. **RS256 cutover**: set `JWT_PRIVATE_KEY`/public key (or point at the IdP JWKS)
   and switch `verifyToken` call sites to RS256 where tokens originate at the IdP.
7. **Tests**: mock-IdP sign + API verify end-to-end; callback state/nonce/PKCE
   validation; key-rotation handling; rejection of tokens from an unknown `kid`.

## .NET parity

The .NET service must verify the same tokens. `Microsoft.AspNetCore.Authentication.JwtBearer`
supports JWKS/OIDC authority configuration directly; see `docs/dotnet-auth-parity.md`.
