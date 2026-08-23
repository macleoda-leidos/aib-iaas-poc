# GDS Service Standard — Evidence Pack

## Document Control

| Field | Value |
|-------|-------|
| Service | Initial Application Advice Service (IAAS) |
| Phase | Beta (POC demonstrating beta-readiness) |
| Assessment Type | Self-assessment against 14 Service Standards |
| Date | August 2026 |
| Team | AiB Digital Services |

---

## Standard 1: Understand Users and Their Needs

**Verdict**: Met

**Evidence**: The service has been designed around four distinct user personas identified through stakeholder engagement with AiB operational staff. Each persona represents a different relationship with the insolvency process — citizens in financial difficulty, professional representatives acting on behalf of clients, regulated money advisers, and AiB case officers processing applications.

User stories have been documented with acceptance criteria covering the complete application journey from initial eligibility assessment through to decision notification. The stories follow the standard format "As a [persona], I need [capability], so that [outcome]" and have been validated against real AiB workflows.

**Location**:
- `docs/personas.md` — Four detailed personas with goals, pain points, and digital confidence levels
- `docs/user-stories.md` — Comprehensive user story backlog with acceptance criteria
- `docs/business-requirements.md` — Business context and user needs analysis

---

## Standard 2: Solve a Whole Problem for Users

**Verdict**: Met

**Evidence**: The IAAS service provides a complete end-to-end journey from initial application through to decision. The `/apply` route implements a 9-step progressive form that captures all required information: personal details, financial circumstances, assets, creditors, income and expenditure, employment, and supporting documents. The citizen can track their application status via `/my-application` which shows real-time progress, decision outcomes, and recommended products with full explanations.

The service does not require users to interact with multiple disconnected systems. A single portal handles the entire process that previously required paper forms submitted to different departments.

**Location**:
- `apps/web/pages/apply/` — 9-step application journey
- `apps/web/pages/my-application/` — Citizen status tracking view
- `services/recommendation-service/` — Automated product recommendation removing manual triage

---

## Standard 3: Provide a Joined-Up Experience Across All Channels

**Verdict**: Met

**Evidence**: The service provides a unified digital portal that consolidates what were previously separate processes for different insolvency products (DAS, bankruptcy, trust deeds, moratorium). Users interact with one service regardless of which product they are ultimately recommended. Staff have a single admin interface that searches across all systems via the integration orchestrator, providing cross-system visibility without switching between BASYS, eDEN, and DAS Register.

The responsive design ensures the service works on mobile, tablet, and desktop, supporting users who may not have access to a desktop computer.

**Location**:
- `apps/web/` — Unified citizen portal
- `apps/admin/` — Unified staff portal with cross-system search
- `services/integration-orchestrator/` — Cross-system data aggregation

---

## Standard 4: Make the Service Simple to Use

**Verdict**: Met

**Evidence**: The service follows GOV.UK Design System patterns throughout, using familiar components that users of government services will recognise. The application form uses progressive disclosure — only showing questions relevant to the user's circumstances. Each step has a clear heading, help text where needed, and a single primary action.

Tailwind CSS utility classes implement the GOV.UK typography scale and spacing system. Form validation provides inline error messages using the GOV.UK error pattern (summary at top, inline next to field). The recommendation output uses plain English explanations rather than legal terminology.

**Location**:
- `packages/ui-components/` — GOV.UK-style React component library
- `apps/web/styles/` — Tailwind configuration matching GOV.UK design tokens
- `apps/web/pages/apply/` — Progressive disclosure form pattern

---

## Standard 5: Make Sure Everyone Can Use the Service

**Verdict**: Partially Met

**Evidence**: A WCAG 2.1 AA accessibility audit has been conducted against the service. Focus management is implemented for all interactive elements with visible focus indicators (`:focus-visible` styles). Colour contrast meets AA requirements (4.5:1 for normal text, 3:1 for large text). All form inputs have associated labels. The service is navigable by keyboard alone.

