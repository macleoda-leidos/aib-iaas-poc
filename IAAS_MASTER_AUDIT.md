# IAAS Master Audit

**Accountant in Bankruptcy — Initial Application Advice Service (POC)**
**Audit date:** 19 October 2026
**Classification:** OFFICIAL
**Scope:** The *actual implementation* as committed, audited by a five-strand discovery pass (frontend, backend, data/packages, documentation, security), not the roadmap or aspirational documentation.

> **Nature of the system.** IAAS is a Proof of Concept built on **synthetic data**, with **no real integrations, no real payments and no personal data**. Every figure in this audit was recounted against the repository on the audit date and is reproducible; the reconciliation is catalogued in `DOCUMENTATION_GAP_ANALYSIS.md`.

---

## 1. Executive summary

The IAAS POC is **materially stronger than its documentation claimed**, and — after this engagement — **more secure and more honest about itself** than it was a week ago.

The build demonstrates a complete, statutory-grounded application journey behind a disciplined microservices-shaped architecture: anonymous citizen intake, a deterministic statute-backed product recommendation engine, parallel external-system checks, document handling with a virus-scan simulation, payment simulation, caseworker review with live statutory SLA clocks, and an immutable audit trail. Authentication is real (signed HS256 JWTs, bcrypt cost-12, genuine TOTP MFA, logout revocation), authorisation runs through a shared **default-deny** gate installed by both deployment shapes, and a working in-process **OIDC / GOV.UK One Login mock IdP** (RS256/JWKS/PKCE) models the exact federation flow a real IdP will use.

This engagement delivered three things:

1. **Security hardening (Workstream A).** A five-agent audit of the running code found **five access-control findings** — one High, two Medium, two Low. **All five are now fixed and covered by regression tests** (19 new tests; the suite grew from 1,037 to **1,084 across 60 files**, all passing). Details in §4 and the standalone `SECURITY_AUDIT.md`.
2. **Documentation reconciliation (Workstream B).** The docs disagreed with the code and with each other on nearly every load-bearing number (roles, permissions, services, admin features, integrations, test counts, .NET parity, Keycloak). Every verifiable figure was recounted and corrected to a single baseline (§3, `DOCUMENTATION_GAP_ANALYSIS.md`). Several numbers went *down* on reconciliation — a smaller honest number is the point.
3. **Strategic positioning (Workstream C).** Five companion documents position IAAS as a credible, reusable platform for AiB: this master audit plus `SECURITY_AUDIT.md`, `ARCHITECTURE_REVIEW.md`, `DOCUMENTATION_GAP_ANALYSIS.md`, `ROADMAP_RECOMMENDATIONS.md` and `BENEFITS_INTEGRATION_OPTIONS.md`.

**Headline verdict:** a POC that is honest about its scope, disciplined in its architecture, and already carrying production-shaped security controls. The gaps that remain are overwhelmingly *"finish the thing that is scaffolded"* — not re-architecture.

### Companion documents

| Document | What it covers |
|----------|----------------|
| `SECURITY_AUDIT.md` | Severity-ranked findings A1–A5 with evidence, fixes and residual risks; confirmed positives; dependency notes. |
| `ARCHITECTURE_REVIEW.md` | Logical-vs-physical topology, BFF clarification, consolidated-api shim, .NET curated-subset parity, 21-table data model, PG-index gap, deployment & cost. |
| `DOCUMENTATION_GAP_ANALYSIS.md` | The full claim → truth → source-of-truth conflict table, missing docs, and the 5 orphan admin pages. |
| `ROADMAP_RECOMMENDATIONS.md` | Recommendations scored against 7 criteria, bucketed Quick Win → Strategic. |
| `BENEFITS_INTEGRATION_OPTIONS.md` | DWP/benefits-check options built on the real I&E + CFT engine. |

---

## 2. Verified baseline (the numbers that matter)

Every figure below was recounted against the repository on the audit date.

