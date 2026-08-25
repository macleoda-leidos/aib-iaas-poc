# SOW Delivery Notes — Schedule 19 Alignment

## Overview

This document maps the POC artefacts to a 16-week Statement of Work delivery under the Schedule 19 SOW Order Procedure. It demonstrates how the technical approach proven by this POC would scale to a full delivery.

## Delivery Phases

### Phase 1: Discovery & Architecture (Weeks 1-2)

**POC Evidence:**
- `docs/architecture.md` — Full system architecture with component diagram
- `docs/context-and-assumptions.md` — Business context, constraints, risks
- `docs/data-model.md` — Entity relationships and data classification
- `packages/shared-types/` — Domain model as TypeScript types

**Full Delivery Activities:**
- Stakeholder interviews and requirements workshops
- Existing system analysis (BASYS, eDEN/DASH, DAS, CFT, Moratorium, RoI)
- Data mapping from existing systems to IAAS model
- Security and compliance requirements gathering
- Architecture Decision Records (ADRs)
- Technical Design Authority review

---

### Phase 2: Integration Design & Contracts (Weeks 3-4)

**POC Evidence:**
- `docs/integration-design.md` — Contracts for all 6 AiB system integrations
- `services/mock-integrations/` — Working stub APIs with defined schemas
- `services/mock-integrations/src/__tests__/contracts.test.ts` — Contract tests
- `services/integration-orchestrator/` — Parallel orchestration pattern

**Full Delivery Activities:**
- Formal API contract definition (OpenAPI 3.0)
- Integration architecture with ESB/API gateway team
- Network connectivity planning (VPN, PrivateLink)
- Authentication mechanism design (mTLS, OAuth, API keys)
- Data sharing agreements with each system team
- Contract test suite agreed with system owners
- Stub services provided to downstream teams

---

### Phase 3: Core Platform & Shared Services (Weeks 5-6)

**POC Evidence:**
- `services/user-service/` — RBAC with 10 roles, 20 permissions
- `services/organisation-service/` — Parent/child org hierarchy
- `services/audit-service/` — Full audit trail
- `services/notification-service/` — Multi-channel notifications
- `services/api-gateway/src/middleware/rbac.ts` — Permission enforcement
- `packages/validation/` — Shared validation schemas

**Full Delivery Activities:**
- Identity provider integration (Scottish Government myaccount / AD)
- Full permission model review with AiB business owners
- Organisation onboarding workflow
- Audit compliance review
- Email/SMS provider integration (Gov.UK Notify)
- Shared component library with design system

---

### Phase 4: Application Journey (Weeks 7-9)

**POC Evidence:**
- `apps/web/src/app/apply/page.tsx` — 8-step application form
- `apps/web/src/app/page.tsx` — Landing page with product information
- `services/recommendation-service/` — Rules engine with 7 product outcomes
- `services/document-service/` — Upload with virus scan placeholder
- `services/credit-check-service/` — Multi-provider credit check

**Full Delivery Activities:**
- UX research and user testing
- Accessibility audit (WCAG 2.1 AA)
- Content design (with AiB comms team)
- Full recommendation rules validation with AiB policy
- Document scanning integration (ClamAV or cloud-native)
- Credit Reference Agency procurement and integration
- Error handling and recovery flows

---

### Phase 5: Stakeholder Portals (Weeks 10-11)

**POC Evidence:**
- `apps/web/src/app/dashboard/page.tsx` — 5 role-specific dashboards
- `apps/admin/src/app/page.tsx` — Admin dashboard with KPIs
- `apps/admin/src/app/applications/[id]/page.tsx` — Full case review interface
- `apps/admin/src/app/organisations/page.tsx` — Org management
- `apps/admin/src/app/users/page.tsx` — User/role management

**Full Delivery Activities:**
- Money adviser workflow (submit on behalf of debtor)
- Creditor claims and voting workflow
- Trustee case management integration
- Payment distributor reporting
- Full case lifecycle management
- Bulk operations for AiB staff

---

### Phase 6: Payments & Submission (Weeks 12-13)

