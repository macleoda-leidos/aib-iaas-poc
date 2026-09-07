import express from 'express';
import cors from 'cors';
import { requestId, requestLogger, errorHandler } from '@aib-iaas/observability';
import { initUserDb } from './db';
import { usersRouter } from './routes/users';
import { authRouter } from './routes/auth';
import { rolesRouter } from './routes/roles';

const app = express();
const PORT = process.env.PORT || 3011;

app.use(requestId());
app.use(cors());
app.use(express.json());
// requestId first so nothing that can end a response runs before an id exists;
// requestLogger after express.json() so a body-parse failure is still logged with its
// status. Mounted here *and* in services/consolidated-api, because that file imports
// this service's routers rather than this app — middleware mounted only here does not
// exist in any deployed environment.
app.use(requestLogger());

app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/roles', rolesRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'user-service', timestamp: new Date().toISOString() });
});

// Awaited before listening: under PostgreSQL, schema creation is a round trip.
// Terminal error handler. Every route in this service previously fell through to
// Express's default handler, which renders an HTML stack trace, and a synchronous
// better-sqlite3 throw is the ordinary way to reach it.
app.use(errorHandler());

if (process.env.NODE_ENV !== 'test') {
  initUserDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`[User Service] Running on port ${PORT}`);
      });
    })
    .catch((e: Error) => {
      console.error('[User Service] Failed to initialise database:', e.message);
      process.exit(1);
    });
}

export { app };
