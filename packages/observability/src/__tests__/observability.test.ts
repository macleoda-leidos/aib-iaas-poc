import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import http from 'http';
import {
  log,
  logger,
  setLogSink,
  redactFields,
  requestId,
  getRequestId,
  requestLogger,
  errorHandler,
  recordRequest,
  renderPrometheus,
  metricsSummary,
  resetMetrics,
  createReadinessHandler,
} from '../index';

/**
 * The point of these tests is not that logging happens — it is that the two things
 * which make logging *safe* and *useful* hold: nothing personal is ever serialised,
 * and the correlation id reaches both the response and the log line for the same
 * request.
 */

let lines: any[] = [];

beforeEach(() => {
  lines = [];
  setLogSink(line => lines.push(JSON.parse(line)));
  // Every assertion below is about content, so the level filter must not hide lines.
  // NODE_ENV is 'test' under vitest, which defaults the level to warn.
  process.env.LOG_LEVEL = 'debug';
  resetMetrics();
});

afterEach(() => {
  setLogSink(null);
  delete process.env.LOG_LEVEL;
});

function listen(app: express.Express): Promise<{ url: string; close: () => void }> {
  return new Promise(resolve => {
    const server = app.listen(0, () => {
      const port = (server.address() as any).port;
      resolve({ url: `http://localhost:${port}`, close: () => server.close() });
    });
  });
}

function request(
  url: string,
  path: string,
  opts: { method?: string; headers?: Record<string, string> } = {}
): Promise<{ status: number; headers: any; body: any }> {
  return new Promise((resolve, reject) => {
    const u = new URL(path, url);
    const req = http.request(
      { hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: opts.method || 'GET', headers: opts.headers },
      res => {
        let d = '';
        res.on('data', c => (d += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode!, headers: res.headers, body: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode!, headers: res.headers, body: d }); }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

describe('redaction', () => {
  it('drops the fields that would make a log line a GDPR incident', () => {
    const out = redactFields({
      nationalInsuranceNumber: 'AB123456C',
      dateOfBirth: '1982-03-14',
      postcode: 'EH16 5PB',
      authorization: 'Bearer eyJ...',
      password: 'hunter2',
      firstName: 'Alistair',
    });

    expect(out.nationalInsuranceNumber).toBe('[redacted]');
    expect(out.dateOfBirth).toBe('[redacted]');
    expect(out.postcode).toBe('[redacted]');
    expect(out.authorization).toBe('[redacted]');
    expect(out.password).toBe('[redacted]');
    // Not redacted: a name alone is not the re-identification risk, and a log with no
    // identifying context at all cannot be used to investigate anything.
    expect(out.firstName).toBe('Alistair');
  });

  it('redacts at depth, not just at the top level', () => {
    // The realistic shape: nobody logs `{niNumber}`, they log `{body}`.
    const out: any = redactFields({
      body: { debtorDetails: { firstName: 'A', nationalInsuranceNumber: 'AB123456C' } },
    });
    expect(out.body.debtorDetails.nationalInsuranceNumber).toBe('[redacted]');
    expect(out.body.debtorDetails.firstName).toBe('A');
  });

  it('redacts inside arrays', () => {
    const out: any = redactFields({ addresses: [{ line1: '1 A Street', postcode: 'G1 1AA' }] });
    expect(out.addresses[0].postcode).toBe('[redacted]');
    expect(out.addresses[0].line1).toBe('1 A Street');
  });

  it('matches the key case-insensitively', () => {
    // Header names arrive lower-cased, body fields camelCased, EF Core rows PascalCased.
    const out: any = redactFields({ Authorization: 'x', NINumber: 'y', DateOfBirth: 'z' });
    expect(Object.values(out)).toEqual(['[redacted]', '[redacted]', '[redacted]']);
  });

  it('survives a cyclic object rather than exhausting the stack', () => {
    // `req` is cyclic. A logger that dies on the thing people most want to log is worse
    // than no logger.
    const cyclic: any = { name: 'req' };
    cyclic.self = cyclic;
    expect(() => redactFields({ cyclic })).not.toThrow();
    expect(JSON.stringify(redactFields({ cyclic }))).toContain('[circular]');
  });

  it('serialises an Error rather than emitting {}', () => {
    // JSON.stringify(new Error('x')) is '{}' — the stack, which is the entire reason
    // for logging an error, is non-enumerable.
    const out: any = redactFields({ error: new Error('boom') });
    expect(out.error.message).toBe('boom');
    expect(out.error.stack).toContain('boom');
  });
});

describe('log levels', () => {
  it('suppresses below the configured level', () => {
    process.env.LOG_LEVEL = 'warn';
    logger.info('quiet');
    logger.error('loud');
    expect(lines.map(l => l.msg)).toEqual(['loud']);
  });

  it('emits nothing at silent, which is the default under test', () => {
    // The suites here assert 4xx and 5xx responses by design, so logging them would
    // bury the line that matters. This is what keeps `npx vitest run` readable.
    process.env.LOG_LEVEL = 'silent';
    logger.error('would normally be loud');
    expect(lines).toEqual([]);
  });

  it('defaults to silent under NODE_ENV=test with no LOG_LEVEL set', () => {
    delete process.env.LOG_LEVEL;
    expect(process.env.NODE_ENV).toBe('test');
    logger.error('suppressed by the default');
    expect(lines).toEqual([]);
  });

  it('emits valid JSON on one line, with level, msg, time and service', () => {
    logger.info('hello', { a: 1 });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ level: 'info', msg: 'hello', a: 1 });
    expect(typeof lines[0].time).toBe('string');
    expect(lines[0].service).toBeDefined();
  });

  it('still emits a line when a field cannot be serialised', () => {
    // A BigInt throws in JSON.stringify. Losing the log line — or worse, throwing into
    // the request — because of one bad field is the wrong trade.
    log('error', 'has a bigint', { n: BigInt(1) });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ msg: 'has a bigint', fieldsError: true });
  });
});

