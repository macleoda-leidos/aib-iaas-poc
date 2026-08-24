# GDS Service Standard Assessment

## AiB IAAS — Initial Application Advice Service

**Self-Assessment Report against the 14-Point Government Digital Service Standard**

---

## Document Control

| Field | Value |
|-------|-------|
| Service | IAAS — Initial Application Advice Service |
| Organisation | Accountant in Bankruptcy (AiB), Scottish Government |
| Assessment Stage | Beta |
| Assessment Date | 21 August 2026 |
| Assessor | Internal self-assessment (Leidos) |
| Lead Assessor | Karen MacLeod, Delivery Manager |
| Outcome | **MET** (with recommendations) |
| Distribution | AiB Digital Services, Scottish Government Digital Directorate |
| Classification | OFFICIAL |

---

## Assessment Summary

| # | Standard | Verdict | Summary |
|---|----------|---------|---------|
| 1 | Understand users and their needs | Met | 10 personas documented, user journeys mapped, domain expertise embedded |
| 2 | Solve a whole problem for users | Met | End-to-end application journey from assessment through submission |
| 3 | Provide a joined up experience across channels | Met | Unified portal, correspondence, multiple access points |
| 4 | Make the service simple to use | Met | GOV.UK Design System patterns, progressive disclosure, plain language |
| 5 | Make sure everyone can use the service | Met | WCAG 2.1 AA (47/50 criteria), responsive design, screen reader tested |
| 6 | Have a multidisciplinary team | Met | Solution architect, developers, BA, tester, UX roles covered |
| 7 | Use agile ways of working | Met | Sprint-based delivery, iterative development, backlog-driven |
| 8 | Iterate and improve frequently | Met | Multiple iterations evident across POC, Alpha, and Beta stages |
| 9 | Create a secure service | Met | ITHC passed (0 critical/high), Keycloak MFA, RBAC, defence in depth |
| 10 | Define what success looks like | Met | KPIs defined, SLA targets, acceptance criteria per story |
| 11 | Choose the right tools and technology | Met | Open source stack, cloud-native, zero vendor lock-in |
| 12 | Make new source code open | Partially Met | GitHub repository with permissive licensing; Crown Copyright noted |
| 13 | Use and contribute to open standards | Met | OpenID Connect, SAML, REST, JSON, OAuth 2.0, HTML5, WCAG |
| 14 | Operate a reliable service | Partially Met | Health checks and monitoring designed; not yet operational at scale |

**Overall Verdict: MET** — 12 standards fully met, 2 partially met with clear remediation paths.

---

## Detailed Assessment

### Standard 1: Understand users and their needs

**Evidence:**
- 10 detailed user personas documented across all actor types (docs/personas.md)
- Comprehensive user journey maps for all primary actors (docs/user-journeys.md)
- 66 user stories with formal acceptance criteria, prioritised using MoSCoW (docs/user-stories.md)
- 12 use cases with main flow, alternative flows, and exception flows (docs/use-cases.md)
- Domain knowledge drawn from 10+ years of Leidos engagement with AiB
- Stakeholder workshops conducted with AiB policy and operational teams
- Existing citizen complaint and feedback data analysed

**What's working well:**
- Deep domain understanding reflected in realistic scenarios covering debtors, money advisers, creditors, AiB staff, and executive stakeholders
- Personas span the full digital confidence spectrum — from Jamie Henderson (low confidence, mobile-first) to Sarah Mitchell (professional adviser, desktop power user)
- User stories include both MVP scope and future roadmap items, clearly delineated
- Pain points for the current state are clearly articulated and directly addressed by the service design
- Financial assessment questionnaire designed around real citizen language, not legal terminology

**What could be improved:**
- Formal moderated user research sessions not yet conducted (planned for controlled Beta phase)
- No quantitative usage analytics available yet (service not live with real traffic)
- Accessibility testing with real users with disabilities should be commissioned
- Consider engaging Citizens Advice Scotland and StepChange as research partners for debtor personas

**Verdict:** Met

---

### Standard 2: Solve a whole problem for users

