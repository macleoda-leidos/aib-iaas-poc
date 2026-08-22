import express from 'express';
import cors from 'cors';
import { recommendRouter } from './routes/recommend';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use('/api/recommend', recommendRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'recommendation-service', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Recommendation Service] Running on port ${PORT}`);
  });
}

export { app };
