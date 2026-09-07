# Sprint Delivery Log

## Overview

This document records what was delivered in each sprint of the AiB IAAS POC development.

| Sprint | Theme | Status | Pages Added | Tests Added |
|--------|-------|--------|-------------|-------------|
| 1 | Operational Beta | ✅ Complete | — | — |
| 2 | Robustness & Offline | ✅ Complete | +4 | — |
| 3 | Production Readiness | ✅ Complete | +3 | — |
| 4 | Intelligent Platform | ✅ Complete | +1 | — |
| 5 | Live Verification | ✅ Complete | +2 | — |
| 6 | Scale & Security | ✅ Complete | +5 | — |
| 7 | AI Showcase | ✅ Complete | — | — |
| 8 | Enterprise Polish | ✅ Complete | +3 | — |
| 9 | Platform Completeness | ✅ Complete | +4 | — |
| 10 | Final Integration | ✅ Complete | +2 | — |
| 11 | Test & Document | ✅ Complete | — | +102 |
| 12 | Operational Excellence | ✅ Complete | — | +78 |
| 13 | Handover & Scale | ✅ Complete | — | — |
| 14 | Stakeholder Value | ✅ Complete | +7 | +60 |
| 15 | Quality Assurance & Link Integrity | ✅ Complete | — | +10 |
| 16 | Documentation Alignment | ✅ Complete | — | — |
| 17 | Test Infrastructure Expansion | ✅ Complete | — | +10 |
| 18 | .NET Backend | ✅ Complete | — | — |
| 19 | Enterprise Persistence | ✅ Complete | — | — |
| 20 | Live Deployment | ✅ Complete | — | — |
| 21 | Data Comes Alive | ✅ Complete | +1 | — |
| 22 | Demo Enhancement | ✅ Complete | — | — |
| 23 | Admin Functionality | ✅ Complete | +2 | — |
| 24 | Interactive Admin | ✅ Complete | +2 | — |
| 25 | Polish & Safety | ✅ Complete | +1 | — |
| 26 | Real-Time & Notifications | ✅ Complete | — | — |
| 27 | Casework Workflow | ✅ Complete | — | — |
| 28 | Production Polish | ✅ Complete | — | — |
| 29 | Enterprise Showcase | ✅ Complete | +2 | — |
| 30 | Security Remediation | 🚧 In progress | — | — |
| 31 | Shared Database | ✅ Complete | — | +15 |
| 32 | Trustworthy Identity | ✅ Complete | — | +42 |
| 33 | Ownership & Validation | ✅ Complete | — | +47 |
| 34 | Real Data, Real Numbers | ✅ Complete | — | +56 |
| 35 | Honest Output, Operable Deployment | ✅ Complete | — | +166 vitest, +57 xunit |

**Totals: 65+ pages, 50+ features, 1,317 vitest tests across 66 files plus 57 xunit tests, 60 docs, 12+ AI capabilities**

---

## Sprint 1 — Operational Beta

**Goal**: Get a live backend that persists data, connected to the deployed frontend.

### Delivered:
1. PostgreSQL-ready database package (`packages/database`) with repository pattern
2. 14-table schema (users, roles, applications, applicants, debts, assets, documents, recommendations, audit, payments, etc.)
3. JSON seed data (5 orgs, 6 users, 9 roles, sample applications)
4. Integration contracts package (`packages/integration-contracts`) — factory pattern for mock↔real switching
5. All 4 service db/index.ts files rewritten to use `@aib-iaas/database`
6. All route handlers rewritten (applications, auth, audit, organisations, users, roles)
7. Docker Compose with PostgreSQL 16 + Keycloak 25
8. Keycloak realm-export.json (10 users, 9 roles, 3 clients, MFA policy)
9. Render.com deployment (render.yaml, Dockerfile fix)
10. Live API at https://iaas-api.onrender.com
11. CORS configured for GitHub Pages origin
12. Auto-seed on first boot

### Key Files:
- `packages/database/` (entire package)
- `packages/integration-contracts/` (entire package)
- `services/*/src/routes/*.ts` (all rewritten)
- `render.yaml`, `infra/azure/Dockerfile.api`

---

## Sprint 2 — Robustness & Offline Fallback

**Goal**: Handle Render free tier cold starts gracefully. Make the UX feel professional.

### Delivered:
1. API Connection Status Bar (green/amber/gray below BETA banner)
2. Loading Skeleton components (SkeletonCard, SkeletonTable, SkeletonText)
3. Dashboard graceful degradation ("Backend waking up...", auto-retry every 10s)
4. Apply page offline fallback (localStorage save, auto-retry on reconnect)
5. PDF Export for recommendation page (print-optimized CSS)
6. Caseworker staff notes (textarea, add note, timestamped list)
7. Case assignment flow (dropdown, assign button, assignee badge)
8. Email notification simulation (envelope icons, sent/pending badges per case stage)

### Key Files:
- `apps/web/src/app/ApiStatus.tsx`
- `apps/web/src/app/components/Skeleton.tsx`
- `apps/web/src/app/case/[ref]/components/NotificationPanel.tsx`
- `apps/web/src/app/case/[ref]/recommendation/PdfExport.tsx`
- `apps/web/src/app/globals.css` (print styles)

---

## Sprint 3 — Production Readiness

**Goal**: Real authentication, role-based access, monitoring.

### Delivered:
1. Real auth flow — login form calls live API, stores JWT token, redirects
2. Demo accounts section (4 pre-configured accounts with one-click fill)
3. AuthGuard component — role-based page protection
4. Admin pages require "staff" role (AuthGuard wrapper)
5. Dashboard shows "Log in for personalised view" banner when unauthenticated
6. Email notification log per case (Delivered/Pending/Failed badges)
7. Enhanced document upload (file picker, progress bar, virus scan simulation, offline queue)
8. Rate limit banner (amber at 80 calls, red at 100, 15-min window)
9. Enhanced API status monitoring (response times, slow detection, uptime counter)
10. Session expiry handling (401 clears auth, shows toast, redirects)
11. `logout()` function (clears all state)

### Key Files:
- `apps/web/src/app/login/page.tsx` (rewritten)
- `apps/web/src/app/AuthGuard.tsx`
- `apps/web/src/app/components/RateLimitBanner.tsx`
- `apps/web/src/app/case/[ref]/components/EmailLog.tsx`
- `apps/web/src/lib/apiClient.ts` (session management, rate tracking)

---

## Sprint 4 — Intelligent Platform

**Goal**: Make the system actively help users. Show AI-readiness.

