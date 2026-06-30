# AiB IAAS - Architecture Overview

## System Context

The Initial Application Advice Service (IAAS) is part of the Applications Gateway — a user-centric portal that replaces product-centric silos with a unified application journey. It sits between citizens/debtors and AiB's existing backend systems.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Users                                     │
│  Debtors │ Representatives │ Advisers │ AiB Staff               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │   Applications Gateway     │
         │   (IAAS Web Portal)        │
         │   - Next.js / React        │
         │   - Mobile-first PWA       │
         │   - GOV.UK Design System   │
         └─────────────┬─────────────┘
                       │
         ┌─────────────┴─────────────┐
         │      API Gateway / BFF     │
         │   - Express.js             │
         │   - Auth, rate limiting    │
         │   - Request routing        │
         └─────────────┬─────────────┘
                       │
    ┌──────────────────┼──────────────────────┐
    │                  │                      │
┌───┴────┐    ┌───────┴────────┐    ┌───────┴────────┐
│Recommend│    │  Integration   │    │   Document     │
│Service  │    │  Orchestrator  │    │   Service      │
└─────────┘    └───────┬────────┘    └────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │    Mock Integrations       │
         │  ┌──────┐ ┌──────┐       │
         │  │BASYS │ │eDEN  │       │
         │  ├──────┤ ├──────┤       │
         │  │ DAS  │ │ CFT  │       │
         │  ├──────┤ ├──────┤       │
         │  │Morat.│ │ RoI  │       │
         │  └──────┘ └──────┘       │
         └───────────────────────────┘
```

## Architectural Principles

1. **API-First** — All functionality exposed through versioned REST APIs
2. **Service-Oriented** — Independently deployable services with clear boundaries
3. **User-Centric** — Single gateway, not product silos
4. **Secure by Design** — Defence in depth, zero trust between services
5. **Cloud-Ready** — Containerised, infrastructure-as-code, 12-factor
6. **Accessible** — WCAG 2.1 AA, mobile-first responsive
7. **Auditable** — Every action logged, full audit trail
8. **Integration-Ready** — Clear contracts for each AiB system integration

## Component Architecture

### Frontend Layer
- **Web Portal** (apps/web) — Next.js 14 with App Router, Tailwind CSS, GOV.UK patterns
- **Admin Portal** (apps/admin) — Internal review interface for AiB staff
- **Mobile** — PWA approach (justification: free deployment, single codebase, offline-capable, no app store approval needed for POC)

### Service Layer
| Service | Port | Responsibility |
|---------|------|---------------|
| API Gateway | 3001 | Routing, auth, rate limiting, BFF |
| Recommendation | 3002 | Rules-based product recommendation |
| Document | 3003 | Upload, storage, virus scan |
| Integration Orchestrator | 3004 | Parallel system checks |
| Mock Integrations | 3005 | Stub APIs for all AiB systems |
| Payment | 3006 | Payment simulation |
| Audit | 3007 | Event capture and trail |

### Data Layer
- **SQLite** (POC) → **PostgreSQL** (production) via abstraction layer
- **Local filesystem** (POC) → **S3** (production) for documents
- **In-memory** state for payments → **DynamoDB/Redis** in production

### Infrastructure Layer
- Docker Compose for local development
- Terraform for AWS (ECS Fargate, ALB, RDS, S3)
- GitHub Actions for CI/CD
- Environment parity: local → FAT → UAT → PreProd → Prod

## Technology Stack Justification

| Choice | Rationale |
|--------|-----------|
| Node.js/TypeScript | Rapid development, type safety, shared types FE/BE, large ecosystem |
| Next.js | SSR, file-based routing, enterprise adoption, Vercel free tier for POC |
| Express.js | Lightweight, well-understood, easy to containerise |
| SQLite → PostgreSQL | Zero-config local, production-ready path |
| Tailwind CSS | Utility-first, responsive, GOV.UK-compatible |
| Docker | Consistent environments, cloud-ready |
| Terraform | Industry standard IaC, multi-environment |

## Security Architecture (Production)

- HTTPS everywhere (ALB terminates TLS)
- JWT/OIDC authentication (Scottish Government Identity)
- Role-based access (applicant, adviser, staff, admin)
- Input validation (Zod schemas, shared FE/BE)
- Rate limiting and WAF
- Encrypted at rest (S3 SSE-KMS, RDS encryption)
- Encrypted in transit (TLS 1.3)
- Secrets in AWS Secrets Manager
- Audit logging of all operations
- GDPR/DPA compliant data handling

## Deployment Strategy

- Blue/green deployment via ECS
- Database migrations as part of deployment pipeline
- Feature flags for progressive rollout
- Rollback capability at infrastructure and application level
- Health checks and auto-recovery

## Current Service Inventory (Updated)

| # | Service | Port | Purpose |
|---|---------|------|---------|
| 1 | API Gateway | 3001 | BFF, routing, auth, rate limiting, application CRUD |
| 2 | Recommendation | 3002 | Rules-based product recommendation engine |
| 3 | Document | 3003 | Upload, storage, ClamAV virus scanning |
| 4 | Integration Orchestrator | 3004 | Parallel cross-system checks |
| 5 | Mock Integrations | 3005 | Stub APIs for BASYS, eDEN, DAS, CFT, Moratorium, RoI |
| 6 | Payment | 3006 | Apple Pay, Google Pay, Card sandbox |
| 7 | Audit | 3007 | Full event trail |
| 8 | Credit Check | 3008 | Multi-provider (Synthetic, Experian, Equifax sandbox) |
| 9 | Organisation | 3009 | Parent/child hierarchy, relationships |
| 10 | User | 3011 | RBAC (8 roles, 23 permissions), sessions |
| 11 | Notification | 3012 | In-app, email/SMS placeholder |
| 12 | Identity | 3013 | ScotAccount/GOV.UK Verify, federation |
| 13 | Consolidated API | 3001 | All services combined for cloud deployment |

## Shared Packages (Reusable)

| Package | Purpose | Reused By |
|---------|---------|-----------|
| @aib-iaas/shared-types | TypeScript interfaces for all entities | All services + frontends |
| @aib-iaas/validation | Zod schemas (shared FE/BE validation) | API Gateway, Web app |
| @aib-iaas/ui-components | GOV.UK-style React components | Web app, Admin app |
| @aib-iaas/test-data | Synthetic data generators + presets | Tests, seeding |

## Reusable Component Patterns

- **UploadDocsPanel** — Used in Debtor dashboard, Adviser dashboard, Supplier dashboard
- **ActionButton** — Shared across all dashboards (accepts onClick handler)
- **KpiCard** — Used in all 5 role dashboards
- **StatusBadge** — Used in dashboards, admin portal, portal work queue
- **Input** — Shared form input with label, hint, error, types
- **Panel** — Admin detail view section wrapper

## Application Form (9 Sections)

1. Personal Details & Aliases (identity verification + other names)
2. Address History (5-year) with postcode lookup
3. Debts (repeatable creditor entries)
4. Income & Expenditure (monthly breakdown)
5. Assets (property, vehicles, savings, other)
6. Documents (upload with ClamAV scanning)
7. System Checks (cross-system integration)
8. Recommendation (rules engine output)
9. Payment & Submit (Apple Pay/Google Pay/Card)

## Identity Architecture

See docs/identity-architecture.md for the full Keycloak consolidation strategy.
Key pages: /login (mock Keycloak SSO), /portal (unified work queue with role filtering)
