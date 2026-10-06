# IAAS — Current-State Assessment

## AiB IAAS — Initial Application Advice Service

| Field | Value |
|-------|-------|
| Document type | Authoritative current-state assessment (code-grounded, not doc-trusting) |
| Assessment date | 1 October 2026 |
| Method | Whole-repository source reading + symbol/dependency tracing, cross-checked across six independent audits |
| Scope | `apps/`, `services/`, `packages/`, `infra/`, `docs/` |
| Deployed artefact | `services/consolidated-api` (per `render.yaml`), `services/dotnet-api` (alt), `apps/web` static export (GitHub Pages) |
| Companion docs | `docs/SECURITY_REVIEW.md` (findings), `docs/security-known-gaps.md` (GAP register), `docs/FEATURE_AUDIT.md` (per-feature) |
| Status | CURRENT — supersedes marketing claims in the docs listed in §5 wherever they disagree |

> **This POC runs on synthetic data only.** No real personal data, payments, or production
> integrations exist. This document records what the code *actually does today*, so that every
> future decision starts from the implementation reality rather than the (frequently
> over-claiming) prose in the wider doc set.

---

## 1. Executive reality summary

The POC presents as a near-production government service (~77 page files, 12 logical services,
a .NET alternative API, ~60 docs). A code-grounded audit shows a wide gap between that polished
surface and the implementation beneath.

| Area | Genuinely REAL (protect & build on) | Presented as real but is NOT |
|------|-------------------------------------|------------------------------|
| **Persistence** | SQLite via `@aib-iaas/database` for applications, applicants, addresses, debts, assets, I&E, documents (seed), recommendations, audit, users/roles/sessions, organisations; notifications in its own SQLite DB. **All SQL parameterised — no injection vector.** | `document-service` + `payment-service` use in-memory `Map`s (lost on restart) while real `DocumentRepository`/`PaymentRepository` sit unused. Staff notes, credit-check consent/history not persisted. |
| **Domain logic** | Recommendation rules engine (`recommendation-service/src/engine/rules.ts`) + `packages/statutory` (citation-backed Scottish insolvency thresholds, CFT, statutory clocks). The deliberate £1,500-floor removal is correct. | The **.NET** engine contradicts it (retains the £1,500 floor + inline literals) → different products for the same input (§3). |
| **Auth / access** | RBAC model is well-defined (10 roles / 20 permissions / 68 grants); middleware exists and is unit-tested. | **Deployed service enforces NO auth on any route**; tokens are **unsigned base64 JSON**; **any password accepted**; **MFA is client-side theatre**; **no Keycloak in any auth path** (it exists only as dormant compose scaffolding). → trivial privilege escalation + IDOR on approve/reject. See `SECURITY_REVIEW.md`. |
| **Frontend** | ~8 of ~77 pages are API-backed and real (§2). | The other ~69 are convincing mocks, static content, or stubs — including a 37-tile web admin surface and the entire separate `apps/admin` app (100% hardcoded). Several forms submit nowhere (`/feedback`). |
| **Validation** | Hand-rolled validators in `applications.ts` (NI number, body shape) are real. | `packages/validation` (Zod) is **dead code** — zero importers outside its own tests. |
| **Integrations** | Mock integrations are deliberate and clearly scoped (`/api/mock/*`). | `integration-orchestrator` **bypasses** `packages/integration-contracts`; the documented `INTEGRATION_MODE=mock\|live` swap has no effect on the running service. |
| **Headers/transport** | Restricted CORS allow-list + good secret hygiene on the deployed service; **API security headers now hardened** (CSP/HSTS/etc., 1 Oct 2026). | The GitHub Pages frontend cannot carry HTTP headers (host limitation — see `security-scan-report.md`). |

---

## 2. Page inventory

**Tags:** REAL = fetches/mutates live data via `lib/apiClient` and persists; MOCK = convincing UI
but hardcoded/seed data or actions that go nowhere; STUB = thin/placeholder; STATIC = genuine
informational content (not a defect). Classification basis: data-source trace (`lib/apiClient`
usage across pages *and the components they render*, `seedData` imports, `fetch` calls), line
counts, and cross-reference to the verified endpoint inventory (§3).

**Totals: ~77 page files = 8 REAL · ~6 STATIC · ~5 STUB · ~58 MOCK.** Only **8 are REAL.**