### Delivered:
1. Real-Time Eligibility Indicator — live product prediction as user fills in debts/income (floating sidebar)
2. Debtor Risk Score — SVG semi-circle gauge on case detail (credit + debt-to-income + existing cases)
3. Automated Case Prioritisation — urgent/high/normal/low badges, sorted by priority
4. Guided Decision Support — interactive 6-step checklist for caseworkers (auto-checks from data)
5. Applicant Communication Portal — `/my-application` with progress tracker, messages, documents
6. Real-Time Analytics Animation — "LIVE" badge, KPI counters tick up every 10 seconds
7. Predictive Processing Time — "Est. completion: ~5 working days" per case
8. Smart Auto-Calculate Disposable Income — real-time coloured display (green/amber/red)

### Key Files:
- `apps/web/src/app/apply/page.tsx` (eligibility indicator, disposable income)
- `apps/web/src/app/case/[ref]/CaseDetail.tsx` (risk score, decision support, predictive time)
- `apps/web/src/app/dashboard/page.tsx` (case prioritisation)
- `apps/web/src/app/my-application/page.tsx` (new)
- `apps/web/src/app/statistics/page.tsx` (live animation)

---

## Sprint 5 — Live Verification

**Goal**: PWA, accessibility, API documentation, monitoring.

### Delivered:
1. PWA Manifest — app is installable on mobile/desktop
2. WCAG 2.1 Accessibility Fixes — chart tooltip contrast, focus-visible outlines, lang attributes
3. Smoke Test Endpoint — `/api/smoke-test` returns DB connectivity + table counts
4. Status Badges — shields.io badges in README (API + Frontend)
5. Error Tracking — lightweight `captureError()` module (Sentry-ready)
6. Interactive API Documentation Page — `/api-docs` with "Try it" buttons for all endpoints
7. OpenAPI Specification Page — `/api-docs/openapi` with full endpoint reference
8. Architecture page links — Live API + API Docs prominently linked

### Key Files:
- `apps/web/public/manifest.json`
- `apps/web/src/app/api-docs/page.tsx`
- `apps/web/src/app/api-docs/openapi/page.tsx`
- `apps/web/src/lib/errorTracking.ts`
- `services/consolidated-api/src/index.ts` (smoke-test endpoint)
- `apps/web/src/app/globals.css` (WCAG fixes)

---

## Sprint 6 — Scale & Security

**Goal**: Production security features without external service signups.

### Delivered:
1. Enhanced MFA UX — 6-digit TOTP code entry screen after login, "Powered by Keycloak" badge
2. Multi-Language Toggle — EN/GD (English/Scottish Gaelic) with translated home page + nav
3. OpenAPI Specification — full endpoint documentation at `/api-docs/openapi`
4. Webhook System — `/admin/webhooks` with registration, event types, delivery log
5. API Key Management — `/admin/api-keys` with generate/revoke, scopes, masked display
6. Per-User Rate Limiting — enhanced banner with usage progress bar + countdown timer
7. Session Management — `/account/sessions` with active devices, revoke, expiry countdown
8. Security Headers Dashboard — `/admin/security-headers` showing Helmet.js configuration

### Key Files:
- `apps/web/src/app/login/page.tsx` (MFA step)
- `apps/web/src/app/LanguageToggle.tsx`
- `apps/web/src/app/admin/webhooks/page.tsx`
- `apps/web/src/app/admin/api-keys/page.tsx`
- `apps/web/src/app/admin/security-headers/page.tsx`
- `apps/web/src/app/account/sessions/page.tsx`

---

## Sprint 7 — AI Showcase

**Goal**: Maximize visible AI capability for demo differentiation.

### Delivered:
1. AI Chatbot Widget — floating FAQ assistant with pattern-matching (12+ topics, typing indicator, suggested questions)
2. AI Case Summary — auto-generated natural language summary from case data (first section in case detail)
3. Anomaly Detection Alerts — dashboard cards showing income discrepancies, duplicate applications, SLA warnings
4. AI Quality Check — 6 automated pre-decision checks before approve/reject (documents, income, conflicts, confidence, identity, credit)
5. Predictive Case Outcomes — "87% likely approved" SVG progress ring badge in case header

### Key Files:
- `apps/web/src/app/components/AiChatbot.tsx` (new)
- `apps/web/src/app/case/[ref]/CaseDetail.tsx` (AI summary, quality check, predictions)
- `apps/web/src/app/dashboard/page.tsx` (anomaly alerts)

---

## Sprint 8 — Enterprise Polish

**Goal**: Production-quality UX, data management, and batch capabilities.

### Delivered:
1. User account page with notification subscription management (role-specific preferences)
2. Dynamic sign-in button replacing static nav links
3. AiB logo as browser tab favicon across all pages
4. Data export functionality (CSV/JSON with field selection)
5. Batch processing queue with progress tracking
6. Enhanced admin hub with 28 features accessible from single grid

---

## Sprint 9 — Platform Completeness

**Goal**: Fill remaining functional gaps, expand admin capabilities.

### Delivered:
1. Compliance dashboard with regulatory requirement tracking
2. Training mode sandbox for new staff onboarding
3. Release notes page with version history and changelog
4. Integration monitor with real-time status of all 6 legacy systems
5. Performance metrics dashboard (response time percentiles, throughput)
6. Comprehensive test suite expansion (321+ tests maintained)

---

## Sprint 10 — Final Integration

**Goal**: Documentation, demo readiness, final polish.

### Delivered:
1. Onboarding guide for new team members
2. Stakeholder demo script (10-minute walkthrough)
3. Complete functionality breakdown (50+ pages documented)
4. Role-specific notification subscriptions on account page
5. Final broken link fixes (home page Apply button, favicon path)
6. README rewrite with updated metrics and sprint table

---

## Sprint 11 — Test & Document

**Goal**: Comprehensive test coverage and documentation for handover readiness.

### Delivered:
1. 102 new automated tests (bringing total from 321 to 423)
2. Onboarding guide for new developers joining the project
3. Demo script for 10-minute stakeholder walkthrough
4. Complete functionality breakdown documenting all 50+ pages
5. Test coverage report generation (89% line coverage)
6. Integration test suite for API gateway endpoints
7. Unit tests for recommendation engine rules

### Key Metrics:
- Tests added: 102 (423 total)
- Coverage: 89% lines
- Documentation files added: 4

---

## Sprint 12 — Operational Excellence

**Goal**: Production-grade testing, operational runbooks, and security hardening.

### Delivered:
1. 78 Playwright E2E regression tests (bringing total from 423 to 501)
2. Operational runbooks (incident response, deployment, rollback, scaling)
3. Automated security scan (dependency audit, OWASP headers check)
4. Load test results (500 concurrent users, <2s response time)
5. Disaster recovery plan with RTO/RPO targets
6. Monitoring and alerting configuration documentation
7. On-call rotation template

### Key Metrics:
- Tests added: 78 (501 total)
- E2E scenarios covered: 78 user journeys
- Runbooks created: 5
- Load test peak: 500 concurrent users

---

## Sprint 13 — Handover & Scale

**Goal**: Architecture documentation, cost modelling, and production readiness planning for team handover.

