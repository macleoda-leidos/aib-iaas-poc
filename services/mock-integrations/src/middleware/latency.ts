import { Request, Response, NextFunction } from 'express';

const MIN_LATENCY = parseInt(process.env.MOCK_LATENCY_MIN_MS || '100');
const MAX_LATENCY = parseInt(process.env.MOCK_LATENCY_MAX_MS || '500');
const FAILURE_RATE = parseFloat(process.env.MOCK_FAILURE_RATE || '0.05');

export function latencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const delay = Math.floor(Math.random() * (MAX_LATENCY - MIN_LATENCY) + MIN_LATENCY);

  // Check if this request should fail (simulate service unavailability)
  if (Math.random() < FAILURE_RATE) {
    setTimeout(() => {
      res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
      res.status(503).json({
        status: 'error',
        errorMessage: 'Service temporarily unavailable (simulated failure)',
        timestamp: new Date().toISOString(),
      });
    }, delay);
    return;
  }

  // Add artificial latency
  setTimeout(() => {
    res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
    next();
  }, delay);
}
