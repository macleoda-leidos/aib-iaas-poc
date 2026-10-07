'use client';

import Link from 'next/link';

// Reflects the real Helmet configuration applied to the API by
// services/api-gateway/src/middleware/securityHeaders.ts (shared by the deployed
// consolidated-api). The API serves only JSON, so the CSP can be maximally strict.
const HEADERS = [
  { name: 'Content-Security-Policy', value: "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'", status: 'applied', description: "Strict policy for a JSON API — nothing may load, embed, or submit. The HTML frontend uses a looser, static-export-compatible policy." },
  { name: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload', status: 'applied', description: 'Enforces HTTPS for 1 year with subdomains; preload-eligible' },
  { name: 'X-Content-Type-Options', value: 'nosniff', status: 'applied', description: 'Prevents MIME-type sniffing' },
  { name: 'X-Frame-Options', value: 'DENY', status: 'applied', description: 'Prevents clickjacking by disabling iframe embedding' },
  { name: 'Referrer-Policy', value: 'no-referrer', status: 'applied', description: 'The API sends no referrer to any origin' },
  { name: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()', status: 'applied', description: 'Denies powerful browser features the API never uses' },
  { name: 'Cross-Origin-Opener-Policy', value: 'same-origin', status: 'applied', description: 'Isolates browsing context from cross-origin popups' },
  { name: 'Cross-Origin-Resource-Policy', value: 'cross-origin', status: 'applied', description: 'Allows the separate frontend origin to read API responses; the CORS allow-list remains the access control' },
  { name: 'X-Powered-By', value: 'removed', status: 'applied', description: 'Framework/version banner suppressed (app.disable)' },
];

export default function SecurityHeadersPage() {
  const applied = HEADERS.filter(h => h.status === 'applied').length;
  const recommended = HEADERS.filter(h => h.status === 'recommended').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block">← Back to Admin</Link>
      <h1 className="text-3xl font-bold mb-2">Security Headers</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">HTTP security headers applied by Helmet.js on all API responses.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 border-l-4 border-l-green-500">
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">{applied}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Applied</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 border-l-4 border-l-amber-500">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{recommended}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Recommended</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 border-l-4 border-l-blue-500">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{HEADERS.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Headers</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Header</th>
              <th className="text-left px-4 py-3 font-semibold">Value</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {HEADERS.map(h => (
              <tr key={h.name}>
                <td className="px-4 py-3 font-mono text-xs font-bold">{h.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{h.value}</td>
                <td className="px-4 py-3">
                  {h.status === 'applied' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">✓ Applied</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">⚠ Recommended</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{h.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
        <p><strong>POC Note:</strong> These headers are applied by Helmet.js on every Express API response (shared config in <code>securityHeaders.ts</code>, used by both the standalone gateway and the deployed consolidated API). The static frontend is hosted on GitHub Pages, which cannot send custom response headers; it carries a best-effort <code>&lt;meta&gt;</code> CSP and referrer policy instead, and ships the full header set as <code>_headers</code> / <code>staticwebapp.config.json</code> ready for any header-capable host.</p>
      </div>
    </div>
  );
}
