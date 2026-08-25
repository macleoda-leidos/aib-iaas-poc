# IAAS — Bid Positioning Document

**Initial Application Advice Service | Proof of Concept**

*Demonstrating capability beyond the Statement of Work*

---

## Executive Summary

The IAAS Proof of Concept does not merely meet the Statement of Work requirements — it exceeds them across every evaluation dimension. Where the SOW requests an application gateway, IAAS delivers a full-spectrum digital insolvency platform encompassing recommendation intelligence, AI-powered document processing, policy simulation, and unified case management. This document maps demonstrated capabilities against requirements and articulates the strategic value delivered.

The POC represents working, deployable software — not slide-ware. Every capability described herein exists as functional code that can be demonstrated, inspected, and extended. The architecture is production-ready in pattern, requiring only the expected hardening (real integrations, security testing, accessibility audit) to progress through Alpha to Live.

This solution is built on ten years of direct experience with AiB's systems, processes, and strategic ambitions. It reflects deep understanding of the operational reality: the manual workarounds, the data quality challenges, the citizen journey friction, and the staff frustration with fragmented tooling.

---

## Requirements Alignment

| SOW Requirement | IAAS Capability | Status | Evidence |
|----------------|-----------------|--------|----------|
| Online application channel for citizens | Multi-step guided application journey with save/resume | **Delivered** | `/apps/web` — full Next.js application |
| Identity verification | ScotAccount, GOV.UK Login, SAML federation patterns | **Delivered** | Auth middleware with MFA support |
| Role-based access control | 10 roles with granular permissions matrix | **Delivered** | RBAC middleware with permission checks |
| Integration with legacy systems | Adapter pattern for BASYS, eDEN, ASTRA, CFT, Moratorium, RoI | **Delivered** | `/services/mock-integrations` |
| Document upload | Upload with file type validation and ClamAV scanning | **Delivered** | `/services/document-service` |
| Payment processing | GOV.UK Pay-pattern payment simulation | **Delivered** | `/services/payment-service` |
| Audit trail | Immutable event log with actor, action, timestamp, context | **Delivered** | `/services/audit-service` |
| Case management | Case creation, assignment, status tracking, timeline | **Delivered** | Admin portal with case views |
| Search across systems | Fuzzy cross-system debtor search | **Delivered** | Unified search API endpoint |
| Reporting and MI | Operational, security, and statistics dashboards | **Delivered** | Admin portal dashboard suite |
| Credit checks | Automated credit reference lookup | **Delivered** | `/services/credit-check-service` |
| Notifications | Email/SMS notification with subscription management | **Delivered** | `/services/notification-service` |
| API-first architecture | Versioned REST APIs with OpenAPI documentation | **Delivered** | Express.js services with typed endpoints |
| Cloud deployment | Docker Compose + Terraform IaC | **Delivered** | `docker-compose.yml` + `/terraform` |
| Accessibility | GOV.UK Design System patterns, semantic HTML, ARIA | **Delivered** | Component library with GOV.UK patterns |

---

## Beyond Requirements

IAAS delivers five significant capabilities beyond the original SOW scope:

### Digital Mailroom
An AI-powered document processing pipeline that transforms AiB's current manual triage process:
- **OCR** extracts text from scanned postal correspondence
- **Named Entity Recognition** identifies case references, debtor names, dates, and document types
- **Automated routing** directs documents to the correct case and work queue
- **Confidence scoring** flags low-confidence extractions for human review

This alone could save an estimated 2-3 FTE in document processing effort.

### AI Governance Dashboard
As public sector AI adoption accelerates, governance is non-negotiable. IAAS demonstrates:
- Model performance monitoring with drift detection
- Bias analysis across protected characteristics
- Explainability metrics for every recommendation
- Human-in-the-loop review workflows for high-impact decisions
- Compliance with emerging Scottish Government AI ethics framework

### Policy Simulation Tool
Before deploying rule changes that affect citizen eligibility, policy analysts can:
- Model the impact of threshold changes on application volumes
- Simulate legislative amendments against historical case data
- Compare outcomes across different rule configurations
- Publish approved changes through a controlled deployment pipeline

### Rules Management Console
Business users — not developers — manage the recommendation engine:
- Visual rule editor with plain-English conditions
- Version control with rollback capability
- A/B testing for rule variants
- Audit trail of all rule changes with approver sign-off

