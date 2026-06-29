import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { SyntheticCreditProvider } from '../providers/synthetic';
import { ExperianSandboxProvider } from '../providers/experian-sandbox';
import { EquifaxSandboxProvider } from '../providers/equifax-sandbox';
import { getCachedResult, cacheResult } from '../providers/cache';

export const creditCheckRouter = Router();

const providers = {
  synthetic: new SyntheticCreditProvider(),
  experian: new ExperianSandboxProvider(),
  equifax: new EquifaxSandboxProvider(),
};

export interface CreditCheckRequest {
  applicationId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationalInsuranceNumber?: string;
  currentAddress: {
    line1: string;
    postcode: string;
    city: string;
  };
  previousAddresses?: Array<{ line1: string; postcode: string; city: string }>;
  provider?: 'synthetic' | 'experian' | 'equifax';
  consentGiven: boolean;
}

// Run credit check
creditCheckRouter.post('/run', async (req: Request, res: Response) => {
  const input = req.body as CreditCheckRequest;
  const requestId = uuid();

  // Validate consent
  if (!input.consentGiven) {
    res.status(400).json({
      success: false,
      error: { code: 'CONSENT_REQUIRED', message: 'Explicit consent is required to run a credit check' },
    });
    return;
  }

  // Check cache (24-hour TTL)
  const cacheKey = `${input.nationalInsuranceNumber || input.lastName}-${input.dateOfBirth}`;
  const cached = getCachedResult(cacheKey);
  if (cached) {
    res.json({
      success: true,
      data: { ...cached, fromCache: true, requestId },
    });
    return;
  }

  // Select provider
  const providerName = input.provider || 'synthetic';
  const provider = providers[providerName];

  if (!provider) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PROVIDER', message: `Unknown provider: ${providerName}` },
    });
    return;
  }

  try {
    const result = await provider.runCheck(input);

    const response = {
      requestId,
      applicationId: input.applicationId,
      provider: provider.name,
      providerDisplayName: provider.displayName,
      checkedAt: new Date().toISOString(),
      consentRecorded: true,
      sandbox: true,
      disclaimer: 'PLACEHOLDER: No real credit data has been accessed. This is a simulated response.',
      ...result,
    };

    // Cache result
    cacheResult(cacheKey, response);

    res.json({ success: true, data: response });
  } catch (error: any) {
    res.status(502).json({
      success: false,
      error: { code: 'PROVIDER_ERROR', message: `Credit check failed: ${error.message}` },
    });
  }
});

// Get credit check history for an application
creditCheckRouter.get('/history/:applicationId', (req: Request, res: Response) => {
  const { applicationId } = req.params;
  // In POC, return mock history
  res.json({
    success: true,
    data: {
      applicationId,
      checks: [],
      note: 'Credit check history would be persisted in production',
    },
  });
});

// Get available providers
creditCheckRouter.get('/providers', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(providers).map(p => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      status: 'available',
      sandbox: true,
      features: p.features,
    })),
  });
});

// Consent recording endpoint
creditCheckRouter.post('/consent', (req: Request, res: Response) => {
  const { applicationId, debtorId, consentType, consentGiven } = req.body;

  res.status(201).json({
    success: true,
    data: {
      consentId: uuid(),
      applicationId,
      debtorId,
      consentType: consentType || 'credit_check',
      consentGiven,
      recordedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      note: 'Consent recorded for audit purposes. In production, this integrates with consent management system.',
    },
  });
});
