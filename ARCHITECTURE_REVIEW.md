# Architecture Review — AiB IAAS Proof of Concept

**Document type:** Technical architecture review
**Subject:** Initial Application Advice Service (IAAS) — Accountant in Bankruptcy
**Status:** Proof of Concept with synthetic data; no real integrations, payments or personal data
**Date:** 19 October 2026

> Every figure in this document was recounted against the repository on the date
> above. Where a number is load-bearing it is cross-referenced to the file (and,
> where helpful, the line) it was measured from. This is a POC: the review is
> deliberately honest about what is real, what is simulated, and what is
> scaffolding.

---

## 1. Executive summary

The IAAS POC is a microservices-shaped application gateway for the Accountant in
Bankruptcy's statutory debt products. It demonstrates a complete multi-step
application journey — anonymous intake, rules-based product recommendation,
parallel system checks, document handling, payment simulation, caseworker review
and an immutable audit trail — behind a Backend-for-Frontend gateway, with a
rules engine grounded in Scottish statutory deadlines.

What makes the architecture credible for a POC is not its size but its
**discipline around a single hard distinction**: the system is designed as twelve
independent bounded contexts (twelve logical Express services, each with its own
port, tests and `package.json`), yet it deploys as **one** container. The two
shapes are kept honest by shared code — the same default-deny authentication
gate, the same security headers, the same statutory engine — mounted into both,
so the development topology and the deployment topology cannot silently diverge.

The POC also demonstrates **technology flexibility** without over-claiming: an
alternative .NET 9 implementation (`services/dotnet-api`) stands up a curated
subset of the same API surface using MediatR and a CQS, vertical-slice style. It
is explicitly a *subset* — proof that the contract is implementation-agnostic,
not a second production backend.

The honest weaknesses are catalogued in §10 and are mostly "finish the thing
that is scaffolded": `INTEGRATION_MODE=live` is unimplemented, real IdP
federation is still a mock, the PostgreSQL schema carries fewer indexes than the
SQLite one, and org-boundary RBAC is role-based rather than fully tenant-scoped.
None of these undermine the POC's purpose; all of them are on the roadmap.

---

## 2. Logical versus physical topology

This is the single most important thing to get right before quoting a count
anywhere, because the numbers legitimately differ.

### 2.1 Twelve logical services

There are **12 logical Express services**, one per bounded context. Each is a
standalone app with its own port, its own test suite and its own
`package.json`. The development command `npm run dev:services` starts exactly
these twelve concurrently (`package.json:13`):

| # | Service | Port | Responsibility |
|---|---------|------|----------------|
| 1 | api-gateway | 3001 | BFF: auth, RBAC, rate limiting, routing, SLA worker, CFT endpoint |
| 2 | recommendation-service | 3002 | Rules engine |
| 3 | document-service | 3003 | Upload, storage, ClamAV simulation |
| 4 | integration-orchestrator | 3004 | Parallel system checks |
| 5 | mock-integrations | 3005 | BASYS, eDEN/DAS-hub, DAS, CFT, Moratorium, RoI |
| 6 | payment-service | 3006 | Payment simulation |
| 7 | audit-service | 3007 | Immutable event log |
| 8 | credit-check-service | 3008 | CRA interface + consent |
| 9 | organisation-service | 3009 | Organisation hierarchy |
| 10 | user-service | 3011 | Auth, roles, permissions |
| 11 | notification-service | 3012 | Email / SMS / in-app |
| 12 | identity-service | 3013 | ScotAccount / GOV.UK federation legs |

### 2.2 Fourteen directories in `services/`

The `services/` directory holds **14** entries, which is 12 logical services plus
two things that are *not* logical services:

- **`consolidated-api`** — a deployment shim (see §2.3). It holds no business
  logic and is excluded from coverage in `vitest.config.ts`.
- **`dotnet-api`** — an alternative .NET 9 implementation of a curated subset of
  the same API surface (see §4). It is deployed alongside the Node API as a
  separate service, but it is not a thirteenth bounded context.

So: **14 dirs = 12 logical + 1 deployment shim + 1 alternative implementation.**

### 2.3 The deployed shape: one container, not twelve

`services/consolidated-api/src/index.ts` imports the routers from all twelve
logical services and mounts them into a single Express app on port 3001. The file
is pure wiring: it imports each service's router and `init*Db()` function, installs
the shared security middleware and the default-deny gate, applies the per-mount
authorisation guards, seeds the database on first boot, starts the SLA worker, and
mounts the routers (`services/consolidated-api/src/index.ts:367-404`). Its own
closing log line states the intent plainly: *"All 12 services mounted on single
instance"* (`index.ts:493`).

