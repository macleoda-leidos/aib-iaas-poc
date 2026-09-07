# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AiB IAAS (Initial Application Advice Service) is a Proof of Concept for the Accountant in Bankruptcy's unified applications gateway. It demonstrates a multi-step application journey with microservices backend, rules-based product recommendations, and full audit trails.

**Key Note:** This is a POC with synthetic data. No real integrations, payments, or personal data are involved.

## Architecture

### Logical services vs physical deployment

These are two different things and the numbers differ. Get this right before quoting a count anywhere:

- **12 logical services** — one Express app per bounded context, each with its own port, tests and `package.json`. `npm run dev:services` starts exactly these twelve.
- **1 deployed container** — `services/consolidated-api` imports the routers from all twelve and mounts them into a single Express app. It holds no business logic (hence excluded from coverage in `vitest.config.ts`). This exists because Render's free plan spins an idle service down after 15 minutes; twelve free services would mean twelve cold starts.
- **14 directories in `services/`** = 12 logical + `consolidated-api` (deployment shim) + `dotnet-api` (alternative .NET 9 implementation of the same API surface, deployed alongside as `iaas-dotnet-api`; not a 13th logical service).

### System Structure

```
Users (Debtors/Representatives/Advisers/Staff)
    v
Web Portal (Next.js, port 3000) + Admin Portal (Next.js, port 3010)
    v
API Gateway (Express, port 3001) - BFF with auth, rate limiting, routing
    ├── Recommendation Service (3002) - Rules engine
    ├── Document Service (3003) - Upload, storage, ClamAV
    ├── Integration Orchestrator (3004) - Parallel system checks
    ├── Mock Integrations (3005) - BASYS, eDEN, DAS, CFT, Moratorium, RoI
    ├── Payment Service (3006) - Payment simulation
    ├── Audit Service (3007) - Immutable event log
    ├── Credit Check Service (3008) - CRA interface + consent
    ├── Organisation Service (3009) - Org hierarchy
    ├── User Service (3011) - Auth, 10 roles, 21 permissions
    ├── Notification Service (3012) - Email/SMS/in-app
    └── Identity Service (3013) - ScotAccount/GOV.UK federation

Deployed:  consolidated-api (all 12 above, port 3001) -> Render "iaas-api"
           dotnet-api (.NET 9, endpoint parity)      -> Render "iaas-dotnet-api"
           apps/web static export                    -> GitHub Pages
```

Full C4 Context/Container/Component diagrams live in `docs/architecture.md` §2–§4, and are surfaced visually on the `/architecture` page.

### Monorepo Structure

npm workspaces monorepo with three workspace directories (`apps/*`, `services/*`, `packages/*`):

