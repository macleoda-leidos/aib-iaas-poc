# Team Scaling Guide — IAAS Platform

This document outlines the team structure required at each phase of the IAAS platform lifecycle, from the current single-developer POC through to a fully operational live service supporting 10,000+ users.

---

## Phase Overview

| Phase | Timeline | FTE | Monthly Staff Cost (est.) |
|-------|----------|-----|---------------------------|
| POC (Current) | Months 0-3 | 1.0 | £8,000 |
| Alpha | Months 3-9 | 3.5 | £30,000 |
| Beta | Months 9-15 | 7.0 | £60,000 |
| Live | Months 15-18+ | 10.0 | £85,000 |

---

## POC Phase (Current) — 1.0 FTE

### Full-Stack Developer (1.0 FTE)

**Seniority**: Senior (8+ years experience)

**Responsibilities**:
- All frontend development (Next.js, React, Tailwind CSS)
- All backend development (Express.js, TypeScript)
- Database design and implementation
- Infrastructure setup (GitHub Pages, Render.com, Docker)
- Testing (unit, integration, E2E)
- Documentation and stakeholder demos
- Architecture decisions

**Key Skills**: TypeScript, React, Node.js, SQL, Docker, CI/CD, GOV.UK patterns

**Notes**: The POC phase deliberately uses a single developer to demonstrate velocity and reduce coordination overhead. All architectural decisions are documented (see ADRs) to enable seamless handover.

---

## Alpha Phase (6 months) — 3.5 FTE

The Alpha phase introduces real integrations, a production database, and pilot users. The team expands to handle increased complexity and the need for specialist skills.

### Backend Developer (1.0 FTE) — NEW

**Seniority**: Mid-Senior (5-7 years)

**Responsibilities**:
- PostgreSQL migration and optimisation
- Real integration development (BASYS, eDEN APIs)
- API performance tuning and caching
- Service-level monitoring and alerting
- Database administration during transition

**Key Skills**: TypeScript, Node.js, PostgreSQL, REST API design, message queues, integration patterns

### Business Analyst (0.5 FTE) — NEW

**Seniority**: Mid (3-5 years, public sector experience preferred)

**Responsibilities**:
- Requirements gathering with AiB operational teams
- User story writing and acceptance criteria
- Process mapping for current-state vs. future-state
- Stakeholder management and reporting
- UAT coordination with pilot users

**Key Skills**: Agile BA practices, process mapping (BPMN), stakeholder management, public sector domain knowledge

### Tester / QA Engineer (0.5 FTE) — NEW

**Seniority**: Mid (3-5 years)

**Responsibilities**:
- Test strategy and planning
- Automated test suite expansion (target: 80%+ coverage)
- Accessibility testing (WCAG 2.1 AA compliance)
- Performance testing (load, stress, soak)
- Security testing coordination with ITHC provider

**Key Skills**: Playwright, Vitest, accessibility testing tools (axe, WAVE), performance testing (k6, Artillery), OWASP knowledge

### DevOps Engineer (0.5 FTE) — NEW

**Seniority**: Mid-Senior (5+ years)

**Responsibilities**:
- AWS infrastructure provisioning (Terraform)
- CI/CD pipeline hardening (GitHub Actions → AWS deployment)
- Container orchestration (ECS Fargate)
- Monitoring and alerting setup (Datadog/CloudWatch)
- Security configuration (WAF, security groups, IAM)

**Key Skills**: AWS, Terraform, Docker, GitHub Actions, monitoring tools, networking, security hardening

### Full-Stack Developer (1.0 FTE) — EXISTING (from POC)

**Responsibilities evolve to**:
- Technical leadership and architecture governance
- Frontend feature development
- Code review and mentoring
- Sprint planning and technical estimation
- Stakeholder demos and technical documentation

---

## Beta Phase (12 months) — 7.0 FTE

The Beta phase introduces public-facing users, additional portals (creditor, adviser), and requires dedicated security and delivery management.

### Frontend Developer (1.0 FTE) — NEW

**Seniority**: Mid (3-5 years)

**Responsibilities**:
- Creditor and adviser portal development
- Responsive design and mobile optimisation
- Component library maintenance (`packages/ui-components`)
- Accessibility remediation from audit findings
- Design system governance

**Key Skills**: React, Next.js, TypeScript, Tailwind CSS, accessibility (ARIA), responsive design, design systems

### Security Engineer (1.0 FTE) — NEW

