'use client';

import { useState } from 'react';

// Architecture data — each tile has detail content
const TILES: Record<string, { icon: string; name: string; category: string; status: string; statusColour: string; brief: string; detail: { description: string; endpoints?: string[]; dependencies?: string[]; dataFlow?: string; mockBehaviour?: string; productionPath?: string; connectedTo?: string[] } }> = {
  // User Channels
  web: { icon: '🖥️', name: 'Web Portal', category: 'channel', status: 'Live', statusColour: 'bg-green-500', brief: 'Next.js 15, React 19, GOV.UK patterns', detail: { description: 'Responsive web application serving debtors, advisers, and AiB staff. Mobile-first PWA with offline capability.', endpoints: ['/ — Homepage', '/apply — 9-section application form', '/dashboard — Role-specific dashboards', '/portal — Keycloak SSO unified portal', '/login — Mock Keycloak login', '/architecture — This page'], dependencies: ['API Gateway (port 3001)', 'Tailwind CSS', 'Next.js App Router'], dataFlow: 'User → Web Portal → API Gateway → Backend Services', productionPath: 'Azure Static Web Apps (deployed via GitHub Actions)', connectedTo: ['API Gateway', 'Keycloak'] } },
  mobile: { icon: '📱', name: 'Mobile (PWA)', category: 'channel', status: 'Live', statusColour: 'bg-green-500', brief: 'Mobile-first responsive, document camera upload', detail: { description: 'Progressive Web App — same codebase as web portal. Installable on home screen, camera access for document upload, touch-optimised (44px targets).', endpoints: ['Same as Web Portal — responsive breakpoints at 375px, 768px, 1024px'], dependencies: ['Service Worker (future)', 'Camera API for doc upload', 'Payment Request API (Apple/Google Pay)'], dataFlow: 'Mobile User → PWA → API Gateway → Services', mockBehaviour: 'Camera upload simulated with file picker', productionPath: 'Same Azure SWA deployment; no app store required', connectedTo: ['Document Service', 'Payment Service', 'ClamAV'] } },
  admin: { icon: '🏢', name: 'Admin Portal', category: 'channel', status: 'Live', statusColour: 'bg-green-500', brief: 'Internal AiB staff portal (Next.js 15)', detail: { description: 'Internal administration portal for AiB staff. Application review, user management (500 users), organisation hierarchy, RBAC matrix.', endpoints: ['/ — Dashboard (19 applications)', '/users — 500-user paginated management', '/organisations — Parent/child org hierarchy', '/applications/:id — Full case detail with tabs'], dependencies: ['API Gateway', 'User Service', 'Organisation Service'], dataFlow: 'AiB Staff → Admin Portal → API Gateway → Services', productionPath: 'Separate Azure SWA deployment with AD-only access', connectedTo: ['User Service', 'Organisation Service', 'Audit Service'] } },

  // Identity
  keycloak: { icon: '🔐', name: 'Keycloak (SSO)', category: 'identity', status: 'Design', statusColour: 'bg-purple-500', brief: 'Single sign-on across ALL AiB systems', detail: { description: 'Keycloak 24.x provides federated identity management. User authenticates ONCE and receives access to all AiB systems their role permits. 4 realms, 500 users, ScotAccount + GOV.UK federation.', endpoints: ['POST /api/identity/verify/scotaccount — ScotAccount SAML verification', 'POST /api/identity/verify/govuk — GOV.UK One Login OIDC', 'GET /api/identity/systems — List all federated systems', 'POST /api/identity/lookup — Cross-system identity lookup', 'GET /api/identity/user/:id/linked-accounts — Show linked accounts'], dependencies: ['ScotAccount (SAML 2.0)', 'GOV.UK One Login (OIDC)', 'Active Directory (LDAP)', 'PostgreSQL (Keycloak DB)'], dataFlow: 'User → Keycloak → ScotAccount/GOV.UK → JWT issued → Access all systems', mockBehaviour: 'Identity Service on port 3013 simulates ScotAccount/GOV.UK verification flows. Login page at /login simulates Keycloak UI.', productionPath: 'Keycloak 24 on Azure Container Apps (HA). SAML federation with ScotAccount. OIDC with GOV.UK One Login. LDAP sync with AD.', connectedTo: ['BASYS', 'ASTRA', 'eDEN', 'DAS', 'CFT', 'Moratorium', 'RoI', 'IAAS'] } },

  // Gateway
  gateway: { icon: '🌐', name: 'API Gateway', category: 'gateway', status: 'Live', statusColour: 'bg-green-500', brief: 'Auth, RBAC, rate limiting, routing', detail: { description: 'Single entry point for all API traffic. Validates JWT tokens, enforces RBAC (23 permissions), applies rate limiting, generates correlation IDs, routes to downstream services.', endpoints: ['POST /api/applications — Create application', 'GET /api/applications/:id — Get application', 'POST /api/applications/:id/submit — Submit', 'GET /api/postcode/:postcode — Address lookup', 'GET /api/reports/export/weekly-report — CSV download'], dependencies: ['All backend services', 'SQLite (application store)', 'Helmet (security headers)'], dataFlow: 'Request → Auth middleware → RBAC check → Rate limit → Route → Service → Response', mockBehaviour: 'Runs on port 3001. All data stored in SQLite. Full CRUD for applications.', productionPath: 'Azure Container Apps with auto-scaling. PostgreSQL for persistence. Redis for rate-limit counters.', connectedTo: ['All services'] } },

  // External Services
  creditcheck: { icon: '🔍', name: 'Credit Check', category: 'external', status: 'Sandbox', statusColour: 'bg-amber-500', brief: 'Equifax, Experian, TransUnion', detail: { description: 'Multi-provider credit reference check. Consent recorded before check. Results cached 24 hours. Deterministic scoring based on input for consistent demo behaviour.', endpoints: ['POST /api/credit-check/run — Run check (requires consent)', 'GET /api/credit-check/providers — List available CRAs', 'POST /api/credit-check/consent — Record consent', 'GET /api/credit-check/history/:appId — Check history'], dependencies: ['Equifax ConsumerView API', 'Experian Connect API', 'Consent management'], dataFlow: 'Application → Consent check → Provider selected → API call → Score + accounts + risk indicators → Cache → Response', mockBehaviour: 'Synthetic provider generates deterministic scores from name hash. Equifax/Experian sandboxes simulate realistic response shapes. NI ending in "B" triggers bankruptcy flag.', productionPath: 'CRA contracts required (Equifax/Experian). ICO data sharing registration. mTLS for API calls.', connectedTo: ['API Gateway', 'Audit Service'] } },
  payments: { icon: '💳', name: 'Payments', category: 'external', status: 'Sandbox', statusColour: 'bg-amber-500', brief: 'WorldPay, Google Pay, Apple Pay, PayGate', detail: { description: 'Payment processing with multiple provider support. Apple Pay via Payment Request API, Google Pay via Google Pay API, card payments via WorldPay/PayGate. All sandbox — no real transactions.', endpoints: ['POST /api/payments/initiate — Create payment session', 'POST /api/payments/apple-pay — Apple Pay completion', 'POST /api/payments/google-pay — Google Pay completion', 'POST /api/payments/card — Card payment', 'GET /api/payments/:id/status — Payment status', 'POST /api/payments/:id/refund — Refund (sandbox)'], dependencies: ['WorldPay SDK', 'Apple Pay JS', 'Google Pay API', 'PayGate REST API'], dataFlow: 'User selects method → Payment session created → Provider-specific flow → Confirmation → Status updated', mockBehaviour: '90% success rate simulation. Transaction references generated. Sandbox mode clearly indicated on all responses.', productionPath: 'PSP contract (WorldPay or GOV.UK Pay). Apple/Google Pay merchant registration. PCI DSS compliance.', connectedTo: ['API Gateway', 'Audit Service', 'Notification Service'] } },
  postcode: { icon: '📍', name: 'Postcode Lookup', category: 'external', status: 'Mock', statusColour: 'bg-gray-500', brief: 'Address validation, PAF, auto-complete', detail: { description: 'Postcode lookup returns synthetic addresses for any valid UK postcode. Supports the 5-year address history requirement. Used in application form and contact details update.', endpoints: ['GET /api/postcode/:postcode — Returns list of addresses'], dependencies: ['Royal Mail PAF (production)', 'Ordnance Survey (production)'], dataFlow: 'User enters postcode → API call → Address list returned → User selects → Fields populated', mockBehaviour: 'Returns 3 synthetic addresses per postcode. Scottish postcodes (EH, G, DD, AB, FK, PH, IV) return city-appropriate results.', productionPath: 'Ordnance Survey or Ideal Postcodes API. ~£0.03 per lookup.', connectedTo: ['API Gateway', 'Application Form'] } },
  documents: { icon: '📄', name: 'Document Service', category: 'external', status: 'Live', statusColour: 'bg-green-500', brief: 'Upload, generation, ClamAV virus scanning', detail: { description: 'Document lifecycle management. Upload from desktop or mobile camera. Automatic virus scanning via ClamAV before acceptance. Metadata extraction. Category tagging (ID, income, debt, address proof).', endpoints: ['POST /api/documents/upload — Upload (multipart)', 'GET /api/documents/:id — Get metadata', 'GET /api/documents/:id/download — Download', 'POST /api/documents/:id/scan — Trigger virus scan', 'GET /api/documents/:id/scan-status — Scan result'], dependencies: ['ClamAV (TCP port 3310)', 'Local filesystem (POC) → S3 (prod)', 'Multer (file handling)'], dataFlow: 'Upload → ClamAV scan → Clean? → Store + metadata → Available for review', mockBehaviour: 'Files named "virus" or "eicar" trigger quarantine. All others pass. Scan simulates 2s delay.', productionPath: 'S3 with server-side encryption. ClamAV as sidecar container. Azure Blob as alternative.', connectedTo: ['ClamAV', 'API Gateway', 'Application Form'] } },
  mailroom: { icon: '🖨️', name: 'Digital Mailroom', category: 'external', status: 'Design', statusColour: 'bg-purple-500', brief: 'Printing, scanning, OCR/NER (AI opportunity)', detail: { description: 'Digital Mailroom processes inbound physical documents through: virus scan → OCR text extraction → Named Entity Recognition (NER) → PII redaction → intelligent routing to correct AiB system. Major AI opportunity.', endpoints: ['POST /api/mailroom/scan — Submit scanned document', 'POST /api/mailroom/ocr — Extract text', 'POST /api/mailroom/classify — AI document classification', 'POST /api/mailroom/route — Route to destination system'], dependencies: ['OCR engine (Tesseract POC → Azure Document Intelligence prod)', 'NER model (spaCy POC → fine-tuned LLM prod)', 'ClamAV', 'ASTRA/BASYS for routing targets'], dataFlow: 'Physical doc → Scan → Virus check → OCR → NER (extract names, NI, amounts) → PII redaction → Classify doc type → Route to ASTRA/BASYS/eDEN', mockBehaviour: 'Design phase — documented in architecture. OCR/NER endpoints would return mock extracted fields.', productionPath: 'Azure Document Intelligence (Form Recognizer) for OCR. Custom NER model. Confidence threshold: low confidence → human review queue.', connectedTo: ['BASYS', 'ASTRA', 'eDEN', 'ClamAV'] } },
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
  users: { icon: '👥', name: 'User Service', category: 'shared', status: 'Live', statusColour: 'bg-green-500', brief: '500 users, 9 roles, 23 permissions', detail: { description: 'Full RBAC system: 500 users across 9 role levels (L10 Debtor → L100 System Admin). 23 granular permissions. Role-permission matrix. Session management. Org membership.', endpoints: ['POST /api/auth/login — Authenticate', 'GET /api/auth/me — Current user context', 'GET /api/users — List (paginated, filterable)', 'GET /api/roles — Role list with permission counts', 'GET /api/roles/matrix/full — Full permission matrix'], dataFlow: 'Login → JWT with role + permissions → Every API call checks permissions → 403 if insufficient', productionPath: 'Keycloak manages auth. User Service retains business logic (permissions, org queries). Sync via Keycloak events.', connectedTo: ['Keycloak', 'Organisation Service', 'API Gateway'] } },
};

