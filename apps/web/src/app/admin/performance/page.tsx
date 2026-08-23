'use client';

import Link from 'next/link';

const pageMetrics = [
  { page: '/', name: 'Home', loadTime: '0.8s', bundleSize: '45KB', score: 100 },
  { page: '/apply', name: 'Apply', loadTime: '1.2s', bundleSize: '78KB', score: 95 },
  { page: '/dashboard', name: 'Dashboard', loadTime: '1.5s', bundleSize: '92KB', score: 92 },
  { page: '/search', name: 'Search', loadTime: '1.1s', bundleSize: '56KB', score: 96 },
  { page: '/admin', name: 'Admin', loadTime: '2.5s', bundleSize: '121KB', score: 88 },
  { page: '/statistics', name: 'Statistics', loadTime: '1.8s', bundleSize: '14KB', score: 93 },
];

const coreWebVitals = [
  { metric: 'LCP (Largest Contentful Paint)', value: '1.2s', threshold: '< 2.5s', status: 'good' },
  { metric: 'FID (First Input Delay)', value: '45ms', threshold: '< 100ms', status: 'good' },
  { metric: 'CLS (Cumulative Layout Shift)', value: '0.02', threshold: '< 0.1', status: 'good' },
];

const lighthouseScores = [
  { category: 'Performance', score: 93 },
  { category: 'Accessibility', score: 97 },
  { category: 'Best Practices', score: 95 },
  { category: 'SEO', score: 100 },
];

export default function PerformancePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            ← Back to Admin
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Performance Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Page load times, bundle analysis, and Core Web Vitals</p>

        {/* API Latency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">API Average Latency</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">104ms</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">P95 Latency</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">245ms</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">P99 Latency</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">890ms</p>
          </div>
        </div>

        {/* Core Web Vitals */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Core Web Vitals</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
            {coreWebVitals.map((v) => (
              <div key={v.metric} className="p-6 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{v.value}</p>
                <p className="text-sm text-gray-900 dark:text-white font-medium mt-1">{v.metric}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Good: {v.threshold}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mt-2">
                  Good
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lighthouse Scores */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lighthouse Scores</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
            {lighthouseScores.map((l) => (
              <div key={l.category} className="p-6 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-4 mb-2 ${
                  l.score >= 90 ? 'border-green-500' : l.score >= 50 ? 'border-yellow-500' : 'border-red-500'
                }`}>
                  <span className={`text-lg font-bold ${
                    l.score >= 90 ? 'text-green-600 dark:text-green-400' : l.score >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                  }`}>{l.score}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{l.category}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Page Load Times */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Page Load Times</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Page</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Path</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Load Time</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Bundle Size</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pageMetrics.map((p) => (
                  <tr key={p.page} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{p.page}</td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{p.loadTime}</td>
                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{p.bundleSize}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        p.score >= 95 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        p.score >= 90 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      }`}>
                        {p.score}/100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
