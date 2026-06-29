# AiB Initial Application Advice Service (IAAS) — Proof of Concept

> **Applications Gateway Service** — Schedule 19 SOW Technical Demonstration

## Overview

This repository contains a complete Proof of Concept for the AiB Initial Application Advice Service. It demonstrates how a debtor or representative can navigate a unified application journey to receive a recommendation for the most suitable Scottish debt solution.

**⚠️ This is a POC — not production software. All data is synthetic. No real payments, credit checks, or system integrations are performed.**

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for containerised deployment)

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start all backend services
npm run dev:services

# In a separate terminal, start the web portal
npm run dev:web

# In a separate terminal, start the admin portal  
npm run dev:admin
```

### Docker Deployment

```bash
# Build and run all services
docker compose -f infra/docker/docker-compose.yml up --build
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Web Portal | http://localhost:3000 | Public-facing application form |
| Admin Portal | http://localhost:3010 | Internal AiB staff review |
| API Gateway | http://localhost:3001 | Backend API |
| Mock Integrations | http://localhost:3005 | Stub AiB system APIs |

## What This Demonstrates

1. ✅ Multi-step application form (personal details, address, debts, income, documents)
2. ✅ Placeholder postcode lookup
3. ✅ Placeholder credit check
4. ✅ Cross-system case checks (BASYS, eDEN/DASH, DAS, CFT, Moratorium, RoI)
5. ✅ Rules-based product recommendation engine
6. ✅ AI-assisted explanation (mock)
7. ✅ Payment simulation (Apple Pay, Google Pay, Card)
8. ✅ Document upload
9. ✅ Admin review portal
10. ✅ Full audit trail
11. ✅ Mobile-responsive, accessible design
12. ✅ API-first architecture
13. ✅ Infrastructure-as-code (Terraform)
14. ✅ CI/CD pipeline (GitHub Actions)
15. ✅ Contract tests for integrations

## Repository Structure

```
/apps
  /web          → IAAS responsive web portal (Next.js)
  /admin        → Internal administration portal (Next.js)

/services
  /api-gateway              → Public API / BFF
  /recommendation-service   → Rules-based product engine
  /document-service         → Upload and document management
  /integration-orchestrator → Parallel system checks
  /mock-integrations        → Stub APIs for all AiB systems
  /payment-service          → Payment simulation
  /audit-service            → Audit event capture

/packages
  /shared-types    → TypeScript type definitions
  /validation      → Zod validation schemas
  /test-data       → Synthetic data generators
  /ui-components   → GOV.UK-style React components

/infra
  /terraform       → AWS infrastructure modules
  /docker          → Docker Compose & Dockerfiles

/docs              → Architecture, API, integration, data model docs
```

## Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend | Next.js 14, React 18, Tailwind CSS | Enterprise-ready, SSR, accessible |
| API | Express.js, TypeScript | Rapid development, type-safe |
| Database | SQLite (POC) → PostgreSQL (prod) | Zero-config local, production path |
| Storage | Local FS (POC) → S3 (prod) | Free local, scalable cloud |
| Infrastructure | Docker, Terraform, GitHub Actions | Industry standard, repeatable |
| Validation | Zod | Shared FE/BE schemas |

## Environment Strategy

| Environment | Purpose | Deployment |
|-------------|---------|-----------|
| Local | Development & POC demo | Docker Compose |
| FAT | Automated functional testing | AWS ECS (Terraform) |
| UAT | User acceptance testing | AWS ECS (Terraform) |
| PreProd | Pre-production validation | AWS ECS (mirrors prod) |
| Production | Live service | AWS ECS (full HA) |

## Cost Profile

| Component | POC Cost | Production Cost |
|-----------|----------|-----------------|
| Compute | Free (local Docker) | ECS Fargate (~£200/month FAT) |
| Database | Free (SQLite) | RDS PostgreSQL (~£30/month FAT) |
| Storage | Free (local FS) | S3 (~£5/month) |
| CI/CD | Free (GitHub Actions) | Free (public repo) / £0-44/month |
| DNS/SSL | N/A | Route53 + ACM (~£5/month) |

## Documentation

- [Architecture Overview](docs/architecture.md)
- [API Design](docs/api-first-design.md)
- [Integration Design](docs/integration-design.md)
- [Data Model](docs/data-model.md)
- [Context & Assumptions](docs/context-and-assumptions.md)

## License

Crown Copyright © Accountant in Bankruptcy. POC demonstration only.
