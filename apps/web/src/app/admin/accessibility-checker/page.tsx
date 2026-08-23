'use client';

import Link from 'next/link';

const pagesChecked = [
  { page: '/', name: 'Home', score: 98, issues: 1, lastChecked: '19 Aug 2026, 08:00' },
  { page: '/apply', name: 'Apply', score: 97, issues: 1, lastChecked: '19 Aug 2026, 08:00' },
  { page: '/dashboard', name: 'Dashboard', score: 100, issues: 0, lastChecked: '19 Aug 2026, 08:00' },
  { page: '/search', name: 'Search', score: 96, issues: 2, lastChecked: '19 Aug 2026, 08:00' },
  { page: '/admin', name: 'Admin', score: 95, issues: 3, lastChecked: '19 Aug 2026, 08:00' },
  { page: '/case/IAAS-2026-00012', name: 'Case Detail', score: 99, issues: 0, lastChecked: '19 Aug 2026, 08:00' },
];

const issues = [
  { page: '/apply', severity: 'Warning', criterion: '1.4.3 Contrast', description: 'Helper text contrast ratio is 4.3:1 (minimum 4.5:1)', fix: 'Darken helper text color from #767676 to #636363' },
  { page: '/search', severity: 'Warning', criterion: '2.4.6 Headings', description: 'Search results section missing a heading level', fix: 'Add an h2 element before the results list' },
  { page: '/admin', severity: 'Warning', criterion: '4.1.2 Name, Role, Value', description: 'Toggle buttons missing aria-pressed attribute', fix: 'Add aria-pressed={isActive} to toggle button components' },
];

export default function AccessibilityCheckerPage() {
  const overallScore = 97;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            ← Back to Admin
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Accessibility Checker</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Live WCAG 2.1 AA compliance monitoring</p>

        {/* Overall Score & WCAG Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-green-500 mb-3">
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">{overallScore}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Overall Score (out of 100)</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mt-2">
                WCAG 2.1 AA Compliant
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">WCAG Criteria Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Pass</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">47</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Warning</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Fail</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pages Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pages Checked</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Page</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Path</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Score</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Issues</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Last Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pagesChecked.map((p) => (
                  <tr key={p.page} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{p.page}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        p.score >= 98 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        p.score >= 95 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {p.score}/100
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{p.issues}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.lastChecked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Issues List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Issues & Fix Suggestions</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {issues.map((issue, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {issue.severity}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-mono">{issue.page}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">— {issue.criterion}</span>
                </div>
                <p className="text-gray-900 dark:text-white text-sm">{issue.description}</p>
                <p className="text-green-700 dark:text-green-400 text-sm mt-1">Fix: {issue.fix}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