- **apps/** — Next.js applications
  - web: Public portal for applicants (also hosts most demo/admin pages)
  - admin: Internal review portal for AiB staff

- **services/** — see "Logical services vs physical deployment" above

- **packages/** — Shared code across apps and services
  - shared-types: TypeScript type definitions (Application, Debtor, Financial, etc.)
  - validation: Zod schemas for input validation
  - ui-components: GOV.UK-style React components
  - test-data: Synthetic data generators
  - database: Repository pattern over SQLite (local) / PostgreSQL (Docker, prod)
  - integration-contracts: Factory pattern; `INTEGRATION_MODE=mock|live` swaps mock for real clients
  - auth: Ed25519-signed access tokens plus the shared Express guards (`createAuthGuards`), zero runtime dependencies — see below
  - statutory: Scottish insolvency thresholds and clocks, each carrying its own citation and amendment date. **Load-bearing** — figures are read from here, never retyped, and tests enforce that. Mirrored in C# at `services/dotnet-api/Domain/Statutory/Thresholds.cs`; when a figure moves, both must move together
  - observability: structured JSON logging, correlation IDs, request metrics and readiness probing. Zero runtime dependencies — see below

### Technology Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | Next.js 15, React 19, Tailwind CSS | Static export for Pages, responsive, GOV.UK patterns |
| Backend | Express.js, TypeScript | Rapid dev, type-safe |
| Alt backend | .NET 9, MediatR + CQS | `services/dotnet-api`, endpoint parity |
| Database | SQLite (POC) → PostgreSQL (prod) | Via `@aib-iaas/database` repositories |
| Storage | Local FS (POC) → S3 (prod) | Documents |
| Build/Test | tsx, vitest, TypeScript 5 | Fast testing |
| Infrastructure | Docker Compose, Terraform, GitHub Actions | Multi-environment |
| Validation | Zod | Shared schemas FE/BE |
| Security | Helmet, CORS, rate limiting | Defence in depth |

## Testing

`npx vitest run` from the repo root runs everything: **1,317 tests across 66 files** (994 backend across 53 files, 323 frontend across 13 files).

**There is a second suite.** `tests/dotnet/IAAS.Api.Tests` is xunit, not vitest, and `npx vitest run`
does not touch it — run `dotnet test tests/dotnet/IAAS.Api.Tests` as well (57 tests). It exists
because `services/dotnet-api` shipped for fourteen sprints with no tests and no CI step, which is
how its recommendation engine kept a £1,500 MAP floor that SSI 2023/9 removed in February 2023
while the Node engine did not. Both engines read the same case table at
`tests/fixtures/recommendation-cases.json`, so changing one expectation must turn **both** suites
red; that is the parity check, and it is worth re-verifying after touching either engine. On a
machine with only a newer .NET runtime installed, `<RollForward>LatestMajor</RollForward>` in the
csproj is what stops the test host aborting with "You must install or update .NET".

**Confirm the file count, not just that it passed.** Under heavy machine load vitest has been
observed collecting only 57 or 58 of the 59 files and reporting a green run over the subset —
silently, with no error and no skip notice. It is not deterministic and not pool-specific
(`--pool=forks` and `--pool=threads` both do it), so a green CI run proves nothing unless the
file count is 59. `--no-file-parallelism` has collected all 59 on every attempt and is the
reliable form when it matters.

**Do not set `DATABASE_PATH` when running vitest — it does nothing.** `vitest.config.ts:44`
pins `DATABASE_PATH: ':memory:'` in `test.env`, and vitest's config env takes precedence over
the shell, so `DATABASE_PATH=… npx vitest run` is silently ignored. Verified: the suite passes
and the supplied directory stays empty. A vitest run therefore *cannot* see a stale `data/`
directory, so **a failing RBAC assertion is a real failure** — this file previously advised a
`mktemp` ritual to rule out a stale fixture, which was both a no-op and a misleading mental
model of what such a failure means.

`DATABASE_PATH` does matter for `npm run dev:services`, the seed scripts and any `tsx` boot of
a service. There, seeding is `INSERT OR IGNORE`, so it adds missing rows but never removes
obsolete ones — delete `data/` if dev-time seed data looks wrong. `data/` is gitignored.

The suite is one vitest config with two environments, because vitest 1.6 has no `test.projects` (that arrived in v3):

- `test.environment` stays `node`, so every backend suite is unaffected.
- `test.environmentMatchGlobs: [['apps/**', 'jsdom']]` opts the frontend in. It is an allowlist, so a new backend test can never silently pick up a DOM and mask a genuine "this code assumed a browser" bug.
- `test.setupFiles` points at `apps/web/src/test/setup.ts`, which vitest applies to *every* file — so it guards on `typeof document !== 'undefined'` and no-ops under node. It imports `@testing-library/react`'s `cleanup` at setup time (not inside `afterEach`, which deadlocks under fake timers) and unmounts after each test.
- Frontend test files are colocated: `apps/*/src/**/__tests__/**/*.test.{ts,tsx}` at any depth, not one top-level folder.
- `jsdom` and `@testing-library/*` are root devDependencies.

Coverage thresholds (statements 50 / branches 45 / functions 45 / lines 50) are enforced in CI and cover only `packages/*` and `services/*`.

If a run fails with `EBUSY: resource busy or locked` in the temp SSR cache on Windows, it is a transient parallelism artefact — rerun with `--no-file-parallelism`.

**`npm run build` fails intermittently on Windows with exit code `3221226505`** (0xC0000409,
`STATUS_STACK_BUFFER_OVERRUN`) — most often on `next build` for `apps/web` or `apps/admin`, sometimes
on a `tsc` workspace. It is a crash, not a type error, and it is the same class of artefact as the
`EBUSY` above: `--workspaces` runs the builds concurrently, and two full Next compiles at once is
enough to trip it. Three things distinguish it from a real failure — it **moves target** between
runs, some runs pass outright, and **every workspace builds cleanly on its own**. Confirm with:

```bash
cd apps/web && npx next build          # and apps/admin
for d in packages/*/ services/*/; do (cd "$d" && npx tsc --noEmit) || echo "FAILED: $d"; done
```

CI runs on `ubuntu-latest` and does not see it. Do not "fix" it by weakening a tsconfig.

**Stray compiled output shadowing TypeScript.** A workspace with no `tsconfig.json` falls back to
the root one, which has no `noEmit` and a default `include` of `**/*` — so a single `tsc` in that
workspace emits `.js`, `.js.map`, `.d.ts` and `.d.ts.map` next to *every* source file in the
repository, and Next then has two candidates for each module. This has produced a real defect
(a deployed page running weeks-old code). Every package now has its own `tsconfig.json`; if you add
one, give it a tsconfig in the same commit. To check and clear:

```bash
find apps packages services -name '*.js' -not -path '*/node_modules/*' -not -path '*/dist/*' \
  -not -path '*/.next/*' | while read f; do [ -f "${f%.js}.tsx" ] && echo "$f"; done
