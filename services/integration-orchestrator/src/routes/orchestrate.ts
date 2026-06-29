import { Router, Request, Response } from 'express';
import axios from 'axios';
import { v4 as uuid } from 'uuid';

export const orchestrateRouter = Router();

const MOCK_URL = process.env.MOCK_INTEGRATIONS_URL || 'http://localhost:3005';

interface CheckAllRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationalInsuranceNumber?: string;
  postcode?: string;
  totalDebt?: number;
}

// Run all system checks in parallel
orchestrateRouter.post('/check-all', async (req: Request, res: Response) => {
  const input = req.body as CheckAllRequest;
  const requestId = uuid();

  const checks = [
    { system: 'BASYS', url: `${MOCK_URL}/api/basys/lookup`, data: input },
    { system: 'eDEN', url: `${MOCK_URL}/api/eden/lookup`, data: input },
    { system: 'DAS', url: `${MOCK_URL}/api/das/lookup`, data: input },
    { system: 'CFT', url: `${MOCK_URL}/api/cft/lookup`, data: input },
    { system: 'Moratorium', url: `${MOCK_URL}/api/moratorium/check`, data: input },
    { system: 'RoI', url: `${MOCK_URL}/api/roi/search`, data: input },
  ];

  const results = await Promise.allSettled(
    checks.map(async (check) => {
      const start = Date.now();
      try {
        const response = await axios.post(check.url, check.data, { timeout: 5000 });
        return {
          system: check.system,
          status: response.data.status,
          found: response.data.data?.found || false,
          data: response.data.data,
          responseTime: Date.now() - start,
        };
      } catch (error: any) {
        return {
          system: check.system,
          status: 'error',
          found: false,
          errorMessage: error.message,
          responseTime: Date.now() - start,
        };
      }
    })
  );

  const formattedResults = results.map(r =>
    r.status === 'fulfilled' ? r.value : { system: 'unknown', status: 'error', found: false, responseTime: 0 }
  );

  res.json({
    success: true,
    data: {
      requestId,
      timestamp: new Date().toISOString(),
      results: formattedResults,
      summary: {
        totalChecks: formattedResults.length,
        casesFound: formattedResults.filter(r => r.found).length,
        errors: formattedResults.filter(r => r.status === 'error').length,
      },
    },
  });
});

// Check specific system
orchestrateRouter.post('/check/:system', async (req: Request, res: Response) => {
  const { system } = req.params;
  const urlMap: Record<string, string> = {
    basys: `${MOCK_URL}/api/basys/lookup`,
    eden: `${MOCK_URL}/api/eden/lookup`,
    das: `${MOCK_URL}/api/das/lookup`,
    cft: `${MOCK_URL}/api/cft/lookup`,
    moratorium: `${MOCK_URL}/api/moratorium/check`,
    roi: `${MOCK_URL}/api/roi/search`,
    'credit-check': `${MOCK_URL}/api/credit-check/run`,
  };

  const url = urlMap[system.toLowerCase()];
  if (!url) {
    res.status(400).json({ success: false, error: { code: 'INVALID_SYSTEM', message: `Unknown system: ${system}` } });
    return;
  }

  try {
    const response = await axios.post(url, req.body, { timeout: 5000 });
    res.json({ success: true, data: response.data });
  } catch (error: any) {
    res.status(502).json({
      success: false,
      error: { code: 'INTEGRATION_ERROR', message: `Failed to reach ${system}: ${error.message}` },
    });
  }
});

// Health of all integrations
orchestrateRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(`${MOCK_URL}/api/mock/health`, { timeout: 3000 });
    res.json({ success: true, data: response.data });
  } catch {
    res.json({ success: true, data: { status: 'degraded', message: 'Cannot reach mock integrations' } });
  }
});
