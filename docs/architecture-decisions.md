# Architecture Decision Records

This document captures the key architectural decisions made during the AiB IAAS POC development. Each ADR follows a lightweight format recording the context, decision, and consequences to provide a clear audit trail for future development teams.

---

## ADR-001: Next.js 15 for Frontend

**Status**: Accepted

**Context**: The IAAS platform requires a modern web framework capable of server-side rendering for SEO and performance, static site generation for cost-effective hosting, and a rich interactive experience for multi-step application forms. The framework must support TypeScript, have strong community backing, and align with GOV.UK design patterns. The team needs to deploy to GitHub Pages (static export) for zero-cost hosting during the POC phase while retaining the option to move to server-rendered deployment later.

**Decision**: Adopt Next.js 15 with the App Router as the frontend framework for both the public web portal and the admin portal. Use React 19 for component development, static export (`next export`) for GitHub Pages deployment, and retain SSR capability for future production deployment on Vercel or a Node.js host.

**Consequences**:
- (+) Static export enables £0/month hosting on GitHub Pages with automatic deployment via GitHub Actions
- (+) App Router provides file-based routing, nested layouts, and built-in loading/error states
- (+) React 19 Server Components reduce client-side JavaScript bundle size
- (+) Large ecosystem of compatible libraries (React Hook Form, Tailwind, etc.)
- (+) Clear migration path to server-rendered deployment when needed
- (-) Static export means no runtime server-side logic; API calls must go to separate backend
- (-) App Router is relatively new; some third-party libraries lag behind in support
- (-) Build times increase as page count grows beyond 50+ pages

---

## ADR-002: Express.js Microservices

**Status**: Accepted

**Context**: The backend must serve multiple frontend applications, handle authentication, route requests to domain-specific services, and integrate with legacy AiB systems (BASYS, eDEN, DAS, CFT). The team has strong TypeScript/Node.js skills and needs rapid iteration during the POC phase. Services must be independently deployable in production but simple to run locally during development.

**Decision**: Use Express.js with TypeScript for all backend microservices. Each service owns a specific domain (recommendations, documents, payments, audit, integrations) and communicates via HTTP REST. An API Gateway service acts as the Backend-for-Frontend (BFF), handling authentication, rate limiting, and request routing.

**Consequences**:
- (+) Express.js is the most widely-understood Node.js framework; onboarding new developers is trivial
- (+) TypeScript provides compile-time safety across all services and shared packages
- (+) Minimal runtime overhead compared to heavier frameworks (NestJS, Fastify with decorators)
- (+) Each service can be independently scaled, deployed, or replaced without affecting others
- (+) Familiar middleware pattern (Helmet, CORS, body-parser) provides security defaults
- (-) No built-in dependency injection or module system; requires discipline to maintain separation
- (-) Express.js lacks native async error handling (requires wrapper or express-async-errors)
- (-) HTTP inter-service communication adds latency compared to in-process calls

---

## ADR-003: SQLite for POC, PostgreSQL for Production

**Status**: Accepted

**Context**: The POC needs a database that requires zero configuration for local development, works within free-tier deployment constraints, and supports the full relational model (14 tables with foreign keys). Production deployment will require a robust, scalable RDBMS with proper ACID guarantees, connection pooling, and managed backup/recovery.

**Decision**: Use SQLite (via better-sqlite3) during POC development with a clear migration path to PostgreSQL for production. Abstract all data access behind a Repository Pattern (`packages/database`) so that switching the underlying database requires only changing the repository implementations, not the route handlers or business logic.

**Consequences**:
- (+) SQLite requires zero setup — `npm install` and the database is ready
- (+) Single-file database simplifies backup, reset, and seed data management
- (+) Repository pattern means route handlers are completely database-agnostic
- (+) PostgreSQL migration is well-understood and can be done incrementally
- (+) Development/test cycles are faster (no network roundtrips to database)
- (-) SQLite lacks concurrent write support; not suitable for multi-instance production
- (-) Some PostgreSQL-specific features (JSONB, array types, full-text search) unavailable during POC
- (-) Schema drift risk if PostgreSQL migration is delayed too long

---

## ADR-004: Monorepo with npm Workspaces

**Status**: Accepted

**Context**: The IAAS platform consists of 2 frontend applications, 11 backend services, and 4 shared packages. Code sharing (types, validation schemas, UI components) is critical to maintaining consistency. The team needs coordinated releases, a single CI pipeline, and the ability to refactor shared code with immediate feedback across all consumers.

