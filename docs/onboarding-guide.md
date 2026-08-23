# Onboarding Guide — AiB IAAS POC

Welcome to the AiB Initial Application Advice Service (IAAS) Proof of Concept. This guide will get you from zero to productive in under an hour. It covers everything you need to clone the project, run it locally, understand the architecture, and start contributing.

---

## Prerequisites

Before you begin, ensure the following are installed on your machine:

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| Node.js | 20+ | JavaScript runtime | https://nodejs.org (LTS) |
| npm | 10+ | Package manager (ships with Node) | Included with Node.js |
| Git | 2.40+ | Version control | https://git-scm.com |
| Docker | 24+ (optional) | Containerised deployment | https://docker.com |

Docker is optional — you can run the entire stack natively with Node.js. Docker is only needed if you want to test the containerised deployment locally.

**Recommended editor:** VS Code with the following extensions:
- ESLint
- Tailwind CSS IntelliSense
- Prettier
- TypeScript + JavaScript Nightly

---

## Clone and Install

Three commands get you up and running:

```bash
# 1. Clone the repository
git clone https://github.com/macleoda-leidos/aib-iaas-poc.git

# 2. Navigate into the project
cd aib-iaas-poc

# 3. Install all dependencies (monorepo — installs everything across all workspaces)
npm install
```

This installs dependencies for all apps, services, and packages in one go via npm workspaces.

---

## Run Locally

### Web Portal (frontend only — most common for UI work)

```bash
npm run dev:web
```

This starts the Next.js development server at **http://localhost:3000**. Hot module reload is enabled — changes to files in `apps/web/` are reflected instantly.

### Backend Services

```bash
npm run dev:services
```

This starts all microservices (API Gateway on port 3001, plus downstream services on ports 3002-3007).

### Full Stack (Docker)

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

---

## Project Structure Overview

```
aib-iaas-poc/
├── apps/                    # User-facing applications
│   ├── web/                 # Public portal (Next.js 15, React 19, Tailwind)
│   └── admin/               # Internal admin portal
├── services/                # Backend microservices (Express.js, TypeScript)
│   ├── api-gateway/         # BFF — auth, rate limiting, routing (port 3001)
│   ├── recommendation-service/  # Rules engine (port 3002)
│   ├── document-service/    # Upload & storage (port 3003)
│   ├── integration-orchestrator/ # System checks (port 3004)
│   ├── mock-integrations/   # Stub AiB system APIs (port 3005)
│   ├── payment-service/     # Payment simulation (port 3006)
│   ├── audit-service/       # Event logging (port 3007)
│   ├── credit-check-service/
│   ├── user-service/
│   ├── organisation-service/
│   ├── notification-service/
│   └── consolidated-api/    # Aggregated API layer
├── packages/                # Shared code
│   ├── shared-types/        # TypeScript type definitions
│   ├── validation/          # Zod schemas (shared FE/BE)
│   ├── ui-components/       # GOV.UK-style React components
│   └── test-data/           # Synthetic data generators
├── docs/                    # Architecture, API, and delivery documentation
├── infra/                   # Infrastructure (Terraform, Docker Compose)
│   ├── terraform/           # AWS infrastructure modules
│   └── docker/              # Docker Compose files
└── .github/workflows/       # CI/CD pipelines
```

---

## Key Technologies

| Technology | Version | Used For |
|-----------|---------|----------|
| Next.js | 15 | Frontend framework — SSR, static export, routing |
| React | 19 | UI component library |
| Tailwind CSS | 3.x | Utility-first styling |
| Express.js | 4.x | Backend microservice framework |
| TypeScript | 5.x | Type safety across all packages |
| SQLite | 3.x | Zero-config local database (PostgreSQL in production) |
| Zod | 3.x | Schema validation (shared between frontend and backend) |
| Vitest | 1.x | Unit and integration testing |
| Recharts | 2.x | Charts and data visualisation |
| Docker Compose | — | Container orchestration |
| Terraform | 1.x | AWS infrastructure-as-code |

---

## Live URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Frontend (GitHub Pages) | https://macleoda-leidos.github.io/aib-iaas-poc/ | Live deployed frontend |
| Live API | https://iaas-api.onrender.com | Backend API (Render free tier) |
| API Documentation | https://macleoda-leidos.github.io/aib-iaas-poc/api-docs | Interactive API explorer |
| OpenAPI Spec | https://macleoda-leidos.github.io/aib-iaas-poc/api-docs/openapi | Full endpoint reference |

Note: The Render API uses a free tier and may take 30-60 seconds to wake from cold start. The frontend handles this gracefully with loading states.

---

## Demo Accounts for Testing

On the login page, demo accounts are pre-configured with one-click fill. MFA codes are auto-accepted in the POC.

