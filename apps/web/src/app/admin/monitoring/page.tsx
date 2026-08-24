'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const MONITORS = [
  { name: 'Frontend (GitHub Pages)', url: 'https://macleoda-leidos.github.io/aib-iaas-poc/', interval: '5m', status: 'up', uptime: '99.97%', lastCheck: '2s ago' },
  { name: 'Node.js API (Render)', url: 'https://iaas-api.onrender.com/api/health', interval: '5m', status: 'up', uptime: '98.2%', lastCheck: '12s ago' },
  { name: '.NET API (Render)', url: 'https://iaas-dotnet-api.onrender.com/api/health', interval: '5m', status: 'up', uptime: '96.8%', lastCheck: '8s ago' },
  { name: 'Neon PostgreSQL', url: 'neon.tech (connection pool)', interval: '5m', status: 'up', uptime: '99.95%', lastCheck: '5s ago' },
  { name: 'GitHub Actions CI', url: 'github.com/actions', interval: '15m', status: 'up', uptime: '99.9%', lastCheck: '3m ago' },
];

const ALERTS = [
  { id: 1, time: '10:32 today', type: 'recovery', message: '.NET API recovered after cold-start (32s downtime)', severity: 'info' },
  { id: 2, time: '08:15 today', type: 'recovery', message: 'Node.js API recovered after cold-start (28s downtime)', severity: 'info' },
  { id: 3, time: 'Yesterday 23:45', type: 'warning', message: 'Neon connection pool at 80% capacity (4/5 connections)', severity: 'warning' },
  { id: 4, time: 'Yesterday 14:20', type: 'recovery', message: '.NET API recovered — EF Core schema mapping resolved', severity: 'info' },
];

const TRACES = [
  { traceId: 'tr-a3f2b8', operation: 'POST /api/applications', duration: '145ms', spans: 4, status: 'ok' },
  { traceId: 'tr-d4e5f6', operation: 'POST /api/recommend', duration: '89ms', spans: 2, status: 'ok' },
  { traceId: 'tr-c7b8a9', operation: 'POST /api/integrations/check-all', duration: '423ms', spans: 8, status: 'ok' },
  { traceId: 'tr-e1f2g3', operation: 'GET /api/applications', duration: '67ms', spans: 2, status: 'ok' },
  { traceId: 'tr-h4i5j6', operation: 'POST /api/credit-check/run', duration: '234ms', spans: 3, status: 'ok' },
];

export default function MonitoringPage() {
  const [uptimePulse, setUptimePulse] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setUptimePulse(p => !p), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block">← Back to Admin</Link>
      <h1 className="text-3xl font-bold mb-2">Monitoring & Observability</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Uptime monitoring, distributed tracing, and alerting — all on free tiers.</p>

      {/* Overall Status */}
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full bg-green-500 ${uptimePulse ? 'animate-pulse' : ''}`}></span>
        <span className="font-bold text-green-800 dark:text-green-300">All Systems Operational</span>
        <span className="text-xs text-green-600 dark:text-green-400 ml-auto">5 monitors active • Last incident: 32s cold-start @ 10:32</span>
      </div>

      {/* Monitors Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700"><h2 className="font-bold">📡 Uptime Monitors</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b"><tr><th className="text-left px-4 py-2">Service</th><th className="text-left px-4 py-2">URL</th><th className="text-center px-4 py-2">Status</th><th className="text-center px-4 py-2">Uptime (30d)</th><th className="text-center px-4 py-2">Check Interval</th><th className="text-right px-4 py-2">Last Check</th></tr></thead>
          <tbody>
            {MONITORS.map(m => (
              <tr key={m.name} className="border-b border-gray-100 dark:border-gray-700">
                <td className="px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500 truncate max-w-[200px]">{m.url}</td>
                <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800">● {m.status}</span></td>
                <td className="px-4 py-3 text-center font-bold text-green-700">{m.uptime}</td>
                <td className="px-4 py-3 text-center text-gray-500">{m.interval}</td>
                <td className="px-4 py-3 text-right text-xs text-gray-400">{m.lastCheck}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Distributed Traces */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700"><h2 className="font-bold">🔍 Recent Traces (OpenTelemetry → Grafana Cloud)</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b"><tr><th className="text-left px-4 py-2">Trace ID</th><th className="text-left px-4 py-2">Operation</th><th className="text-right px-4 py-2">Duration</th><th className="text-center px-4 py-2">Spans</th><th className="text-center px-4 py-2">Status</th></tr></thead>
          <tbody>
            {TRACES.map(t => (
              <tr key={t.traceId} className="border-b border-gray-100 dark:border-gray-700">
                <td className="px-4 py-2 font-mono text-xs text-blue-600">{t.traceId}</td>
                <td className="px-4 py-2 font-mono text-xs">{t.operation}</td>
                <td className="px-4 py-2 text-right font-bold">{t.duration}</td>
                <td className="px-4 py-2 text-center">{t.spans}</td>
                <td className="px-4 py-2 text-center"><span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800">✓ {t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alert History */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700"><h2 className="font-bold">🔔 Alert History</h2></div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {ALERTS.map(a => (
            <div key={a.id} className="px-4 py-3 flex items-start gap-3">
              <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${a.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
              <div className="flex-1">
                <p className="text-sm">{a.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${a.type === 'recovery' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{a.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Infrastructure Note */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
        <strong>Free Tier Infrastructure:</strong> UptimeRobot (50 monitors, 5-min checks) • Grafana Cloud (50GB traces/month, 10k metrics) • All monitoring costs £0/month.
      </div>
    </div>
  );
}
