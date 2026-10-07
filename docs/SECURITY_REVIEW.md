# Security Review — Consolidated Findings (Phase 0)

## AiB IAAS — Initial Application Advice Service

| Field | Value |
|-------|-------|
| Document type | Consolidated security review (code-grounded) |
| Review date | 1 October 2026 |
| Method | Manual source reading, whole-repository, against the **deployed** artefact |
| Deployed artefact | `services/consolidated-api` (per `render.yaml:6-9`, built from `infra/azure/Dockerfile.api`) |
| Status | CURRENT |
| Relationship | **Extends — does not duplicate — `docs/security-known-gaps.md`** (the authoritative GAP‑001..011 register). This document consolidates the findings into one severity-ordered view, maps each to its Phase‑1 remediation item, and adds six new findings (M3, M4, M5, L2, L3, L4) recommended as GAP‑012..017. |

> **No real personal data is exposed by any finding.** The POC operates on synthetic seed
> data only. Findings describe the distance between a demonstration build and a service that
> could hold OFFICIAL‑SENSITIVE data — not defects in a live service.

---

## 1. Line-number currency note

The existing `security-known-gaps.md` and `ithc-penetration-test-report.md` cite
`consolidated-api/src/index.ts` anchors that are ~20 lines stale (the file grew when the
100‑application seed block was added). **Current, re-confirmed anchors** (use these):

| Thing | Current line |
|---|---|
| Router mounts (all unauthenticated) | **279–308** (register says 259–288) |
| `helmet({ contentSecurityPolicy: false })` | **63** — *now remediated, see M3* |
| CORS allow-list | 78–84 |
| `trust proxy` | 91 |
| Global rate limiter | 93–118 |
| Audit router mount | 290 |

---

## 2. Consolidated findings register (severity-ordered)

| ID | Finding | Sev | Primary evidence (file:line) | GAP | Phase‑1 item | Status |
|----|---------|-----|------------------------------|-----|--------------|--------|
| **C1** | Auth tokens are unsigned base64 JSON — forgeable | Critical | `user-service/src/routes/auth.ts:37-46` (mint); `api-gateway/src/middleware/rbac.ts:31-49` (trust verbatim) | GAP‑001 | **1a** | Remediated (Phase 1) |
| **C2** | Deployed service applies no auth/authorisation to any route | Critical | `consolidated-api/src/index.ts:279-308` (no middleware); only enforced route is undeployed `api-gateway/src/index.ts:51` | GAP‑002 | **1d** | Remediated (Phase 1) |
| **C3** | Login accepts any password; never verified | Critical | `user-service/src/routes/auth.ts:18-22`; `api-gateway/src/routes/auth.ts:26-27` | GAP‑003 | **1b, 1c** | Remediated (Phase 1) |
| **H1** | IDOR / broken object-level authz incl. approve/reject | High | `api-gateway/src/routes/applications.ts` GET `:140`, PUT `:157`, submit `:202`, **PATCH `/:id/status` `:232`**, notes `:309` | GAP‑005 | **1d, 1e** | Remediated (Phase 1) |
| **H2** | Malware scan fail-open, filename-based, off the upload path | High | upload `document-service/src/routes/documents.ts:43-68` (no scan); `scanner/index.ts:43-46`; `scanner/placeholder.ts:32`; `scanner/clamav.ts:152-178`; branch `documents.ts:118` | GAP‑004 | **1i** | Remediated (Phase 1) |
| **H3** | Audit events unauthenticated + attacker-attributable (writes AND reads) | High | `audit-service/src/routes/audit.ts:9` (actor from body), mount `consolidated-api/src/index.ts:290`; reads `:27-56` open | GAP‑006 | **1f** | Remediated (Phase 1) |
| **H4** | "MFA" is client-side theatre; no server TOTP; misleading Keycloak copy | High | `apps/web/src/app/login/page.tsx:168-189` (only checks `code.length!==6`); token already issued at `:100-110`; copy `:295,:457` | GAP‑007 | **1g** | Remediated (Phase 1) |
| **M1** | No brute-force protection / account lockout on login | Medium | single global limiter `consolidated-api/src/index.ts:93-118`; no per-account/login limiter | GAP‑008 | follow-on to 1c (recommend auth-specific limiter) | Remediated (Phase 1) |
| **M2** | Zod validation package is dead code; handlers read `req.body` raw | Medium | no importers outside its own tests; `audit.ts:9`, `user-service/auth.ts:9` | GAP‑009 | **1j** | Remediated (Phase 1) |
| **M3** | CSP explicitly disabled on the deployed API | Medium | was `consolidated-api/src/index.ts:63` `helmet({contentSecurityPolicy:false})` | **NEW** (= ITHC VUL‑001) → GAP‑012 | **1k** | **✅ Remediated 1 Oct 2026** (shared `securityHeaders()` middleware) |
| **M4** | EOL `multer ^1.4.5-lts.1` with 2025 DoS CVEs on an unauthenticated endpoint | Medium | `document-service/package.json:14`, `consolidated-api/package.json:20` | **NEW** → GAP‑013 | **1k** | Remediated (Phase 1) |
| **M5** | Document download served regardless of scan status | Medium | `document-service/src/routes/documents.ts:82-89` (`res.download` with no `doc.status` check) | **NEW** (adjacent GAP‑004) → GAP‑014 | **1i** | Remediated (Phase 1) |
| **L1** | Session tokens not invalidated server-side on logout | Low | logout deletes row `user-service/auth.ts:100-107`; validation ignores it `rbac.ts:31-49` | GAP‑010 | **1h** | Remediated (Phase 1) |
| **L2** | Verbose error `message`s leaked to clients despite `NODE_ENV=production` | Low | `consolidated-api/src/index.ts:379-381`; per-handler `applications.ts:135`, `audit.ts:22` | **NEW** (= ITHC VUL‑003) → GAP‑015 | 1k (recommend) | Remediated (Phase 1) |
| **L3** | Forged/legacy tokens with no `exp` never expire | Low | `rbac.ts:34` guard `payload.exp && …`; `optionalAuth:147` accepts no-exp | **NEW** (sub-issue of GAP‑001) → GAP‑016 | **1a** (reject tokens lacking a verified `exp`) | Remediated (Phase 1) |
| **L4** | Hardcoded dev credentials in docker-compose | Low | `infra/docker/docker-compose.yml:188-189` (Keycloak admin/admin), `:167` (Postgres) | **NEW** → GAP‑017 | 1k (recommend) | Remediated (Phase 1, local-only) |