### Delivered:
1. Architecture Decision Records (10 ADRs documenting key technical choices)
2. Cost model with projections at 4 scales (POC → 10,000 users)
3. Team scaling guide (1 FTE → 10 FTE across 4 phases)
4. Cloud vendor assessment (AWS vs Azure vs GCP with recommendation)
5. Go-live checklist (60 items across 7 categories)
6. API & SDK guide (authentication, endpoints, examples, rate limiting)

### Key Files:
- `docs/architecture-decisions.md`
- `docs/cost-model.md`
- `docs/team-scaling-guide.md`
- `docs/vendor-assessment.md`
- `docs/go-live-checklist.md`
- `docs/api-sdk-guide.md`

---

## Sprint 14 — Stakeholder Value

**Goal**: Demonstrate full ecosystem awareness — not just debtors, but creditors, advisers, and management.

### Delivered:
1. Creditor Portal — interface demonstration on synthetic data: case list, dividend schedule and proposal list. Claim submission is a placeholder form; proposal voting is not implemented.
2. Money Adviser Workspace — interface demonstration on synthetic data: 8-client caseload, appointment list and recent activity. "Submit on Behalf" links to the standard citizen wizard; submitting against a named client with a declaration of authority is not implemented (see UC-09).
3. Visual Workflow Engine — CSS state machine with transition rules and SLA timers
4. MI Reports — management KPIs, staff performance, SLA breaches, export
5. Debtor Secure Messages — encrypted thread with AiB officers
6. Integration Health Monitor — live status of all 6 AiB system connections
7. Correspondence Scheduler — automated letter rules with calendar
8. Admin hub updated to 32 feature cards

### Key Metrics:
- Tests added: 60 (bringing total from 501 to 600+)
- New pages: 7 (creditor portal, adviser workspace, workflow engine, MI reports, messages, integration monitor, correspondence scheduler)
- Admin features expanded: 28 → 32

---

## Phase 14 — Organisation Service

**Goal**: Demonstrate shared master data / microservice pattern for creditors.

### Delivered:
1. Organisation Service — 54 seeded organisations across 8 types
2. Creditor Type-Ahead — auto-suggest in debt entry form
3. Organisation utility functions (search, filter by type, get by ID)
4. Demonstrates service-oriented architecture pattern

---

## Sprint 15 — Quality Assurance & Link Integrity

**Goal**: End-to-end link audit, navigation correctness, and regression prevention.

### Delivered:
1. Playwright E2E link audit test suite (10 scenarios covering nav, admin, case pages, footer)
2. basePath correctness validation across all internal links
3. Undefined-href detection (no links contain "undefined")
4. Admin back-link path verification
5. Notification page load verification
6. My-application case link validation

### Key Metrics:
- Tests added: 10 (bringing total from 648 to 658+)
- New test file: `tests/e2e/links-audit.spec.ts`
- Zero broken links confirmed

---

## Sprint 16 — Documentation Alignment

**Goal**: Ensure all project documentation reflects current state accurately.

### Delivered:
1. Sprint delivery log updated with Sprints 15-17
2. Roadmap sprint status table updated
3. Testing documentation updated with current test counts
4. README sprint table updated with latest deliverables
5. Cumulative metrics aligned across all docs

### Key Metrics:
- Documentation files updated: 4
- Sprint table rows added: 3
- Test count aligned: 658+ across 48 files

---

## Sprint 17 — Test Infrastructure Expansion

**Goal**: Expand E2E coverage to catch regressions in navigation and routing.

### Delivered:
1. Link audit spec covering 10 distinct navigation scenarios
2. Admin hub feature link count assertion (28+ links)
3. Case page content verification for multiple case refs
4. Rules detail page deep-link testing
5. Footer link presence validation
6. Cross-page navigation integrity checks

### Key Metrics:
- E2E test scenarios: 10 new link audit tests
- Pages covered: 8 distinct routes tested
- Regression prevention: automated link integrity checks in CI

---

## Sprint 18 — .NET Backend

**Goal**: Demonstrate enterprise-grade .NET alternative backend with full feature parity.

### Delivered:
1. Full .NET 9 Web API with MediatR + CQS pattern
2. 11 endpoint modules (Applications, Auth, Audit, Organisations, Users, Recommendations, Integrations, Documents, Payments, CreditCheck, Notifications)
3. Entity Framework Core with dual SQLite/PostgreSQL support
4. Swagger/OpenAPI documentation auto-generated
5. Health check endpoint for monitoring
6. Polly resilience policies, Serilog structured logging, FluentValidation

### Key Files:
- `services/dotnet-api/` (entire project)
- `services/dotnet-api/Program.cs`
- `services/dotnet-api/Endpoints/`
- `services/dotnet-api/Data/ApplicationDbContext.cs`

---

## Sprint 19 — Enterprise Persistence

**Goal**: Move from ephemeral SQLite to cloud-hosted PostgreSQL for data durability across deploys.

### Delivered:
1. Neon PostgreSQL integration (free tier, 0.5GB)
2. pg-schema.ts — 14 tables + 5 indexes created programmatically
3. pg-seed.ts — 9 roles, 5 orgs, 6 users seeded
4. pg-connection.ts — Pool singleton with SSL
5. init-neon.ts script for one-command database setup
6. Consolidated API syncs to Neon on startup

### Key Files:
- `services/consolidated-api/src/db/pg-schema.ts`
- `services/consolidated-api/src/db/pg-seed.ts`
- `services/consolidated-api/src/db/pg-connection.ts`
- `scripts/init-neon.ts`

---

## Sprint 20 — Live Deployment

**Goal**: Deploy .NET API to cloud hosting with real PostgreSQL connection.

### Delivered:
1. .NET API deployed to Render (Docker container)
2. Dockerfile uses dynamic PORT env var (shell entrypoint for Render compatibility)
3. postgresql:// URI converted to ADO.NET format for Npgsql
4. EF Core entities mapped to existing Neon snake_case schema
5. IsDeleted/RowVersion added to Application model for soft-delete and concurrency

### Key Files:
- `services/dotnet-api/Dockerfile`
- `services/dotnet-api/Data/ApplicationDbContext.cs`
- `render.yaml`

---

## Sprint 21 — Data Comes Alive

**Goal**: Wire the frontend to live data — search, case detail, and actions hit real APIs.

### Delivered:
1. 100 applications seeded into SQLite at API startup
2. 100 applications seeded into Neon PostgreSQL
3. Search page hits API first, falls back to seed data
4. Case detail approve/reject/notes wired to live API
5. render.yaml updated with iaas-dotnet-api service
6. Frontend backend toggle — 3 options (Node, .NET, Mock) with health indicator

### Key Files:
- `services/consolidated-api/src/db/seed-100.ts`
- `apps/web/src/app/search/page.tsx`
- `apps/web/src/app/case/[ref]/CaseDetail.tsx`
- `apps/web/src/app/components/BackendSelector.tsx`

