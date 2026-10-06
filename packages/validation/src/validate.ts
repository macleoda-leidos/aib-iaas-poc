import type { ZodTypeAny } from 'zod';

/**
 * Express middleware factory that validates `req.body` against a Zod schema.
 *
 * This is what makes @aib-iaas/validation more than a bag of unused schemas
 * (GAP-009 — the package was dead code). On success the parsed, typed value
 * replaces `req.body` so handlers consume validated data; on failure it returns
 * a 400 with the offending fields. Pair with a `.strict()` schema to also reject
 * unknown fields rather than silently dropping them.
 *
 * Params are typed loosely on purpose: the package has no Express dependency, and
 * `any` here keeps the returned handler assignable to Express's RequestHandler
 * without dragging @types/express into a validation library.
 */
export function validate(schema: ZodTypeAny) {
  return (req: any, res: any, next: any): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue: any) => ({
        path: issue.path.join('.') || '(root)',
        message: issue.message,
      }));
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