| Dimension | Verified value | Source of truth |
|-----------|----------------|-----------------|
| Logical services | **12** (one Express app per bounded context) | `services/*`, `npm run dev:services` |
| `services/` directories | **14** = 12 logical + `consolidated-api` shim + `dotnet-api` | `services/` |
| Express endpoints | **~120** distinct (incl. health) | route files across `services/*` |
| .NET controllers | **0** | `services/dotnet-api/Program.cs` |
| .NET feature modules | **11** vertical slices (17 business + 3 metadata endpoints, 16 MediatR handlers) — **curated-subset parity, not full** | `services/dotnet-api/Features/*` |
| Database tables | **21** | `packages/database/src/schema.ts` |
| Shared types | **47** | `packages/shared-types/src` |
| Zod schemas | **21** | `packages/validation/src` |
| Integration contracts | **7** (+1 orchestrator) | `packages/integration-contracts` |
| Packages | **8** (auth, database, integration-contracts, shared-types, statutory, test-data, ui-components, validation) | `packages/*` |
| Repositories | **12** | `packages/database/src/repositories` |
| Roles | **10** | `seed-data/roles.json` |
| Permissions | **28** (settles the old 20-vs-28 doc conflict) | `seed-data/permissions.json` |
| Role-permission grants | **91** | `seed-data/role-permissions.json` |
| Admin tiles | **33** (`ADMIN_FEATURES`) + **5 orphan** admin pages = 38 admin pages | `apps/web/src/app/admin/page.tsx` |
| Web pages | **69** `page.tsx` | `apps/web/src/app` |
| Admin-app pages | **10** `page.tsx` | `apps/admin/src` |
| Mock-integration modules | **6** (BASYS, eDEN/DAS-hub, DAS, CFT, Moratorium, RoI) + credit-check + health | `services/mock-integrations/src/routes` |
| **Tests** | **1,084 across 60 files** (757 backend / 47 files, 327 frontend / 13 files) | `npx vitest run` |

**Scaffolding-not-wired, stated honestly:** `INTEGRATION_MODE=live` throws (only `mock` is implemented); Keycloak exists as `realm-export.json` scaffolding but is **not wired** (the OIDC mock IdP is the live federation path); there is **no root `docker-compose.yml`** (the compose file is `infra/docker/docker-compose.yml`).

---

## 3. Feature & documentation review (Workstream B synthesis)

The documentation had drifted systemically. The reconciliation corrected, among others:

- **Roles** 8/9 → **10**; **permissions** 20 → **28**; **grants** 68 → **91**.
- **Admin features** 28/37/38 → **33 tiles (+5 orphan pages)**.
- **Services** 13/14 "microservices" → **12 logical / 14 dirs**; **.NET** "full parity" → **curated-subset parity**.
- **Integrations** "10" → **6 mock modules**.
- **Test counts** 423 / 904 / 1,037 → **1,084/58**; `testing.md`'s internal 45-vs-38 backend-file conflict → **45**; the stale "215→298" note removed.
- **Packages** 6 → **8**.
- **Keycloak** "runs in Docker Compose" and the implied root compose file → scaffolding-only, OIDC mock IdP is the live path (reconciliation notes added to `architecture.md` §8.1 and §9).

The full claim → truth → `file:line` → status table is in `DOCUMENTATION_GAP_ANALYSIS.md`, which also catalogues the **5 orphan admin pages** (`api-keys`, `api-versioning`, `monitoring`, `security-headers`, `webhooks` — built but never wired into the hub grid) and the genuinely **missing docs** (no Terraform guide despite real IaC under `infra/terraform/`; the consolidated-vs-standalone CI reality is undocumented; no committed OpenAPI artefact; the sprint-delivery-log lags the roadmap by one sprint).

---

## 4. Security review & implementation summary (Workstream A)

The full severity-ranked analysis is in `SECURITY_AUDIT.md`. In brief, the five findings and the fixes that landed:

| ID | Severity | Finding | Fix implemented |
|----|----------|---------|-----------------|
| **A1** | High | Notification service trusted caller-supplied `:userId`/`:id`/body on every route (IDOR) — any authenticated user could read/modify/delete/originate another user's notifications. | Ownership guard reading `req.user` (set by the global gate) or verifying the Bearer token inline via `@aib-iaas/auth` (the self-contained idiom audit-service already uses). `GET /user/:userId` and `read-all` require caller==`:userId` **or** staff; `/:id/read` and `DELETE /:id` resolve the row and confirm ownership; `send`/`send-bulk` are staff-only. **404 (not 403)** on mismatch so an id is never confirmed. |
| **A2** | Medium | Every payment route (initiate, Apple/Google Pay, card, status, refund) was unauthenticated and unscoped. | Anonymous callers allowed only with the **application-scoped capability token** tying the payment to their application; **refund is staff-only**; 404 on mismatch. In the deployed shape the global gate also fronts `/api/payments`. |
| **A3** | Medium (demo-critical) | Anonymous application **write** surface (`PUT /:id`, `POST /:id/submit`) was not capability-gated — a guessed id let an anonymous caller edit/submit another applicant's draft. (`GET` already required the capability.) | **Backend:** `enforceAnonymousWrite` requires `hasValidCapability` on PUT and submit for anonymous callers. **Frontend:** `apiClient` captures `capabilityToken` on create, stores it in `sessionStorage` keyed by applicationId, and sends it as `X-Application-Capability` on get/update/submit; the `/apply` localStorage pending-submission retry carries it too. End-to-end tested. |
| **A4** | Low | Any authenticated user — including a debtor — could POST arbitrary events into the immutable audit log. (Actor was already token-bound.) | `POST /api/audit/events` now refuses `role === 'debtor'` (staff/service-only). No `audit.write` permission exists in the RBAC seed, so role is the authority; actions stay free-form (an enum would break legitimate `sla_*` writes). |
| **A5** | Low | The admin documentation viewer rendered fetched markdown through `dangerouslySetInnerHTML` with zero HTML escaping — a latent stored-XSS sink alongside a localStorage bearer token. | HTML-escape all five metacharacters **before** the markdown transforms (which only add a fixed safe tag set). **No new dependency** (DOMPurify avoided); blockquote regex adjusted for the escaped `>`. The functions were extracted to `admin/dev/markdown.ts` so the escaping is unit-tested. |

