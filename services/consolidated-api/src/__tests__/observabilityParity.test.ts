import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * That every Express app in the repository mounts the observability middleware.
 *
 * This is the codebase's most expensive recurring defect and it has now produced four
 * of them. `services/consolidated-api/src/index.ts` imports each service's *routers*,
 * not its *app*, so anything mounted with `app.use(...)` in a service's `index.ts` is
 * absent from the only artefact that deploys. So far that has meant:
 *
 *  - the reports router was authorised locally and unauthenticated in production;
 *  - `POST /api/users` accepted an attacker-chosen role from an unauthenticated caller;
 *  - the request-id middleware existed only in local development (GAP-021);
 *  - the terminal error handler leaked `err.message` in production in the deployed copy
 *    while the local one guarded it.
 *
 * Each was found by reading the code. A grep-level test is crude, but the failure mode
 * is "somebody added a service and did not know about this file", and a test that names
 * the missing mount is what makes that discoverable at the point it happens.
 *
 * It is asserted over source text rather than by booting each app because importing all
 * thirteen in one process opens thirteen SQLite handles and binds thirteen ports; the
 * behavioural half is covered by the request-id case in observability.test.ts.
 */

const SERVICES_DIR = path.join(__dirname, '..', '..', '..');

/** Services whose index.ts constructs an Express app. */
function serviceEntryPoints(): string[] {
  return fs
    .readdirSync(SERVICES_DIR)
    .map(name => path.join(SERVICES_DIR, name, 'src', 'index.ts'))
    .filter(p => fs.existsSync(p))
    .filter(p => fs.readFileSync(p, 'utf8').includes('express()'));
}

describe('observability is mounted on every Express app', () => {
  it('finds all thirteen apps, so the sweep below is not silently empty', () => {
    // A filter that matched nothing would make every assertion below vacuously pass —
    // which is precisely how the original suite reported green over unguarded routes.
    // 12 logical services + consolidated-api. dotnet-api has no index.ts.
    expect(serviceEntryPoints()).toHaveLength(13);
  });

  it.each([
    ['requestId', 'app.use(requestId());'],
    ['requestLogger', 'app.use(requestLogger());'],
    ['errorHandler', 'app.use(errorHandler());'],
  ])('mounts %s', (_name, mount) => {
    const missing = serviceEntryPoints().filter(p => !fs.readFileSync(p, 'utf8').includes(mount));
    expect(missing.map(p => path.relative(SERVICES_DIR, p))).toEqual([]);
  });

  it('mounts requestId before anything that can end a response', () => {
    // helmet, cors and the rate limiter all write responses themselves. An id assigned
    // after them is absent from exactly the responses an operator most wants to trace —
    // a CORS rejection and a 429.
    for (const file of serviceEntryPoints()) {
      const src = fs.readFileSync(file, 'utf8');
      const idAt = src.indexOf('app.use(requestId());');

      for (const earlier of ['app.use(cors(', 'app.use(helmet(', 'app.use(rateLimit(']) {
        const at = src.indexOf(earlier);
        if (at === -1) continue;
        expect(idAt, `${path.relative(SERVICES_DIR, file)}: requestId must precede ${earlier}`).toBeLessThan(at);
      }
    }
  });

  it('mounts errorHandler last, after every router', () => {
    // Express selects an error handler by registration order, so one mounted above a
    // router never sees that router's errors.
    for (const file of serviceEntryPoints()) {
      const src = fs.readFileSync(file, 'utf8');
      const handlerAt = src.indexOf('app.use(errorHandler());');

      // The last router mount in the file, whatever it is.
      const routerMounts = [...src.matchAll(/app\.use\(\s*'\/api/g)].map(m => m.index!);
      if (!routerMounts.length) continue;
      expect(handlerAt, `${path.relative(SERVICES_DIR, file)}: errorHandler must follow every router`)
        .toBeGreaterThan(Math.max(...routerMounts));
    }
  });

  it('has no service-local copy of the middleware left behind', () => {
    // Two copies that disagree is how the unguarded production error message happened.
    // `services/api-gateway/src/middleware/errorHandler.ts` is deleted; this fails if it
    // or an equivalent comes back.
    const strays = fs
      .readdirSync(SERVICES_DIR)
      .map(name => path.join(SERVICES_DIR, name, 'src', 'middleware', 'errorHandler.ts'))
      .filter(p => fs.existsSync(p));

    expect(strays.map(p => path.relative(SERVICES_DIR, p))).toEqual([]);
  });
});
