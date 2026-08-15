import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '../middleware/errorHandler';
import { Request, Response, NextFunction } from 'express';

function mockResponse(): Response {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('Error Handler Middleware', () => {
  const mockReq = {} as Request;
  const mockNext: NextFunction = vi.fn();

  it('returns 500 status with INTERNAL_ERROR code', () => {
    const res = mockResponse();
    const err = new Error('Something went wrong');

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({ code: 'INTERNAL_ERROR' }),
    }));
  });

  it('exposes error message in non-production environment', () => {
    const res = mockResponse();
    const err = new Error('Detailed error info');
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    errorHandler(err, mockReq, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ message: 'Detailed error info' }),
    }));
    process.env.NODE_ENV = origEnv;
  });

  it('hides error message in production environment', () => {
    const res = mockResponse();
    const err = new Error('Secret details');
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    errorHandler(err, mockReq, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ message: 'An unexpected error occurred' }),
    }));
    process.env.NODE_ENV = origEnv;
  });

  it('always returns success: false', () => {
    const res = mockResponse();
    const err = new Error('any');

    errorHandler(err, mockReq, res, mockNext);

    const jsonCall = (res.json as any).mock.calls[0][0];
    expect(jsonCall.success).toBe(false);
  });
});
