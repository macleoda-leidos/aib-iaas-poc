import path from 'node:path';
import fs from 'node:fs';
import { log } from './logger';

/**
 * Where a persistent store lives, and a complaint if that answer is wrong.
 *
 * This lives in the observability package rather than with any one store because its
 * whole purpose is to make a misconfiguration *visible*: the readiness probe reads the
 * same resolved paths this reports on, and the failure mode it exists to catch is one
 * that produces no error at all.
 *
 * The defect (GAP-019). `render.yaml` mounts a 1 GB disk at `/data` and sets only
 * `DATABASE_PATH=/data/iaas.db`. The other three stores fell back to relative paths —
 * `./uploads`, `./data/notifications.db`, `./data/credit-check-cache.db` — which
 * resolve under the container's working directory, not the mounted disk. On Render's
 * free plan the container spins down after 15 minutes idle, so every uploaded bank
 * statement and payslip and all case correspondence was destroyed several times a day.
 *
 * Worse than a clean loss: the `documents` rows live in `iaas.db` on the persistent
 * disk while the files they point at do not, so the case list keeps showing documents
 * whose downloads 404 — a dangling reference that reads as an application bug.
 *
 * A relative store path works perfectly until the first restart, which is why this
 * warns loudly at boot rather than silently relocating. Silently rewriting the path
 * would hide the configuration error and change where data lives without anyone
 * asking.
 */

export interface ResolvedStorePath {
  /** The path as it will be used. */
  path: string;
  /** The environment variable consulted. */
  variable: string;
  /** True when the value came from the variable rather than the fallback. */
  configured: boolean;
  /** True when the resolved path is absolute, which is what a mounted disk requires. */
  absolute: boolean;
}

export function resolveStorePath(variable: string, fallback: string): ResolvedStorePath {
  const raw = process.env[variable];
  const configured = typeof raw === 'string' && raw.trim().length > 0;
  const value = configured ? raw!.trim() : fallback;
  const absolute = path.isAbsolute(value);

  if (process.env.NODE_ENV === 'production' && !absolute) {
    log('error', 'store path is not absolute, so its data will not survive a restart', {
      variable,
      resolved: value,
      configured,
      remedy: `Set ${variable} to a path on the mounted persistent disk (e.g. /data/...).`,
    });
  }

  return { path: value, variable, configured, absolute };
}

/**
 * Readiness probe for a directory that must be writable.
 *
 * `fs.access(W_OK)` alone is not sufficient on a bind mount: the permission bits can
 * say yes while the write fails on a read-only filesystem or an exhausted disk. So the
 * probe actually writes, which is what an upload is about to do anyway.
 */
export async function checkWritableDirectory(dir: string): Promise<Record<string, unknown>> {
  await fs.promises.mkdir(dir, { recursive: true });
  const probe = path.join(dir, `.readiness-${process.pid}`);
  await fs.promises.writeFile(probe, 'ok');
  await fs.promises.unlink(probe);
  return { path: dir, writable: true, absolute: path.isAbsolute(dir) };
}
