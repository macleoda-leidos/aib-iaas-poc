# AiB IAAS — Feature Catalogue

**Version:** 1.0  
**Date:** August 2026  
**Classification:** Internal — POC Documentation  
**Owner:** AiB Digital Transformation Programme

---

## Document Purpose

This catalogue provides a comprehensive inventory of all features implemented within the Initial Application Advice Service (IAAS) Proof of Concept. Each feature is documented with its business rationale, technical implementation, user experience, dependencies, and forward trajectory. The catalogue serves as both a stakeholder reference and a baseline for production planning.

---

## F-01: Citizen Application Journey

| Attribute | Detail |
|-----------|--------|
| Purpose | Enable citizens to self-serve a complete debt solution application online |
| Business Value | Reduces processing time from weeks (paper) to minutes; eliminates double-keying; improves data accuracy |
| Users | Debtors, Money Advisers (on behalf of clients) |
| Status | Implemented |
| Pages | `/apply` |

### Description

The application journey is a 9-step progressive wizard that guides applicants through collecting all information required for a debt solution recommendation. Steps include: Personal Details & Aliases, Address History (5-year), Debts, Income & Expenditure, Assets, Documents, System Checks, Recommendation, and Payment & Submit.

Each section has independent validation and visual status indicators (not started, in progress, has errors, complete). The form supports auto-save to the backend with debounced persistence, and gracefully degrades to offline mode when the API is unavailable.

### Technical Overview

Built as a single-page React component with client-side state management via `useState` and `useRef`. On first user interaction, a draft application is created via `POST /api/applications`. Subsequent changes are debounced (2-second delay) and sent via `PATCH /api/applications/:id`. The API Gateway stores data in SQLite. System checks and credit checks are triggered at step 7 via the Integration Orchestrator and Credit Check Service respectively. The recommendation engine is invoked at step 8.

### User Experience

Users see a horizontal progress bar with numbered steps. They can navigate freely between completed sections. Each section shows a coloured status dot. Invalid sections prevent submission. The payment step offers Apple Pay, Google Pay, and card payment simulation.

### Dependencies

- API Gateway (port 3001) for persistence
- Integration Orchestrator (port 3004) for system checks
- Credit Check Service for credit scoring
- Recommendation Service (port 3002) for product recommendation
- Payment Service (port 3006) for fee processing
- Document Service (port 3003) for file uploads

### Future Enhancements

- Save and resume across sessions with magic-link email
- Pre-population from ScotAccount identity attributes
- Progressive disclosure based on debt level (simplified path for low debt)
- Welsh language support

### Known Limitations (POC)

- No server-side session persistence across browser refreshes in offline mode
- Validation is client-side only; backend validation exists but is simplified
- Payment amounts are synthetic (no real fee calculation)

---

## F-02: Identity Verification & SSO

| Attribute | Detail |
|-----------|--------|
| Purpose | Provide single sign-on across all AiB systems via federated identity |
| Business Value | One login grants access to BASYS, eDEN, DAS, CFT, RoI, and IAAS; reduces credential fatigue |
| Users | All user types (9 roles across 4 identity realms) |
| Status | Design (UI simulated) |
| Pages | `/login` |

### Description

The identity system simulates Keycloak 24.x with four realms: `aib-internal` (staff), `external-advisers` (money advisers, trustees), `creditors`, and `public-debtors`. Federation is designed for ScotAccount (SAML 2.0) and GOV.UK One Login (OIDC). The login page renders a realistic Keycloak-style interface with realm selection, credential entry, and session establishment.

### Technical Overview

The login page stores user context in `sessionStorage` after simulated authentication. The user object (id, name, role, email) is consumed by `UserNavItem` in the global header and by role-based dashboards. In production, Keycloak would issue JWTs validated by the API Gateway's auth middleware.

### User Experience

Users select a demo account (9 available), see the appropriate realm indicator, enter credentials (pre-filled), and proceed through MFA before being redirected to their role-appropriate landing page.

### Dependencies

- ScotAccount (external, SAML 2.0)
- GOV.UK One Login (external, OIDC)
- Active Directory (LDAP sync for AiB staff)
- Keycloak database (PostgreSQL in production)

### Future Enhancements

- Real ScotAccount federation
- Passwordless authentication (WebAuthn/FIDO2)
- Step-up authentication for sensitive operations
- Session federation across web and admin portals

### Known Limitations (POC)

- No real authentication — all accounts are pre-seeded
- JWT tokens are not issued or validated
- Session does not persist across page refreshes in some scenarios

---

## F-03: Multi-Factor Authentication

| Attribute | Detail |
|-----------|--------|
| Purpose | Enforce second-factor verification for all user accounts |
| Business Value | Meets NCSC Cyber Essentials Plus requirements; protects citizen data |
| Users | All authenticated users |
| Status | Implemented (simulated) |
| Pages | `/login` (MFA step) |

### Description

After primary credential verification, users must complete a second factor. Three methods are supported: TOTP (authenticator app), WebAuthn (hardware key/biometric), and email OTP. The MFA step displays method selection, a 6-digit code entry, and verification feedback with animated success states.

### Technical Overview

MFA is rendered as a conditional UI step within the login page component. The verification is simulated with a 1.2-second delay for credential check and a pre-filled code for demonstration. In production, Keycloak's MFA policies would enforce TOTP or WebAuthn per realm policy.

### User Experience

Users see a clear MFA challenge with method icons, a code input (pre-populated with `123456` for demo), and a verification button. Success shows a green animated checkmark before redirect.

### Dependencies

- Keycloak MFA policy engine (production)
- Authenticator app ecosystem (Google/Microsoft Authenticator)
- WebAuthn-capable hardware (YubiKey, device biometrics)

### Future Enhancements

- Adaptive MFA (risk-based — skip for trusted devices)
- SMS OTP as fallback
- Recovery codes for lost devices
- Device registration management

### Known Limitations (POC)

- Code is always `123456` — no real verification
- No device trust or risk scoring

---

## F-04: Role-Based Access Control (9 Roles)