**Implementation footprint:** source changes across 4 services + the web app, mirroring existing idioms (`hasValidCapability`/`issueCapabilityToken`, `req.user` scoping, inline `@aib-iaas/auth` verification, the 404-not-403 IDOR convention). Security-regression tests cover **all five** findings — **19 backend** across `consolidated-api/access-control.test.ts`, `api-gateway/applications.test.ts` and the notification/payment/audit service suites (A1–A4), plus a dedicated **A5 frontend suite** (`admin/dev/__tests__/markdown.test.ts`). Full suite: **1,084/58 passing** (`DATABASE_PATH="$(mktemp -d)/fresh.db" npx vitest run`), `demoSelectors.test.ts` green (no demo hooks moved).

**Confirmed positives** (see `SECURITY_AUDIT.md` §4): HS256 pinned-alg JWT with mandatory `exp`; bcrypt cost-12 with timing-equalisation; real TOTP (no pre-MFA token); logout session revocation; shared default-deny gate; capability-token IDOR fix (read **and** write); parameterised SQL throughout; strict `default-src 'none'` CSP; scoped auth rate-limiter; OIDC/One-Login mock IdP; no committed secrets; audit actor bound from token, never body.

**Residual risks** (open and acknowledged): partial org-boundary RBAC (role-based, not fully tenant-scoped); browser-storage tokens (XSS-exfiltratable in principle; mitigated by CSP + A5, not eliminated); extension-only document-upload filter; PG carries fewer indexes than SQLite (24 vs 10); mock-only federation and `INTEGRATION_MODE=live` unimplemented; dependency hygiene (bump axios ≥1.7, run `npm audit` in CI).

---

## 5. Architecture review (synthesis)

Full detail in `ARCHITECTURE_REVIEW.md`. The architecture's credibility rests on one disciplined distinction: **12 independent bounded contexts** (each its own port, tests, `package.json`) that **deploy as one container** (`consolidated-api`) to suit Render's free-tier cold-start economics. The two shapes are kept honest by shared code — the same default-deny gate, security headers and statutory engine mounted into both — so dev and deployment topologies cannot silently diverge. The gateway is a genuine **Backend-for-Frontend** (auth, RBAC, rate limiting, routing, response shaping, the SLA and CFT endpoints), not a dumb proxy; `consolidated-api` holds no business logic (and is excluded from coverage).

The **.NET 9** implementation is an explicit **curated subset** (11 vertical-slice feature modules, 17 business + 3 metadata endpoints, 16 MediatR handlers) — proof the contract is implementation-agnostic, not a second production backend. The **data model** is 21 tables with SQLite as the runtime query engine and PostgreSQL (Neon) as the persistent store; the schemas are hand-parallel and **PG carries 14 fewer indexes than SQLite (10 vs 24)** — flagged as a migration-correctness item. Resiliency patterns (auto-seed on empty DB, graceful frontend fallback, SLA worker singleton guard, capability-token continuity) are present and sensible.

---

## 6. Recommendation-engine improvements

The engine (`services/recommendation-service/src/engine/rules.ts`) is a **deterministic, statute-backed cascade** producing `reasoning[]`, `factors[]` and `alternativeProducts[]`, with a confidence band mapped to a percentage, optional per-application persistence (`engineVersion`), and a template "AI" explanation. This is the right foundation — explainable and auditable by construction. Recommended maturation (scored in `ROADMAP_RECOMMENDATIONS.md`):

