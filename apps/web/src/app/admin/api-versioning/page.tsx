'use client';

import Link from 'next/link';

const API_VERSIONS = [
  { version: 'v1', status: 'current', released: 'Aug 2026', deprecation: null, endpoints: 52, changes: 'Initial stable release — all endpoints' },
  { version: 'v0 (legacy)', status: 'deprecated', released: 'Jun 2026', deprecation: 'Dec 2026', endpoints: 38, changes: 'Pre-release development API — will be removed' },
];

const ENDPOINTS = [
  { path: '/api/v1/applications', method: 'GET', description: 'List applications (paginated)', version: 'v1' },
  { path: '/api/v1/applications', method: 'POST', description: 'Create new application', version: 'v1' },
  { path: '/api/v1/applications/:id', method: 'GET', description: 'Get application by ID', version: 'v1' },
  { path: '/api/v1/applications/:id/status', method: 'PATCH', description: 'Update application status', version: 'v1' },
  { path: '/api/v1/applications/:id/notes', method: 'POST', description: 'Add case note', version: 'v1' },
  { path: '/api/v1/auth/login', method: 'POST', description: 'Authenticate user', version: 'v1' },
  { path: '/api/v1/users', method: 'GET', description: 'List users', version: 'v1' },
  { path: '/api/v1/users', method: 'POST', description: 'Create user', version: 'v1' },
  { path: '/api/v1/organisations', method: 'GET', description: 'List organisations', version: 'v1' },
  { path: '/api/v1/recommend', method: 'POST', description: 'Get product recommendation', version: 'v1' },
  { path: '/api/v1/credit-check/run', method: 'POST', description: 'Run credit check', version: 'v1' },
  { path: '/api/v1/integrations/check-all', method: 'POST', description: 'Run all system checks', version: 'v1' },
  { path: '/api/v1/audit/events', method: 'GET', description: 'Get audit events', version: 'v1' },
  { path: '/api/v1/notifications/user/:id', method: 'GET', description: 'Get user notifications', version: 'v1' },
  { path: '/api/v1/health', method: 'GET', description: 'Health check', version: 'v1' },
];

const HEADERS = [
  { header: 'X-API-Version', description: 'Returned in every response — confirms which version served the request', example: 'v1' },
  { header: 'X-Request-Id', description: 'Correlation ID for distributed tracing', example: 'req-a3f2b8c1-d4e5-f6a7' },
  { header: 'X-RateLimit-Remaining', description: 'Requests remaining in current window', example: '87' },
  { header: 'X-RateLimit-Reset', description: 'Unix timestamp when window resets', example: '1724500800' },
  { header: 'Deprecation', description: 'Present on deprecated endpoints — RFC 8594 compliant', example: 'Sun, 01 Dec 2026 00:00:00 GMT' },
];

export default function ApiVersioningPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block">← Back to Admin</Link>
      <h1 className="text-3xl font-bold mb-2">API Versioning</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Versioned REST API with deprecation notices, rate limiting headers, and correlation IDs.</p>

      {/* Version History */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
        <h2 className="font-bold text-sm mb-3">📋 Version History</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b"><tr><th className="text-left px-3 py-2">Version</th><th className="text-left px-3 py-2">Status</th><th className="text-left px-3 py-2">Released</th><th className="text-left px-3 py-2">Deprecation</th><th className="text-right px-3 py-2">Endpoints</th><th className="text-left px-3 py-2">Notes</th></tr></thead>
          <tbody>
            {API_VERSIONS.map(v => (
              <tr key={v.version} className="border-b border-gray-100 dark:border-gray-700">
                <td className="px-3 py-2 font-mono font-bold">{v.version}</td>
                <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-bold ${v.status === 'current' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{v.status}</span></td>
                <td className="px-3 py-2">{v.released}</td>
                <td className="px-3 py-2">{v.deprecation || '—'}</td>
                <td className="px-3 py-2 text-right">{v.endpoints}</td>
                <td className="px-3 py-2 text-gray-500">{v.changes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Response Headers */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
        <h2 className="font-bold text-sm mb-3">🏷️ Response Headers</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b"><tr><th className="text-left px-3 py-2">Header</th><th className="text-left px-3 py-2">Description</th><th className="text-left px-3 py-2">Example</th></tr></thead>
          <tbody>
            {HEADERS.map(h => (
              <tr key={h.header} className="border-b border-gray-100 dark:border-gray-700">
                <td className="px-3 py-2 font-mono text-xs font-bold text-blue-700 dark:text-blue-400">{h.header}</td>
                <td className="px-3 py-2">{h.description}</td>
                <td className="px-3 py-2 font-mono text-xs">{h.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rate Limiting */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
        <h2 className="font-bold text-sm mb-3">⏱️ Rate Limits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">500</p>
            <p className="text-xs text-gray-500">Requests per 15-min window</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded p-3 text-center">
            <p className="text-2xl font-bold text-green-700">Per-IP</p>
            <p className="text-xs text-gray-500">Tracking method</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">429</p>
            <p className="text-xs text-gray-500">Status code when exceeded</p>
          </div>
        </div>
      </div>

      {/* Endpoint Catalogue */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold">🔗 v1 Endpoints ({ENDPOINTS.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b"><tr><th className="text-left px-3 py-2">Method</th><th className="text-left px-3 py-2">Path</th><th className="text-left px-3 py-2">Description</th></tr></thead>
          <tbody>
            {ENDPOINTS.map((e, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-bold ${e.method === 'GET' ? 'bg-green-100 text-green-800' : e.method === 'POST' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{e.method}</span></td>
                <td className="px-3 py-2 font-mono text-xs">{e.path}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{e.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