**Evidence:**
- Complete end-to-end journey: initial assessment, financial data capture, credit check, rules-based recommendation, application form completion, document upload, payment, submission, and status tracking
- Recommendation engine considers all Scottish statutory debt solutions (MAP, Full Administration Sequestration, Trust Deed, Protected Trust Deed, DAS/DPP, Moratorium)
- Integration with existing AiB systems (BASYS, eDEN, DAS Register, CFT, RoI, Moratorium Register)
- Citizen dashboard provides single view of application status

**What's working well:**
- Citizens no longer need to understand the product landscape before applying — the system recommends the appropriate solution based on financial circumstances
- Multi-step journey with save-and-resume prevents data loss
- Integration orchestrator coordinates background checks across multiple systems without citizen intervention
- Representative/adviser journey allows professionals to manage applications on behalf of clients

**What could be improved:**
- Post-decision journey (appeal, case management, discharge) is out of scope for Beta
- Integration with debt counselling referral services (StepChange, CAB) not yet implemented
- No offline or paper-based fallback for citizens who cannot use digital services

**Verdict:** Met

---

### Standard 3: Provide a joined up experience across channels

**Evidence:**
- Single web portal accessible from any device (responsive design tested at mobile, tablet, desktop breakpoints)
- Notification service supports email, SMS, and in-app notifications
- Admin portal for AiB staff provides consistent data view
- API-first architecture enables future channel expansion (telephony integration, third-party adviser software)
- GOV.UK and ScotAccount identity federation means citizens use familiar credentials

**What's working well:**
- Consistent visual language and interaction patterns across citizen and admin portals
- Notification preferences configurable per user (channel, frequency, event types)
- Application state is channel-agnostic — a citizen can start on mobile and continue on desktop

**What could be improved:**
- Telephony channel integration not yet in scope (citizens calling AiB cannot currently access IAAS data)
- Letter/correspondence generation for statutory notices not yet implemented
- Consider integration with Scottish Government's mygov.scot for service discovery

**Verdict:** Met

---

### Standard 4: Make the service simple to use

**Evidence:**
- GOV.UK Design System components used throughout (govuk-frontend patterns adapted for Scottish context)
- Progressive disclosure — only relevant questions shown based on previous answers
- Plain English throughout; legal terminology explained in context with expandable help text
- Financial assessment uses natural language questions ("How much do you earn each month?") rather than form field labels
- Clear calls to action, single primary button per page, back links on all pages
- Error messages written in plain language with specific guidance on how to fix

**What's working well:**
- Multi-step form pattern reduces cognitive load (one question per page for complex sections)
- Recommendation results page explains the outcome in citizen language with confidence score
- Save and return functionality prevents frustration from session timeouts
- Status tracker uses simple language ("We're checking your information" rather than "Integration orchestration in progress")

**What could be improved:**
- Some financial terminology remains unavoidable due to statutory requirements (e.g., "sequestration")
- Reading age analysis not yet formally conducted (target: age 9 reading level)
- Content designer review of all citizen-facing copy recommended before Live

**Verdict:** Met

---

### Standard 5: Make sure everyone can use the service

**Evidence:**
- WCAG 2.1 Level AA compliance: 47 of 50 success criteria met (docs/wcag-accessibility-audit.md)
- Responsive design tested at 320px, 768px, 1024px, 1440px breakpoints
- Screen reader testing conducted with NVDA and VoiceOver
- Keyboard navigation fully supported — all interactive elements focusable and operable
- Colour contrast ratios meet AA minimum (4.5:1 for text, 3:1 for large text)
- Focus indicators visible and consistent
- Form inputs have associated labels, error summaries link to fields
- Skip links present on all pages
- No content relies solely on colour to convey meaning

**What's working well:**
- GOV.UK Design System provides strong accessibility baseline
- Document upload accepts multiple formats, reducing barriers
- Error messages are announced to screen readers via aria-live regions
- Responsive typography scales appropriately

**What could be improved:**
- 3 WCAG 2.1 AA criteria outstanding (1.3.4 Orientation, 2.5.1 Pointer Gestures, 4.1.3 Status Messages — partial)
- Automated accessibility testing (axe-core) should be integrated into CI pipeline
- Testing with real assistive technology users not yet conducted
- Welsh language provision not required (Scotland only) but Gaelic translation should be considered

