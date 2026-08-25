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
import { errorHandler } from './middleware/errorHandler';
import { authenticate, requirePermission } from './middleware/rbac';

const app = express();
const PORT = process.env.PORT || 3001;

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

// Request ID
app.use((req, _res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || crypto.randomUUID();
  next();
});

// Initialize database
initDatabase();

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
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[API Gateway] Running on port ${PORT}`);
  });
}

export { app };
