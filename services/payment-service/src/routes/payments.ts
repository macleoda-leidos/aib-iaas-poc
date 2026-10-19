import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { createRepositories } from '@aib-iaas/database';
// Verify the signed token / capability inline via @aib-iaas/auth rather than
// importing the gateway middleware, keeping payment-service a self-contained
// workspace (same idiom as audit-service and notification-service). In the
// deployed consolidated-api the global gate has already set req.user; standalone
// this verifies the Bearer token itself.
import { verifyToken } from '@aib-iaas/auth';

export const paymentsRouter = Router();

// ─── Access control (A2) ─────────────────────────────────────────────────────
// Previously every payment route was open: anyone who guessed a payment id could
// read its status, drive a provider confirmation, or refund it. Payments are now
// tied to the application that owns them. An anonymous /apply caller proves they
// created the application with the SAME application-scoped capability token used
// to read the application back (api-gateway applications.ts:38-52); staff are
// identified by their session token. Refund is a staff-only transition.

interface Caller { userId: string; role: string; permissions: string[]; }

/** The verified caller: req.user when the global gate set it, else the Bearer token. */
function callerFromRequest(req: Request): Caller | null {
  const u = (req as any).user;
  if (u?.userId) return { userId: u.userId, role: u.role, permissions: u.permissions || [] };
  const header = req.headers?.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    const claims = verifyToken(header.slice(7));
    return { userId: claims.userId, role: claims.role, permissions: claims.permissions || [] };
  } catch {
    return null;
  }
}

/** Staff = any authenticated non-applicant. No `payments.*` permission exists in
 *  the RBAC seed, so staff role is the authority for the staff-only transitions.
 *  A plain boolean predicate (not a `caller is Caller` type guard) so negating it
 *  never narrows a non-null Caller to `never` under tsc. */
function isStaff(caller: Caller | null): boolean {
  return !!caller && caller.role !== 'debtor';
}

/** Does the request carry a valid capability for `applicationId`? Mirrors
 *  api-gateway applications.ts hasValidCapability (replicated to keep the build
 *  self-contained — payment-service imports no gateway source). */
function hasValidCapability(req: Request, applicationId: string | null | undefined): boolean {
  if (!applicationId) return false;
  const header = req.headers?.['x-application-capability'];
  const token = Array.isArray(header) ? header[0] : header;
  if (!token) return false;
  try {
    const claims = verifyToken<{ purpose?: string; applicationId?: string }>(token);
    return claims.purpose === 'application-capability' && claims.applicationId === applicationId;
  } catch {
    return false;
  }
}

/**
 * Allow access to a payment when the caller is staff OR proves (via the
 * application-scoped capability) that they own the application the payment is
 * for. Sends 404 and returns false otherwise — 404 (not 403) so a guessed
 * payment id is never confirmed to exist.
 */
function allowPaymentAccess(req: Request, res: Response, applicationId: string | null | undefined): boolean {
  if (isStaff(callerFromRequest(req)) || hasValidCapability(req, applicationId)) return true;
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
  return false;
}

// The CORE payment record (id, application, amount, currency, status, provider +
// provider_ref, timestamps) persists in SQLite via PaymentRepository, so a payment
// survives a restart — previously it lived in an in-memory Map and was lost. The
// RICH simulated fields (method, providerResponse, transactionReference, and the
// sandbox disclaimer) are presentation only: they describe the simulated provider
// round-trip and are composed into the HTTP response body, never stored.
const { payments } = createRepositories();

// Initiate payment session. Part of the anonymous /apply fee flow, so an
// anonymous caller is allowed only with a valid capability for this
// application; staff may always initiate. (A2)
paymentsRouter.post('/initiate', (req: Request, res: Response) => {
  const { applicationId, amount, currency = 'GBP', description } = req.body;

  if (!allowPaymentAccess(req, res, applicationId)) return;

  let payment;
  try {
    payment = payments.create({ applicationId, amount, currency });
  } catch {
    res.status(400).json({ success: false, error: { code: 'INVALID_APPLICATION', message: 'Payment could not be linked to the given application.' } });
    return;
  }

  res.status(201).json({
    success: true,
    data: {
      ...payment,
      description: description || 'AiB Application Fee',
      sandbox: true,
      disclaimer: 'SANDBOX MODE: No real payment will be processed.',
    },
  });
});

