import { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { formatZodIssues } from '@aib-iaas/validation';

/**
 * Validate a request body against a Zod schema before the handler runs.
 *
 * This is what closes GAP-009. `packages/validation` held schemas that no service
 * imported, and each route that cared about its input hand-rolled a validator
 * instead — most visibly `validateApplicationBody` in `routes/applications.ts`, a
 * 75-line function of `if` statements pushing English strings onto an array. Two
 * consequences followed:
 *
 *  - The frontend and backend rules drifted, because nothing forced them to agree.
 *    The API's NI-number check accepted `DF123456Z`, which HMRC never issues, while
 *    the Zod schema in the shared package had the correct pattern all along.
 *  - Every route without a hand-rolled validator had no validation at all, and the
 *    absence was invisible.
 *
 * The replaced body is the *parsed* one, so coercions declared in the schema (form
 * amounts arriving as strings, NI numbers with spaces and lower case) reach the
 * handler already normalised. Without that, validation and persistence would be
 * looking at different values.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // An absent body is `{}` rather than an error: the draft-friendly schemas make
    // every field optional, so `POST /api/applications` with no body is legitimate
    // and creates an empty draft.
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: formatZodIssues(result.error),
        },
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
