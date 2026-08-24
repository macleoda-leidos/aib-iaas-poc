# IAAS Documentation Review & Gap Analysis

## 1. Executive Summary

The AiB IAAS (Initial Application Advice Service) POC is a unified digital gateway for Scottish statutory debt solutions. It replaces fragmented paper-based processes with a single, intelligent application journey that guides debtors, representatives, and advisers through the appropriate debt solution pathway.

**Key Achievements:**
- 25 sprints delivered across the POC lifecycle
- 65+ pages across web and admin portals
- 14 microservices (Node.js) + 1 .NET 9 API (full parity)
- 38 admin features for internal AiB staff
- 658+ automated tests ensuring quality and regression safety
- Dual backend architecture demonstrating technology flexibility
- Neon PostgreSQL for enterprise-grade persistent storage
- GitHub Pages frontend with zero-cost hosting

**Live Environment:**
- Portal: https://macleoda-leidos.github.io/aib-iaas-poc/
- Node.js API: https://iaas-api.onrender.com
- .NET 9 API: https://iaas-dotnet-api.onrender.com

---

## 2. Repository Statistics

| Metric | Value |
|--------|-------|
| UI Pages | 65+ |
| Microservices (Node.js) | 14 |
| .NET 9 API (full parity) | 1 |
| Admin Features | 38 |
| Seeded Applications | 100+ |
| User Roles | 9 |
| Organisations | 54 |
| Automated Tests | 658+ |
| Documentation Files | 54 |
| Monthly Hosting Cost | £0 |

---

## 3. Current State Assessment

### Frontend
- **Framework:** Next.js 15, React 19
- **Styling:** Tailwind CSS (GOV.UK design patterns)
- **Charting:** Recharts
- **Deployment:** GitHub Pages (static export)
- **Routing:** App Router with dynamic segments

### Backend (Node.js)
- **Framework:** Express.js with TypeScript
- **Architecture:** Consolidated API (merged microservices for deployment)
- **Hosting:** Render.com (free tier)
- **Database Access:** Direct Neon PostgreSQL connection

### Backend (.NET 9)
- **Framework:** ASP.NET Core 9 Minimal APIs
- **Architecture:** MediatR + CQS (Command Query Separation)
- **Hosting:** Render.com (Docker container, free tier)
- **ORM:** Entity Framework Core with Npgsql

### Database
- **Primary:** Neon PostgreSQL (persistent, serverless)
- **Cache:** SQLite (runtime, write-through)
- **Schema:** Managed via pg-schema scripts
- **Seeding:** 100+ applications via pg-seed

### Authentication
- **Current:** Simulated Keycloak with role-based access
- **Production-ready:** realm-export.json prepared for real Keycloak deployment
- **Roles:** 9 distinct roles (debtor, representative, adviser, caseworker, supervisor, manager, admin, auditor, system)

### CI/CD
- **Pipeline:** GitHub Actions
- **Frontend Deploy:** Automatic to GitHub Pages on push to main
- **Backend Deploy:** Render.com auto-deploy from Docker

---

## 4. Sprint Progress Summary (1-25)

