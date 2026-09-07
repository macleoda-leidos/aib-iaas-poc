import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorHandler, setLogSink } from '@aib-iaas/observability';
import { Request, Response, NextFunction } from 'express';

/**
 * The gateway's error-envelope contract, now served by the shared handler in
 * `@aib-iaas/observability` rather than a per-service copy.
 *
 * Why the copy went: there were two of them and they disagreed. This one guarded the
 * message on NODE_ENV; the one in `services/consolidated-api/src/index.ts` — the only
 * artefact that actually deploys — did not, so a SQLite constraint violation put the
 * table name, the column name and sometimes the offending value into the browser in
 * production. Several other services mounted no handler at all and fell through to
 * Express's default HTML stack trace.
 *
 * These cases stay here because they pin the contract *clients* depend on. The
 * handler's own behaviour is covered in packages/observability.
 */

let lines: any[] = [];

function mockResponse(): Response {
  const res: any = {};
  res.headersSent = false;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

const handle = errorHandler();
const mockReq = { method: 'GET', headers: {} } as Request;
const mockNext: NextFunction = vi.fn();

beforeEach(() => {
  lines = [];
  setLogSink(line => lines.push(JSON.parse(line)));
});

afterEach(() => setLogSink(null));

describe('Error Handler Middleware', () => {
  it('returns 500 status with INTERNAL_ERROR code', () => {
    const res = mockResponse();
    handle(new Error('Something went wrong'), mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({ code: 'INTERNAL_ERROR' }),
    }));
  });

  it('exposes error message in non-production environment', () => {
    const res = mockResponse();
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    handle(new Error('Detailed error info'), mockReq, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ message: 'Detailed error info' }),
    }));
    process.env.NODE_ENV = origEnv;
  });

  it('hides error message in production environment', () => {
    const res = mockResponse();
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    handle(new Error('Secret details'), mockReq, res, mockNext);

    const body = (res.json as any).mock.calls[0][0];
    expect(body.error.message).not.toContain('Secret details');
    expect(body.error.message).toContain('unexpected error');
    process.env.NODE_ENV = origEnv;
  });

  it('logs the withheld detail, so it is moved rather than lost', () => {
    // The reason hiding the message is acceptable: an operator can still find it. The
    // previous handler did `console.error(err.message, err.stack)`, which is
    // unsearchable and uncorrelatable.
    const res = mockResponse();
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.LOG_LEVEL = 'debug';

    handle(new Error('SQLITE_CONSTRAINT: NOT NULL failed: notifications.subject'), mockReq, res, mockNext);

    const logged = lines.find(l => l.msg === 'unhandled request error');
    expect(logged.error.message).toContain('SQLITE_CONSTRAINT');
    expect(logged.error.stack).toBeDefined();

    process.env.NODE_ENV = origEnv;
    delete process.env.LOG_LEVEL;
  });

  it('always returns success: false', () => {
    const res = mockResponse();
    handle(new Error('any'), mockReq, res, mockNext);
    expect((res.json as any).mock.calls[0][0].success).toBe(false);
  });
});
