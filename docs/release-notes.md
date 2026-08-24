# IAAS Release Notes

## Version History

### v0.25.0 — Sprint 25: Polish & Safety (August 2026)
- Fix: Admin page shows actual logged-in user (was hardcoded Karen MacLeod)
- Fix: Backend selector hides localhost on deployed site, health-checks before switching
- Feat: Data Export page rewritten — 100 cases, search by name/ref/status/date, sort, CSV, Print/PDF

### v0.24.0 — Sprint 24: Interactive Admin (August 2026)
- Feat: Activity Heatmap — GitHub-style with hover tooltips (system breakdown), click drill-down
- Feat: Digital Signature — canvas drawing, document selection, audit log persisted
- Feat: Statistics time period buttons (7d/30d/90d/12m) now update all charts and KPIs
- Feat: Data Retention — delete Credit Checks policy for demo re-runs

### v0.23.0 — Sprint 23: Admin Functionality (August 2026)
- Feat: Report Builder — 100 cases, 6 quick-start tiles, generated report with stats/table/CSV
- Feat: User Management — Create User wired to POST /api/users (persists to Neon)
- Feat: Data Retention — editable policies + Add Credit Checks (3yr max, readonly type)
- Feat: Dev docs — C4 diagram fallback, zoom modal, download .md

### v0.22.0 — Sprint 22: Demo Enhancement (August 2026)
- Feat: Demo mode — page scrolls to follow field population (was stuck at top)
- Feat: Debts — 3 creditors added sequentially with scroll following
- Feat: Assets — property, vehicle, savings appear one-by-one
- Feat: Documents — 2 visible file uploads with progress
- Feat: Recommendation — button click + loading + result after 2.5s
- Feat: Payment — Apple Pay selected + confirmed before submit
- Feat: PDF download triggered during demo

### v0.21.0 — Sprint 21: Data Comes Alive (August 2026)
- Feat: 100 applications seeded into SQLite at API startup
- Feat: 100 applications seeded into Neon PostgreSQL
- Feat: Search page hits API first, falls back to seed data
- Feat: Case detail approve/reject/notes wired to live API
- Feat: render.yaml updated with iaas-dotnet-api service
- Feat: Frontend backend toggle — 3 options with health indicator

### v0.20.0 — Sprint 20: Live Deployment (August 2026)
- Feat: .NET API deployed to Render (Docker container)
- Fix: Dockerfile uses dynamic PORT env var (shell entrypoint)
- Fix: postgresql:// URI converted to ADO.NET format for Npgsql
- Fix: EF Core entities mapped to existing Neon snake_case schema
- Fix: IsDeleted/RowVersion added to Application model

### v0.19.0 — Sprint 19: Enterprise Persistence (August 2026)
- Feat: Neon PostgreSQL integration (free tier, 0.5GB)
- Feat: pg-schema.ts — 14 tables + 5 indexes
- Feat: pg-seed.ts — 9 roles, 5 orgs, 6 users
- Feat: pg-connection.ts — Pool singleton with SSL
- Feat: init-neon.ts script for one-command setup
- Feat: Consolidated API syncs to Neon on startup

### v0.18.0 — Sprint 18: .NET Backend (August 2026)
- Feat: Full .NET 9 Web API with MediatR + CQS pattern
- Feat: 11 endpoint modules (Applications, Auth, Audit, Organisations, Users, Recommendations, Integrations, Documents, Payments, CreditCheck, Notifications)
- Feat: Entity Framework Core with dual SQLite/PostgreSQL support
- Feat: Swagger/OpenAPI documentation
- Feat: Health check endpoint
- Feat: Polly resilience, Serilog logging, FluentValidation

### v0.17.0 — Sprint 17: Test Infrastructure Expansion (July 2026)
- Feat: Link audit spec covering 10 distinct navigation scenarios
- Feat: Admin hub feature link count assertion (28+ links)
- Feat: Case page content verification for multiple case refs
- Feat: Rules detail page deep-link testing
- Feat: Footer link presence validation

### v0.16.0 — Sprint 16: Documentation Alignment (July 2026)
- Fix: Sprint delivery log updated with Sprints 15-17
- Fix: Roadmap sprint status table updated
- Fix: Testing documentation updated with current test counts
- Fix: README sprint table updated with latest deliverables

### v0.15.0 — Sprint 15: Quality Assurance & Link Integrity (July 2026)
- Feat: Playwright E2E link audit test suite (10 scenarios)
- Fix: basePath correctness validation across all internal links
- Fix: Undefined-href detection (no links contain "undefined")
- Fix: Admin back-link path verification

### v0.14.0 — Sprint 14: Stakeholder Value (July 2026)
- Feat: Creditor Portal — claim submission, dividends, voting on proposals
- Feat: Money Adviser Workspace — 42 clients, calendar, submit on behalf
- Feat: Visual Workflow Engine — CSS state machine with transition rules and SLA timers
- Feat: MI Reports — management KPIs, staff performance, SLA breaches, export
- Feat: Debtor Secure Messages — encrypted thread with AiB officers
- Feat: Integration Health Monitor — live status of all 6 AiB system connections
- Feat: Correspondence Scheduler — automated letter rules with calendar

### v0.13.0 — Sprint 13: Handover & Scale (June 2026)
- Feat: 10 Architecture Decision Records documenting key technical choices
- Feat: Cost model with projections at 4 scales (POC to 10,000 users)
- Feat: Team scaling guide (1 FTE to 10 FTE across 4 phases)
- Feat: Cloud vendor assessment (AWS vs Azure vs GCP)
- Feat: Go-live checklist (60 items across 7 categories)