### Knowledge Hub / CMS
A structured content management system for:
- Procedural guidance for staff
- Self-help content for citizens
- Template management for correspondence
- Version-controlled policy documentation

---

## Strategic Alignment

### Cloud First
- AWS reference architecture with multi-AZ deployment
- Terraform Infrastructure as Code for repeatable provisioning
- Container-first (Docker) with orchestration readiness (ECS/Kubernetes)
- No vendor lock-in — standard, portable technologies throughout

### User-Centred Design
- GOV.UK Design System components ensuring consistency and familiarity
- Responsive design — mobile, tablet, and desktop
- Progressive disclosure — complex journeys broken into manageable steps
- Plain English throughout — no jargon in citizen-facing content
- Accessibility built in — semantic HTML, ARIA labels, keyboard navigation

### Security by Design
- Defence in depth — multiple security layers from network to application
- Zero trust alignment — every request authenticated and authorised
- Multi-Factor Authentication — TOTP and SMS second factors
- Role-Based Access Control — principle of least privilege with 9 granular roles
- Input validation at every boundary — Zod schemas shared between frontend and backend
- Security headers (Helmet), CORS, CSRF protection, rate limiting
- Immutable audit trail — every action logged, tamper-evident

### Data-Driven Decision Making
- Recommendation engine provides evidence-based product guidance
- Real-time operational dashboards replace manual MI compilation
- AI governance ensures algorithmic decisions are explainable and fair
- Policy simulation enables evidence-based legislative impact assessment
- Analytics on application volumes, conversion, and processing times

### Digital Government Standards
- GDS Service Standard compliance in design patterns and delivery approach
- Scottish Approach to Service Design principles embedded
- Technology Code of Practice alignment
- Open standards for interoperability

### Open Standards
- **OpenID Connect** for identity federation
- **SAML 2.0** for enterprise SSO
- **REST APIs** with JSON payloads
- **OAuth 2.0** for API authorisation
- **Zod schemas** for contract-first validation
- **Docker/OCI** for containerisation
- **Terraform HCL** for infrastructure definition

---

## Differentiators

### 1. Cross-System Identity Matching
Fuzzy search across all six legacy systems resolves the fundamental problem of "which systems does this debtor appear in?" — using approximate matching algorithms that handle name variations, address changes, and data quality issues inherent in legacy records.

### 2. AI-Powered Document Processing Pipeline
The Digital Mailroom is not a future aspiration — it is demonstrated in the POC. OCR, NER, classification, and routing operate as a pipeline that can be trained on AiB's specific document types and progressively reduce manual triage effort.

### 3. Explainable AI with Governance Dashboard
Every recommendation produced by the engine comes with a full explanation: which rules fired, which criteria were met or not met, and what confidence level the system assigns. The governance dashboard provides organisational oversight of AI behaviour across all decisions.

### 4. Policy Simulation Before Deployment
No other solution in the Scottish public sector insolvency domain offers pre-deployment impact modelling. Policy teams can answer "what if?" questions before changes affect citizens.

### 5. Business Self-Service
The Rules Management Console and Knowledge Hub put control in the hands of business users. Policy changes, content updates, and rule modifications do not require developer intervention or release cycles.

### 6. Unified Work Queue Across Six Legacy Systems
Staff see one prioritised list of work regardless of which underlying system owns the case. This eliminates the constant context-switching between BASYS, eDEN, and ASTRA that characterises current operations.

---

## Innovation

| Capability | Technology | Maturity | Value |
|-----------|-----------|----------|-------|
| Recommendation Engine | Rules-based with confidence scoring | Production-ready | Instant guidance for citizens; consistent decisions |
| Digital Mailroom | OCR + NER + Classification | Demonstrated | 2-3 FTE saving in document triage |
| AI Governance | Monitoring + Bias Detection + Explainability | Demonstrated | Regulatory compliance; public trust |
| Policy Simulation | Rule sandbox + Impact modelling | Demonstrated | Evidence-based policy development |
| Fuzzy Search | Approximate string matching across systems | Production-ready | Single debtor view from fragmented data |
| Smart Notifications | Role-based, preference-driven, multi-channel | Production-ready | Reduced missed actions; citizen engagement |

---

## Scalability & Future-Proofing

**Microservices architecture** ensures each capability can scale independently. The recommendation engine, which may see spikes during policy announcements, scales separately from the document service, which has steady-state load.

**Event-driven communication** between services enables:
- Replay of events for new consumers
- Eventual consistency without tight coupling
- Straightforward addition of new services without modifying existing ones

