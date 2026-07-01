export default function ArchitecturePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">System Architecture</h1>
      <p className="text-gray-600 mb-8">Applications Gateway — Integration Topology</p>

      {/* Architecture Diagram */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 overflow-x-auto">
        <pre className="text-xs leading-relaxed font-mono text-gray-700 whitespace-pre">{`
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER CHANNELS                                       │
│                                                                                  │
│   🖥️ Web Portal        📱 Mobile (PWA)       🏢 Admin Portal       🔗 API        │
│   (Next.js 15)         (Responsive)          (Next.js 15)         (REST)        │
└──────────────────────────────────┬───────────────────────────────────────────────┘
                                   │ HTTPS
                    ┌──────────────┴──────────────┐
                    │     🔐 API GATEWAY (BFF)     │
                    │  Authentication │ Rate Limit  │
                    │  RBAC Middleware │ Routing     │
                    └──────────────┬──────────────┘
                                   │
        ┌──────────┬───────────────┼───────────────┬──────────────┐
        │          │               │               │              │
   ┌────┴────┐ ┌──┴────┐  ┌──────┴──────┐  ┌────┴────┐  ┌─────┴─────┐
   │Recommend│ │Credit │  │ Integration │  │Document │  │  Payment  │
   │ Engine  │ │Check  │  │Orchestrator │  │Service  │  │  Service  │
   │(Rules+AI)│ │(3 CRAs)│  │  (Parallel) │  │(ClamAV) │  │(Sandbox)  │
   └─────────┘ └───────┘  └──────┬──────┘  └─────────┘  └───────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │   MOCK INTEGRATIONS (6)    │
                    │                            │
                    │  ┌──────┐ ┌──────┐ ┌────┐ │
                    │  │BASYS │ │eDEN/ │ │DAS │ │
                    │  │      │ │DASH  │ │    │ │
                    │  └──────┘ └──────┘ └────┘ │
                    │  ┌──────┐ ┌──────┐ ┌────┐ │
                    │  │ CFT  │ │Morat.│ │RoI │ │
                    │  │      │ │      │ │    │ │
                    │  └──────┘ └──────┘ └────┘ │
                    └───────────────────────────┘

   ┌──────────────────────────────────────────────────────────────────┐
   │                    SHARED SERVICES                                 │
   │                                                                    │
   │  👥 User Service    🏢 Organisation    🔔 Notification    📝 Audit │
   │  (RBAC, 500 users)  (Parent/Child)     (Email/SMS/App)    (Trail) │
   │                                                                    │
   │  🔐 Identity Service (ScotAccount / GOV.UK One Login / Keycloak)  │
   └──────────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────────┐
   │                    INFRASTRUCTURE                                  │
   │                                                                    │
   │  🐳 Docker / Azure Container Apps    📊 SQLite → PostgreSQL       │
   │  🏗️ Terraform / Bicep (IaC)          📁 Azure Files → S3         │
   │  🔄 GitHub Actions CI/CD              🔒 Keycloak (SSO target)    │
   └──────────────────────────────────────────────────────────────────┘
`}</pre>
      </div>

      {/* Service Inventory */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="font-bold mb-3">Backend Services (13)</h2>
          <div className="space-y-1 text-sm">
            {[
              { name: 'API Gateway', port: 3001, desc: 'BFF, routing, RBAC enforcement' },
              { name: 'Recommendation Engine', port: 3002, desc: 'Rules-based product recommendation' },
              { name: 'Document Service', port: 3003, desc: 'Upload, ClamAV virus scanning' },
              { name: 'Integration Orchestrator', port: 3004, desc: 'Parallel cross-system checks' },
              { name: 'Mock Integrations', port: 3005, desc: 'BASYS, eDEN, DAS, CFT, Moratorium, RoI' },
              { name: 'Payment Service', port: 3006, desc: 'Apple Pay, Google Pay, Card (sandbox)' },
              { name: 'Audit Service', port: 3007, desc: 'Full event trail' },
              { name: 'Credit Check', port: 3008, desc: 'Equifax, Experian, Synthetic providers' },
              { name: 'Organisation Service', port: 3009, desc: 'Parent/child org hierarchy' },
              { name: 'User Service', port: 3011, desc: '500 users, 9 roles, 23 permissions' },
              { name: 'Notification Service', port: 3012, desc: 'In-app, email, SMS (placeholder)' },
              { name: 'Identity Service', port: 3013, desc: 'ScotAccount, GOV.UK Verify federation' },
              { name: 'Consolidated API', port: 3001, desc: 'All-in-one for cloud deployment' },
            ].map(s => (
              <div key={s.name} className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-gray-500">:{s.port}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="font-bold mb-3">Key Integration Patterns</h2>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded">
              <p className="font-bold">Cross-System Search</p>
              <p className="text-xs text-gray-600">Parallel queries to 6 AiB systems with circuit breaker, aggregated results, duplicate detection</p>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <p className="font-bold">Identity Federation (Keycloak)</p>
              <p className="text-xs text-gray-600">ScotAccount (SAML) + GOV.UK One Login (OIDC) + Active Directory (LDAP) → Single SSO</p>
            </div>
            <div className="p-3 bg-purple-50 rounded">
              <p className="font-bold">RBAC (Role-Based Access)</p>
              <p className="text-xs text-gray-600">9 role levels × 23 permissions × 19 organisations. Token-based enforcement at API layer</p>
            </div>
            <div className="p-3 bg-orange-50 rounded">
              <p className="font-bold">Document Pipeline</p>
              <p className="text-xs text-gray-600">Upload → ClamAV virus scan → metadata extraction → encrypted storage (Azure Files/S3)</p>
            </div>
            <div className="p-3 bg-red-50 rounded">
              <p className="font-bold">Credit Check (Multi-Provider)</p>
              <p className="text-xs text-gray-600">Equifax + Experian + Synthetic. Consent recording, result caching (24h TTL), PASS/FAIL determination</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <h2 className="font-bold mb-3">Technology Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="p-2 border rounded text-center"><p className="font-bold">Frontend</p><p className="text-xs text-gray-500">Next.js 15, React 19, Tailwind</p></div>
          <div className="p-2 border rounded text-center"><p className="font-bold">Backend</p><p className="text-xs text-gray-500">Node.js, Express, TypeScript</p></div>
          <div className="p-2 border rounded text-center"><p className="font-bold">Database</p><p className="text-xs text-gray-500">SQLite (POC) → PostgreSQL</p></div>
          <div className="p-2 border rounded text-center"><p className="font-bold">Infrastructure</p><p className="text-xs text-gray-500">Docker, Terraform, Azure</p></div>
          <div className="p-2 border rounded text-center"><p className="font-bold">CI/CD</p><p className="text-xs text-gray-500">GitHub Actions, quality gates</p></div>
          <div className="p-2 border rounded text-center"><p className="font-bold">Testing</p><p className="text-xs text-gray-500">Vitest (96 tests), 60% coverage</p></div>
          <div className="p-2 border rounded text-center"><p className="font-bold">Identity</p><p className="text-xs text-gray-500">Keycloak, ScotAccount, OIDC</p></div>
          <div className="p-2 border rounded text-center"><p className="font-bold">Security</p><p className="text-xs text-gray-500">RBAC, ClamAV, encryption</p></div>
        </div>
      </div>
    </div>
  );
}