**POC Evidence:**
- `services/payment-service/` — Apple Pay, Google Pay, Card sandbox flows
- `apps/web/src/app/apply/page.tsx` (payment step) — Payment method selection UI

**Full Delivery Activities:**
- Payment Service Provider procurement (likely GOV.UK Pay)
- Apple Pay / Google Pay merchant registration
- PCI DSS compliance assessment
- Payment reconciliation with AiB finance
- Receipt generation and email confirmation
- Failed payment retry logic

---

### Phase 7: Testing & Integration (Weeks 14-15)

**POC Evidence:**
- `services/recommendation-service/src/__tests__/rules.test.ts` — Unit tests
- `services/mock-integrations/src/__tests__/contracts.test.ts` — Contract tests
- `scripts/smoke-test.sh` — End-to-end smoke test
- `.github/workflows/ci.yml` — CI pipeline

**Full Delivery Activities:**
- Full unit test coverage (>80%)
- Integration tests against real systems in FAT
- Performance/load testing
- Security testing (OWASP, penetration test)
- Accessibility testing (automated + manual)
- UAT with AiB staff and money advisers
- Data migration testing (if applicable)

---

### Phase 8: Deployment & Handover (Week 16)

**POC Evidence:**
- `infra/terraform/` — Full IaC for networking, compute, storage
- `infra/docker/` — Containerised deployment
- `.github/workflows/deploy.yml` — Automated deployment pipeline
- `docs/runbook.md` — Operational documentation

**Full Delivery Activities:**
- Production environment provisioning
- SSL certificate and domain setup
- Monitoring and alerting configuration
- Operational handover to AiB support team
- Knowledge transfer sessions
- Technical documentation finalisation
- Go/No-Go checklist sign-off
- Hypercare period planning

---

## Sizing & Estimates

| Phase | Weeks | Effort (person-days) | Team Size |
|-------|-------|---------------------|-----------|
| Discovery & Architecture | 2 | 20 | 2 |
| Integration Design | 2 | 20 | 2 |
| Core Platform | 2 | 30 | 3 |
| Application Journey | 3 | 45 | 3 |
| Stakeholder Portals | 2 | 30 | 3 |
| Payments & Submission | 2 | 20 | 2 |
| Testing & Integration | 2 | 30 | 3 |
| Deployment & Handover | 1 | 15 | 2 |
| **Total** | **16** | **210** | **3 avg** |

## Risk Register

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|-----------|
| R1 | AiB system APIs unavailable or undocumented | Medium | High | Mock-first approach proven; real integration is incremental |
| R2 | Accessibility non-compliance | Low | High | Built on GOV.UK patterns; early audit in Phase 4 |
| R3 | CRA procurement delays | Medium | Medium | Credit check is optional for recommendation; can proceed without |
| R4 | Policy rules change during delivery | Medium | Medium | Rules engine is configurable; factor validation is continuous |
| R5 | Performance issues at scale | Low | Medium | Architecture supports horizontal scaling; load test in Phase 7 |

## Dependencies

| Dependency | Owner | Required By |
|-----------|-------|-------------|
| BASYS API access | AiB IT | Phase 3 |
| eDEN/DAS API access | AiB IT | Phase 3 |
| Scottish Gov Identity integration | SG Digital | Phase 3 |
| CRA contract (Experian/Equifax) | AiB Procurement | Phase 4 |
| GOV.UK Pay onboarding | AiB Finance | Phase 6 |
| FAT/UAT environment access | AiB IT | Phase 7 |
| Production domain & SSL | AiB IT | Phase 8 |

## Success Criteria

1. ✅ Debtor can complete full application journey on mobile or desktop
2. ✅ System correctly recommends product based on financial circumstances
3. ✅ All AiB system checks execute and aggregate results
4. ✅ Staff can review, approve/reject applications with full audit trail
5. ✅ Role-based access enforces correct permissions per user type
6. ✅ Payment journey completes (sandbox)
7. ✅ Organisation hierarchy supports parent/child relationships
8. ✅ All integrations have defined contracts and can be independently replaced
9. ✅ Infrastructure is repeatable across environments via Terraform
10. ✅ CI/CD pipeline automates build, test, and deployment
