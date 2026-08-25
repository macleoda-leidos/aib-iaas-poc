# IAAS Functionality Breakdown

A complete page-by-page inventory of everything built in the AiB IAAS Proof of Concept. Organised by user group, each entry describes what the page does, what data it shows, and what interactions are available.

---

## Group 1 — Citizen Pages

These pages are accessible to all users without authentication (or to authenticated debtors/applicants).

### `/` — Home Page

The service landing page following GOV.UK patterns. Displays the AiB branding, a service status indicator (connected/disconnected), a prominent "Apply now" start button, and a structured list of all Scottish debt solutions (Bankruptcy, MAP, DAS, Protected Trust Deed, LILA, Moratorium, MAS) with brief descriptions. Includes a language toggle (English/Scottish Gaelic) and links to accessibility, feedback, and cookie policy. The page adapts to connection state — if the API is offline, it shows a graceful degradation message with auto-retry.

### `/apply` — Application Form (9-Step Wizard)

A multi-step guided form collecting debtor financial circumstances. Nine sections: Personal Details, Address and Contact, Employment and Income, Expenditure, Debts and Liabilities, Assets, Supporting Documents, Declaration, and Review and Submit. Features include real-time client-side validation (NI number format, UK postcode, age verification), auto-save to localStorage with API sync, a floating eligibility meter sidebar that updates as data is entered, auto-calculated disposable income with colour coding (green/amber/red), and progress persistence so users can return where they left off. On submission, triggers the recommendation engine.

### `/my-application` — Applicant Portal

A personal dashboard for citizens who have submitted an application. Shows a visual progress tracker (submitted, under review, decision pending, complete), a messages panel with correspondence from AiB staff, a documents section showing uploaded files with status (verified, pending scan, rejected), and key dates. Provides a sense of transparency and reduces phone enquiries.

### `/login` — Authentication

A login page with demo account selector (one-click fill), email/password form, and a multi-factor authentication step. The MFA screen accepts a 6-digit TOTP code with a "Powered by Keycloak" badge. In the POC, any code is accepted. After successful login, users are redirected based on their role (staff to dashboard, debtors to portal, specialists to their domain page).

### `/account` — Account Settings

User account management page with notification preference controls. Users can toggle email and in-app notifications for different event types (application updates, new messages, payment reminders, system announcements). Preferences are role-specific — staff see different notification categories than citizens.

### `/account/sessions` — Session Management

Displays active sessions with device information (browser, OS, IP address, last activity timestamp). Users can revoke individual sessions or sign out of all devices. Shows session expiry countdown timers. Demonstrates enterprise session management patterns.

---

## Group 2 — Staff Pages

These pages require authentication with a staff role (Case Officer, Senior Officer, Team Leader, or Admin).

### `/dashboard` — Staff Dashboard

Role-based operational dashboard. For case officers: AI-prioritised case list (urgent/high/normal/low badges with colour coding), anomaly detection alert cards (income discrepancies, duplicate applications, SLA warnings), a notification bell with unread count, and a live ticker showing recent system events. Cases are sorted by AI-determined priority, not just submission date. Includes quick-action buttons for common tasks.

### `/portal` — Unified Work Queue

A single prioritised work queue spanning all six AiB systems (BASYS, eDEN, DAS, CFT, Moratorium, RoI). Shows pending actions across all product types in one view. Staff can filter by product type, priority, assigned officer, or date range. This solves the current pain point of staff needing to check multiple systems for their workload.

### `/case/[ref]` — Case Detail

The full case view for a specific application. Begins with an AI-generated natural language summary synthesised from all case data. Followed by: AI Quality Check panel (6 automated pre-decision checks — document completeness, income verification, conflict of interest, recommendation confidence, identity verification, credit check), a risk score semi-circle gauge (computed from credit score + debt-to-income ratio + existing cases), a predictive outcome badge ("87% likely approved"), a decision support checklist (6 interactive steps for caseworkers with auto-checks from data), staff notes textarea with timestamped history, case assignment dropdown, email notification log (sent/pending/failed badges per stage), and collapsible sections for all application data.

### `/case/[ref]/recommendation` — Recommendation Explainability

