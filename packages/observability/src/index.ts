/**
 * Observability for the API surface: structured logs, correlation IDs, metrics and
 * readiness.
 *
 * One package rather than per-service middleware, for the same reason packages/auth
 * exists: the previous request-id middleware lived in api-gateway's `app`, and the
 * deployed artefact (services/consolidated-api) imports api-gateway's *routers*, so it
 * never ran in production. Middleware mounted on one of the thirteen Express apps is
 * middleware that does not exist on the other twelve.
 *
 * When adding a service, mount in this order:
 *
 *   app.use(requestId());
 *   app.use(express.json());
 *   app.use(requestLogger());
 *   ... routers ...
 *   app.use(errorHandler());   // must be last
 */

export { log, logger, setLogSink, redactFields } from './logger';
export type { LogLevel } from './logger';

export { requestId, getRequestId, REQUEST_ID_HEADER } from './requestId';
export type { RequestWithId } from './requestId';

export { requestLogger } from './requestLogger';
export type { RequestLoggerOptions } from './requestLogger';

export { errorHandler } from './errorHandler';
export type { ErrorEnvelope } from './errorHandler';

export { recordRequest, renderPrometheus, metricsSummary, resetMetrics } from './metrics';

export { createReadinessHandler } from './readiness';
export type { ReadinessCheck, ReadinessOptions, CheckResult } from './readiness';

export { resolveStorePath, checkWritableDirectory } from './storePath';
export type { ResolvedStorePath } from './storePath';
