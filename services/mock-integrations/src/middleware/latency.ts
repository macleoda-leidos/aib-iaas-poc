import { Request, Response, NextFunction } from 'express';

export function latencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Read env at request time (not module load) so tests can override
  const minLatency = parseInt(process.env.MOCK_LATENCY_MIN_MS || '100');
  const maxLatency = parseInt(process.env.MOCK_LATENCY_MAX_MS || '500');
  const failureRate = parseFloat(process.env.MOCK_FAILURE_RATE || '0.05');

  const start = Date.now();
  const delay = Math.floor(Math.random() * (maxLatency - minLatency) + minLatency);

  // Check if this request should fail (simulate service unavailability)
  if (Math.random() < failureRate) {
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
