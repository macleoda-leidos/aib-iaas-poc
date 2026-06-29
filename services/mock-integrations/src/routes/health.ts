import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'mock-integrations',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    systems: [
      { system: 'BASYS', status: 'healthy', description: 'Bankruptcy Administration System' },
      { system: 'eDEN', status: 'healthy', description: 'DAS Electronic System' },
      { system: 'DASH', status: 'healthy', description: 'DAS Payment Distribution' },
      { system: 'DAS', status: 'healthy', description: 'Debt Arrangement Scheme' },
      { system: 'CFT', status: 'healthy', description: 'Creditor/Trustee/Provider Information' },
      { system: 'Moratorium', status: 'healthy', description: 'Moratorium Register' },
      { system: 'RoI', status: 'healthy', description: 'Register of Insolvencies' },
      { system: 'CreditCheck', status: 'healthy', description: 'Credit Reference Agency (Placeholder)' },
    ],
    config: {
      latencyMinMs: parseInt(process.env.MOCK_LATENCY_MIN_MS || '100'),
      latencyMaxMs: parseInt(process.env.MOCK_LATENCY_MAX_MS || '500'),
      failureRate: parseFloat(process.env.MOCK_FAILURE_RATE || '0.05'),
    },
  });
});

healthRouter.get('/config', (_req: Request, res: Response) => {
  res.json({
    latencyMinMs: parseInt(process.env.MOCK_LATENCY_MIN_MS || '100'),
    latencyMaxMs: parseInt(process.env.MOCK_LATENCY_MAX_MS || '500'),
    failureRate: parseFloat(process.env.MOCK_FAILURE_RATE || '0.05'),
    note: 'These settings control simulated latency and failure rates for all mock integration endpoints.',
  });
});
