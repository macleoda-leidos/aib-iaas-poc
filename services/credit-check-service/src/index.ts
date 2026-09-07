import express from 'express';
import cors from 'cors';
import { requestId, requestLogger, errorHandler } from '@aib-iaas/observability';
import { creditCheckRouter } from './routes/credit-check';
import { initCreditCheckDb } from './providers/cache';

const app = express();
const PORT = process.env.PORT || 3008;

app.use(requestId());
app.use(cors());
app.use(express.json());
// requestId first so nothing that can end a response runs before an id exists;
// requestLogger after express.json() so a body-parse failure is still logged with its
// status. Mounted here *and* in services/consolidated-api, because that file imports
// this service's routers rather than this app — middleware mounted only here does not
// exist in any deployed environment.
app.use(requestLogger());

initCreditCheckDb();

app.use('/api/credit-check', creditCheckRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'credit-check-service',
    providers: ['synthetic-credit', 'experian-sandbox', 'equifax-sandbox'],
    timestamp: new Date().toISOString(),
  });
});

// Terminal error handler. Every route in this service previously fell through to
// Express's default handler, which renders an HTML stack trace, and a synchronous
// better-sqlite3 throw is the ordinary way to reach it.
app.use(errorHandler());

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Credit Check Service] Running on port ${PORT}`);
    console.log(`[Credit Check Service] Mode: ${process.env.CREDIT_CHECK_MODE || 'sandbox'}`);
  });
}

export { app };