**Totals:** 3 Critical, 4 High, 5 Medium, 4 Low = 16 findings. 11 map to the existing GAP
register (GAP‑001..010 + GAP‑008/009); 6 are new (M3, M4, M5, L2, L3, L4). GAP‑011
(role‑permission triple-definition) is pre-existing and fixed; its residual items — undefined
`documents.*` / `credit_check.*` permission resources — gate the correct closure of C2 (1d).

---

> **Phase 1 status (6 October 2026).** All 16 findings are now addressed in code (M3 was
> already done). HS256 shared-secret signing and server-side TOTP are the POC closures; RS256/JWKS
> against a real IdP (ScotAccount / GOV.UK One Login) and full applicant identity remain the
> production target. The staff surface and the statutory approve/reject decision are fully gated;
> `GET /applications/:id` stays a public capability-URL read-back pending applicant identity, so
> applicant read-IDOR is deferred under GAP-007 rather than closed. The authoring host has no Node
> runtime, so the fixes are proven by CI (`npx vitest run`, `npx tsc -b`) and an image build + smoke
> test, not locally. Per-item delivery detail: `docs/security-hardening-log.md` §"Phase 1 — Security
> Backbone".

## 3. The six NEW findings (to extend the GAP register as GAP‑012..017)

**M3 → GAP‑012 — CSP disabled on the deployed API. ✅ Already remediated (1 Oct 2026).**
The deployed service ran `helmet({ contentSecurityPolicy: false })`. A shared
`securityHeaders()` middleware (`services/api-gateway/src/middleware/securityHeaders.ts`), now
applied by both `consolidated-api` and `api-gateway`, sets a strict JSON‑API CSP
(`default-src 'none'; frame-ancestors 'none'`) plus HSTS, `nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy`, `Permissions-Policy`, COOP, CORP, and disables `X-Powered-By`. This was
delivered as part of the Hebrides Cyber external-scan remediation; see
`docs/security-scan-report.md` §"External HTTP Header & DNS Scan".

