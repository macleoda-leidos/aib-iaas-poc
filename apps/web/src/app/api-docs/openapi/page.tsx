'use client';

import { useState } from 'react';
import Link from 'next/link';

interface EndpointSpec {
  method: string;
  path: string;
  summary: string;
  description: string;
  tag: string;
  parameters?: { name: string; in: string; type: string; required: boolean; description: string }[];
  requestBody?: { type: string; example: string };
  responses: { status: number; description: string; example: string }[];
}

const SPEC: EndpointSpec[] = [
  // Auth
  {
    method: 'POST', path: '/api/auth/login', summary: 'Authenticate user', tag: 'Auth',
    description: 'Authenticates a user with email and password credentials. Returns a JWT token on success.',
    requestBody: { type: 'application/json', example: JSON.stringify({ email: 'admin@aib-poc.example.com', password: 'demo' }, null, 2) },
    responses: [
      { status: 200, description: 'Successful authentication', example: JSON.stringify({ success: true, data: { token: 'eyJhbGciOiJIUzI1NiIs...', user: { id: 'user-001', name: 'Admin User', role: 'System Admin', email: 'admin@aib-poc.example.com' } } }, null, 2) },
      { status: 401, description: 'Invalid credentials', example: JSON.stringify({ success: false, error: { message: 'Invalid email or password' } }, null, 2) },
    ],
  },
  {
    method: 'GET', path: '/api/auth/me', summary: 'Get current user', tag: 'Auth',
    description: 'Returns the currently authenticated user profile based on the JWT token.',
    parameters: [{ name: 'Authorization', in: 'header', type: 'string', required: true, description: 'Bearer <JWT token>' }],
    responses: [
      { status: 200, description: 'Current user profile', example: JSON.stringify({ success: true, data: { id: 'user-001', name: 'Admin User', role: 'System Admin', email: 'admin@aib-poc.example.com' } }, null, 2) },
    ],
  },
  // Applications
  {
    method: 'GET', path: '/api/applications', summary: 'List all applications', tag: 'Applications',
    description: 'Returns a paginated list of all applications. Supports filtering by status, date range, and applicant.',
    parameters: [
      { name: 'page', in: 'query', type: 'integer', required: false, description: 'Page number (default: 1)' },
      { name: 'limit', in: 'query', type: 'integer', required: false, description: 'Items per page (default: 20, max: 100)' },
      { name: 'status', in: 'query', type: 'string', required: false, description: 'Filter by status: draft, submitted, under_review, approved, rejected' },
    ],
    responses: [
      { status: 200, description: 'List of applications', example: JSON.stringify({ success: true, data: { applications: [{ id: 'APP-2024-001', status: 'submitted', applicant: 'John Testerton', createdAt: '2024-01-15T10:30:00Z' }], total: 142, page: 1, limit: 20 } }, null, 2) },
    ],
  },
  {
    method: 'POST', path: '/api/applications', summary: 'Create new application', tag: 'Applications',
    description: 'Creates a new debt solution application. The application starts in draft status.',
    requestBody: { type: 'application/json', example: JSON.stringify({ applicant: { firstName: 'John', lastName: 'Smith', email: 'john@example.com', dateOfBirth: '1985-06-15' }, financials: { totalDebt: 25000, monthlyIncome: 2000, monthlyExpenditure: 1800 } }, null, 2) },
    responses: [
      { status: 201, description: 'Application created', example: JSON.stringify({ success: true, data: { id: 'APP-2024-143', status: 'draft', createdAt: '2024-01-20T14:22:00Z' } }, null, 2) },
      { status: 400, description: 'Validation error', example: JSON.stringify({ success: false, error: { message: 'Validation failed', details: [{ field: 'applicant.email', message: 'Invalid email format' }] } }, null, 2) },
    ],
  },
  {
    method: 'GET', path: '/api/applications/:id', summary: 'Get application by ID', tag: 'Applications',
    description: 'Returns full details of a specific application including financial data, documents, and timeline.',
    parameters: [{ name: 'id', in: 'path', type: 'string', required: true, description: 'Application ID (e.g., APP-2024-001)' }],
    responses: [
      { status: 200, description: 'Application details', example: JSON.stringify({ success: true, data: { id: 'APP-2024-001', status: 'under_review', applicant: { name: 'John Testerton' }, financials: { totalDebt: 18500, monthlyIncome: 1850 }, recommendation: 'MAP', timeline: [{ event: 'submitted', date: '2024-01-15T10:30:00Z' }] } }, null, 2) },
      { status: 404, description: 'Application not found', example: JSON.stringify({ success: false, error: { message: 'Application not found' } }, null, 2) },
    ],
  },
  // Recommendations
  {
    method: 'POST', path: '/api/recommend', summary: 'Generate product recommendation', tag: 'Recommendations',
    description: 'Runs the rules engine to determine the most suitable debt solution based on financial data.',
    requestBody: { type: 'application/json', example: JSON.stringify({ totalDebt: 25000, monthlyIncome: 2000, monthlyExpenditure: 1800, assets: 500, creditorCount: 4 }, null, 2) },
    responses: [
      { status: 200, description: 'Recommendation generated', example: JSON.stringify({ success: true, data: { recommendation: 'DAS', confidence: 0.87, reasoning: 'Positive disposable income suggests repayment is feasible', alternatives: ['Protected Trust Deed'] } }, null, 2) },
    ],
  },
  // Audit
  {
    method: 'GET', path: '/api/audit/events', summary: 'List audit events', tag: 'Audit',
    description: 'Returns a paginated list of system audit events. Requires admin or audit role.',
    parameters: [
      { name: 'page', in: 'query', type: 'integer', required: false, description: 'Page number' },
      { name: 'action', in: 'query', type: 'string', required: false, description: 'Filter by action type: login, create, update, delete, view' },
      { name: 'userId', in: 'query', type: 'string', required: false, description: 'Filter by user ID' },
    ],
    responses: [
      { status: 200, description: 'Audit events list', example: JSON.stringify({ success: true, data: { events: [{ id: 'evt-001', action: 'login', userId: 'user-001', timestamp: '2024-01-20T09:15:00Z', details: { ip: '192.168.1.1', userAgent: 'Chrome/120' } }], total: 5420 } }, null, 2) },
    ],
  },
  // Organisations
  {
    method: 'GET', path: '/api/organisations', summary: 'List organisations', tag: 'Organisations',
    description: 'Returns all registered organisations including AiB, money advice agencies, creditors, and trustees.',
    responses: [
      { status: 200, description: 'Organisations list', example: JSON.stringify({ success: true, data: { organisations: [{ id: 'org-001', name: 'Accountant in Bankruptcy', type: 'regulator', status: 'active' }, { id: 'org-002', name: 'Citizens Advice Scotland', type: 'money_adviser', status: 'active' }], total: 45 } }, null, 2) },
    ],
  },
  // Users
  {
    method: 'GET', path: '/api/users', summary: 'List users', tag: 'Users',
    description: 'Returns all system users. Filterable by role and organisation. Admin access required.',
    parameters: [
      { name: 'role', in: 'query', type: 'string', required: false, description: 'Filter by role' },
      { name: 'orgId', in: 'query', type: 'string', required: false, description: 'Filter by organisation' },
    ],
    responses: [
      { status: 200, description: 'Users list', example: JSON.stringify({ success: true, data: { users: [{ id: 'user-001', name: 'Karen MacLeod', role: 'Senior Officer', org: 'AiB', status: 'active' }], total: 500 } }, null, 2) },
    ],
  },
  {
    method: 'GET', path: '/api/roles', summary: 'List roles', tag: 'Users',
    description: 'Returns all RBAC role definitions with their permissions.',
    responses: [
      { status: 200, description: 'Roles list', example: JSON.stringify({ success: true, data: { roles: [{ id: 'admin', name: 'System Admin', permissions: ['*'] }, { id: 'case_officer', name: 'Case Officer', permissions: ['read:applications', 'write:applications', 'read:audit'] }] } }, null, 2) },
    ],
  },
  // Credit Check
  {
    method: 'GET', path: '/api/credit-check/providers', summary: 'List credit check providers', tag: 'Integrations',
    description: 'Returns available credit check providers and their current status.',
    responses: [
      { status: 200, description: 'Providers list', example: JSON.stringify({ success: true, data: { providers: [{ id: 'experian', name: 'Experian', status: 'available', avgResponseTime: '2.3s' }, { id: 'equifax', name: 'Equifax', status: 'available', avgResponseTime: '1.8s' }] } }, null, 2) },
    ],
  },
  // Notifications
  {
    method: 'GET', path: '/api/notifications/user/:userId', summary: 'Get user notifications', tag: 'Notifications',
    description: 'Returns all notifications for a specific user, ordered by most recent.',
    parameters: [{ name: 'userId', in: 'path', type: 'string', required: true, description: 'User ID' }],
    responses: [
      { status: 200, description: 'Notifications list', example: JSON.stringify({ success: true, data: { notifications: [{ id: 'notif-001', type: 'application_status', message: 'Your application APP-2024-001 has been approved', read: false, createdAt: '2024-01-20T10:00:00Z' }], unreadCount: 3 } }, null, 2) },
    ],
  },
  // Health
  {
    method: 'GET', path: '/api/health', summary: 'Health check', tag: 'System',
    description: 'Returns the health status of the API and all dependent services.',
    responses: [
      { status: 200, description: 'Service healthy', example: JSON.stringify({ status: 'healthy', version: '1.0.0', uptime: '72h 14m', services: { database: 'connected', cache: 'connected', queue: 'connected' } }, null, 2) },
    ],
  },
  {
    method: 'GET', path: '/api/integrations/health', summary: 'Integration systems health', tag: 'System',
    description: 'Returns health status of all external integration points (BASYS, eDEN, DAS, CFT, etc.)',
    responses: [
      { status: 200, description: 'Integration health', example: JSON.stringify({ success: true, data: { integrations: [{ name: 'BASYS', status: 'healthy', lastCheck: '2024-01-20T14:55:00Z' }, { name: 'eDEN', status: 'healthy', lastCheck: '2024-01-20T14:55:00Z' }, { name: 'DAS Register', status: 'degraded', lastCheck: '2024-01-20T14:50:00Z' }] } }, null, 2) },
    ],
  },
];

