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
