/**
 * Lightweight error tracking module for AiB IAAS.
 * Logs structured error events to console. Ready for Sentry integration
 * when NEXT_PUBLIC_SENTRY_DSN is configured.
 */

interface ErrorEvent {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: string;
  url?: string;
  userAgent?: string;
}

const errorLog: ErrorEvent[] = [];

export function captureError(error: Error, context?: Record<string, any>) {
  const event: ErrorEvent = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };

  errorLog.push(event);
  console.error('[Error Tracking]', event);

  // When Sentry is configured, send here:
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) { Sentry.captureException(error); }
}

export function getErrorLog(): ErrorEvent[] {
  return [...errorLog];
}

export function getErrorCount(): number {
  return errorLog.length;
}