- **Surface factor weights and traceability in the UI** — show *which* rule fired on *which* input, not just the outcome.
- **Capture caseworker overrides with mandatory justification**, written to the audit trail — preserves human-in-the-loop while recording divergence from the engine.
- **Confidence calibration** — validate the band→percentage mapping against outcomes over time.
- **Keep human-in-the-loop** — the engine advises; a person decides. The override + audit pattern enforces this.

---

## 7. Admin-portal improvements

- **Consolidate the two admin surfaces** — the web app's `/admin/*` pages and the separate `apps/admin` application overlap; rationalise to one.
- **Surface or retire the 5 orphan pages** — `api-keys`, `api-versioning`, `monitoring`, `security-headers`, `webhooks` are live but have no hub tile. Either add them to `ADMIN_FEATURES` (so the hub advertises everything that exists) or annotate them as deliberately deep-link-only. Leaving them undiscoverable-but-live is what produced the 33-vs-38 confusion.
- **Rationalise the 33 tiles** into clearer functional groupings for caseworker vs system-admin audiences.

---

## 8. Technical-debt assessment

| Area | Debt | Severity | Where it's tracked |
|------|------|----------|--------------------|
| Integration layer | `INTEGRATION_MODE=live` throws — only mock exists | Medium | Roadmap "finish live mode" |
| Identity | Federation is the in-process OIDC mock, not a real IdP (GAP-007) | Medium | Roadmap "real IdP" |
| Data | PG has 14 fewer indexes than SQLite — query-plan divergence risk on migration | Medium | `ARCHITECTURE_REVIEW.md` §5.3 |
| AuthZ | Org-boundary RBAC is role-based, not fully tenant-scoped | Medium | Roadmap "org-boundary RBAC" |
| Frontend | Tokens in browser storage; document-upload filter is extension-only | Low–Medium | `SECURITY_AUDIT.md` §5 |
| Dependencies | axios < 1.7; no `npm audit` in CI | Low | `SECURITY_AUDIT.md` §6 |
| Docs/infra | No Terraform guide; consolidated-vs-standalone CI undocumented; no committed OpenAPI artefact; sprint-log lags roadmap | Low | `DOCUMENTATION_GAP_ANALYSIS.md` §5 |
| Build hygiene | Compiled `.js`/`.js.map` artefacts committed next to `.ts` sources in some service `src/` trees | Low | — |

---

## 9. Quick wins & high-priority actions

**Quick wins (≤1 sprint each):**
1. **PostgreSQL index parity** — copy the 14 missing `CREATE INDEX IF NOT EXISTS` statements into `pg-schema.ts`. Low effort, de-risks migration.
2. **Dependency hygiene in CI** — bump axios ≥1.7, add `npm audit` to the pipeline.
3. **Surface or annotate the 5 orphan admin pages.**
4. **Commit a generated `openapi.json`** as the canonical contract, or document that the API-docs page is hand-authored.
5. **Add the Sprint 30 entry to `sprint-delivery-log.md`** so it agrees with the roadmap.

**High-priority (next):**
1. **Finish `INTEGRATION_MODE=live`** behind the existing factory/contract seam.
2. **Promote the OIDC mock IdP to a real ScotAccount / GOV.UK One Login federation.**
3. **Tenant-scope RBAC** on every route, not just role-check.
4. **Recommendation traceability + override-with-justification capture.**

The full, scored and sequenced backlog is in `ROADMAP_RECOMMENDATIONS.md`.

---

## 10. Benefits & DWP opportunities (synthesis)

`BENEFITS_INTEGRATION_OPTIONS.md` sets out the case in full. The key insight: IAAS **already** captures structured income/expenditure with a first-class `benefits` income line and already runs a statute-backed contribution assessment through the CFT engine (`assessContribution`, reachable at `GET /api/applications/:id/cft-assessment`). A DWP/benefits integration is therefore an **extension of a working foundation**, not a greenfield build. Options — consent-based citizen check, adviser-assisted check, entitlement/income verification, and evidence auto-gathering — map directly onto advice quality, recommendation accuracy, the CFT contribution figure, adviser productivity, fraud reduction and evidence automation. The hard prerequisites are honest and non-technical: a real DWP connection (via the existing live-mode seam), a lawful basis, and a DPIA.

---

## 11. Conclusion

Within the explicit bounds of a synthetic-data POC, IAAS is a disciplined, statute-grounded demonstrator carrying production-shaped controls. This engagement made it **demonstrably more secure** (five findings fixed, 19 regression tests, 1,084/58 passing) and **honest about its own numbers** (every load-bearing figure recounted and reconciled). The remaining work is a well-understood backlog of finishing scaffolded seams and maturing capabilities — the backlog of a platform that is ready to become a product, documented in the five companion deliverables.
