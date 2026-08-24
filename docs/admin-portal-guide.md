# AiB IAAS — Admin Portal Guide

## Overview

The Administration Portal provides 38 features for platform management. Access via `/admin` after logging in with a staff role (System Admin, Senior Officer, or Case Officer).

## Navigation

All features accessible from the Admin hub page (`/admin`) as tiles. Each tile shows icon, name, description, and a "Live" badge.

## Feature Categories & Details

### User Administration

1. **Users** (`/admin/users`) — View 500+ users, search, filter by role/org, create new users (persists to API). Roles: System Admin only.
2. **Manage Users** (`/manage-users`) — Alternative user management view with detail panel, edit, suspend, reset password.

### Organisation Administration

3. **Organisations** (`/admin/organisations`) — 54 seeded organisations, creditor type-ahead search, hierarchy view.

### Security

4. **Security Headers** (`/admin/security-headers`) — Helmet.js CSP, HSTS, X-Frame-Options display.
5. **API Keys** (`/admin/api-keys`) — Generate, revoke, scope management.
6. **Consent** (`/admin/consent`) — GDPR consent management, data processing agreements.
7. **QR Login** (`/admin/qr-login`) — QR code authentication setup.
8. **Biometric** (`/admin/biometric`) — Fingerprint/Face ID authentication options.

### Reporting & Analytics

9. **Reports** (`/admin/reports`) — Report builder with 100 cases, quick-start tiles (Approved, DAS, High Debt), generated output with stats/table/CSV.
10. **Export** (`/admin/export`) — Data export with search (name, ref, status, date range), filter, sort, CSV download, Print/PDF.
11. **MI Reports** (`/admin/mi-reports`) — Management information dashboards.
12. **Statistics** (`/statistics`) — Live KPI dashboard with 7d/30d/90d/12m time periods that actually update charts and cards.

### Configuration

13. **Feature Flags** (`/admin/feature-flags`) — Enable/disable features per role, backend API switcher with health checks.
14. **Webhooks** (`/admin/webhooks`) — External system event notifications, delivery log.
15. **Data Retention** (`/admin/data-retention`) — Editable retention policies, Add/Delete Credit Checks policy, auto-archive toggles, persists to localStorage.
16. **Workflow Engine** (`/admin/workflow-engine`) — BPM rules and automation configuration.
17. **Rules Engine** (`/admin/rules`) — View and test recommendation rules (7 Scottish debt products), threshold configuration.

### Integrations

18. **Integration Monitor** (`/admin/integration-monitor`) — Real-time system check monitoring (BASYS, eDEN, DAS, CFT, Moratorium, RoI).
19. **Open Banking** (`/admin/open-banking`) — PSD2 API integration status, consent flow.

### Support Tools

20. **Knowledge Hub** (`/admin/knowledge-hub`) — Internal documentation and training resources.
21. **Digital Mailroom** (`/admin/digital-mailroom`) — Document routing, correspondence pipeline, intake metrics.
22. **Collaboration** (`/admin/collaboration`) — Team collaboration tools.
23. **Voice Input** (`/admin/voice-input`) — Voice-to-text transcription controls.
24. **Document Scanner** (`/admin/document-scanner`) — OCR document processing, camera capture.

### Monitoring

25. **System Health** (`/admin/system-health`) — Service status, uptime metrics per microservice.
26. **Performance** (`/admin/performance`) — Core Web Vitals, load time monitoring.
27. **Activity Heatmap** (`/admin/activity`) — GitHub-style contribution heatmap (52 weeks), hover shows system breakdown (BASYS/eDEN/DAS/IAAS/CFT/RoI), click to drill-down.
28. **Carbon Tracker** (`/admin/carbon-tracker`) — Environmental impact metrics.
29. **Changelog** (`/admin/changelog`) — System version history.

### Audit & Compliance

30. **Accessibility Checker** (`/admin/accessibility-checker`) — WCAG 2.1 compliance scanner.
31. **Satisfaction** (`/admin/satisfaction`) — NPS surveys, user feedback.
32. **Correspondence Scheduler** (`/admin/correspondence-scheduler`) — Automated letter scheduling.
33. **Digital Signature** (`/admin/digital-signature`) — Canvas drawing, document selection, confirm + audit log persisted to localStorage.
34. **Notifications Hub** (`/admin/notifications-hub`) — GOV.UK Notify integration, templates.

### AI & Recommendation Services

35. **AI Governance** (`/admin/ai-governance`) — AI model oversight, bias monitoring, policies.
36. **AI Explainability** (`/admin/ai-explainability`) — Visual decision trees, factor weighting.
37. **Policy Simulation** (`/admin/policy-simulation`) — What-if scenarios for policy threshold changes.
38. **Dev Documentation** (`/admin/dev`) — 38 project documents with Mermaid diagrams, zoom modal, download.

## Access Control

| Role | Access Level |
|------|-------------|
| System Administrator | Full access to all 38 features |
| AiB Senior Officer | All except API Keys, Webhooks |
| AiB Case Officer | Reports, Export, Activity, Knowledge Hub, Digital Mailroom |
| Money Adviser | Read-only on Reports, Knowledge Hub |

## Data Persistence

- **API-persisted**: User creation, audit events, applications.
- **localStorage-persisted**: Feature flags, data retention policies, signature audit log, backend selection.
- **Session-only**: Most UI state, filters, search queries.