The rationale is in the file header and is a sound engineering trade-off for a
free-tier demo:

> *"Twelve separate free services would mean twelve independent cold starts after
> the 15-minute idle spin-down; one container means one."*
> — `services/consolidated-api/src/index.ts:7-8`

Render's free plan idle-spins-down a web service after 15 minutes of inactivity. A
demo that fanned twelve bounded contexts across twelve free services would, on the
first click after a quiet period, pay twelve independent cold starts. Consolidating
into one container means a single cold start warms the entire API. The individual
services remain independently runnable for local development; consolidation is a
*deployment* concern only.

### 2.4 Deployment targets

Three artefacts deploy (confirmed in `render.yaml`):

| Artefact | Build | Target | Render service |
|----------|-------|--------|----------------|
| `consolidated-api` (all 12 routers) | `infra/azure/Dockerfile.api` | Render, free, Frankfurt | `iaas-api` |
| `dotnet-api` (.NET 9 curated subset) | `services/dotnet-api/Dockerfile` | Render, free, Frankfurt | `iaas-dotnet-api` |
| `apps/web` static export | Next.js static export | GitHub Pages | — |

Both Render services declare `plan: free`, a `/api/health` health-check path, and
`JWT_SECRET` as `sync: false` (set in the dashboard, never committed). The Node
service mounts a 1 GB persistent disk at `/data` for the SQLite database
(`render.yaml:35-38`).

One caveat worth flagging: the `render.yaml` comment on the .NET service still
reads *"full endpoint parity"* (`render.yaml:40`). As §4 shows, the honest
description is a **curated subset**. The comment overstates; the code does not.

---

## 3. The gateway is a BFF, not a dumb proxy

It is tempting to read "api-gateway" and "consolidated-api" as two names for the
same proxy. They are not, and the distinction matters.

**`consolidated-api` is pure wiring.** It owns no domain logic. It imports routers
and mounts them. That is why it is excluded from coverage: there is nothing in it
to unit-test beyond the mount order (which the integration tests exercise).

**`api-gateway` is a Backend-for-Frontend that holds real logic.** It is the one
service whose router carries behaviour the frontend genuinely depends on:

- **Authentication and the default-deny gate.** `enforceAuthentication`
  (`accessPolicy.ts`) authenticates every request except a small public
  allow-list (health/root, login + verify-mfa, and the anonymous applicant-intake
  the public `/apply` journey drives). Both the standalone gateway
  (`services/api-gateway/src/index.ts:60`) and the consolidated container
  (`services/consolidated-api/src/index.ts:138`) install the *same* gate, so they
  cannot drift on who is allowed in anonymously.
- **RBAC authorisation.** Per-mount permission guards (`requirePermission`,
  `requireAnyPermission`, `requirePermissionByMethod`) decide what an
  authenticated caller may do, method by method
  (`services/consolidated-api/src/index.ts:377-391`).
- **Rate limiting.** A loose global limiter (500 requests / 15 min, health-checks
  skipped) plus a tight, separately-scoped `authRateLimiter` on exactly the login
  and verify-MFA paths (`index.ts:104-129`, `352-355`).
- **Capability-token issuance.** The applications router issues a signed,
  application-scoped capability token at create time and verifies it on read /
  update / submit (`services/api-gateway/src/routes/applications.ts:36-52`). This
  is the mechanism that lets the anonymous `/apply` journey work without login
  while still closing the IDOR (see §6 and §10).
- **Response shaping and aggregation.** The gateway owns routes the individual
  services do not — the reports/export aggregate, the claims router, the postcode
  lookup, and the **CFT assessment endpoint** (`GET
  /api/applications/:id/cft-assessment`,
  `services/api-gateway/src/routes/applications.ts:348`), which maps a stored
  income/expenditure record onto the statutory `assessContribution` shape.
- **The SLA worker.** Started from the gateway (§7).

In short: `consolidated-api` decides *where a request goes*; `api-gateway` decides
*whether it is allowed, what it costs against the rate budget, and what comes
back*. The former is deployment plumbing; the latter is the product's security and
orchestration spine.

---

## 4. .NET curated-subset parity

`services/dotnet-api` is a .NET 9 implementation of the same API surface, written
in a CQS, vertical-slice style with MediatR. It demonstrates that the API contract
is implementation-agnostic — the frontend could point at either backend. What it
is **not** is a full reimplementation, and the review is explicit about that.