// Apple Pay simulation
paymentsRouter.post('/apple-pay', (req: Request, res: Response) => {
  const { paymentId, applePayToken } = req.body;
  const payment = payments.findById(paymentId);

  if (!payment) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
    return;
  }
  if (!allowPaymentAccess(req, res, payment.applicationId)) return;

  // Simulate 90% success rate
  const success = Math.random() > 0.1;
  const status = success ? 'completed' : 'failed';
  const transactionReference = success ? `AP-${uuid().slice(0, 8).toUpperCase()}` : undefined;

  payments.updateStatus(payment.id, status);
  if (transactionReference) payments.setProviderRef(payment.id, 'apple_pay', transactionReference);
  const updated = payments.findById(payment.id)!;

  res.json({
    success: true,
    data: {
      ...updated,
      method: 'apple_pay',
      transactionReference,
      processedAt: new Date().toISOString(),
      providerResponse: {
        sandbox: true,
        token: applePayToken || 'mock-apple-pay-token',
        message: success ? 'Payment approved (SANDBOX)' : 'Payment declined (SANDBOX - simulated failure)',
      },
    },
  });
});

// Google Pay simulation
paymentsRouter.post('/google-pay', (req: Request, res: Response) => {
  const { paymentId, googlePayToken } = req.body;
  const payment = payments.findById(paymentId);

  if (!payment) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
    return;
  }
  if (!allowPaymentAccess(req, res, payment.applicationId)) return;

  const success = Math.random() > 0.1;
  const status = success ? 'completed' : 'failed';
  const transactionReference = success ? `GP-${uuid().slice(0, 8).toUpperCase()}` : undefined;

  payments.updateStatus(payment.id, status);
  if (transactionReference) payments.setProviderRef(payment.id, 'google_pay', transactionReference);
  const updated = payments.findById(payment.id)!;

  res.json({
    success: true,
    data: {
      ...updated,
      method: 'google_pay',
      transactionReference,
      processedAt: new Date().toISOString(),
      providerResponse: {
        sandbox: true,
        token: googlePayToken || 'mock-google-pay-token',
        message: success ? 'Payment approved (SANDBOX)' : 'Payment declined (SANDBOX - simulated failure)',
      },
    },
  });
});

// Card payment simulation
paymentsRouter.post('/card', (req: Request, res: Response) => {
  const { paymentId, cardNumber, expiryDate, cvv, cardholderName } = req.body;
  const payment = payments.findById(paymentId);

  if (!payment) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
    return;
  }
  if (!allowPaymentAccess(req, res, payment.applicationId)) return;

  // Basic validation (POC only - no real card processing)
  if (!cardNumber || !expiryDate || !cvv) {
    res.status(400).json({ success: false, error: { code: 'INVALID_CARD', message: 'Card details incomplete' } });
    return;
  }

  const success = Math.random() > 0.1;
  const lastFour = cardNumber.slice(-4);
  const status = success ? 'completed' : 'failed';
  const transactionReference = success ? `CD-${uuid().slice(0, 8).toUpperCase()}` : undefined;

  payments.updateStatus(payment.id, status);
  if (transactionReference) payments.setProviderRef(payment.id, 'card', transactionReference);
  const updated = payments.findById(payment.id)!;

  res.json({
    success: true,
    data: {
      ...updated,
      method: 'card',
      transactionReference,
      processedAt: new Date().toISOString(),
      providerResponse: {
        sandbox: true,
        lastFour,
        cardholderName: cardholderName || 'CARDHOLDER',
        message: success ? 'Payment approved (SANDBOX)' : 'Payment declined (SANDBOX - simulated failure)',
        disclaimer: 'NO REAL PAYMENT PROCESSED. This is a sandbox simulation.',
      },
    },
  });
});

// Get payment status. Caller must own the application (capability) or be staff. (A2)
paymentsRouter.get('/:id/status', (req: Request, res: Response) => {
  const payment = payments.findById(req.params.id);
  if (!payment) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
    return;
  }
  if (!allowPaymentAccess(req, res, payment.applicationId)) return;
  res.json({ success: true, data: payment });
});

// Simulate refund. A refund is a staff-only transition — an applicant may pay but
// never reverse a payment. (A2)
paymentsRouter.post('/:id/refund', (req: Request, res: Response) => {
  if (!isStaff(callerFromRequest(req))) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only staff may refund a payment.' } });
    return;
  }
  const payment = payments.findById(req.params.id);
  if (!payment) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
    return;
  }
  if (payment.status !== 'completed') {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Only completed payments can be refunded' } });
    return;
  }

  payments.updateStatus(payment.id, 'refunded');
  const refundReference = `RF-${uuid().slice(0, 8).toUpperCase()}`;
  const updated = payments.findById(payment.id)!;

  res.json({
    success: true,
    data: { ...updated, refundedAt: new Date().toISOString(), refundReference },
  });
});