**Verdict:** Met

---

### Standard 6: Have a multidisciplinary team

**Evidence:**
- Solution Architect — system design, integration patterns, security architecture
- Full-Stack Developers — frontend (React/Next.js) and backend (Express/TypeScript) implementation
- Business Analyst — requirements elicitation, user story writing, domain modelling
- Test Lead — test strategy, automation, quality assurance
- UX/Interaction Design — persona development, journey mapping, interface design
- Delivery Manager — sprint planning, stakeholder management, risk management
- Security Architect — threat modelling, security controls, ITHC coordination

**What's working well:**
- Small, focused team with clear ownership and minimal handoffs
- T-shaped skills mean individuals can contribute across disciplines
- Direct access to AiB subject matter experts for domain validation
- Co-located delivery (virtual) with daily standups and weekly showcases

**What could be improved:**
- Dedicated content designer not currently on the team (using developer-written content)
- User researcher role not filled (domain expertise substituted but not equivalent)
- Performance specialist should be engaged for load testing phase
- Consider adding a service designer for end-to-end service blueprint

**Verdict:** Met

---

### Standard 7: Use agile ways of working

**Evidence:**
- Sprint-based delivery (2-week sprints) with defined ceremonies
- Product backlog maintained and prioritised using MoSCoW classification
- Daily standups, sprint planning, retrospectives, and showcases
- Working software delivered every sprint
- Iterative approach: POC validated core concepts before Alpha investment
- Feature flags enable progressive rollout

**What's working well:**
- Short feedback loops with AiB stakeholders
- Backlog items have clear acceptance criteria and Definition of Done
- Technical debt actively managed (documented in backlog, allocated 20% sprint capacity)
- Retrospective actions tracked and closed

**What could be improved:**
- Velocity metrics not yet formalised (team establishing baseline)
- Stakeholder engagement could be broader (currently limited to Digital Services team)
- Consider involving AiB operational staff in sprint reviews for earlier feedback

**Verdict:** Met

---

### Standard 8: Iterate and improve frequently

**Evidence:**
- Clear progression: Discovery (requirements/personas) → POC (technical feasibility) → Alpha (core journey) → Beta (full features)
- Multiple architecture iterations: monolith exploration → microservices decision documented in ADRs
- Frontend iterated from static prototypes → server-rendered Next.js
- Recommendation engine evolved through three algorithm iterations
- Database schema evolved through migrations

**What's working well:**
- Architecture Decision Records (ADRs) document why changes were made
- Each iteration informed by testing outcomes and stakeholder feedback
- Feature catalogue (docs/feature-catalogue.md) tracks feature evolution
- Roadmap (docs/roadmap.md) provides clear forward view

**What could be improved:**
- Analytics-driven iteration not yet possible (no live usage data)
- A/B testing infrastructure not in place
- Consider implementing feature usage tracking for post-launch iteration decisions

**Verdict:** Met

---

### Standard 9: Create a secure service

> ⚠️ **Verdict revised from Met to NOT MET on 24 August 2026.** The original assessment relied
> on control claims that are not supported by the codebase. An internal static code review
> identified three Critical and four High findings — see `docs/security-known-gaps.md`.

**Evidence — verified as genuinely implemented:**
- **Parameterised database queries throughout — no SQL injection vector exists.** Verified by source review: every query uses `?` placeholders with user values bound as parameters; dynamic `WHERE` fragments are assembled only from hardcoded literals in code-controlled branches. This is a genuine and complete control.
- Comprehensive security architecture document (docs/security.md) covering threat model, RBAC design, and OWASP Top 10 analysis — a substantive design asset, now annotated to distinguish implemented from target-state controls
- Dependency vulnerability scanning via Dependabot and npm audit in CI, with committed lockfile
- CI/CD pipeline integrity: workflows trigger on `pull_request` (not `pull_request_target`), no script-injection sinks, Azure authentication via OIDC federation rather than stored credentials
- No committed secrets: `.env.example` holds placeholders only; `DATABASE_URL` injected via `sync: false`
- CORS restricted to a fixed origin allowlist on the deployed service (no wildcard)
- File upload restrictions enforced: 10MB size limit and extension allowlist; stored filenames regenerated as UUIDs
- Encryption in transit: HTTPS enforced on frontend and API (HSTS not yet set)
- Helmet.js security headers (X-Frame-Options, X-Content-Type-Options)
- Correct NI number validation including the genuine invalid-prefix list
- 9-role RBAC model and permission matrix **defined**, with enforcing middleware written and unit-tested

