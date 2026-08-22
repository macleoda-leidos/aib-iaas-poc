# Business Requirements Document: Initial Application Advice Service (IAAS)

**Programme:** AiB Digital Transformation  
**Document Owner:** Accountant in Bankruptcy, Scottish Government  
**Version:** 1.0  
**Classification:** OFFICIAL  
**Date:** August 2026  

---

## 1. Business Goals

The Accountant in Bankruptcy (AiB) seeks to deliver a unified digital gateway for insolvency applications in Scotland. IAAS will replace fragmented, paper-based processes with a single citizen-facing platform that guides applicants to the most appropriate debt solution, streamlines internal case handling, and provides end-to-end visibility across all statutory products.

The strategic objectives are:

1. **Digital-first applications** — Provide a 24/7 online channel for citizens and money advisers to submit insolvency applications, eliminating the current reliance on paper forms and in-person submissions.
2. **Unified case view** — Consolidate debtor information currently spread across BASYS, ASTRA, eDEN, DAS Register, CFT, and RoI into a single operational interface for AiB staff.
3. **Operational efficiency** — Reduce manual triage, duplicate data entry, and paper document handling through automation, rules-based routing, and digital mailroom capabilities.
4. **Citizen self-service** — Enable debtors to check eligibility, receive product recommendations, track application progress, and communicate with AiB without telephone or postal contact.
5. **Data-driven decisions** — Deliver real-time analytics, cross-system reporting, and management information to support policy development, resource planning, and accountability.

---

## 2. Current State Analysis

### 2.1 Citizens (Debtors)

| Pain Point | Impact |
|-----------|--------|
| No online application channel | Citizens must attend appointments or post paper forms |
| Confusing product landscape | Six debt solutions with complex eligibility criteria; citizens cannot self-assess |
| Long processing times | Manual triage adds 5-10 working days before an application is reviewed |
| No progress visibility | Applicants call AiB repeatedly for status updates |
| Paper-based correspondence | Letters take 3-5 days and are easily lost |
| Accessibility barriers | Travel to offices is difficult for rural or vulnerable citizens |

### 2.2 Money Advisers

| Pain Point | Impact |
|-----------|--------|
| Multiple system logins | Advisers navigate BASYS, eDEN, DAS Register separately per client |
| Duplicate data entry | Same debtor details keyed into 2-3 systems for different products |
| No cross-system visibility | Cannot see if a client has existing cases in other AiB systems |
| Manual document preparation | Advisers compile paper packs for each submission |
| Limited feedback on outcomes | No automated notifications when cases progress or stall |

### 2.3 AiB Staff (Case Officers, Team Leaders)

| Pain Point | Impact |
|-----------|--------|
| Manual triage and allocation | Incoming post sorted by hand; no rules-based routing |
| No single debtor view | Officers must check multiple systems to build a complete picture |
| Paper document handling | Physical files stored, photocopied, and manually indexed |
| Siloed systems with separate data models | BASYS and eDEN do not share debtor records |
| Limited management information | Team leaders lack real-time workload and SLA dashboards |
| Inconsistent decision-making | No automated eligibility checks; reliance on officer experience |

### 2.4 Executives and Policy Managers

| Pain Point | Impact |
|-----------|--------|
| No real-time analytics | Monthly reporting cycles delay intervention on performance issues |
| No cross-system reporting | Cannot produce a single view of all active insolvency cases in Scotland |
| Limited policy impact assessment | Cannot model the effect of rule changes without manual data extraction |
| Poor digital performance data | No insight into citizen demand, drop-off rates, or channel usage |

---

## 3. Future State Vision

### Citizens
Applicants visit a single GOV.UK-styled portal, answer guided questions about their financial situation, and receive a recommendation for the most appropriate debt solution. They submit applications online, upload documents digitally, and track progress through a personal dashboard. Notifications arrive by email or SMS. The entire journey is completable in a single sitting without professional support, though adviser assistance remains available.

### Money Advisers
Advisers log in once to a professional portal that surfaces all their clients' cases across every AiB product. They submit applications on behalf of clients, attach evidence digitally, and receive automated status updates. Bulk submission and pre-population from previous applications eliminate duplicate data entry.

### AiB Staff
Case officers receive pre-triaged, digitally complete applications in a unified workqueue. Eligibility checks and credit searches are automated. A single debtor record aggregates information from all legacy systems. Workload dashboards show SLA compliance in real time, and team leaders allocate cases by drag-and-drop or automatic rules.

### Executives
A management information dashboard provides real-time volumes, processing times, recommendation accuracy, and channel uptake. Policy managers can adjust rules in the recommendation engine without developer intervention and model the impact before deployment.

---

## 4. Business Capabilities Required

