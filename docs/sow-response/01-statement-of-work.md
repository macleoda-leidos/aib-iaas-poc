# Statement of Work — Applications Gateway Service (IAAS)

## 1. Overview

| Field | Detail |
|-------|--------|
| Project | Applications Gateway Service — Initial Application Advice Service (IAAS) |
| Duration | 16 weeks (July 2026 — October 2026) |
| Methodology | Agile (Scrum), 2-week sprints |
| Supplier | [Supplier Name] |
| Client | Accountant in Bankruptcy (AiB), Scottish Government |

## 2. Scope

### In Scope
- IAAS: Application journey for debtors (personal details, address history, debts, income, assets, documents)
- Product recommendation engine (rules-based + AI-assisted explanation)
- Third-party integrations: postcode lookup, credit check (Equifax/Experian sandbox)
- Mobile upload of documentary evidence (responsive PWA with ClamAV scanning)
- Complex RBAC: 500 users, 9 role levels, 19+ external organisations
- Cross-system checks: BASYS, eDEN/DASH, DAS, CFT, Moratorium, RoI
- Payment simulation: Apple Pay, Google Pay, Card (sandbox)
- Identity verification: ScotAccount, GOV.UK One Login integration design
- Keycloak SSO architecture and federation design
- Admin portal: application review, user/org management, reporting
- Route to Live: FAT, UAT, Pre-Prod, Production deployment
- P2 incident resolution (parallel workstream)
- Post-release support (4-week hypercare)

### Out of Scope
- Real payment processing (sandbox only during SOW period)
- Live CRA data (Equifax/Experian contract is procurement activity)
- ScotAccount production federation (requires SG engagement)
- Data migration from legacy systems
- Training delivery (training materials in scope, delivery separate)

## 3. Assumptions

1. AiB provides access to FAT/UAT environments within 2 weeks of SOW start
2. Requirements clarification meeting held in Week 1
3. Product Owner available for sprint reviews and backlog prioritisation
4. Mock integration contracts are acceptable until real API access is provided
5. Existing AiB CI/CD pipelines (Azure DevOps or GitHub Actions) can be extended
6. Scottish Government design patterns acceptable (not mandating full GDS audit during SOW)
7. P2 incident details provided within Week 1; fix can be delivered alongside sprint work
8. AiB test team available for UAT from Week 12

## 4. Dependencies

| # | Dependency | Owner | Required By |
|---|-----------|-------|-------------|
| D1 | FAT/UAT environment access | AiB IT | Week 2 |
| D2 | BASYS/eDEN API documentation | AiB IT | Week 3 |
| D3 | P2 incident details and reproduction steps | AiB | Week 1 |
| D4 | Product Owner for sprint reviews | AiB | Ongoing |
| D5 | UX feedback on wireframes | AiB | Within 5 days of submission |
| D6 | Test team availability for UAT | AiB | Week 12 |
| D7 | Production deployment slot confirmation | AiB | Week 14 |

## 5. Risks

| # | Risk | Probability | Impact | Mitigation |
|---|------|:-----------:|:------:|-----------|
| R1 | AiB system APIs undocumented | Medium | High | Mock-first development; real integration incremental |
| R2 | P2 incident more complex than estimated | Medium | Medium | Ring-fenced capacity (senior dev); escalation to AiB if >5 days |
| R3 | UAT delays due to environment issues | Low | High | Early environment setup; container-based fallback |
| R4 | Competing sprint priorities conflict | Medium | Medium | Clear prioritisation with PO; sprint planning transparency |
| R5 | CRA procurement delays | Medium | Low | Sandbox flow complete; real integration is config change only |
| R6 | Identity provider (ScotAccount) engagement slow | Medium | Medium | Design complete in SOW; implementation in subsequent phase |

## 6. Delivery Approach

### Methodology
- **Scrum** with 2-week sprints (8 sprints total)
- **Sprint 0** (Week 1-2): Discovery, environment setup, requirements clarification
- **Sprints 1-6** (Week 3-14): Development, integration, testing
- **Sprint 7** (Week 15-16): Hardening, deployment, handover

### Ceremonies
- Sprint Planning (Day 1 of each sprint)
- Daily Stand-up (15 min, video call)
- Sprint Review/Demo (Last day of sprint, with AiB stakeholders)
- Sprint Retrospective (Team only, last day)
- Backlog Refinement (Mid-sprint, 1 hour)

### Route to Live
```
Development → FAT (automated) → UAT (manual test) → Pre-Prod → Production
```

Each release follows AiB's Route to Live process:
1. Code review + automated tests (CI gate: 60% coverage minimum)
2. FAT deployment (automated via pipeline)
3. UAT sign-off (AiB test team)
4. Pre-Prod validation (production-like environment)
5. Production release (blue/green deployment)

## 7. Rollback Approach

| Scenario | Approach | RTO |
|----------|----------|-----|
| Application bug (non-critical) | Hotfix branch → expedited pipeline | 4 hours |
| Critical failure post-deploy | Revert to previous container image (blue/green) | 15 minutes |
| Database issue | Point-in-time recovery from automated backups | 30 minutes |
| Infrastructure failure | Terraform re-apply from last known state | 1 hour |
| Full rollback required | Previous release tag deployed; DB migration reversed | 2 hours |

All deployments are reversible. Blue/green deployment means the previous version remains running until the new version is verified healthy.

## 8. Post-Release Support

- **4-week hypercare** period following production release
- **Response times**: P1 (1 hour), P2 (4 hours), P3 (next business day)
- **Support model**: Named senior developer on-call during business hours
- **Defect management**: Jira/Azure DevOps, triaged within 4 hours
- **Handover**: Full documentation, runbook, and knowledge transfer sessions
