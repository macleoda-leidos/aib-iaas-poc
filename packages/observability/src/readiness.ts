import type { Request, Response, RequestHandler } from 'express';
import { log } from './logger';
import { getRequestId } from './requestId';

/**
 * Readiness probing, kept separate from liveness on purpose.
 *
 * `/api/health` returned a static object literal, and `render.yaml` names it as
 * `healthCheckPath` for both deployed services. So the only signal the platform ever
 * had was "the process is listening" — a container whose database was unreachable and
 * which was answering 500 to every real request was indistinguishable from a working
 * one, and Render never restarted it.
 *
 * The fix is *not* to make `/api/health` fail. On Render's free plan a failing health
 * check fails the deploy, and a Neon instance waking from idle can take several
 * seconds — so a database-probing liveness endpoint would turn a cold start into a
 * failed deployment, most likely while a demo was starting. Liveness and readiness
 * answer different questions and need different endpoints:
 *
 *   /api/health        is this process alive?          -> always 200, stays the platform probe
 *   /api/health/ready  can it actually serve traffic?  -> 503 with per-dependency detail
 *
 * Readiness is what a monitoring page, an alert, or a load balancer should read.
 */

export interface ReadinessCheck {
  name: string;
  /**
   * Resolve with optional detail, or throw. Detail is merged into the check's result,
   * so a probe can report the dialect it connected to or whether a path was writable.
   */
  run: () => Promise<Record<string, unknown> | void>;
  /**
   * A failing check that does not make the service unready — a cache, typically. It
   * still appears in the response and still logs, but does not produce a 503.
   * Defaults to false, because failing open is how GAP-020 happened.
   */
  optional?: boolean;
}

export interface CheckResult {
  ok: boolean;
  ms: number;
  optional?: boolean;
  error?: string;
  [detail: string]: unknown;
}

/**
 * Per-check ceiling. Without it an unreachable host with no route (rather than an
 * active refusal) hangs on TCP connect for the platform default — tens of seconds —
 * and the readiness endpoint becomes the outage it was meant to report.
 */
const DEFAULT_TIMEOUT_MS = 3000;

async function runCheck(check: ReadinessCheck, timeoutMs: number): Promise<CheckResult> {
  const started = Date.now();
  try {
    const detail = await Promise.race([
      check.run(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`timed out after ${timeoutMs}ms`)), timeoutMs).unref?.()
      ),
    ]);
    return { ok: true, ms: Date.now() - started, ...(detail || {}) };
  } catch (e: any) {
    return {
      ok: false,
      ms: Date.now() - started,
      ...(check.optional ? { optional: true } : {}),
      // The message only, never the stack: this endpoint is reachable without
      // authentication so that a load balancer can poll it.
      error: e?.message ? String(e.message).slice(0, 200) : 'check failed',
    };
  }
}

export interface ReadinessOptions {
  service: string;
  checks: ReadinessCheck[];
  timeoutMs?: number;
}

export function createReadinessHandler(options: ReadinessOptions): RequestHandler {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return async (req: Request, res: Response) => {
    // Concurrently, so the endpoint's latency is the slowest check rather than their
    // sum. Every probe already has its own timeout, so this cannot exceed it.
    const settled = await Promise.all(options.checks.map(c => runCheck(c, timeoutMs)));

    const checks: Record<string, CheckResult> = {};
    options.checks.forEach((c, i) => (checks[c.name] = settled[i]));

    const failedRequired = options.checks.filter((c, i) => !c.optional && !settled[i].ok);
    const failedOptional = options.checks.filter((c, i) => c.optional && !settled[i].ok);
    const ready = failedRequired.length === 0;

    if (!ready || failedOptional.length) {
      log(ready ? 'warn' : 'error', 'readiness check failed', {
        requestId: getRequestId(req),
        failed: [...failedRequired, ...failedOptional].map(c => c.name),
        checks,
      });
    }

    res.status(ready ? 200 : 503).json({
      status: ready ? (failedOptional.length ? 'ready_degraded' : 'ready') : 'degraded',
      service: options.service,
      checks,
      timestamp: new Date().toISOString(),
    });
  };
}