### REAL (8) — API-backed via `lib/apiClient`
| Route | Evidence | Notes |
|-------|----------|-------|
| `/apply` | `apps/web/src/app/apply/page.tsx` (2296L; apiClient + fetch) | Citizen journey — calls recommend, integrations check-all, credit-check, applications create/submit. The deepest real flow. |
| `/dashboard` | `apps/web/src/app/dashboard/page.tsx` (apiClient; seed fallback) | Consumes `applications.list`/detail; falls back to `seedData` when the API is cold. |
| `/case/[ref]` | `apps/web/src/app/case/[ref]/CaseDetail.tsx` (apiClient) | 11-line route delegates to `CaseDetail` which calls `applications.get`/`updateStatus`/`audit`. Approve wiring is a Phase-2 confirch target. |
| `/login` | `apps/web/src/app/login/page.tsx` (apiClient) | Real token issue via `/api/auth/login`; **MFA step is client-side mock** (any 6 digits — GAP-007). |
| `/search` | `apps/web/src/app/search/page.tsx:6-7` (apiClient **and** seedData) | Uses `applications.list` with a `seedApplications` fallback + Fuse index. |
| `/statistics` | `apps/web/src/app/statistics/page.tsx` (apiClient) | Consumes `/api/reports/*` — note several report blocks are hardcoded server-side (§3). |
| `/admin/users` (web) | `apps/web/src/app/admin/users/page.tsx` (apiClient) | Lists/creates users via `/api/users`. Add-User POSTs for real. |
| `/demo-controls` | `apps/web/src/app/demo-controls/page.tsx` (apiClient) | Demo orchestration utility. |

### STATIC (~6) — informational, no data layer intended
`/` (home), `/architecture` (C4 content + demo beat), `/accessibility`, `/security` (posture
page), `/api-docs` + `/api-docs/openapi` (OpenAPI spec display).

### STUB (~5) — thin/placeholder
`/prototype` (27L); `/case/[ref]/recommendation` & `/case/[ref]/audit` (13L thin routes);
`apps/admin` `applications/[id]` (15L) & `rules/[id]` (22L).

### MOCK (~58) — convincing UI, no real API / actions not wired
- **Citizen/staff web pages:** `/my-application` and `/my-application/messages` (reply is local
  state only — not wired), **`/feedback`** (`handleSubmit` only sets `submitted=true` — submits
  nowhere), `/manage-users` (duplicates `/admin/users` but no API), `/notifications`,
  `/correspondence`, `/creditor-portal`, `/adviser-workspace`, `/account`, `/account/sessions`,
  `/portal` (seedData).
- **Web admin tiles (~37)** under `/admin/*` (all except `/admin/users`): accessibility-checker,
  activity, ai-explainability, ai-governance, api-keys, api-versioning, biometric, carbon-tracker,
  changelog, collaboration, consent, correspondence-scheduler, data-retention, dev (fetches repo
  docs), digital-mailroom, digital-signature, document-scanner, export (seed), feature-flags
  (fetch), integration-monitor, knowledge-hub, mi-reports, monitoring, notifications-hub,
  open-banking, organisations, performance, policy-simulation, qr-login, reports (seed), rules,
  rules/[id], satisfaction, security-headers (now reflects the real API header set), system-health,
  voice-input, webhooks, workflow-engine, admin (index hub).
- **The entire separate `apps/admin` app (10 pages)** — ai-governance, applications/[id],
  digital-mailroom, knowledge-hub, organisations, index, policy-simulation, rules, rules/[id],
  users — **100% hardcoded** (no apiClient anywhere). Duplicates web `/admin/*`.

**Conversion candidates (cheapest to make live):** `/feedback` → a feedback/notification endpoint;
`/case/[ref]` Approve → `applications.updateStatus`+`audit` (apiClient already exposes both);
`/my-application/messages` reply → notification endpoint; `/admin/reports` + `/portal` → the real
`/api/reports/*`; admin `integration-monitor`/`feature-flags`/`open-banking` → `/api/integrations/health`.

---

## 3. Service / endpoint inventory

**87 business endpoints** across the 12 logical services (gateway 16, services 56,
mock-integrations 15), all mounted into the single deployed `consolidated-api`, plus 3 infra
routes (`/`, `/api/health`, `/api/smoke-test`). **~48 REAL vs ~39 MOCK/stub.**
**No deployed route enforces authentication or a permission** (see `SECURITY_REVIEW.md` C2).

