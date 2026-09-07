import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Correlation IDs.
 *
 * The previous attempt at this lived at `services/api-gateway/src/index.ts:34-37` and
 * did `req.headers['x-request-id'] = req.headers['x-request-id'] || randomUUID()`.
 * Three things were wrong with it, and the third is the one that mattered:
 *
 *  1. It mutated the *request* headers, so nothing downstream of the response ever saw
 *     the id — it was never echoed to the caller and never logged.
 *  2. Nothing read it, so it was a UUID generated once per request and discarded.
 *  3. It was mounted on the api-gateway *app*. The deployed artefact
 *     (services/consolidated-api) imports the api-gateway *routers*, not its app, so
 *     the middleware never ran in production at all. That mount-point-versus-router
 *     divergence has now caused three separate defects in this codebase; it is why
 *     this lives in a package and is mounted explicitly in both places.
 *
 * An inbound id is honoured so a trace survives the browser -> API hop, but it is
 * length-capped and character-filtered first: it goes into a log aggregator and into
 * a response header, and an unbounded attacker-controlled string in either is a log
 * injection primitive.
 */

/** UUIDs are 36 characters; this leaves room for a caller's own scheme without inviting abuse. */
const MAX_LENGTH = 64;
const SAFE = /^[A-Za-z0-9._~-]+$/;

export const REQUEST_ID_HEADER = 'x-request-id';

export interface RequestWithId extends Request {
  requestId?: string;
}

function sanitise(candidate: unknown): string | null {
  if (typeof candidate !== 'string') return null;
  const trimmed = candidate.trim();
  if (!trimmed || trimmed.length > MAX_LENGTH || !SAFE.test(trimmed)) return null;
  return trimmed;
}

export function requestId(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const inbound = sanitise(req.headers[REQUEST_ID_HEADER]);
    const id = inbound ?? randomUUID();

    (req as RequestWithId).requestId = id;
    // On the response as well, so a user reporting "it failed" can be asked for the
    // id from their network tab and it will match a log line.
    res.setHeader(REQUEST_ID_HEADER, id);
    next();
  };
}

/** Read the id anywhere downstream without every caller repeating the cast. */
export function getRequestId(req: Request): string | undefined {
  return (req as RequestWithId).requestId;
}
