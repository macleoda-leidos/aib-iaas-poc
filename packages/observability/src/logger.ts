/**
 * Structured logging, as one JSON object per line on stdout.
 *
 * Why zero dependencies rather than pino: Render and Azure both ingest stdout and
 * parse JSON lines, so the transport is already provided by the platform. What was
 * actually missing was a *shape* — the whole of the previous logging was
 * `console.error('[API Error]', err.message)`, which cannot be filtered, correlated
 * or alerted on. That gap closes with a serialiser and a field convention, not with a
 * dependency, and this matches the precedent set by packages/auth.
 *
 * Why redaction is not optional: the moment anything logs a request body, this
 * process starts writing names, dates of birth and National Insurance numbers into a
 * platform log aggregator with its own retention, in a system whose entire subject
 * matter is people in financial difficulty. Redaction therefore lives in the
 * serialiser, where it applies to every call site including the ones nobody has
 * written yet, rather than being each caller's responsibility to remember.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/** `silent` is above every emitted level, so nothing passes the filter. */
const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

/**
 * Keys whose values never reach the log, matched case-insensitively at any depth.
 *
 * Deliberately keyed on the *name* rather than the value: a value-based rule (e.g. a
 * regex for NI-number-shaped strings) fails on the field that matters most, because a
 * partially typed NI number is still personal data and does not match the pattern.
 *
 * `dateOfBirth` and `postcode` are here because together with a surname they are
 * enough to re-identify someone, which is the test the ICO applies rather than
 * whether a field feels sensitive on its own.
 */
const REDACTED_KEYS = new Set(
  [
    'authorization',
    'cookie',
    'set-cookie',
    'password',
    'passwordhash',
    'token',
    'accesstoken',
    'refreshtoken',
    'jwt',
    'jti',
    'secret',
    'privatekey',
    'apikey',
    'nationalinsurancenumber',
    'ninumber',
    'nino',
    'dateofbirth',
    'dob',
    'postcode',
    'bankaccountnumber',
    'sortcode',
  ].map(k => k.toLowerCase())
);

const REDACTION = '[redacted]';

/**
 * Depth limit on the walk. A cyclic structure — an Express `req`, most obviously —
 * would otherwise recurse until the stack gave out, turning a log call into an
 * outage. Anything past this depth is summarised rather than expanded, because a log
 * line nested eight levels deep is not being read by anyone anyway.
 */
const MAX_DEPTH = 6;

function redact(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[truncated]';

  // Cycles are reported rather than silently dropped, so a log line that looks thin
  // says why.
  if (seen.has(value as object)) return '[circular]';
  seen.add(value as object);

  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(v => redact(v, depth + 1, seen));

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    out[key] = REDACTED_KEYS.has(key.toLowerCase()) ? REDACTION : redact(v, depth + 1, seen);
  }
  return out;
}

/** Exported for the tests, which assert the redaction rules directly. */
export function redactFields(fields: Record<string, unknown>): Record<string, unknown> {
  return redact(fields) as Record<string, unknown>;
}

function currentLevel(): LogLevel {
  const configured = (process.env.LOG_LEVEL || '').toLowerCase();
  if (configured in LEVEL_ORDER) return configured as LogLevel;

  // Silent under test, because a great many suites here deliberately assert 4xx and 5xx
  // responses — an authorisation test is mostly 403s by design. Logging those buries the
  // one line that matters when something genuinely breaks. The tests that care about log
  // output set both LOG_LEVEL and a sink explicitly, so nothing is hidden from them.
  return process.env.NODE_ENV === 'test' ? 'silent' : 'info';
}

/**
 * The sink is swappable so tests can assert on emitted lines without capturing
 * process stdout, which under vitest is shared between workers.
 */
type Sink = (line: string) => void;
let sink: Sink = line => process.stdout.write(line + '\n');

export function setLogSink(next: Sink | null): void {
  sink = next ?? (line => process.stdout.write(line + '\n'));
}

export function log(level: LogLevel, msg: string, fields: Record<string, unknown> = {}): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[currentLevel()]) return;

  const entry = {
    level,
    msg,
    time: new Date().toISOString(),
    service: process.env.SERVICE_NAME || 'iaas',
    ...redactFields(fields),
  };

  try {
    sink(JSON.stringify(entry));
  } catch {
    // A field that cannot be serialised must not take the request down with it. The
    // level and message are the parts an alert keys on, so they are what survives.
    sink(JSON.stringify({ level, msg, time: entry.time, service: entry.service, fieldsError: true }));
  }
}

export const logger = {
  debug: (msg: string, fields?: Record<string, unknown>) => log('debug', msg, fields),
  info: (msg: string, fields?: Record<string, unknown>) => log('info', msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => log('warn', msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => log('error', msg, fields),
};