Measured against the source:

- **0 MVC controllers.** There is no `Controllers/` directory and no
  `[ApiController]` class. Every endpoint is a minimal-API `Map*` call.
- **11 vertical-slice feature modules** (`services/dotnet-api/Features/`):
  Applications, Audit, Auth, CreditCheck, Documents, Integrations, Notifications,
  Organisations, Payments, Recommendations, Users. Each module co-locates its
  commands/queries, handlers and endpoint registration.
- **17 business endpoints + 3 metadata endpoints = 20 total.** The 17 business
  endpoints are the `Map{Get,Post,Put,Delete,Patch}` calls inside `Features/`
  (7 GET, 9 POST, 1 PATCH). The 3 metadata endpoints are mapped in `Program.cs`:
  root (`/`), `/api/health` and `/api/smoke-test`
  (`services/dotnet-api/Program.cs:107-134`).
- **16 MediatR handlers** (`IRequestHandler` implementations across the eleven
  `Commands.cs` files).

Set this against the Node side's ~120 distinct Express endpoints and the picture is
unambiguous: **this is a curated subset demonstrating technology flexibility, not
full endpoint parity.** The `Program.cs` wires exactly eleven
`Map*Endpoints()` groups (`Program.cs:137-147`) — one per feature module — and
each exposes only the handful of operations needed to prove the pattern. The .NET
service shares the same database (SQLite locally, PostgreSQL when a reachable
`DATABASE_URL` is present) and the same `JWT_SECRET`, but it has not yet reached
token/MFA parity — a follow-on tracked in `render.yaml:54-55`.

The resilience detail in `Program.cs` is worth citing as a positive: the service
*probes* PostgreSQL on the startup path and falls back to SQLite if it is
unreachable, logging the downgrade rather than crashing (`Program.cs:42-71`). A
demo backend answering from SQLite beats one that will not start because a managed
database is cold — a pragmatic, honestly-commented choice.

---

## 5. Data model

### 5.1 Twenty-one tables

The relational model is **21 tables**, defined once in
`packages/database/src/schema.ts` (SQLite) and mirrored in
`packages/database/src/pg-schema.ts` (PostgreSQL):

**Identity & access (3):** `roles`, `permissions`, `role_permissions`
**Organisations & users (3):** `organisations`, `users`, `sessions`
**Core application domain (7):** `applications`, `applicants`, `addresses`,
`debts`, `assets`, `income_expenditure`, `recommendations`
**Supporting domain (5):** `documents`, `notes`, `claims`, `messages`, `payments`
**Cross-cutting (3):** `audit_events`, `notifications`, `sla_events`

### 5.2 Two engines, one logical schema

The data layer runs **SQLite as the runtime query engine** — synchronous, fast,
zero network latency, and the right fit for a single-container POC. **PostgreSQL
(Neon)** is initialised as a *persistent store* when `DATABASE_URL` is a
`postgresql://` URI, holding schema and seed data for an eventual async migration;
SQLite remains the live query path (`services/consolidated-api/src/index.ts:312-338`,
comment at `312-314`).

The two schemas are **hand-parallel**. There is no ORM-generated single source of
truth bridging them — `schema.ts` writes SQLite DDL and `pg-schema.ts` writes the
PostgreSQL equivalent (TEXT→TIMESTAMPTZ, REAL→DOUBLE PRECISION, INTEGER-flag→BOOLEAN,
inline `REFERENCES` instead of trailing `FOREIGN KEY`). The RBAC rows (roles,
permissions, grants) are seeded from a shared `./rbac` module so both engines grant
identical access (`schema.ts:385-389`) — a good instinct, because that is the one
place where a divergence would be a *security* bug rather than a performance one.

### 5.3 FLAG: PostgreSQL carries fewer indexes than SQLite

This is the measured finding. Counting secondary (`CREATE INDEX`) definitions:

- **SQLite: 24 secondary indexes** (`schema.ts:349-372`).
- **PostgreSQL: 10 secondary indexes** (`pg-schema.ts:28-37`; the file's own log
  line even announces *"21 tables + 10 indexes"*, `pg-schema.ts:39`).

That is a **gap of 14 indexes**. The PostgreSQL schema omits the following that
SQLite has (one name differs cosmetically — SQLite's `idx_applications_reference`
vs PG's `idx_applications_ref` — but covers the same column, so it is *not* counted
as missing):

