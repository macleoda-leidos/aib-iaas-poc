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

**Totals: 65+ pages, 50+ features, 658+ tests, 36+ docs, 12+ AI capabilities**

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
1. Creditor Portal — claim submission, dividends, voting on proposals
2. Money Adviser Workspace — 42 clients, calendar, submit on behalf
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
| Total Automated Tests | 658+ |
| Total Documentation Files | 36+ |
| AI/ML Capabilities | 12+ |
| Admin Features | 32 |
| Backend Services | 13 (consolidated) |
| Database Tables | 14 |
| Seed Data Records | 30+ (users, orgs, roles, permissions, applications) |
| Live API Endpoints | 10 groups |
| Sprints Completed | 29 |
| Monthly Running Cost | £0 |

---

## Related Documents

- [Roadmap](./roadmap.md)
- [Feature Catalogue](./feature-catalogue.md)
- [Architecture](./architecture.md)
- [Testing](./testing.md)
- [Executive Summary](./executive-summary.md)