**M4 → GAP‑013 — EOL multer with DoS CVEs.** `multer ^1.4.5-lts.1` (document‑service and
consolidated‑api) is end-of-life; multiple 2025 DoS advisories affect `<2.0.0` (fixed in 2.0.1).
Because the upload endpoint is unauthenticated (C2), the DoS is reachable pre-auth against the
single free-tier container. *Remediation (1k):* upgrade to multer ≥2.0.1 and adjust the upload
handler (breaking changes between 1.x and 2.x — must be tested).

**M5 → GAP‑014 — Download not scan-gated.** `GET /:id/download` serves the file with no check of
`doc.status`, so a `quarantined` or never-scanned document is downloadable. Independent of H2:
even a working scanner withholds nothing today. *Remediation (1i):* withhold download until a
successful `scanned:true, infected:false` result.

**L2 → GAP‑015 — Error leakage.** The global and per-handler error paths return `err.message` to
the client regardless of `NODE_ENV=production`. *Remediation (1k):* generic client message; log
detail server-side only.

**L3 → GAP‑016 — No-exp tokens never expire.** `rbac.ts:34` guards expiry with
`if (payload.exp && …)`, so a token omitting `exp` skips expiry entirely; `optionalAuth:147`
likewise accepts no-exp tokens. *Remediation (1a):* reject any token lacking a verified `exp`.

**L4 → GAP‑017 — Dev credentials in compose.** Keycloak `admin/admin` and Postgres `iaas_dev` in
`infra/docker/docker-compose.yml`. Local-only (not in `render.yaml`), hence Low, but exactly the
kind of default that gets promoted. *Remediation (1k):* externalise to injected secrets.

---

## 4. ITHC reconciliation

`docs/ithc-penetration-test-report.md` is self-correcting, so there is **no live contradiction**:

- **v1.0 (superseded, retained at `:693-697`)** concluded *"No critical or high-severity
  vulnerabilities… FIT FOR CONTROLLED BETA USE,"* with Appendix A recording "Authorisation: 0
  findings" and claiming RS256 JWT validation, Zod on all endpoints, ClamAV, and RBAC enforcement.
  **This directly contradicts reality.**
- **v1.1 (current, `:20-41`, `:530-567`, `:715`)** supersedes it: three Critical + four High;
  revised rating RED / NOT FIT FOR REAL DATA; *"SUITABLE FOR DEMONSTRATION ON SYNTHETIC DATA
  ONLY."* Root cause (`:573-583`): the test exercised a **staging topology with Keycloak + the
  api-gateway as entry point**, not the deployed `consolidated-api`, which has neither.

**Action:** anyone citing the ITHC must use v1.1 + this register, never the v1.0 summary tables.
The Keycloak nuance: it is **not** absent from the repo — it exists as *dormant local-only infra*
(`infra/keycloak/realm-export.json`, `infra/docker/docker-compose.yml:177-197`) that never
touches any Node auth path. `security-known-gaps.md`'s "no Keycloak anywhere" should be refined to
"present as local config, never wired into authentication."

---

## 5. Remediation sequencing (cross-referenced to the improvement-build phases)

Interdependent; order matters (per `security-known-gaps.md` §Remediation Sequencing):

| Stage | Findings | Phase‑1 items | Rationale |
|-------|----------|---------------|-----------|
| 1 | C1, C3, H4, L3 | 1a, 1b, 1c, 1g | Establish trustworthy identity: signed tokens (reject no-exp), real password check, real MFA. Nothing downstream can be trusted until identity is. |
| 2 | GAP‑011 residual, C2 | 1d | Model missing permission resources, then wire auth + permission checks into every deployed route, default-deny. Meaningful only once tokens are trustworthy. |
| 3 | H1, H3 | 1e, 1f | Object-level ownership checks + server-derived audit attribution. Depend on an authenticated principal existing. |
| 4 | M1, L1 | (auth limiter), 1h | Brute-force protection + session revocation — become material precisely because stage 1 made credentials/sessions meaningful. |
| 5 | H2, M5, M2 | 1i, 1j | Fail-closed scanning + scan-gated download + wired Zod validation. Independent of the identity chain; may proceed in parallel. |
| — | M3 ✅, M4, L2, L4 | 1k | Header/dep/hygiene. **M3 done.** M4 (multer), L2 (error sanitisation), L4 (secrets) outstanding. |

A re-review against source should follow stages 1–3, before any environment holds real data.

---

*Classification: OFFICIAL‑SENSITIVE. POC on synthetic data. Maintained alongside
`docs/security-known-gaps.md` and `docs/CURRENT_STATE_ASSESSMENT.md`.*