Deep-dive into the recommendation engine output. Shows a confidence gauge (percentage ring), a list of contributing factors with weights (debt-to-income ratio, number of creditors, employment stability, asset value, existing arrangements), an alternatives comparison bar chart showing why other products scored lower, and a plain-English explanation of the recommendation rationale. Full audit trail of which rules fired and which inputs were used.

### `/case/[ref]/audit` — Case Audit Timeline

A chronological timeline of all actions against a case, showing 15-20 events per case. Each event shows timestamp, actor, action type, and details. Category filters allow narrowing by event type (status changes, document uploads, notes added, emails sent, system checks, assignments, recommendations). Demonstrates immutable audit trail capability.

### `/search` — Cross-System Search

Fuzzy matching search across all six legacy systems. Type a partial name, reference number, or NI number and get results from BASYS, eDEN, DAS, CFT, Moratorium, and Register of Insolvencies simultaneously. Results show identity confidence scores (percentage match), system of origin, and quick-link to case detail. Uses Fuse.js for approximate matching. This is the "single debtor view" that AiB currently lacks.

### `/correspondence` — Digital Correspondence

Outbound correspondence generation using GOV.UK-compliant letter templates. Staff select a template type (application acknowledgement, information request, decision notification, payment reminder), choose a recipient, and the system pre-fills case data. Preview before send. Tracks delivery status. Supports the Digital Mailroom concept of reducing manual letter composition.

---

## Group 3 — Analytics Pages

### `/statistics` — Live Analytics Dashboard

Real-time charts and KPI counters. Includes: line chart (application volumes over time), area chart (processing times by product), bar chart (product distribution), pie chart (geographic breakdown), and gauge visualisations (SLA compliance). KPI counters animate with incremental ticks every 10 seconds to show "live" data. A "LIVE" badge pulses in the header. Trend indicators show week-on-week changes.

### `/security` — Security Operations Centre (SOC)

A dark-themed CyberOps monitoring dashboard. Displays: live event stream (authentication events, failed logins, suspicious activity), threat detection feeds simulating Sophos and Tenable integration, anomaly alerts (brute force attempts, unusual access patterns), geographic attack map, and system health indicators for Sysmon and CloudWatch. Demonstrates Cyber Essentials Plus alignment and operational security monitoring capability.

---

## Group 4 — Admin Features (28 Total)

All accessible from the admin hub at `/admin`. Each feature is a self-contained page demonstrating a specific enterprise capability.

| # | Feature | Path | Description |
|---|---------|------|-------------|
| 1 | Rules Engine | `/admin/rules` | Manage 9 recommendation rules, toggle active/inactive, interactive tester, version history |
| 2 | Digital Mailroom | `/admin/digital-mailroom` | AI OCR/NER pipeline, 20 documents, 5 workflows, classification stats, auto-routing |
| 3 | AI Governance | `/admin/ai-governance` | Bias metrics by protected characteristic, model registry, explainability scores, override audit |
| 4 | Policy Simulation | `/admin/policy-simulation` | 4 parameter sliders, test against 100 historical cases, projected impact visualisation |
| 5 | Knowledge Hub | `/admin/knowledge-hub` | CMS with 10 articles, rich text editor preview, content calendar, publish workflow |
| 6 | Webhooks | `/admin/webhooks` | Webhook registration, event type selection, delivery log with retry status |
| 7 | API Keys | `/admin/api-keys` | Generate/revoke API keys, scope assignment, masked display, usage tracking |
| 8 | Security Headers | `/admin/security-headers` | Helmet.js configuration display, CSP policies, HSTS settings |
| 9 | User Management | `/admin/users` | User listing, role assignment, account status, last login |
| 10 | Organisation Management | `/admin/organisations` | Organisation registry, associated users, permissions |
| 11 | Role & Permission Matrix | `/admin/users` | RBAC matrix rendered on the user management page, 10 roles, 20 permissions |
| 12 | Audit Logs | `/admin/audit` | System-wide audit trail viewer with filters |
| 13 | System Health | `/admin/health` | Service status for all 13 microservices, uptime, response times |
| 14 | Feature Flags | `/admin/feature-flags` | Toggle features on/off without deployment |
| 15 | Email Templates | `/admin/email-templates` | Manage GOV.UK Notify template library |
| 16 | Notification Centre | `/admin/notifications` | System notification management, broadcast messages |
| 17 | Data Export | `/admin/data-export` | CSV/JSON export of case data with field selection |
| 18 | Batch Processing | `/admin/batch` | Bulk operations queue with progress tracking |
| 19 | Scheduled Tasks | `/admin/scheduled-tasks` | Cron job management, execution history |
| 20 | Integration Monitor | `/admin/integrations` | Real-time status of all 6 legacy system connections |
| 21 | Cache Management | `/admin/cache` | View and clear application caches |
| 22 | Error Dashboard | `/admin/errors` | Aggregated error log, stack traces, frequency |
| 23 | Performance Metrics | `/admin/performance` | Response time percentiles, slow queries, throughput |
| 24 | Database Admin | `/admin/database` | Table statistics, connection pool status, query explorer |
| 25 | Document Templates | `/admin/document-templates` | Letter and form template management |
| 26 | Compliance Dashboard | `/admin/compliance` | Regulatory requirement tracking, evidence mapping |
| 27 | Training Mode | `/admin/training` | Sandbox environment for new staff onboarding |
| 28 | Release Notes | `/admin/release-notes` | Version history, changelog, sprint delivery notes |

