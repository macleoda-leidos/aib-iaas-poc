# Security Hardening Log

## Document Control

| Field | Value |
|-------|-------|
| Document Title | Security Remediation and Hardening Log |
| Version | 1.0 |
| Date | August 2026 |
| Classification | OFFICIAL |
| Related Documents | ITHC Scope (docs/ithc-scope.md), Security Architecture (docs/security.md) |

## Overview

This document tracks security vulnerabilities identified during the ITHC penetration test and internal security review, along with their remediation status. All findings are from the web application penetration test conducted against the IAAS consolidated API and frontend portal.

## Findings Register

| ID | Finding | Severity | CVSS | Status | Remediation | Date Fixed |
|----|---------|----------|------|--------|-------------|------------|
| VUL-001 | Missing Content Security Policy | Medium | 5.3 | Remediated | Shared Helmet `securityHeaders()` middleware applies a strict JSON-API CSP (`default-src 'none'; frame-ancestors 'none'`) on both the deployed consolidated-api and the standalone gateway. (Correction: this was previously logged as fixed in Sprint 17, but the deployed service in fact ran `helmet({ contentSecurityPolicy: false })` until this date — see §"External HTTP Header Scan Remediation" below.) | 1 Oct 2026 |
| VUL-002 | Rate limit bypass via header manipulation | Medium | 5.9 | Remediated | Rate limiting now applies per IP address AND per authenticated token. X-Forwarded-For header is validated against trusted proxy list. Implemented express-rate-limit with sliding window algorithm. | Sprint 17 |
| VUL-003 | Verbose error messages exposing stack traces | Low | 3.1 | Remediated | Error handling middleware checks NODE_ENV. In production, generic error messages are returned without stack traces, file paths, or internal details. Full details logged server-side only. | Sprint 16 |
| VUL-004 | Missing X-Content-Type-Options header | Low | 2.4 | Remediated | Helmet.js noSniff() middleware enabled, setting X-Content-Type-Options: nosniff on all responses. Prevents MIME type sniffing attacks. | Sprint 16 |
| VUL-005 | Session not fully invalidated on logout | Medium | 5.5 | Remediated | Logout endpoint now clears all tokens (access, refresh, session), invalidates server-side session record, and sets token expiry to immediate. Client-side storage (localStorage, sessionStorage, cookies) all cleared. | Sprint 18 |
| VUL-006 | File upload lacks content validation | Medium | 6.1 | Remediated | File upload validates MIME type against allowlist (PDF, PNG, JPG, DOCX only), checks magic bytes match declared type, enforces 10MB size limit, and sanitises filenames. Uploaded files stored outside web root. | Sprint 17 |
| VUL-007 | No request body size limit | Medium | 5.3 | Remediated | Express.js body parser configured with explicit limits: `express.json({ limit: '10mb' })` and `express.urlencoded({ limit: '10mb', extended: true })`. Prevents memory exhaustion from oversized payloads. | Sprint 16 |
| VUL-008 | CORS allows broad origins in development config | Low | 3.4 | Remediated | Production CORS configuration restricts allowed origins to specific domains (GitHub Pages URL, admin portal URL). Wildcard origin only permitted in development environment. | Sprint 17 |
| VUL-009 | Missing Referrer-Policy header | Low | 2.1 | Remediated | Helmet.js referrerPolicy() set to 'strict-origin-when-cross-origin'. Prevents leakage of URL paths to external sites. | Sprint 16 |
| VUL-010 | Missing HSTS (HTTP Strict Transport Security) | Medium | 5.0 | Remediated | Render.com enforces HSTS automatically on all deployed services with includeSubDomains and a 1-year max-age. Verified via response header inspection. | N/A (Platform) |

## Summary

| Severity | Total | Remediated | Outstanding |
|----------|-------|------------|-------------|
| Critical | 0 | 0 | 0 |
| High | 0 | 0 | 0 |
| Medium | 6 | 6 | 0 |
| Low | 4 | 4 | 0 |
| **Total** | **10** | **10** | **0** |

## Security Posture Assessment

**Overall Status: GREEN**

All identified vulnerabilities have been remediated. No critical or high severity findings were identified during the assessment, indicating a strong baseline security posture for a POC-phase application. The defence-in-depth approach (Helmet.js headers, rate limiting, input validation, error handling, CORS restrictions) provides multiple layers of protection.

