import express from 'express';
import cors from 'cors';
import { latencyMiddleware } from './middleware/latency';
import { loggingMiddleware } from './middleware/logging';
import { basysRouter } from './routes/basys';
import { edenDashRouter } from './routes/eden-dash';
import { dasRouter } from './routes/das';
import { cftRouter } from './routes/cft';
import { moratoriumRouter } from './routes/moratorium';
import { roiRouter } from './routes/roi';
import { creditCheckRouter } from './routes/credit-check';
import { healthRouter } from './routes/health';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);

// Mock service identifier header
app.use((_req, res, next) => {
  res.setHeader('X-Mock-Service', 'true');
  res.setHeader('X-Service-Version', '0.1.0-poc');
  next();
});

// Apply latency simulation to all integration routes
app.use('/api/basys', latencyMiddleware, basysRouter);
app.use('/api/eden', latencyMiddleware, edenDashRouter);
app.use('/api/das', latencyMiddleware, dasRouter);
app.use('/api/cft', latencyMiddleware, cftRouter);
app.use('/api/moratorium', latencyMiddleware, moratoriumRouter);
app.use('/api/roi', latencyMiddleware, roiRouter);
app.use('/api/credit-check', latencyMiddleware, creditCheckRouter);

// Health check (no latency)
app.use('/api/mock', healthRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Mock Integrations] Running on port ${PORT}`);
    console.log(`[Mock Integrations] Latency: ${process.env.MOCK_LATENCY_MIN_MS || 100}-${process.env.MOCK_LATENCY_MAX_MS || 500}ms`);
    console.log(`[Mock Integrations] Failure rate: ${(parseFloat(process.env.MOCK_FAILURE_RATE || '0.05') * 100).toFixed(1)}%`);
  });
}

export { app };
