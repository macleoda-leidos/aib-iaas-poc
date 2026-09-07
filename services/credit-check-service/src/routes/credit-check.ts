import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, type AuthenticatedRequest } from '../middleware/rbac';
import { v4 as uuid } from 'uuid';
import { createRepositories } from '@aib-iaas/database';
import { SyntheticCreditProvider } from '../providers/synthetic';
import { ExperianSandboxProvider } from '../providers/experian-sandbox';
import { EquifaxSandboxProvider } from '../providers/equifax-sandbox';
import { getCachedResult, cacheResult, cacheKeyFor } from '../providers/cache';

export const creditCheckRouter = Router();

/**
 * Consent records live in the shared database, not in this service's local SQLite cache.
 *
 * They are evidence about a person rather than a performance optimisation, so they belong
 * with the case data — and the cache file is deliberately disposable, which is the last
 * place a UK GDPR Art. 7(1) record should sit.
 */
const { consents } = createRepositories();

/**
 * Credit data is the most sensitive class this service touches, and every route here was
 * open. Authentication was the floor. The other two defects recorded as GAP-018 are now
 * closed as well: the consent endpoint writes a durable record instead of returning a
 * receipt for nothing, and the result cache is scoped to an application rather than keyed
 * on the person — see cacheKeyFor() and the note on POST /consent.
 */