| Attribute | Detail |
|-----------|--------|
| Purpose | Enforce principle of least privilege across all portal functions |
| Business Value | Meets Scottish Government information security standards; enables multi-tenancy |
| Users | System administrators, all role holders |
| Status | Implemented |
| Pages | `/dashboard`, `/portal`, `/manage-users`, Admin `/users` |

### Description

RBAC implements 9 hierarchical roles (L10 Debtor through L100 System Admin) with 23 granular permissions. Each role sees only data and functions appropriate to their responsibility. The system supports per-organisation scoping (e.g., a money adviser sees only their bureau's clients).

Roles: System Admin, AiB Senior Officer, AiB Case Officer, AiB Statistician, CyberOps Analyst, Money Adviser, Creditor, Supplier/Trustee, Debtor.

### Technical Overview

The User Service manages 500 synthetic users with role assignments. The API Gateway's RBAC middleware checks permissions on every request. The frontend renders role-appropriate dashboards and navigation. The portal page filters work queue items by role, and the dashboard page renders entirely different components per role.

### User Experience

Users are presented with their role-specific view immediately after login. A POC role-switcher allows demonstration of all 9 perspectives without re-authentication.

### Dependencies

- User Service (port 3008)
- API Gateway RBAC middleware
- Organisation Service (role-scoping by org)
- Keycloak (production role mapping)

### Future Enhancements

- Delegated administration (org admins manage their own users)
- Temporary role elevation with approval workflow
- Role analytics (usage patterns per permission)

### Known Limitations (POC)

- Permissions are checked client-side for UI rendering; server enforcement is present but simplified
- No real JWT claim validation

---

## F-05: Recommendation Engine

| Attribute | Detail |
|-----------|--------|
| Purpose | Automatically determine the most suitable Scottish debt solution for an applicant |
| Business Value | Consistent, auditable decisions; reduces officer workload; eliminates postcode lottery |
| Users | System (automated), Case Officers (review), Debtors (receive) |
| Status | Implemented |
| Pages | `/apply` (step 8), `/case/[ref]/recommendation` |

### Description

The rules-based recommendation engine evaluates financial circumstances against eligibility criteria for 7 Scottish debt solutions: DAS, MAP, PTD, Sequestration, DPP, Moratorium, and Signposting. It produces a primary recommendation with confidence score, alternative options, and natural-language reasoning explaining the decision.

### Technical Overview

The Recommendation Service (port 3002) accepts POST requests with debtor financials (total debt, disposable income, assets, employment status, existing cases). Decision logic applies priority-ordered rules. Output includes recommended product, confidence percentage, contributing factors, and alternatives. An explanation layer generates human-readable reasoning.

### User Experience

Applicants see their recommendation as a prominent card with confidence gauge, contributing factors list, alternative options comparison, and a detailed explanation. Case officers can override with documented reasons.

### Dependencies

- Application data (debts, income, assets)
- Integration Orchestrator results (existing cases)
- Credit Check results
- Rules data (configurable thresholds)

### Future Enhancements

- ML model trained on historical outcomes (A/B tested against rules)
- Outcome tracking to measure recommendation accuracy
- Explainable AI (SHAP values)

### Known Limitations (POC)

- Rules are deterministic, not probabilistic
- No historical outcome data for model training
- Explanation text is template-based

---

## F-06: Credit Check Integration

| Attribute | Detail |
|-----------|--------|
| Purpose | Assess applicant creditworthiness via credit reference agencies |
| Business Value | Informs recommendation accuracy; identifies undisclosed debts; flags bankruptcy history |
| Users | System (automated), Case Officers (review) |
| Status | Implemented (sandbox) |
| Pages | `/apply` (step 7) |

### Description

The credit check integrates with simulated Equifax, Experian, and TransUnion APIs. Consent is recorded before any check. Results include a credit score, active accounts, risk indicators, and a pass/fail determination. The system uses deterministic scoring based on name hash for consistent demo behaviour.

### Technical Overview

The Credit Check Service accepts requests with debtor consent confirmation. A synthetic provider generates scores deterministically from the applicant name. NI numbers ending in "B" trigger a bankruptcy flag. Results are cached for 24 hours per application. The service reports provider, score, and individual risk factors.

### User Experience

Within the application wizard, applicants see a consent declaration, then a real-time progress indicator as the check runs. Results display as a summary card showing score, provider, and any flags.

### Dependencies

- Consent management
- API Gateway routing
- Audit Service (consent recording)
- Recommendation Engine (consumes results)

### Future Enhancements

- Real CRA API integration (Equifax ConsumerView, Experian Connect)
- Multi-provider comparison
- Soft search vs hard search options
- ICO data sharing registration

### Known Limitations (POC)

- Scores are synthetic and deterministic
- No real CRA connectivity
- Limited risk indicator variety

---

## F-07: Cross-System Checks (6 Systems)

| Attribute | Detail |
|-----------|--------|
| Purpose | Detect existing cases across all AiB systems before new application proceeds |
| Business Value | Prevents duplicate applications; identifies active arrangements; ensures legal compliance |
| Users | System (automated), Case Officers (review) |
| Status | Implemented |
| Pages | `/apply` (step 7) |

### Description

The Integration Orchestrator queries 6 AiB systems in parallel: BASYS (bankruptcy), eDEN/DASH (DAS), DAS (debt payment programmes), CFT (creditor/trustee), Moratorium register, and RoI (Register of Insolvencies). Results are aggregated with match indicators. A positive match changes the recommendation (e.g., existing moratorium → signposting).

### Technical Overview

The Integration Orchestrator (port 3004) sends parallel requests to Mock Integrations (port 3005). Each system endpoint has deterministic trigger conditions (e.g., NI ending "A" triggers BASYS match; postcode "EH*" triggers Moratorium match). Results include system name, match status, reference number, and summary.

### User Experience

Applicants see a checklist of systems being queried with real-time status indicators (checking, clear, match found). Any matches are highlighted with reference details and impact explanation.

### Dependencies

- Mock Integrations service (port 3005)
- Integration Orchestrator (port 3004)
- Network connectivity to all systems

### Future Enhancements

- Real API connections with mTLS
- Circuit breaker pattern per system
- Configurable timeout (currently 15s aggregate)
- Results caching per application

### Known Limitations (POC)

- All systems are mocked with deterministic responses
- No real data — triggers based on input patterns
- No error recovery or partial failure handling

---

## F-08: Document Upload & Virus Scanning

| Attribute | Detail |
|-----------|--------|
| Purpose | Accept supporting documents with malware protection |
| Business Value | Digital evidence reduces paper handling; virus scanning protects infrastructure |
| Users | Debtors, Money Advisers |
| Status | Implemented |
| Pages | `/apply` (step 6) |

### Description

The Document Service handles file uploads with automatic virus scanning via ClamAV. Files are categorised (ID, income evidence, debt statements, address proof) and stored with metadata. A 2-second scan simulation determines pass/quarantine status. Files named "virus" or "eicar" trigger quarantine for demonstration.

### Technical Overview

The Document Service (port 3003) accepts multipart file uploads via Multer. Files are written to local filesystem (POC) with metadata stored in-memory. ClamAV integration is simulated with pattern matching on filenames. Clean files are marked available; infected files are quarantined.

### User Experience

Users see a drag-and-drop upload area with category selection. Upload progress is shown in real-time. Scan results appear as pass/fail badges. Quarantined files show a warning with explanation.

### Dependencies

- ClamAV (TCP port 3310 in production)
- Local filesystem (POC) / S3 (production)
- API Gateway authentication

### Future Enhancements

- Real ClamAV sidecar container
- S3 with server-side encryption
- OCR metadata extraction from uploaded documents
- File type validation and size limits
- Thumbnail generation for previews

### Known Limitations (POC)

- Virus scanning is simulated (filename-based)
- Files stored on local filesystem
- No size limits enforced
- No file type restrictions

---

## F-09: Payment Processing

| Attribute | Detail |
|-----------|--------|
| Purpose | Collect application fees via multiple payment methods |
| Business Value | Enables instant digital fee collection; reduces manual reconciliation |
| Users | Debtors |
| Status | Implemented (sandbox) |
| Pages | `/apply` (step 9) |

### Description

Payment processing supports Apple Pay (via Payment Request API), Google Pay (via Google Pay API), and traditional card payments (via WorldPay/PayGate simulation). The sandbox mode produces realistic transaction references and confirmation screens without processing real payments. A 90% success rate simulation demonstrates error handling.

### Technical Overview

The Payment Service (port 3006) creates payment sessions, processes provider-specific flows, and returns confirmation with transaction references. All payments are sandbox — clearly indicated in responses. The service generates synthetic transaction IDs and simulates processing delays.

### User Experience

Applicants select from available payment methods (card, Apple Pay, Google Pay). A processing animation runs during the simulated transaction. Success shows a confirmation with reference number; failure shows retry options with alternative methods.

### Dependencies

- Payment Service (port 3006)
- API Gateway routing
- Audit Service (transaction recording)
- Application status update on success

### Future Enhancements

- GOV.UK Pay integration (preferred government payment provider)
- PCI DSS compliance framework
- Apple/Google Pay merchant registration
- Refund processing workflow
- Payment reconciliation reporting

### Known Limitations (POC)

- No real transactions — all sandbox
- No PCI compliance
- Fee amounts are hardcoded
- No receipt generation

---

## F-10: Fuzzy Cross-System Search

| Attribute | Detail |
|-----------|--------|
| Purpose | Find debtors across all AiB systems even with spelling variations or deliberate evasion |
| Business Value | Detects fraud attempts; identifies duplicate persons across systems; supports investigations |
| Users | AiB Case Officers, Senior Officers, System Admins |
| Status | Implemented |
| Pages | `/search` |

### Description

The search page implements fuzzy matching using Fuse.js to find debtors across all AiB systems. It demonstrates how the same person may appear differently across BASYS, eDEN, and DAS due to typos, name variations, or deliberate evasion (e.g., "John Smith" / "Jhon Smith" / "Jon Smith"). Results show confidence scores, source system badges, and highlighted match segments.

### Technical Overview

Fuse.js is configured with weighted fields (name: 2.0, reference: 1.5, NI: 1.5, product: 0.5), threshold 0.4, and distance 100. Seed data includes deliberate cross-system variants with matching NI numbers but different spellings. Live API results are merged with seed data. Confidence badges show percentage match quality.

### User Experience

Users type into a search box and see real-time fuzzy results. Each result shows source system badge, confidence score, reference number, and debt amount. Match highlights indicate which characters matched. Filter options allow narrowing by system or status.

### Dependencies

- Fuse.js library (client-side)
- API Gateway (for live application data)
- Seed data (cross-system variants)

### Future Enhancements

- Server-side Elasticsearch with phonetic analysis
- Soundex/Metaphone matching
- NI number cross-reference verification
- Fraud scoring based on match patterns
- Batch duplicate detection

### Known Limitations (POC)

- Search is client-side against static seed data plus live API
- No server-side indexing
- Limited to ~15 seed records plus live applications

---

## F-11: Unified Portal / Work Queue

| Attribute | Detail |
|-----------|--------|
| Purpose | Provide a single work queue across all AiB systems tailored to each role |
| Business Value | Eliminates system-hopping; surfaces priority work; reduces missed items |
| Users | All staff roles, Money Advisers, Debtors (own case updates) |
| Status | Implemented |
| Pages | `/portal` |

### Description

The portal aggregates work items from 6 AiB systems (BASYS, ASTRA, eDEN, CFT, RoI, IAAS) into a unified queue. Each role sees a filtered view: Case Officers see assigned and unassigned items; Money Advisers see only their client cases in IAAS and eDEN; Debtors see only their own application updates. System tiles show task counts per system.

### Technical Overview

Role configuration objects define visible systems, queue title, and filter functions per role. Work queue items have system source, priority, assignee, due date, and status. The portal reads the current user from query parameters or session storage. Filtering is applied client-side.

### User Experience

Staff see system tiles showing task counts, followed by a sortable/filterable work queue table. Items are colour-coded by priority (red/amber/green) and status. Debtors see a simplified timeline of their own case updates without system tiles.

### Dependencies

- User context (role, identity)
- Work queue data (aggregated from all systems)
- System health status

### Future Enhancements

- Real-time WebSocket updates
- Push notifications for new high-priority items
- Bulk actions (assign, escalate)
- SLA countdown timers

### Known Limitations (POC)

- Static seed data — no real system integration
- No WebSocket/polling for live updates
- Queue items are not actionable (no drill-through to external systems)

---

## F-12: Operational Dashboard

| Attribute | Detail |
|-----------|--------|
| Purpose | Provide real-time operational overview for AiB management |
| Business Value | Enables data-driven resource allocation; highlights bottlenecks; supports KPI tracking |
| Users | AiB Senior Officers, System Admins, Case Officers |
| Status | Implemented |
| Pages | `/dashboard` |

### Description

The operational dashboard renders role-specific views. AiB staff see application queues with status badges, quick actions, and system health indicators. The dashboard auto-refreshes every 10 seconds, showing both live API data and seed applications. Admin panels expose report generation, user management, audit logs, and system health.

### Technical Overview

The dashboard fetches live applications via `GET /api/applications` with 10-second polling. Seed data provides a consistent baseline. Applications are displayed in a sortable table with status, date, debt amount, and credit score. Admin-specific panels are conditionally rendered based on role checks.

### User Experience

Officers see their case queue with clickable rows that expand to show detail panels. Status badges use gov.uk colour conventions. A yellow banner shows the POC role-switcher for demonstration. Real-time connection status indicates API availability.

### Dependencies

- API Gateway (applications list endpoint)
- User context (role determination)
- Navigation system (case drill-through)

### Future Enhancements

- Customisable dashboard widgets
- Drag-and-drop layout
- Export to PDF/CSV
- Historical trend comparison

### Known Limitations (POC)

- Limited to 20 most recent applications
- No widget customisation
- Seed data is always present alongside live data

---

## F-13: Security Operations Dashboard

| Attribute | Detail |
|-----------|--------|
| Purpose | Real-time security event monitoring and threat visualisation |
| Business Value | Enables proactive threat detection; supports incident response; demonstrates SOC capability |
| Users | CyberOps Analysts |
| Status | Implemented |
| Pages | `/security` |

### Description

A comprehensive security operations centre (SOC) dashboard displaying live-updating security events from CloudWatch, Sophos, Sysmon, WAF, Tenable, and Keycloak. Features include attack timeline charts, threat type breakdown, vulnerability data, real-time event feed with severity colour coding, and SIEM-style filtering.

### Technical Overview

Security events are generated from 20 realistic templates covering SQL injection, XSS, brute force, credential stuffing, malware, and vulnerability discoveries. Events include timestamps, source IPs (known Tor exit nodes), severity levels, and MITRE ATT&CK-style categorisation. Charts use Recharts (AreaChart, BarChart, PieChart).

### User Experience

CyberOps analysts see KPI cards (events today, critical alerts, blocked attacks), an hourly attack timeline area chart, vulnerability severity breakdown, and a scrolling event feed. Events are filterable by source and severity. Critical events are highlighted in red.

### Dependencies

- Recharts charting library
- Event template system
- Time-based event generation

### Future Enhancements

- Real CloudWatch/GuardDuty integration
- SOAR (Security Orchestration, Automation and Response)
- Automated playbook execution
- Integration with Sophos Central API
- Tenable.io vulnerability sync

### Known Limitations (POC)

- Events are synthetic (generated from templates)
- No real SIEM integration
- No alerting or notification capability
- Charts show static patterns with time-offset illusion

---

## F-14: Statistics & Analytics

| Attribute | Detail |
|-----------|--------|
| Purpose | Provide statistical reporting on application volumes, outcomes, and trends |
| Business Value | Supports policy decisions; enables performance monitoring; informs resource planning |
| Users | AiB Statisticians, Senior Officers |
| Status | Implemented |
| Pages | `/statistics` |

### Description

A data visualisation dashboard showing application statistics across multiple dimensions: status distribution, product breakdown, monthly trends, processing times, and regional analysis. Charts use gov.scot colour palette. Data falls back to comprehensive synthetic statistics when the API is unavailable.

### Technical Overview

The statistics page attempts to fetch real data via `GET /api/reports/statistics` and falls back to rich synthetic data. Visualisations include LineChart (trends), BarChart (by product), PieChart (status distribution), AreaChart (volume), and ComposedChart (multi-metric). All charts are responsive via Recharts `ResponsiveContainer`.

### User Experience

Statisticians see a multi-section dashboard with interactive charts. Data can be viewed by status, product, time period, and geography. Fallback data demonstrates 156 applications across all statuses.

### Dependencies

- API Gateway reports endpoint
- Recharts charting library
- Synthetic fallback data

### Future Enhancements

- Real-time data pipeline
- Drill-down by region/product/time
- Export to Excel/CSV
- Scheduled report generation
- PowerBI/Tableau integration

### Known Limitations (POC)

- Data is primarily synthetic
- No drill-down capability
- Limited to pre-defined chart types
- No date range selection

---

## F-15: Case Detail & Management

| Attribute | Detail |
|-----------|--------|
| Purpose | Display comprehensive case information with all associated data |
| Business Value | Single view of truth for case workers; reduces context-switching |
| Users | AiB Case Officers, Senior Officers |
| Status | Implemented |
| Pages | `/case/[ref]` |

### Description

The case detail page shows all information about an application: applicant details, financial summary, system check results, credit check outcome, recommendation, timeline, and actions. Officers can navigate to the full recommendation explanation or complete audit trail.

### Technical Overview

Dynamic routing via Next.js App Router (`[ref]` parameter). Pre-rendered for 4 seed cases using `generateStaticParams`. The `CaseDetail` component aggregates data from multiple sources and renders tabbed sections.

### User Experience

Officers see a structured case view with key metrics at the top, expandable sections for detail, and action buttons for common operations. Navigation links lead to recommendation detail and audit log sub-pages.

### Dependencies

- Case data (application record)
- Recommendation data
- Timeline/audit data
- System check results

### Future Enhancements

- Real-time collaboration (multiple officers viewing same case)
- Case notes and annotations
- Document viewer integration
- Officer assignment and handover

### Known Limitations (POC)

- Limited to 4 pre-rendered cases
- No real-time data refresh
- Actions are not functional (no backend processing)

---

## F-16: Case Timeline / Audit Trail

| Attribute | Detail |
|-----------|--------|
| Purpose | Provide chronological audit trail of all actions taken on a case |
| Business Value | Full accountability; regulatory compliance; dispute resolution evidence |
| Users | Case Officers, Senior Officers, System Admins |
| Status | Implemented |
| Pages | `/case/[ref]` (embedded), `/case/[ref]/audit` (full view) |

### Description

The timeline displays every event in a case's lifecycle: application submission, system checks, credit checks, recommendation generation, officer reviews, communications, and decisions. Events are categorised (application, check, decision, communication, review) and attributed to actors (system, staff, applicant, auth).

### Technical Overview

The `CaseTimeline` component renders events in reverse chronological order with category filters. Each event has a timestamp, actor type (with colour-coded dot), description, and expandable detail. Actor types are: system (blue), staff (amber), applicant (green), auth (purple).

### User Experience

The timeline appears as a vertical line with event nodes. Category filter buttons allow focusing on specific event types. Events are expandable for detail. A compact mode shows the most recent 8 events with a "view all" link to the full audit page.

### Dependencies

- Audit Service (port 3007)
- Timeline data structure
- Case reference for filtering

### Future Enhancements

- Real Audit Service integration
- Immutable append-only storage
- Correlation ID linking across services
- Export audit trail for legal proceedings
- Digital signature verification

### Known Limitations (POC)

- Events are pre-seeded per case
- No real-time event capture
- No correlation ID tracking

---

## F-17: Recommendation Explanation (Hero Page)

| Attribute | Detail |
|-----------|--------|
| Purpose | Provide transparent, detailed explanation of why a specific product was recommended |
| Business Value | Builds trust; supports appeal process; demonstrates algorithmic transparency |
| Users | Debtors, Case Officers, Money Advisers |
| Status | Implemented |
| Pages | `/case/[ref]/recommendation` |

### Description

A dedicated full-page explanation showing the recommendation with confidence gauge (RadialBarChart), contributing factors with weighted impact (BarChart), data inputs used, alternative products considered, and a natural-language explanation of the decision logic. Designed to meet algorithmic transparency requirements.

### Technical Overview

The recommendation page uses Recharts for visual confidence display. Data includes confidence level (high/medium/low), contributing factors with scores, system check statuses, and pre-written explanations per product type. Per-case recommendation data is stored in a typed data file.

### User Experience

Users see a large confidence gauge, then scrollable sections explaining each factor that influenced the decision. Alternative products are shown with brief comparisons. A "What this means for you" section translates the technical recommendation into plain language.

### Dependencies

- Recommendation data (per case)
- Recharts library
- Case reference routing

### Future Enhancements

- Interactive "what-if" sliders (change income → see how recommendation changes)
- SHAP-style feature importance from ML model
- Plain English summary generated by LLM
- PDF export for records

### Known Limitations (POC)

- Explanations are template-based, not dynamically generated
- Limited to 4 pre-rendered cases
- No interactive what-if capability

---

## F-18: Correspondence Templates

| Attribute | Detail |
|-----------|--------|
| Purpose | Generate and send standardised letters to applicants |
| Business Value | Ensures consistency; reduces officer drafting time; maintains audit trail |
| Users | AiB Case Officers, Senior Officers |
| Status | Implemented |
| Pages | `/correspondence` |

### Description

Five letter templates cover the complete correspondence lifecycle: Application Acknowledgement, Request for Additional Information, Decision Notification (Approved), Decision Notification (Rejected), and Referral to Money Adviser. Officers select a template, choose a case, preview the populated letter, and send via email and/or post.

### Technical Overview

Templates are string literals with variable interpolation (applicant name, reference number, date, case-specific details). Case data is drawn from a seed list. A sent log tracks all outbound correspondence with timestamp, officer, and delivery channel.

### User Experience

Officers see a template gallery, select one, choose the target case from a dropdown, and preview the fully populated letter. The preview shows realistic formatting. A "Send" action logs the correspondence and adds it to the sent history.

### Dependencies

- Case data (reference, applicant name, status)
- Officer identity (for audit)
- Notification Service (production delivery)

### Future Enhancements

- GOV.UK Notify integration for email/SMS
- Royal Mail API for physical post
- Template versioning and approval workflow
- Multi-language support
- Bulk send capability

### Known Limitations (POC)

- Letters are not actually sent
- No template editor (hardcoded)
- No approval workflow for new templates

---

## F-19: Digital Mailroom (AI Pipeline)

| Attribute | Detail |
|-----------|--------|
| Purpose | Automate processing of inbound physical documents via AI pipeline |
| Business Value | Eliminates manual sorting; reduces processing time from days to minutes; AI opportunity |
| Users | AiB Operations staff, System (automated) |
| Status | Implemented (admin portal) |
| Pages | Admin `/digital-mailroom` |

### Description

The Digital Mailroom demonstrates an AI-powered document processing pipeline: physical document scan, virus checking, OCR text extraction, Named Entity Recognition (NER) for extracting person names, NI numbers, monetary amounts, dates, addresses, and court references. Documents are classified by type and routed to the appropriate AiB system with confidence scores.

### Technical Overview

The admin page shows a pipeline dashboard with processing stages (scanning, OCR, classifying, routing, human review, complete). Mock documents have extracted entities displayed as colour-coded chips. Confidence-based routing sends low-confidence documents to a human review queue. Statistics show daily throughput, accuracy by document type, and processing time by stage.

### User Experience

Operations staff see a document queue with status indicators, expandable detail showing extracted entities, confidence scores, and routing decisions. Charts display pipeline performance metrics. Low-confidence items are flagged for human review.

### Dependencies

- OCR engine (Tesseract POC / Azure Document Intelligence production)
- NER model (spaCy POC / fine-tuned model production)
- ClamAV virus scanning
- Routing rules to BASYS/ASTRA/eDEN

### Future Enhancements

- Real Azure Document Intelligence integration
- Custom NER model training on AiB documents
- Continuous learning from human corrections
- PII auto-redaction for data protection
- Batch scanning integration with physical scanners

### Known Limitations (POC)

- All documents and extractions are mock data
- No real OCR/NER processing
- Pipeline stages are simulated

---

## F-20: AI Governance Dashboard

| Attribute | Detail |
|-----------|--------|
| Purpose | Monitor recommendation engine fairness, accuracy, and bias |
| Business Value | Regulatory compliance; algorithmic accountability; bias detection |
| Users | AiB Senior Officers, Policy team |
| Status | Implemented (admin portal) |
| Pages | Admin `/ai-governance` |

### Description

The AI Governance dashboard provides oversight of the recommendation engine's performance: confidence distribution, acceptance/override trends, override reasons analysis, bias metrics across protected characteristics (age, gender, region, employment), model accuracy per product, and a decision audit log.

### Technical Overview

Dashboard displays include: confidence histogram (BarChart), acceptance vs override rate trend (LineChart), override reasons (BarChart), bias analysis table with p-values and statistical significance flags, per-product model accuracy table, and chronological audit log of decisions with officer attribution.

### User Experience

Governance officers see high-level metrics with drill-down capability. A flagged bias indicator (Highland & Islands region showing 18.2% override rate vs 8% average, p=0.003) demonstrates how statistical anomalies are surfaced for investigation.

### Dependencies

- Recommendation Engine output data
- Decision audit log (accept/override records)
- Statistical analysis functions

### Future Enhancements

- Automated bias alerting
- Fairness constraint enforcement
- Model retraining triggers
- Regulatory reporting exports
- Integration with AI ethics committee workflow

### Known Limitations (POC)

- All metrics are synthetic
- No real statistical testing
- p-values are illustrative
- No automated alerting

---

## F-21: Rules Management Console

| Attribute | Detail |
|-----------|--------|
| Purpose | Configure, test, and manage recommendation engine rules |
| Business Value | Business users can adjust rules without code changes; supports policy agility |
| Users | Policy Officers, System Admins |
| Status | Implemented (admin portal) |
| Pages | Admin `/rules`, Admin `/rules/[id]` |

### Description

The Rules Management Console provides a searchable, filterable interface for all recommendation rules. Each rule has a name, description, priority, product assignment, status (active/draft/archived), conditions, actions, and test coverage metrics. Rule detail pages show full condition logic and test results.

### Technical Overview

Rules are defined in a typed data structure (`RuleDefinition`) with priority ordering, condition expressions, action outcomes, and test result metadata. The console shows KPI cards (active rules count, draft count, last updated, average test coverage), filterable table, and drill-through to individual rule configuration.

### User Experience

Policy officers see a dashboard of rule health metrics, then a searchable table of all rules. Each rule shows status badge, priority, product assignment, and test coverage. Clicking opens a detail page with full condition logic, test history, and edit controls.

### Dependencies

- Rules data store
- Recommendation Engine (consumes rules)
- Test framework (rule validation)

### Future Enhancements

- Visual rule builder (drag-and-drop conditions)
- Rule versioning with diff view
- A/B testing framework
- Automated regression testing on rule changes
- Approval workflow for rule activation

### Known Limitations (POC)

- Rules are read-only in the UI
- No rule editing capability
- Test results are pre-seeded

---

## F-22: Policy Simulation Tool

| Attribute | Detail |
|-----------|--------|
| Purpose | Model impact of policy threshold changes before implementation |
| Business Value | Evidence-based policy decisions; prevents unintended consequences; supports impact assessment |
| Users | Policy Officers, Senior Officers |
| Status | Implemented (admin portal) |
| Pages | Admin `/policy-simulation` |

### Description

The Policy Simulation tool allows officers to adjust key thresholds (DAS minimum disposable income, MAP debt ceiling, PTD asset threshold, DPP repayment period) and immediately see how historical cases would be re-classified. A comparison shows current vs proposed product distribution with migration counts.

### Technical Overview

The simulator re-runs the recommendation logic against a corpus of 80+ historical cases with adjusted parameters. Sliders control threshold values within defined ranges. Results are displayed as a PieChart comparison (current vs proposed) with case migration counts showing which cases would move between products.

### User Experience

Policy officers see parameter sliders with current values, adjust thresholds, and immediately see updated distribution charts. A "cases affected" summary shows exactly how many cases would change recommendation, broken down by source and destination product.

### Dependencies

- Historical case corpus (80+ cases)
- Recommendation logic (re-run with new parameters)
- Recharts (PieChart comparison)

### Future Enhancements

- Larger historical dataset
- Monte Carlo simulation for confidence intervals
- Cost-benefit analysis per policy change
- Approval workflow for policy changes
- Comparison with actual outcomes

### Known Limitations (POC)

- Limited to 80 synthetic historical cases
- Only 4 parameters are adjustable
- No approval or publication workflow
- No connection to live recommendation engine

---

## F-23: Knowledge Hub / CMS

| Attribute | Detail |
|-----------|--------|
| Purpose | Centralised content management for guidance, training, and operational notices |
| Business Value | Single source of truth; version-controlled content; usage analytics |
| Users | All AiB staff, Money Advisers (published content) |
| Status | Implemented (admin portal) |
| Pages | Admin `/knowledge-hub` |

### Description

The Knowledge Hub provides a searchable, categorised content library with articles covering product guidance, legislative updates, operational notices, and staff training materials. Features include version tracking, readership analytics, editorial calendar, and publication workflow (draft, under review, published, archived).

### Technical Overview

Articles are structured with metadata: title, category, status, version, author, last updated, publication date, views, and average reading time. The UI provides tabs for articles, calendar, and analytics. Filtering by category and status, plus text search, enables content discovery. A trend indicator shows popularity direction.

### User Experience

Content managers see article listings with status badges, view counts, and version numbers. An editorial calendar shows upcoming review dates and publication targets. Search and filter options enable quick content discovery.

### Dependencies

- Article data store
- Author attribution
- Publication workflow engine

### Future Enhancements

- Rich text editor (WYSIWYG)
- Approval workflow with reviewer assignment
- Automated review reminders
- Content analytics dashboard
- Public-facing knowledge base for citizens

### Known Limitations (POC)

- Content is read-only (no editing)
- Articles are hardcoded, not database-stored
- No rich text formatting
- No approval workflow

---

## F-24: Architecture Visualisation

| Attribute | Detail |
|-----------|--------|
| Purpose | Provide interactive documentation of system architecture |
| Business Value | Stakeholder communication; onboarding aid; design documentation |
| Users | Technical stakeholders, new team members |
| Status | Implemented |
| Pages | `/architecture` |

### Description

An interactive architecture page showing all system components as clickable tiles organised by category: User Channels, Identity (Keycloak SSO), API Gateway, External Service Integrations, AiB Core Systems, and Shared Platform Services. Clicking any tile reveals detailed information including endpoints, dependencies, data flows, mock behaviour, production path, and connected systems.

### Technical Overview

Architecture data is stored as a typed record (`TILES`) with 25+ components. Each tile has icon, name, category, status (Live/Sandbox/Design/Mock), brief description, and a detail object containing description, endpoints, dependencies, data flow, mock behaviour, production path, and connected systems. Categories define tile grouping and ordering.

### User Experience

Users see a categorised grid of architecture components with status indicators. Clicking a tile opens a detail panel showing full technical documentation. Status colours indicate implementation maturity (green=Live, amber=Sandbox, purple=Design, grey=Mock).

### Dependencies

- None (self-contained documentation page)

### Future Enhancements

- Animated data flow visualisation
- System health overlay (real-time status)
- Dependency graph visualisation
- Infrastructure cost annotations

### Known Limitations (POC)

- Static data (no live health checks)
- No animated flow diagrams
- Detail content is hardcoded

---

## F-25: Dark Mode & Accessibility

| Attribute | Detail |
|-----------|--------|
| Purpose | Support visual accessibility preferences and WCAG compliance |
| Business Value | Inclusive design; reduces eye strain; demonstrates accessibility commitment |
| Users | All users |
| Status | Implemented |
| Pages | All pages (global feature) |

### Description

Dark mode is implemented as a system-wide toggle affecting all pages. The theme respects system preferences and provides manual override. Accessibility features include focus indicators, 44px touch targets for mobile, semantic HTML, ARIA attributes, skip-to-content links, and contrast-compliant colour choices in both light and dark themes.

### Technical Overview

Theme management uses a `ThemeToggle` component with `localStorage` persistence and system preference detection via `prefers-color-scheme` media query. Tailwind CSS `dark:` variants provide dark mode styling throughout. A `Providers` wrapper component manages theme context. All interactive elements have visible focus styles using gov.uk yellow outline convention.

### User Experience

Users see a moon/sun toggle in the header. Clicking switches between light and dark modes instantly. The preference persists across sessions. All content remains readable and all interactive elements remain clearly identifiable in both modes.

### Dependencies

- Tailwind CSS dark mode configuration
- localStorage (preference persistence)
- System `prefers-color-scheme` media query

### Future Enhancements

- High contrast mode
- Font size adjustment controls
- Screen reader optimisation audit
- WCAG 2.2 AAA compliance
- Reduced motion preference respect

### Known Limitations (POC)

- Some third-party chart components may not fully support dark mode
- No high contrast mode
- WCAG audit not formally completed
- Some colour combinations may not meet AAA ratio

---

## F-26: Real-Time Eligibility Indicator

| Attribute | Detail |
|-----------|--------|
| Purpose | Provide instant visual feedback on product eligibility as applicants enter financial data |
| Business Value | Reduces abandoned applications; sets expectations early; improves data quality |
| Users | Debtors, Money Advisers |
| Status | Implemented |

### Description

As applicants complete income, expenditure, and debt fields, a live eligibility indicator updates showing which products they may qualify for (DAS, MAP, PTD, Sequestration, DPP). Colour-coded bars show likelihood (green/amber/red) based on current data, updating in real-time without page reload.

---

## F-27: Debtor Risk Score

| Attribute | Detail |
|-----------|--------|
| Purpose | Calculate and display a composite risk score for each applicant to inform case prioritisation |
| Business Value | Enables risk-based triage; highlights complex cases early; supports resource allocation |
| Users | AiB Case Officers, Senior Officers |
| Status | Implemented |

### Description

A visual risk gauge (0-100) combining credit score (40%), debt-to-income ratio (35%), and existing case history (25%). Displayed on case detail pages with contributing factors breakdown, colour-coded severity (green/amber/red), and explanatory tooltips. Helps officers prioritise caseload by risk level.

---

## F-28: Guided Decision Support

| Attribute | Detail |
|-----------|--------|
| Purpose | Provide case officers with a structured checklist to ensure consistent decision-making |
| Business Value | Reduces errors; ensures compliance; supports training of new officers |
| Users | AiB Case Officers |
| Status | Implemented |

### Description

An interactive checklist on case detail pages that tracks review progress: credit check review, income verification, BASYS lookup, recommendation review, identity confirmation, and decision. Auto-checks items where system data confirms completion. Progress bar shows overall readiness for decision.

---

## F-29: Applicant Communication Portal

| Attribute | Detail |
|-----------|--------|
| Purpose | Enable secure messaging between debtors and their assigned money advisers |
| Business Value | Reduces phone calls; creates audit trail; improves response times |
| Users | Debtors, Money Advisers |
| Status | Implemented |

### Description

Debtors can view message history with their assigned adviser, send categorised messages (general, recommendation, upload help, appointment change, urgent), and see adviser availability. Advisers see client messages in their dashboard with response prompts.

---

## F-30: MFA Authentication Flow

| Attribute | Detail |
|-----------|--------|
| Purpose | Enforce multi-factor authentication with TOTP, WebAuthn, and email OTP support |
| Business Value | Meets Cyber Essentials Plus; protects citizen data; regulatory compliance |
| Users | All authenticated users |
| Status | Implemented |

### Description

Enhanced MFA flow with method selection (authenticator app, hardware key, email code), animated verification feedback, device trust management, and graceful fallback paths. Integrates with session management for step-up authentication on sensitive operations.

---

## F-31: Multi-Language Support (EN/GD)

| Attribute | Detail |
|-----------|--------|
| Purpose | Provide Scottish Gaelic language support alongside English for all public-facing content |
| Business Value | Meets Gaelic Language Act 2005 obligations; inclusive design; cultural accessibility |
| Users | All public users |
| Status | Implemented |

### Description

Language toggle in the site header switches between English and Scottish Gaelic. Key navigation, labels, and informational content translated. Preference persisted via localStorage. Demonstrates bilingual capability for production Gaelic Language Plan compliance.

---

## F-32: Webhook System

| Attribute | Detail |
|-----------|--------|
| Purpose | Enable event-driven notifications to external systems when application state changes |
| Business Value | Real-time integration; reduces polling; supports automation |
| Users | System Admins, Integration Partners |
| Status | Implemented |

### Description

Configurable webhooks fire on application events (submitted, approved, rejected, assigned). Supports retry with exponential backoff, HMAC signature verification, and delivery logging. Admin interface shows webhook configuration, recent deliveries, and failure rates.

---

## F-33: API Key Management

| Attribute | Detail |
|-----------|--------|
| Purpose | Issue and manage API keys for third-party system integration |
| Business Value | Secure programmatic access; audit trail; rate limiting per key |
| Users | System Admins, Integration Partners |
| Status | Implemented |

### Description

Admin interface for creating, rotating, and revoking API keys. Each key has configurable permissions, rate limits, and expiry dates. Usage metrics show requests per key, error rates, and last-used timestamps. Keys support scope restriction (read-only, write, admin).

---

## F-34: Interactive API Documentation

| Attribute | Detail |
|-----------|--------|
| Purpose | Provide live, interactive API documentation with try-it-now capability |
| Business Value | Accelerates integration development; reduces support queries; self-service onboarding |
| Users | Developers, Integration Partners |
| Status | Implemented |

### Description

Swagger/OpenAPI-style documentation page with endpoint listing, request/response examples, authentication guidance, and live API testing. Supports code generation for common languages and copy-paste cURL commands.

---

## F-35: Session Management

| Attribute | Detail |
|-----------|--------|
| Purpose | Provide visibility and control over active user sessions across devices |
| Business Value | Security hygiene; detect compromised sessions; compliance with data protection |
| Users | All authenticated users, System Admins |
| Status | Implemented |

### Description

Users can view active sessions (device, location, last activity), revoke individual sessions, and force logout of all devices. Admins can view system-wide active sessions, detect anomalies (concurrent logins from different locations), and force session termination for security incidents.

---

## F-61: Organisation Service

| Attribute | Detail |
|-----------|--------|
| Purpose | Shared master data for creditors, banks, utilities, councils |
| Business Value | Eliminates duplicate creditor entries, enables cross-case analytics |
| Users | Citizens (apply form), Staff (case detail), Admin |
| Status | Implemented |
| Pages | /apply (type-ahead), /admin/organisations |

### Description
54 seeded organisations across 8 types. Provides type-ahead creditor search in the debt entry form. Demonstrates shared microservice pattern.

## F-62: Creditor Type-Ahead

| Attribute | Detail |
|-----------|--------|
| Purpose | Auto-suggest creditor names from Organisation Service |
| Business Value | Reduces data entry errors, ensures consistent creditor naming |
| Users | Citizens |
| Status | Implemented |
| Pages | /apply (debts step) |

### Description
As user types 2+ characters, matching organisations appear in a dropdown. User can select from the list or enter custom text. Demonstrates service-oriented architecture.

## F-63: LocalStorage Persistence

| Attribute | Detail |
|-----------|--------|
| Purpose | Applications survive browser refresh without backend |
| Business Value | Zero data loss during demo, works offline |
| Users | All |
| Status | Implemented |
| Pages | All (via persistence.ts) |

### Description
IApplicationRepository + IAuditRepository backed by LocalStorage. Initializes with 100 seed applications. Survives refresh, navigation, logout. Interface-ready for .NET API migration.

## F-64: Notification Centre

| Attribute | Detail |
|-----------|--------|
| Purpose | Centralised view of all platform notifications |
| Business Value | Staff awareness, SLA tracking, event visibility |
| Users | Staff |
| Status | Implemented |
| Pages | /notifications |

### Description
15 notifications across types (application, system, decision, anomaly). Tabs for All/Unread/Applications/System. Mark as read functionality.

## F-65: Dev Documentation Viewer

| Attribute | Detail |
|-----------|--------|
| Purpose | Browse all 36+ project docs inline with rendered Markdown |
| Business Value | Self-service documentation for team members and stakeholders |
| Users | Developers, Architects, PMs |
| Status | Implemented |
| Pages | /admin/dev |

### Description
Fetches raw markdown from GitHub, renders with headings, tables, code blocks, and Mermaid diagrams. Category filters (Strategic, Functional, Technical, Operations, Delivery, Compliance).

---

## Appendix: Feature Status Summary

| Status | Count | Features |
|--------|-------|----------|
| Implemented | 35 | F-01 through F-18, F-24 through F-35, F-61 through F-65 |
| Implemented (Sandbox) | 3 | F-06, F-09, F-07 |
| Design (Simulated) | 2 | F-02, F-03 |
| Total | 40 | All features documented |

---

*End of Feature Catalogue*