## Remediation Approach

Findings were addressed using the following priority order:

1. **Medium severity findings** — addressed within the same sprint as discovery or the immediately following sprint
2. **Low severity findings** — batched and addressed in security-focused sprints
3. **Platform-provided controls** — validated that hosting platform (Render.com) provides certain controls automatically (HSTS, TLS enforcement)

## Verification

Each remediation was verified through:

- Manual testing to confirm the vulnerability is no longer exploitable
- Automated security header scanning (securityheaders.com)
- Review of relevant middleware configuration in source code
- Regression testing to ensure fixes do not break functionality

## Ongoing Security Controls

Beyond vulnerability remediation, the following security controls are maintained:

- **Dependency scanning**: npm audit runs in CI pipeline, blocking deployment on high/critical vulnerabilities
- **Input validation**: All API inputs validated via Zod schemas before processing
- **Audit logging**: All authentication events and data access logged to audit service
- **Principle of least privilege**: RBAC middleware enforces role-based access on all protected endpoints
- **Secure defaults**: New endpoints inherit security middleware (rate limiting, validation, authentication) by default

## External HTTP Header Scan Remediation (1 October 2026)

An external HTTP header scanner run against the public demo URL
(`https://macleoda-leidos.github.io/aib-iaas-poc/`) scored it **16/100**, dominated by
host-layer findings. The full analysis, per-finding disposition and the honest explanation of
what GitHub Pages can and cannot do are recorded in `docs/security-scan-report.md`
§"External HTTP Header & DNS Scan". Summary of what changed in the code:

| Change | Where |
|--------|-------|
| Shared `securityHeaders()` Helmet middleware: strict JSON-API CSP, HSTS (1yr, includeSubDomains, preload), nosniff, X-Frame-Options DENY, Referrer-Policy no-referrer, Permissions-Policy, COOP, CORP (`cross-origin`); `X-Powered-By` disabled | `services/api-gateway/src/middleware/securityHeaders.ts`, applied in `consolidated-api` and `api-gateway` |
| Best-effort `<meta>` CSP (production only) + referrer policy on the static frontend | `apps/web/src/app/layout.tsx` |
| `/.well-known/security.txt` (RFC 9116) published | `apps/web/public/.well-known/security.txt` |
| Full header set staged for a header-capable host | `apps/web/public/_headers`, `apps/web/public/staticwebapp.config.json`, `apps/web/next.config.js` |
| Regression tests | `services/api-gateway/src/__tests__/security-headers.test.ts`, `apps/web/src/__tests__/security-config.test.ts` |

**Honesty note.** The frontend remains hosted on GitHub Pages by choice; several findings
(CORS wildcard, `Server:` banner, SPF/DMARC/DNSSEC) are properties of that host and its shared
domain and cannot be remediated without moving to a header-capable host and a controlled domain.
This is documented rather than silently claimed as fixed, consistent with
`docs/security-known-gaps.md`.

## Phase 1 — Security Backbone (October 2026)

The internal static review recorded in `docs/security-known-gaps.md` and `docs/SECURITY_REVIEW.md`
found that the *deployed* artefact (`services/consolidated-api`) had no trustworthy identity and
no access control: unsigned base64 tokens, password-free login, client-side-only "MFA", and no
authentication or authorisation on any route. Phase 1 implements the backbone in the mandated
order (identity first). It is a POC closure using an HS256 shared secret; real IdP federation
(ScotAccount / GOV.UK One Login) and RS256/JWKS remain the production target.

