import express from 'express';
import cors from 'cors';
import { initUserDb } from './db';
import { usersRouter } from './routes/users';
import { authRouter } from './routes/auth';
import { rolesRouter } from './routes/roles';

const app = express();
const PORT = process.env.PORT || 3011;

app.use(cors());
app.use(express.json());

initUserDb();

app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/roles', rolesRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'user-service', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[User Service] Running on port ${PORT}`);
  });
}

export { app };
