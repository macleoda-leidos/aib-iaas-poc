import express from 'express';
import cors from 'cors';
import { documentsRouter } from './routes/documents';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());
app.use('/api/documents', documentsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'document-service', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[Document Service] Running on port ${PORT}`);
});

export { app };