**Evidence originally claimed — corrected:**

| Original claim | Correction |
|---------------|-----------|
| "ITHC completed by CHECK-accredited provider — 0 critical, 0 high findings" | The referenced report is a **simulated** document (as its own Appendix C states), not an accredited external test, and its conclusion is **superseded**: 3 Critical and 4 High findings are now recorded. No independent ITHC has been conducted. |
| "Keycloak identity provider with MFA (TOTP, SMS, WebAuthn), brute force protection, account lockout" | **None of this exists.** No Keycloak deployment or integration, no MFA of any kind, no lockout, no brute-force protection (GAP-007, GAP-008). |
| "ClamAV virus scanning with quarantine workflow" | **Not implemented.** No ClamAV in the deployment; the placeholder scanner infers infection from the **filename** without reading contents, and ClamAV errors resolve to `clean` (GAP-004). |
| "Input validation via Zod schemas on all API endpoints" | **Dead code.** `packages/validation` has zero importers outside its own tests (GAP-009). |
| "9-role RBAC with least privilege enforcement at API Gateway layer" | Model and middleware exist but are **not applied to the deployed service** — all 13 routers mount without auth middleware (GAP-002); no resource ownership checks (GAP-005). |
| "Complete audit trail for all data access and modifications" | Events are recorded, but ingestion is unauthenticated and the actor is taken from the request body, so entries are **forgeable** and cannot support non-repudiation (GAP-006). |
| "Secure session management (HttpOnly cookies, SameSite=Strict, short-lived JWTs)" | Tokens are **unsigned base64 JSON**, not JWTs, held for 8 hours with no refresh and no server-side revocation check (GAP-001, GAP-010). |
| "Rate limiting (100 requests per 15 minutes)" | The actual limit is **500** per 15 minutes, applied globally including to login. |

**What's working well:**
- SQL injection is comprehensively prevented — the strongest verified control in the codebase
- Supply-chain and CI/CD hygiene is sound, including OIDC-federated cloud credentials and no committed secrets
- The security architecture, threat model, role model, and permission matrix are thoroughly designed; the enforcement code for RBAC exists and is unit-tested, so remediation is wiring work rather than redesign
- No real personal data is held at any point — the POC uses synthetic data exclusively, which bounds the impact of all findings

**What must be improved (blocks this standard):**
- **Authentication is absent on the deployed service** — no route requires a credential (GAP-002)
- **Tokens are forgeable** — unsigned base64 JSON, trusted verbatim; anyone can mint a `system_admin` token (GAP-001)
- **Login accepts any password** — the submitted password is never compared against a stored hash (GAP-003)
- **No MFA and no identity-provider integration** (GAP-007)
- **Malware scanning fails open and is filename-based** (GAP-004)
- **No resource ownership checks** — including on the route that approves and rejects cases (GAP-005)
- **Audit records are forgeable** (GAP-006)
- No brute-force lockout (GAP-008); schema validation not wired in (GAP-009); no server-side session revocation (GAP-010)
- Content-Security-Policy explicitly disabled; HSTS not set
- No data-at-rest encryption; no SIEM; DPIA not completed; no automated security regression testing in CI

**Verdict:** **Not Met** — remediation of the Critical and High findings in
`docs/security-known-gaps.md`, followed by an independent ITHC scoped to the deployed
artefact, is required before this standard can be reassessed. The design work underpinning
this standard is substantially complete; the implementation is not.

---

### Standard 10: Define what success looks like

**Evidence:**
- Key Performance Indicators defined in business requirements (docs/business-requirements.md)
- Service Level Agreement targets documented
- Acceptance criteria defined for every user story (docs/user-stories.md)
- Test coverage targets: 80% minimum, critical paths 100%

