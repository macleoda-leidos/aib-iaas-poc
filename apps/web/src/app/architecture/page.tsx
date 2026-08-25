'use client';

// WCAG 3.1.2 — Language of Parts: Code/pre blocks on this page use English content
// within the page's lang="en" scope (set in layout.tsx <html lang="en">). Decorative
// code elements (endpoint lists in mono font) are presented as <ul> lists, not <code>,
// so no additional lang attribute is needed.

import { useState } from 'react';
import Link from 'next/link';

// Architecture data — each tile has detail content
const TILES: Record<string, { icon: string; name: string; category: string; status: string; statusColour: string; brief: string; detail: { description: string; endpoints?: string[]; dependencies?: string[]; dataFlow?: string; mockBehaviour?: string; productionPath?: string; connectedTo?: string[] } }> = {
  // User Channels
  web: { icon: '🖥️', name: 'Web Portal', category: 'channel', status: 'Live', statusColour: 'bg-green-500', brief: 'Next.js 15, React 19, GOV.UK patterns', detail: { description: 'Responsive web application serving debtors, advisers, and AiB staff. Mobile-first PWA with offline capability.', endpoints: ['/ — Homepage', '/apply — 9-section application form', '/dashboard — Role-specific dashboards', '/portal — Keycloak SSO unified portal', '/login — Mock Keycloak login', '/architecture — This page'], dependencies: ['API Gateway (port 3001)', 'Tailwind CSS', 'Next.js App Router'], dataFlow: 'User → Web Portal → API Gateway → Backend Services', productionPath: 'GitHub Pages (static export via GitHub Actions CI/CD)', connectedTo: ['API Gateway', 'Keycloak'] } },
  mobile: { icon: '📱', name: 'Mobile (PWA)', category: 'channel', status: 'Live', statusColour: 'bg-green-500', brief: 'Mobile-first responsive, document camera upload', detail: { description: 'Progressive Web App — same codebase as web portal. Installable on home screen, camera access for document upload, touch-optimised (44px targets).', endpoints: ['Same as Web Portal — responsive breakpoints at 375px, 768px, 1024px'], dependencies: ['Service Worker (future)', 'Camera API for doc upload', 'Payment Request API (Apple/Google Pay)'], dataFlow: 'Mobile User → PWA → API Gateway → Services', mockBehaviour: 'Camera upload simulated with file picker', productionPath: 'Same GitHub Pages deployment; no app store required', connectedTo: ['Document Service', 'Payment Service', 'ClamAV'] } },
  admin: { icon: '🏢', name: 'Admin Portal', category: 'channel', status: 'Live', statusColour: 'bg-green-500', brief: 'Internal staff portal + Digital Mailroom + AI Governance + Rules Console', detail: { description: 'Internal administration portal for AiB staff. Application review, user management (500 users), organisation hierarchy, RBAC matrix. Includes Digital Mailroom (OCR/NER/AI pipeline), AI Governance Dashboard, Rules Management Console, Policy Simulation Tool, and Knowledge Hub/CMS.', endpoints: ['/ — Dashboard (19 applications)', '/users — 500-user paginated management', '/organisations — Parent/child org hierarchy', '/applications/:id — Full case detail with tabs', '/mailroom — Digital Mailroom OCR/NER pipeline', '/ai-governance — AI model governance dashboard', '/rules — Rules Management Console', '/policy-simulation — What-if policy analysis', '/knowledge-hub — Knowledge Hub / CMS'], dependencies: ['API Gateway', 'User Service', 'Organisation Service'], dataFlow: 'AiB Staff → Admin Portal → API Gateway → Services', productionPath: 'Separate GitHub Pages deployment with Keycloak AD-only access', connectedTo: ['User Service', 'Organisation Service', 'Audit Service'] } },

  // Identity
  keycloak: { icon: '🔐', name: 'Keycloak (SSO)', category: 'identity', status: 'Live', statusColour: 'bg-green-500', brief: 'SSO with MFA, 10 users, 10 roles, SAML/OIDC', detail: { description: 'Keycloak 25.0 in Docker Compose provides federated identity management. Pre-configured realm with 10 users, 10 roles, MFA enforcement. SAML/OIDC federation placeholders for ScotAccount and GOV.UK Login. User authenticates ONCE and receives access to all AiB systems their role permits.', endpoints: ['POST /api/identity/verify/scotaccount — ScotAccount SAML verification', 'POST /api/identity/verify/govuk — GOV.UK One Login OIDC', 'GET /api/identity/systems — List all federated systems', 'POST /api/identity/lookup — Cross-system identity lookup', 'GET /api/identity/user/:id/linked-accounts — Show linked accounts'], dependencies: ['ScotAccount (SAML 2.0)', 'GOV.UK One Login (OIDC)', 'Active Directory (LDAP)', 'PostgreSQL (Keycloak DB)'], dataFlow: 'User → Keycloak → ScotAccount/GOV.UK → JWT issued → Access all systems', mockBehaviour: 'Keycloak running on port 8080 in Docker Compose with pre-configured aib-iaas realm. 10 users seeded across 10 roles. Admin console at localhost:8080 (admin/admin).', productionPath: 'Keycloak 25 on ECS Fargate (HA). SAML federation with ScotAccount. OIDC with GOV.UK One Login. LDAP sync with AD.', connectedTo: ['BASYS', 'ASTRA', 'eDEN', 'DAS', 'CFT', 'Moratorium', 'RoI', 'IAAS'] } },

  // Gateway
  gateway: { icon: '🌐', name: 'API Gateway', category: 'gateway', status: 'Live', statusColour: 'bg-green-500', brief: 'Auth, RBAC, rate limiting, routing', detail: { description: 'Single entry point for all API traffic. Validates JWT tokens, enforces RBAC (20 permissions), applies rate limiting, generates correlation IDs, routes to downstream services. Uses @aib-iaas/database package with repository pattern for persistence.', endpoints: ['POST /api/applications — Create application', 'GET /api/applications/:id — Get application', 'POST /api/applications/:id/submit — Submit', 'GET /api/postcode/:postcode — Address lookup', 'GET /api/reports/export/weekly-report — CSV download'], dependencies: ['All backend services', '@aib-iaas/database (PostgreSQL/SQLite)', 'Helmet (security headers)'], dataFlow: 'Request → Auth middleware → RBAC check → Rate limit → Route → Service → Response', mockBehaviour: 'Runs on port 3001. Data persisted via @aib-iaas/database package (SQLite locally, PostgreSQL in Docker). Full CRUD for applications.', productionPath: 'ECS Fargate with auto-scaling. PostgreSQL via @aib-iaas/database. Redis for rate-limit counters.', connectedTo: ['All services'] } },

  // External Services
  creditcheck: { icon: '🔍', name: 'Credit Check', category: 'external', status: 'Sandbox', statusColour: 'bg-amber-500', brief: 'Equifax, Experian, TransUnion', detail: { description: 'Multi-provider credit reference check. Consent recorded before check. Results cached 24 hours. Deterministic scoring based on input for consistent demo behaviour.', endpoints: ['POST /api/credit-check/run — Run check (requires consent)', 'GET /api/credit-check/providers — List available CRAs', 'POST /api/credit-check/consent — Record consent', 'GET /api/credit-check/history/:appId — Check history'], dependencies: ['Equifax ConsumerView API', 'Experian Connect API', 'Consent management'], dataFlow: 'Application → Consent check → Provider selected → API call → Score + accounts + risk indicators → Cache → Response', mockBehaviour: 'Synthetic provider generates deterministic scores from name hash. Equifax/Experian sandboxes simulate realistic response shapes. NI ending in "B" triggers bankruptcy flag.', productionPath: 'CRA contracts required (Equifax/Experian). ICO data sharing registration. mTLS for API calls.', connectedTo: ['API Gateway', 'Audit Service'] } },
  payments: { icon: '💳', name: 'Payments', category: 'external', status: 'Sandbox', statusColour: 'bg-amber-500', brief: 'WorldPay, Google Pay, Apple Pay, PayGate', detail: { description: 'Payment processing with multiple provider support. Apple Pay via Payment Request API, Google Pay via Google Pay API, card payments via WorldPay/PayGate. All sandbox — no real transactions.', endpoints: ['POST /api/payments/initiate — Create payment session', 'POST /api/payments/apple-pay — Apple Pay completion', 'POST /api/payments/google-pay — Google Pay completion', 'POST /api/payments/card — Card payment', 'GET /api/payments/:id/status — Payment status', 'POST /api/payments/:id/refund — Refund (sandbox)'], dependencies: ['WorldPay SDK', 'Apple Pay JS', 'Google Pay API', 'PayGate REST API'], dataFlow: 'User selects method → Payment session created → Provider-specific flow → Confirmation → Status updated', mockBehaviour: '90% success rate simulation. Transaction references generated. Sandbox mode clearly indicated on all responses.', productionPath: 'PSP contract (WorldPay or GOV.UK Pay). Apple/Google Pay merchant registration. PCI DSS compliance.', connectedTo: ['API Gateway', 'Audit Service', 'Notification Service'] } },
  postcode: { icon: '📍', name: 'Postcode Lookup', category: 'external', status: 'Mock', statusColour: 'bg-gray-500', brief: 'Address validation, PAF, auto-complete', detail: { description: 'Postcode lookup returns synthetic addresses for any valid UK postcode. Supports the 5-year address history requirement. Used in application form and contact details update.', endpoints: ['GET /api/postcode/:postcode — Returns list of addresses'], dependencies: ['Royal Mail PAF (production)', 'Ordnance Survey (production)'], dataFlow: 'User enters postcode → API call → Address list returned → User selects → Fields populated', mockBehaviour: 'Returns 3 synthetic addresses per postcode. Scottish postcodes (EH, G, DD, AB, FK, PH, IV) return city-appropriate results.', productionPath: 'Ordnance Survey or Ideal Postcodes API. ~£0.03 per lookup.', connectedTo: ['API Gateway', 'Application Form'] } },
  documents: { icon: '📄', name: 'Document Service', category: 'external', status: 'Live', statusColour: 'bg-green-500', brief: 'Upload, generation, ClamAV virus scanning', detail: { description: 'Document lifecycle management. Upload from desktop or mobile camera. Automatic virus scanning via ClamAV before acceptance. Metadata extraction. Category tagging (ID, income, debt, address proof).', endpoints: ['POST /api/documents/upload — Upload (multipart)', 'GET /api/documents/:id — Get metadata', 'GET /api/documents/:id/download — Download', 'POST /api/documents/:id/scan — Trigger virus scan', 'GET /api/documents/:id/scan-status — Scan result'], dependencies: ['ClamAV (TCP port 3310)', 'Local filesystem (POC) → S3 (prod)', 'Multer (file handling)'], dataFlow: 'Upload → ClamAV scan → Clean? → Store + metadata → Available for review', mockBehaviour: 'Files named "virus" or "eicar" trigger quarantine. All others pass. Scan simulates 2s delay.', productionPath: 'S3 with server-side encryption. ClamAV as sidecar container. Azure Blob as alternative.', connectedTo: ['ClamAV', 'API Gateway', 'Application Form'] } },
  mailroom: { icon: '🖨️', name: 'Digital Mailroom', category: 'external', status: 'Live', statusColour: 'bg-green-500', brief: 'OCR/NER/AI pipeline — demonstrated in Admin Portal', detail: { description: 'Digital Mailroom processes inbound physical documents through: virus scan → OCR text extraction → Named Entity Recognition (NER) → PII redaction → intelligent routing to correct AiB system. Demonstrated in Admin Portal with simulated AI pipeline.', endpoints: ['POST /api/mailroom/scan — Submit scanned document', 'POST /api/mailroom/ocr — Extract text', 'POST /api/mailroom/classify — AI document classification', 'POST /api/mailroom/route — Route to destination system'], dependencies: ['OCR engine (Tesseract POC → Azure Document Intelligence prod)', 'NER model (spaCy POC → fine-tuned LLM prod)', 'ClamAV', 'ASTRA/BASYS for routing targets'], dataFlow: 'Physical doc → Scan → Virus check → OCR → NER (extract names, NI, amounts) → PII redaction → Classify doc type → Route to ASTRA/BASYS/eDEN', mockBehaviour: 'Admin Portal demonstrates the OCR/NER pipeline with simulated document classification and entity extraction. Confidence scores shown for each extraction.', productionPath: 'Azure Document Intelligence (Form Recognizer) for OCR. Custom NER model. Confidence threshold: low confidence → human review queue.', connectedTo: ['BASYS', 'ASTRA', 'eDEN', 'ClamAV'] } },
  duplicatecheck: { icon: '👤', name: 'Duplicate Debtor Check', category: 'external', status: 'Live', statusColour: 'bg-green-500', brief: 'Cross-system search across all 7 AiB systems', detail: { description: 'Searches ALL AiB systems simultaneously for existing records matching the applicant. Uses name + DOB + NI number + postcode. Fuzzy matching for partial matches. Flags potential duplicates before application proceeds.', endpoints: ['POST /api/integrations/check-all — Parallel search all systems', 'POST /api/integrations/check/:system — Check specific system', 'GET /api/integrations/health — All system status'], dependencies: ['BASYS', 'eDEN/DASH', 'DAS', 'CFT', 'Moratorium', 'RoI', 'Integration Orchestrator'], dataFlow: 'Debtor details → Parallel queries to 6 systems → Aggregate results → Flag matches → Show in cross-system search panel', mockBehaviour: 'NI ending "A" or surname "SMITH" triggers BASYS match. Surname "M*" triggers eDEN match. Postcode "EH*" triggers Moratorium match.', productionPath: 'Real API connections to each system. Circuit breaker per system. 15s total timeout. Results cached per application.', connectedTo: ['BASYS', 'eDEN', 'DAS', 'CFT', 'Moratorium', 'RoI'] } },

  // AiB Systems
  basys: { icon: '⚖️', name: 'BASYS', category: 'aib', status: 'Mock', statusColour: 'bg-gray-500', brief: 'Bankruptcy/Sequestration case management', detail: { description: 'Bankruptcy Administration System. Manages sequestration cases, MAP (Minimal Asset Process), trust deeds. Stores case history, trustee assignments, discharge dates.', endpoints: ['POST /api/basys/lookup — Debtor lookup', 'GET /api/basys/case/:id — Case details'], dataFlow: 'IAAS checks for existing cases before recommendation. If found → signposting advice instead of new application.', mockBehaviour: 'NI ending "A" or surname "SMITH" returns a found discharged sequestration case (SEQ-2019-004521).', productionPath: 'Secure API to BASYS. mTLS + API key. VPN/PrivateLink to AiB network.', connectedTo: ['Integration Orchestrator', 'Keycloak', 'Duplicate Check'] } },
  astra: { icon: '📊', name: 'ASTRA', category: 'aib', status: 'Mock', statusColour: 'bg-gray-500', brief: 'AiB Strategy & Administration', detail: { description: 'Central administration system for AiB operations. Case routing destination for new applications post-recommendation.', mockBehaviour: 'Not directly queried in POC. Would receive routed applications in production.', productionPath: 'API integration for case creation post-recommendation acceptance.', connectedTo: ['Keycloak', 'Digital Mailroom'] } },
  eden: { icon: '💳', name: 'eDEN/DASH', category: 'aib', status: 'Mock', statusColour: 'bg-gray-500', brief: 'DAS electronic system + payment distribution', detail: { description: 'Manages Debt Arrangement Scheme applications and the DASH payment distribution portal. Existing ScotAccount integration.', endpoints: ['POST /api/eden/lookup — DAS arrangement lookup', 'GET /api/eden/arrangement/:id — Arrangement details'], mockBehaviour: 'Surname starting "M" returns active DAS arrangement (DAS-ARR-2022-007834).', productionPath: 'OAuth 2.0 client credentials. eDEN API or message queue integration.', connectedTo: ['Integration Orchestrator', 'Keycloak', 'ScotAccount'] } },
  das: { icon: '📋', name: 'DAS', category: 'aib', status: 'Mock', statusColour: 'bg-gray-500', brief: 'Debt Payment Programme management', detail: { description: 'Manages Debt Payment Programmes under the Debt Arrangement Scheme. Checks for existing applications or active programmes.', endpoints: ['POST /api/das/lookup — Check for existing DPP', 'GET /api/das/programme/:id — Programme details'], mockBehaviour: 'Total debt £5k-£20k triggers found existing application.', productionPath: 'DAS programme management API.', connectedTo: ['Integration Orchestrator', 'Keycloak'] } },
  cft: { icon: '🏛️', name: 'CFT', category: 'aib', status: 'Mock', statusColour: 'bg-gray-500', brief: 'Creditor/Trustee/Provider facing', detail: { description: 'Reference data service for registered providers, trustees, and creditor information. Always returns provider list.', endpoints: ['POST /api/cft/lookup — Provider lookup', 'GET /api/cft/provider/:id — Provider details'], mockBehaviour: 'Always returns 3 registered providers/trustees.', productionPath: 'CFT reference data service API.', connectedTo: ['Integration Orchestrator', 'Keycloak'] } },
  moratorium: { icon: '⏸️', name: 'Moratorium', category: 'aib', status: 'Mock', statusColour: 'bg-gray-500', brief: 'Moratorium registration (6-week breathing space)', detail: { description: 'Checks and registers moratoriums (6-week breathing space from creditor action). Active moratorium changes recommendation.', endpoints: ['POST /api/moratorium/check — Check for active moratorium', 'POST /api/moratorium/register — Register new moratorium'], mockBehaviour: 'Postcode starting "EH" triggers active moratorium.', productionPath: 'Moratorium register API with real-time checks.', connectedTo: ['Integration Orchestrator', 'Keycloak', 'Recommendation Engine'] } },
  roi: { icon: '📖', name: 'RoI', category: 'aib', status: 'Mock', statusColour: 'bg-gray-500', brief: 'Register of Insolvencies (public register)', detail: { description: 'Public Register of Insolvencies. Searchable by name/date. Contains all sequestration, trust deed, and MAP entries.', endpoints: ['POST /api/roi/search — Search register', 'GET /api/roi/entry/:id — Register entry details'], mockBehaviour: 'Surname containing "TEST" returns a discharged register entry.', productionPath: 'RoI public search API (may be partially open already).', connectedTo: ['Integration Orchestrator', 'Keycloak'] } },

  // Shared Services
  recommendation: { icon: '🎯', name: 'Product Recommendation', category: 'shared', status: 'Live', statusColour: 'bg-green-500', brief: 'Rules-based + AI-assisted (7 products)', detail: { description: 'Recommends the most suitable Scottish debt solution based on financial circumstances. Rules engine covers: DAS, MAP, PTD, Sequestration, DPP, Moratorium, Signposting. AI explanation layer provides natural-language reasoning.', endpoints: ['POST /api/recommend — Get recommendation', 'POST /api/recommend/explain — AI explanation'], dataFlow: 'Total debt + income + expenditure + assets + existing cases → Rules engine → Product + confidence + reasoning + alternatives', mockBehaviour: 'Fully implemented rules engine with 7 product paths. AI explanations are pre-written templates per product.', productionPath: 'ML model trained on historical outcomes. A/B testing rules vs ML. Human override capability.', connectedTo: ['API Gateway', 'Application Form'] } },
  notifications: { icon: '🔔', name: 'Notifications', category: 'shared', status: 'Live', statusColour: 'bg-green-500', brief: 'Email, SMS, in-app, push', detail: { description: 'Multi-channel notification service. Sends in-app notifications, email placeholders, SMS placeholders. Supports bulk send for creditor notifications.', endpoints: ['POST /api/notifications/send — Send notification', 'POST /api/notifications/send-bulk — Bulk send', 'GET /api/notifications/user/:id — User inbox', 'PATCH /api/notifications/:id/read — Mark read'], productionPath: 'GOV.UK Notify for email/SMS. Firebase for push. In-app via WebSocket.', connectedTo: ['API Gateway', 'All services'] } },
  audit: { icon: '📝', name: 'Audit Service', category: 'shared', status: 'Live', statusColour: 'bg-green-500', brief: 'Immutable event trail, correlation IDs', detail: { description: 'Records every action across all services. Immutable append-only log. Correlation ID tracks requests end-to-end. Supports compliance and data governance requirements.', endpoints: ['POST /api/audit/events — Record event', 'GET /api/audit/events/:appId — Application trail', 'GET /api/audit/events — Search/filter'], dataFlow: 'Every API call → Audit event written → Queryable by application, user, action, time', productionPath: 'Azure Table Storage or dedicated audit DB. Log integrity verification. Retention per DPA policy.', connectedTo: ['All services'] } },
  organisation: { icon: '🏢', name: 'Organisation Service', category: 'shared', status: 'Live', statusColour: 'bg-green-500', brief: 'Parent/child hierarchy, 19 orgs', detail: { description: 'Manages organisational structure: AiB internal teams, money adviser firms (CAS, StepChange), creditors (banks, councils), trustees, payment distributors. Supports parent/child relationships (CAS → Edinburgh Bureau → Glasgow Bureau).', endpoints: ['GET /api/organisations — List/filter orgs', 'GET /api/organisations/:id — Org + children', 'GET /api/organisations/:id/hierarchy — Tree view', 'POST /api/organisations/:id/relationships — Link orgs'], productionPath: 'PostgreSQL with recursive CTE for hierarchy queries. Keycloak Group sync.', connectedTo: ['User Service', 'Keycloak', 'Admin Portal'] } },
  users: { icon: '👥', name: 'User Service', category: 'shared', status: 'Live', statusColour: 'bg-green-500', brief: '500 users, 10 roles, 20 permissions', detail: { description: 'Full RBAC system: 500 users across 10 role levels (L10 Debtor → L100 System Admin). 20 granular permissions. Role-permission matrix. Session management. Org membership.', endpoints: ['POST /api/auth/login — Authenticate', 'GET /api/auth/me — Current user context', 'GET /api/users — List (paginated, filterable)', 'GET /api/roles — Role list with permission counts', 'GET /api/roles/matrix/full — Full permission matrix'], dataFlow: 'Login → JWT with role + permissions → Every API call checks permissions → 403 if insufficient', productionPath: 'Keycloak manages auth. User Service retains business logic (permissions, org queries). Sync via Keycloak events.', connectedTo: ['Keycloak', 'Organisation Service', 'API Gateway'] } },
  database: { icon: '🗄️', name: '@aib-iaas/database', category: 'shared', status: 'Live', statusColour: 'bg-green-500', brief: 'Repository pattern — PostgreSQL / SQLite', detail: { description: 'Shared persistence layer using the repository pattern. Provides ApplicationRepository, AuditRepository, UserRepository, and more. Abstracts database access so services work identically with SQLite (local dev) or PostgreSQL (Docker/production).', endpoints: ['ApplicationRepository.create()', 'ApplicationRepository.findById()', 'AuditRepository.append()', 'UserRepository.findByEmail()'], dependencies: ['better-sqlite3 (local)', 'pg (PostgreSQL)', 'DATABASE_PATH env var'], dataFlow: 'Service → Repository → Connection adapter → SQLite or PostgreSQL', mockBehaviour: 'Set DATABASE_PATH=:memory: for ephemeral in-memory testing in CI. Seed with npx tsx packages/database/src/seed.ts.', productionPath: 'PostgreSQL 15 on AWS RDS. Connection pooling via PgBouncer. Same repository interfaces.', connectedTo: ['API Gateway', 'Audit Service', 'User Service', 'All services'] } },
  integrationContracts: { icon: '🔌', name: '@aib-iaas/integration-contracts', category: 'shared', status: 'Live', statusColour: 'bg-green-500', brief: 'Factory pattern — mock↔live integrations', detail: { description: 'Integration abstraction layer using the factory pattern. createBasysClient(), createEdenClient(), etc. return mock or live implementations based on INTEGRATION_MODE environment variable. Enables seamless transition from POC mocks to production APIs.', endpoints: ['createBasysClient() — BASYS integration factory', 'createEdenClient() — eDEN integration factory', 'createDasClient() — DAS integration factory', 'createCftClient() — CFT integration factory'], dependencies: ['INTEGRATION_MODE env var (mock | live)', 'Mock Integrations service (port 3005)', 'Real API credentials (production)'], dataFlow: 'Service → Factory function → INTEGRATION_MODE check → Mock client (returns synthetic data) or Live client (calls real API)', mockBehaviour: 'INTEGRATION_MODE=mock (default). All factories return mock clients with configurable latency and failure rates.', productionPath: 'Set INTEGRATION_MODE=live. Factories return clients configured with real API credentials from Secrets Manager. mTLS for secure communication.', connectedTo: ['Integration Orchestrator', 'Mock Integrations', 'BASYS', 'eDEN', 'DAS', 'CFT'] } },
};