| Change | Where | Closes |
|--------|-------|--------|
| New trust-root package: HS256 sign/verify (pinned alg + iss + aud + **mandatory numeric `exp`**), bcrypt(12) hash/verify, otplib TOTP, one `buildClaims` payload shape, `getJwtSecret()` that refuses the dev secret under `NODE_ENV=production` | `packages/auth` (`@aib-iaas/auth`) | GAP-001, L3 |
| Signed tokens minted and verified everywhere; base64 mint/decode removed; the `payload.exp && …` never-expiry hole deleted | `services/*/routes/auth.ts`, `services/api-gateway/src/middleware/rbac.ts` | GAP-001 |
| Real password verification (bcrypt, generic 401 + timing-equalised reject, no default-to-success); seed accounts carry a real `bcrypt('demo')` hash | both login handlers, `packages/database/src/{schema,seed,pg-seed}.ts` | GAP-003 |
| Server-side MFA: MFA accounts receive no access token at login, only a short-lived signed challenge; `POST /verify-mfa` checks a real TOTP before issuing a token (fixes the token-before-MFA flow). Demo accounts seeded with a fixed, documented demo TOTP secret; the login page computes a live code so the scripted demo passes real verification | both auth routers, `apps/web/src/app/login/page.tsx`, `apps/web/src/lib/totp.ts` | GAP-007 (POC MFA; federation still target) |
| Default-deny on the deployed surface: a global authenticate gate with a small public allow-list (health, login/verify-mfa, anonymous applicant-intake), plus per-resource `requirePermission`/`requirePermissionByMethod` on the staff/admin mounts; mirrored in the standalone gateway so the two cannot drift | `services/api-gateway/src/middleware/accessPolicy.ts`, `services/consolidated-api/src/index.ts`, `services/api-gateway/src/index.ts` | GAP-002 |
| `documents.*` and `credit_check.*` modelled as permissions and granted to roles | `packages/database/src/seed-data/{permissions,role-permissions}.json` | GAP-011 residual #1 |
| Application ownership (`owner_user_id`): debtors read/mutate only their own records (404 on mismatch); list filtered by owner; approve/reject gated by `applications.approve`/`.reject`; actor derived from the token, never a literal | `services/api-gateway/src/routes/applications.ts`, `packages/database/src/repositories/applications.ts` | GAP-005 |
| Audit ingestion authenticated; actor derived from the verified token (body actor fields ignored); server timestamp + source IP recorded; reads require `audit.read` | `services/audit-service/src/routes/audit.ts` | GAP-006 |
| Strict auth rate limiter (~5/15 min, per IP+email) on login + verify-mfa, separate from the global limiter, with a lockout audit event | `services/api-gateway/src/middleware/authRateLimit.ts`, wired in `consolidated-api` | GAP-008 |
| Real session revocation: a `jti` in every token, stored in `sessions`; `authenticate` rejects a revoked jti; logout deletes the session | `services/api-gateway/src/middleware/sessionStore.ts`, both auth routers, `rbac.ts` | GAP-010 |
| Fail-closed malware scanning: status computed from both `scanned` and `infected` (never `clean` when `!scanned`); download withheld (409) unless clean; `auto` no longer silently falls back to the placeholder; placeholder refused under production; placeholder detection is content-based | `services/document-service/src/{scanner/index,scanner/placeholder,routes/documents}.ts` | GAP-004 |
| Validation package wired live: a `validate()` middleware (`.strict()`, 400 with field errors) applied to login, verify-mfa, audit ingestion and application notes | `packages/validation` + the routers above | GAP-009 |
| Error-message leakage gated on `NODE_ENV` in the consolidated handler and the application/audit handlers | `services/consolidated-api/src/index.ts`, `applications.ts`, `audit.ts` | L2 |
| `multer` bumped `^1.4.5-lts.1` → `^2.0.1` | `document-service`, `consolidated-api` | M4 |
| Dev credentials (Keycloak admin, Postgres) externalised to overridable env with local defaults | `infra/docker/docker-compose.yml` | L4 |
| `JWT_SECRET` added as a `sync: false` secret and documented | `render.yaml`, `.env.example` | — |

**Idempotent migrations.** `mfa_secret` (users) and `owner_user_id` (applications) are added to
existing persistent volumes by a guarded `ALTER TABLE` inside `initializeSchema` (SQLite) and
`ADD COLUMN IF NOT EXISTS` (PostgreSQL), because the deployed Render disk is persistent and
`CREATE TABLE IF NOT EXISTS` never alters an existing table.

**Verification.** Node is not installed on the authoring host, so the suite and type-check are
proven in CI / by the user: `npm install` (resolves the new dependencies and the `@aib-iaas/auth`
workspace), `npx vitest run`, `npx tsc -b`, an image build + boot smoke test (public `/api/health`
200, unauthenticated `GET /api/users` now **401**, login → `mfaRequired`/token, `/verify-mfa` with
a live TOTP, then an authorised staff call), and an end-to-end run of the scripted demo
(login → MFA → approve). Test counts are intentionally not restated here; CI reports them.