---

## Sprint 22 — Demo Enhancement

**Goal**: Make the guided demo visually impressive — auto-scroll, sequential reveals, realistic timing.

### Delivered:
1. Demo mode page scrolls to follow field population (was stuck at top)
2. Debts — 3 creditors added sequentially with scroll following
3. Assets — property, vehicle, savings appear one-by-one
4. Documents — 2 visible file uploads with progress bars
5. Recommendation — button click + loading spinner + result after 2.5s
6. Payment — Apple Pay selected + confirmed before submit
7. PDF download triggered during demo

### Key Files:
- `apps/web/src/app/apply/page.tsx` (demo orchestration)
- `apps/web/src/app/apply/DemoController.tsx`

---

## Sprint 23 — Admin Functionality

**Goal**: Wire admin pages to real backend operations — reports, user creation, data retention.

### Delivered:
1. Report Builder — 100 cases, 6 quick-start tiles, generated report with stats/table/CSV
2. User Management — Create User wired to POST /api/users (persists to Neon)
3. Data Retention — editable policies + Add Credit Checks (3yr max, readonly type)
4. Dev docs — C4 diagram fallback, zoom modal, download .md

### Key Files:
- `apps/web/src/app/admin/report-builder/page.tsx`
- `apps/web/src/app/admin/user-management/page.tsx`
- `apps/web/src/app/admin/data-retention/page.tsx`
- `apps/web/src/app/dev-docs/page.tsx`

---

## Sprint 24 — Interactive Admin

**Goal**: Add rich interactive visualisations and signature capture to the admin portal.

### Delivered:
1. Activity Heatmap — GitHub-style with hover tooltips (system breakdown), click drill-down
2. Digital Signature — canvas drawing, document selection, audit log persisted
3. Statistics time period buttons (7d/30d/90d/12m) now update all charts and KPIs
4. Data Retention — delete Credit Checks policy for demo re-runs

### Key Files:
- `apps/web/src/app/admin/activity-heatmap/page.tsx`
- `apps/web/src/app/admin/digital-signature/page.tsx`
- `apps/web/src/app/statistics/page.tsx`
- `apps/web/src/app/admin/data-retention/page.tsx`

---

## Sprint 25 — Polish & Safety

**Goal**: Fix UX issues discovered during live demos — correctness, safety, and data export rewrite.

### Delivered:
1. Admin page shows actual logged-in user (was hardcoded Karen MacLeod)
2. Backend selector hides localhost on deployed site, health-checks before switching
3. Data Export page rewritten — 100 cases, search by name/ref/status/date, sort, CSV, Print/PDF

### Key Files:
- `apps/web/src/app/admin/page.tsx`
- `apps/web/src/app/components/BackendSelector.tsx`
- `apps/web/src/app/admin/data-export/page.tsx`

---

## Sprint 26 — Real-Time & Notifications

**Goal**: Things update without refresh. Notifications appear.

### Delivered:
1. Toast notification system (ToastProvider + useToast hook)
2. Notification bell in nav with unread count + dropdown panel
3. Dashboard auto-refresh every 30s with "Last updated X seconds ago" indicator
4. useNotifications hook polling /api/notifications

---

## Sprint 27 — Casework Workflow

**Goal**: Staff can manage cases efficiently with batch actions and SLA visibility.

### Delivered:
1. Batch select (checkbox column) with Batch Approve/Reject
2. SLA timer column (green ≤3d, amber ≤5d, red >5d)
3. Select-all header checkbox

---

## Sprint 28 — Production Polish

**Goal**: Handle failures gracefully. Load fast. Look enterprise-ready.

### Delivered:
1. LoadingSkeleton components (Card, Table, Dashboard, Page variants)
2. ApiErrorBoundary with retry button
3. OfflineBanner (red bar when browser offline)
4. Service worker (sw.js) for stale-while-revalidate caching
5. useApiCall hook with loading/error/retry pattern

---

## Sprint 29 — Enterprise Showcase

**Goal**: Demonstrate enterprise-grade operational maturity.

### Delivered:
1. API Versioning page (v1 current, v0 deprecated, rate limit docs, endpoint catalogue)
2. Monitoring & Observability page (5 uptime monitors, distributed tracing, alert history)
3. All on free tiers (UptimeRobot + Grafana Cloud)

---

## Sprint 30 — Security Remediation (In Progress)

**Goal**: Close the gap between the POC implementation and the documented security case.

Tracked in full, with file-and-line evidence, in
[security-known-gaps.md](./security-known-gaps.md). Summarised here because the sprint is partially
landed and the register is the source of truth for what remains.

### Delivered:
1. GAP-011 (part) — role-permission grants consolidated into one definition in
   `packages/database/src/rbac.ts`, replacing three disagreeing copies that left three roles with no
   permissions on SQLite and every role with none on PostgreSQL
2. GAP-011 (part) — permission vocabulary corrected; `api-gateway` asked for `reports.view`, a code no
   role has ever held, so the only authorised route in the repo returned 403 to everyone including
   `system_admin`. It now asks for the seeded `reports.read`
3. Schema parity tests (`packages/database/src/__tests__/schemaParity.test.ts`) and RBAC reference-data
   tests (`rbac.test.ts`) to stop the grant definitions drifting apart again

### Residual (open):
Four items remain — see the "Residual work" section of the register. The nine production-blocking
findings are **not** yet closed, so the hard gate stands: no environment may hold real debtor data.

---

## Sprint 31 — Shared Database

**Goal**: Make the Node API actually serve queries from PostgreSQL, so both backends can share one
Neon database instead of each holding its own.

Sprints 19 and 21 described persistence as complete. That was true of the schema, seeding and pooled
connection, but not of query serving: `isPostgresEnabled()` and `getPgPool()` were exported and called
by no service, so setting `DATABASE_URL` on the Node service seeded a Neon database that nothing then
read.

### Delivered:
1. `packages/database/src/driver.ts` — one async query surface over both backends, exported from the
   package and wired into `createRepositories()`, which now selects its driver from `isPostgresEnabled()`
2. All 7 repositories migrated off `better-sqlite3` (64 public methods now `async`, 1,608 lines)
3. All 51 repository call sites across 7 route files awaited, and their handlers made `async`
4. Raw-SQL escape hatches converted: `api-gateway`'s dashboard aggregates and `consolidated-api`'s demo
   seed now go through the driver, with dialect-appropriate date arithmetic and upserts
5. `initialiseDatabase()` awaited during each service's bootstrap, before `app.listen`

### Defects found and fixed en route:
6. **`PostgresDriver.transaction()` did not transact.** It opened `BEGIN` on a dedicated client but
   passed its callback no argument, so every statement inside went back through the pool — a different
   connection — and autocommitted outside the transaction. `application.create()` writes an applicant,
   addresses, debts, assets and income/expenditure, so a mid-way failure would have left a partial
   application with nothing to roll back. The callback now receives a driver bound to that client
