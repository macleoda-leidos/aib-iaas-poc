'use client';

import Link from 'next/link';

const SERVICES = [
  { name: 'API Gateway', port: 3001, responseMs: 45, uptime: 99.98 },
  { name: 'Recommendation Engine', port: 3002, responseMs: 78, uptime: 99.95 },
  { name: 'Document Service', port: 3003, responseMs: 120, uptime: 99.92 },
  { name: 'Integration Orchestrator', port: 3004, responseMs: 245, uptime: 99.87 },
  { name: 'Mock Integrations', port: 3005, responseMs: 156, uptime: 99.99 },
  { name: 'Payment Service', port: 3006, responseMs: 89, uptime: 99.96 },
  { name: 'Audit Service', port: 3007, responseMs: 52, uptime: 99.99 },
  { name: 'Credit Check', port: 3008, responseMs: 198, uptime: 99.91 },
  { name: 'Organisation Service', port: 3009, responseMs: 34, uptime: 99.98 },
  { name: 'User Service', port: 3011, responseMs: 41, uptime: 99.97 },
  { name: 'Notification Service', port: 3012, responseMs: 67, uptime: 99.94 },
  { name: 'Identity Service', port: 3013, responseMs: 58, uptime: 99.96 },
];

const INCIDENTS = [
  { time: '22 Aug 14:32', service: 'Integration Orchestrator', issue: 'Timeout on RoI check (recovered)', duration: '45s', status: 'resolved' },
  { time: '21 Aug 09:15', service: 'Document Service', issue: 'ClamAV connection reset', duration: '2m', status: 'resolved' },
  { time: '20 Aug 16:50', service: 'Credit Check', issue: 'Provider latency spike (>2s)', duration: '5m', status: 'resolved' },
];

export default function SystemHealthPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block">← Back to Admin</Link>
      <h1 className="text-3xl font-bold mb-2">System Health</h1>

      <div data-demo="health-summary" className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-green-500"></span>
        {/* Derived from SERVICES so the headline count cannot drift from the list below. */}
        <span className="font-bold text-green-800 dark:text-green-300">All {SERVICES.length} services healthy</span>
        <span className="text-green-600 dark:text-green-400 text-sm ml-2">• Error rate: 0.02% • Avg response: 104ms</span>
      </div>

      <div data-demo="health-services" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {SERVICES.map(s => (
          <div key={s.name} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="font-bold text-sm">{s.name}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Response: {s.responseMs}ms</span>
              <span>Uptime: {s.uptime}%</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-3">Recent Incidents (Last 72h)</h2>
      <div data-demo="health-incidents" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b"><tr><th className="text-left px-4 py-3">Time</th><th className="text-left px-4 py-3">Service</th><th className="text-left px-4 py-3">Issue</th><th className="text-left px-4 py-3">Duration</th><th className="text-left px-4 py-3">Status</th></tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {INCIDENTS.map((inc, i) => (
              <tr key={i}><td className="px-4 py-3 text-gray-500">{inc.time}</td><td className="px-4 py-3 font-medium">{inc.service}</td><td className="px-4 py-3">{inc.issue}</td><td className="px-4 py-3">{inc.duration}</td><td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Resolved</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
