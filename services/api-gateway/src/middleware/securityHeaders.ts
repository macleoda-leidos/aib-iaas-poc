import helmet from 'helmet';
import type { RequestHandler } from 'express';

/**
 * Response-header hardening for the deployed API surface.
 *
 * This is the control an external security scanner (securityheaders.com,
 * Mozilla Observatory, and the commercial equivalents a customer might run)
 * grades when it points at the API origin. Both the deployed `consolidated-api`
 * and the standalone `api-gateway` apply it, so the two services can never
 * drift on their header posture again.
 *
 * The API returns JSON only — it serves no HTML and loads no sub-resources — so
 * a maximally strict `default-src 'none'` CSP is both safe and costless here:
 * there are no inline scripts or styles to permit. (The static frontend, which
 * *does* render HTML, cannot run this strict a policy on a nonce-less static
 * export; see apps/web/src/app/layout.tsx.)
 *
 * Two deliberate choices worth calling out:
 *  - Cross-Origin-Embedder-Policy is intentionally NOT set to `require-corp`.
 *    COEP governs documents that embed resources; it is irrelevant to a JSON
 *    API and `require-corp` can break legitimate embedders for no benefit.
 *  - Cross-Origin-Resource-Policy is `cross-origin`, not `same-origin`, so the
 *    GitHub Pages frontend (a different origin) is never blocked from reading
 *    API responses. The CORS allow-list in each app remains the real access
 *    control; CORP here only needs to not get in its way.
 */
export function securityHeaders(): RequestHandler[] {
  return [
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
          baseUri: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'none'"],
        },
      },
      // 1 year, preload-eligible. Render terminates TLS and already sets HSTS on
      // its own domain; setting it here makes the control explicit and portable.
      hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: 'no-referrer' },
      frameguard: { action: 'deny' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
    // Permissions-Policy is not part of Helmet's default set. Deny the powerful
    // features the API has no use for, so the scanner sees an explicit policy
    // rather than an absent header.
    (_req, res, next) => {
      res.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()'
      );
      next();
    },
  ];
}
