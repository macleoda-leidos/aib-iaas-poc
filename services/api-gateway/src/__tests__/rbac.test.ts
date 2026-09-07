import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { authenticate, requirePermission, requireAnyPermission, requireRoleLevel, optionalAuth, clearPermissionCache, AuthenticatedRequest } from '../middleware/rbac';
import { Response, NextFunction } from 'express';
import { issueAccessToken, generateKeyPairPem, resetSigningKeys } from '@aib-iaas/auth';
import { users } from '../db';

/**
 * `authenticate` is the only thing standing between an anonymous request and a
 * staff-level action, so most of what follows is an attempt to get past it. The
 * tokens it used to accept were base64-encoded JSON with no signature, which meant
 * the tests below marked "regression" describe behaviour that genuinely worked.
 *
 * The middleware makes three separate checks — signature, live session, and
 * permissions read from the database — and each is tested on its own, because any
 * one of them silently going missing leaves the other two looking like a complete
 * authorisation story.
 */

function mockResponse(): Response {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

function bearer(token: string): AuthenticatedRequest {
  return { headers: { authorization: `Bearer ${token}` } } as AuthenticatedRequest;
}

/** The token format this replaced: unsigned, and trusted on sight. */
function legacyToken(payload: any): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/** Issue a token and register the session behind it, as login does. */
async function login(userId: string, email: string, role: string, roleLevel = 100) {
  const { token, expiresAt } = issueAccessToken({ userId, email, role, roleLevel });
  await users.createSession(userId, token, expiresAt);
  return token;
}

const originalKeys = { priv: process.env.JWT_PRIVATE_KEY, pub: process.env.JWT_PUBLIC_KEY };

beforeAll(() => {
  // A fixed keypair, so signing here and verifying in the middleware agree without
  // relying on the ephemeral-key fallback (which would also work, being one
  // process, but would log a warning on every run and hide a real misconfiguration).
  const keys = generateKeyPairPem();
  process.env.JWT_PRIVATE_KEY = keys.privateKey;
  process.env.JWT_PUBLIC_KEY = keys.publicKey;
  resetSigningKeys();
});

afterAll(() => {
  if (originalKeys.priv === undefined) delete process.env.JWT_PRIVATE_KEY;
  else process.env.JWT_PRIVATE_KEY = originalKeys.priv;
  if (originalKeys.pub === undefined) delete process.env.JWT_PUBLIC_KEY;
  else process.env.JWT_PUBLIC_KEY = originalKeys.pub;
  resetSigningKeys();
});

beforeEach(() => {
  // Permissions are cached for a few seconds; left in place, one test's grants
  // would leak into the next.
  clearPermissionCache();
});

describe('RBAC Middleware - authenticate', () => {
  it('rejects request with no authorization header', async () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects request with non-Bearer authorization', async () => {
    const req = { headers: { authorization: 'Basic abc123' } } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an unparseable token', async () => {
    const res = mockResponse();
    const next = vi.fn();

    await authenticate(bearer('not-valid-base64-json'), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'INVALID_TOKEN' }),
    }));
    expect(next).not.toHaveBeenCalled();
  });

  describe('regression — the unsigned token format', () => {
    it('refuses a legacy base64 token, however well formed', async () => {
      // This exact payload was a valid admin session before signing existed.
      const token = legacyToken({
        userId: 'user-admin',
        email: 'admin@aib-poc.example.com',
        role: 'system_admin',
        roleLevel: 100,
        permissions: ['reports.read'],
        exp: Date.now() + 60_000,
      });
      const res = mockResponse();
      const next = vi.fn();

      await authenticate(bearer(token), res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('refuses a signed token whose payload was edited to escalate role', async () => {
      // The attack the old scheme could not detect: take a legitimate low-privilege
      // token, rewrite the role, keep the signature.
      const token = await login('user-debtor', 'john.testerton@example.com', 'debtor', 10);
      const [header, payload, signature] = token.split('.');
      const edited = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
      edited.role = 'system_admin';
      edited.roleLevel = 100;
      const forgedPayload = Buffer.from(JSON.stringify(edited)).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const res = mockResponse();
      const next = vi.fn();

      await authenticate(bearer(`${header}.${forgedPayload}.${signature}`), res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ code: 'INVALID_TOKEN' }),
      }));
      expect(next).not.toHaveBeenCalled();
    });
  });

  it('rejects an expired token as TOKEN_EXPIRED, distinctly from invalid', async () => {
    const { token } = issueAccessToken({
      userId: 'user-admin', email: 'admin@aib-poc.example.com', role: 'system_admin', ttlSeconds: -10,
    });
    const res = mockResponse();
    const next = vi.fn();

    await authenticate(bearer(token), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'TOKEN_EXPIRED' }),
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a token with no expiry at all', async () => {
    // Previously accepted — "no exp field" was treated as "never expires", so a
    // leaked token was valid forever. A token without a usable exp is now refused.
    const noExpiry = legacyToken({ userId: 'user-admin', email: 'a@b.com', role: 'system_admin' });
    const res = mockResponse();
    const next = vi.fn();

    await authenticate(bearer(noExpiry), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a signed token backed by a live session and attaches the user', async () => {
    const token = await login('user-admin', 'admin@aib-poc.example.com', 'system_admin');
    const req = bearer(token);
    const res = mockResponse();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.userId).toBe('user-admin');
    expect(req.user!.email).toBe('admin@aib-poc.example.com');
    expect(req.user!.role).toBe('system_admin');
  });

  describe('session validation', () => {
    it('rejects a perfectly valid token with no session behind it', async () => {
      // Signed by us and unexpired, but never registered — or logged out since.
      // Without this check, revocation would be impossible and logout cosmetic.
      const { token } = issueAccessToken({
        userId: 'user-admin', email: 'admin@aib-poc.example.com', role: 'system_admin',
      });
      const res = mockResponse();
      const next = vi.fn();

      await authenticate(bearer(token), res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ code: 'SESSION_ENDED' }),
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('stops accepting a token the moment its session is deleted', async () => {
      // Logout must take effect immediately, not when the token expires. This is
      // the test that would fail if session validity were ever cached.
      const token = await login('user-admin', 'admin@aib-poc.example.com', 'system_admin');

      const first = mockResponse();
      const firstNext = vi.fn();
      await authenticate(bearer(token), first, firstNext);
      expect(firstNext).toHaveBeenCalled();

      await users.deleteSession(token);

      const second = mockResponse();
      const secondNext = vi.fn();
      await authenticate(bearer(token), second, secondNext);
      expect(second.status).toHaveBeenCalledWith(401);
      expect(secondNext).not.toHaveBeenCalled();
    });
  });

  it('surfaces a database failure as a server error, not as a denial', async () => {
    // If the permission lookup fails, "no permissions" is the wrong answer: it
    // renders as a 403 and reads as a deliberate policy decision, sending whoever
    // is on call looking at RBAC data instead of at the database. It must reach the
    // error handler as the fault it is.
    const token = await login('user-admin', 'admin@aib-poc.example.com', 'system_admin');
    const boom = new Error('SQLITE_BUSY: database is locked');
    const spy = vi.spyOn(users, 'findSessionByToken').mockRejectedValueOnce(boom);

    const res = mockResponse();
    const next = vi.fn();
    await authenticate(bearer(token), res, next);

    expect(next).toHaveBeenCalledWith(boom);
    expect(res.status).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  describe('the sessions table is not a store of usable credentials', () => {
    it('records the token’s jti, never the token', async () => {
      // The table held whole bearer tokens in plaintext, making any read of it —
      // a backup, a read replica, a debug SELECT * — immediate session hijack for every
      // logged-in user, with no cracking step. The jti identifies the session without
      // being usable as one.
      const token = await login('user-admin', 'admin@aib-poc.example.com', 'system_admin');
      const jti = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).jti;

      const stored = await users.findSessionByToken(token);
      expect(stored).not.toBeNull();
      // The `token` column now holds the handle.
      expect(stored!.token).toBe(jti);
      expect(stored!.token).not.toBe(token);
      expect(stored!.token).not.toContain('.');
    });

    it('still authenticates and still revokes on that handle', async () => {
      // Storing less must not cost either property.
      const token = await login('user-admin', 'admin@aib-poc.example.com', 'system_admin');

      const before = vi.fn();
      await authenticate(bearer(token), mockResponse(), before);
      expect(before).toHaveBeenCalled();

      await users.deleteSession(token);

      const res = mockResponse();
      const after = vi.fn();
      await authenticate(bearer(token), res, after);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(after).not.toHaveBeenCalled();
    });

    it('does not match a forged token whose jti was invented', async () => {
      // A jti is only an index key, so it is read without verification — the signature
      // check happens first. An attacker who guesses a jti still fails at the signature.
      const real = await login('user-admin', 'admin@aib-poc.example.com', 'system_admin');
      const jti = JSON.parse(Buffer.from(real.split('.')[1], 'base64url').toString()).jti;

      const forged = legacyToken({ userId: 'user-admin', role: 'system_admin', jti, exp: Date.now() + 60_000 });
      const res = mockResponse();
      const next = vi.fn();
      await authenticate(bearer(forged), res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('permissions come from the database, not the token', () => {
    it('attaches the grants the database holds for that user', async () => {
      // user-admin is seeded with reports.read; the token carries no permissions at
      // all, so anything present here was resolved server-side.
      const token = await login('user-admin', 'admin@aib-poc.example.com', 'system_admin');
      const req = bearer(token);
      await authenticate(req, mockResponse(), vi.fn());

      const fromDatabase = (await users.getPermissionsForUser('user-admin')).map(p => p.code);
      expect(req.user!.permissions).toEqual(fromDatabase);
      expect(req.user!.permissions).toContain('reports.read');
    });

    it('does not grant a debtor an admin-only permission', async () => {
      const token = await login('user-debtor', 'john.testerton@example.com', 'debtor', 10);
      const req = bearer(token);
      await authenticate(req, mockResponse(), vi.fn());

      expect(req.user!.permissions).not.toContain('reports.read');
      expect(req.user!.permissions).toContain('applications.submit');
    });

    it('reflects a permission change without the user logging in again', async () => {
      // The reason authorisation moved off the token. Changing the user's role used
      // to require a fresh login to take effect, which meant a demotion did not.
      const token = await login('user-debtor', 'john.testerton@example.com', 'debtor', 10);

      const before = bearer(token);
      await authenticate(before, mockResponse(), vi.fn());
      expect(before.user!.permissions).not.toContain('reports.read');

      await users.update('user-debtor', { roleId: 'role-sysadmin' });
      clearPermissionCache('user-debtor');

      const after = bearer(token);
      await authenticate(after, mockResponse(), vi.fn());
      expect(after.user!.permissions).toContain('reports.read');

      await users.update('user-debtor', { roleId: 'role-debtor' });
    });
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
  it('calls next without attaching user when no auth header', async () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('attaches user for a signed token with a live session', async () => {
    const token = await login('user-adviser', 'adviser@cas.example.org', 'money_adviser', 50);
    const req = bearer(token);
    const res = mockResponse();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.email).toBe('adviser@cas.example.org');
  });

  it('does not attach user if token is expired', async () => {
    const { token } = issueAccessToken({
      userId: 'user-adviser', email: 'adviser@cas.example.org', role: 'money_adviser', ttlSeconds: -10,
    });
    const req = bearer(token);
    const res = mockResponse();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('does not attach user if token is invalid', async () => {
    const req = bearer('garbage-not-base64-json');
    const res = mockResponse();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('does not attach user for a valid token whose session has ended', async () => {
    // "Optional" governs whether a token is required, not whether it is checked —
    // otherwise this would be the way round every other guard.
    const { token } = issueAccessToken({
      userId: 'user-adviser', email: 'adviser@cas.example.org', role: 'money_adviser',
    });
    const req = bearer(token);
    const res = mockResponse();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('ignores a legacy unsigned token rather than trusting it', async () => {
    const req = bearer(legacyToken({ userId: 'user-admin', role: 'system_admin', exp: Date.now() + 60_000 }));
    const res = mockResponse();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });
});
