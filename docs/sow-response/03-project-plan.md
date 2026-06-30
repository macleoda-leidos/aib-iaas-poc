# Project Plan — Applications Gateway Service

## 1. Sprint Schedule

| Sprint | Weeks | Dates | Focus |
|--------|-------|-------|-------|
| Sprint 0 | 1-2 | 7 Jul – 18 Jul 2026 | Discovery, setup, requirements clarification |
| Sprint 1 | 3-4 | 21 Jul – 1 Aug 2026 | IAAS core: personal details, address, debts |
| Sprint 2 | 5-6 | 4 Aug – 15 Aug 2026 | Income, assets, documents, credit check |
| Sprint 3 | 7-8 | 18 Aug – 29 Aug 2026 | Recommendation engine, AI mock, integrations |
| Sprint 4 | 9-10 | 1 Sep – 12 Sep 2026 | RBAC (500 users), org hierarchy, admin portal |
| Sprint 5 | 11-12 | 15 Sep – 26 Sep 2026 | Identity (ScotAccount), payment, UAT prep |
| Sprint 6 | 13-14 | 29 Sep – 10 Oct 2026 | UAT, defect remediation, performance |
| Sprint 7 | 15-16 | 13 Oct – 24 Oct 2026 | Production deployment, handover, hypercare start |

## 2. Key Milestones

| # | Milestone | Date | Deliverable |
|---|-----------|------|-------------|
| M1 | Requirements clarification complete | 11 Jul 2026 | Confirmed backlog, agreed priorities |
| M2 | Environment ready (FAT) | 18 Jul 2026 | CI/CD pipeline deploying to FAT |
| M3 | IAAS core application (MVP) | 1 Aug 2026 | Application form with 9 sections working |
| M4 | Integrations operational | 29 Aug 2026 | Credit check, postcode, cross-system checks |
| M5 | RBAC & Admin portal | 12 Sep 2026 | 500 users, org management, role matrix |
| M6 | P2 incident resolved | 8 Aug 2026 | Fix deployed to production |
| M7 | UAT entry | 15 Sep 2026 | All features code-complete, deployed to UAT |
| M8 | UAT sign-off | 10 Oct 2026 | Test team approval, defects resolved |
| M9 | Production deployment | 20 Oct 2026 | Live release via Route to Live |
| M10 | Handover complete | 24 Oct 2026 | Documentation, knowledge transfer done |

## 3. Sprint Lifecycle

```
Day 1: Sprint Planning (PO + Team)
  ↓
Days 2-8: Development (daily stand-ups)
  ↓
Day 9: Code freeze, integration testing
  ↓
Day 10: Sprint Review (demo to AiB) + Retrospective
```

### Definition of Ready (for backlog items)
- Acceptance criteria defined
- Dependencies identified
- UX wireframe approved (where applicable)
- Technical approach agreed
- Estimated (story points)

### Definition of Done
- Code written and peer-reviewed
- Unit tests pass (coverage ≥ 60%)
- Integration tests pass
- Deployed to FAT
- Acceptance criteria verified
- Documentation updated

## 4. Testing Approach

### Unit Testing
- **Tool**: Vitest
- **Coverage threshold**: 60% (CI gate)
- **Scope**: Business logic, validation, rules engine, RBAC helpers
- **Timing**: Written alongside code (TDD where appropriate)

### Functional Acceptance Testing (FAT)
- **Environment**: Automated deployment via CI/CD
- **Scope**: API contract tests, smoke tests, integration tests
- **Timing**: Automated on every merge to main
- **Owner**: Development team

### User Acceptance Testing (UAT)
- **Environment**: UAT (mirrors production)
- **Scope**: End-to-end user journeys per role
- **Timing**: Sprints 5-6 (2 weeks)
- **Owner**: AiB test team (supported by supplier Test Engineer)

### Defect Management
- **Tool**: Jira / Azure DevOps
- **Severity levels**: P1 (blocking), P2 (major), P3 (minor), P4 (cosmetic)
- **SLAs**: P1 fix within 4 hours, P2 within 1 sprint, P3/P4 prioritised in backlog
- **Pre-release**: All P1/P2 resolved before production
- **Post-release**: 4-week hypercare with defined response times

## 5. Release Strategy

| Release | Content | Target Date | Gate |
|---------|---------|-------------|------|
| R1 (FAT) | Sprint 1-2 features | 15 Aug 2026 | Unit + integration tests pass |
| R2 (UAT) | All features | 15 Sep 2026 | FAT complete + PO sign-off |
| R3 (Pre-Prod) | UAT-approved build | 13 Oct 2026 | UAT sign-off + performance test |
| R4 (Production) | Final build | 20 Oct 2026 | Pre-Prod verification + CAB approval |

## 6. Competing Priority Management

The SOW identifies "competing priority of previous ongoing sprint at development stage". This is managed by:

1. **Sprint Planning**: PO prioritises items; if conflict arises, escalate to Delivery Manager
2. **Capacity ring-fencing**: P2 incident allocated dedicated capacity (10 days)
3. **Transparency**: Burndown charts visible to all; any capacity impact flagged immediately
4. **Trade-off decisions**: If new priority emerges, PO decides what is deferred, not added