**API-first design** means:
- Mobile applications can consume the same APIs
- Third-party integrations (money advice agencies, solicitors) use published contracts
- Legacy system replacement is isolated to adapter changes

**Infrastructure as Code** provides:
- Repeatable deployments across environments
- Disaster recovery through re-provisioning
- Cost optimisation through right-sizing

**Technology choices** are deliberately mainstream:
- Next.js and React have the largest frontend talent pool
- Express.js and Node.js are widely understood
- TypeScript provides type safety without exotic tooling
- PostgreSQL (production) is the most mature open-source RDBMS

---

## Risk Mitigation

The POC de-risks full implementation in six specific ways:

| Risk | How POC Mitigates |
|------|-------------------|
| Integration complexity with legacy systems | Adapter patterns proven for all 6 systems; API contracts defined |
| User adoption | Journey design validated with GOV.UK patterns; citizen self-service proven feasible |
| Technical architecture viability | Working microservices demonstrating all integration patterns |
| Security model adequacy | RBAC, MFA, audit trail demonstrated end-to-end |
| AI/ML governance concerns | Governance dashboard and explainability proven before production data involved |
| Delivery team capability | POC delivered by proposed team; domain expertise demonstrated in code |

---

## Value for Money

The POC approach delivers exceptional value:

1. **Proves viability before significant investment** — The full platform concept is validated in working code before committing to multi-year programme funding
2. **Reduces implementation risk** — Architecture decisions, integration patterns, and technology choices are validated empirically, not theoretically
3. **Accelerates Alpha delivery** — The POC codebase provides a foundation; Alpha builds on proven patterns rather than starting from scratch
4. **Demonstrates team capability** — The delivery team's ability to execute is proven through delivered software, not CVs and case studies
5. **Informs procurement** — Requirements for production hosting, identity services, and legacy system APIs are concrete, not speculative

---

## Implementation Approach

### Delivery Methodology
Agile delivery following the GDS service phases:

| Phase | Duration | Focus |
|-------|----------|-------|
| **Discovery** | Complete | User needs identified; legacy landscape mapped |
| **POC** | Complete | Technical viability proven; architecture validated |
| **Alpha** | 12 weeks | Real integrations (test); user research; accessibility; security |
| **Beta** | 24 weeks | Private beta with money advice agencies; all integrations live |
| **Live** | Ongoing | Public beta; phased rollout; continuous improvement |

### Delivery Principles
- **Show the thing** — Working software over documentation
- **Iterate based on evidence** — User research and analytics drive decisions
- **Make it accessible** — WCAG 2.2 AA from Alpha onwards
- **Make it secure** — Threat modelling, pen testing, and security review at each phase gate
- **Make it sustainable** — Operational support model designed in, not bolted on

---

## Team & Capability

This POC demonstrates:

- **Deep domain expertise** — 10+ years working with AiB's systems, processes, and stakeholders. Understanding of BASYS data models, eDEN workflows, DAS legislation, bankruptcy sequestration processes, and the operational reality of case management.

- **Technical breadth** — Full-stack delivery from infrastructure (Terraform, Docker) through backend services (Express.js, TypeScript) to frontend applications (Next.js, React, GOV.UK patterns).

- **Public sector delivery experience** — Familiarity with GDS Service Standard, Scottish Government Digital Strategy, procurement frameworks, and governance requirements.

- **Security awareness** — Defence in depth, zero trust principles, RBAC implementation, and audit trail design reflecting Cyber Essentials Plus and NCSC guidance.

- **AI/ML capability** — Recommendation engines, NLP pipelines (OCR/NER), governance frameworks, and explainability — applied pragmatically within public sector constraints.

- **Integration expertise** — Adapter patterns for legacy systems of varying age and technology; experience with the specific challenges of BASYS, eDEN, and ASTRA integration.

The POC is not a theoretical exercise — it is a demonstration of delivery capability. The same team that built this POC is positioned to deliver Alpha, Beta, and Live.

---

## Summary

IAAS is not merely compliant with the Statement of Work — it represents a step-change in ambition for AiB's digital capability. It demonstrates that a unified insolvency platform is technically feasible, architecturally sound, and deliverable by a team with deep domain expertise.

The POC answers the critical question: *Can we build this?*

The answer, demonstrated in working code, is yes.

---

*Document prepared: August 2026*
*Classification: OFFICIAL — COMMERCIAL*
*Owner: AiB Digital Delivery*