7. **Boolean binds.** `is_current`, `is_essential` and `mfa_enabled` were bound as `1`/`0`. PostgreSQL
   declares all three `BOOLEAN` and rejects an integer, so every write touching an address, asset or
   user would have failed. Repositories now bind the boolean; the SQLite adapter converts
8. **Timestamp types.** `pg` hydrates `TIMESTAMPTZ` into a `Date`, better-sqlite3 returns the stored
   string, and the row mappers passed both straight through — so the same endpoint would have
   serialised a different shape per backend, silently. Normalised to ISO strings in the adapter rather
   than by retyping the columns, which would have broken the .NET API's EF Core `DateTime` mapping
9. **`COUNT(*)` as a string.** PostgreSQL returns it as a bigint and `pg` hands back a string rather
   than lose precision. Every pagination total and dashboard count is now `Number()`-wrapped; without
   it `totalPages` would have concatenated instead of divided, and `"0"` being truthy would have
   stopped an empty database from ever seeding
10. **Two handlers had no `try/catch`** (`user-service` logout, `api-gateway` dashboard). Express 4 does
    not observe a rejected promise from a handler, so once their queries became async an unreachable
    database would have hung the request rather than answering it. Both now catch

### Tests:
11. `driver.test.ts` extended from 25 to 38 cases — including one that asserts a write inside a
    transaction goes to the transaction's *own connection* and never to the pool, which is the check
    the previous suite could not make and the reason defect 6 survived review
12. Suite total: **956 tests across 52 files**, all passing

---

## Sprint 32 — Trustworthy Identity

**Goal**: Make a token's contents unforgeable and its session revocable, so that the RBAC data
Sprint 30 corrected is actually enforced rather than decorative.

Closes GAP-001 and GAP-010, and the deployed half of GAP-002. Everything in the security case
downstream of identity — ownership checks, audit attribution, default-deny routing — was
unenforceable while any client could mint an admin token by editing JSON.

### Delivered:
1. `packages/auth` — Ed25519 (EdDSA) signed JWTs, issued and verified with Node's built-in
   `crypto`, so **no new dependency** was added to fix the finding
2. `alg` pinned to `EdDSA` and checked before verification is attempted — `alg: none` and
   HS256-signed-with-the-public-key are both refused
3. Keys from `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` (PEM or base64-wrapped PEM); when unset, an
   ephemeral keypair is generated with a logged warning. The fallback never reverts to
   accepting unsigned tokens
4. `npm run auth:keygen` prints a fresh keypair in the form the environment wants
5. **Permissions removed from the token.** Authorisation is resolved per request from
   `role_permissions` with a 5-second cache, so a role change or revocation takes effect
   immediately rather than at next login
6. **Server-side session validation on every request.** The token's `jti` is looked up in
   `sessions`; logout deletes the row, so revocation is immediate. Deliberately uncached —
   caching it would reintroduce the very window GAP-010 describes
7. `optionalAuth` verifies too: "optional" governs whether a token is *required*, not whether
   it is *checked*

### The finding that prompted item 8:
8. **The deployed container authenticated nothing.** `api-gateway/src/index.ts` had always
   guarded `/api/reports` with `authenticate + requirePermission`, but
   `consolidated-api/src/index.ts` — the only artefact that deploys — mounted the same router
   bare. The sole authorised route in the repo was unauthorised everywhere it actually served
   traffic. Now guarded in both. The general hazard remains: the consolidation layer re-mounts
   routers by hand, so middleware applied in a service's own entry point is invisible to
   deployment unless repeated

### Also fixed:
9. Dead code removed from `api-gateway`'s login: it synthesised a `USR-DEMO-001` user when
   `demo@example.com` was not found, which was unreachable (that address is seeded as
   `user-demo`) and is now impossible, since a session row carries a foreign key to `users`
10. `85 stale .js files from an August build` were sitting inside `src/`, where Node's
    directory resolution prefers `index.js` over `index.ts` — so running the service loaded
    August's code while the tests, which resolve TypeScript directly, saw the current source.
    Removed. `vitest.config.ts` already guarded against this for tests; the runtime path did not

### Tests:
11. `packages/auth/src/__tests__/jwt.test.ts` — 32 cases, mostly forgery attempts: tampered
    role claim, `alg: none`, algorithm substitution, foreign signing key, the legacy unsigned
    format, expiry boundaries, and a misconfigured non-Ed25519 public key
12. `services/api-gateway/src/__tests__/rbac.test.ts` — rewritten to mint real signed tokens
    for real seeded users with real sessions; asserts permissions come from the database, that
    a role change is reflected without re-login, that logout revokes immediately, and that a
    database failure surfaces as a server error rather than as a 403
13. Suite total: **998 tests across 53 files**, all passing

### Residual:
GAP-003 is untouched — any password is still accepted for a seeded user, because no real
hashes exist to verify against. Identity is now unforgeable but still not proven. Access
tokens also still live 8 hours with no refresh rotation.

---

## Sprint 33 — Ownership and Validation

**Goal**: Make authorisation decisions about *this record* rather than about records in
general, and make validation structural rather than hand-rolled per route.

Closes the authenticated half of GAP-005 and wires GAP-009 into the application routes.

### Delivered — resource ownership (GAP-005):
1. **`applications.debtor_user_id`** added to the SQLite schema, the PostgreSQL schema and the
   .NET EF model (built and verified). There was previously no link between an application and
   a debtor *user* at all — `assigned_to` is the member of staff, and `applicants` is a
   separate table with no user reference — so the first part of the fix was a data-model
   change, not a code one
2. Nullable by design: null means owned by nobody, so a debtor never matches it. That is the
   safe default for staff-created and anonymously-started cases
3. Ownership enforced on read, update and submit. Refusals return **404, not 403**, so the
   endpoint cannot be used to enumerate which reference numbers exist
4. List queries filtered by the owner taken from the **verified token**, not the query string —
   the scope cannot be widened by naming another user or dropped by omitting the parameter. The
   reported total is scoped too, so it does not leak how many cases exist in total
5. `PATCH /:id/status` and `POST /:id/notes` refuse debtors outright: ownership is the wrong
   test for a statutory decision, because owning the case is precisely what must not grant it
6. Mass assignment closed — `debtorUserId` is stamped from the token on create and stripped
   from the update body, so a debtor cannot give their case away or claim an unowned one
7. Seeds updated: two of the five seeded applications and every tenth of the hundred demo
   applications are owned by the seeded debtor, so the check has something to distinguish

