import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { initDatabase } from './db';
import { applicationsRouter } from './routes/applications';
import { postcodeRouter } from './routes/postcode';
import { authRouter } from './routes/auth';
import { oidcRouter } from './oidc/router';
import { claimsRouter } from './routes/claims';
import { reportsRouter } from './routes/reports';
import { reportsExportRouter } from './routes/reports-export';
import { errorHandler } from './middleware/errorHandler';
import { authenticate, requirePermission } from './middleware/rbac';
import { enforceAuthentication } from './middleware/accessPolicy';
import { securityHeaders } from './middleware/securityHeaders';

const app = express();
const PORT = process.env.PORT || 3001;

// Never advertise the framework/version.
app.disable('x-powered-by');

// Security headers — shared with the deployed consolidated-api (see
// ./middleware/securityHeaders) so both services present an identical,
// scanner-grade header set.
securityHeaders().forEach((mw) => app.use(mw));
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

// Request ID
app.use((req, _res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || crypto.randomUUID();
  next();
});

// Initialize database
initDatabase();

// Default-deny authentication, identical posture to the deployed consolidated-api
// (shared accessPolicy), so the two services cannot drift on their public surface.
app.use(enforceAuthentication);

// Routes
// OIDC federation leg mounted before /api/auth so the whole handshake is
// unambiguously owned by oidcRouter (additive — the password endpoints on
// authRouter are untouched).
app.use('/api/auth/oidc', oidcRouter);
app.use('/api/auth', authRouter);
app.use('/api/claims', claimsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/postcode', postcodeRouter);
app.use('/api/reports/export', reportsExportRouter); // Public for POC demo (must be before auth-protected route)
// `reports.read` is the code seeded into role_permissions. This asked for
// `reports.view` until Sprint 30 — a code no role has ever held, so the only
// authorised route in the repo returned 403 to everyone including system_admin.
// The global gate already authenticated; requirePermission adds the authz check.
app.use('/api/reports', authenticate, requirePermission('reports.read'), reportsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[API Gateway] Running on port ${PORT}`);
  });
}

export { app };