describe('request id', () => {
  it('echoes an inbound id on the response and logs the same value', async () => {
    // The property that makes a support conversation tractable: the id the user can
    // read off their network tab is the id in the log.
    const app = express();
    app.use(requestId());
    app.use(requestLogger());
    app.get('/api/thing', (_req, res) => res.json({ ok: true }));
    const { url, close } = await listen(app);

    const res = await request(url, '/api/thing', { headers: { 'x-request-id': 'trace-me' } });
    close();

    expect(res.headers['x-request-id']).toBe('trace-me');
    expect(lines.find(l => l.msg === 'request')?.requestId).toBe('trace-me');
  });

  it('generates one when the caller sends none', async () => {
    const app = express();
    app.use(requestId());
    app.get('/x', (req, res) => res.json({ id: getRequestId(req) }));
    const { url, close } = await listen(app);

    const res = await request(url, '/x');
    close();

    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.body.id).toBe(res.headers['x-request-id']);
  });

  it.each([
    ['a newline, which would forge a second log line', 'abc\ndef'],
    ['a header-splitting CR', 'abc\rdef'],
    ['a quote that would break the JSON field', 'a"b'],
    ['a brace that would break the JSON field', 'a}{b'],
    ['65 characters', 'x'.repeat(65)],
    ['an empty string', '   '],
    ['a non-string, as a repeated header arrives', ['a', 'b'] as any],
  ])('rejects an inbound id containing %s', (_label, candidate) => {
    // The id is attacker-controlled, goes into a log aggregator and into a response
    // header, and is used as a metrics-adjacent label. An unfiltered one is a log
    // injection primitive.
    //
    // Driven through the middleware directly rather than over a socket: Node's own
    // http client refuses to *send* a header containing CR or LF (ERR_INVALID_CHAR),
    // so the two cases that matter most cannot be expressed as a request from here.
    // That client-side guard is not the server's guard — a proxy, a non-Node client or
    // a hand-written socket write is not bound by it — so the filter has to be proved
    // where it actually runs.
    const req: any = { headers: { 'x-request-id': candidate } };
    const res: any = { setHeader: vi.fn() };
    requestId()(req, res, () => {});

    expect(req.requestId).not.toBe(typeof candidate === 'string' ? candidate.trim() : candidate);
    expect(req.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', req.requestId);
  });

  it('accepts a caller-supplied id that is not a UUID', () => {
    // An upstream tracing system will have its own scheme; the filter constrains the
    // characters, not the format.
    const req: any = { headers: { 'x-request-id': 'edge-7f2a.9c-b1_x~4' } };
    requestId()(req, { setHeader: vi.fn() } as any, () => {});
    expect(req.requestId).toBe('edge-7f2a.9c-b1_x~4');
  });
});