| # | Capability | Description | Priority |
|---|-----------|-------------|----------|
| 1 | Online Application Submission | Citizens and advisers can submit applications 24/7 via self-service portal | HIGH |
| 2 | Recommendation Engine | Automated product matching based on financial circumstances and eligibility rules | HIGH |
| 3 | Unified Staff Portal | Single login for AiB officers to manage all product types | HIGH |
| 4 | Cross-System Debtor Search | Find and aggregate debtor records across BASYS, eDEN, ASTRA, RoI | HIGH |
| 5 | Automated Eligibility Checking | Rules-based validation against statutory criteria per product | HIGH |
| 6 | Digital Document Upload | Secure upload and indexing of supporting evidence | HIGH |
| 7 | Application Status Tracking | Real-time progress visibility for applicants and advisers | HIGH |
| 8 | Automated Case Triage | Rules-based routing of applications to appropriate teams | HIGH |
| 9 | Workload Management Dashboard | SLA monitoring, allocation, and capacity planning for team leaders | HIGH |
| 10 | Notification Service | Email, SMS, and in-platform alerts for status changes | HIGH |
| 11 | Credit Check Integration | Automated credit bureau lookups during application assessment | HIGH |
| 12 | Digital Mailroom | Automated scanning, OCR, classification, and indexing of inbound paper | MEDIUM |
| 13 | Management Information & Analytics | Real-time dashboards for volumes, SLAs, outcomes, and trends | MEDIUM |
| 14 | Adviser Bulk Submission | Multiple applications submitted in a single session | MEDIUM |
| 15 | Pre-population and Data Reuse | Auto-fill from previous applications or existing debtor records | MEDIUM |
| 16 | Role-Based Access Control | Granular permissions per role (citizen, adviser, officer, admin, exec) | HIGH |
| 17 | Audit Trail | Immutable event log for every action taken on a case | HIGH |
| 18 | Payment Processing | Online fee collection for sequestration and DAS applications | MEDIUM |
| 19 | Policy Rules Configuration | Non-developer interface for policy managers to update eligibility rules | MEDIUM |
| 20 | Moratorium Self-Service | Citizens can apply for a 6-week breathing space without adviser involvement | MEDIUM |
| 21 | Secure Messaging | In-platform communication between applicants, advisers, and AiB | LOW |
| 22 | Organisation and Trustee Portal | Creditors and trustees can view and respond to cases | LOW |
| 23 | API Integration Layer | Standardised APIs to connect with DWP, HMRC, Companies House, credit bureaus | MEDIUM |
| 24 | Reporting and Data Export | Scheduled and ad-hoc reporting for statutory returns and FOI | MEDIUM |
| 25 | Accessibility Compliance | WCAG 2.2 AA across all public-facing interfaces | HIGH |

---

## 5. Value Proposition

AiB's existing systems were built independently over two decades. BASYS handles bankruptcy, eDEN manages DAS, and each has its own data model, user interface, and maintenance burden. Enhancing each system individually would:

- Perpetuate data silos and prevent a single debtor view
- Require citizens to identify the correct product before they can apply
- Multiply development and support costs across six codebases
- Fail to address the fundamental absence of an online application channel

IAAS provides a **single front door** that abstracts complexity away from citizens, routes applications intelligently, and presents a unified operational view to staff. It wraps legacy systems rather than replacing them immediately, enabling incremental migration while delivering citizen value from day one.

---

## 6. Expected Benefits

| Benefit | Baseline (Current) | Target (IAAS) | Improvement |
|---------|-------------------|---------------|-------------|
| Online application availability | 0% (no digital channel) | 100% (24/7 self-service) | +100% |
| Average application processing time | 12 working days | 5 working days | -60% |
| Manual document triage effort | ~2,400 hrs/year | ~480 hrs/year | -80% |
| Duplicate data entry (adviser) | 3 systems per client | 1 submission | -67% |
| Application completion rate | N/A (paper) | >75% | Measurable |
| Citizen contact calls for status updates | ~8,000/year | ~2,000/year | -75% |
| Time to first case officer review | 8 working days | 2 working days | -75% |
| Staff training time for new officers | 12 weeks (multiple systems) | 6 weeks (one platform) | -50% |
| Cross-system debtor search time | 15 minutes (manual) | <10 seconds (automated) | -99% |
| Paper storage and postage costs | £120,000/year | £30,000/year | -75% |

---

## 7. Success Measures and KPIs

| KPI | Target | Measurement Method | Review Frequency |
|-----|--------|-------------------|-----------------|
| Application completion rate | >75% | Portal analytics (started vs submitted) | Weekly |
| Average end-to-end processing time | <5 working days | Case management timestamps | Weekly |
| Automated triage accuracy | >89% | Correct routing vs manual override rate | Monthly |
| Recommendation acceptance rate | >85% | Citizens proceeding with suggested product | Monthly |
| System availability | >99.5% | Uptime monitoring | Daily |
| Citizen satisfaction (CSAT) | >4.0/5.0 | Post-application survey | Monthly |
| Adviser satisfaction | >4.2/5.0 | Quarterly survey | Quarterly |
| Digital channel uptake | >60% of all applications within 12 months | Channel analytics | Monthly |
| First-contact resolution rate | >70% | Support ticket analysis | Monthly |
| Accessibility compliance | WCAG 2.2 AA | Automated and manual audit | Quarterly |
| Staff productivity (cases per officer per day) | +30% improvement | Workload dashboard | Monthly |
| Data quality (complete applications at submission) | >90% | Validation pass rate | Weekly |

