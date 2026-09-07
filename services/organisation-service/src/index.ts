import express from 'express';
import cors from 'cors';
import { requestId, requestLogger, errorHandler } from '@aib-iaas/observability';
import { initOrgDb } from './db';
import { organisationRouter } from './routes/organisations';

const app = express();
const PORT = process.env.PORT || 3009;

app.use(requestId());
app.use(cors());
app.use(express.json());
// requestId first so nothing that can end a response runs before an id exists;
// requestLogger after express.json() so a body-parse failure is still logged with its
// status. Mounted here *and* in services/consolidated-api, because that file imports
// this service's routers rather than this app — middleware mounted only here does not
// exist in any deployed environment.
app.use(requestLogger());

app.use('/api/organisations', organisationRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'organisation-service', timestamp: new Date().toISOString() });
});

// Awaited before listening: under PostgreSQL, schema creation is a round trip.
// Terminal error handler. Every route in this service previously fell through to
// Express's default handler, which renders an HTML stack trace, and a synchronous
// better-sqlite3 throw is the ordinary way to reach it.
app.use(errorHandler());

if (process.env.NODE_ENV !== 'test') {
  initOrgDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`[Organisation Service] Running on port ${PORT}`);
      });
    })
    .catch((e: Error) => {
      console.error('[Organisation Service] Failed to initialise database:', e.message);
      process.exit(1);
    });
}

export { app };