```
idx_users_role          idx_assets_app
idx_users_org           idx_documents_app
idx_sessions_token      idx_claims_org
idx_organisations_type  idx_notif_read
idx_organisations_parent idx_audit_action
idx_applicants_app      idx_payments_app
idx_addresses_app       idx_debts_app
```

Several of these back hot query paths — `idx_payments_app`, `idx_documents_app`,
`idx_assets_app`, `idx_debts_app` and `idx_applicants_app` all index the
`application_id` foreign key that the case-detail screen joins on, and
`idx_sessions_token` backs session lookup on every authenticated request. On
SQLite today this is invisible (the dataset is a 100-application demo seed). The
risk is **query-plan divergence on migration**: code validated against SQLite's
plans would hit sequential scans on PostgreSQL for exactly the lookups that matter
most under load. This is cheap to fix (it is a copy-paste of fourteen `CREATE
INDEX IF NOT EXISTS` statements) and belongs on the roadmap as "PG index parity".

### 5.4 The rest of the data layer, by the numbers

- **12 repositories** (`packages/database/src/repositories/`): applications,
  audit, claims, documents, messages, notes, notifications, organisations,
  payments, recommendations, slaEvents, users — the repository pattern over both
  engines.
- **47 shared types** (`packages/shared-types/src/`) — the TypeScript contract
  (Application, Debtor, Financial, etc.) shared across apps and services.
- **21 Zod schemas** (`packages/validation/src/`) — input validation shared
  front-end and back-end, so the browser and the API reject the same bad input.
- **8 packages** (`packages/`): auth, database, integration-contracts,
  shared-types, statutory, test-data, ui-components, validation.
- **7 integration contracts + 1 orchestrator**: the mock clients under
  `packages/integration-contracts/src/mock/` are basys, cft, credit, das, eden,
  moratorium, roi (seven), swapped in by the factory pattern; the
  integration-orchestrator service runs them in parallel.

---

## 6. Resiliency patterns

For a POC these are modest but real, and they are the patterns that keep the demo
standing up:

- **Auto-seed on empty database.** On first boot the consolidated API counts
  `applications`; if the table is empty it runs the base seed, then — because the
  base seed only has a handful of rows — tops the dataset up to 100 synthetic
  Scottish applications with documents and assets
  (`services/consolidated-api/src/index.ts:148-307`). All of it is derived from
  the loop index (no `Math.random`), so the dataset is byte-identical on every
  boot and every test run. Seeding is `INSERT OR IGNORE`, so re-seeding never
  clobbers manual changes.
- **SLA demo seed.** Ten open-status cases are given a recommendation and assigned
  to the demo Case Officer so the SLA worker has something to act on at its first
  tick, using the real Jun/Jul 2026 submission dates so the statutory clocks are
  genuinely imminent against today — no fabricated dates
  (`index.ts:263-306`).
- **.NET store probe + fallback.** As noted in §4, the .NET service probes
  PostgreSQL and degrades to SQLite rather than failing to start
  (`Program.cs:42-71`).
- **Graceful frontend fallback.** The web app falls back to generated data when
  the backend is cold or unreachable, so a demo click never dead-ends on a spun-down
  free service.
- **SLA worker singleton guard.** The worker is a module-singleton `setInterval`
  that both API entry points call; the guard means it can never double-schedule
  (`services/api-gateway/src/sla/worker.ts:139-171`).
- **Capability-token continuity.** The applicant's capability token is captured on
  create, stored in `sessionStorage` keyed by application id, and carried through
  the `localStorage` pending-submission retry path, so an interrupted anonymous
  submission can resume without re-authenticating.
- **Idempotent migrations for persistent volumes.** Because the Render disk
  persists, `CREATE TABLE IF NOT EXISTS` never adds a *column*; the schema uses an
  `addColumnIfMissing` guard and purges withdrawn permission codes on every boot
  (`schema.ts:26-31`, `375-401`) so a disk created against an older schema
  self-heals.

---

## 7. The statutory SLA worker

The SLA worker is the clearest example of the architecture's "agree by
construction" instinct. Scottish statutory debt products carry hard deadlines (the
DAS 21-day objection window, the 120-day creditor-claims window, and so on). Three
different parts of the system need to agree about those clocks: the background
worker that fires reminders, the case screen that shows a caseworker where a case
stands, and the staff queue that badges overdue cases.

