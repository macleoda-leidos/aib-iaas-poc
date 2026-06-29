import express from 'express';
import cors from 'cors';
import { initOrgDb } from './db';
import { organisationRouter } from './routes/organisations';

const app = express();
const PORT = process.env.PORT || 3009;

app.use(cors());
app.use(express.json());

initOrgDb();

app.use('/api/organisations', organisationRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'organisation-service', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[Organisation Service] Running on port ${PORT}`);
});

export { app };
