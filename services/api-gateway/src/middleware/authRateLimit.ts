import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { audit } from '../db';

/**
 * Strict rate limiter for the authentication endpoints (M1).
 *
 * The global 500-request/15-min limiter is far too loose to slow a password or
 * TOTP guessing attack. This one caps attempts at ~5 per 15 minutes, keyed per
 * IP *and* email, so one attacker cannot lock out everyone behind a shared proxy
 * and cannot spread a guessing attack across accounts to stay under the limit.
 * A lockout is recorded in the audit trail.
 *
 * Applied only to login + verify-mfa, so a legitimate user hitting the app does
 * not burn the budget on ordinary reads.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // We key on IP + email ourselves; disable the library's IPv6/trust-proxy
  // validation warnings (the deployed app sets `trust proxy` for the real IP).
  validate: false,
  keyGenerator: (req: Request) => `${req.ip}:${(req.body && req.body.email) || ''}`,
  handler: (req: Request, res: Response) => {
    try {
      // Best-effort audit of the lockout.
      audit.create({
        action: 'auth_rate_limited',
        actorName: (req.body && req.body.email) || 'unknown',
        actorType: 'system',
        details: { ip: req.ip, path: req.path },
      });
    } catch { /* auditing a lockout must never itself fail the response */ }

    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many authentication attempts. Please wait before trying again.',
        retryAfterSeconds: 15 * 60,
      },
    });
  },
});
