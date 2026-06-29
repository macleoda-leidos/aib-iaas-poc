# Context and Assumptions

## Purpose

This document records the context, assumptions, and constraints that shaped the IAAS POC, to inform the Schedule 19 SOW response and architecture discussion.

## Business Context

- **Customer:** Accountant in Bankruptcy (AiB), part of Scottish Government
- **Problem:** Multiple product-centric applications create a fragmented user experience
- **Solution:** A unified Applications Gateway that guides users to the appropriate product
- **POC Objective:** Demonstrate technical feasibility of the gateway approach within 16-week SOW scope

## Existing System Landscape

| System | Function | Integration Approach |
|--------|----------|---------------------|
| BASYS | Bankruptcy/sequestration case management | API lookup for existing cases |
| eDEN/DASH | DAS electronic system + payment distribution | API lookup for arrangements |
| DAS | Debt payment programme management | API lookup for active programmes |
| CFT | Creditor/trustee/provider reference data | Reference data API |
| Moratorium | Moratorium registration and checks | API check + registration |
| RoI | Public Register of Insolvencies | Search API |

## Key Assumptions

1. **No access to real AiB systems** — All integrations are mocked. The POC demonstrates integration patterns, not actual connectivity.

2. **Synthetic data only** — No real personal, financial, or government data is used anywhere in the POC.

3. **Free deployment priority** — The POC prioritises free or near-free deployment. Local Docker Compose is the primary deployment target.

4. **Scottish context** — Debt solutions are Scotland-specific (sequestration not bankruptcy, trust deeds, MAP, DAS). This differs from England & Wales insolvency products.

5. **PWA over native mobile** — A Progressive Web App approach is used rather than React Native because:
   - Zero cost (no Apple Developer / Google Play accounts)
   - Single codebase
   - Demonstrates mobile-responsive design
   - Can be installed on device home screen
   - Offline capability via service workers
   - No app store review delay

6. **Single-tenant POC** — No multi-tenancy. Production would require proper tenant isolation.

7. **GOV.UK Design Patterns** — We follow GOV.UK/Scottish Government design patterns for familiarity and accessibility, without using the official GDS frontend toolkit (which would require npm registry access and design review).

8. **AI recommendation is rules-based** — The "AI" element is a rules engine with pre-written explanations. True AI/LLM integration would require:
   - Policy review and approval
   - Bias assessment
   - Human oversight mechanisms
   - Appropriate disclaimers
   - Data protection impact assessment

## Constraints

- **Budget:** £0 for POC hosting (local deployment + free tiers only)
- **Timeline:** POC built as demonstration artefact for SOW response
- **Security:** No real credentials, no real data, no real payments
- **Compliance:** POC is not assessed against production security/compliance standards
- **Accessibility:** Best-effort WCAG 2.1 compliance using semantic HTML and ARIA

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| AiB system APIs don't exist | High | Mock integration contracts define expected interface; real integration is a delivery activity |
| Data model doesn't match AiB reality | Medium | Schema is based on public information about Scottish insolvency products; validated during discovery |
| Technology stack not approved by AiB IT | Medium | Stack choices are pragmatic and common in government; alternatives documented |
| Payment integration complexity underestimated | Low | Sandbox flows demonstrate journey; real PSP integration is standard work |
| Accessibility gaps | Medium | Foundation is accessible (semantic HTML, ARIA, keyboard nav); full audit needed pre-production |

## SOW Alignment

This POC maps to a 16-week SOW as follows:

| Week | Activity | Demonstrated By |
|------|----------|----------------|
| 1-2 | Discovery & architecture | docs/architecture.md, this document |
| 3-4 | Integration design & contracts | services/mock-integrations, docs/integration-design.md |
| 5-8 | Core service development | services/*, packages/* |
| 9-12 | Frontend development & UX | apps/web, apps/admin |
| 13-14 | Testing & integration | tests, CI pipeline |
| 15-16 | Deployment & handover | infra/terraform, infra/docker, docs/ |
