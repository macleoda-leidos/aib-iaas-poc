/**
 * In-process request counters and latency histogram, exposed in Prometheus text
 * format.
 *
 * Scope, stated honestly: this is per-process and resets on restart. On Render's free
 * plan the container spins down after 15 minutes idle, so these counters describe the
 * current wake period and nothing longer. That is still the difference between
 * "somebody is getting 500s on POST /api/applications" and no information at all,
 * which is where this started. A durable time series needs a scraper outside the
 * process, and the endpoint exists so one can be pointed at it later.
 *
 * Labels are route *patterns* (`/api/applications/:id`), never resolved URLs. A
 * resolved URL carries an application id, and a metrics endpoint is the last place
 * that should become a case-reference oracle — it is also why cardinality stays
 * bounded, which is the practical reason Prometheus users are told the same thing.
 */

/** Seconds. The default Prometheus web bucket set, which alerting rules assume. */
const BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

interface RouteStats {
  /** Keyed by status code. */
  counts: Map<number, number>;
  /** Cumulative bucket counts, parallel to BUCKETS, plus +Inf as the final entry. */
  buckets: number[];
  sumSeconds: number;
  total: number;
}

const routes = new Map<string, RouteStats>();
let startedAt = Date.now();

function statsFor(key: string): RouteStats {
  let s = routes.get(key);
  if (!s) {
    s = { counts: new Map(), buckets: new Array(BUCKETS.length + 1).fill(0), sumSeconds: 0, total: 0 };
    routes.set(key, s);
  }
  return s;
}

export function recordRequest(method: string, route: string, status: number, durationMs: number): void {
  const s = statsFor(`${method} ${route}`);
  s.counts.set(status, (s.counts.get(status) ?? 0) + 1);
  s.total += 1;

  const seconds = durationMs / 1000;
  s.sumSeconds += seconds;
  // Cumulative: a 40ms request increments every bucket from 0.05 upward, which is what
  // histogram_quantile() expects. Getting this wrong produces quantiles that look
  // plausible and are wrong, so it is asserted directly in the tests.
  for (let i = 0; i < BUCKETS.length; i++) {
    if (seconds <= BUCKETS[i]) s.buckets[i] += 1;
  }
  s.buckets[BUCKETS.length] += 1;
}

/** Escape a Prometheus label value. Route patterns contain no quotes today, but a future one might. */
function label(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

export function renderPrometheus(): string {
  const lines: string[] = [];

  lines.push('# HELP iaas_process_uptime_seconds Seconds since this process started serving.');
  lines.push('# TYPE iaas_process_uptime_seconds gauge');
  lines.push(`iaas_process_uptime_seconds ${((Date.now() - startedAt) / 1000).toFixed(3)}`);

  lines.push('# HELP iaas_http_requests_total Completed HTTP requests.');
  lines.push('# TYPE iaas_http_requests_total counter');
  for (const [key, s] of routes) {
    const [method, ...rest] = key.split(' ');
    const route = rest.join(' ');
    for (const [status, count] of s.counts) {
      lines.push(
        `iaas_http_requests_total{method="${label(method)}",route="${label(route)}",status="${status}"} ${count}`
      );
    }
  }

  lines.push('# HELP iaas_http_request_duration_seconds Request latency.');
  lines.push('# TYPE iaas_http_request_duration_seconds histogram');
  for (const [key, s] of routes) {
    const [method, ...rest] = key.split(' ');
    const route = rest.join(' ');
    const common = `method="${label(method)}",route="${label(route)}"`;
    for (let i = 0; i < BUCKETS.length; i++) {
      lines.push(`iaas_http_request_duration_seconds_bucket{${common},le="${BUCKETS[i]}"} ${s.buckets[i]}`);
    }
    lines.push(`iaas_http_request_duration_seconds_bucket{${common},le="+Inf"} ${s.buckets[BUCKETS.length]}`);
    lines.push(`iaas_http_request_duration_seconds_sum{${common}} ${s.sumSeconds.toFixed(6)}`);
    lines.push(`iaas_http_request_duration_seconds_count{${common}} ${s.total}`);
  }

  // Prometheus requires a trailing newline; omitting it makes some scrapers drop the
  // final sample without complaining.
  return lines.join('\n') + '\n';
}

/**
 * A shape the admin pages can render without parsing the exposition format. The
 * /admin/monitoring page previously showed hard-coded uptime figures it had not
 * measured; this is what replaces them.
 */
export function metricsSummary(): {
  uptimeSeconds: number;
  totalRequests: number;
  errorRate: number;
  routes: Array<{ method: string; route: string; count: number; errors: number; p50Ms: number; p95Ms: number; avgMs: number }>;
} {
  let totalRequests = 0;
  let totalErrors = 0;
  const out: ReturnType<typeof metricsSummary>['routes'] = [];

  for (const [key, s] of routes) {
    const [method, ...rest] = key.split(' ');
    const errors = [...s.counts].reduce((n, [status, count]) => (status >= 500 ? n + count : n), 0);
    totalRequests += s.total;
    totalErrors += errors;
    out.push({
      method,
      route: rest.join(' '),
      count: s.total,
      errors,
      p50Ms: quantileMs(s, 0.5),
      p95Ms: quantileMs(s, 0.95),
      avgMs: s.total ? (s.sumSeconds / s.total) * 1000 : 0,
    });
  }

  out.sort((a, b) => b.count - a.count);
  return {
    uptimeSeconds: (Date.now() - startedAt) / 1000,
    totalRequests,
    errorRate: totalRequests ? totalErrors / totalRequests : 0,
    routes: out,
  };
}

/**
 * Bucket-boundary estimate, reported as the upper edge of the bucket the quantile
 * falls in. Not interpolated: an interpolated figure from 11 buckets reads as more
 * precise than it is, and "p95 is at most 250ms" is the honest statement.
 */
function quantileMs(s: RouteStats, q: number): number {
  if (!s.total) return 0;
  const target = q * s.total;
  for (let i = 0; i < BUCKETS.length; i++) {
    if (s.buckets[i] >= target) return BUCKETS[i] * 1000;
  }
  return BUCKETS[BUCKETS.length - 1] * 1000;
}

/** Tests only — the counters are module state and would otherwise leak between cases. */
export function resetMetrics(): void {
  routes.clear();
  startedAt = Date.now();
}
