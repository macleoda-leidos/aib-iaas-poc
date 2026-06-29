import express from 'express';
import cors from 'cors';
import { initAuditDb } from './db';
import { auditRouter } from './routes/audit';

const app = express();
const PORT = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());

initAuditDb();

app.use('/api/audit', auditRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'audit-service', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[Audit Service] Running on port ${PORT}`);
});

export { app };