---

## Group 5 — Technical Pages

### `/architecture` — System Architecture

Interactive architecture visualisation showing the full system design. Displays: microservices topology with port assignments, technology stack table, integration map (6 legacy systems), deployment architecture (GitHub Pages + Render + AWS design), data flow diagrams, and links to live API and API documentation. Serves as both documentation and a demonstration of the system's technical maturity.

### `/api-docs` — Interactive API Documentation

An interactive API explorer with "Try it" buttons for all endpoint groups. Each endpoint shows method, path, description, request parameters, example response, and a button to execute against the live API. Groups include: applications, auth, recommendations, documents, payments, audit, organisations, users, and health. Demonstrates API-first design principles.

### `/api-docs/openapi` — OpenAPI Specification

Full endpoint reference following the OpenAPI 3.0 specification format. Documents all REST endpoints with request/response schemas, authentication requirements, error codes, and rate limiting information. Serves as the contract for any future third-party integrations or mobile application development.

---

## Page Count Summary

| Group | Pages | Notes |
|-------|-------|-------|
| Citizen | 6 | Public-facing, no auth required (except account) |
| Staff | 7 | Requires staff role authentication |
| Analytics | 2 | Specialist dashboards |
| Admin | 28 | Full admin hub + individual feature pages |
| Technical | 3 | Architecture and API documentation |
| Supporting | 6+ | Accessibility, feedback, cookies, demo controls, login, portal |
| **Total** | **50+** | Across all user groups |

---

## Feature Categories

### Real-Time Features
- Eligibility meter (updates as form data changes)
- KPI counter animation (ticks every 10 seconds)
- API connection status bar (polls every 30 seconds)
- Notification bell (unread count updates)
- Live ticker on dashboard (recent events stream)

### AI/ML Features (12+)
1. Real-time eligibility prediction
2. Debtor risk scoring
3. Automated case prioritisation
4. AI-generated case summaries
5. Anomaly detection alerts
6. Predictive case outcomes
7. AI quality check (6 automated checks)
8. Digital Mailroom OCR/NER
9. Digital assistant — deterministic, answers cited to legislation (4 solutions x 8 question types)
10. Recommendation explainability
11. Policy simulation modelling
12. AI governance and bias monitoring

### Security Features
- Multi-factor authentication (TOTP)
- Role-based access control (10 roles)
- Session management with revocation
- Rate limiting with user feedback
- Security headers (Helmet.js)
- API key management
- Webhook authentication
- Immutable audit trail
- Security Operations Centre monitoring

### Integration Patterns
- BASYS (Bankruptcy administration)
- eDEN (Debt Arrangement Scheme)
- DAS Register (DAS applications)
- CFT (Certificate for Trustee)
- Moratorium Register (Debt moratorium)
- Register of Insolvencies (Public register)
- Credit Reference Agency (credit scores)
- GOV.UK Pay (payment processing)
- GOV.UK Notify (notifications)
- ScotAccount / GOV.UK Login (identity)

---

*Last updated: August 2026*
