import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { createRepositories } from '@aib-iaas/database';

export const paymentsRouter = Router();

// The CORE payment record (id, application, amount, currency, status, provider +
// provider_ref, timestamps) persists in SQLite via PaymentRepository, so a payment
// survives a restart — previously it lived in an in-memory Map and was lost. The
// RICH simulated fields (method, providerResponse, transactionReference, and the
// sandbox disclaimer) are presentation only: they describe the simulated provider
// round-trip and are composed into the HTTP response body, never stored.
const { payments } = createRepositories();

// Initiate payment session
paymentsRouter.post('/initiate', (req: Request, res: Response) => {
  const { applicationId, amount, currency = 'GBP', description } = req.body;

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

// Get payment status
paymentsRouter.get('/:id/status', (req: Request, res: Response) => {
  const payment = payments.findById(req.params.id);
  if (!payment) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
    return;
  }
  res.json({ success: true, data: payment });
});

// Simulate refund
paymentsRouter.post('/:id/refund', (req: Request, res: Response) => {
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
