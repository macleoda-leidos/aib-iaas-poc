import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let uuidSeq = 0;
vi.mock('uuid', () => ({
  v4: () => `pay-uuid-${++uuidSeq}`,
}));

import { paymentsRouter } from '../routes/payments';

function createMockReq(overrides: any = {}) {
  return {
    body: {},
    params: {},
    query: {},
    ...overrides,
  };
}

function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function getHandler(router: any, method: string, path: string) {
  const layer = router.stack.find(
    (l: any) => l.route?.path === path && l.route?.methods[method]
  );
  return layer?.route?.stack[0]?.handle;
}

// Helper: create a payment and return the assigned ID
function createPayment(body: any = { applicationId: 'app-001', amount: 100 }): string {
  const handler = getHandler(paymentsRouter, 'post', '/initiate');
  const req = createMockReq({ body });
  const res = createMockRes();
  handler(req, res);
  return res.json.mock.calls[0][0].data.id;
}

describe('Payment Service - /api/payments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /initiate', () => {
    it('creates a payment with status pending', () => {
      const handler = getHandler(paymentsRouter, 'post', '/initiate');
      const req = createMockReq({
        body: {
          applicationId: 'app-001',
          amount: 150.00,
          currency: 'GBP',
          description: 'Application fee',
        },
      });
      const res = createMockRes();

      handler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const data = res.json.mock.calls[0][0].data;
      expect(data.applicationId).toBe('app-001');
      expect(data.amount).toBe(150.00);
      expect(data.currency).toBe('GBP');
      expect(data.status).toBe('pending');
      expect(data.sandbox).toBe(true);
    });

    it('defaults currency to GBP when not provided', () => {
      const handler = getHandler(paymentsRouter, 'post', '/initiate');
      const req = createMockReq({
        body: { applicationId: 'app-002', amount: 90 },
      });
      const res = createMockRes();

      handler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.currency).toBe('GBP');
    });

    it('defaults description to "AiB Application Fee" when not provided', () => {
      const handler = getHandler(paymentsRouter, 'post', '/initiate');
      const req = createMockReq({
        body: { applicationId: 'app-003', amount: 200 },
      });
      const res = createMockRes();

      handler(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.description).toBe('AiB Application Fee');
    });

    it('includes sandbox disclaimer in response', () => {
      const handler = getHandler(paymentsRouter, 'post', '/initiate');
      const req = createMockReq({
        body: { applicationId: 'app-004', amount: 100 },
      });
      const res = createMockRes();

      handler(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.sandbox).toBe(true);
      expect(responseData.disclaimer).toContain('SANDBOX');
    });
  });

  describe('GET /:id/status', () => {
    it('returns payment status for existing payment', () => {
      const paymentId = createPayment({ applicationId: 'app-001', amount: 150 });

      const handler = getHandler(paymentsRouter, 'get', '/:id/status');
      const req = createMockReq({ params: { id: paymentId } });
      const res = createMockRes();

      handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: paymentId,
          status: 'pending',
        }),
      });
    });

    it('returns 404 for non-existent payment', () => {
      const handler = getHandler(paymentsRouter, 'get', '/:id/status');
      const req = createMockReq({ params: { id: 'nonexistent-pay-id' } });
      const res = createMockRes();

      handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Payment not found' },
      });
    });
  });

  describe('POST /card (card payment simulation)', () => {
    it('processes card payment for existing payment', () => {
      const paymentId = createPayment({ applicationId: 'app-001', amount: 100 });

      // Mock Math.random to guarantee success
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const handler = getHandler(paymentsRouter, 'post', '/card');
      const req = createMockReq({
        body: {
          paymentId,
          cardNumber: '4111111111111111',
          expiryDate: '12/26',
          cvv: '123',
          cardholderName: 'John Smith',
        },
      });
      const res = createMockRes();

      handler(req, res);

      const data = res.json.mock.calls[0][0].data;
      expect(data.id).toBe(paymentId);
      expect(data.method).toBe('card');
      expect(data.status).toBe('completed');

      randomSpy.mockRestore();
    });

    it('returns 400 for incomplete card details', () => {
      const paymentId = createPayment({ applicationId: 'app-001', amount: 100 });

      const handler = getHandler(paymentsRouter, 'post', '/card');
      const req = createMockReq({
        body: {
          paymentId,
          cardNumber: '4111111111111111',
          expiryDate: '12/26',
          // missing cvv
        },
      });
      const res = createMockRes();

      handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INVALID_CARD', message: 'Card details incomplete' },
      });
    });

    it('returns 404 for card payment on non-existent payment', () => {
      const handler = getHandler(paymentsRouter, 'post', '/card');
      const req = createMockReq({
        body: {
          paymentId: 'nonexistent-id',
          cardNumber: '4111111111111111',
          expiryDate: '12/26',
          cvv: '123',
        },
      });
      const res = createMockRes();

      handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('POST /:id/refund', () => {
    it('refunds a completed payment', () => {
      const paymentId = createPayment({ applicationId: 'app-001', amount: 100 });

      // Complete the payment via card
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const cardHandler = getHandler(paymentsRouter, 'post', '/card');
      const cardReq = createMockReq({
        body: { paymentId, cardNumber: '4111111111111111', expiryDate: '12/26', cvv: '123' },
      });
      const cardRes = createMockRes();
      cardHandler(cardReq, cardRes);

      // Now refund
      const handler = getHandler(paymentsRouter, 'post', '/:id/refund');
      const req = createMockReq({ params: { id: paymentId } });
      const res = createMockRes();

      handler(req, res);

      const data = res.json.mock.calls[0][0].data;
      expect(data.status).toBe('refunded');
      expect(data.refundReference).toContain('RF-');

      randomSpy.mockRestore();
    });

    it('returns 400 when refunding a non-completed payment', () => {
      const paymentId = createPayment({ applicationId: 'app-001', amount: 100 });

      // Try to refund pending payment (never completed)
      const handler = getHandler(paymentsRouter, 'post', '/:id/refund');
      const req = createMockReq({ params: { id: paymentId } });
      const res = createMockRes();

      handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INVALID_STATE', message: 'Only completed payments can be refunded' },
      });
    });

    it('returns 404 for refund on non-existent payment', () => {
      const handler = getHandler(paymentsRouter, 'post', '/:id/refund');
      const req = createMockReq({ params: { id: 'nonexistent-refund' } });
      const res = createMockRes();

      handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