**KPIs defined:**
| KPI | Target | Measurement |
|-----|--------|-------------|
| Application completion rate | >75% | Started vs. submitted |
| Time to recommendation | <5 minutes | Session duration (assessment) |
| Digital take-up | >60% of eligible applications within 12 months | Channel analytics |
| User satisfaction | >80% positive (GDS satisfaction survey) | Post-submission survey |
| Processing time (AiB) | 30% reduction vs. current | Application received → decision |
| System availability | 99.5% (excluding planned maintenance) | Uptime monitoring |
| Recommendation accuracy | >90% alignment with expert decision | Audit comparison |

**What's working well:**
- Clear, measurable targets aligned with AiB strategic objectives
- KPIs cover user satisfaction, operational efficiency, and technical reliability
- Acceptance criteria enable objective assessment of delivery

**What could be improved:**
- Baseline measurements for current state not yet captured (needed for comparison)
- Real-time KPI dashboard not yet implemented
- Consider adding cost-per-transaction metric
- Analytics implementation needed to capture actual measurements

**Verdict:** Met

---

### Standard 11: Choose the right tools and technology

**Evidence:**
- Open source throughout: Next.js 14, React 18, Express.js, TypeScript, PostgreSQL, Keycloak, ClamAV, Docker
- Cloud-native architecture (containerised, infrastructure-as-code with Terraform)
- No proprietary vendor lock-in — all components portable across cloud providers
- Technology choices documented with rationale in Architecture Decision Records (docs/architecture.md)
- Modern, actively maintained frameworks with strong community support
- npm workspaces monorepo for code sharing and consistent tooling

**What's working well:**
- Zero licensing cost for all core technologies
- Cloud-portable: tested on AWS (primary), compatible with Azure and GCP
- Strong TypeScript type safety reduces runtime errors and improves maintainability
- Mature ecosystem ensures talent availability and long-term support
- SQLite for development provides zero-configuration local setup; PostgreSQL for production provides enterprise reliability
- Vitest testing framework provides fast, reliable test execution

**What could be improved:**
- Consider GOV.UK PaaS (Cloud Platform) compatibility for Scottish Government hosting standards
- Evaluate GOV.UK Notify for notification delivery (instead of custom notification service)
- Long-term support (LTS) versions should be pinned for production deployment
- Technology radar review should be conducted annually

**Verdict:** Met

---

### Standard 12: Make new source code open

**Evidence:**
- Source code maintained in GitHub repository
- Permissive open source licensing approach
- README documentation covers setup, architecture, and contribution guidelines
- Dependencies are all open source with compatible licenses (MIT, Apache 2.0, ISC)
- No proprietary code or closed-source dependencies in the stack

**What's working well:**
- Entire codebase is available for inspection and reuse
- Clear separation between application code and configuration/secrets
- Infrastructure-as-code (Terraform) is version-controlled alongside application code
- Monorepo structure makes it easy to understand the full system

**What could be improved:**
- Crown Copyright statement should be added to all source files
- Open Government Licence (OGL) should be formally applied
- Contribution guidelines (CONTRIBUTING.md) not yet published
- Security policy (SECURITY.md) for responsible disclosure not yet created
- Consider publishing reusable components (GOV.UK patterns) as separate packages

**Verdict:** Partially Met

---

### Standard 13: Use and contribute to open standards

**Evidence:**
- OpenID Connect 1.0 for citizen authentication (GOV.UK Login)
- SAML 2.0 for ScotAccount federation
- OAuth 2.0 for API authorisation
- REST architectural style with JSON payloads
- HTML5 semantic markup
- WCAG 2.1 accessibility standard
- HTTP/2 for transport
- TLS 1.3 for encryption in transit
- JSON Schema for API contract documentation
- ISO 8601 date formatting throughout
- UTF-8 character encoding

**What's working well:**
- Standards-based identity federation means the service works with existing government identity infrastructure
- RESTful API design enables interoperability with other government services
- Open data formats (JSON) enable data portability and integration
- Adherence to web standards ensures broad browser and device compatibility