| Sprint | Theme | Status | Key Deliverables |
|--------|-------|--------|-----------------|
| 1 | Operational Beta | Complete | Core application journey, GOV.UK patterns, API Gateway |
| 2 | Enhanced Journey | Complete | Multi-step wizard, validation, progress tracking |
| 3 | Rules Engine | Complete | Recommendation service, product eligibility |
| 4 | Document Management | Complete | Upload, storage, virus scanning simulation |
| 5 | Integration Layer | Complete | BASYS, eDEN, DAS, CFT mock integrations |
| 6 | Payment Processing | Complete | Payment simulation, fee calculations |
| 7 | Audit & Compliance | Complete | Full audit trail, event logging |
| 8 | Admin Portal Foundation | Complete | Admin app, case management views |
| 9 | Reporting & MI | Complete | Management information, dashboards |
| 10 | User Management | Complete | Role-based access, user administration |
| 11 | Notifications | Complete | Email/SMS simulation, templates |
| 12 | Performance & Security | Complete | Rate limiting, helmet, CORS hardening |
| 13 | Accessibility | Complete | WCAG 2.1 AA compliance, screen reader support |
| 14 | Mobile Responsive | Complete | Responsive design, touch interactions |
| 15 | API Documentation | Complete | OpenAPI specs, SDK guide |
| 16 | Monitoring & Observability | Complete | Health checks, metrics, logging |
| 17 | Test Infrastructure | Complete | Vitest suite, coverage, CI integration |
| 18 | .NET Backend | Complete | MediatR+CQS architecture, 11 endpoints, Dockerfile, full API parity |
| 19 | Enterprise Persistence | Complete | Neon PostgreSQL integration, pg-schema migrations, pg-seed scripts |
| 20 | Live Deployment | Complete | .NET on Render, URI conversion, EF Core mapping, Docker deployment |
| 21 | Data Comes Alive | Complete | 100 applications seeded, API-first search, case actions persist to DB |
| 22 | Demo Enhancement | Complete | Smart scroll, sequential debts/assets, Apple Pay simulation, PDF generation |
| 23 | Admin Functionality | Complete | Reports builder, User CRUD wired to API, Data Retention policy engine |
| 24 | Interactive Admin | Complete | GitHub-style activity heatmap, Digital Signature canvas, Statistics time periods |
| 25 | Polish & Safety | Complete | Admin user display fixes, backend health checks, Data Export with filters |

---

## 5. Use Case Review Results

### Existing Use Cases (Documented in use-cases.md)

| ID | Use Case | Status |
|----|----------|--------|
| UC-01 | Application Submission | Documented |
| UC-02 | Product Recommendation | Documented |
| UC-03 | Document Upload | Documented |
| UC-04 | Credit Check | Documented |
| UC-05 | Payment Processing | Documented |
| UC-06 | Case Review (Admin) | Documented |
| UC-07 | Audit Trail Query | Documented |
| UC-08 | Notification Dispatch | Documented |
| UC-09 | Organisation Management | Documented |
| UC-10 | User Role Assignment | Documented |
| UC-11 | Report Generation (Basic) | Documented |
| UC-12 | System Health Monitoring | Documented |

### NEW Use Cases Required

| ID | Use Case | Description | Priority |
|----|----------|-------------|----------|
| UC-13 | Data Export with Search & Filter | Admin exports filtered application data in CSV/JSON/PDF formats with column selection and date ranges | HIGH |
| UC-14 | Backend Runtime Switching | System switches between Node.js and .NET backends at runtime without user disruption | MEDIUM |
| UC-15 | Digital Signature Capture | User provides legally-binding digital signature via canvas with tamper-evident storage | HIGH |
| UC-16 | Report Generation (Advanced) | Admin builds custom reports with drag-drop columns, grouping, charting, and scheduled delivery | MEDIUM |
| UC-17 | User Account Creation (API-persisted) | Admin creates user accounts that persist to Neon PostgreSQL via API with validation | HIGH |
| UC-18 | Data Retention Policy Management | Admin configures retention periods per data category with automated purge scheduling | MEDIUM |

---

## 6. Architecture Review Results

### Current architecture.md Coverage

| Topic | Status | Notes |
|-------|--------|-------|
| Microservices architecture | Accurate | Correctly describes service boundaries |
| API Gateway pattern | Accurate | BFF pattern well documented |
| Authentication design | Accurate | Keycloak simulation described |
| Frontend architecture | Accurate | Next.js SSR/SSG patterns |
| Data flow diagrams | Accurate | Request/response flows clear |
| Security layers | Accurate | Defence-in-depth approach |
| .NET backend as parallel implementation | MISSING | Not referenced anywhere |
| Neon PostgreSQL as persistent store | MISSING | Only SQLite mentioned |
| Render deployment (Docker containers) | MISSING | Only local/Docker Compose |
| Runtime backend switching pattern | MISSING | Novel pattern undocumented |
| Write-through cache (SQLite + Neon) | MISSING | Caching strategy absent |