### Delivered — structural validation (GAP-009):
8. **Found the mechanical reason the validation package was dead code.** Its `package.json`
   declared `"main": "./dist/index.js"`, and that built file imports `./schemas` without a file
   extension, which does not resolve under ESM — `require('@aib-iaas/validation')` threw
   `ERR_MODULE_NOT_FOUND`. The package could not be loaded at all, so no amount of intent
   would have wired it in. Fixed by pointing `main`/`types` at `src/index.ts`
9. `validateBody(schema)` middleware, returning the existing error envelope so the text the
   frontend renders is unchanged. Applied to all four application routes that accept a body;
   the 75-line hand-rolled `validateApplicationBody` is deleted
10. `packages/validation/src/api.ts` — schemas for what the endpoints **actually receive**.
    `schemas.ts` describes the frontend *form* (every field required, different nesting); no
    endpoint is sent that shape, and applying it as middleware would have rejected every real
    request. The new schemas are draft-tolerant, because `/apply` saves section by section, but
    strict on any field that is present
11. The middleware replaces `req.body` with the parsed value, so coercions land once: amounts
    posted as strings become numbers, NI numbers are normalised at the boundary

### Defects found while doing it:
12. **A latent 500.** `assets: {}` — exactly what the `/apply` auto-save sends when the
    applicant has no assets — was iterated with `for...of` in `applications.create()`. A JSON
    object is truthy but not iterable, so it threw a TypeError and surfaced as a 500 rather
    than a 400. Reachable from the real client; hidden only because the journey sends that
    field on update, where it was ignored. Now guarded with `Array.isArray` on addresses,
    debts and assets alike
13. **An incorrect NI-number rule.** The API accepted `DF123456Z`: it matches
    `[A-Z]{2}\d{6}[A-Z]` and is not on the disallowed-prefix list, but D is not a valid first
    letter and Z is not a valid suffix. The shared Zod schema had the correct character classes
    all along — precisely the frontend/backend drift GAP-009 predicted. Both rules are now applied

### Tests:
14. `applicationOwnership.test.ts` — 18 cases using **two distinct debtors**, asserting across
    the boundary between them. A single-debtor test cannot distinguish "scoped to me" from
    "scoped to nobody", which is how this went unnoticed
15. `applicationValidation.test.ts` — 29 cases. As many assert that *partial* input is still
    accepted as assert that malformed input is rejected: wiring validation in is only safe
    because the schemas are draft-tolerant, so those are the tests that would catch someone
    tightening them and breaking the journey
16. Suite total: **1,151 tests across 59 files**, all passing. Coverage 87.7% statements /
    80.6% branches

### Residual:
The enforcement above is real for any caller who identifies themselves and **bypassable by any
caller who does not**, because no deployed application route requires a token (GAP-002). That
is asserted as a deliberate gap in the test suite rather than left as an assumption, so closing
it will fail loudly and force the register to be updated. Routes in the other five services
still read `req.body` with no schema.

---

## Sprint 34 — Real Data, Real Numbers

**Goal**: Make the demo functional rather than decorative — populate the tables screens read,
give the schema a way to evolve, and replace the reporting literals with computed figures.

### Delivered — schema evolution:
1. **A versioned migration runner** (`packages/database/src/migrations.ts`) with a
   `schema_migrations` table, driver-based so one definition covers both backends. This
   replaces two ad-hoc stopgaps and, more importantly, the absence of any record of what shape
   a deployed database is in. Its limits are documented in the file rather than implied: no down
   migrations, no schema diffing, no advisory locking
2. Migrations run from `initialiseDatabase()`, after the CREATE statements — which can only ever
   act on a database that does not yet have the table

### Delivered — the demo dataset:
3. **Six tables were empty after every previous seeding path**: `addresses`, `debts`,
   `income_expenditure`, `recommendations`, `audit_events`, `payments`. A debt-advice demo whose
   applications have no debts showed an empty creditor list on every case page, £0 total debt on
   every dashboard, and a blank audit trail — which is why several screens carried hardcoded
   figures instead
4. `packages/database/src/seed-demo.ts` fills them: 350 debts, 133 addresses, 100 income records,
   66 recommendations, 430 audit events, 83 payments. Driver-based, so it seeds SQLite and
   PostgreSQL from one definition — the hundred applications were previously written twice, in
   two files with different id schemes, so the backends disagreed about what the demo data was
5. Internally consistent by construction: each case's creditors sum to its total (the last takes
   the remainder, so rounding cannot make the parts disagree), its recommendation follows from its
   own debt and surplus, its audit events are ordered and match its status, and a payment exists
   only where the case progressed past draft
6. Statuses are **read from the application rows**, not recomputed, so the detail cannot contradict
   the case it hangs off. Everything else derives from the loop index — no `Math.random()` — so the
   dataset is byte-identical on every boot, which is what a scripted demo needs

### Delivered — reporting that computes:
7. **Every figure on `/statistics` except four counts was a literal** in `routes/reports.ts` —
   product mix, monthly trend, geographic spread, debt bands, processing times, SLA compliance.
   The page was wired to the API all along, so it looked live while showing numbers that never
   moved. Now computed in `routes/reportQueries.ts`: £2.4M debt under management, median £24,075,
   five populated debt bands, six regions, SLA compliance from the audit trail
8. **SLA compliance turned out to be derivable** and moved out of the undeliverable list — it is
   the proportion of decided cases that reached a decision inside the end-to-end target
9. Metrics that genuinely have no instrumentation (integration uptime, credit-check success) are
   reported as `null` with a `meta.undeliverableMetrics` list, and render as an em dash. The
   invented 99.2% and 94% they replaced are the kind of figure that ends up in a board paper
10. The `/statistics` page previously ignored `financial`, `geographic` and `trends` from the API
    response and rendered its hardcoded fallbacks even on success — fixed

### Defects found:
11. **Test collection is non-deterministic under load.** Vitest was observed collecting 57 or 58
    of 59 files and reporting a **green run over the subset** — silently, with no error and no
    skip notice. Not pool-specific (`--pool=forks` and `--pool=threads` both did it); it
    correlated with heavy concurrent machine load. A green CI run therefore proves nothing unless
    the file count is checked. `--no-file-parallelism` has collected all 59 on every attempt.
    Recorded in CLAUDE.md. Note that per-sprint test totals recorded before this was found may
    understate, having been measured from possibly-truncated runs
12. The reporting tests asserted that `byProduct`, `trends` and `geographic` were *present and
    non-empty* — guaranteed by their being hardcoded. Every one would have passed with the
    database dropped. Replaced with assertions against known inserted inputs

### Tests:
13. `reportsAggregation.test.ts` (22) — asserts computed values against a dataset it inserts, with
    debts chosen to land in three distinct bands and an audit trail stamped with deliberate 2-hour
    and 24-hour gaps, so the expected figures are arithmetic rather than whatever the code produces
14. `migrations.test.ts` (11) — including the awkward case that matters: a migration whose column
    is also in the CREATE statement must be a no-op that still records itself, or it fails on every
    fresh database
