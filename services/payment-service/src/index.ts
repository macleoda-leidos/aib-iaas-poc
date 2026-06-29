import express from 'express';
import cors from 'cors';
import { paymentsRouter } from './routes/payments';

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());
app.use('/api/payments', paymentsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'payment-service', mode: process.env.PAYMENT_MODE || 'sandbox', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[Payment Service] Running on port ${PORT} (mode: ${process.env.PAYMENT_MODE || 'sandbox'})`);
});

export { app };
