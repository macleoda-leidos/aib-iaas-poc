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

**Totals: 42+ pages, 35 features, 321+ tests, 27+ docs, 10 AI capabilities**

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
| Total UI Pages | 42+ |
| Total Features Documented | 35 |
| Total Automated Tests | 321+ |
| Total Documentation Files | 27+ |
| AI/ML Capabilities | 10 |
| Backend Services | 11 (consolidated) |
| Database Tables | 14 |
| Seed Data Records | 30+ (users, orgs, roles, permissions, applications) |
| Live API Endpoints | 10 groups |
| Monthly Running Cost | £0 |

---

## Related Documents

- [Roadmap](./roadmap.md)
- [Feature Catalogue](./feature-catalogue.md)
- [Architecture](./architecture.md)
- [Testing](./testing.md)
- [Executive Summary](./executive-summary.md)