**Decision**: Structure the project as an npm workspaces monorepo with three workspace directories: `apps/` (Next.js applications), `services/` (Express.js microservices), and `packages/` (shared code). Use TypeScript project references for build ordering and shared `tsconfig` base configurations.

**Consequences**:
- (+) Single `npm install` at root installs all dependencies with proper hoisting
- (+) Shared packages (`shared-types`, `validation`) ensure type consistency across frontend and backend
- (+) Refactoring a shared type immediately shows all consumers that need updating
- (+) Single CI pipeline tests everything; no cross-repo coordination needed
- (+) IDE navigation works seamlessly across packages
- (-) Root `node_modules` can become large (all dependencies hoisted)
- (-) Build ordering requires careful configuration of TypeScript project references
- (-) Some tooling (ESLint, Jest) requires per-workspace configuration

---

## ADR-005: Consolidated API for Deployment

**Status**: Accepted

**Context**: During POC deployment, running 11 separate microservices would require 11 separate containers/dynos, exceeding free-tier limits on all hosting platforms. However, the codebase must maintain service boundaries for future independent deployment. The team needs a deployment strategy that is cost-free for POC while preserving the microservices architecture in code.

**Decision**: Create a `consolidated-api` service that imports and mounts all service route handlers within a single Express application. This provides a single deployable container while maintaining logical service separation in the codebase. Each service's routes remain in their own directory with their own middleware; the consolidated API simply mounts them at their respective paths.

**Consequences**:
- (+) Single container deploys to Render.com free tier (£0/month)
- (+) Service boundaries remain in code — each service has its own routes, middleware, and tests
- (+) Splitting back into separate services requires only removing the import and deploying independently
- (+) Single port simplifies CORS, SSL, and health check configuration
- (+) Reduces inter-service network latency to zero (in-process calls)
- (-) All services share the same process; a crash in one affects all
- (-) Cannot independently scale services (e.g., recommendation engine vs. audit)
- (-) Memory usage is higher than individual services would be separately

---

## ADR-006: Repository Pattern for Data Access

**Status**: Accepted

**Context**: The application must work with SQLite during POC and PostgreSQL in production (see ADR-003). Route handlers should not contain database-specific code. The team needs the ability to swap database implementations, write unit tests with in-memory stores, and potentially support different databases for different services in the future.

**Decision**: Implement a Repository Pattern in `packages/database` with interfaces defining data access operations and concrete implementations for SQLite. Route handlers depend only on repository interfaces. A factory function returns the appropriate implementation based on configuration.

**Consequences**:
- (+) Route handlers are completely decoupled from database implementation details
- (+) Unit tests can use in-memory repository implementations (no database setup required)
- (+) PostgreSQL migration requires only new repository implementations; routes remain unchanged
- (+) Clear separation of concerns; SQL queries are isolated in one location per entity
- (+) Enables future patterns like read replicas or CQRS without route changes
- (-) Additional abstraction layer adds boilerplate (interface + implementation per entity)
- (-) Complex queries may not map cleanly to repository methods (temptation to add ad-hoc methods)
- (-) Performance optimisations may require leaking database-specific knowledge upward

---

## ADR-007: Keycloak for Identity

**Status**: Accepted

**Context**: The IAAS platform serves multiple user types (debtors, representatives, money advisers, AiB staff) with different access levels. Production deployment requires integration with ScotAccount (citizens) and internal Active Directory (staff). The identity solution must support OIDC, SAML 2.0, MFA, federation, and self-service account management. It must be free/open-source for the POC phase.

**Decision**: Adopt Keycloak as the identity and access management platform. During POC, run Keycloak locally via Docker with pre-configured realm exports. In production, deploy Keycloak (or use Phase Two managed service) with federation to ScotAccount and Azure AD.

**Consequences**:
- (+) Industry-standard OIDC and SAML 2.0 support out of the box
- (+) Pre-built login, registration, MFA, and password reset flows (no custom code)
- (+) Federation support enables connection to ScotAccount and Azure AD simultaneously
- (+) Open-source with no licensing costs; managed options available for production
- (+) Role-based access control with fine-grained permissions and group mapping
- (-) Keycloak is resource-heavy (Java application requiring 512MB+ RAM minimum)
- (-) Configuration complexity; realm exports can be large and difficult to diff
- (-) Docker requirement for local development adds setup steps for new team members

---

## ADR-008: GitHub Pages + Render for Hosting

**Status**: Accepted

**Context**: The POC must demonstrate a fully deployed, accessible platform without incurring any hosting costs. The frontend is statically exported (Next.js static export) and the backend is a single Node.js application (consolidated API). Deployment must be automatic from the main branch with zero manual steps.