15. `seedDemo.test.ts` (23) — coherence rather than counts: creditors summing to totals,
    recommendations agreeing with their own factors, audit trails ordered forward, one current
    address per application, determinism across two separate databases
16. Suite total: **1,151 tests across 59 files**, all passing. Coverage 88.4% statements /
    81.9% branches

---

## Sprint 35 — Honest Output, Operable Deployment

**Goal**: Close the eight Critical/High findings left outstanding in
`docs/security-known-gaps.md` after the 4 September multi-agent audit — GAP-017 (residual) and
GAP-018 through GAP-024. They fall into three groups that needed different treatment, and
conflating them is why they had stayed open.

### Delivered — two were wrong advice:
1. **The client fabricated statutory recommendations** (GAP-023). There were *three* fabrication
   sites in `RecommendationSection`, not one: the `catch` returned a whole response —
   `debt_arrangement_scheme` at `'high'` confidence with three invented factor weights — and set
   `received: true` so the journey advanced; the heading defaulted to "Debt Arrangement Scheme
   (DAS)" when `result` was null; the confidence line defaulted to "High". All three chose DAS,
   which is a *repayment programme*, so the fabrication specifically told people who cannot afford
   to repay that they should
2. Worse, the system-check step fed the engine. A failed BASYS/eDEN/DAS/CFT/Moratorium/RoI check
   was recorded as `status: 'clear'`, and `calculateRecommendation` reads `existingCases` from
   exactly those results — so a cosmetic fallback became a false negative in statutory advice. A
   failed credit check became a hard-coded 620; a *different* hard-coded 520 sat in the render
   fallback. With no results at all, six statutory registers rendered "✓ Clear" having never been
   contacted
3. Now: one retry (Render spins an idle container down after 15 minutes — that cold start is what
   the fallback was really covering for), then an explicit failure panel naming no product, with
   `received` left false. Failed checks read `unavailable`, visually distinct from `clear`. The
   deliberate offline demo mode is kept and every result it produces is labelled `simulated` —
   that distinction is the whole fix, because the branch was always legitimate and what made it a
   defect was being indistinguishable from a real check
4. **The .NET engine gave different statutory advice from the Node one** (GAP-024). It applied a
   £1,500 MAP floor that **SSI 2023/9 reg. 2 removed on 6 February 2023**, evaluated PTD before
   MAP, required a £100 surplus for DAS where Node requires only that a surplus exists, and
   signposted on *any* existing case including one discharged years ago. So a £900 debtor was
   turned away from every statutory route on one backend and offered a Debt Payment Programme on
   the other
5. `services/dotnet-api/Domain/Statutory/Thresholds.cs` now mirrors `packages/statutory`
   structurally — value, citation, amending SSI, effective date — with `Map.MinDebt` modelled
   explicitly as `null`, because "no minimum" is a policy position third-party summaries still get
   wrong. The handler follows the Node branch order exactly
6. **The parity mechanism matters more than the port.**
   `tests/fixtures/recommendation-cases.json` is read by both engine suites, so changing one
   expectation turns *both* red — verified by doing it. Two independently written test files would
   drift, which is how the divergence arose. `tests/dotnet/IAAS.Api.Tests` is the repository's
   first .NET test project, and a `dotnet-test` job in CI means this code is executed by something
   other than a person clicking through the demo for the first time since Sprint 20

### Delivered — three were deployed but not operable:
7. **`/api/health` could not fail** (GAP-020), and `render.yaml` names it as `healthCheckPath` for
   both services — so the only signal the platform had was "the process is listening". A container
   whose database was unreachable was indistinguishable from a working one. The fix is *not* to
   make it fail: on the free plan a failing check fails the deploy, and a Neon cold start takes
   seconds, so that would turn a wake-up into a failed deployment mid-demo. Liveness stays
   always-200; a new `/api/health/ready` probes the driver, both auxiliary stores and whether
   `UPLOAD_PATH` is genuinely writable, returning 503 with per-dependency detail
8. **Three of four stores were never on the persistent disk** (GAP-019). `Dockerfile.service` sets
   `WORKDIR` to `/app/services/${SERVICE_NAME}`, so `./uploads` resolved under the container rather
   than the `/data` mount. Every uploaded bank statement and payslip and all case correspondence was
   destroyed several times a day — and because the `documents` rows *did* survive on the disk, the
   case list kept offering downloads that 404'd. All four paths are now set in `render.yaml`, the
   Bicep template and Compose, and `resolveStorePath()` logs an error at boot rather than silently
   relocating: a relative store path works perfectly until the first restart, which is why it must
   be loud
9. **No structured logging, correlation id or metrics existed in the deployed artefact** (GAP-021).
   The one request-id middleware was mounted on api-gateway's *app*, which the deployed container
   does not use — it imports the *routers* — so it had never run in production. New zero-dependency
   `packages/observability`: JSON lines with redaction in the serialiser rather than at each call
   site, an inbound-`x-request-id` filter (it reaches a log aggregator and a response header, so an
   unfiltered attacker-controlled string is a log injection primitive), route *patterns* not URLs
   as log fields and metric labels, and Prometheus exposition behind `system.admin`
10. It also replaced two divergent error handlers. The deployed one returned `err.message`
    with **no `NODE_ENV` guard**, putting SQLite table and column names in the browser in
    production; the api-gateway copy guarded it correctly, which is the argument against two copies.
    Several services mounted none at all and fell through to Express's HTML stack trace
11. `observabilityParity.test.ts` fails if any of the thirteen Express apps is missing the
    middleware, if `requestId` is not first, or if `errorHandler` is not last. That
    mount-point-versus-router divergence has now caused four defects here; the test exists so it
    stops causing them

### Delivered — three were the remainder of part-closed work:
12. **Notification writes were still unscoped** (GAP-017 residual). Authentication had landed and
    closed none of the following on its own: `PATCH /:id/read` and `DELETE /:id` took an id and
    checked nothing, so any authenticated user could mark read or **destroy** any other user's case
    correspondence; `read-all` honoured the path parameter for everyone; and `POST /send` let any
    authenticated caller write an arbitrary subject and body to any userId, attributed to the
    service. Ownership is now in the `WHERE` clause rather than a check-then-act pair, so "not
    mine" and "does not exist" are one zero-row result answering 404 — the endpoint is not an
    existence oracle. Sending requires a new `notifications.send` permission granted to the four
    casework roles
13. There was also not one `try` in the file, and no error handler on the service, so posting `{}`
    threw a `NOT NULL` violation out of better-sqlite3 into Express's default HTML handler
14. **Consent was a receipt for a record that did not exist** (GAP-018). `POST /consent` returned
    201 with a fresh uuid and "Consent recorded for audit purposes" and executed no write; there was
    no `consents` table. UK GDPR Art. 7(1) requires the controller to be able to *demonstrate*
    consent, so this was worse than a 501 — it made the absence of a record look like its presence