Rather than implement the deadline arithmetic three times, all three consume the
**same `@aib-iaas/statutory` engine**. The repository confirms the shared
dependency: the worker (`services/api-gateway/src/sla/worker.ts`), the SLA engine
it wraps (`sla/engine.ts`), the applications router that drives the case screen
(`routes/applications.ts`), the recommendation rules
(`recommendation-service/src/engine/rules.ts`) and the frontend case-detail
component (`apps/web/src/app/case/[ref]/components/StatutoryDeadlines.tsx`) all
import it. Because the clock is computed in one pure engine, the worker, the case
screen and the queue cannot disagree about when a deadline falls — the agreement
is structural, not a convention someone has to remember.

The worker itself is well-factored for a background job:

- `runTick(repos, now)` is the testable unit. `now` is injected, so a test can
  back-date a case, pin the clock, and assert exactly which reminders fire
  (`worker.ts:110-135`).
- It is **idempotent by construction**: each milestone is recorded in the
  `sla_events` ledger inside a transaction, and the audit event and notification
  are written *only when the INSERT actually wrote a row*. Gating on the write
  result (not a pre-read set) closes the race where two ticks hit the same
  milestone — the `UNIQUE (application_id, deadline_kind, milestone)` constraint
  is the real guarantee (`worker.ts:33-75`; constraint at `schema.ts:343`).
- It **never transitions a case.** Raising awareness is the whole job, because the
  expiries are legal acts a permissioned human must action (`worker.ts:7-10`).
- Each case is wrapped in `try/catch` so one bad row cannot halt the sweep
  (`worker.ts:118-127`).

The default cadence is five minutes, with an initial tick three seconds after boot
so the demo lights up without waiting a full interval, and the timer is `unref`'d
so it alone never keeps the process alive (`worker.ts:147-171`).

---

## 8. Identity architecture

Identity is the area where the review most needs to separate "real path" from
"scaffolding", because the repository contains both and only one is wired.

- **The live federation path is an in-process OIDC / GOV.UK One Login mock IdP**
  under `services/api-gateway/src/oidc`. It implements the real protocol
  primitives: RS256 token signing, a JWKS endpoint, and PKCE with S256 challenge
  verification (grep over `mockIdp.ts` confirms RS256, JWKS, PKCE and S256
  markers). The OIDC router is mounted ahead of the password auth routes so the
  whole handshake is owned by `oidcRouter` while the password endpoints are left
  untouched (`services/consolidated-api/src/index.ts:369-372`). This is the
  federation leg that actually executes — tracked as **GAP-007**.
- **Keycloak is scaffolding only.** There is a realm export at
  `infra/keycloak/realm-export.json`, but nothing wires it into the running
  system. It documents an intended production IdP; it is not the live path.
- **There is no root `docker-compose.yml`.** The only compose file is
  `infra/docker/docker-compose.yml`. Any documentation implying a root-level
  compose stack is wrong.

The honest framing: the OIDC mock IdP is a genuine, protocol-correct demonstration
of the federation *mechanics*, but it is still a mock — real ScotAccount / One
Login federation is a known gap (§10).

---

## 9. Deployment and cost

- **Hosting:** Render free tier, Frankfurt region, for both the Node consolidated
  API (`iaas-api`) and the .NET API (`iaas-dotnet-api`); the web app is a static
  export on GitHub Pages (`render.yaml`).
- **Monthly cost: £0.** Free plan on both services, Pages is free, Neon's free
  tier for the persistent PostgreSQL store.
- **The cold-start trade-off** is the defining cost decision (§2.3). The free plan
  idle-spins-down after 15 minutes; consolidating twelve bounded contexts into one
  container means one cold start instead of twelve. The price paid is that the
  twelve contexts cannot be scaled or deployed independently in this shape — which
  is exactly the right trade for a demo and exactly the wrong one for production.
- **Secrets:** `JWT_SECRET` is `sync: false` on both services (set in the Render
  dashboard, never committed); the signing helper refuses the dev secret in
  production, so a misconfigured deploy fails closed rather than signing tokens
  with a known key.
- **Integration mode is pinned to `mock`** in the deploy env (`render.yaml:21-22`),
  because `INTEGRATION_MODE=live` is unimplemented and throws (§10).
- **Migration path:** the natural production shape is to split the twelve routers
  back into per-service containers (they are already independently runnable) on a
  paid tier or per-service ECS/Fargate tasks, promote Neon PostgreSQL from
  persistent-store to runtime engine, and move document storage from local disk to
  S3. The code is structured so this is a deployment change, not a rewrite — the
  routers already stand alone, and the repository pattern already abstracts the
  database engine.

