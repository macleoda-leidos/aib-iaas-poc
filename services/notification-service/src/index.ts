import express from 'express';
import cors from 'cors';
import { initNotificationDb } from './db';
import { notificationRouter } from './routes/notifications';

const app = express();
const PORT = process.env.PORT || 3012;

app.use(cors());
app.use(express.json());

initNotificationDb();

app.use('/api/notifications', notificationRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'notification-service', channels: ['in_app', 'email_placeholder', 'sms_placeholder'], timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Notification Service] Running on port ${PORT}`);
  });
}

export { app };
