import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { log } from './logger';
import { getRequestId } from './requestId';

/**
 * The terminal error handler, shared by every service.
 *
 * Two defects it replaces:
 *
 *  - `services/consolidated-api/src/index.ts` returned `err.message` with **no
 *    NODE_ENV guard**, so a SQLite constraint message — table name, column name,
 *    sometimes the offending value — reached the browser in production. The
 *    api-gateway copy guarded it correctly, which is precisely the problem with
 *    having two copies.
 *  - Several services (notification, credit-check) mounted no error handler at all,
 *    so a synchronous `better-sqlite3` throw fell through to Express's default
 *    handler, which renders an HTML stack trace.
 *
 * The request id is returned to the caller as well as logged. Without it "the site
 * gave me an error" is unactionable; with it a support conversation reduces to one
 * log query.
 */

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

/** Errors may carry a status and code; `http-errors`-style and hand-thrown both work. */
interface MaybeHttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  expose?: boolean;
}

function statusOf(err: MaybeHttpError): number {
  const candidate = err.status ?? err.statusCode;
  return typeof candidate === 'number' && candidate >= 400 && candidate <= 599 ? candidate : 500;
}

export function errorHandler(): ErrorRequestHandler {
  return (err: MaybeHttpError, req: Request, res: Response, next: NextFunction) => {
    // Headers already sent means a stream failed mid-response; there is no envelope
    // left to write, and attempting one throws over the original error.
    if (res.headersSent) {
      log('error', 'error after response started', {
        requestId: getRequestId(req),
        error: err,
      });
      return next(err);
    }

    const status = statusOf(err);
    const requestId = getRequestId(req);

    log(status >= 500 ? 'error' : 'warn', 'unhandled request error', {
      status,
      method: req.method,
      // The route pattern is not available here for errors thrown before routing, and
      // req.path carries identifiers, so only the method and status are reported. The
      // stack names the code.
      requestId,
      error: err,
    });

    // A 4xx is a statement about the caller's request and is safe to relay. A 5xx is a
    // statement about our internals, so only the request id crosses the boundary
    // outside development.
    const safeMessage =
      status < 500 || process.env.NODE_ENV !== 'production'
        ? err.message
        : 'An unexpected error occurred. Quote the request id when reporting this.';

    const body: ErrorEnvelope = {
      success: false,
      error: {
        code: typeof err.code === 'string' && /^[A-Z_]+$/.test(err.code) ? err.code : 'INTERNAL_ERROR',
        message: safeMessage,
        requestId,
      },
    };

    res.status(status).json(body);
  };
}
