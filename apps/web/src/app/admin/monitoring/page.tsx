'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { observability, type Readiness, type MetricsSummary } from '../../../lib/apiClient';

/**
 * Monitoring, reading real data.
 *
 * What this replaced was the "observability that is a page" problem in its purest form: a
 * 112-line file of hard-coded arrays. It reported uptime figures nothing had measured
 * ("99.97%", "98.2%", "12s ago"), an alert history with specific timestamps for incidents that
 * never happened, and — worst — a "Recent Traces (OpenTelemetry → Grafana Cloud)" table with
 * five trace ids, naming infrastructure that does not exist and has never been configured. A
 * footer stated the free-tier limits of both products as though they were in use.
 *
 * A dashboard that invents its own numbers is worse than no dashboard, because someone will
 * make a decision on it. Everything here now comes from `/api/health/ready` and
 * `/api/metrics/summary`, and where a signal genuinely does not exist this page says so rather
 * than filling the space. (GAP-021)
 */

/** Poll interval. Slow enough not to be its own load, fast enough to be a live view. */
const REFRESH_MS = 15_000;

type Loaded<T> = { state: 'loading' } | { state: 'ok'; data: T } | { state: 'error'; message: string };

export default function MonitoringPage() {
  const [readiness, setReadiness] = useState<Loaded<Readiness>>({ state: 'loading' });
  const [metrics, setMetrics] = useState<Loaded<MetricsSummary>>({ state: 'loading' });
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const r = await observability.readiness();
        if (!cancelled) setReadiness({ state: 'ok', data: r });
      } catch (e: any) {
        // The API being unreachable is itself the most important thing this page can report,
        // so it is rendered rather than swallowed.
        if (!cancelled) setReadiness({ state: 'error', message: e?.message || 'Could not reach the API' });
      }

      try {
        const m = await observability.metrics();
        if (!cancelled) setMetrics({ state: 'ok', data: m.data });
      } catch (e: any) {
        // Metrics need `system.admin`; a 403 here is correct behaviour, not a fault.
        if (!cancelled) setMetrics({ state: 'error', message: e?.code === 'FORBIDDEN' ? 'forbidden' : (e?.message || 'unavailable') });
      }

      if (!cancelled) setLastChecked(new Date());
    }

    poll();
    const interval = setInterval(poll, REFRESH_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block">← Back to Admin</Link>
      <h1 className="text-3xl font-bold mb-2">Monitoring &amp; Observability</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Live readiness and request metrics from the deployed API. Figures on this page are measured,
        not illustrative.
      </p>

      <OverallStatus readiness={readiness} lastChecked={lastChecked} />
      <DependencyChecks readiness={readiness} />
      <RouteMetrics metrics={metrics} />
      <WhatIsNotHere />
    </div>
  );
}

function OverallStatus({ readiness, lastChecked }: { readiness: Loaded<Readiness>; lastChecked: Date | null }) {
  if (readiness.state === 'loading') {
    return <Banner tone="neutral" title="Checking…" detail="Reading /api/health/ready" />;
  }

  if (readiness.state === 'error') {
    return (
      <Banner
        tone="bad"
        title="The API could not be reached"
        detail={`${readiness.message}. On the free plan this is most often a cold start — the container spins down after 15 minutes idle and takes around 30 seconds to wake.`}
      />
    );
  }

  const { status, checks } = readiness.data;
  const failed = Object.entries(checks).filter(([, c]) => !c.ok);
  const stamp = lastChecked ? `Checked ${lastChecked.toLocaleTimeString('en-GB')}` : '';

  if (status === 'ready') {
    return <Banner tone="good" title="Ready — every dependency responding" detail={stamp} />;
  }

  return (
    <Banner
      tone={status === 'degraded' ? 'bad' : 'warn'}
      title={status === 'degraded' ? 'Degraded — not serving normally' : 'Ready, with a non-critical dependency down'}
      detail={`${failed.map(([name]) => name).join(', ')} failing. ${stamp}`}
    />
  );
}