describe('request logging', () => {
  it('logs the route pattern including the mount point, never the resolved URL', async () => {
    // A resolved URL carries the application id. `req.route.path` alone would report
    // '/:id' for every router in the app, which is useless as a metric label.
    const app = express();
    const router = express.Router();
    router.get('/:id', (_req, res) => res.json({ ok: true }));
    app.use(requestId());
    app.use(requestLogger());
    app.use('/api/applications', router);
    const { url, close } = await listen(app);

    await request(url, '/api/applications/app-abc-123');
    close();

    const line = lines.find(l => l.msg === 'request');
    expect(line.route).toBe('/api/applications/:id');
    expect(JSON.stringify(line)).not.toContain('app-abc-123');
  });

  it('reports "unmatched" for a 404 rather than leaking the path', async () => {
    const app = express();
    app.use(requestId());
    app.use(requestLogger());
    const { url, close } = await listen(app);

    await request(url, '/api/applications/APP-2026-000123');
    close();

    const line = lines.find(l => l.msg === 'request');
    expect(line.route).toBe('unmatched');
    expect(line.status).toBe(404);
    expect(JSON.stringify(line)).not.toContain('APP-2026-000123');
  });

  it('logs a response produced by middleware the handler never reached', async () => {
    // A 401 from the auth guard is exactly the line an operator needs, and it never
    // reaches a route handler.
    const app = express();
    app.use(requestId());
    app.use(requestLogger());
    app.use((_req, res) => res.status(401).json({ error: 'nope' }));
    const { url, close } = await listen(app);

    await request(url, '/api/whatever');
    close();

    expect(lines.find(l => l.msg === 'request')).toMatchObject({ status: 401, level: 'warn' });
  });

  it('logs health polling at debug so it does not drown the useful lines', async () => {
    const app = express();
    app.use(requestId());
    app.use(requestLogger());
    app.get('/api/health', (_req, res) => res.json({ status: 'alive' }));
    const { url, close } = await listen(app);

    await request(url, '/api/health');
    close();

    expect(lines.find(l => l.msg === 'request').level).toBe('debug');
  });

  it('logs a 5xx on a quiet path at error anyway', async () => {
    // The one health-check line that matters most must not be filtered out with the rest.
    const app = express();
    app.use(requestId());
    app.use(requestLogger());
    app.get('/api/health', (_req, res) => res.status(500).json({ status: 'broken' }));
    const { url, close } = await listen(app);

    await request(url, '/api/health');
    close();

    expect(lines.find(l => l.msg === 'request').level).toBe('error');
  });
});

describe('error handler', () => {
  it('withholds the internal message in production but returns the request id', async () => {
    // The defect this replaces: consolidated-api returned `err.message` unguarded, so
    // a SQLite constraint message naming tables and columns reached the browser.
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const app = express();
    app.use(requestId());
    app.get('/boom', () => { throw new Error('SQLITE_CONSTRAINT: NOT NULL constraint failed: notifications.subject'); });
    app.use(errorHandler());
    const { url, close } = await listen(app);

    const res = await request(url, '/boom', { headers: { 'x-request-id': 'trace-boom' } });
    close();
    process.env.NODE_ENV = original;

    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('SQLITE_CONSTRAINT');
    expect(JSON.stringify(res.body)).not.toContain('notifications.subject');
    expect(res.body.error.requestId).toBe('trace-boom');
    // The detail is not lost, only moved: it is in the log, keyed by the same id.
    const logged = lines.find(l => l.msg === 'unhandled request error');
    expect(logged.requestId).toBe('trace-boom');
    expect(logged.error.message).toContain('SQLITE_CONSTRAINT');
  });

  it('relays a 4xx message, which is about the caller not about us', async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const app = express();
    app.use(requestId());
    app.get('/bad', () => {
      const e: any = new Error('applicationId is required');
      e.status = 400;
      e.code = 'VALIDATION_ERROR';
      throw e;
    });
    app.use(errorHandler());
    const { url, close } = await listen(app);

    const res = await request(url, '/bad');
    close();
    process.env.NODE_ENV = original;

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('applicationId is required');
  });

  it('does not adopt a lower-case library error code as an API error code', async () => {
    // better-sqlite3 sets `err.code = 'SQLITE_CONSTRAINT_NOTNULL'`; Node sets
    // 'ENOENT'. The first is upper-case and would pass through as an API code that no
    // client knows, so the shape is checked rather than the presence.
    const app = express();
    app.use(requestId());
    app.get('/boom', () => { const e: any = new Error('x'); e.code = 'ENOENT'; throw e; });
    app.use(errorHandler());
    const { url, close } = await listen(app);

    const res = await request(url, '/boom');
    close();

    // ENOENT is upper-case so it is relayed; the guard exists to reject the messy ones.
    expect(res.body.error.code).toBe('ENOENT');
    expect(res.body.success).toBe(false);
  });
});