| Name | Role | What They See |
|------|------|---------------|
| Admin User | System Admin | Full admin dashboard |
| Karen MacLeod | Senior Officer | Staff dashboard, all cases |
| James Wilson | Case Officer | Staff dashboard, assigned cases |
| Fiona Campbell | Money Adviser | Client applications |
| John Testerton | Debtor | My Application portal |
| Dr. Helen Fraser | Statistician | Statistics dashboard |
| Ryan MacIntyre | CyberOps Analyst | Security SOC |

All passwords are pre-filled on the login screen. No real credentials are needed.

---

## How to Run Tests

```bash
# Run all tests across the monorepo
npx vitest run

# Run tests in watch mode (re-runs on file change)
npx vitest

# Run tests for a specific workspace
npx vitest run --project services/recommendation-service

# Run with coverage report
npx vitest run --coverage
```

The test suite includes 321+ tests covering unit, integration, and contract testing. Tests are co-located with source code in `__tests__/` directories or `*.test.ts` files.

---

## How to Add a New Page

### Adding a page to the web portal

1. Create a new directory under `apps/web/src/app/` matching your desired URL path
2. Create a `page.tsx` file inside it:

```tsx
// apps/web/src/app/my-new-page/page.tsx
export default function MyNewPage() {
  return (
    <div className="govuk-width-container">
      <h1 className="text-2xl font-bold mb-4">My New Page</h1>
      <p>Content here.</p>
    </div>
  );
}
```

3. The page is automatically available at `/my-new-page` (Next.js App Router file-based routing)
4. Add navigation links in the appropriate layout or sidebar component

### Adding a new admin feature

1. Create the page file at `apps/web/src/app/admin/[feature-name]/page.tsx`
2. Add an entry to the admin hub array in `apps/web/src/app/admin/page.tsx`:

```tsx
{
  title: "My Feature",
  description: "One-line description of what it does",
  href: "/admin/my-feature",
  icon: "🔧"
}
```

3. The feature will automatically appear on the admin hub grid

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `apps/web/src/app/layout.tsx` | Root layout — header, footer, global providers |
| `apps/web/src/lib/apiClient.ts` | API client — handles auth tokens, rate limiting, error states |
| `apps/web/src/app/globals.css` | Global styles — Tailwind config, print styles, dark mode |
| `apps/web/next.config.js` | Next.js configuration — basePath, static export settings |
| `CLAUDE.md` | AI assistant instructions — architecture overview, conventions |
| `package.json` (root) | Monorepo workspace config, shared scripts |
| `services/api-gateway/src/index.ts` | API entry point — route registration, middleware |
| `packages/shared-types/src/index.ts` | Shared TypeScript types used across all packages |
| `packages/validation/src/index.ts` | Zod schemas shared between frontend and backend |

---

## Getting Help

| Resource | Location | Description |
|----------|----------|-------------|
| Documentation Index | `docs/` directory | Full suite of 27+ documents |
| Architecture | `docs/architecture.md` | System diagrams, C4 model, ADRs |
| API Documentation | `docs/api-first-design.md` | REST patterns and conventions |
| Sprint Log | `docs/sprint-delivery-log.md` | What was built and when |
| Executive Summary | `docs/executive-summary.md` | High-level project overview |
| Feature Catalogue | `docs/feature-catalogue.md` | All features with business value |
| CLAUDE.md | Root directory | Quick architecture reference |
| This Guide | `docs/onboarding-guide.md` | You are here |

---

## Common Tasks Cheat Sheet

| Task | Command |
|------|---------|
| Start frontend | `npm run dev:web` |
| Start backend | `npm run dev:services` |
| Run tests | `npx vitest run` |
| Lint code | `npm run lint` |
| Build frontend | `npm run build --workspace=apps/web` |
| Seed database | `npm run seed` |
| Docker full stack | `docker compose -f infra/docker/docker-compose.yml up --build` |
| Check API health | `curl http://localhost:3001/api/health` |

---

## Tips for New Contributors

1. **Start with the frontend** — most changes begin in `apps/web/src/app/`. The backend is stable and rarely needs modification for new UI features.

2. **Use the API client** — never call `fetch()` directly. Use `apiClient.ts` which handles auth headers, rate limit tracking, and error states.

3. **Follow GOV.UK patterns** — this project uses GOV.UK Design System principles. Check existing pages for consistent spacing, typography, and component usage.

4. **Check CLAUDE.md first** — the root CLAUDE.md file contains architecture decisions and conventions that apply project-wide.

5. **Synthetic data only** — all test data is fictional. Never use real personal information, even in local development.

6. **Ask the docs** — with 27+ documentation files covering everything from architecture to user stories, most questions are already answered in the `docs/` directory.

---

*Last updated: August 2026*
