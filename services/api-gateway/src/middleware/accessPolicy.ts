import { Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from './rbac';

/**
 * Default-deny access policy for the deployed API surface.
 *
 * Before Phase 1, no deployed route applied any authentication or authorisation
 * (C2 in SECURITY_REVIEW): every endpoint was wide open. The policy is now
 * inverted — every request must carry a valid token unless it is on the small
 * public allow-list below. The consolidated-api and the standalone api-gateway
 * both install `enforceAuthentication`, so the two can never drift on which
 * routes are open.
 *
 * The public surface is exactly:
 *   - service metadata: GET /, /api/health, /api/smoke-test
 *   - the authentication endpoints: login + verify-mfa (both the gateway and
 *     user-service mounts), which are necessarily reachable pre-token
 *   - the anonymous applicant-intake the public /apply journey drives: postcode
 *     lookup, the rules engine, the parallel system checks, the applicant's own
 *     credit check, evidence upload+scan, and create/update/submit plus the
 *     capability-URL read-back of a single application
 *   - the reports CSV export (aggregate figures only, no personal data), kept
 *     public for the POC demo's one-click downloads
 *
 * Documented limitation: the applicant-intake routes stay public because the
 * POC has no applicant identity yet, so GET /api/applications/:id is a
 * capability-URL read-back. This defers applicant read-IDOR to GAP-007
 * (federation) while fully gating the staff surface and the statutory
 * approve/reject decision — the substance of C2.
 */
export function isPublicRequest(method: string, path: string): boolean {
  // Normalise a single trailing slash so '/api/applications/' is treated as the
  // list route, not a stray id.
  const p = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;

  // Service metadata.
  if (method === 'GET' && (p === '' || p === '/' || p === '/api/health' || p === '/api/smoke-test')) return true;

  // Authentication endpoints (pre-token by definition).
  if (
    method === 'POST' &&
    (p === '/api/auth/login' ||
      p === '/api/users/auth/login' ||
      p === '/api/auth/verify-mfa' ||
      p === '/api/users/auth/verify-mfa')
  ) {
    return true;
  }

  // ─── Anonymous applicant-intake surface (the public /apply journey) ──
  if (method === 'GET' && p.startsWith('/api/postcode')) return true;          // address lookup
  if (p.startsWith('/api/recommend')) return true;                              // rules engine
  if (p.startsWith('/api/integrations')) return true;                           // parallel system checks
  if (method === 'POST' && p === '/api/credit-check/run') return true;          // applicant's own credit check
  if (method === 'POST' && p === '/api/documents/upload') return true;          // evidence upload
  if (method === 'POST' && /^\/api\/documents\/[^/]+\/scan$/.test(p)) return true; // its scan
  if (method === 'POST' && p === '/api/applications') return true;              // create
  if (method === 'PUT' && /^\/api\/applications\/[^/]+$/.test(p)) return true;  // update draft
  if (method === 'POST' && /^\/api\/applications\/[^/]+\/submit$/.test(p)) return true; // submit
  if (method === 'GET' && /^\/api\/applications\/[^/]+$/.test(p)) return true;  // capability-URL read-back

  // Aggregate reports CSV export — kept public for the demo's downloads.
  if (method === 'GET' && p.startsWith('/api/reports/export')) return true;

  return false;
}

/**
 * Global gate: let the public allow-list through untouched, authenticate
 * everything else. Mounted once, after the body parser and before the first
 * route, in both deployed-shape apps.
 */
export function enforceAuthentication(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (isPublicRequest(req.method, req.path)) {
    next();
    return;
  }
  authenticate(req, res, next);
}