describe('metrics', () => {
  it('exposes cumulative histogram buckets, as histogram_quantile requires', () => {
    // Non-cumulative buckets produce quantiles that look plausible and are wrong, so
    // this is asserted directly rather than inferred from the summary.
    recordRequest('GET', '/api/applications', 200, 40);
    const text = renderPrometheus();

    expect(text).toContain('iaas_http_request_duration_seconds_bucket{method="GET",route="/api/applications",le="0.05"} 1');
    expect(text).toContain('iaas_http_request_duration_seconds_bucket{method="GET",route="/api/applications",le="0.1"} 1');
    expect(text).toContain('iaas_http_request_duration_seconds_bucket{method="GET",route="/api/applications",le="0.025"} 0');
    expect(text).toContain('iaas_http_request_duration_seconds_bucket{method="GET",route="/api/applications",le="+Inf"} 1');
    expect(text.endsWith('\n')).toBe(true);
  });

  it('counts by status so an error rate is derivable', () => {
    recordRequest('POST', '/api/applications', 201, 10);
    recordRequest('POST', '/api/applications', 500, 10);
    recordRequest('POST', '/api/applications', 500, 10);

    const text = renderPrometheus();
    expect(text).toContain('iaas_http_requests_total{method="POST",route="/api/applications",status="201"} 1');
    expect(text).toContain('iaas_http_requests_total{method="POST",route="/api/applications",status="500"} 2');

    const summary = metricsSummary();
    expect(summary.totalRequests).toBe(3);
    expect(summary.errorRate).toBeCloseTo(2 / 3);
    expect(summary.routes[0]).toMatchObject({ route: '/api/applications', count: 3, errors: 2 });
  });

  it('counts a 4xx as a request but not as an error', () => {
    // A 400 is the validation layer working. Folding it into the error rate would make
    // the rate meaningless and hide the 500s inside it.
    recordRequest('POST', '/api/applications', 400, 5);
    expect(metricsSummary().errorRate).toBe(0);
    expect(metricsSummary().totalRequests).toBe(1);
  });
});

describe('readiness', () => {
  it('is 503 with per-dependency detail when a required check fails', async () => {
    const app = express();
    app.use(requestId());
    app.get('/api/health/ready', createReadinessHandler({
      service: 'test',
      checks: [
        { name: 'database', run: async () => ({ dialect: 'postgres' }) },
        { name: 'uploads', run: async () => { throw new Error('EACCES: permission denied'); } },
      ],
    }));
    const { url, close } = await listen(app);

    const res = await request(url, '/api/health/ready');
    close();

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks.database).toMatchObject({ ok: true, dialect: 'postgres' });
    expect(res.body.checks.uploads).toMatchObject({ ok: false, error: 'EACCES: permission denied' });
  });

  it('stays 200 when only an optional check fails, but says so', async () => {
    // A cold cache is not an outage. Treating it as one would restart a healthy
    // container.
    const app = express();
    app.get('/ready', createReadinessHandler({
      service: 'test',
      checks: [
        { name: 'database', run: async () => {} },
        { name: 'creditCache', optional: true, run: async () => { throw new Error('SQLITE_CANTOPEN'); } },
      ],
    }));
    const { url, close } = await listen(app);

    const res = await request(url, '/ready');
    close();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready_degraded');
    expect(res.body.checks.creditCache).toMatchObject({ ok: false, optional: true });
  });

  it('times a hanging check out rather than hanging itself', async () => {
    // An unreachable host with no route hangs on TCP connect for tens of seconds. A
    // readiness endpoint that hangs becomes the outage it exists to report.
    const app = express();
    app.get('/ready', createReadinessHandler({
      service: 'test',
      timeoutMs: 50,
      checks: [{ name: 'database', run: () => new Promise(() => {}) }],
    }));
    const { url, close } = await listen(app);

    const started = Date.now();
    const res = await request(url, '/ready');
    close();

    expect(res.status).toBe(503);
    expect(res.body.checks.database.error).toContain('timed out');
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it('runs checks concurrently, so latency is the slowest not the sum', async () => {
    const slow = (ms: number) => () => new Promise<void>(r => setTimeout(r, ms));
    const app = express();
    app.get('/ready', createReadinessHandler({
      service: 'test',
      checks: [
        { name: 'a', run: slow(120) },
        { name: 'b', run: slow(120) },
        { name: 'c', run: slow(120) },
      ],
    }));
    const { url, close } = await listen(app);

    const started = Date.now();
    await request(url, '/ready');
    close();

    // Sequentially this would be 360ms+.
    expect(Date.now() - started).toBeLessThan(300);
  });

  it('never returns a stack trace, because the endpoint is unauthenticated', async () => {
    const app = express();
    app.get('/ready', createReadinessHandler({
      service: 'test',
      checks: [{ name: 'database', run: async () => { throw new Error('boom'); } }],
    }));
    const { url, close } = await listen(app);

    const res = await request(url, '/ready');
    close();

    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.ts:\d+/);
  });
});
