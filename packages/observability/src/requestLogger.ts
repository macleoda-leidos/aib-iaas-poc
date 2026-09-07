import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { log } from './logger';
import { getRequestId } from './requestId';
import { recordRequest } from './metrics';

/**
 * One structured line per completed request, and one metrics sample.
 *
 * Logged on `res.on('finish')` rather than around `next()`, because Express handlers
 * are asynchronous and returning from `next()` says nothing about when the response
 * was written. `finish` also fires for responses produced by middleware the handler
 * never reached — a 401 from the auth guard, a 429 from the rate limiter — which are
 * exactly the ones an operator needs to see.
 */

/**
 * The route *pattern*, not the URL.
 *
 * `req.route.path` is relative to the router's mount point, so `/:id` on a router
 * mounted at `/api/applications` needs `req.baseUrl` prepended or every service's
 * routes collapse into a handful of indistinguishable keys. Where there is no route
 * at all (a 404, or a response written by middleware before routing) there is no
 * pattern to report, and the raw path cannot be substituted: it contains application
 * ids, user ids and reference numbers, and this string goes into both a log
 * aggregator and a metrics label. `unmatched` is the honest answer, and the status
 * code already says what happened.
 */
function routePattern(req: Request): string {
  const route = (req as Request & { route?: { path?: string } }).route;
  if (route?.path) {
    const base = req.baseUrl || '';
    const path = route.path === '/' ? '' : route.path;
    return (base + path) || '/';
  }
  return 'unmatched';
}

/** Populated by the auth guard when the caller is authenticated; absent otherwise. */
function callerId(req: Request): string | undefined {
  return (req as Request & { user?: { userId?: string } }).user?.userId;
}

export interface RequestLoggerOptions {
  /**
   * Paths logged at debug rather than info. Render polls /api/health every few
   * seconds; at info that is the overwhelming majority of the log volume and it
   * drowns the lines someone is actually looking for.
   */
  quietPaths?: string[];
}

export function requestLogger(options: RequestLoggerOptions = {}): RequestHandler {
  const quiet = new Set(options.quietPaths ?? ['/api/health', '/api/health/ready', '/api/metrics']);

  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      const route = routePattern(req);

      recordRequest(req.method, route, res.statusCode, durationMs);

      // Server errors are always worth a line even on a quiet path — a health check
      // returning 500 is the single most important thing this could tell anyone.
      const level =
        res.statusCode >= 500 ? 'error' : quiet.has(req.path) ? 'debug' : res.statusCode >= 400 ? 'warn' : 'info';

      log(level, 'request', {
        method: req.method,
        route,
        status: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        requestId: getRequestId(req),
        userId: callerId(req),
        // Useful for spotting a client stuck in a retry loop; not personal data.
        userAgent: req.headers['user-agent'],
      });
    });

    next();
  };
}
