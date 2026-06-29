import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export const paymentsRouter = Router();

// In-memory payment store
const payments = new Map<string, any>();

// Initiate payment session
paymentsRouter.post('/initiate', (req: Request, res: Response) => {
  const { applicationId, amount, currency = 'GBP', description } = req.body;
  const paymentId = uuid();

  const payment = {
    id: paymentId,
    applicationId,
    amount,
    currency,
    description: description || 'AiB Application Fee',
    status: 'pending',
    createdAt: new Date().toISOString(),
    sandbox: true,
    disclaimer: 'SANDBOX MODE: No real payment will be processed.',
  };

  payments.set(paymentId, payment);

  res.status(201).json({ success: true, data: payment });
});

// Apple Pay simulation
paymentsRouter.post('/apple-pay', (req: Request, res: Response) => {
  const { paymentId, applePayToken } = req.body;
  const payment = payments.get(paymentId);

  if (!payment) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
    return;
  }

  // Simulate 90% success rate
  const success = Math.random() > 0.1;

  payment.method = 'apple_pay';
  payment.status = success ? 'completed' : 'failed';
  payment.transactionReference = success ? `AP-${uuid().slice(0, 8).toUpperCase()}` : undefined;
  payment.processedAt = new Date().toISOString();
  payment.providerResponse = {
    sandbox: true,
    token: applePayToken || 'mock-apple-pay-token',
    message: success ? 'Payment approved (SANDBOX)' : 'Payment declined (SANDBOX - simulated failure)',
  };

  res.json({ success: true, data: payment });
});

// Google Pay simulation
paymentsRouter.post('/google-pay', (req: Request, res: Response) => {
  const { paymentId, googlePayToken } = req.body;
  const payment = payments.get(paymentId);

  if (!payment) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
    return;
  }

  const success = Math.random() > 0.1;

  payment.method = 'google_pay';
  payment.status = success ? 'completed' : 'failed';
  payment.transactionReference = success ? `GP-${uuid().slice(0, 8).toUpperCase()}` : undefined;
  payment.processedAt = new Date().toISOString();
  payment.providerResponse = {
    sandbox: true,
    token: googlePayToken || 'mock-google-pay-token',
    message: success ? 'Payment approved (SANDBOX)' : 'Payment declined (SANDBOX - simulated failure)',
  };

  res.json({ success: true, data: payment });
});

// Card payment simulation
paymentsRouter.post('/card', (req: Request, res: Response) => {
  const { paymentId, cardNumber, expiryDate, cvv, cardholderName } = req.body;
  const payment = payments.get(paymentId);

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

  payment.method = 'card';
  payment.status = success ? 'completed' : 'failed';
  payment.transactionReference = success ? `CD-${uuid().slice(0, 8).toUpperCase()}` : undefined;
  payment.processedAt = new Date().toISOString();
  payment.providerResponse = {
    sandbox: true,
    lastFour,
    cardholderName: cardholderName || 'CARDHOLDER',
    message: success ? 'Payment approved (SANDBOX)' : 'Payment declined (SANDBOX - simulated failure)',
    disclaimer: 'NO REAL PAYMENT PROCESSED. This is a sandbox simulation.',
  };

  res.json({ success: true, data: payment });
});

// Get payment status
paymentsRouter.get('/:id/status', (req: Request, res: Response) => {
  const payment = payments.get(req.params.id);
  if (!payment) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
    return;
  }
  res.json({ success: true, data: payment });
});

// Simulate refund
paymentsRouter.post('/:id/refund', (req: Request, res: Response) => {
  const payment = payments.get(req.params.id);
  if (!payment) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
    return;
  }
  if (payment.status !== 'completed') {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Only completed payments can be refunded' } });
    return;
  }

  payment.status = 'refunded';
  payment.refundedAt = new Date().toISOString();
  payment.refundReference = `RF-${uuid().slice(0, 8).toUpperCase()}`;

  res.json({ success: true, data: payment });
});
