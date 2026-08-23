'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Release {
  version: string;
  sprint: string;
  title: string;
  date: string;
  summary: string;
  features: string[];
}

const releases: Release[] = [
  {
    version: 'v0.8.0',
    sprint: 'Sprint 8',
    title: 'Enterprise Polish',
    date: '12 Aug 2026',
    summary: 'Advanced data management, reporting tools, and operational controls for enterprise readiness.',
    features: [
      'Data export to CSV/JSON/PDF with configurable filters',
      'Custom report builder with drag-and-drop metrics',
      'Activity heatmap for application submission patterns',
      'System health monitoring dashboard',
      'Feature flags management for gradual rollouts',
      'Demo mode toggle for stakeholder presentations',
    ],
  },
  {
    version: 'v0.7.0',
    sprint: 'Sprint 7',
    title: 'AI Showcase',
    date: '29 Jul 2026',
    summary: 'Artificial intelligence capabilities for case processing and quality assurance.',
    features: [
      'AI-powered chatbot for applicant guidance',
      'Automated case summary generation',
      'Anomaly detection for fraudulent applications',
      'Quality checks with confidence scoring',
      'Predictive analytics for case outcomes',
    ],
  },
  {
    version: 'v0.6.0',
    sprint: 'Sprint 6',
    title: 'Scale & Security',
    date: '15 Jul 2026',
    summary: 'Enhanced security controls and multi-tenancy features for production scale.',
    features: [
      'Multi-factor authentication (TOTP/SMS)',
      'Multi-language support (English, Gaelic)',
      'Webhook integrations for external systems',
      'API key management with rate limiting',
    ],
  },
  {
    version: 'v0.5.0',
    sprint: 'Sprint 5',
    title: 'Live Verification',
    date: '1 Jul 2026',
    summary: 'Progressive web app capabilities and comprehensive testing infrastructure.',
    features: [
      'Progressive Web App (PWA) with offline support',
      'WCAG 2.1 AA accessibility fixes and audit',
      'Interactive API documentation (Swagger UI)',
      'End-to-end smoke test suite',
    ],
  },
  {
    version: 'v0.4.0',
    sprint: 'Sprint 4',
    title: 'Intelligent Platform',
    date: '17 Jun 2026',
    summary: 'Smart decision support tools for caseworkers and applicants.',
    features: [
      'Real-time eligibility meter with rule breakdown',
      'Risk scoring engine with weighted criteria',
      'Decision support recommendations for caseworkers',
    ],
  },
  {
    version: 'v0.3.0',
    sprint: 'Sprint 3',
    title: 'Production Readiness',
    date: '3 Jun 2026',
    summary: 'Authentication, authorization, and observability for production deployment.',
    features: [
      'User authentication with session management',
      'Role-based access control (RBAC)',
      'Rate limiting and request throttling',
      'Application monitoring and health checks',
    ],
  },
  {
    version: 'v0.2.0',
    sprint: 'Sprint 2',
    title: 'Robustness',
    date: '20 May 2026',
    summary: 'Resilience features and enhanced user experience.',
    features: [
      'Offline fallback with service worker caching',
      'PDF export for applications and decisions',
      'Caseworker notes and internal comments',
    ],
  },
  {
    version: 'v0.1.0',
    sprint: 'Sprint 1',
    title: 'Operational Beta',
    date: '6 May 2026',
    summary: 'Initial functional system with live APIs and data persistence.',
    features: [
      'Live API gateway with microservice routing',
      'SQLite persistence with auto-migration',
      'Auto-seed with synthetic test data',
    ],
  },
];

export default function ChangelogPage() {
  const [expanded, setExpanded] = useState<string[]>([releases[0].version]);

  const toggleExpanded = (version: string) => {
    setExpanded(prev =>
      prev.includes(version) ? prev.filter(v => v !== version) : [...prev, version]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            ← Back to Admin
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Changelog</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Release history and feature notes for AiB IAAS</p>

        {/* What's Next */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">What&apos;s Next — Sprint 10 Preview</h2>
          <p className="text-blue-800 dark:text-blue-300 text-sm mb-3">
            Planned for late August 2026: Final integration testing, load testing, security penetration testing, and production deployment preparation.
          </p>
          <ul className="text-blue-700 dark:text-blue-400 text-sm space-y-1">
            <li>- Load testing with 1,000 concurrent users</li>
            <li>- Security penetration test report</li>
            <li>- Production deployment runbook</li>
            <li>- User acceptance testing sign-off</li>
          </ul>
        </div>

        {/* Release List */}
        <div className="space-y-4">
          {releases.map((release) => (
            <div
              key={release.version}
              className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => toggleExpanded(release.version)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    {release.version}
                  </span>
                  <span className="text-gray-900 dark:text-white font-semibold">{release.title}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">({release.sprint})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">{release.date}</span>
                  <span className="text-gray-400 dark:text-gray-500">
                    {expanded.includes(release.version) ? '▼' : '▶'}
                  </span>
                </div>
              </button>

              {expanded.includes(release.version) && (
                <div className="px-6 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{release.summary}</p>
                  <ul className="space-y-1.5">
                    {release.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-green-500 mt-0.5">+</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