```

## Demo Mode

`/architecture` is the final beat of a scripted client demo, so changes there affect the demo run.

- `DemoMode.tsx` holds the step list (path, duration, narration, timed actions) and dispatches `DemoAction`s as `window` CustomEvents via `lib/demoEvents.ts`.
- **Page-local actions** (`FILL_*`, `RUN_CHECKS`, `SUBMIT`, ...) are handled by a listener inside the page that owns the state — currently `/apply` and `/login` (`FILL_MFA_CODE`).
- **Generic DOM actions** (`SCROLL_TO`, `SLOW_SCROLL`, `CLICK`, `HIGHLIGHT`, `APPROVE_CASE`) are handled centrally by `DemoChoreographer.tsx`, mounted once in the root layout. A new page can join the demo script with no per-page listener code.
- `waitForElement()` resolves selectors via MutationObserver, because the player pushes a route and fires actions on a timer — an action often lands before React has committed the new page. It resolves `null` on timeout rather than throwing, so a missing selector degrades to "that beat did nothing".
- **Demo selectors use `data-demo="..."` attributes**, never CSS classes or text. If you restructure a page, keep its `data-demo` hooks on sensible elements or the demo silently stops scrolling to them. Grep `data-demo` before moving markup.
- `demoSelectors.test.ts` enforces the above: it fails if any `[data-demo="..."]` referenced in the script has no matching hook in the markup, and if any step's last action fires after its own `duration` elapses. It recognises three ways a hook reaches the DOM — a literal attribute, a `demo="..."` prop forwarded to `data-demo={demo}` (the shared `Input` on `/apply`), and a template literal (`data-demo={...}` with an interpolated suffix, one hook per row of data), which can only be checked as far as its static prefix.
- Where a section keeps its own state, the demo **clicks the real control** rather than writing to `formData` — `RUN_CHECKS`, `CLICK_RECOMMEND` and `CONFIRM_PAYMENT` all do. Faking the finished state skipped the spinner and rendered a placeholder instead of the real API response. Never script a `CLICK` on a control that opens a modal the same step does not close, or on anything reaching `window.print()`: a modal dialog stalls the player.
- Narration text states figures out loud (test counts, layer counts, costs). If you change a count, check `DemoMode.tsx` narration too.

## Authentication and authorisation

Three separate checks, all in `authenticate` (`services/api-gateway/src/middleware/rbac.ts`).
Removing any one leaves the other two looking like a complete story, so none is optional:

1. **Signature.** Tokens are Ed25519 JWTs from `@aib-iaas/auth`. `alg` is pinned to `EdDSA` and
   checked *before* verification, so `alg: none` and algorithm substitution cannot get through.
   Keys come from `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`; unset means an ephemeral per-process key
   plus a warning — which is why `npm run dev:services` (twelve processes) needs them set but
   the single consolidated container does not.
2. **Session.** The token is looked up in `sessions` on every request. This is what makes logout
   and revocation immediate. **Do not cache it** — that reintroduces GAP-010's window.
3. **Permissions, from the database.** `role_permissions` via `getPermissionsForUser`, cached
   5 seconds. **Permissions are never in the token**: they were forgeable there, and a snapshot
   taken at login meant a revoked grant kept working until expiry.

Two consequences worth knowing before changing anything here:

- A token is proof of *who*, never of *what they may do*. Anything that reads authorisation
  from token claims is a regression.
- **Middleware must be applied in `consolidated-api/src/index.ts`, not just in the service's own
  `index.ts`.** The consolidation layer re-mounts routers by hand, so a guard added only to a
  standalone service is invisible in deployment. That divergence is how the single authorised
  route in the repo shipped unauthenticated; grep both entry points when adding a guard.

`docs/security-known-gaps.md` is the live register: 18 findings Closed, 2 Partial, 5 Open. The two
remaining Criticals are both about authentication and they compound — **GAP-003** (login accepts any
password) and **GAP-025** (MFA is verified in the browser, and the token is issued *before* the code
is checked). Identity is unforgeable but still not proven, so treat the ownership and permission
work as resting on an assumption the login route does not yet enforce.

## Observability

`@aib-iaas/observability`. Zero runtime dependencies, deliberately: Render and Azure both ingest
stdout JSON, so the transport was already provided — what was missing was a shape and a field
convention.

Mount in this order, and in **every** app:

```
app.use(requestId());        // before anything that can end a response
app.use(express.json());
app.use(requestLogger());    // after json(), so a parse failure is still logged
... routers ...
app.use(errorHandler());     // must be last
```

- **Both entry points, always.** `consolidated-api/src/index.ts` imports each service's *routers*,
  not its app, so middleware mounted only in a service's own `index.ts` has never run in a deployed
  environment. That divergence has now produced four defects: an unauthorised reports router, an
  unauthenticated user-creation route, a request-id middleware that existed only locally, and an
  error handler that leaked `err.message` in production on the deployed copy while the local one
  guarded it. `services/consolidated-api/src/__tests__/observabilityParity.test.ts` fails if any of
  the thirteen apps is missing it or has it in the wrong order — read that test before adding a
  service.
- **Never log a request body, a URL, or a raw path.** Log the route *pattern*
  (`/api/applications/:id`) — a resolved URL carries application ids and reference numbers, and the
  same string is used as a metrics label. Redaction is in the serialiser rather than at each call
  site so it covers the call sites nobody has written yet; add to `REDACTED_KEYS` in `logger.ts`,
  not to individual `log()` calls.
- **Liveness and readiness are different endpoints on purpose.** `/api/health` is cheap, always
  200, and is the platform's `healthCheckPath`; `/api/health/ready` probes the driver and the
  stores and returns 503. Do **not** make `/api/health` fail — on Render's free plan a failing
  health check fails the deploy, and a Neon instance waking from idle would turn a cold start into
  a failed deployment, most likely mid-demo.
- Logging is **silent under `NODE_ENV=test`**, because many suites here assert 4xx and 5xx by
  design and logging them buries the line that matters. Tests that assert on log output set both
  `LOG_LEVEL` and a sink explicitly (`setLogSink`).

## Conventions

- British English in all user-facing copy and docs ("organisation", "customise").
- Comments explain *why*, not *what* — see `vitest.config.ts` and `DemoChoreographer.tsx` for the expected density.
- Every stated number must be verifiable against the repo. Several docs still carry a stale "648 tests" figure that conflated Vitest with Playwright cases; `docs/testing.md` §3.1 explains the discrepancy.
