import { describe, it, expect, vi } from 'vitest';
import { authenticate, requirePermission, requireAnyPermission, requireRoleLevel, optionalAuth, AuthenticatedRequest } from '../middleware/rbac';
import { Response, NextFunction } from 'express';

function mockResponse(): Response {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

function createToken(payload: any): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

describe('RBAC Middleware - authenticate', () => {
  it('rejects request with no authorization header', () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects request with non-Bearer authorization', () => {
    const req = { headers: { authorization: 'Basic abc123' } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid (non-JSON) token', () => {
    const req = { headers: { authorization: 'Bearer not-valid-base64-json' } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'INVALID_TOKEN' }),
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects expired token', () => {
    const token = createToken({ userId: 'u1', email: 'a@b.com', role: 'admin', exp: Date.now() - 10000, permissions: [] });
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'TOKEN_EXPIRED' }),
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts valid token and attaches user to request', () => {
    const payload = { userId: 'u1', email: 'test@example.com', role: 'admin', roleLevel: 100, permissions: ['applications.read'], exp: Date.now() + 60000 };
    const token = createToken(payload);
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.userId).toBe('u1');
    expect(req.user!.email).toBe('test@example.com');
    expect(req.user!.permissions).toContain('applications.read');
  });

  it('accepts valid token without exp field (no expiry)', () => {
    const payload = { userId: 'u2', email: 'noexp@example.com', role: 'debtor', permissions: [] };
    const token = createToken(payload);
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user!.userId).toBe('u2');
  });
});

describe('RBAC Middleware - requirePermission', () => {
  it('rejects if user is not attached (not authenticated)', () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    requirePermission('applications.read')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects if user lacks required permission', () => {
    const req = { headers: {}, user: { userId: 'u1', email: 'a@b.com', role: 'debtor', roleLevel: 10, permissions: ['applications.update'] } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    requirePermission('applications.read')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'FORBIDDEN' }),
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('passes if user has the required permission', () => {
    const req = { headers: {}, user: { userId: 'u1', email: 'a@b.com', role: 'admin', roleLevel: 100, permissions: ['applications.read', 'reports.read'] } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    requirePermission('reports.read')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('requires ALL specified permissions', () => {
    const req = { headers: {}, user: { userId: 'u1', email: 'a@b.com', role: 'officer', roleLevel: 80, permissions: ['applications.read'] } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    requirePermission('applications.read', 'reports.read')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('RBAC Middleware - requireAnyPermission', () => {
  it('rejects if user is not attached', () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    requireAnyPermission('a', 'b')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('passes if user has at least one of the listed permissions', () => {
    const req = { headers: {}, user: { userId: 'u1', email: 'a@b.com', role: 'debtor', roleLevel: 10, permissions: ['applications.create'] } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    requireAnyPermission('reports.read', 'applications.create')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects if user has none of the listed permissions', () => {
    const req = { headers: {}, user: { userId: 'u1', email: 'a@b.com', role: 'debtor', roleLevel: 10, permissions: ['applications.read'] } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    requireAnyPermission('reports.read', 'users.update')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('RBAC Middleware - requireRoleLevel', () => {
  it('rejects if user is not attached', () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    requireRoleLevel(50)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('passes if user role level meets minimum', () => {
    const req = { headers: {}, user: { userId: 'u1', email: 'a@b.com', role: 'admin', roleLevel: 100, permissions: [] } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    requireRoleLevel(80)(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('passes if user role level equals minimum', () => {
    const req = { headers: {}, user: { userId: 'u1', email: 'a@b.com', role: 'officer', roleLevel: 80, permissions: [] } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    requireRoleLevel(80)(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects if user role level is below minimum', () => {
    const req = { headers: {}, user: { userId: 'u1', email: 'a@b.com', role: 'debtor', roleLevel: 10, permissions: [] } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    requireRoleLevel(50)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'FORBIDDEN' }),
    }));
    expect(next).not.toHaveBeenCalled();
  });
});

describe('RBAC Middleware - optionalAuth', () => {
  it('calls next without attaching user when no auth header', () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('attaches user if valid token present', () => {
    const payload = { userId: 'u1', email: 'opt@example.com', role: 'adviser', roleLevel: 50, permissions: ['applications.create'], exp: Date.now() + 60000 };
    const token = createToken(payload);
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.email).toBe('opt@example.com');
  });

  it('does not attach user if token is expired', () => {
    const payload = { userId: 'u1', email: 'exp@example.com', role: 'adviser', roleLevel: 50, permissions: [], exp: Date.now() - 10000 };
    const token = createToken(payload);
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('does not attach user if token is invalid', () => {
    const req = { headers: { authorization: 'Bearer garbage-not-base64-json' } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });
});
