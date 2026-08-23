'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_URL = 'https://iaas-api.onrender.com';

interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
  description: string;
}

const ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/api/health', description: 'Check service status' },
  { method: 'GET', path: '/api/smoke-test', description: 'Run smoke test — database connectivity and record counts' },
  { method: 'GET', path: '/api/applications', description: 'List all applications' },
  { method: 'POST', path: '/api/applications', description: 'Create new application' },
  { method: 'POST', path: '/api/auth/login', description: 'Authenticate user' },
  { method: 'GET', path: '/api/organisations', description: 'List organisations' },
  { method: 'GET', path: '/api/users', description: 'List users' },
  { method: 'GET', path: '/api/roles', description: 'List roles' },
  { method: 'POST', path: '/api/recommend', description: 'Generate product recommendation' },
  { method: 'GET', path: '/api/audit/events', description: 'List audit events' },
  { method: 'GET', path: '/api/credit-check/providers', description: 'List credit check providers' },
  { method: 'GET', path: '/api/notifications/user/user-001', description: 'Get user notifications' },
  { method: 'GET', path: '/api/integrations/health', description: 'Integration systems health' },
];

function MethodBadge({ method }: { method: string }) {
  const colour = method === 'GET'
    ? 'bg-green-600 text-white'
    : 'bg-blue-600 text-white';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${colour} min-h-0 min-w-0`}>
      {method}
    </span>
  );
}

export default function ApiDocsPage() {
  const [responses, setResponses] = useState<Record<string, { loading: boolean; data?: any; error?: string }>>({});

  async function tryEndpoint(ep: Endpoint) {
    const key = `${ep.method}:${ep.path}`;
    setResponses(prev => ({ ...prev, [key]: { loading: true } }));

    try {
      const opts: RequestInit = { method: ep.method };
      if (ep.method === 'POST') {
        opts.headers = { 'Content-Type': 'application/json' };
        // Provide minimal body for POST endpoints
        if (ep.path === '/api/applications') opts.body = JSON.stringify({});
        if (ep.path === '/api/auth/login') opts.body = JSON.stringify({ email: 'admin@aib.example.gov.scot', password: 'demo' });
        if (ep.path === '/api/recommend') opts.body = JSON.stringify({ totalDebt: 25000, monthlyIncome: 2000, monthlyExpenditure: 1800, assets: 500 });
      }
      const res = await fetch(`${API_URL}${ep.path}`, opts);
      const data = await res.json();
      setResponses(prev => ({ ...prev, [key]: { loading: false, data } }));
    } catch (e: any) {
      setResponses(prev => ({ ...prev, [key]: { loading: false, error: e.message } }));
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">API Documentation</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Live API: <a href={API_URL} target="_blank" rel="noopener noreferrer" className="text-blue-700 dark:text-blue-400 underline">{API_URL}</a>
          </p>
        </div>
        <Link href="/architecture" className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 no-underline text-gray-700 dark:text-gray-300">
          &larr; Architecture
        </Link>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Interactive API Explorer</strong> — Click &quot;Try it&quot; on any endpoint to make a live request to the deployed API. All data is synthetic (POC).
        </p>
      </div>

      <div className="space-y-3">
        {ENDPOINTS.map(ep => {
          const key = `${ep.method}:${ep.path}`;
          const response = responses[key];
          return (
            <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800">
                <MethodBadge method={ep.method} />
                <code className="text-sm font-mono flex-1 text-gray-800 dark:text-gray-200">{ep.path}</code>
                <span className="text-sm text-gray-500 dark:text-gray-400 hidden md:inline">{ep.description}</span>
                <button
                  onClick={() => tryEndpoint(ep)}
                  disabled={response?.loading}
                  className="px-3 py-1 bg-[#d32205] text-white text-xs font-bold rounded hover:bg-[#a81b03] disabled:opacity-50 min-h-0 min-w-0"
                >
                  {response?.loading ? 'Loading...' : 'Try it'}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 px-3 pb-2 md:hidden">{ep.description}</p>

              {response && !response.loading && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
                  {response.error ? (
                    <p className="text-sm text-red-600 dark:text-red-400">Error: {response.error}</p>
                  ) : (
                    <pre className="text-xs overflow-x-auto max-h-64 overflow-y-auto text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Authentication</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Most endpoints work without authentication for the POC. To get a JWT token, POST to <code>/api/auth/login</code> with credentials, then pass the token as <code>Authorization: Bearer &lt;token&gt;</code>.
        </p>
        <h2 className="text-lg font-bold mb-2 mt-4">Rate Limiting</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          The API enforces rate limiting: 500 requests per 15-minute window per IP. Exceeding this returns HTTP 429.
        </p>
      </div>
    </div>
  );
}