**Decision**: Host the frontend on GitHub Pages (automatic deployment via GitHub Actions on push to main) and the backend API on Render.com free tier (automatic deployment from the same repository). This provides separate scaling paths for frontend (CDN-served static files) and backend (Node.js container).

**Consequences**:
- (+) Total hosting cost: £0/month for both frontend and backend
- (+) Automatic deployment on every push to main branch (GitHub Actions + Render auto-deploy)
- (+) GitHub Pages provides global CDN distribution for static assets
- (+) Render.com provides managed SSL, custom domains, and health checks
- (+) Clear separation allows independent scaling decisions in production
- (-) Render free tier has cold starts (30-60 seconds after 15 minutes of inactivity)
- (-) GitHub Pages only supports static content; no server-side rendering
- (-) Render free tier has limited RAM (512MB) and no persistent disk
- (-) Custom domain setup requires DNS configuration on both platforms

---

## ADR-009: Tailwind CSS

**Status**: Accepted

**Context**: The frontend must implement GOV.UK design patterns (typography, spacing, colour palette, component patterns) while enabling rapid prototyping. The team needs a styling solution that works well with React components, supports responsive design, includes dark mode, and produces minimal CSS in production builds. Custom design tokens must be easy to configure.

**Decision**: Adopt Tailwind CSS as the primary styling framework. Configure custom theme tokens to match GOV.UK design system values (colours, typography scale, spacing). Use utility classes for rapid development with component extraction for repeated patterns.

**Consequences**:
- (+) Utility-first approach enables extremely rapid UI development without context-switching
- (+) Production builds purge unused CSS; final bundle is typically <20KB gzipped
- (+) Dark mode support via `dark:` variant with minimal additional code
- (+) Custom theme configuration maps GOV.UK design tokens to Tailwind utilities
- (+) Responsive design via breakpoint prefixes (`sm:`, `md:`, `lg:`) is intuitive
- (+) Excellent VS Code IntelliSense extension for autocomplete
- (-) HTML can become verbose with many utility classes on complex components
- (-) Not a direct implementation of GOV.UK Frontend; requires manual mapping of patterns
- (-) Team members unfamiliar with utility-first CSS may have initial learning curve
- (-) Extracting components for reuse requires discipline to avoid inconsistency

---

## ADR-010: Vitest + Playwright for Testing

**Status**: Accepted

**Context**: The platform requires comprehensive testing across unit, integration, and end-to-end levels. Unit tests must be fast enough to run on every save during development. E2E tests must verify real browser behaviour including JavaScript interactions, form submissions, and navigation. The testing framework must support TypeScript natively and integrate with the monorepo structure.

**Decision**: Use Vitest for unit and integration testing (all services and packages) and Playwright for end-to-end browser testing (both frontend applications). Share test configuration via workspace-level `vitest.config.ts` files. Use `test-data` package for consistent synthetic data across all test types.

**Consequences**:
- (+) Vitest is 10-20x faster than Jest due to native ESM support and Vite's transform pipeline
- (+) Playwright tests run in real browsers (Chromium, Firefox, WebKit) catching real rendering issues
- (+) Both tools have native TypeScript support with zero configuration
- (+) Vitest's watch mode provides instant feedback during development
- (+) Playwright's codegen tool accelerates E2E test writing
- (+) Same assertion style (expect) across both tools reduces cognitive load
- (-) Playwright tests are slower (real browser startup) and more brittle than unit tests
- (-) Two testing frameworks means two sets of configuration, plugins, and patterns to maintain
- (-) Playwright requires browser binaries installed (adds to CI setup time)

---

## Decision Log Summary

| ADR | Decision | Date | Status |
|-----|----------|------|--------|
| 001 | Next.js 15 for Frontend | 2026-03 | Accepted |
| 002 | Express.js Microservices | 2026-03 | Accepted |
| 003 | SQLite for POC, PostgreSQL for Production | 2026-03 | Accepted |
| 004 | Monorepo with npm Workspaces | 2026-03 | Accepted |
| 005 | Consolidated API for Deployment | 2026-04 | Accepted |
| 006 | Repository Pattern for Data Access | 2026-04 | Accepted |
| 007 | Keycloak for Identity | 2026-04 | Accepted |
| 008 | GitHub Pages + Render for Hosting | 2026-04 | Accepted |
| 009 | Tailwind CSS | 2026-03 | Accepted |
| 010 | Vitest + Playwright for Testing | 2026-05 | Accepted |

---

## Related Documents

- [Architecture](./architecture.md)
- [Vendor Assessment](./vendor-assessment.md)
- [Cost Model](./cost-model.md)
- [Roadmap](./roadmap.md)
