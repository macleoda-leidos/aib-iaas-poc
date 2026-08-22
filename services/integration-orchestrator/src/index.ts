import express from 'express';
import cors from 'cors';
import { orchestrateRouter } from './routes/orchestrate';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());
app.use('/api/integrations', orchestrateRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'integration-orchestrator', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Integration Orchestrator] Running on port ${PORT}`);
  });
}

export { app };