**Seniority**: Senior (7+ years, SC clearance required)

**Responsibilities**:
- Security architecture review and threat modelling
- Keycloak production configuration and federation
- Penetration test coordination and remediation tracking
- Security incident response planning
- Compliance evidence gathering (Cyber Essentials Plus, ISO 27001)
- Data protection impact assessment (DPIA) support

**Key Skills**: Application security, identity/access management, OWASP, penetration testing, compliance frameworks, SC clearance

### Business Analyst (1.0 FTE) — EXPANDED (from 0.5)

**Additional responsibilities**:
- Multi-stakeholder requirements (creditors, advisers, citizens)
- Service design and user journey mapping
- GDS service assessment preparation
- Benefits realisation tracking

### Tester / QA Engineer (1.0 FTE) — EXPANDED (from 0.5)

**Additional responsibilities**:
- Cross-browser testing strategy
- Regression test suite maintenance (500+ tests)
- User acceptance testing facilitation
- Non-functional testing (performance, security, accessibility)

### DevOps Engineer (1.0 FTE) — EXPANDED (from 0.5)

**Additional responsibilities**:
- Multi-environment management (dev, staging, production)
- Disaster recovery implementation and testing
- Infrastructure cost optimisation
- On-call rotation setup
- Runbook authoring

---

## Live Phase (18 months) — 10.0 FTE

The Live phase supports a production service with SLA commitments, requiring dedicated support, database administration, and delivery management.

### Support Engineer (1.0 FTE) — NEW

**Seniority**: Mid (3-5 years)

**Responsibilities**:
- Level 2/3 incident response and resolution
- User support escalation handling
- Known issue documentation and workarounds
- Monitoring dashboard maintenance
- On-call rotation participation
- Service desk tooling and reporting

**Key Skills**: Incident management, ITIL, monitoring tools, SQL for investigation, communication skills, shift flexibility

### Database Administrator (1.0 FTE) — NEW

**Seniority**: Mid-Senior (5-7 years)

**Responsibilities**:
- PostgreSQL performance tuning and query optimisation
- Backup strategy and disaster recovery testing
- Database migration planning and execution
- Data retention policy implementation
- Capacity planning and growth forecasting
- Read replica management

**Key Skills**: PostgreSQL administration, performance tuning, backup/recovery, data modelling, migration tooling (Flyway/Liquibase)

### Delivery Manager (1.0 FTE) — NEW

**Seniority**: Senior (7+ years, public sector delivery experience)

**Responsibilities**:
- Sprint planning, retrospectives, and ceremonies
- Stakeholder reporting and governance
- Risk and dependency management
- Budget tracking and forecasting
- Team health and continuous improvement
- Vendor/supplier management
- GDS assessment preparation

**Key Skills**: Agile delivery (Scrum/Kanban), stakeholder management, risk management, budgeting, GDS service standard, team leadership

---

## Recruitment Timeline

| Month | Hire | Phase |
|-------|------|-------|
| 3 | Backend Developer | Alpha |
| 3 | DevOps Engineer (0.5) | Alpha |
| 4 | Business Analyst (0.5) | Alpha |
| 5 | Tester (0.5) | Alpha |
| 9 | Frontend Developer | Beta |
| 9 | Security Engineer | Beta |
| 10 | Expand BA to 1.0 | Beta |
| 10 | Expand Tester to 1.0 | Beta |
| 11 | Expand DevOps to 1.0 | Beta |
| 15 | Support Engineer | Live |
| 15 | Database Administrator | Live |
| 16 | Delivery Manager | Live |

---

## Skills Matrix

| Skill | POC | Alpha | Beta | Live |
|-------|-----|-------|------|------|
| TypeScript/Node.js | 1 | 2 | 3 | 3 |
| React/Next.js | 1 | 1 | 2 | 2 |
| PostgreSQL | 0 | 1 | 1 | 2 |
| AWS/Cloud | 0 | 0.5 | 1 | 1 |
| Security | 0 | 0 | 1 | 1 |
| Testing/QA | 0 | 0.5 | 1 | 1 |
| Business Analysis | 0 | 0.5 | 1 | 1 |
| Delivery Management | 0 | 0 | 0 | 1 |
| Support/Operations | 0 | 0 | 0 | 1 |

---

## Related Documents

- [Cost Model](./cost-model.md)
- [Roadmap](./roadmap.md)
- [Go-Live Checklist](./go-live-checklist.md)
