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
    ├── User Service (3011) - Auth, 10 roles, 20 permissions
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

`npx vitest run` from the repo root runs everything: **789 tests across 44 files** (584 backend across 38 files, 205 frontend across 6 files).

Backend suites read the SQLite database at `DATABASE_PATH`, defaulting to `data/iaas.db`
(`packages/database/src/connection.ts:12`). Seeding is `INSERT OR IGNORE`, so it adds missing
rows but never removes obsolete ones — a `data/` directory left over from before a seed-data
change keeps the old rows and fails RBAC assertions that are correct against a clean tree. Run
with `DATABASE_PATH="$(mktemp -d)/fresh.db"` to confirm whether a failure is real or a stale
fixture. `data/` is gitignored, so CI always starts clean.

The suite is one vitest config with two environments, because vitest 1.6 has no `test.projects` (that arrived in v3):

- `test.environment` stays `node`, so every backend suite is unaffected.
- `test.environmentMatchGlobs: [['apps/**', 'jsdom']]` opts the frontend in. It is an allowlist, so a new backend test can never silently pick up a DOM and mask a genuine "this code assumed a browser" bug.
- `test.setupFiles` points at `apps/web/src/test/setup.ts`, which vitest applies to *every* file — so it guards on `typeof document !== 'undefined'` and no-ops under node. It imports `@testing-library/react`'s `cleanup` at setup time (not inside `afterEach`, which deadlocks under fake timers) and unmounts after each test.
- Frontend test files are colocated: `apps/*/src/**/__tests__/**/*.test.{ts,tsx}` at any depth, not one top-level folder.
- `jsdom` and `@testing-library/*` are root devDependencies.

Coverage thresholds (statements 50 / branches 45 / functions 45 / lines 50) are enforced in CI and cover only `packages/*` and `services/*`.

If a run fails with `EBUSY: resource busy or locked` in the temp SSR cache on Windows, it is a transient parallelism artefact — rerun with `--no-file-parallelism`.

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

## Conventions

- British English in all user-facing copy and docs ("organisation", "customise").
- Comments explain *why*, not *what* — see `vitest.config.ts` and `DemoChoreographer.tsx` for the expected density.
- Every stated number must be verifiable against the repo. Several docs still carry a stale "648 tests" figure that conflated Vitest with Playwright cases; `docs/testing.md` §3.1 explains the discrepancy.
