# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AiB IAAS (Initial Application Advice Service) is a Proof of Concept for the Accountant in Bankruptcy's unified applications gateway. It demonstrates a multi-step application journey with microservices backend, rules-based product recommendations, and full audit trails.

**Key Note:** This is a POC with synthetic data. No real integrations, payments, or personal data are involved.

## Architecture

### System Structure

```
Users (Debtors/Representatives/Advisers/Staff)
    v
Web Portal (Next.js, port 3000) + Admin Portal (Next.js, port 3010)
    v
API Gateway (Express, port 3001) - BFF with auth, rate limiting, routing
    ├── Recommendation Service (port 3002) - Rules engine
    ├── Document Service (port 3003) - Upload, storage
    ├── Integration Orchestrator (port 3004) - System checks
    ├── Payment Service (port 3006) - Payment simulation
    ├── Audit Service (port 3007) - Event logging
    └── Mock Integrations (port 3005) - BASYS, eDEN, DAS, CFT, Moratorium, RoI
```

### Monorepo Structure

This is an npm workspaces monorepo with three workspace directories:

- **apps/** — Next.js user-facing applications
  - web: Public portal for applicants
  - admin: Internal review portal for AiB staff

- **services/** — Independent Express.js microservices
  - api-gateway, recommendation-service, document-service, integration-orchestrator
  - payment-service, audit-service, mock-integrations
  - credit-check-service, organisation-service, user-service, notification-service

- **packages/** — Shared code across apps and services
  - shared-types: TypeScript type definitions (Application, Debtor, Financial, etc.)
  - validation: Zod schemas for input validation
  - ui-components: GOV.UK-style React components
  - test-data: Synthetic data generators

### Technology Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | Next.js 14, React 18, Tailwind CSS | SSR, responsive, GOV.UK patterns |
| Backend | Express.js, TypeScript | Rapid dev, type-safe |
| Database | SQLite (POC) → PostgreSQL (prod) | Zero-config local |
| Storage | Local FS (POC) → S3 (prod) | Documents |
| Build/Test | tsx, vitest, TypeScript 5 | Fast testing |
| Infrastructure | Docker Compose, Terraform, GitHub Actions | Multi-environment |
| Validation | Zod | Shared schemas FE/BE |
| Security | Helmet, CORS, rate limiting | Defence in depth |

