import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

let uuidSeq = 0;
vi.mock('uuid', () => ({
  v4: () => `pay-uuid-${++uuidSeq}`,
}));

import { paymentsRouter } from '../routes/payments';
import { getDatabase } from '@aib-iaas/database';
import { signToken } from '@aib-iaas/auth';

// A valid application-scoped capability (same shape api-gateway issues at create).
const capabilityFor = (applicationId: string) =>
  signToken({ purpose: 'application-capability', applicationId }, { expiresInSeconds: 3600 });

// Payment routes are now access-controlled (A2): staff may act on any payment,
// an anonymous /apply caller only with the application-scoped capability, and a
// refund is staff-only. These unit tests drive the handlers directly, so the
// mock request carries a staff `user` by default (as the global gate would set
// in the deployed consolidated-api), satisfying the ownership check. Pass
// `{ user: undefined }` to simulate an anonymous caller.
function createMockReq(overrides: any = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: { userId: 'USR-OFFICER', role: 'aib_officer', permissions: [] },
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
  beforeAll(() => {
    // Payments now persist in SQLite and application_id carries a foreign key to
    // applications(id). Seed the parent rows the tests below reference so each
    // /initiate satisfies the FK.
    const db = getDatabase();
    const insertApp = db.prepare(
      "INSERT OR IGNORE INTO applications (id, reference_number, status, created_at, updated_at) VALUES (?, ?, 'draft', datetime('now'), datetime('now'))"
    );
    for (const id of ['app-001', 'app-002', 'app-003', 'app-004']) insertApp.run(id, `TEST-${id}`);
  });

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

    it('returns 400 when the applicationId has no matching application (FK)', () => {
      const handler = getHandler(paymentsRouter, 'post', '/initiate');
      const req = createMockReq({ body: { applicationId: 'does-not-exist', amount: 100 } });
      const res = createMockRes();

      handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].error.code).toBe('INVALID_APPLICATION');
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

  describe('POST /apple-pay (wallet simulation)', () => {
    it('completes an apple-pay payment and sets the provider ref', () => {
      const paymentId = createPayment({ applicationId: 'app-001', amount: 100 });
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5); // force success

      const handler = getHandler(paymentsRouter, 'post', '/apple-pay');
      const req = createMockReq({ body: { paymentId, applePayToken: 'tok-abc' } });
      const res = createMockRes();
      handler(req, res);
      randomSpy.mockRestore();

      const data = res.json.mock.calls[0][0].data;
      expect(data.id).toBe(paymentId);
      expect(data.method).toBe('apple_pay');
      expect(data.status).toBe('completed');
      expect(data.transactionReference).toContain('AP-');
      expect(data.provider).toBe('apple_pay');
      expect(data.providerResponse.sandbox).toBe(true);
    });

    it('marks apple-pay failed on a simulated decline (no provider ref)', () => {
      const paymentId = createPayment({ applicationId: 'app-001', amount: 100 });
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.0); // force failure

      const handler = getHandler(paymentsRouter, 'post', '/apple-pay');
      const req = createMockReq({ body: { paymentId } });
      const res = createMockRes();
      handler(req, res);
      randomSpy.mockRestore();

      const data = res.json.mock.calls[0][0].data;
      expect(data.status).toBe('failed');
      expect(data.transactionReference).toBeUndefined();
    });

    it('returns 404 for apple-pay on a non-existent payment', () => {
      const handler = getHandler(paymentsRouter, 'post', '/apple-pay');
      const req = createMockReq({ body: { paymentId: 'nope', applePayToken: 't' } });
      const res = createMockRes();
      handler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('POST /google-pay (wallet simulation)', () => {
    it('completes a google-pay payment and sets the provider ref', () => {
      const paymentId = createPayment({ applicationId: 'app-002', amount: 90 });
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5); // force success

      const handler = getHandler(paymentsRouter, 'post', '/google-pay');
      const req = createMockReq({ body: { paymentId, googlePayToken: 'tok-xyz' } });
      const res = createMockRes();
      handler(req, res);
      randomSpy.mockRestore();

      const data = res.json.mock.calls[0][0].data;
      expect(data.method).toBe('google_pay');
      expect(data.status).toBe('completed');
      expect(data.transactionReference).toContain('GP-');
      expect(data.provider).toBe('google_pay');
    });

    it('returns 404 for google-pay on a non-existent payment', () => {
      const handler = getHandler(paymentsRouter, 'post', '/google-pay');
      const req = createMockReq({ body: { paymentId: 'nope' } });
      const res = createMockRes();
      handler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
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

  describe('access control (A2)', () => {
    it('anonymous initiate without a capability → 404', () => {
      const handler = getHandler(paymentsRouter, 'post', '/initiate');
      const req = createMockReq({ user: undefined, body: { applicationId: 'app-001', amount: 100 } });
      const res = createMockRes();
      handler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('anonymous initiate WITH the application capability → 201', () => {
      const handler = getHandler(paymentsRouter, 'post', '/initiate');
      const req = createMockReq({
        user: undefined,
        headers: { 'x-application-capability': capabilityFor('app-002') },
        body: { applicationId: 'app-002', amount: 100 },
      });
      const res = createMockRes();
      handler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('anonymous status read with the matching capability → 200', () => {
      const paymentId = createPayment({ applicationId: 'app-003', amount: 100 }); // staff default
      const handler = getHandler(paymentsRouter, 'get', '/:id/status');
      const req = createMockReq({
        user: undefined,
        headers: { 'x-application-capability': capabilityFor('app-003') },
        params: { id: paymentId },
      });
      const res = createMockRes();
      handler(req, res);
      expect(res.json.mock.calls[0][0].data.id).toBe(paymentId);
    });

    it('anonymous status read with a capability for a DIFFERENT application → 404', () => {
      const paymentId = createPayment({ applicationId: 'app-003', amount: 100 });
      const handler = getHandler(paymentsRouter, 'get', '/:id/status');
      const req = createMockReq({
        user: undefined,
        headers: { 'x-application-capability': capabilityFor('app-004') }, // wrong app
        params: { id: paymentId },
      });
      const res = createMockRes();
      handler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('refund by a non-staff (anonymous) caller → 403, even with a valid capability', () => {
      const paymentId = createPayment({ applicationId: 'app-001', amount: 100 });
      // Complete it as staff first.
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const cardHandler = getHandler(paymentsRouter, 'post', '/card');
      cardHandler(createMockReq({ body: { paymentId, cardNumber: '4111111111111111', expiryDate: '12/26', cvv: '123' } }), createMockRes());
      randomSpy.mockRestore();

      const handler = getHandler(paymentsRouter, 'post', '/:id/refund');
      const req = createMockReq({
        user: undefined,
        headers: { 'x-application-capability': capabilityFor('app-001') },
        params: { id: paymentId },
      });
      const res = createMockRes();
      handler(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('persistence (repo-backed core record)', () => {
    it('stores the core record and keeps simulated fields out of the row', () => {
      const paymentId = createPayment({ applicationId: 'app-001', amount: 120 });

      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5); // force success
      const cardHandler = getHandler(paymentsRouter, 'post', '/card');
      const req = createMockReq({ body: { paymentId, cardNumber: '4111111111111111', expiryDate: '12/26', cvv: '123' } });
      const res = createMockRes();
      cardHandler(req, res);
      randomSpy.mockRestore();

      const row = getDatabase().prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as any;
      expect(row).toBeTruthy();
      expect(row.application_id).toBe('app-001');
      expect(row.status).toBe('completed');
      expect(row.provider).toBe('card');
      expect(row.provider_ref).toContain('CD-');
      // Presentation-only fields are never persisted — they are not columns.
      expect(row.provider_response).toBeUndefined();
      expect(row.method).toBeUndefined();
      expect(row.transaction_reference).toBeUndefined();
    });
  });
});