function Banner({ tone, title, detail }: { tone: 'good' | 'warn' | 'bad' | 'neutral'; title: string; detail?: string }) {
  const styles = {
    good: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
    warn: 'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300',
    bad: 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300',
    neutral: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
  }[tone];

  const dot = { good: 'bg-green-500', warn: 'bg-amber-500', bad: 'bg-red-500', neutral: 'bg-gray-400' }[tone];

  return (
    <div role={tone === 'bad' ? 'alert' : undefined} className={`border rounded-lg p-4 mb-6 flex items-center gap-3 ${styles}`}>
      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dot}`} aria-hidden="true"></span>
      <span className="font-bold">{title}</span>
      {detail && <span className="text-xs ml-auto text-right">{detail}</span>}
    </div>
  );
}

function DependencyChecks({ readiness }: { readiness: Loaded<Readiness> }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-bold">Dependency checks</h2>
        <p className="text-xs text-gray-500 mt-1">
          From <code>/api/health/ready</code>. Each is probed on every request to that endpoint —
          the database with <code>SELECT 1</code>, the uploads directory by actually writing and
          deleting a file, because permission bits can say yes on a read-only mount.
        </p>
      </div>

      {readiness.state !== 'ok' ? (
        <p className="p-4 text-sm text-gray-500">No readiness data.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b">
            <tr>
              <th scope="col" className="text-left px-4 py-2">Dependency</th>
              <th scope="col" className="text-center px-4 py-2">Status</th>
              <th scope="col" className="text-right px-4 py-2">Latency</th>
              <th scope="col" className="text-left px-4 py-2">Detail</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(readiness.data.checks).map(([name, check]) => (
              <tr key={name} className="border-b border-gray-100 dark:border-gray-700">
                <td className="px-4 py-3 font-medium">
                  {name}
                  {check.optional && <span className="text-xs text-gray-400 ml-2">(optional)</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${check.ok ? 'bg-green-100 text-green-800' : check.optional ? 'bg-amber-100 text-amber-900' : 'bg-red-100 text-red-800'}`}>
                    {check.ok ? '● up' : '● down'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">{check.ms}ms</td>
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                  {check.error
                    ? check.error
                    : Object.entries(check)
                        .filter(([k]) => !['ok', 'ms', 'optional', 'error'].includes(k))
                        .map(([k, v]) => `${k}=${v}`)
                        .join(' ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function RouteMetrics({ metrics }: { metrics: Loaded<MetricsSummary> }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-bold">Request metrics</h2>
        <p className="text-xs text-gray-500 mt-1">
          From <code>/api/metrics/summary</code>. Labelled by route <em>pattern</em>, never by
          resolved URL — a URL carries application ids, and this is not a place to leak case
          references. In-process, so these reset on restart: on the free plan that means the
          current wake period and nothing longer.
        </p>
      </div>

      {metrics.state === 'loading' && <p className="p-4 text-sm text-gray-500">Loading…</p>}

      {metrics.state === 'error' && (
        <p className="p-4 text-sm text-gray-500">
          {metrics.message === 'forbidden'
            ? 'Metrics require the system.admin permission. Route volumes and error rates tell an attacker which endpoints exist and which are failing, so the endpoint is guarded.'
            : `Metrics unavailable: ${metrics.message}`}
        </p>
      )}

      {metrics.state === 'ok' && (
        <>
          <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700 border-b border-gray-200 dark:border-gray-700">
            <Stat label="Requests this period" value={metrics.data.totalRequests.toLocaleString('en-GB')} />
            <Stat
              label="Server error rate"
              value={`${(metrics.data.errorRate * 100).toFixed(2)}%`}
              tone={metrics.data.errorRate > 0.01 ? 'bad' : 'good'}
            />
            <Stat label="Process uptime" value={formatUptime(metrics.data.uptimeSeconds)} />
          </div>

          {metrics.data.routes.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">
              No requests recorded yet in this process.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                <tr>
                  <th scope="col" className="text-left px-4 py-2">Route</th>
                  <th scope="col" className="text-right px-4 py-2">Requests</th>
                  <th scope="col" className="text-right px-4 py-2">5xx</th>
                  <th scope="col" className="text-right px-4 py-2">Mean</th>
                  <th scope="col" className="text-right px-4 py-2">p50</th>
                  <th scope="col" className="text-right px-4 py-2">p95</th>
                </tr>
              </thead>
              <tbody>
                {metrics.data.routes.slice(0, 25).map(r => (
                  <tr key={`${r.method} ${r.route}`} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="px-4 py-2 font-mono text-xs">
                      <span className="font-bold">{r.method}</span> {r.route}
                    </td>
                    <td className="px-4 py-2 text-right">{r.count.toLocaleString('en-GB')}</td>
                    <td className={`px-4 py-2 text-right ${r.errors ? 'font-bold text-red-700' : 'text-gray-400'}`}>{r.errors}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">{r.avgMs.toFixed(0)}ms</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">≤{r.p50Ms}ms</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">≤{r.p95Ms}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {metrics.data.routes.length > 25 && (
            // Stated rather than silently truncated: a table that stops at 25 with no note reads
            // as "these are all the routes".
            <p className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700">
              Showing the 25 busiest of {metrics.data.routes.length} routes. Full set at{' '}
              <code>/api/metrics</code>.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="p-4 text-center">
      <p className={`text-2xl font-bold ${tone === 'bad' ? 'text-red-700' : ''}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

/**
 * What this page cannot show, said out loud.
 *
 * The version this replaced filled these gaps with invented data — a trace table attributed to
 * "OpenTelemetry → Grafana Cloud", neither of which is configured, and an alert history of
 * incidents that did not occur. Naming the gap is the honest form of the same information, and
 * it is also the accurate statement of what would be needed to close it.
 */
function WhatIsNotHere() {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm">
      <h2 className="font-bold mb-2">Not available, and why</h2>
      <ul className="space-y-1.5 text-gray-700 dark:text-gray-300 list-disc pl-5">
        <li>
          <strong>Uptime over 30 days.</strong> Requires a prober outside the process, because the
          container cannot measure the periods it was not running. Point an external monitor at{' '}
          <code>/api/health/ready</code> — not <code>/api/health</code>, which is a liveness probe
          and cannot fail by design.
        </li>
        <li>
          <strong>Distributed tracing.</strong> No OpenTelemetry instrumentation exists. Requests
          do carry an <code>x-request-id</code> that appears in every log line and error response,
          which is enough to follow one request end to end in the Render logs, but it is not spans
          and it will not give you a flame graph.
        </li>
        <li>
          <strong>Alert history.</strong> Nothing stores incidents. Render emails on deploy
          failures and crashes; anything application-level needs an alerting rule against the 503
          from <code>/api/health/ready</code> or the 5xx counter at <code>/api/metrics</code>.
        </li>
        <li>
          <strong>Long-run metrics.</strong> The counters above are in-process and reset when the
          container spins down after 15 minutes idle. A Prometheus-compatible scraper against{' '}
          <code>/api/metrics</code> is what makes them durable.
        </li>
      </ul>
    </div>
  );
}
