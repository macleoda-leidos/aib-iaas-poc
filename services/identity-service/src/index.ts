import express from 'express';
import cors from 'cors';
import { verifyRouter } from './routes/verify';
import { federationRouter } from './routes/federation';

const app = express();
const PORT = process.env.PORT || 3013;

app.use(cors());
app.use(express.json());

app.use('/api/identity', verifyRouter);
app.use('/api/identity', federationRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'identity-service',
    providers: ['scotaccount', 'govuk_verify', 'manual'],
    federatedSystems: ['BASYS', 'ASTRA', 'eDEN', 'CFT', 'RoI'],
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`[Identity Service] Running on port ${PORT}`);
});

export { app };