creditCheckRouter.use(authenticate);

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
creditCheckRouter.post('/run', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as CreditCheckRequest;
    const requestId = uuid();
    const caller = (req as AuthenticatedRequest).user;

    if (!input?.applicationId) {
      // Required now, because it is what scopes both the consent record and the cache.
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'applicationId is required' },
      });
      return;
    }

    /**
     * Consent must be a *record*, not a claim.
     *
     * `consentGiven: true` in the request body is an assertion by the caller, and the old
     * code accepted it as the whole of the consent check while writing nothing down. So
     * the response said `consentRecorded: true` and there was nothing to produce if
     * anyone asked. A live row is now required.
     *
     * Inline consent is still accepted and *written* — the /apply journey submits consent
     * and the check together in one request, and forcing two round trips would break it
     * for no benefit. What changed is that the claim becomes a durable record before the
     * provider is called, rather than instead of it.
     */
    if (input.consentGiven === false) {
      // An explicit refusal in the body overrides any stored consent, and is checked before
      // the lookup rather than after. Honouring a prior record over a present "no" would be
      // the wrong direction: consent is withdrawable at any time under UK GDPR Art. 7(3),
      // and the applicant saying no on this request is the most current statement there is.
      res.status(400).json({
        success: false,
        error: { code: 'CONSENT_REQUIRED', message: 'Explicit consent is required to run a credit check' },
      });
      return;
    }

    let consent = await consents.findLive(input.applicationId);

    if (!consent && input.consentGiven === true) {
      consent = await consents.record({
        applicationId: input.applicationId,
        debtorId: caller?.userId ?? null,
        consentType: 'credit_check',
        consentGiven: true,
        recordedBy: caller?.userId ?? null,
        ipAddress: req.ip ?? null,
        userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
      });
    }

    if (!consent) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CONSENT_REQUIRED',
          message: 'Explicit consent is required to run a credit check. Record it via POST /api/credit-check/consent.',
        },
      });
      return;
    }

    // Scoped to this application and to this identity, and expiring in an hour. The old
    // key was `${niNumber || lastName}-${dateOfBirth}` on a 24-hour TTL, which returned a
    // cached result to a *different* application for the same person — so a fresh consent
    // authorised no fresh check — and collided two people sharing a surname and date of
    // birth. See cacheKeyFor().
    const cacheKey = cacheKeyFor(input);
    const cached = getCachedResult(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: { ...cached, fromCache: true, requestId, consentId: consent.id },
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

    let result;
    try {
      result = await provider.runCheck(input);
    } catch (error: any) {
      // Kept as its own catch: a provider failure is a 502 about an upstream system, not
      // a 500 about us, and conflating the two sends an operator to the wrong place.
      res.status(502).json({
        success: false,
        error: { code: 'PROVIDER_ERROR', message: `Credit check failed: ${error.message}` },
      });
      return;
    }

    const response = {
      requestId,
      applicationId: input.applicationId,
      provider: provider.name,
      providerDisplayName: provider.displayName,
      checkedAt: new Date().toISOString(),
      // Now true, and pointing at the row that makes it true. It was previously a
      // hard-coded `true` next to no record at all.
      consentRecorded: true,
      consentId: consent.id,
      consentRecordedAt: consent.recordedAt,
      sandbox: true,
      disclaimer: 'PLACEHOLDER: No real credit data has been accessed. This is a simulated response.',
      ...result,
    };

    cacheResult(cacheKey, response);

    res.json({ success: true, data: response });
  } catch (e) {
    next(e);
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

/**
 * Consent recording.
 *
 * This endpoint used to destructure the body, mint a `uuid()`, return 201 with a
 * `recordedAt` timestamp and the note "Consent recorded for audit purposes", and execute
 * no write at all — there was no `consents` table. UK GDPR Art. 7(1) requires the
 * controller to be able to demonstrate consent, and a receipt with nothing behind it is
 * worse than a 501: it makes the absence of a record look like the presence of one, and
 * the receipt is exactly what an audit would have relied on. (GAP-018)
 */
creditCheckRouter.post('/consent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId, debtorId, consentType, consentGiven } = req.body ?? {};

    if (!applicationId) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'applicationId is required to record consent' },
      });
      return;
    }

    if (typeof consentGiven !== 'boolean') {
      // Not defaulted. A missing `consentGiven` recorded as `true` would manufacture
      // consent, and recorded as `false` would silently discard a real one.
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'consentGiven must be true or false' },
      });
      return;
    }

    const caller = (req as AuthenticatedRequest).user;
    const consent = await consents.record({
      applicationId,
      debtorId: debtorId ?? caller?.userId ?? null,
      consentType: consentType || 'credit_check',
      consentGiven,
      recordedBy: caller?.userId ?? null,
      // Both are evidence of the circumstances in which consent was given, which is what
      // makes a record defensible rather than merely present.
      ipAddress: req.ip ?? null,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    });

    res.status(201).json({
      success: true,
      data: {
        consentId: consent.id,
        applicationId: consent.applicationId,
        debtorId: consent.debtorId,
        consentType: consent.consentType,
        consentGiven: consent.consentGiven,
        recordedAt: consent.recordedAt,
        // Previously `now + 90 days`, computed per response and enforced by nothing —
        // there was no record for it to be a property of. Now a stored column that
        // `findLive` checks, so this states a fact.
        expiresAt: consent.expiresAt,
        // The stored row is the record; this is the receipt for it. `persisted` is stated
        // explicitly because the previous version of this response claimed the same thing
        // implicitly and was not true.
        persisted: true,
      },
    });
  } catch (e) {
    next(e);
  }
});

/** The consent trail for an application — what an audit or a subject access request reads. */
creditCheckRouter.get('/consent/:applicationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trail = await consents.listForApplication(req.params.applicationId);
    res.json({
      success: true,
      data: {
        applicationId: req.params.applicationId,
        consents: trail,
        live: await consents.findLive(req.params.applicationId),
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * Withdraw consent. Modelled as a timestamp rather than a deletion, because "this person
 * withdrew on 3 March" is itself a fact the controller must be able to demonstrate —
 * deleting the row would leave no evidence that a later refusal to run a check was right.
 */
creditCheckRouter.delete('/consent/:consentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const withdrawn = await consents.withdraw(req.params.consentId);

    if (!withdrawn) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No live consent with that id' },
      });
      return;
    }

    res.json({ success: true, data: { consentId: withdrawn.id, withdrawnAt: withdrawn.withdrawnAt } });
  } catch (e) {
    next(e);
  }
});
