/**
 * AiB IAAS - Consolidated API
 *
 * This is a deployment consolidation layer that mounts all 11 backend
 * services into a single Express application. This allows deployment
 * as a single container on Azure Container Apps free tier.
 *
 * The individual services remain independently runnable for local
 * development (npm run dev:services). This file is ONLY used for
 * cloud deployment.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import route modules from sibling services
import { applicationsRouter } from '../../api-gateway/src/routes/applications';
import { postcodeRouter } from '../../api-gateway/src/routes/postcode';
import { authRouter as gatewayAuthRouter } from '../../api-gateway/src/routes/auth';
import { reportsRouter } from '../../api-gateway/src/routes/reports';
import { reportsExportRouter } from '../../api-gateway/src/routes/reports-export';
import { initDatabase } from '../../api-gateway/src/db';

import { recommendRouter } from '../../recommendation-service/src/routes/recommend';
import { documentsRouter } from '../../document-service/src/routes/documents';
import { orchestrateRouter } from '../../integration-orchestrator/src/routes/orchestrate';
import { paymentsRouter } from '../../payment-service/src/routes/payments';
import { auditRouter } from '../../audit-service/src/routes/audit';
import { initAuditDb } from '../../audit-service/src/db';
import { creditCheckRouter } from '../../credit-check-service/src/routes/credit-check';
import { initCreditCheckDb } from '../../credit-check-service/src/providers/cache';
import { organisationRouter } from '../../organisation-service/src/routes/organisations';
import { initOrgDb } from '../../organisation-service/src/db';
import { usersRouter } from '../../user-service/src/routes/users';
import { authRouter as userAuthRouter } from '../../user-service/src/routes/auth';
import { rolesRouter } from '../../user-service/src/routes/roles';
import { initUserDb } from '../../user-service/src/db';
import { notificationRouter } from '../../notification-service/src/routes/notifications';
import { initNotificationDb } from '../../notification-service/src/db';
import { verifyRouter } from '../../identity-service/src/routes/verify';
import { federationRouter } from '../../identity-service/src/routes/federation';

// Mock integrations
import { basysRouter } from '../../mock-integrations/src/routes/basys';
import { edenDashRouter } from '../../mock-integrations/src/routes/eden-dash';
import { dasRouter } from '../../mock-integrations/src/routes/das';
import { cftRouter } from '../../mock-integrations/src/routes/cft';
import { moratoriumRouter } from '../../mock-integrations/src/routes/moratorium';
import { roiRouter } from '../../mock-integrations/src/routes/roi';
import { creditCheckRouter as mockCreditCheckRouter } from '../../mock-integrations/src/routes/credit-check';
import { healthRouter as mockHealthRouter } from '../../mock-integrations/src/routes/health';
import { latencyMiddleware } from '../../mock-integrations/src/middleware/latency';

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet({ contentSecurityPolicy: false })); // Relaxed CSP for POC
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['https://macleoda-leidos.github.io', 'http://localhost:3000', 'http://localhost:3010'];
app.use(cors({ origin: corsOrigins, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization'], credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use(express.json({ limit: '10mb' }));

// Initialize databases
initDatabase();
initAuditDb();
initCreditCheckDb();
initOrgDb();
initUserDb();
initNotificationDb();

// Auto-seed on first boot if database is empty
try {
  const { getDatabase } = require('@aib-iaas/database');
  const db = getDatabase();
  const count = db.prepare('SELECT COUNT(*) as c FROM applications').get() as any;
  if (count.c === 0) {
    console.log('[Consolidated API] Empty database detected — running seed...');
    const { seedDatabase } = require('@aib-iaas/database');
    if (seedDatabase) seedDatabase();
    console.log('[Consolidated API] Seed complete');
  }
} catch (e: any) {
  console.log('[Consolidated API] Seed skipped:', e.message);
}

console.log('[Consolidated API] All databases initialized');

// ===== API GATEWAY ROUTES =====
app.use('/api/applications', applicationsRouter);
app.use('/api/postcode', postcodeRouter);
app.use('/api/auth', gatewayAuthRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/reports/export', reportsExportRouter);

// ===== SERVICE ROUTES =====
app.use('/api/recommend', recommendRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/integrations', orchestrateRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/credit-check', creditCheckRouter);
app.use('/api/organisations', organisationRouter);
app.use('/api/users', usersRouter);
app.use('/api/users/auth', userAuthRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/identity', verifyRouter);
app.use('/api/identity', federationRouter);

// ===== MOCK INTEGRATION ROUTES =====
app.use('/api/mock/basys', latencyMiddleware, basysRouter);
app.use('/api/mock/eden', latencyMiddleware, edenDashRouter);
app.use('/api/mock/das', latencyMiddleware, dasRouter);
app.use('/api/mock/cft', latencyMiddleware, cftRouter);
app.use('/api/mock/moratorium', latencyMiddleware, moratoriumRouter);
app.use('/api/mock/roi', latencyMiddleware, roiRouter);
app.use('/api/mock/credit-check', latencyMiddleware, mockCreditCheckRouter);
app.use('/api/mock', mockHealthRouter);

// ===== ROOT =====
app.get('/', (_req, res) => {
  res.json({
    service: 'AiB IAAS API',
    version: '0.1.0',
    status: 'operational',
    description: 'Accountant in Bankruptcy — Initial Application Advice Service API',
    endpoints: {
      health: '/api/health',
      applications: '/api/applications',
      auth: '/api/auth/login',
      recommend: '/api/recommend',
      audit: '/api/audit/events',
      organisations: '/api/organisations',
      users: '/api/users',
      creditCheck: '/api/credit-check',
      documents: '/api/documents',
      payments: '/api/payments',
    },
    documentation: 'https://macleoda-leidos.github.io/aib-iaas-poc/architecture/',
    frontend: 'https://macleoda-leidos.github.io/aib-iaas-poc/',
  });
});

// ===== HEALTH =====
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'aib-iaas-consolidated-api',
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    services: [
      'api-gateway', 'recommendation', 'document', 'integration-orchestrator',
      'payment', 'audit', 'credit-check', 'organisation', 'user', 'notification', 'mock-integrations',
    ],
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]', err.message);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
});

app.listen(PORT, () => {
  console.log(`[Consolidated API] Running on port ${PORT}`);
  console.log(`[Consolidated API] All 11 services mounted on single instance`);
});

export { app };