### Required Architecture Updates

1. **Dual-Backend Topology** — Document the Node.js and .NET 9 parallel implementations, their shared contract, and the runtime switching mechanism
2. **Persistence Layer** — Update from "SQLite (POC)" to the actual Neon PostgreSQL + SQLite write-through cache architecture
3. **Deployment Architecture** — Add Render.com deployment topology showing Docker containers, environment variables, and health check endpoints
4. **Data Flow** — Add sequence diagrams showing write-through cache pattern (write to Neon, cache in SQLite, read from cache with fallback)

---

## 7. Admin Portal Review (38 Features)

### User Administration
| # | Feature | Description |
|---|---------|-------------|
| 1 | Users | View all users with role, status, last login |
| 2 | Manage Users | Full CRUD operations persisted to API |

### Organisation Management
| # | Feature | Description |
|---|---------|-------------|
| 3 | Organisations | 54 organisations with type, status, member count |

### Security & Access
| # | Feature | Description |
|---|---------|-------------|
| 4 | Security Headers | CSP, HSTS, X-Frame-Options configuration |
| 5 | API Keys | Key generation, rotation, scope management |
| 6 | Consent Management | GDPR consent records and withdrawal |
| 7 | QR Login | QR code generation for mobile authentication |
| 8 | Biometric Settings | Fingerprint/Face ID configuration |

### Reporting & Analytics
| # | Feature | Description |
|---|---------|-------------|
| 9 | Reports | Custom report builder with drag-drop |
| 10 | Export | CSV/JSON/PDF export with filters |
| 11 | MI Reports | Management information dashboards |
| 12 | Statistics | Time-period analysis with Recharts |

### Configuration
| # | Feature | Description |
|---|---------|-------------|
| 13 | Feature Flags | Toggle features per environment |
| 14 | Webhooks | Event-driven notification endpoints |
| 15 | Data Retention | Policy engine with automated purge |
| 16 | Workflow Engine | Configurable case processing workflows |

### Integrations
| # | Feature | Description |
|---|---------|-------------|
| 17 | Integration Monitor | Real-time status of external systems |
| 18 | Open Banking | Account information and payment initiation |

### Support Tools
| # | Feature | Description |
|---|---------|-------------|
| 19 | Knowledge Hub | Internal knowledge base and FAQs |
| 20 | Digital Mailroom | Inbound correspondence digitisation |
| 21 | Collaboration | Team messaging and case discussion |
| 22 | Voice Input | Speech-to-text for case notes |
| 23 | Document Scanner | Mobile document capture and OCR |

### Monitoring & Operations
| # | Feature | Description |
|---|---------|-------------|
| 24 | System Health | Service status, uptime, response times |
| 25 | Performance | APM metrics, slow queries, throughput |
| 26 | Activity Heatmap | GitHub-style contribution visualisation |
| 27 | Carbon Tracker | Infrastructure carbon footprint monitoring |

### Audit & Compliance
| # | Feature | Description |
|---|---------|-------------|
| 28 | Changelog | Version history with diff viewer |
| 29 | Accessibility Checker | WCAG 2.1 AA automated scanning |
| 30 | Satisfaction | User feedback collection and NPS |
| 31 | Correspondence Scheduler | Automated letter/email scheduling |
| 32 | Digital Signature | Canvas-based signature capture with validation |

### AI & Automation
| # | Feature | Description |
|---|---------|-------------|
| 33 | AI Governance | Model registry, bias monitoring, approval workflows |
| 34 | AI Explainability | Decision explanation and audit trail |
| 35 | Policy Simulation | What-if analysis for policy changes |
| 36 | Rules Engine | Business rule configuration and testing |

### Data Management
| # | Feature | Description |
|---|---------|-------------|
| 37 | Data Export | Filtered export with search and column selection |
| 38 | Data Import | Bulk data import with validation and mapping |

---