| Service | REAL | MOCK / stub | Notes |
|---------|------|-------------|-------|
| api-gateway (applications) | create, get, update, submit, PATCH status, list — all SQLite via `ApplicationRepository` + audit | `POST /:id/notes` (writes an **audit event only**, no notes table); `GET /postcode/:postcode` (hardcoded synthetic map) | Hand-rolled validation (`validateApplicationBody`/`validateNINumber`) is real. |
| api-gateway (auth) | `findByEmail` lookup | **any password accepted**; base64 "token"; `/me` decodes without DB | GAP-001/003. |
| api-gateway (reports) | `/dashboard` `summary`+`byStatus` are real SQLite aggregates | `byProduct`, `trends`, `performance`, `geographic`, `financial`, `/by-product`, `/organisation-activity`, `/processing-times`, both CSV exports — **hardcoded** | Hardcoded values used as `\|\| fallback` when DB empty. |
| recommendation | `POST /recommend` — genuine rules-engine computation (not persisted) | `POST /recommend/explain` — hardcoded AI-mock text | Engine is a real asset (§4). |
| document | — | upload/get/download/delete/scan-status via in-memory **`documentRegistry` Map**; `DocumentRepository` exists but unused | Scan is a separate manual endpoint, not on upload (SECURITY_REVIEW H2). |
| payment | — | initiate/apple-pay/google-pay/card/status/refund via in-memory **`payments` Map** + `Math.random()`; `PaymentRepository` unused | Lost on restart. |
| audit | `POST /events`, `GET /events/:appId`, `GET /events` — all SQLite | — | Actor taken from body; unauthenticated reads+writes (GAP-006). |
| credit-check | `/run` caches to a SQLite cache DB | `/run` data synthetic; `/history` returns `[]`; `/consent` not persisted; `/providers` static | Consent + history are stubs. |
| organisation | type/list/get/hierarchy/create/update — all SQLite | — | Genuinely real CRUD + recursive hierarchy. |
| user / roles | users list/get/create/update/delete, roles list/get/matrix, sessions, hasPermission — all SQLite | login accepts any password | RBAC data real; enforcement absent. |
| notification | send/send-bulk/get/read/read-all/delete — own SQLite DB | `/preferences/:userId` hardcoded | Real persistence. |
| identity | — | providers/verify-scotaccount/verify-govuk/systems/lookup/linked-accounts — all hardcoded | Synthesises a `keycloakId`; no federation. |
| mock-integrations (15) | — | BASYS/eDEN/DAS/CFT/moratorium/RoI/credit/health — deliberate heuristic mocks | By design. |