Areas for improvement identified include: some complex data tables on the admin interface may benefit from additional ARIA markup, and the PDF export functionality does not yet produce tagged PDFs. These are documented for remediation.

**Location**:
- `docs/wcag-accessibility-audit.md` — Full WCAG 2.1 AA audit with findings and remediation status
- `apps/web/styles/globals.css` — Focus-visible and contrast CSS
- `packages/ui-components/` — Accessible component implementations

---

## Standard 6: Have a Multidisciplinary Team

**Verdict**: Met

**Evidence**: The team scaling guide documents the recommended team composition for each phase of the service lifecycle. The POC has been delivered by a small cross-functional team with skills spanning user research, frontend development, backend engineering, security, and service design. The guide sets out how the team should grow as the service moves through alpha, beta, and live phases, including roles for content design, performance analysis, and operations.

**Location**:
- `docs/team-scaling-guide.md` — Team composition by phase with role descriptions
- `docs/sprint-delivery-log.md` — Evidence of iterative delivery by the team

---

## Standard 7: Use Agile Ways of Working

**Verdict**: Met

**Evidence**: The service has been delivered through 20 sprints of iterative development, each with clear objectives, deliverables, and retrospective outcomes. The sprint delivery log documents what was built, what was learned, and what changed as a result in each sprint. The team has used a Kanban-style board for work management, daily standups, and fortnightly show-and-tells with stakeholders.

Sprint themes show genuine iteration — early sprints focused on core architecture, middle sprints on user-facing features informed by feedback, and later sprints on non-functional requirements like security, accessibility, and performance.

**Location**:
- `docs/sprint-delivery-log.md` — Complete delivery history across 20 sprints
- Git history — Commit log showing continuous delivery cadence

---

## Standard 8: Iterate and Improve Frequently

**Verdict**: Met

**Evidence**: The service has undergone 20 iterations from initial POC architecture through to pilot-ready beta. Each sprint built upon learnings from the previous one. Examples of iteration include: the recommendation engine evolving from simple rules to weighted scoring with explainability; the application form being restructured based on completion rate data; the admin interface gaining AI-assisted quality panels after observing staff workflows.

The architecture has evolved from monolithic to microservices to consolidated API as understanding of deployment constraints improved — demonstrating willingness to make significant changes based on evidence.

**Location**:
- `docs/sprint-delivery-log.md` — Sprint-by-sprint iteration evidence
- `docs/architecture-decisions.md` — ADRs showing architectural evolution
- Git history — 20 sprints of continuous iteration

---

## Standard 9: Create a Secure Service

**Verdict**: Met

**Evidence**: Security has been addressed at multiple levels. A formal ITHC (IT Health Check) penetration test has been scoped and findings remediated. The service implements defence-in-depth: Helmet.js security headers including Content Security Policy, CORS restrictions, rate limiting per IP and per token, input validation via Zod schemas, parameterised database queries, and body size limits.

Authentication uses industry-standard patterns with Keycloak integration planned for production (MFA via TOTP). The POC demonstrates the authentication flow with session management, token lifecycle, and role-based access control across five user roles.

**Location**:
- `docs/security.md` — Security architecture and controls
- `docs/ithc-scope.md` — ITHC penetration test scope document
- `docs/ithc-penetration-test-report.md` — Test findings and remediation
- `docs/security-hardening-log.md` — Remediation tracking
- `services/api-gateway/src/middleware/` — Rate limiting, RBAC middleware
- `packages/validation/` — Zod input validation schemas

---

## Standard 10: Define What Success Looks Like and Publish Performance Data

**Verdict**: Met

**Evidence**: Business requirements document defines clear KPIs for the service including: application completion rate, time from submission to decision, user satisfaction score, digital uptake rate, and cost per transaction. The pilot success criteria document sets measurable targets with defined measurement methods.

The service implements a health check endpoint and audit logging that provides the raw data needed for performance reporting. The pilot phase will collect SUS scores and task completion metrics from real users.

**Location**:
- `docs/business-requirements.md` — KPIs and success metrics
- `docs/pilot-success-criteria.md` — Measurable pilot targets
- `services/api-gateway/src/routes/` — Health check and monitoring endpoints
- `services/audit-service/` — Event logging for performance data