15. The cache was the more consequential half: keyed on
    `${niNumber || lastName}-${dateOfBirth}` with a 24-hour TTL, it returned a cached result to a
    *different* application for the same person, so a fresh consent authorised no fresh check; and
    the `lastName` fallback (NI number is optional on the form) meant two people sharing a surname
    and date of birth received each other's credit data. Now keyed on the application plus a
    SHA-256 of the identity tuple, with a 1-hour TTL — the purpose is "do not bill the provider
    twice for a double-click", not "remember this person for a day"
16. Withdrawal is a timestamp, not a deletion: "they withdrew on 3 March" is itself
    demonstrable-consent evidence. An explicit `consentGiven: false` in a request body overrides
    any stored consent, because consent is withdrawable at any time under Art. 7(3) and the
    applicant's present "no" outranks a stored "yes"
17. **Every control in the citizen journey was programmatically unlabelled** (GAP-022). `<label>`
    with no `htmlFor`, `<input>` with no `id`, and seven `<select>`s with sibling labels tied to
    nothing — so a screen reader announced "edit text, blank" for name, date of birth, NI number,
    every address, every creditor and every figure. Errors had no `aria-describedby`,
    `aria-invalid` or `role="alert"`. The alias fields had only `placeholder`, which is not an
    accessible name and vanishes on typing. WCAG 2.2 AA 1.3.1/3.3.2/4.1.2, under PSBAR 2018
18. Found while fixing it: the document-upload drop zone was a `<div onClick>` wrapping a
    `display: none` file input, so the upload step could not be operated by keyboard at all
19. `packages/ui-components/GovInput.tsx` already did all of this correctly and was imported by
    nothing. It was not swapped in wholesale — no `data-demo` support and different classes, so it
    would have changed the visual design and broken the demo script. The controls moved to
    `apply/fields.tsx` because Next App Router permits no arbitrary named exports from a route
    file, so a component defined in `page.tsx` cannot be imported by a test

### Delivered — engineering fixes found along the way:
20. `packages/auth` had no `tsconfig.json`, so `tsc` fell back to the root config and
    `npm run build` — a CI gate — failed with TS6059. Added
21. `Migration.requiresTables` makes a data migration fail loudly, and *not* record itself, when a
    prerequisite table is absent. Silently skipping would leave the grant unapplied, never retried,
    and invisible — the exact class of drift the runner exists to remove
22. `ApiKeyMiddleware` in the .NET API bypassed `/health`, but every endpoint is under `/api/` — so
    registering it as written would have 401'd Render's health check and failed the deploy. It is
    not currently registered; corrected rather than left as a trap

### Verified:
23. Suite total: **1,317 vitest tests across 66 files** (994 backend / 53 files, 323 frontend / 13
    files), all passing, plus **57 xunit tests** in `tests/dotnet/IAAS.Api.Tests`. Coverage 90.23%
    statements / 83.5% branches, against gates of 50/45/45/50
24. Every workspace builds cleanly on its own — all nine packages and thirteen services under
    `tsc --noEmit`, and both Next apps under `next build`. `npm run build` at the root is
    **intermittent on Windows**, crashing with `3221226505` (0xC0000409) on whichever build the
    concurrency happens to catch; it moves target between runs and some runs pass outright. Same
    class as the documented `EBUSY` artefact, and CI runs on `ubuntu-latest` where it does not
    occur. Recorded in CLAUDE.md with the commands that distinguish it from a real failure
25. **`packages/auth` had no `tsconfig.json`**, which was not merely a CI break. `tsc` in a
    workspace without one falls back to the root config — no `noEmit`, default `include` of
    `**/*` — so it emitted `.js`, `.js.map` and `.d.ts` next to *every* source file in the
    repository: 1,464 files, each giving Next a second candidate for a module it already had.
    That shadowing has previously caused a deployed page to run weeks-old code. Cause fixed,
    artefacts cleared, and both the check and the reason are now in CLAUDE.md
26. `demoSelectors.test.ts` still passes all 98 assertions: the accessibility work touched every
    field on `/apply` and moved no `data-demo` hook

**Status**: Complete. GAP-017 through GAP-024 closed. **GAP-025 (MFA is client-side, and the token
is issued before the code is checked) is deliberately out of this scope and remains open**,
alongside GAP-003 (passwords are never verified) — the two are the only remaining Criticals and
they compound: together they mean the identity every other control now depends on can still be
assumed by anyone who knows an email address.

---

## Pre-Sprint Work (Initial POC + Copilot Recommendations)

Before the numbered sprints, significant foundational work was delivered:

1. Fuzzy search with cross-system identity matching (Fuse.js)
2. Recommendation Explanation hero page (confidence gauge, factors, alternatives chart)
3. Case Timeline / Audit View (15-20 events per case with filters)
4. Rules Management Console (9 rules, interactive tester, version history)
5. Digital Mailroom (AI OCR/NER pipeline, 20 documents, 5 workflows, stats)
6. AI Governance Dashboard (bias metrics, model registry, override audit)
7. Knowledge Hub / CMS (10 articles, editor preview, content calendar)
8. Policy Simulation Tool (4 sliders, 100 historical cases, live what-if)
9. Dark mode fix + mobile navigation optimisation
10. Performance optimisation (optimizePackageImports, fetchPriority, browserslist)
11. 16-document professional documentation suite
12. ITHC Pen Test Report + WCAG Audit + GDS Assessment + ATO
13. Admin hub with all features accessible from single deployed URL
14. Live-feel UX (notifications, tickers, status indicators, animations)
15. Form validation (client-side + server-side, NI number, UK postcode, age check)
16. 86 new tests added (from 215 to 301)

---

## Cumulative Metrics

| Metric | Value |
|--------|-------|
| Total UI Pages | 50+ |
| Total Features Documented | 40+ |
| Total Automated Tests | 1,317 across 66 files (Vitest) + 57 (xunit, `tests/dotnet`) |
| Test Coverage | 90.23% statements / 83.5% branches (gates: 50/45/45/50) |
| Total Documentation Files | 36+ |
| AI/ML Capabilities | 12+ |
| Admin Features | 32 |
| Backend Services | 12 logical, 1 deployed container (+ `dotnet-api` alternative implementation) |
| Database Tables | 17 shared (plus 2 service-local SQLite stores) |
| Seed Data Records | 30+ (users, orgs, roles, permissions, applications) |
| Live API Endpoints | 10 groups |
| Sprints Completed | 35 |
| Monthly Running Cost | £0 |

---

## Related Documents

- [Roadmap](./roadmap.md)
- [Feature Catalogue](./feature-catalogue.md)
- [Architecture](./architecture.md)
- [Testing](./testing.md)
- [Executive Summary](./executive-summary.md)