---

## 8. Operational Improvements

**For Case Officers:**
- Applications arrive pre-validated with all mandatory fields complete and documents attached
- Automated credit checks and eligibility assessments are presented alongside the application
- A single screen shows the full debtor history across all AiB products
- Cases are auto-allocated based on product type, complexity, and officer capacity
- Standard correspondence is generated automatically; officers review and send

**For Team Leaders:**
- Real-time workload dashboards replace manual tracking spreadsheets
- SLA breach alerts trigger before deadlines, not after
- Case reallocation is drag-and-drop when officers are absent
- Performance reporting is automated and available on demand

**For Policy Managers:**
- Eligibility rules are configured through a business-friendly interface
- Rule changes can be tested against historical data before deployment
- Impact of policy changes is visible through before/after analytics

---

## 9. Citizen Benefits

- **24/7 access:** Apply at any time without appointments or travel
- **Clear guidance:** The recommendation engine explains which debt solution fits their circumstances and why
- **Faster outcomes:** Processing times reduced from weeks to days
- **Transparency:** Real-time tracking of application status
- **Reduced anxiety:** No need to call AiB repeatedly for updates
- **Dignity:** Self-service removes the need to repeatedly explain difficult financial circumstances
- **Accessibility:** Multi-channel access (desktop, mobile, assisted digital) with full WCAG 2.2 AA compliance
- **Confidence:** Citizens understand their options before committing

---

## 10. Adviser Benefits

- **Single login:** One portal for all AiB products replaces 3+ system credentials
- **Client visibility:** Full cross-system view of every client's AiB interactions
- **Reduced admin:** Pre-population and digital submission eliminate paper packs
- **Faster turnaround:** Clients receive outcomes sooner, freeing adviser capacity
- **Proactive notifications:** Automated alerts when cases need attention
- **Audit trail:** Complete record of every action taken on behalf of a client
- **Bulk operations:** Submit and manage multiple applications efficiently

---

## 11. AiB Organisational Benefits

- **Reduced operational cost:** Automation displaces manual handling effort
- **Improved data quality:** Validated digital submissions replace illegible paper forms
- **Single debtor view:** Risk assessment and decision-making based on complete information
- **Statutory compliance:** Automated enforcement of legislative timescales
- **Scalability:** Platform handles volume increases without proportional staff growth
- **Policy agility:** Rule changes deployed in days rather than months of system development
- **Evidence-based strategy:** Real-time data supports business cases, ministerial briefings, and parliamentary questions
- **Staff satisfaction:** Officers focus on complex decisions rather than data entry and document handling
- **Resilience:** Cloud-hosted, multi-availability-zone platform reduces single points of failure

---

## 12. Dependencies and Constraints

| Dependency | Owner | Risk if Unresolved |
|-----------|-------|-------------------|
| Integration access to BASYS and eDEN APIs | AiB IT / Sopra Steria | Cannot deliver single debtor view |
| Credit bureau data sharing agreement | Experian / Equifax | Manual credit checks remain |
| GOV.UK Notify integration for emails/SMS | Scottish Government Digital | Notifications limited to in-platform |
| mygovscot / myaccount identity assurance | Scottish Government | Separate identity verification required |
| Network connectivity from AiB offices to cloud platform | AiB IT / Scottish Government IT | Staff cannot access the new portal |
| DWP / HMRC data sharing for income verification | UK Government departments | Manual income evidence required |
| Organisational change management | AiB HR / Change Team | Staff resistance reduces adoption |
| Decommissioning timeline for legacy systems | AiB Programme Board | Dual-running costs persist |

**Constraints:**
- Must comply with Scottish Government Technology Assurance Framework
- Must meet Cyber Essentials Plus certification before go-live
- Must not disrupt existing statutory deadlines during transition
- Budget allocated for POC and Alpha phases; Beta funding subject to spending review
- All citizen-facing services must meet Scottish Government accessibility standards

---

## 13. Assumptions

1. Citizens with insolvency-level debt have access to the internet (directly or via assisted digital services at libraries, Citizens Advice, etc.)
2. Money advisers will adopt the digital channel if it demonstrably reduces their administrative burden
3. Legacy systems (BASYS, eDEN) will remain operational during transition and expose APIs for integration
4. Scottish Government will approve the use of cloud-hosted infrastructure for OFFICIAL-classified data
5. Staff can be redeployed from manual processing to higher-value decision-making and complex case work
6. Existing data protection impact assessments can be extended to cover the new platform
7. The recommendation engine's rule set can be derived from existing published guidance and case officer expertise
8. Applicant volumes will not exceed 50,000 applications per year in the first three years of operation
9. AiB retains the legislative mandate to administer all current insolvency products throughout the programme
10. Third-party integrations (credit bureaus, DWP) will be available within acceptable latency tolerances for real-time citizen journeys

---

*Document ends.*