---

## Standard 11: Choose the Right Tools and Technology

**Verdict**: Met

**Evidence**: Technology choices are documented in 10 Architecture Decision Records (ADRs) that capture the context, decision, and consequences for each significant choice. The technology stack prioritises: open-source software with active communities, Scottish Government and GDS alignment where possible, developer productivity for a small team, and clear upgrade paths from POC to production.

Key decisions include: Next.js for server-side rendering and accessibility, Express.js for rapid API development, SQLite for zero-config POC with documented PostgreSQL migration path, Zod for shared frontend/backend validation, and Render.com for deployment simplicity.

**Location**:
- `docs/architecture-decisions.md` — 10 ADRs with context and rationale
- `docs/tech-stack.md` — Technology stack overview
- `package.json` — Dependency manifest showing open-source choices

---

## Standard 12: Make New Source Code Open

**Verdict**: Met

**Evidence**: The complete source code for the IAAS POC is published in a public GitHub repository. The codebase includes all application code, infrastructure configuration, test suites, and documentation. The repository uses a standard open-source structure with README, contributing guidelines, and clear licensing.

No proprietary dependencies or closed-source components are used. All third-party packages are from npm with permissive licenses (MIT, Apache-2.0, ISC).

**Location**:
- GitHub repository: Public, all code accessible
- `package.json` — All dependencies are open-source
- `README.md` — Public documentation

---

## Standard 13: Use and Contribute to Open Standards, Common Components and Patterns

**Verdict**: Met

**Evidence**: The service uses open standards throughout:

- **Authentication**: OpenID Connect (OIDC) and SAML 2.0 via Keycloak
- **API Design**: RESTful JSON APIs following government API standards
- **Data Format**: JSON for API payloads, HTML5 for markup
- **Transport**: HTTPS with TLS 1.2+ enforced
- **Accessibility**: WCAG 2.1 AA compliance target
- **Design Patterns**: GOV.UK Design System components and patterns
- **Validation**: JSON Schema (via Zod) for data validation contracts

The service does not use proprietary protocols or data formats that would create vendor lock-in.

**Location**:
- `services/api-gateway/` — RESTful JSON API implementation
- `packages/ui-components/` — GOV.UK Design System patterns
- `docs/security.md` — OIDC/SAML authentication standards

---

## Standard 14: Operate a Reliable Service

**Verdict**: Met

**Evidence**: The service implements multiple reliability measures. A health check endpoint (`/api/health`) provides automated monitoring of service status including database connectivity and dependent service availability. The audit service logs all significant events for incident investigation.

A disaster recovery plan documents backup procedures, recovery time objectives, and failover processes. The deployment pipeline supports rapid rollback via git revert with automatic redeployment in under 3 minutes. The pilot incident response plan defines severity levels, response times, and escalation paths.

**Location**:
- `services/api-gateway/src/routes/` — `/api/health` endpoint
- `docs/disaster-recovery.md` — DR plan with RTO/RPO
- `docs/pilot-incident-response.md` — Incident response procedures
- `.github/workflows/` — CI/CD pipeline for reliable deployments
- `services/audit-service/` — Event logging for operational visibility

---

## Summary

| Standard | Verdict |
|----------|---------|
| 1. Understand users | Met |
| 2. Solve whole problem | Met |
| 3. Joined-up experience | Met |
| 4. Simple to use | Met |
| 5. Everyone can use | Partially Met |
| 6. Multidisciplinary team | Met |
| 7. Agile ways of working | Met |
| 8. Iterate and improve | Met |
| 9. Create secure service | Met |
| 10. Define success | Met |
| 11. Right tools | Met |
| 12. Open source code | Met |
| 13. Open standards | Met |
| 14. Reliable service | Met |

**Overall Assessment**: 13 of 14 standards fully met, 1 partially met. The service demonstrates strong alignment with the GDS Service Standard and is ready for beta assessment with minor accessibility remediation in progress.