## 8. Documentation Gaps (Prioritised)

### HIGH Priority

| Gap | Type | Impact | Effort |
|-----|------|--------|--------|
| Sprints 18-25 not in delivery log | Missing content | Misrepresents project progress; stakeholders see 17 sprints not 25 | Low |
| .NET backend not in architecture doc | Missing architecture | Incomplete technical picture; .NET capability invisible | Medium |
| Neon PostgreSQL not documented | Missing integration | Missing persistence story; appears SQLite-only | Medium |
| Admin Portal Guide missing | Missing document | No admin feature catalogue; 38 features undiscoverable | High |
| Deployment runbook for Render | Missing operations | Team cannot deploy without tribal knowledge | Medium |

### MEDIUM Priority

| Gap | Type | Impact | Effort |
|-----|------|--------|--------|
| Release notes missing | Missing document | No versioned changelog; regression tracking difficult | Medium |
| 6 use cases undocumented (UC-13 to UC-18) | Missing use cases | Incomplete functional coverage; testing gaps | Medium |
| README sprint table outdated | Outdated content | First impression wrong; shows 17 not 25 sprints | Low |
| Roadmap doesn't show Sprints 18-29 | Outdated content | Future direction unclear to stakeholders | Low |
| .NET API SDK guide | Missing document | .NET consumers have no integration reference | Medium |

### LOW Priority

| Gap | Type | Impact | Effort |
|-----|------|--------|--------|
| User Support Guide missing | Missing document | Covered partially by admin guide | Medium |
| Deployment architecture diagram for Render | Missing diagram | Addressed when architecture.md updated | Low |
| Integration catalogue for Neon | Missing content | Low complexity; connection string only | Low |
| Performance benchmark comparison (Node vs .NET) | Missing analysis | Nice-to-have for technology selection | Medium |
| Disaster recovery for Neon | Missing operations | Neon has built-in branching/PITR | Low |

---

## 9. Recommended Improvements

### New Diagrams Required

1. **Render Deployment Architecture** — Show GitHub Pages frontend, Render.com containers (Node.js + .NET), Neon PostgreSQL, and traffic flow
2. **.NET Parallel Stack** — MediatR pipeline, CQS handlers, EF Core mapping, Docker layers
3. **Neon Data Flow** — Write-through cache pattern: API → Neon (persist) → SQLite (cache) → Read path
4. **Backend Switching** — Runtime toggle mechanism, health check fallback, response normalisation

### Missing Process Flows

1. **Backend Switching Flow** — User toggles backend → API middleware routes → health check → response
2. **Data Export Flow** — Filter selection → query build → format conversion → download/email
3. **Digital Signature Flow** — Canvas capture → hash generation → tamper-evident storage → verification
4. **Data Retention Flow** — Policy configuration → schedule evaluation → purge execution → audit log

### Missing Sequence Diagrams

1. **Application Submission → Neon Persistence** — Frontend → API Gateway → Neon INSERT → SQLite cache → confirmation
2. **Report Generation** — Builder config → query execution → chart rendering → PDF/CSV export
3. **User CRUD (API-persisted)** — Admin form → validation → API → Neon → cache invalidation → UI update

### Architecture Views

1. **Dual-Backend Deployment Topology** — Physical deployment showing both backends, load paths, and failover
2. **Data Architecture** — Logical data model showing Neon tables, SQLite cache schema, and sync patterns
3. **Security Architecture** — Updated to show Render.com security controls, Neon TLS, API key management

---

## 10. Prioritised Action Plan

| Priority | Action | Status | Document |
|----------|--------|--------|----------|
| 1 | Update sprint-delivery-log.md (Sprints 18-25) | Complete | docs/sprint-delivery-log.md |
| 2 | Create admin-portal-guide.md | Complete | docs/admin-portal-guide.md |
| 3 | Create release-notes.md | Complete | docs/release-notes.md |
| 4 | Update architecture.md (.NET + Neon + Render) | Complete | docs/architecture.md |
| 5 | Update use-cases.md (UC-13 to UC-18) | Complete | docs/use-cases.md |
| 6 | Update README.md (sprint table, live links) | Complete | README.md |
| 7 | Update roadmap.md (Sprints 18-29) | Complete | docs/roadmap.md |
| 8 | Create this documentation review | Complete | docs/IAAS_DOCUMENTATION_REVIEW.md |

