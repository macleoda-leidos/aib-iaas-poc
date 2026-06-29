import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export const creditCheckRouter = Router();

/**
 * Credit Check Mock - Placeholder Credit Reference Agency
 * Simulates a credit check against a reference agency.
 *
 * REPLACEMENT NOTE: In production, this would connect to an actual CRA
 * (e.g., Experian, Equifax, TransUnion) via their API with proper credentials
 * and data sharing agreements. This requires contractual arrangements and
 * Information Commissioner's Office compliance.
 */

interface CreditCheckRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationalInsuranceNumber?: string;
  address: {
    line1: string;
    postcode: string;
  };
}

creditCheckRouter.post('/run', (req: Request, res: Response) => {
  const { nationalInsuranceNumber } = req.body as CreditCheckRequest;
  const requestId = uuid();

  // Generate synthetic credit data
  const creditScore = Math.floor(Math.random() * 600) + 200; // 200-800 range
  const niEndsBWithBankruptcy = nationalInsuranceNumber?.endsWith('B');

  let defaults = 0;
  let ccjs = 0;
  let status: 'clear' | 'issues_found' = 'clear';

  if (creditScore < 400) {
    defaults = Math.floor(Math.random() * 4) + 1;
    ccjs = Math.floor(Math.random() * 2);
    status = 'issues_found';
  } else if (creditScore < 550) {
    defaults = Math.floor(Math.random() * 2);
    status = defaults > 0 ? 'issues_found' : 'clear';
  }

  res.json({
    requestId,
    system: 'CreditCheck',
    status: 'success',
    data: {
      provider: 'SyntheticCredit Ltd (PLACEHOLDER)',
      disclaimer: 'This is a SIMULATED credit check result for POC demonstration purposes only. No real credit data has been accessed.',
      checkedAt: new Date().toISOString(),
      creditScore,
      scoreRange: { min: 0, max: 999 },
      scoreBand: creditScore >= 700 ? 'excellent' : creditScore >= 550 ? 'fair' : creditScore >= 400 ? 'poor' : 'very_poor',
      defaults,
      ccjs,
      bankruptcyFlag: !!niEndsBWithBankruptcy,
      ivaFlag: false,
      activeCreditAccounts: Math.floor(Math.random() * 8) + 1,
      totalCreditLimit: Math.floor(Math.random() * 20000) + 5000,
      status,
    },
    timestamp: new Date().toISOString(),
  });
});