const TAGS = ['Auth', 'Applications', 'Recommendations', 'Audit', 'Organisations', 'Users', 'Notifications', 'Integrations', 'System'];

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-green-600 text-white',
    POST: 'bg-blue-600 text-white',
    PUT: 'bg-amber-600 text-white',
    DELETE: 'bg-red-600 text-white',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-mono ${colors[method] || 'bg-gray-600 text-white'}`}>
      {method}
    </span>
  );
}

export default function OpenApiPage() {
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const toggle = (key: string) => {
    setExpandedEndpoints(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredSpec = activeTag ? SPEC.filter(e => e.tag === activeTag) : SPEC;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">OpenAPI 3.0 Specification</h1>
          <p className="text-gray-600 dark:text-gray-400">AiB IAAS API — Version 1.0.0</p>
        </div>
        <Link href="/api-docs" className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 no-underline text-gray-700 dark:text-gray-300">
          &larr; API Explorer
        </Link>
      </div>

      {/* Info Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-6">
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Base URL</p>
            <code className="text-blue-700 dark:text-blue-400">https://iaas-api.onrender.com</code>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Authentication</p>
            <p className="text-gray-800 dark:text-gray-200">Bearer JWT Token</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Rate Limit</p>
            <p className="text-gray-800 dark:text-gray-200">500 requests / 15 min</p>
          </div>
        </div>
      </div>

      {/* Tag Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTag(null)}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
            !activeTag ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All ({SPEC.length})
        </button>
        {TAGS.map(tag => {
          const count = SPEC.filter(e => e.tag === tag).length;
          if (count === 0) return null;
          return (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                activeTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tag} ({count})
            </button>
          );
        })}
      </div>

      {/* Endpoints */}
      <div className="space-y-3">
        {filteredSpec.map(ep => {
          const key = `${ep.method}:${ep.path}`;
          const expanded = expandedEndpoints.has(key);
          return (
            <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggle(key)}
                className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-left transition-colors"
              >
                <MethodBadge method={ep.method} />
                <code className="text-sm font-mono text-gray-800 dark:text-gray-200 flex-1">{ep.path}</code>
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden md:inline">{ep.summary}</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">{ep.tag}</span>
                <span className="text-gray-400 text-sm">{expanded ? '▼' : '▶'}</span>
              </button>

              {expanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-5">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{ep.description}</p>

                  {/* Parameters */}
                  {ep.parameters && ep.parameters.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">Parameters</h4>
                      <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-750">
                              <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-400">Name</th>
                              <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-400">In</th>
                              <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-400">Type</th>
                              <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-400">Required</th>
                              <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-400">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ep.parameters.map(p => (
                              <tr key={p.name} className="border-t border-gray-100 dark:border-gray-700">
                                <td className="px-3 py-2 font-mono text-xs text-blue-700 dark:text-blue-400">{p.name}</td>
                                <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{p.in}</td>
                                <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{p.type}</td>
                                <td className="px-3 py-2 text-xs">{p.required ? <span className="text-red-600">Yes</span> : <span className="text-gray-400">No</span>}</td>
                                <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{p.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Request Body */}
                  {ep.requestBody && (
                    <div className="mb-4">
                      <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">Request Body <span className="text-gray-400 font-normal">({ep.requestBody.type})</span></h4>
                      <pre className="bg-gray-800 dark:bg-gray-950 text-green-300 text-xs p-3 rounded overflow-x-auto">{ep.requestBody.example}</pre>
                    </div>
                  )}

                  {/* Responses */}
                  <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">Responses</h4>
                    <div className="space-y-2">
                      {ep.responses.map(r => (
                        <div key={r.status} className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800">
                            <span className={`text-xs font-bold ${r.status < 300 ? 'text-green-600' : r.status < 500 ? 'text-amber-600' : 'text-red-600'}`}>{r.status}</span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{r.description}</span>
                          </div>
                          <pre className="bg-gray-800 dark:bg-gray-950 text-green-300 text-xs p-3 overflow-x-auto border-t border-gray-200 dark:border-gray-700">{r.example}</pre>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="mt-8 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>POC Note:</strong> This specification documents the current POC API. In production, this would be auto-generated from code annotations and served via Swagger UI with OAuth2 authentication flow.
        </p>
      </div>
    </div>
  );
}
