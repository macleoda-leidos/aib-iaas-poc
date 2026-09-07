'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { observability, type Readiness, type MetricsSummary } from '../../../lib/apiClient';

/**
 * System health, reading real data.
 *
 * What this replaced was three hard-coded arrays. It listed twelve services with individual
 * response times (45ms, 78ms, 120ms…) and uptime percentages to two decimal places, none of
 * which had been measured, plus three "Recent Incidents" with dates, durations and root causes
 * for events that never happened.
 *
 * The service list was misleading in a second way beyond being invented: **the twelve logical
 * services deploy as one container**, so they do not have independent uptime or independent
 * response times. Presenting them as twelve separately-monitored processes described an
 * architecture that only exists during `npm run dev:services`.
 *
 * Everything here now comes from `/api/health/ready` and `/api/metrics/summary`. Where a signal
 * does not exist, this page says so. (GAP-021)
 *
 * The three `data-demo` hooks are load-bearing — `DemoMode.tsx` HIGHLIGHTs each in turn on the
 * `/admin/system-health` beat — so they stay on equivalent elements. See CLAUDE.md on demo
 * selectors.
 */

const REFRESH_MS = 15_000;

export default function SystemHealthPage() {
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const r = await observability.readiness();
        if (!cancelled) { setReadiness(r); setError(null); }
      } catch (e: any) {
        if (!cancelled) { setReadiness(null); setError(e?.message || 'Could not reach the API'); }
      }

      try {
        const m = await observability.metrics();
        if (!cancelled) setMetrics(m.data);
      } catch {
        // Requires system.admin. A refusal is correct behaviour, so the section simply reports
        // that rather than being treated as a fault.
        if (!cancelled) setMetrics(null);
      }

      if (!cancelled) setLoading(false);
    }

    poll();
    const interval = setInterval(poll, REFRESH_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const checks = readiness ? Object.entries(readiness.checks) : [];
  const failedRequired = checks.filter(([, c]) => !c.ok && !c.optional);
  const failedOptional = checks.filter(([, c]) => !c.ok && c.optional);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block">← Back to Admin</Link>
      <h1 className="text-3xl font-bold mb-2">System Health</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
        Live from the deployed API. The twelve logical services run in a single container, so what
        is monitored here is that container and the stores it depends on — not twelve independent
        processes.
      </p>

      {/* Summary */}
      <div
        data-demo="health-summary"
        role={failedRequired.length || error ? 'alert' : undefined}
        className={`border rounded-lg p-4 mb-6 flex items-center gap-2 ${
          error || failedRequired.length
            ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800'
            : failedOptional.length
              ? 'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800'
              : loading
                ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                : 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
        }`}
      >
        <span
          aria-hidden="true"
          className={`w-3 h-3 rounded-full flex-shrink-0 ${
            error || failedRequired.length ? 'bg-red-500' : failedOptional.length ? 'bg-amber-500' : loading ? 'bg-gray-400' : 'bg-green-500'
          }`}
        ></span>

        {error ? (
          <span className="font-bold text-red-800 dark:text-red-300">
            API unreachable — {error}
          </span>
        ) : loading ? (
          <span className="font-bold text-gray-700 dark:text-gray-300">Checking…</span>
        ) : failedRequired.length ? (
          <span className="font-bold text-red-800 dark:text-red-300">
            Degraded — {failedRequired.map(([n]) => n).join(', ')} not responding
          </span>
        ) : (
          <span className="font-bold text-green-800 dark:text-green-300">
            {/* Derived from the checks so the headline cannot drift from the list below. */}
            All {checks.length} dependencies responding
          </span>
        )}

        {metrics && !error && (
          <span className="text-sm ml-auto text-gray-600 dark:text-gray-400">
            Error rate: {(metrics.errorRate * 100).toFixed(2)}% • {metrics.totalRequests.toLocaleString('en-GB')} requests this period
          </span>
        )}
      </div>

      {/* Dependencies */}
      <h2 className="text-xl font-bold mb-3">Dependencies</h2>
      <div data-demo="health-services" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {checks.length === 0 ? (
          <p className="text-sm text-gray-500 col-span-full">
            {error ? 'No data — the API did not respond.' : 'Loading…'}
          </p>
        ) : (
          checks.map(([name, check]) => (
            <div key={name} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  aria-hidden="true"
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${check.ok ? 'bg-green-500' : check.optional ? 'bg-amber-500' : 'bg-red-500'}`}
                ></span>
                <span className="font-bold text-sm">{name}</span>
                {check.optional && <span className="text-xs text-gray-400">optional</span>}
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{check.ok ? 'Responding' : 'Down'}</span>
                <span>{check.ms}ms</span>
              </div>
              {check.error && <p className="text-xs text-red-700 mt-1 font-mono break-all">{check.error}</p>}
              {typeof check.dialect === 'string' && (
                <p className="text-xs text-gray-400 mt-1">Dialect: {check.dialect}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Busiest routes, replacing the invented per-service response times. */}
      <h2 className="text-xl font-bold mb-3">Busiest routes</h2>
      <div data-demo="health-incidents" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6">
        {!metrics ? (
          <p className="p-4 text-sm text-gray-500">
            Request metrics require the <code>system.admin</code> permission — per-route volumes and
            error rates tell an attacker which endpoints exist and which are currently failing.
          </p>
        ) : metrics.routes.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No requests recorded yet in this process.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b">
              <tr>
                <th scope="col" className="text-left px-4 py-3">Route</th>
                <th scope="col" className="text-right px-4 py-3">Requests</th>
                <th scope="col" className="text-right px-4 py-3">Server errors</th>
                <th scope="col" className="text-right px-4 py-3">Mean</th>
                <th scope="col" className="text-right px-4 py-3">p95</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {metrics.routes.slice(0, 10).map(r => (
                <tr key={`${r.method} ${r.route}`}>
                  <td className="px-4 py-3 font-mono text-xs"><span className="font-bold">{r.method}</span> {r.route}</td>
                  <td className="px-4 py-3 text-right">{r.count.toLocaleString('en-GB')}</td>
                  <td className={`px-4 py-3 text-right ${r.errors ? 'font-bold text-red-700' : 'text-gray-400'}`}>{r.errors}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{r.avgMs.toFixed(0)}ms</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">≤{r.p95Ms}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/*
        The "Recent Incidents (Last 72h)" table that used to sit here listed three fabricated
        incidents with dates, durations and root causes. Nothing stores incident history, so the
        honest replacement is to say what would be needed rather than to fill the space.
      */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm">
        <h2 className="font-bold mb-1">Incident history is not recorded</h2>
        <p className="text-gray-700 dark:text-gray-300">
          Nothing persists incidents, and the container cannot measure the periods it was not
          running — so a 30-day uptime figure or a "last 72 hours" incident list would have to be
          invented. An external prober against <code>/api/health/ready</code> and a scraper against{' '}
          <code>/api/metrics</code> are what make both real. See{' '}
          <Link href="/admin/monitoring" className="underline text-blue-700 dark:text-blue-400">Monitoring</Link>.
        </p>
      </div>
    </div>
  );
}