### .NET API parity (`services/dotnet-api`)
- **~20% endpoint parity**: **17 business endpoints across 11 feature modules** (MediatR/CQS),
  vs 87 Express. Of 15 Express areas: 2 full (recommend, audit), 10 partial (mostly read-only or
  single-verb mocks), 3 absent (postcode, identity, reports/export). (The plan's "~17 controllers"
  conflated endpoints with modules — it's 17 endpoints, 11 modules.)
- **Correctness divergence (recommendation):** `Features/Recommendations/Commands.cs:14-25`
  **retains the £1,500 floor** (`if (r.TotalDebt < 1500) → signposting_advice`) and uses inline
  literals (1500 / 5000 / 25000 / 2000 / 10000 / 100 / 50) where the Node engine reads
  `@aib-iaas/statutory`. Same input → **different product**:

  | Input | .NET | Node |
  |-------|------|------|
  | debt £900, disposable £100 | signposting (floor) | debt_payment_programme |
  | debt £900, disposable £0 | signposting (floor) | minimal_asset_process |
  | debt £8,000, disposable £60 | signposting (>100 gate) | debt_arrangement_scheme |
  | debt £5,000, disposable −£50, assets £3,000 | signposting (£10k gate) | bankruptcy (£3k seq. min) |

- **.NET security: effectively none** — no `UseAuthentication`/`UseAuthorization`/rate-limiter
  registered; login accepts any password; `ApiKeyMiddleware`/`ValidationBehavior`/etc. exist but
  are never wired (and `ApiKeyMiddleware` falls through for all requests anyway).
- **No shared golden fixtures** exist, and the .NET project has **no test project at all** —
  nothing guards against the divergence above.

---

## 4. Data model, RBAC, domain (verified first-hand)

### Data model — 16 tables (SQLite `schema.ts` ≡ PostgreSQL `pg-schema.ts`)
`roles, permissions, role_permissions, organisations, users, sessions, applications, applicants,
addresses, debts, assets, income_expenditure, documents, recommendations, audit_events, payments`.
SQLite and PG carry the **same 16 tables and columns**; divergences are structural only (SQLite
`INTEGER`-boolean→PG `BOOLEAN`, `REAL`→`DOUBLE PRECISION`, `TEXT`-datetime→`TIMESTAMPTZ`; SQLite
declares more FKs/indexes). Two *other* `CREATE TABLE`s are separate service-local DBs
(`notifications`, `credit_check_cache`), not part of this schema.
- **`users` already has `password_hash` and `mfa_enabled`** (seeded with a sentinel hash). Of the
  columns Phase 1 planned to add, **only `mfa_secret` is genuinely new.** No `notes`/`feedback` table.

### RBAC — 10 roles / 20 permissions / 68 grants
Seeded from `seed-data/{roles,permissions,role-permissions}.json` via `rbac.ts` into both backends.
The "10 grants" in earlier planning was imprecise: `role-permissions.json` has **10 grant records
(one per role)** that flatten to **68 `role_permissions` rows**.

Roles (level): system_admin 100, aib_senior_officer 80, cyberops_analyst 70, aib_officer 60,
money_adviser 50, statistician 45, supplier 40, creditor 30, aib_readonly 20, debtor 10.
Grants/role: sysadmin 20 (all), senior 14, officer 7, adviser 6, cyberops 5, readonly 4, debtor 4,
statistician 3, supplier 3, creditor 2 (= 68). Session repo methods (`createSession`,
`findSessionByToken`, `deleteSession`, `getPermissionsForRole`, `hasPermission`) all present.
**No deployed route checks a permission yet** (GAP-002).

### Recommendation engine (genuinely real)
First-match-wins over 7 products (signposting / moratorium / DPP / MAP / DAS / PTD / bankruptcy),
sourcing MAP ceiling £25,000, MAP max assets £2,000, sequestration min £3,000, DCO 48 months from
`@aib-iaas/statutory`. **£1,500 floor deliberately removed** — `rules.ts:96-109` documents it,
citing SSI 2023/9 reg.2 (6 Feb 2023); `thresholds.ts:59-63` models `MAP.minDebt` as `null`.
Some band boundaries remain inline literals (£5,000, £50, £100).

### Statutory library (well-cited)
`packages/statutory` — every figure carries its provision (and `amendedBy`/`effectiveFrom`):
sequestration min £3k (s.2(8)(a)), MAP £25k (SSI 2021/148), DAS no monetary minimum (reg.21(1)),
DCO 48mo (s.91(2)(a)), CFT contingency (SSI 2016/397 reg.16), PTD objection ½-in-number / ⅓-in-value
(SSI 2013/318 reg.10(2)), s.122 creditor-claims disapplied for MAP; plus `clocks.ts`/`caseClocks.ts`
(statutory deadline maths) and `cft.ts` (contribution assessment, with POC stand-in trigger figures).

---

## 5. Docs-vs-reality discrepancy register

The security/ATO/ITHC/BETA-readiness cluster is **honest and self-correcting** (the model to
extend — `security-known-gaps.md` GAP-001..011 is the reference). Live over-claims and stale
numbers concentrate in the marketing/architecture/testing cluster. Priority fixes:

| # | Doc:line | Claim | Reality | Fix |
|---|----------|-------|---------|-----|
| 1 | feature-catalogue.md:168 | "RBAC middleware checks permissions on every request" | Not applied on deployed service (GAP-002) | Qualify: written/tested, not enforced |
| 2 | feature-catalogue.md:162 | "per-organisation scoping" | No org-scoped authz; IDOR (GAP-005) | "modelled, not enforced" |
| 3 | feature-catalogue.md:150,172 | "9 Roles" / "9 perspectives" | 10 roles | Correct to 10 |
| 4 | feature-catalogue.md:176 | "User Service (port 3008)" | Port 3011 (3008 = credit-check) | Correct port |
| 5 | feature-catalogue.md:329 | "virus scanning protects infrastructure" | Fail-open filename match (GAP-004) | Soften |
| 6 | roadmap.md:12 | Sprint 6 "MFA … Complete" | MFA simulated client-side (GAP-007) | "simulated (UI only)" |
| 7 | ithc-penetration-test-report.md:55-56,693,697 | "No critical or high … FIT FOR CONTROLLED BETA USE" | v1.1 records 3 Crit/4 High; superseded | Strikethrough the retained v1.0 text in situ |
| 8 | **testing.md:66,90; architecture.md:750,768** | **"904 tests across 50 files"** | Run reports differ; CLAUDE.md says 822/46; docs internally inconsistent (238 vs 289; 38 vs 39 files) | **Re-run `vitest` to lock the real number, then standardise everywhere** |
| 9 | testing.md:206-216 | Keycloak auth / MFA / RBAC / Zod / virus-scan all "Pass" | None enforced (GAP-001/002/003/004/007/009) | Reflect GAP register |
| 10 | architecture.md:644,530 | "All 12 services + 2 frontends + … Keycloak … production-grade identity" | Compose defines 10 services, 0 frontends; no code integrates Keycloak | "10 of 12; unused scaffolding" |
| 11 | api-sdk-guide.md:20; release-notes.md:187 | "JWT Bearer authentication" / "stores JWT" | Unsigned base64, any password | "unsigned base64; JWT is prod target" |
| 12 | functionality-breakdown.md:101; IAAS_DOCUMENTATION_REVIEW.md:10 | "13 / 14 microservices", ".NET full parity" | 12 logical; .NET ~20% | Correct counts + parity |
| 13 | demo-script.md:11,153; executive-summary.md:67 | "Every page connected to a live API … 50+ pages" | ~8 of ~77 real | Distinguish real vs demonstrative |
| 14 | gds-service-assessment.md:37; bid-positioning.md:25; gds-evidence-pack.md:137 | "0 critical/high", "RBAC delivered", "five user roles" | 3C/4H; not enforced; 10 roles | Reflect reality |
| 15 | feature-catalogue.md:168; admin-portal-guide.md:15 | "500 synthetic users" | 6–10 seeded (generator figure ≠ DB) | Reconcile |

**Nuances to carry forward:** (a) Keycloak/ClamAV/Postgres *are* defined in docker-compose, but
no service code integrates them → frame as "unused scaffolding," not "fabrication." (b) The ITHC
is already self-correcting; it needs **strikethrough of the retained v1.0 lines**, not a rewrite.
(c) The **real test count must be re-measured with `npx vitest run`** before editing any figure —
live docs now say 904, CLAUDE.md says 822, and older docs say 648/658/423/501.

---

## 6. Prioritised improvement backlog (cross-referenced to Phases 1–5)

| Priority | Item | Addresses | Phase |
|----------|------|-----------|-------|
| P0 | Signed tokens; real password check; enforce RBAC on deployed routes; IDOR/ownership; audit actor from token; real MFA | SECURITY_REVIEW C1,C2,C3,H1,H3,H4 (GAP-001..007) | **1a–1h** |
| P0 | Fail-closed scanning + scan-gated download + document auth | H2, M5 (GAP-004) | **1i** |
| P0 ✅ | API security headers (CSP/HSTS/etc.) | M3 (ITHC VUL-001) | **1k — DONE 1 Oct 2026** |
| P1 | Wire Zod validation into mutating handlers | M2 (GAP-009) | **1j** |
| P1 | Upgrade EOL multer 1→2; sanitise error leakage; externalise dev creds | M4, L2, L4 | **1k** |
| P1 | Mock→real conversions: `/feedback`, `/case` approve, `/search`, `/admin/users` list, messages reply | §2 candidates | **2** |
| P1 | Real reports (replace hardcoded report blocks with SQLite aggregates) | §3 reports | **2** |
| P1 | Persist document-service + payment-service (use existing repos); persist notes, credit-check consent/history | §3 persistence gaps | **2** |
| P2 | .NET rules fidelity (remove £1,500 floor + inline literals) + shared golden fixtures (Node↔.NET) | §3 divergence | **3** |
| P2 | .NET surface + security parity (expand from 17 endpoints; add auth/RBAC) | §3 parity | **3** |
| P3 | Route orchestrator through `integration-contracts`; one reference "live" client | §1 integrations | **4** |
| P3 | Pluggable PostgreSQL runtime store behind `@aib-iaas/database` | §1 persistence | **4** |
| P3 | Convert 2–3 headline admin tiles to live; retire `apps/admin` + `/manage-users` duplication | §2 | **5** |
| P2 | Docs sync: fix the §5 discrepancies; re-measure test count; strikethrough ITHC v1.0 | §5 | each phase |

---

*Classification: OFFICIAL-SENSITIVE. POC on synthetic data. This assessment is the authoritative
current-state record; maintain it alongside `SECURITY_REVIEW.md` and `security-known-gaps.md` as
the codebase changes.*