---

## 10. Architecture risks and recommendations

The residual risks below are stated honestly; each ties to a concrete roadmap
item. None is a surprise — they are the gaps between a POC and a production system.

| # | Risk / gap | Evidence | Recommendation |
|---|------------|----------|----------------|
| R1 | `INTEGRATION_MODE=live` is unimplemented and throws; only `mock` works. All external systems (BASYS, eDEN, DAS, CFT, Moratorium, RoI, CRA) are simulated. | `DOCUMENTATION_GAP_ANALYSIS.md` §2; `render.yaml:21-22` pins `mock`. | **Finish the live factory path.** The contract/factory split (`packages/integration-contracts`) is already in place; implement real clients behind the same seven interfaces so the swap is a config change. |
| R2 | PostgreSQL carries 14 fewer indexes than SQLite (10 vs 24). Query-plan divergence risk on migration. | §5.3; `schema.ts:349-372` vs `pg-schema.ts:28-37`. | **PG index parity.** Copy the fourteen missing `CREATE INDEX IF NOT EXISTS` statements into `pg-schema.ts`. Low effort, meaningful de-risking of the migration. |
| R3 | Real IdP federation is still a mock (GAP-007). The OIDC mock IdP is protocol-correct but not a real relying-party integration; Keycloak is unwired scaffolding. | §8; `services/api-gateway/src/oidc`, `infra/keycloak/realm-export.json`. | **Wire a real IdP.** Promote the OIDC leg to a genuine ScotAccount / GOV.UK One Login relying-party registration; decide Keycloak in-or-out and remove the scaffold if out. |
| R4 | Org-boundary RBAC isolation is partial — role-based, not fully tenant-scoped on every route. | `SECURITY_AUDIT.md` §5 (residual risks). | **Complete tenant scoping.** Add organisation-boundary checks to every multi-org resource so an adviser/creditor cannot read across organisations even with the right role. |
| R5 | Browser-stored session/capability tokens are XSS-exfiltratable in principle; mitigated by the strict CSP and the markdown-escaping fix, not eliminated. | §6; `SECURITY_AUDIT.md` §5. | Move to `HttpOnly` cookies for session tokens as part of the real-IdP work; keep the capability token's short, application-scoped blast radius. |
| R6 | Document upload filtering is extension-only beyond the ClamAV simulation (no deep content/MIME sniffing). | `SECURITY_AUDIT.md` §5. | Add magic-byte/content sniffing and wire a real AV engine when storage moves to S3. |
| R7 | The `render.yaml` comment claims the .NET service has "full endpoint parity"; it is a curated subset (17 business + 3 metadata endpoints, 16 handlers). | §4; `render.yaml:40` vs `Program.cs`. | Correct the comment, or decide whether the .NET API is a parity target or a flexibility demonstrator — and document that decision. |
| R8 | Single-container deployment cannot scale or deploy the twelve contexts independently. | §2.3, §9. | Accept for the POC; the migration path (§9) splits them back out for production. |
| R9 | Dependency hygiene: bump axios ≥ 1.7 and run `npm audit` in CI. | `SECURITY_AUDIT.md` §5. | Add `npm audit` to the CI pipeline and remediate. |
| R10 | Documentation drift was systemic — counts conflated logical vs physical services and Vitest vs Playwright test figures. | CLAUDE.md testing notes; `SECURITY_AUDIT.md` §5. | **Keep the single source of truth.** Every stated number must be verifiable against the repo; this review and `DOCUMENTATION_GAP_ANALYSIS.md` re-baselined the hard numbers. |

### Closing assessment

For a POC, the architecture is coherent and honest. Its strongest feature is that
the gap between how it is developed (twelve independent bounded contexts) and how
it is deployed (one container) is bridged by *shared code* — the same auth gate,
headers, RBAC guards and statutory engine mounted into both shapes — so the two
cannot silently diverge. Its security posture (default-deny gate, HS256 pinned-alg
JWT, bcrypt-12 with timing equalisation, real TOTP MFA, logout revocation,
capability-token IDOR fixes, parameterised SQL, strict CSP, scoped rate limiting)
is well above what a demo needs. The weaknesses are concentrated, catalogued, and
each one is a "finish the scaffolded thing" rather than a design flaw. The
recommended next steps — live integration mode, PG index parity, a real IdP,
complete org-boundary RBAC, and admin-portal consolidation — turn the POC into a
production candidate without a rewrite.