const CATEGORIES = [
  { id: 'channel', label: '📡 User Channels', tiles: ['web', 'mobile', 'admin'] },
  { id: 'identity', label: '🔐 Identity (Keycloak SSO)', tiles: ['keycloak'] },
  { id: 'gateway', label: '🌐 API Gateway', tiles: ['gateway'] },
  { id: 'external', label: '🔌 External Service Integrations', tiles: ['creditcheck', 'payments', 'postcode', 'documents', 'mailroom', 'duplicatecheck'] },
  { id: 'aib', label: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 AiB Core Systems (SSO-Connected)', tiles: ['basys', 'astra', 'eden', 'das', 'cft', 'moratorium', 'roi'] },
  { id: 'shared', label: '⚙️ Shared Platform Services & Packages', tiles: ['recommendation', 'notifications', 'audit', 'organisation', 'users', 'database', 'integrationContracts'] },
];

// The twelve logical services, in port order. Rendered as a name/port grid rather
// than a bullet list — two services per bullet made the ports hard to scan, which
// is the one thing a presenter actually reads off this panel.
const LOGICAL_SERVICES: { name: string; port: number }[] = [
  { name: 'api-gateway', port: 3001 },
  { name: 'recommendation-service', port: 3002 },
  { name: 'document-service', port: 3003 },
  { name: 'integration-orchestrator', port: 3004 },
  { name: 'mock-integrations', port: 3005 },
  { name: 'payment-service', port: 3006 },
  { name: 'audit-service', port: 3007 },
  { name: 'credit-check-service', port: 3008 },
  { name: 'organisation-service', port: 3009 },
  { name: 'user-service', port: 3011 },
  { name: 'notification-service', port: 3012 },
  { name: 'identity-service', port: 3013 },
];

// C4 levels — mirrors docs/architecture.md §2 (Context), §3 (Container), §4 (Component).
// Presented as expandable tiles rather than rendered Mermaid so the page stays a
// static export with no diagram runtime, and so the presenter can open exactly
// one level at a time instead of scrolling past three large SVGs.
const C4_LEVELS: { id: string; level: string; icon: string; title: string; scope: string; docRef: string; summary: string; groups: { heading: string; items: string[] }[] }[] = [
  {
    id: 'c4-context',
    level: 'Level 1',
    icon: '🌍',
    title: 'System Context',
    scope: '4 actor types · 11 external systems',
    docRef: 'docs/architecture.md §2',
    summary: 'IAAS as a single box, and everyone it talks to. This is the diagram for the "who uses it and what does it depend on" conversation — no internal detail at all.',
    groups: [
      { heading: 'Actors (People)', items: ['Citizens / Debtors — apply for statutory debt solutions', 'Money Advisers — approved professionals applying on a debtor\'s behalf', 'AiB Staff — review, process and approve applications', 'Creditors / Trustees — receive notifications and dividend information'] },
      { heading: 'AiB Systems (REST / mTLS)', items: ['BASYS — sequestration case records', 'ASTRA — internal case management, receives submitted applications', 'eDEN / DASH — DAS electronic system + payment distribution', 'DAS Register — Debt Arrangement Scheme programmes', 'CFT — creditor, trustee and provider registry', 'RoI — public Register of Insolvencies', 'Moratorium Register — 6-week breathing space registrations'] },
      { heading: 'Third-Party Systems', items: ['ScotAccount — Scottish Government SSO (SAML 2.0)', 'GOV.UK One Login — identity verification (OpenID Connect)', 'Experian / Equifax — credit reference agencies (REST, API key + mTLS)', 'Payment Provider — card / Apple Pay / Google Pay (PCI-DSS REST)'] },
    ],
  },
  {
    id: 'c4-container',
    level: 'Level 2',
    icon: '📦',
    title: 'Containers',
    scope: '2 frontends · 12 services · 3 databases · 1 object store',
    docRef: 'docs/architecture.md §3',
    summary: 'The logical decomposition — every independently deployable unit and the port it owns. Note this is the LOGICAL view; see "Logical vs Physical" below for what actually runs in the POC.',
    groups: [
      { heading: 'Frontend Containers (Next.js 15, React 19, Tailwind)', items: ['Web Portal — port 3000 — public multi-step application journey', 'Admin Portal — port 3010 — AiB staff case review, decisions, reporting'] },
      { heading: 'BFF Layer', items: ['API Gateway — port 3001 — auth, RBAC, rate limiting, routing, response aggregation'] },
      { heading: 'Domain Services (Express.js / TypeScript)', items: ['Recommendation Service — 3002 — rules engine with confidence scoring', 'Document Service — 3003 — upload, ClamAV scanning, storage lifecycle', 'Integration Orchestrator — 3004 — parallel fan-out via Promise.allSettled', 'Mock Integrations — 3005 — simulates all 6 AiB systems, configurable latency/failure', 'Payment Service — 3006 — initiation, status, refunds', 'Audit Service — 3007 — immutable append-only event log', 'Credit Check Service — 3008 — CRA interface + consent management', 'Organisation Service — 3009 — hierarchy, parent-child, provider registration', 'User Service — 3011 — auth, sessions, 10-role RBAC / 20 permissions', 'Notification Service — 3012 — email, SMS, in-app delivery', 'Identity Service — 3013 — ScotAccount / GOV.UK federation, MFA enforcement'] },
      { heading: 'Data Containers', items: ['Application DB — SQLite (POC) / PostgreSQL 15 (prod) — applications, debtors, financials', 'Audit DB — SQLite / PostgreSQL 15 — immutable append-only event log', 'User DB — SQLite / PostgreSQL 15 — users, roles, permissions, sessions, orgs', 'Document Storage — local filesystem (POC) / S3 SSE-KMS (prod)'] },
    ],
  },
  {
    id: 'c4-component',
    level: 'Level 3',
    icon: '🔧',
    title: 'Components — API Gateway',
    scope: 'Middleware pipeline · authz layer · route handlers',
    docRef: 'docs/architecture.md §4',
    summary: 'Inside the most architecturally significant container. The middleware order is deliberate and load-bearing: security headers before anything parses a body, request ID before anything logs.',
    groups: [
      { heading: 'Security Middleware Pipeline (ordered)', items: ['1. Helmet — CSP, HSTS, X-Frame-Options, X-Content-Type-Options', '2. CORS — configurable origin allowlist; GET/POST/PUT/DELETE/PATCH', '3. Rate Limiter — per-IP, 15-minute window, RATE_LIMITED error code', '4. Body Parser — JSON, 10MB limit, rejects oversized payloads', '5. Request ID — X-Request-Id, UUID v4 if absent, propagated downstream'] },
      { heading: 'Authentication & Authorisation', items: ['authenticate() — Bearer token, base64 decode (POC) / JWT signature (prod), expiry check', 'requirePermission(...codes) — AND logic, all codes required', 'requireAnyPermission(...codes) — OR logic, at least one code', 'requireRoleLevel(min) — numeric hierarchy, L10 Debtor → L100 System Admin', 'optionalAuth() — attaches user if present, continues if not'] },
      { heading: 'Route Handlers', items: ['/api/auth — login, /me, logout, check-permission', '/api/applications — create, get, update, submit, staff status change', '/api/reports — authenticate + reports.read; summary KPIs, filtered list', '/api/reports/export — CSV and PDF export', '/api/postcode — address lookup (OS Places in production)', '/api/health — status, service, timestamp'] },
      { heading: 'Error Handling', items: ['errorHandler() — centralised; generic message in production, full detail in development', 'Standard shape: { success, error: { code, message } }'] },
    ],
  },
];

export default function ArchitecturePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [c4Level, setC4Level] = useState<string | null>(null);
  const tile = selected ? TILES[selected] : null;
  const c4 = c4Level ? C4_LEVELS.find(l => l.id === c4Level) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Interactive Architecture</h1>
      <p className="text-gray-600 mb-2">AiB Applications Gateway — 12 logical services, deployed as 1 container for £0/month. Click any component to drill down.</p>
      <p className="text-xs text-gray-400 mb-4">🟢 Live | 🟡 Sandbox | 🟣 Design | ⚫ Mock</p>

      {/* Live API Links */}
      <div className="flex flex-wrap gap-3 mb-6">
        <a
          href="https://iaas-api.onrender.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg text-sm font-medium text-green-800 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/40 no-underline min-h-0"
        >
          <span>🔗</span> Live API: iaas-api.onrender.com
        </a>
        <Link
          href="/api-docs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg text-sm font-medium text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/40 no-underline min-h-0"
        >
          <span>📖</span> API Documentation &rarr;
        </Link>
      </div>

      {/* C4 Model Levels — click a level to expand it */}
      <div data-demo="c4-levels" className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-bold mb-1">🗺️ C4 Model — Zoom Levels</h2>
        <p className="text-xs text-gray-500 mb-3">Three levels of the same architecture at increasing detail. Click a level to expand. Full Mermaid source in <span className="font-mono">docs/architecture.md</span> §2&ndash;§4.</p>

        <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
          {C4_LEVELS.map(l => (
            <button key={l.id} onClick={() => setC4Level(c4Level === l.id ? null : l.id)}
              className={`p-3 rounded border-2 text-left transition-all ${c4Level === l.id ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-300' : 'border-gray-200 bg-white hover:border-purple-400 hover:shadow-sm'}`}>
              <div className="flex items-start justify-between">
                <span className="text-xl">{l.icon}</span>
                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">{l.level}</span>
              </div>
              <p className="font-bold text-sm mt-1">{l.title}</p>
              <p className="text-xs text-gray-500 leading-tight">{l.scope}</p>
            </button>
          ))}
        </div>

        {c4 && (
          <div className="mt-3 bg-white border-2 border-purple-600 rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">{c4.icon} C4 {c4.level} — {c4.title}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{c4.docRef}</p>
              </div>
              <button onClick={() => setC4Level(null)} className="bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900">✕</button>
            </div>

            <p className="text-sm text-gray-700 mb-4">{c4.summary}</p>

            <div className="grid md:grid-cols-2 gap-4">
              {c4.groups.map(g => (
                <div key={g.heading}>
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">{g.heading}</h4>
                  <ul className="text-xs space-y-0.5 bg-gray-50 p-2 rounded">{g.items.map((it, i) => <li key={i}>• {it}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Logical vs Physical — the "why is it one container?" answer */}
      <div data-demo="logical-vs-physical" className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-bold mb-1">🧩 Logical Services vs Physical Deployment</h2>
        <p className="text-xs text-gray-500 mb-3">The microservice decomposition and the deployment topology are deliberately different things. Both numbers below are correct — they count different things.</p>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="p-4 bg-white border border-gray-200 border-t-4 border-t-blue-600 rounded-lg shadow-sm">
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <h3 className="font-bold text-sm text-gray-900">Logical decomposition</h3>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 whitespace-nowrap">12 services</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">Twelve bounded contexts, each with its own Express app, own port, own tests, own <span className="font-mono text-gray-800">package.json</span>. Run them all independently with <span className="font-mono text-gray-800">npm run dev:services</span> — that script starts exactly these twelve.</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              {LOGICAL_SERVICES.map(s => (
                <li key={s.name} className="flex items-baseline justify-between gap-2 border-b border-gray-100 pb-1">
                  <span className="font-mono text-xs text-gray-800 truncate">{s.name}</span>
                  <span className="font-mono text-[11px] text-gray-500 tabular-nums">{s.port}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-white border border-gray-200 border-t-4 border-t-amber-500 rounded-lg shadow-sm">
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <h3 className="font-bold text-sm text-gray-900">Physical deployment</h3>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 whitespace-nowrap">1 container</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">The deployed POC runs <strong className="text-gray-900">one</strong> Render web service, <span className="font-mono text-gray-800">iaas-api</span>. <span className="font-mono text-gray-800">services/consolidated-api</span> imports the route modules from all twelve services and mounts them into a single Express app on port 3001. No business logic lives there — it is deployment wiring only, which is why it is excluded from coverage in <span className="font-mono text-gray-800">vitest.config.ts</span>.</p>
            <dl className="space-y-1">
              {[
                { k: 'Service', v: <><span className="font-mono">iaas-api</span> — Node, Docker, free plan, Frankfurt</> },
                { k: 'Disk', v: <>1GB persistent, mounted at <span className="font-mono">/data</span></> },
                { k: 'Health', v: <span className="font-mono">/api/health</span> },
                { k: 'Directories', v: <>14 in <span className="font-mono">services/</span> = 12 logical + consolidated-api + dotnet-api</> },
              ].map(row => (
                <div key={row.k} className="flex items-baseline gap-2 text-xs border-b border-gray-100 pb-1">
                  <dt className="text-gray-500 w-20 flex-shrink-0">{row.k}</dt>
                  <dd className="text-gray-800 min-w-0">{row.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-3 grid md:grid-cols-3 gap-3">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-bold text-sm mb-1.5 text-gray-900">Why consolidate for the POC?</h3>
            <p className="text-xs text-gray-600 leading-relaxed">Render&apos;s free plan gives one 512MB instance per service and spins it down after 15 minutes idle. Twelve separate free services would mean twelve independent cold starts — a demo where the first click on each feature stalls for ~50 seconds. One container = one cold start, and £0 instead of 12 &times; £7/mo for always-on.</p>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-bold text-sm mb-1.5 text-gray-900">Why it is not a rewrite</h3>
            <p className="text-xs text-gray-600 leading-relaxed">Each service exports its routers; <span className="font-mono">consolidated-api</span> only calls <span className="font-mono">app.use()</span> on them. Splitting back out is deleting that one file and pointing the gateway at service URLs instead of local mounts. The service boundaries, RBAC, orchestration and audit trail are all real and independently tested.</p>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-bold text-sm mb-1.5 text-gray-900">What production does instead</h3>
            <p className="text-xs text-gray-600 leading-relaxed">One ECS Fargate service per logical service — 2&times; tasks each (3&times; for the API Gateway), 512MB&ndash;1GB per task, across two availability zones behind an ALB. Independent scaling and independent blast radius, which is the whole point of the decomposition.</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3"><strong>Also in <span className="font-mono">services/</span>:</strong> <span className="font-mono">dotnet-api</span> is an alternative implementation of the same API surface in .NET 9 (MediatR + CQS, full endpoint parity), deployed alongside as <span className="font-mono">iaas-dotnet-api</span>. It exists to de-risk the migration to AiB&apos;s primary backend stack — the same frontend can point at either backend by changing <span className="font-mono">NEXT_PUBLIC_API_URL</span>. It is not a 13th logical service.</p>
      </div>

      {/* Tile Grid by Category */}
      {CATEGORIES.map(cat => (
        <div key={cat.id} className="mb-6">
          <h2 className="text-sm font-bold text-gray-700 mb-2">{cat.label}</h2>
          <div className={`grid gap-2 ${cat.tiles.length === 1 ? 'grid-cols-1' : cat.tiles.length <= 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
            {cat.tiles.map(id => {
              const t = TILES[id];
              if (!t) return null;
              return (
                <button key={id} onClick={() => setSelected(selected === id ? null : id)}
                  className={`p-3 rounded border-2 text-left transition-all ${selected === id ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-300' : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-sm'}`}>
                  <div className="flex items-start justify-between">
                    <span className="text-xl">{t.icon}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${t.statusColour}`} title={t.status}></span>
                  </div>
                  <p className="font-bold text-sm mt-1">{t.name}</p>
                  <p className="text-xs text-gray-500 leading-tight">{t.brief}</p>
                </button>
              );
            })}
          </div>

          {/* Inline Detail Panel — renders directly below this category if a tile in it is selected */}
          {selected && cat.tiles.includes(selected) && tile && (
            <div className="mt-3 bg-white border-2 border-blue-600 rounded-lg shadow-lg animate-in">
              <div className="p-4 md:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">{tile.icon} {tile.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold text-white ${tile.statusColour}`}>{tile.status}</span>
                  </div>
                  <button onClick={() => setSelected(null)} className="bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900">✕</button>
                </div>

                <p className="text-sm text-gray-700 mb-4">{tile.detail.description}</p>

                <div className="grid md:grid-cols-2 gap-4">
                  {tile.detail.endpoints && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">API Endpoints</h4>
                      <ul className="text-xs space-y-0.5 font-mono bg-gray-50 p-2 rounded">
                        {tile.detail.endpoints.map((ep, i) => <li key={i}>{ep}</li>)}
                      </ul>
                    </div>
                  )}
                  {tile.detail.dependencies && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Dependencies</h4>
                      <ul className="text-xs space-y-0.5">{tile.detail.dependencies.map((d, i) => <li key={i}>• {d}</li>)}</ul>
                    </div>
                  )}
                  {tile.detail.dataFlow && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Data Flow</h4>
                      <p className="text-xs bg-blue-50 p-2 rounded">{tile.detail.dataFlow}</p>
                    </div>
                  )}
                  {tile.detail.mockBehaviour && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">POC Mock Behaviour</h4>
                      <p className="text-xs bg-amber-50 p-2 rounded">{tile.detail.mockBehaviour}</p>
                    </div>
                  )}
                  {tile.detail.productionPath && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Production Path</h4>
                      <p className="text-xs bg-green-50 p-2 rounded">{tile.detail.productionPath}</p>
                    </div>
                  )}
                  {tile.detail.connectedTo && (
                    <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Connected To</h4>
                  <div className="flex flex-wrap gap-1">{tile.detail.connectedTo.map((c, i) => <span key={i} className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">{c}</span>)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
          )}
        </div>
      ))}

      {/* £0/month cost story — the honest version, limitations included */}
      <div data-demo="cost-story" className="mt-8 bg-white border border-gray-200 rounded-lg p-4 md:p-6">
        <h2 className="text-lg font-bold mb-1">💰 How This Runs for £0/month</h2>
        <p className="text-xs text-gray-500 mb-4">Everything demonstrated today runs on free tiers. The limitations are real and stated below — this is a demonstration and user-research platform, not a production deployment. Figures from <span className="font-mono">docs/cost-model.md</span>.</p>

        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <h3 className="font-bold text-sm mb-1">🌐 Frontend — GitHub Pages (£0)</h3>
            <p className="text-xs text-gray-700">Next.js static export (<span className="font-mono">NEXT_OUTPUT=export</span>) built by GitHub Actions and published to the <span className="font-mono">gh-pages</span> branch. Unlimited bandwidth, global CDN, free TLS.</p>
            <p className="text-xs text-gray-600 mt-1"><strong>Limitation:</strong> static only — no SSR, no server-side secrets. Every dynamic feature calls the API from the browser.</p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded">
            <h3 className="font-bold text-sm mb-1">⚙️ Backend — Render free tier (£0)</h3>
            <p className="text-xs text-gray-700">One Docker web service, <span className="font-mono">iaas-api</span>, 512MB RAM, Frankfurt, with a 1GB persistent disk at <span className="font-mono">/data</span> for the SQLite database.</p>
            <p className="text-xs text-gray-600 mt-1"><strong>Limitation — and you may see it live:</strong> the instance spins down after 15 minutes idle and cold-starts on the next request. The status bar at the top of this page shows &ldquo;backend waking up&hellip;&rdquo; while that happens, then flips to Connected with a real response time.</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-bold text-sm mb-1">🗄️ Database — SQLite / Neon free (£0)</h3>
            <p className="text-xs text-gray-700">SQLite on the Render persistent disk today. The next tier up is Neon&apos;s managed PostgreSQL free tier (0.5GB, autoscaling compute) — a connection-string change, because the repository pattern in <span className="font-mono">@aib-iaas/database</span> abstracts both.</p>
            <p className="text-xs text-gray-600 mt-1"><strong>Limitation:</strong> single writer, no replication, no point-in-time recovery.</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 mb-3">Also free at this scale: <strong>GitHub Actions</strong> CI/CD (2,000 minutes/month), <strong>GOV.UK Notify</strong> (free for all government services at every volume — a genuine public-sector cost advantage), and <strong>Keycloak</strong> in local Docker Compose.</p>

        <h3 className="font-bold text-sm mb-2">Indicative production cost at scale</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-gray-200">
            <thead className="bg-gray-50"><tr>
              <th className="text-left p-2 border-b">Component</th>
              <th className="text-left p-2 border-b">POC (today)</th>
              <th className="text-left p-2 border-b">100 users</th>
              <th className="text-left p-2 border-b">1,000 users</th>
              <th className="text-left p-2 border-b">10,000 users</th>
            </tr></thead>
            <tbody>
              {[
                ['Frontend hosting', '£0 — GitHub Pages', '£0 — GitHub Pages', '£20/mo — Vercel Pro', '£50/mo — CloudFront'],
                ['Backend API', '£0 — Render Free', '£7/mo — Render Starter', '£25/mo — Render Standard', '£100/mo — AWS ECS Fargate'],
                ['Database', '£0 — SQLite', '£0 — Neon Free', '£19/mo — Neon Launch', '£69/mo — AWS RDS (db.t3.medium, Multi-AZ)'],
                ['Identity (Keycloak)', '£0 — Docker local', '£0 — Phase Two Free', '£25/mo — Phase Two', '£100/mo — self-hosted HA'],
                ['Document storage', '£0 — local FS', '£0 — Cloudflare R2 Free', '£5/mo — R2', '£20/mo — AWS S3'],
                ['Monitoring', '£0 — manual', '£0 — UptimeRobot Free', '£30/mo — Datadog', '£100/mo — Datadog full suite'],
                ['Email/SMS (GOV.UK Notify)', '£0 — mock', '£0 — free tier', '£0 — free tier', '£0 — free tier'],
              ].map(([component, poc, u100, u1k, u10k]) => (
                <tr key={component} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-2 font-bold">{component}</td>
                  <td className="p-2 bg-green-50">{poc}</td>
                  <td className="p-2">{u100}</td>
                  <td className="p-2">{u1k}</td>
                  <td className="p-2">{u10k}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td className="p-2">TOTAL</td>
                <td className="p-2 text-green-700">£0/mo</td>
                <td className="p-2">£7/mo</td>
                <td className="p-2">£124/mo</td>
                <td className="p-2">£439/mo</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            <h3 className="font-bold text-sm mb-1">📉 With commitment discounts</h3>
            <p className="text-xs text-gray-700">AWS Reserved Instances (1yr) save 30&ndash;40% on RDS and ECS; Savings Plans (3yr) save 50&ndash;60% on Fargate compute. Applied at the 10,000-user tier this takes £439/mo down to roughly <strong>£310/mo</strong> &mdash; about <strong>£0.53 per user per year</strong> before discounts.</p>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            <h3 className="font-bold text-sm mb-1">⚖️ Versus commercial platforms (1,000 users)</h3>
            <p className="text-xs text-gray-700">IAAS custom build <strong>£124/mo</strong> vs Microsoft Dynamics 365 £3,000+/mo, Salesforce Government Cloud £5,000+/mo, ServiceNow £8,000+/mo &mdash; all per-seat licensed. A 25&ndash;65&times; difference, with full control of the user experience.</p>
          </div>
        </div>
      </div>

      {/* Enterprise Production Stack */}
      <div data-demo="production-stack" className="mt-8 bg-white border border-gray-200 rounded-lg p-4 md:p-6">
        <h2 className="text-lg font-bold mb-2">🏢 Enterprise Production Stack (Target)</h2>
        <p className="text-xs text-gray-500 mb-4">The POC uses a lightweight stack for rapid delivery. Production would use the enterprise stack below, aligned with AiB/Scottish Government standards. AiB operates within the Scottish Government AWS environment, region <span className="font-mono">eu-west-2</span> (London) &mdash; all citizen data stays in UK jurisdiction.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 border-b">Layer</th>
                <th className="text-left p-3 border-b">POC (This Demo)</th>
                <th className="text-left p-3 border-b">Enterprise Production</th>
                <th className="text-left p-3 border-b">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Frontend', 'Next.js 15 / React 19', 'React 18 SPA\n(TypeScript, Vite or Next.js)', 'React SPA with TypeScript. Component library for consistency. Mobile-first responsive.'],
                ['Backend API', 'Node.js / Express / TypeScript\n(12 services, 1 container)', '.NET 8 Minimal APIs\n(C# / ASP.NET Core)', '.NET is AiB\'s primary backend stack. Minimal APIs for microservices. REST + OpenAPI. services/dotnet-api already proves endpoint parity on .NET 9.'],
                ['Compute topology', '1 Render web service\n(consolidated-api)', 'ECS Fargate: 1 service per\nlogical service, 2x tasks each\n(API Gateway 3x), 512MB–1GB', 'Per-service scaling and independent blast radius. Tasks spread across 2 AZs (10.0.10.0/24, 10.0.11.0/24) behind an ALB with TLS 1.3.'],
                ['API Gateway', 'Express middleware (custom)', 'AWS API Gateway\n+ .NET Ocelot (internal)', 'AWS API Gateway for public endpoints, rate limiting, WAF. Ocelot for service mesh routing.'],
                ['Database', 'SQLite on Render disk (POC)\nPostgreSQL 15 (Docker)\nvia @aib-iaas/database', 'AWS RDS PostgreSQL 15\nMulti-AZ, db.r6g.large\nKMS-encrypted at rest', 'Graviton instance class for price/performance. Multi-AZ standby in a separate data subnet for automatic failover. Automated backups. POC repository pattern makes this a connection-string change.'],
                ['Identity', 'Keycloak 25.0 (Docker Compose)\n10 users, 10 roles, MFA', 'Keycloak 25 on ECS Fargate\n2x tasks, 1GB (HA)\nCognito as alternative', 'Keycloak for multi-realm federation — SAML to ScotAccount, OIDC to GOV.UK One Login, LDAP sync to AD. Cognito is the managed alternative if federation needs narrow.'],
                ['Hosting (Frontend)', 'GitHub Pages (static export)', 'AWS S3 + CloudFront\n+ Route 53', 'S3 origin, CloudFront CDN with TLS termination, Route 53 DNS with health checks. Scottish Gov AWS account.'],
                ['Hosting (Backend)', 'Docker Compose (PostgreSQL +\nKeycloak + ClamAV + services)', 'AWS ECS Fargate\n(EKS at larger scale)', 'ECS Fargate for serverless containers — no node management. Private app subnets, NAT Gateway for egress. Both in Scottish Gov AWS.'],
                ['Networking', 'localhost / Docker bridge', 'VPC 10.0.0.0/16, eu-west-2\n2 AZs x public/app/data subnets\nVPC endpoints, Site-to-Site VPN', 'Three subnet tiers so nothing in the data tier is internet-reachable. VPC endpoints keep S3/Secrets Manager/CloudWatch/ECR traffic off the internet. VPN or Direct Connect to AiB internal systems.'],
                ['CI/CD', 'GitHub Actions → Vitest (582)\n→ Next.js build → GitHub Pages', 'AWS CodePipeline + CodeDeploy\n(blue/green) + GitHub Actions', 'Blue/green via CodeDeploy with health-check validation before cutover and automatic rollback. Migrations run as a pre-deployment step. CAB approval gate before production.'],
                ['IaC', 'Bicep + Terraform', 'Terraform\n(AWS provider)', 'Terraform is cloud-agnostic. Existing modules in repo target AWS. State in S3 backend.'],
                ['Testing', 'Vitest — 659 tests, 39 files\n(519 backend + 140 frontend)', 'xUnit (.NET) + Playwright\nSpecFlow (BDD) + SonarQube', 'xUnit for .NET unit tests. Playwright for E2E. SpecFlow for acceptance. SonarQube for quality gates.'],
                ['Monitoring', 'Health endpoints + /api/health\npolled from the browser', 'CloudWatch (logs 30d hot,\nS3 archive 7yr) + X-Ray\n+ CloudWatch Alarms → SNS', 'Structured JSON logs. X-Ray distributed tracing sampled at 5% normally, 100% on error. Alarms route P1/P2 to PagerDuty via SNS.'],
                ['Messaging', 'Direct HTTP (sync)', 'AWS SQS / SNS / EventBridge\n(Lambda for event processing)', 'SQS for queues, SNS for pub/sub, dead letter queues. Lambda for spiky work like PDF generation — pay per invocation rather than always-on.'],
                ['Caching', 'None', 'AWS ElastiCache Redis 7\nencrypted in transit', 'Session cache, response cache, rate-limit counters, distributed locks. Own security group, port 6379 from app tier only.'],
                ['Document Storage', 'Local filesystem\n(1GB Render disk)', 'AWS S3 (SSE-KMS)\n+ CloudFront CDN', 'Encrypted at rest with a customer-managed KMS key, versioning enabled, lifecycle policies, cross-region replication.'],
                ['Virus Scanning', 'ClamAV (Docker, TCP 3310)', 'ClamAV sidecar on ECS\n+ GuardDuty S3 malware scan', 'ClamAV sidecar in the Document Service task. GuardDuty adds threat detection across the account.'],
                ['Secrets', 'Environment variables\n(Render env vars)', 'AWS Secrets Manager + KMS\n+ IAM task roles', 'No secrets in code or images. IAM task roles for service-to-service auth — no long-lived credentials. Automatic rotation.'],
                ['Edge security', 'GitHub Pages TLS only', 'AWS WAF (OWASP Top 10)\n+ Shield, geo-blocking,\nbot detection', 'WAF in front of CloudFront with managed OWASP Top 10 rule groups, rate-based rules, and geo-blocking. Shield for DDoS.'],
              ].map(([layer, poc, prod, rationale]) => (
                <tr key={layer} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-2 font-bold text-xs">{layer}</td>
                  <td className="p-2 text-xs"><span className="bg-blue-50 px-1 rounded">{poc}</span></td>
                  <td className="p-2 text-xs font-medium whitespace-pre-line">{prod}</td>
                  <td className="p-2 text-xs text-gray-600">{rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-bold text-sm mb-1">💡 Why Node.js for the POC?</h3>
            <p className="text-xs text-gray-700">Rapid prototyping, shared TypeScript types between FE/BE, zero-cost hosting, fast iteration. Architecture patterns (RBAC, orchestration, gateway) translate directly to .NET.</p>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <h3 className="font-bold text-sm mb-1">🔄 Migration: POC → .NET on AWS</h3>
            <p className="text-xs text-gray-700">Express → .NET Minimal APIs. Zod → FluentValidation. SQLite → RDS PostgreSQL. Terraform deploys to ECS Fargate in Scottish Gov AWS. Shared types → C# records.</p>
          </div>
          <div className="p-3 bg-orange-50 border border-orange-200 rounded">
            <h3 className="font-bold text-sm mb-1">☁️ Scottish Gov AWS Environment</h3>
            <p className="text-xs text-gray-700">AiB production runs in Scottish Government AWS Cloud. All services deploy to ECS/EKS within the existing VPC. This POC&apos;s Terraform modules target AWS (eu-west-2 London).</p>
          </div>
        </div>

        {/* AWS vs Azure Comparison */}
        <div data-demo="aws-comparison" className="mt-4 bg-gray-50 border border-gray-200 rounded p-4">
          <h3 className="font-bold text-sm mb-3">☁️ Cloud Platform Comparison: AWS (AiB Production) vs Azure</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-gray-200">
              <thead className="bg-white"><tr>
                <th className="text-left p-2 border-b">Capability</th>
                <th className="text-left p-2 border-b">AWS (Scottish Gov ✓)</th>
                <th className="text-left p-2 border-b">Azure (Alternative)</th>
                <th className="text-left p-2 border-b">Recommendation</th>
              </tr></thead>
              <tbody>
                {[
                  ['Region / Data Sovereignty', 'eu-west-2 (London)', 'UK South (London)', 'AWS eu-west-2 — UK jurisdiction, no cross-border flows'],
                  ['Container Hosting', 'ECS Fargate / EKS', 'Container Apps / AKS', 'AWS ECS — already in AiB estate'],
                  ['Serverless', 'Lambda + API Gateway', 'Functions + APIM', 'AWS Lambda for event processing'],
                  ['Database', 'RDS PostgreSQL 15, Multi-AZ,\ndb.r6g.large, KMS-encrypted', 'Azure SQL / Cosmos DB', 'AWS RDS — VPC connectivity established'],
                  ['Caching', 'ElastiCache Redis 7', 'Azure Cache for Redis', 'AWS ElastiCache — same VPC, no egress cost'],
                  ['Object Storage', 'S3 (SSE-KMS) + CloudFront', 'Blob Storage + CDN', 'AWS S3 — existing document pipeline'],
                  ['DNS / Edge', 'Route 53 + CloudFront', 'Azure DNS + Front Door', 'AWS Route 53 — health-check failover'],
                  ['Identity', 'Keycloak 25 on ECS\n(Cognito as alternative)', 'Azure AD B2C', 'Keycloak on ECS — multi-provider federation'],
                  ['Messaging', 'SQS / SNS / EventBridge', 'Service Bus / Event Grid', 'AWS SQS/SNS — Scottish Gov standard'],
                  ['Secrets / Keys', 'Secrets Manager + KMS\n+ IAM task roles', 'Key Vault + Managed Identity', 'AWS Secrets Manager — existing patterns'],
                  ['Monitoring', 'CloudWatch + X-Ray', 'App Insights + Monitor', 'AWS CloudWatch — centralised logging'],
                  ['Threat Detection', 'GuardDuty', 'Microsoft Defender for Cloud', 'AWS GuardDuty — account-wide, S3 malware scan'],
                  ['CI/CD', 'CodePipeline + CodeDeploy\n(blue/green) / GitHub Actions', 'Azure DevOps', 'GitHub Actions — deploys to AWS'],
                  ['IaC', 'Terraform (AWS provider)', 'Terraform / Bicep', 'Terraform — multi-env, existing modules'],
                  ['WAF / Security', 'AWS WAF (OWASP Top 10) + Shield', 'Azure Front Door + WAF', 'AWS WAF — DDoS + OWASP protection'],
                  ['Private Connectivity', 'VPC endpoints + Site-to-Site VPN\nor Direct Connect', 'Private Link + ExpressRoute', 'AWS VPC endpoints — AiB internal systems off the internet'],
                  ['Cost Model', 'Pay-per-use, Reserved Instances\n(30–40%), Savings Plans (50–60%)', 'Pay-per-use, reserved', 'AWS — existing Scottish Gov agreement'],
                ].map(([cap, aws, azure, rec]) => (
                  <tr key={cap} className="border-b border-gray-100">
                    <td className="p-2 font-bold">{cap}</td>
                    <td className="p-2 bg-green-50 whitespace-pre-line">{aws}</td>
                    <td className="p-2">{azure}</td>
                    <td className="p-2 text-gray-600 italic">{rec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2"><strong>Note:</strong> AiB operates within the Scottish Government AWS Cloud environment, so the recommendation column is not a greenfield preference — it is what already has VPC connectivity, IAM patterns, and a commercial agreement in place. The POC deploys the static frontend to GitHub Pages and the API as one consolidated container on Render&apos;s free tier; the full 12-service stack runs locally via Docker Compose (PostgreSQL + Keycloak + ClamAV). Production deployment targets AWS <span className="font-mono">eu-west-2</span>.</p>
        </div>
      </div>
    </div>
  );
}