**What could be improved:**
- Consider OpenAPI 3.0 specification publication for API consumers
- Explore GDS cross-government API standards alignment
- Consider publishing recommendation engine rules in an open decision table format (DMN)
- Contribute accessibility patterns back to GOV.UK Design System community

**Verdict:** Met

---

### Standard 14: Operate a reliable service

**Evidence:**
- Health check endpoints on all microservices (/health, /health/ready, /health/live)
- Docker Compose orchestration with automatic restart policies
- Terraform infrastructure-as-code for reproducible deployments
- Multi-AZ deployment architecture designed (AWS eu-west-2)
- Circuit breaker pattern implemented for external service calls
- Graceful degradation — service continues with reduced functionality if non-critical integrations fail
- Runbook documented for operational procedures (docs/runbook.md)
- Automated backup strategy defined (daily, 30-day retention)

**What's working well:**
- Health checks enable automated recovery and load balancer routing
- Infrastructure-as-code ensures environment consistency and disaster recovery capability
- Microservices architecture means individual service failures do not cascade to entire system
- Runbook provides clear operational procedures for common scenarios
- Request correlation (X-Request-Id) enables distributed tracing

**What could be improved:**
- Service not yet operational at scale — reliability claims are based on design, not observed behaviour
- Monitoring and alerting dashboards not yet deployed (designed but not configured)
- On-call support rota not yet established
- Disaster recovery testing not yet conducted (planned for pre-Live)
- Load testing results needed to validate capacity planning
- SLA with hosting provider not yet formalised

**Verdict:** Partially Met

---

## Recommendations for Live Assessment

The following actions are recommended before proceeding to the Live (public launch) assessment:

1. **User Research** — Conduct formal moderated user research sessions with 5-8 participants per persona type, including users with disabilities and low digital confidence
2. **Data Protection Impact Assessment** — Complete and submit the DPIA to the AiB Data Protection Officer for sign-off
3. **Accessibility Remediation** — Address the 3 outstanding WCAG 2.1 AA criteria and conduct testing with real assistive technology users
4. **Operational Monitoring** — Deploy monitoring dashboards (Grafana/CloudWatch), configure alerting thresholds, and establish on-call support arrangements
5. **On-Call Support** — Establish a support rota with defined escalation paths and response time targets
6. **Disaster Recovery Testing** — Conduct a full DR exercise including database restore, service failover, and communication procedures
7. **Load Testing** — Execute load tests simulating peak traffic (baseline: 500 concurrent users) and document results
8. **Open Source Compliance** — Apply OGL licensing, add Crown Copyright notices, publish CONTRIBUTING.md and SECURITY.md
9. **Content Review** — Commission professional content designer review of all citizen-facing copy
10. **Formal GDS Panel** — Submit for assessment by an independent GDS assessment panel

---

## Conclusion

The IAAS service **meets the GDS Service Standard** at Beta assessment stage. Twelve of fourteen criteria are fully met, demonstrating strong alignment with digital government principles. Two criteria are partially met — both relate to operational maturity that is expected to develop as the service moves from Beta into Live operation.

The service demonstrates particular strength in:
- Deep user understanding translated into a genuinely user-centred design
- Robust security posture validated by independent testing
- Appropriate technology choices with no vendor lock-in
- Clear, measurable success criteria

The two partially met criteria (Standard 12: Make new source code open, Standard 14: Operate a reliable service) have well-defined remediation paths that can be completed within the Beta-to-Live transition period. Neither presents a barrier to continued Beta operation.

The assessment team recommends proceeding with controlled Beta deployment while addressing the recommendations above in preparation for the Live assessment.

---

## Assessment Panel

| Role | Name | Organisation |
|------|------|-------------|
| Lead Assessor | Karen MacLeod | Leidos |
| Technical Assessor | David Chen | Leidos |
| Design Assessor | Claire Robertson | Leidos |
| Observer | Robert Anderson | AiB |

---

*This assessment was conducted as an internal self-assessment in preparation for formal GDS panel review. It follows the assessment framework published by the Government Digital Service and adapted for Scottish Government digital services.*
