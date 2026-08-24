# AiB Initial Application Advice Service (IAAS) — Proof of Concept

![API Status](https://img.shields.io/website?url=https%3A%2F%2Fiaas-api.onrender.com%2Fapi%2Fhealth&label=API&up_message=operational&down_message=offline)
![Frontend](https://img.shields.io/website?url=https%3A%2F%2Fmacleoda-leidos.github.io%2Faib-iaas-poc%2F&label=Frontend&up_message=live&down_message=offline)

> **Applications Gateway Service** — Schedule 19 SOW Technical Demonstration

## Overview

This repository contains a fully functional Proof of Concept for the Accountant in Bankruptcy's Initial Application Advice Service. It demonstrates how debtors, money advisers, creditors, and AiB staff interact with a unified applications gateway to receive recommendations for the most suitable Scottish debt solution.

The POC implements a complete end-to-end journey: identity verification, multi-step application form, real-time system checks against 6 AiB databases, rules-based recommendation across 7 Scottish debt products, correspondence generation, case management, statistics dashboards, and a Security Operations Centre.

**Live Demo:** https://macleoda-leidos.github.io/aib-iaas-poc/
**Live API (Node.js):** https://iaas-api.onrender.com
**Live API (.NET 9):** https://iaas-dotnet-api.onrender.com
**Database:** Neon PostgreSQL (persistent, shared across backends)
**Backend Switch:** Admin → Feature Flags → Backend API toggle (health-checked)
**API Docs:** https://macleoda-leidos.github.io/aib-iaas-poc/api-docs

**This is a POC — not production software. All data is synthetic. No real payments, credit checks, or system integrations are performed.**

### Sprint Completion Status

| Sprint | Focus | Key Deliverables | Status |
|--------|-------|-----------------|--------|
| Sprint 1 | Operational Beta | Live API on Render, PostgreSQL-ready persistence, repository pattern, auto-seed | ✅ Complete |
| Sprint 2 | Robustness | API status bar, offline fallback, loading skeletons, PDF export, caseworker notes | ✅ Complete |
| Sprint 3 | Production Readiness | Auth flow, role-based access, rate limits, session expiry, document upload | ✅ Complete |
| Sprint 4 | Intelligent Platform | Eligibility meter, risk scoring, case prioritisation, decision support, applicant portal | ✅ Complete |
| Sprint 5 | Live Verification | PWA, WCAG fixes, smoke test endpoint, API docs, error tracking | ✅ Complete |
| Sprint 6 | Scale & Security | MFA, multi-language (EN/GD), webhooks, API keys, security headers | ✅ Complete |
| Sprint 7 | AI Showcase | AI chatbot, case summary, anomaly detection, quality check, predictive outcomes | ✅ Complete |
| Sprint 8 | Enterprise Polish | Account management, data export, batch processing, 28-feature admin hub | ✅ Complete |
| Sprint 9 | Platform Completeness | Compliance, training mode, integration monitor, performance metrics | ✅ Complete |
| Sprint 10 | Final Integration | Documentation suite, demo readiness, final polish, 50+ pages | ✅ Complete |
| Sprint 11 | Test & Document | 102 new tests (423 total), onboarding guide, demo script | ✅ Complete |
| Sprint 12 | Operational Excellence | 78 Playwright E2E tests (501 total), runbooks, load test | ✅ Complete |
| Sprint 13 | Handover & Scale | ADRs, cost model, vendor assessment, go-live checklist | ✅ Complete |
| Sprint 14 | Stakeholder Value | Creditor portal, adviser workspace, workflow engine, MI reports, 600+ tests | ✅ Complete |
| Phase 14 | Organisation Service | Shared master data, creditor type-ahead, 54 seeded orgs, 648 tests | ✅ Complete |
| Sprint 15 | Quality Assurance | E2E link audit, basePath validation, navigation regression tests | ✅ Complete |
| Sprint 16 | Documentation Alignment | Sprint logs, roadmap, testing docs, README aligned to current state | ✅ Complete |
| Sprint 17 | Test Infrastructure | 10 new link audit E2E scenarios, 658+ tests across 48 files | ✅ Complete |
| Sprint 18 | .NET Backend | Full .NET 9 API (MediatR + CQS), 11 endpoints, EF Core, Swagger | ✅ Complete |
| Sprint 19 | Enterprise Persistence | Neon PostgreSQL, pg-schema (14 tables), pg-seed, write-through cache | ✅ Complete |
| Sprint 20 | Live Deployment | .NET on Render (Docker), URI→ADO.NET, EF Core snake_case mapping | ✅ Complete |
| Sprint 21 | Data Comes Alive | 100 apps seeded (SQLite + Neon), API-first search, case actions persist | ✅ Complete |
| Sprint 22 | Demo Enhancement | Smart scroll, sequential debts/assets/docs, Apple Pay, PDF download | ✅ Complete |
| Sprint 23 | Admin Functionality | Reports builder (100 cases), User CRUD to API, Data Retention editable | ✅ Complete |
| Sprint 24 | Interactive Admin | GitHub heatmap, Digital Signature canvas, Statistics time periods | ✅ Complete |
| Sprint 25 | Polish & Safety | Admin user fix, backend health checks, Data Export search/filter/sort | ✅ Complete |
| Sprint 26 | Real-Time & Notifications | Toast system, notification bell + dropdown, dashboard auto-refresh 30s | ✅ Complete |
| Sprint 27 | Casework Workflow | Batch select + approve/reject, SLA timer column (green/amber/red), select-all | ✅ Complete |
| Sprint 28 | Production Polish | LoadingSkeleton components, ApiErrorBoundary + retry, OfflineBanner, service worker | ✅ Complete |
| Sprint 29 | Enterprise Showcase | API Versioning page, Monitoring & Observability (uptime, tracing, alerts) | ✅ Complete |

**65+ pages | 40 admin features | 519 unit tests (+213 E2E) | 29 sprints | Dual backend (Node.js + .NET 9) | £0/month hosting**

📋 [Full Sprint Delivery Log](docs/sprint-delivery-log.md) | 📖 [Admin Portal Guide](docs/admin-portal-guide.md) | 📖 [Onboarding Guide](docs/onboarding-guide.md)

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose (optional, for containerised deployment)

### Local Development

```bash
# Clone the repository
git clone https://github.com/macleoda-leidos/aib-iaas-poc.git
cd aib-iaas-poc

# Install all dependencies (monorepo — installs everything)
npm install

# Seed demo data
npm run seed

# Start all backend services (13 microservices)
npm run dev:services

# In a separate terminal — start the web portal
npm run dev:web
```

### Docker Deployment

```bash
# Build and run full stack (all services + web portal)
docker compose -f infra/docker/docker-compose.yml up --build
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Web Portal | http://localhost:3000 | Public-facing application portal |
| API Gateway | http://localhost:3001 | Backend BFF API |
| Recommendation Service | http://localhost:3002 | Rules engine |
| Document Service | http://localhost:3003 | Upload & storage |
| Integration Orchestrator | http://localhost:3004 | System checks |
| Mock Integrations | http://localhost:3005 | Stub AiB system APIs |
| Payment Service | http://localhost:3006 | Payment simulation |
| Audit Service | http://localhost:3007 | Event logging |

---

## Architecture

```
                         ┌─────────────────────────────┐
                         │   GitHub Pages (Static)      │
                         │   Next.js 15 + React 19      │
                         │   https://macleoda-leidos.   │
                         │   github.io/aib-iaas-poc/    │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                     API Gateway (port 3001)                       │
│         Express.js BFF — Auth, Rate Limiting, Routing            │
└───────┬───────┬───────┬───────┬───────┬───────┬───────┬─────────┘
        │       │       │       │       │       │       │
        ▼       ▼       ▼       ▼       ▼       ▼       ▼
┌───────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌───────────┐
│Recomm.│ │Doc  │ │Integ│ │Paym.│ │Audit│ │Cred.│ │Identity   │
│Engine │ │Svc  │ │Orch │ │Svc  │ │Svc  │ │Check│ │Svc        │
│:3002  │ │:3003│ │:3004│ │:3006│ │:3007│ │     │ │           │
└───────┘ └─────┘ └──┬──┘ └─────┘ └─────┘ └─────┘ └───────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   Mock Integrations (:3005) │
        │   BASYS │ eDEN │ DAS │ CFT  │
        │   Moratorium │ RoI          │
        └─────────────────────────────┘

Additional: user-service, organisation-service, notification-service,
            consolidated-api (13 services total)
```

---

## Pages & Features

### Public Pages

| Page | Path | Description |
|------|------|-------------|
| Landing | `/` | Service start page with "Start now" CTA |
| Identity Verification | `/` (start flow) | ScotAccount / GOV.UK One Login simulation |
| Application Form | `/apply` | 9-section multi-step form with auto-save |
| Debtor Portal | `/portal` | Personal dashboard for applicants |
| Accessibility | `/accessibility` | Accessibility statement |
| Feedback | `/feedback` | User feedback form |
| Cookie Consent | (banner) | GDPR-compliant cookie notice |

### Staff / Authenticated Pages

| Page | Path | Description |
|------|------|-------------|
| Login | `/login` | Role-selector with MFA simulation |
| Dashboard | `/dashboard` | Role-specific case management view |
| Case Detail | `/case/[ref]` | Full application data with collapsible sections |
| Search | `/search` | Global search across all cases |
| Correspondence | `/correspondence` | Letter generator with GOV.UK templates |
| Statistics | `/statistics` | Charts & analytics (Recharts) |
| Security (SOC) | `/security` | CyberOps dark-themed monitoring dashboard |
| Manage Users | `/manage-users` | User administration |
| Architecture | `/architecture` | System architecture visualisation |
| Demo Controls | `/demo-controls` | POC demonstration utilities |

### Application Form Sections (9 Steps)

1. Personal Details
2. Address & Contact
3. Employment & Income
4. Expenditure
5. Debts & Liabilities
6. Assets
7. Supporting Documents
8. Declaration
9. Review & Submit

### Key Capabilities

- **Rules-based Recommendation Engine** — evaluates eligibility across 7 Scottish debt products (Bankruptcy, MAP, DAS, Trust Deed, LILA, MAS, Moratorium)
- **Real-time System Checks** — parallel queries against BASYS, eDEN, DAS, CFT, Moratorium Register, and Register of Insolvencies
- **Credit Check Service** — score and band display with affordability indicators
- **Statistics & Analytics** — line charts, area charts, bar charts, pie charts, and gauge visualisations using Recharts
- **CyberOps SOC** — dark-themed security dashboard with live event stream (Sophos, Tenable, Sysmon, CloudWatch)
- **Correspondence Generator** — GOV.UK-compliant letter templates for all case stages
- **Identity Verification** — ScotAccount and GOV.UK One Login simulation flows
- **MFA Simulation** — TOTP authenticator, WebAuthn (passkey), and email code options
- **Keycloak SSO Design** — architecture for production single sign-on
- **Auto-save** — application progress persisted to API on every section change
- **Dark/Light Mode** — system preference detection with manual toggle
- **Mobile Responsive** — fully responsive tables and layouts
- **Global Search** — search across case references, names, and statuses

---

## Demo Accounts

Select any account on the login screen. All passwords are pre-filled; MFA codes are accepted automatically.

| Name | Role | Email | Destination |
|------|------|-------|-------------|
| Admin User | System Admin | admin@aib.example.gov.scot | Dashboard |
| Karen MacLeod | AiB Senior Officer | senior.officer@aib.example.gov.scot | Dashboard |
| James Wilson | AiB Case Officer | officer@aib.example.gov.scot | Dashboard |
| Fiona Campbell | Money Adviser | adviser@cas.example.org | Dashboard |
| Sarah Mitchell | Creditor | collections@rbs.example.com | Dashboard |
| Robert Henderson | Trustee | trustee@sample-ip.example.com | Dashboard |
| John Testerton | Debtor | john.testerton@example.com | Portal |
| Dr. Helen Fraser | AiB Statistician | helen.fraser@aib.example.gov.scot | Statistics |
| Ryan MacIntyre | CyberOps Analyst | ryan.macintyre@aib.example.gov.scot | Security SOC |

---

## Repository Structure

```
/apps
  /web              → Public portal (Next.js 15, deployed to GitHub Pages)

/services
  /api-gateway              → Public API / BFF (auth, rate limiting, routing)
  /recommendation-service   → Rules-based product engine (7 products)
  /document-service         → Upload and document management
  /integration-orchestrator → Parallel system checks (6 systems)
  /mock-integrations        → Stub APIs for all AiB backend systems
  /payment-service          → Payment simulation
  /audit-service            → Audit event capture & trail
  /credit-check-service     → Credit scoring & affordability
  /identity-service         → Identity verification flows
  /user-service             → User management
  /organisation-service     → Organisation registry
  /notification-service     → Notification delivery
  /consolidated-api         → Aggregated API layer

/packages
  /shared-types    → TypeScript type definitions
  /validation      → Zod validation schemas
  /test-data       → Synthetic data generators
  /ui-components   → GOV.UK-style React components

/infra
  /terraform       → AWS infrastructure modules
  /docker          → Docker Compose & Dockerfiles

/docs              → Architecture, API, integration, data model documentation
/.github/workflows → CI/CD pipelines
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15, React 19 | Server-side rendering, static export |
| Styling | Tailwind CSS | Utility-first responsive design |
| Charts | Recharts | Statistics & analytics visualisations |
| Backend | Express.js, TypeScript | Microservices API layer |
| Database | SQLite (POC) | Zero-config local development |
| Validation | Zod | Shared FE/BE schema validation |
| Testing | Vitest, Playwright | Unit/integration + E2E |
| Build | TypeScript 5, tsx | Type-safe rapid development |
| CI/CD | GitHub Actions | Automated test + deploy pipeline |
| Containers | Docker Compose | Local full-stack orchestration |
| Infrastructure | Terraform | AWS infrastructure-as-code |
| Security | Helmet, CORS, rate limiting | Defence in depth |

---

## Deployment

### GitHub Pages (Current)

The frontend is automatically deployed to GitHub Pages on every push to `main`:

1. **CI Pipeline** runs tests and quality gates
2. **Deploy Pipeline** triggers on CI success — builds Next.js static export and publishes to Pages

URL: https://macleoda-leidos.github.io/aib-iaas-poc/

### CI/CD Pipelines

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push / PR to main | Build, test, quality gate |
| `deploy-pages.yml` | CI success on main | Deploy static frontend to GitHub Pages |
| `deploy-azure.yml` | Manual | Azure deployment (alternative) |
| `deploy-swa.yml` | Manual | Azure Static Web Apps (alternative) |

### Production Path (Design)

| Environment | Purpose | Infrastructure |
|-------------|---------|---------------|
| Local | Development & demo | Docker Compose |
| FAT | Functional testing | AWS ECS (Terraform) |
| UAT | User acceptance | AWS ECS (Terraform) |
| PreProd | Pre-production validation | AWS ECS (mirrors prod) |
| Production | Live service | AWS ECS (full HA) |

---

## Testing

```bash
# Run all unit/integration tests
npm test

# Run tests for a specific service
npm test --workspace=services/recommendation-service

# Run E2E tests (requires running app)
npx playwright test

# Run contract tests
npm run test:contracts

# Lint all workspaces
npm run lint
```

---

## Design Patterns

- **GOV.UK Design System** — consistent UI patterns, typography, spacing, and colour
- **AiB Branding** — red header (#d32205) with official AiB logo
- **Mobile-first** — responsive breakpoints, collapsible navigation, touch-friendly controls
- **Accessibility** — WCAG 2.1 AA target, semantic HTML, ARIA labels, keyboard navigation
- **API-first** — all features backed by documented REST endpoints
- **12-factor** — environment-driven configuration, stateless services

---

## Documentation

### Strategic & Business

| Document | Audience | Description |
|----------|----------|-------------|
| [Executive Summary](docs/executive-summary.md) | Executives, Bid Teams | Vision, business problem, strategic alignment, success criteria |
| [Business Requirements](docs/business-requirements.md) | Product Owners, BAs | Goals, current/future state, KPIs, benefits |
| [Options Analysis](docs/options-analysis.md) | Decision Makers | 4 strategic options with cost/benefit comparison |
| [Bid Positioning](docs/bid-positioning.md) | Bid Teams | Differentiators, SOW alignment, innovation |
| [Roadmap](docs/roadmap.md) | All Stakeholders | 36-month capability roadmap (Near/Medium/Long term) |

### User-Centred Design

| Document | Audience | Description |
|----------|----------|-------------|
| [Personas](docs/personas.md) | UX, BAs, Product | 10 detailed user personas with goals & frustrations |
| [User Stories](docs/user-stories.md) | Delivery Teams | 60+ stories across 13 epics with acceptance criteria |
| [Use Cases](docs/use-cases.md) | BAs, Testers | 12 detailed use cases with flows & exceptions |
| [User Journeys](docs/user-journeys.md) | UX, Product | 10 journey maps with Mermaid flow diagrams |
| [Feature Catalogue](docs/feature-catalogue.md) | All | 25 features documented with business value |

### Technical Architecture

| Document | Audience | Description |
|----------|----------|-------------|
| [Solution Architecture](docs/architecture.md) | Architects | C4 model, deployment, data architecture, ADRs |
| [Integrations](docs/integrations.md) | Developers, Architects | 10 integrations with data flows & failure handling |
| [Security Architecture](docs/security.md) | Security Architects | Threat model, RBAC matrix, OWASP, GDPR |
| [Recommendation Engine](docs/recommendation-engine.md) | Architects, BAs | Rules engine, decision trees, AI governance |
| [Identity Architecture](docs/identity-architecture.md) | Security, Architects | Keycloak, SSO federation, MFA design |

### Operations & Delivery

| Document | Audience | Description |
|----------|----------|-------------|
| [Administration Guide](docs/administration-guide.md) | Ops, Support | User management, monitoring, troubleshooting |
| [Testing](docs/testing.md) | Testers, Delivery | Strategy, scenarios, traceability matrix |
| [API Design](docs/api-first-design.md) | Developers | REST API patterns and conventions |
| [Data Model](docs/data-model.md) | Developers | Core entity models |
| [Runbook](docs/runbook.md) | Ops | Operational procedures |

---

## License

Crown Copyright - Accountant in Bankruptcy. POC demonstration only.
