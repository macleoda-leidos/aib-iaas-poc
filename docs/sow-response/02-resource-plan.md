# Resource Plan — Applications Gateway Service

## 1. Team Structure (GDS Roles)

| Role | Name/Allocation | Rate Band | Sprint Allocation |
|------|----------------|-----------|-------------------|
| Delivery Manager | 1 × 0.5 FTE | SFIA 5 | All sprints |
| Technical Lead / Architect | 1 × 1.0 FTE | SFIA 6 | All sprints |
| Senior Developer | 2 × 1.0 FTE | SFIA 5 | Sprints 0-7 |
| Developer | 2 × 1.0 FTE | SFIA 4 | Sprints 1-7 |
| Test Engineer | 1 × 1.0 FTE | SFIA 4 | Sprints 2-7 |
| UX Designer | 1 × 0.5 FTE | SFIA 4 | Sprints 0-4 |
| DevOps Engineer | 1 × 0.5 FTE | SFIA 5 | Sprints 0-2, 6-7 |

**Total team**: 7 individuals, 5.5 FTE equivalent

## 2. Roles & Responsibilities

### Delivery Manager
- Sprint planning and facilitation
- Stakeholder communication
- Risk and dependency management
- Progress reporting to AiB
- Coordination with AiB's existing delivery landscape

### Technical Lead / Architect
- Architecture decisions and technical direction
- Code review and quality assurance
- Integration design (BASYS, eDEN, credit check, identity)
- Infrastructure design (Terraform, Docker, CI/CD)
- P2 incident technical lead

### Senior Developer (×2)
- Core IAAS application development
- Recommendation engine (rules + AI mock)
- RBAC implementation (500 users, org hierarchy)
- Integration development (mock → real)
- P2 incident fix (one senior dev ring-fenced)

### Developer (×2)
- Frontend development (Next.js, React, GOV.UK patterns)
- API development (Express services)
- Document upload and scanning
- Payment integration (sandbox)
- Unit test development

### Test Engineer
- Test strategy and plan
- Automated test suite (Vitest, Playwright)
- UAT support and coordination
- Defect management
- Performance testing

### UX Designer
- Use cases and user journeys
- Wireframes and mockups for stakeholder review
- Accessibility compliance (WCAG 2.1 AA)
- Mobile-first responsive design
- Design system alignment (GOV.UK / Scottish Gov)

### DevOps Engineer
- CI/CD pipeline (GitHub Actions)
- Infrastructure as Code (Terraform/Bicep)
- Environment provisioning (FAT, UAT, Pre-Prod, Prod)
- Monitoring and alerting setup
- Container orchestration (Docker, Azure Container Apps)

## 3. Effort Estimate by Role

| Role | Sprint 0 | Sprints 1-2 | Sprints 3-4 | Sprints 5-6 | Sprint 7 | **Total Days** |
|------|:--------:|:-----------:|:-----------:|:-----------:|:--------:|:--------------:|
| Delivery Manager | 5 | 10 | 10 | 10 | 5 | **40** |
| Technical Lead | 10 | 20 | 20 | 20 | 10 | **80** |
| Senior Dev (×2) | 20 | 40 | 40 | 40 | 20 | **160** |
| Developer (×2) | 0 | 40 | 40 | 40 | 20 | **140** |
| Test Engineer | 0 | 10 | 20 | 20 | 10 | **60** |
| UX Designer | 10 | 10 | 10 | 5 | 0 | **35** |
| DevOps Engineer | 10 | 10 | 5 | 5 | 10 | **40** |
| **Total** | **55** | **140** | **145** | **140** | **75** | **555 days** |

## 4. Alignment to Delivery Approach

| Phase | Sprints | Key Roles Active | Focus |
|-------|---------|-----------------|-------|
| Discovery | Sprint 0 | All | Requirements, architecture, environment setup |
| Build | Sprints 1-4 | Dev-heavy | Core features, integrations, RBAC |
| Integration | Sprints 5-6 | Dev + Test | End-to-end testing, UAT prep |
| Release | Sprint 7 | DevOps + Test | Deployment, hardening, handover |

## 5. P2 Incident Parallel Track

| Week | Effort | Role |
|------|--------|------|
| 1 | 2 days | Senior Dev (investigation) |
| 2-3 | 5 days | Senior Dev (fix + test) |
| 4 | 2 days | Test Engineer (regression) |
| 5 | 1 day | DevOps (deployment) |
| **Total** | **10 days** | Ring-fenced from sprint capacity |