### v0.12.0 — Sprint 12: Operational Excellence (June 2026)
- Feat: 78 Playwright E2E regression tests
- Feat: Operational runbooks (incident response, deployment, rollback, scaling)
- Feat: Automated security scan (dependency audit, OWASP headers check)
- Feat: Load test results (500 concurrent users, <2s response time)
- Feat: Disaster recovery plan with RTO/RPO targets

### v0.11.0 — Sprint 11: Test & Document (June 2026)
- Feat: 102 new automated tests (423 total)
- Feat: Onboarding guide for new developers
- Feat: Demo script for 10-minute stakeholder walkthrough
- Feat: Complete functionality breakdown (50+ pages documented)
- Feat: Test coverage report generation (89% line coverage)

### v0.10.0 — Sprint 10: Final Integration (May 2026)
- Feat: Onboarding guide for new team members
- Feat: Stakeholder demo script (10-minute walkthrough)
- Feat: Complete functionality breakdown (50+ pages documented)
- Fix: Final broken link fixes (home page Apply button, favicon path)
- Feat: README rewrite with updated metrics

### v0.9.0 — Sprint 9: Platform Completeness (May 2026)
- Feat: Compliance dashboard with regulatory requirement tracking
- Feat: Training mode sandbox for new staff onboarding
- Feat: Release notes page with version history and changelog
- Feat: Integration monitor with real-time status of all 6 legacy systems
- Feat: Performance metrics dashboard (response time percentiles, throughput)

### v0.8.0 — Sprint 8: Enterprise Polish (May 2026)
- Feat: User account page with notification subscription management
- Feat: Dynamic sign-in button replacing static nav links
- Feat: AiB logo as browser tab favicon across all pages
- Feat: Data export functionality (CSV/JSON with field selection)
- Feat: Batch processing queue with progress tracking
- Feat: Enhanced admin hub with 28 features

### v0.7.0 — Sprint 7: AI Showcase (April 2026)
- Feat: AI Chatbot Widget — floating FAQ assistant with pattern-matching
- Feat: AI Case Summary — auto-generated natural language summary from case data
- Feat: Anomaly Detection Alerts — income discrepancies, duplicate applications, SLA warnings
- Feat: AI Quality Check — 6 automated pre-decision checks before approve/reject
- Feat: Predictive Case Outcomes — "87% likely approved" progress ring badge

### v0.6.0 — Sprint 6: Scale & Security (April 2026)
- Feat: Enhanced MFA UX — 6-digit TOTP code entry screen after login
- Feat: Multi-Language Toggle — EN/GD (English/Scottish Gaelic)
- Feat: Webhook System — registration, event types, delivery log
- Feat: API Key Management — generate/revoke, scopes, masked display
- Feat: Per-User Rate Limiting — usage progress bar + countdown timer
- Feat: Session Management — active devices, revoke, expiry countdown
- Feat: Security Headers Dashboard — Helmet.js configuration display

### v0.5.0 — Sprint 5: Live Verification (March 2026)
- Feat: PWA Manifest — app is installable on mobile/desktop
- Fix: WCAG 2.1 Accessibility Fixes — chart tooltip contrast, focus-visible outlines
- Feat: Smoke Test Endpoint — `/api/smoke-test` returns DB connectivity + table counts
- Feat: Interactive API Documentation Page with "Try it" buttons
- Feat: OpenAPI Specification Page with full endpoint reference
- Feat: Error Tracking module (Sentry-ready)

### v0.4.0 — Sprint 4: Intelligent Platform (March 2026)
- Feat: Real-Time Eligibility Indicator — live product prediction as user fills form
- Feat: Debtor Risk Score — SVG semi-circle gauge on case detail
- Feat: Automated Case Prioritisation — urgent/high/normal/low badges, sorted
- Feat: Guided Decision Support — interactive 6-step checklist for caseworkers
- Feat: Applicant Communication Portal — progress tracker, messages, documents
- Feat: Real-Time Analytics Animation — KPI counters tick up every 10 seconds
- Feat: Smart Auto-Calculate Disposable Income — colour-coded display

### v0.3.0 — Sprint 3: Production Readiness (February 2026)
- Feat: Real auth flow — login form calls live API, stores JWT token
- Feat: Demo accounts section (4 pre-configured accounts with one-click fill)
- Feat: AuthGuard component — role-based page protection
- Feat: Enhanced document upload (file picker, progress bar, virus scan simulation)
- Feat: Rate limit banner (amber at 80 calls, red at 100)
- Feat: Session expiry handling (401 clears auth, redirects)

### v0.2.0 — Sprint 2: Robustness & Offline (February 2026)
- Feat: API Connection Status Bar (green/amber/gray below BETA banner)
- Feat: Loading Skeleton components (SkeletonCard, SkeletonTable, SkeletonText)
- Feat: Dashboard graceful degradation ("Backend waking up...", auto-retry)
- Feat: Apply page offline fallback (localStorage save, auto-retry on reconnect)
- Feat: PDF Export for recommendation page (print-optimized CSS)
- Feat: Caseworker staff notes (textarea, timestamped list)
- Feat: Case assignment flow (dropdown, assign button, assignee badge)

### v0.1.0 — Sprint 1: Operational Beta (January 2026)
- Feat: PostgreSQL-ready database package with repository pattern
- Feat: 14-table schema (users, roles, applications, applicants, debts, assets, etc.)
- Feat: Integration contracts package — factory pattern for mock/real switching
- Feat: All service route handlers rewritten to use shared database
- Feat: Docker Compose with PostgreSQL 16 + Keycloak 25
- Feat: Live API deployed at https://iaas-api.onrender.com
- Feat: CORS configured for GitHub Pages origin
- Feat: Auto-seed on first boot

---

## Legend

- **Feat**: New feature or capability
- **Fix**: Bug fix or correction
- **Refactor**: Internal improvement with no user-visible change
