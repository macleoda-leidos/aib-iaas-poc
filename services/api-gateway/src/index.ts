import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDatabase } from './db';
import { applicationsRouter } from './routes/applications';
import { postcodeRouter } from './routes/postcode';
import { authRouter } from './routes/auth';
import { reportsRouter } from './routes/reports';
import { reportsExportRouter } from './routes/reports-export';
import { requestId, requestLogger, errorHandler } from '@aib-iaas/observability';
import { authenticate, requirePermission } from './middleware/rbac';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(requestId());

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
}));

app.use(express.json({ limit: '10mb' }));

// Replaces a hand-rolled request-id middleware that assigned a UUID to
// `req.headers['x-request-id']` and stopped there — it mutated the *request*, so the id
// was never echoed to the caller and never logged, and nothing read it. It was also
// mounted on this app, which the deployed artefact does not use (it imports the routers
// below into services/consolidated-api), so it never ran in production at all.
app.use(requestLogger());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/postcode', postcodeRouter);
app.use('/api/reports/export', reportsExportRouter); // Public for POC demo (must be before auth-protected route)
// `reports.read` is the code seeded into role_permissions. This asked for
// `reports.view` until Sprint 30 — a code no role has ever held, so the only
// authorised route in the repo returned 403 to everyone including system_admin.
app.use('/api/reports', authenticate, requirePermission('reports.read'), reportsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler());

// Schema creation is awaited before the first request can arrive, because under
// PostgreSQL it is a round trip rather than a synchronous file operation. Tests
// import `app` without listening and get their schema from createRepositories(),
// which still initialises SQLite synchronously.
if (process.env.NODE_ENV !== 'test') {
  initDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`[API Gateway] Running on port ${PORT}`);
      });
    })
    .catch((e: Error) => {
      console.error('[API Gateway] Failed to initialise database:', e.message);
      process.exit(1);
    });
}

export { app };
