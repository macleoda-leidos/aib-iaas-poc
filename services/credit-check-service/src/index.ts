import express from 'express';
import cors from 'cors';
import { creditCheckRouter } from './routes/credit-check';
import { initCreditCheckDb } from './providers/cache';

const app = express();
const PORT = process.env.PORT || 3008;

app.use(cors());
app.use(express.json());

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

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Credit Check Service] Running on port ${PORT}`);
    console.log(`[Credit Check Service] Mode: ${process.env.CREDIT_CHECK_MODE || 'sandbox'}`);
  });
}

export { app };