---

## 11. Updated Documentation Inventory

**Total: 54 documentation files**

### Strategic (7 files)
| Document | Purpose |
|----------|---------|
| executive-summary.md | High-level project overview for senior stakeholders |
| business-requirements.md | Detailed business requirements and acceptance criteria |
| bid-positioning.md | Commercial positioning and win themes |
| options-analysis.md | Technology and approach options with recommendations |
| roadmap.md | Sprint plan and future direction |
| BETA_READINESS.md | Beta assessment criteria and readiness checklist |
| context-and-assumptions.md | Project constraints and working assumptions |

### Functional (7 files)
| Document | Purpose |
|----------|---------|
| personas.md | User archetypes and needs |
| user-stories.md | Agile user stories with acceptance criteria |
| use-cases.md | Detailed use case specifications (UC-01 to UC-18) |
| user-journeys.md | End-to-end journey maps |
| feature-catalogue.md | Complete feature inventory |
| functionality-breakdown.md | Detailed functional decomposition |
| admin-portal-guide.md | **NEW** — Admin portal feature catalogue (38 features) |

### Technical (8 files)
| Document | Purpose |
|----------|---------|
| architecture.md | System architecture and design decisions |
| architecture-decisions.md | ADR log (Architecture Decision Records) |
| integrations.md | External system integration specifications |
| security.md | Security architecture and controls |
| recommendation-engine.md | Rules engine design and configuration |
| identity-architecture.md | Authentication and authorisation design |
| api-sdk-guide.md | API consumer guide and SDK reference |
| data-model.md | Logical and physical data models |

### Operations (7 files)
| Document | Purpose |
|----------|---------|
| testing.md | Test strategy, coverage, and automation |
| administration-guide.md | System administration procedures |
| runbook.md | Operational runbook (general) |
| runbook-render.md | Render.com deployment and operations |
| disaster-recovery.md | DR procedures and RTO/RPO targets |
| code-quality-report.md | Static analysis and quality metrics |
| security-scan-report.md | Vulnerability scan results and remediation |

### Delivery (8 files)
| Document | Purpose |
|----------|---------|
| sprint-delivery-log.md | Sprint-by-sprint delivery record (1-25) |
| demo-script.md | Demonstration script for stakeholders |
| onboarding-guide.md | Developer onboarding and setup |
| cost-model.md | Infrastructure and operational costs |
| team-scaling-guide.md | Team growth and capability planning |
| vendor-assessment.md | Third-party vendor evaluation |
| go-live-checklist.md | Production readiness checklist |
| release-notes.md | **NEW** — Versioned release changelog |

### Compliance (5 files)
| Document | Purpose |
|----------|---------|
| ithc-penetration-test-report.md | IT Health Check / penetration test results |
| wcag-accessibility-audit.md | WCAG 2.1 AA accessibility audit |
| gds-service-assessment.md | GDS Service Standard assessment |
| authority-to-operate.md | ATO documentation and sign-off |
| IAAS_DOCUMENTATION_REVIEW.md | **NEW** — This document (review & gap analysis) |

### Statement of Work (4 files)
| Document | Purpose |
|----------|---------|
| statement-of-work.md | Contractual scope and deliverables |
| resource-plan.md | Team composition and allocation |
| project-plan.md | Timeline, milestones, and dependencies |
| payment-plan.md | Payment schedule and invoicing |

---

## Document Control

| Field | Value |
|-------|-------|
| Author | AiB IAAS POC Team |
| Version | 1.0 |
| Date | 2026-08-24 |
| Classification | OFFICIAL |
| Review Cycle | Per sprint |
| Next Review | Sprint 26 completion |