const CATEGORIES = [
  { id: 'channel', label: '📡 User Channels', tiles: ['web', 'mobile', 'admin'] },
  { id: 'identity', label: '🔐 Identity (Keycloak SSO)', tiles: ['keycloak'] },
  { id: 'gateway', label: '🌐 API Gateway', tiles: ['gateway'] },
  { id: 'external', label: '🔌 External Service Integrations', tiles: ['creditcheck', 'payments', 'postcode', 'documents', 'mailroom', 'duplicatecheck'] },
  { id: 'aib', label: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 AiB Core Systems (SSO-Connected)', tiles: ['basys', 'astra', 'eden', 'das', 'cft', 'moratorium', 'roi'] },
  { id: 'shared', label: '⚙️ Shared Platform Services', tiles: ['recommendation', 'notifications', 'audit', 'organisation', 'users'] },
];

export default function ArchitecturePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const tile = selected ? TILES[selected] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Interactive Architecture</h1>
      <p className="text-gray-600 mb-2">AiB Applications Gateway — Click any component to drill down</p>
      <p className="text-xs text-gray-400 mb-6">🟢 Live | 🟡 Sandbox | 🟣 Design | ⚫ Mock</p>

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

      {/* Enterprise Production Stack */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-4 md:p-6">
        <h2 className="text-lg font-bold mb-2">🏢 Enterprise Production Stack (Target)</h2>
        <p className="text-xs text-gray-500 mb-4">The POC uses a lightweight stack for rapid delivery. Production would use the enterprise stack below, aligned with AiB/Scottish Government standards.</p>

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
                ['Frontend', 'Next.js 15 / React 19', 'Angular 17+ or React 18 SPA\n(.NET MVC for server-rendered pages)', 'Angular preferred in Scottish Gov; React for complex SPAs. .NET MVC for content pages.'],
                ['Backend API', 'Node.js / Express / TypeScript', '.NET 8 Minimal APIs\n(C# / ASP.NET Core)', '.NET is AiB\'s primary backend stack. Minimal APIs for microservices; MVC for monolith.'],
                ['API Gateway', 'Express middleware (custom)', 'AWS API Gateway\n+ .NET Ocelot (internal)', 'AWS API Gateway for public endpoints, rate limiting, WAF. Ocelot for service mesh routing.'],
                ['Database', 'SQLite (file-based)', 'AWS RDS (PostgreSQL/SQL Server)\nor Aurora Serverless', 'Enterprise HA, automated backups, encryption at rest, Multi-AZ failover.'],
                ['Identity', 'Mock JWT + Identity Service', 'Keycloak 24 on ECS\n(+ Okta integration)', 'Keycloak for multi-realm federation. Okta for existing enterprise MFA. ScotAccount SAML.'],
                ['Hosting (Frontend)', 'Azure Static Web Apps (free)', 'AWS S3 + CloudFront\n(or AWS Amplify)', 'S3 static hosting + CloudFront CDN. Amplify for CI/CD integration. Scottish Gov AWS account.'],
                ['Hosting (Backend)', 'Azure Container Apps (free)', 'AWS ECS Fargate\nor AWS EKS', 'ECS Fargate for serverless containers. EKS for Kubernetes at scale. Both in Scottish Gov AWS.'],
                ['CI/CD', 'GitHub Actions', 'AWS CodePipeline\n+ GitHub Actions', 'CodePipeline for AWS-native. GitHub Actions for flexibility. Both support environment gates.'],
                ['IaC', 'Bicep + Terraform', 'Terraform\n(AWS provider)', 'Terraform is cloud-agnostic. Existing modules in repo target AWS. State in S3 backend.'],
                ['Testing', 'Vitest (96 tests, 60%)', 'xUnit (.NET) + Playwright\nSpecFlow (BDD) + SonarQube', 'xUnit for .NET unit tests. Playwright for E2E. SpecFlow for acceptance. SonarQube for quality gates.'],
                ['Monitoring', 'Health endpoints only', 'AWS CloudWatch + X-Ray\n+ Grafana', 'CloudWatch for logs/metrics. X-Ray for distributed tracing. Grafana for dashboards.'],
                ['Messaging', 'Direct HTTP (sync)', 'AWS SQS / SNS\nor Amazon MQ (RabbitMQ)', 'SQS for queues, SNS for pub/sub. Dead letter queues. Event-driven architecture.'],
                ['Caching', 'None', 'AWS ElastiCache (Redis)', 'Session cache, response cache, rate-limit counters, distributed locks.'],
                ['Document Storage', 'Local filesystem', 'AWS S3\n(with CloudFront CDN)', 'Encrypted at rest (SSE-KMS), lifecycle policies, versioning, cross-region replication.'],
                ['Virus Scanning', 'ClamAV (Docker)', 'ClamAV on ECS\nor AWS GuardDuty', 'ClamAV sidecar in ECS task. GuardDuty for S3 malware scanning.'],
                ['Secrets', 'Environment variables', 'AWS Secrets Manager\n+ IAM Roles', 'No secrets in code. IAM roles for service-to-service auth. Automatic rotation.'],
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
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-4">
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
                  ['Container Hosting', 'ECS Fargate / EKS', 'Container Apps / AKS', 'AWS ECS — already in AiB estate'],
                  ['Serverless', 'Lambda + API Gateway', 'Functions + APIM', 'AWS Lambda for event processing'],
                  ['Database', 'RDS (PostgreSQL/SQL Server)', 'Azure SQL / Cosmos DB', 'AWS RDS — VPC connectivity established'],
                  ['Object Storage', 'S3 + CloudFront', 'Blob Storage + CDN', 'AWS S3 — existing document pipeline'],
                  ['Identity', 'Cognito or Keycloak on ECS', 'Azure AD B2C', 'Keycloak on ECS — multi-provider federation'],
                  ['Messaging', 'SQS / SNS / EventBridge', 'Service Bus / Event Grid', 'AWS SQS/SNS — Scottish Gov standard'],
                  ['Secrets', 'Secrets Manager + IAM Roles', 'Key Vault + Managed Identity', 'AWS Secrets Manager — existing patterns'],
                  ['Monitoring', 'CloudWatch + X-Ray', 'App Insights + Monitor', 'AWS CloudWatch — centralised logging'],
                  ['CI/CD', 'CodePipeline / GitHub Actions', 'Azure DevOps', 'GitHub Actions — deploys to AWS'],
                  ['IaC', 'Terraform (AWS provider)', 'Terraform / Bicep', 'Terraform — multi-env, existing modules'],
                  ['WAF / Security', 'AWS WAF + Shield', 'Azure Front Door + WAF', 'AWS WAF — DDoS + OWASP protection'],
                  ['Cost Model', 'Pay-per-use, reserved instances', 'Pay-per-use, reserved', 'AWS — existing Scottish Gov agreement'],
                ].map(([cap, aws, azure, rec]) => (
                  <tr key={cap} className="border-b border-gray-100">
                    <td className="p-2 font-bold">{cap}</td>
                    <td className="p-2 bg-green-50">{aws}</td>
                    <td className="p-2">{azure}</td>
                    <td className="p-2 text-gray-600 italic">{rec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2"><strong>Note:</strong> AiB operates within the Scottish Government AWS Cloud environment. All production services should deploy to this existing estate. The POC used Azure free tier for rapid demonstration only — production deployment targets AWS.</p>
        </div>
      </div>
    </div>
  );
}
