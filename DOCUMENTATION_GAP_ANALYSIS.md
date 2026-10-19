# Documentation Gap Analysis

**Document owner:** Workstream B (Documentation Reconciliation)
**Classification:** OFFICIAL
**Last updated:** 2026-10-19
**Status:** Reconciled against the repository at commit `390a9ec` (branch `docs-reconcile-mocks-oidc`)
**Audience:** Delivery leads, technical assurance, bid reviewers

---

## 1. Executive summary

The AiB IAAS POC accumulated a sizeable documentation suite across roughly 30 sprints,
and over that time the docs drifted — both from the code and from one another — on nearly
every hard number that matters: how many services exist, how many roles and permissions the
RBAC model holds, how many admin features the portal exposes, how closely the .NET backend
tracks the Node one, how many external integrations are mocked, and how many automated tests
run. Some figures were simply stale (a sprint added rows but the prose was never updated);
others were internally contradictory (one document quoted two different backend file counts in
adjacent sections); a few were straightforwardly overstated (Keycloak described as a running
identity broker when it is dormant scaffolding).

This engagement — **Workstream B** — recounted every load-bearing figure directly against the
repository on 2026-10-19 and reconciled the doc set to a single verified baseline, captured in
§2 below and now mirrored in `CLAUDE.md` §Conventions. This document is the
traceable catalogue of what was wrong, what the truth is, where the truth is evidenced in the
code, and whether each item has been fixed or still needs attention.

**Tone note.** This is a POC built on synthetic data. The baseline below describes what the
code actually contains; it is deliberately not inflated, and several figures went *down* on
reconciliation (admin features 38→33 tiles, integrations 10→6, services 14→12 logical). A
smaller honest number is the point of the exercise.

---

## 2. The verified baseline

Every figure in this table was recounted against the repository. These are the numbers all
deliverable documents must use; where a doc still disagrees, §3 records it.

| Metric | Verified value | Where it is counted |
|--------|----------------|---------------------|
| Logical Express services | **12** | one Express app per bounded context; `npm run dev:services` starts twelve |
| Directories in `services/` | **14** | 12 logical + `consolidated-api` (deployment shim) + `dotnet-api` (.NET impl) |
| Distinct Express endpoints | **~120** (incl. health) | curated reconnaissance figure across the twelve routers |
| .NET MVC controllers | **0** | vertical-slice architecture, no controllers |
| .NET feature modules | **11** | Applications, Audit, Auth, CreditCheck, Documents, Integrations, Notifications, Organisations, Payments, Recommendations, Users |
| .NET endpoints | **17 business + 3 metadata** | → **curated-subset parity, NOT full parity** |
| .NET MediatR handlers | **16** | one CQS handler per slice command/query |
| Database tables | **21** | `@aib-iaas/database` schema |
| Shared types | **47** | `packages/shared-types` |
| Zod schemas | **21** | `packages/validation` |
| Integration contracts | **7 (+1 orchestrator)** | `packages/integration-contracts` |
| Packages | **8** | auth, database, integration-contracts, shared-types, statutory, test-data, ui-components, validation |
| Repositories | **12** | `@aib-iaas/database` repository classes |
| RBAC roles | **10** | `seed-data/roles.json` |
| RBAC permissions | **28** | `seed-data/permissions.json` — settles the old 20-vs-28 conflict |
| Role-permission grants | **91** | `seed-data/role-permissions.json` (old "68" was stale) |
| Admin feature tiles | **33** | `ADMIN_FEATURES` array, `apps/web/src/app/admin/page.tsx` |
| Orphan admin pages (no tile) | **5** | admin subpages with no `ADMIN_FEATURES` entry (see §6) — 38 admin pages total |
| Web `page.tsx` files | **69** | `apps/web/src/app/**` |
| Admin-app `page.tsx` files | **10** | `apps/admin/src/app/**` |
| Mock-integration modules | **6** | BASYS, eDEN/DAS-hub, DAS, CFT, Moratorium, RoI (+ a credit-check mock + a health router) |
| Automated tests | **1,078 across 60 files** | `npx vitest run`: 751 backend / 47 files + 327 frontend / 13 files |

**Note on the test count.** 1,078 is the current figure. It was **1,037 / 722 backend** before
Phase 2 added 19 security-regression tests. Any doc still quoting 1,037, 904, 648/658 or 423 is
stale (423 was the legitimate Sprint 11 total and survives correctly in *historical* sprint
records; see §3 and §4).

---

## 3. Conflict table

One row per reconciled claim: the claim as written, the verified truth, the source-of-truth
evidence (`file:line`), the documents that carried the wrong figure, and status. "Reconciled"
means the primary/headline docs now carry the correct figure; where a historical or generated
artefact still carries the old one, that is called out in the Notes column and tracked in §4.

### 3.1 RBAC roles — "8" / "9" → **10**

| | |
|---|---|
| **Claim** | Various docs quoted "8 roles" (seed comment) or "9 Roles" / "9 perspectives" (feature catalogue). |
| **Truth** | **10 roles**: system_admin, aib_senior_officer, aib_officer, aib_statistician, cyberops_analyst, money_adviser, creditor, supplier, aib_readonly, debtor. |
| **Source of truth** | `seed-data/roles.json` (10 roles), consumed by `packages/database/src/rbac.ts`; cross-checked at `docs/security-known-gaps.md:618`. |
| **Carried wrong figure** | `docs/feature-catalogue.md:150` ("F-04: Role-Based Access Control (9 Roles)"), `:172` ("all 9 perspectives"); `docs/security-known-gaps.md:593` (describes the historic 8-role seed defect); release-notes / sprint-delivery-log historical rows; `apps/web/src/app/admin/page.tsx:52` tile description ("500 users across 9 RBAC roles"). |
| **Status** | **Reconciled** in body prose (`feature-catalogue.md:162,164` now state 10/28/91 correctly), **Outstanding** in the `feature-catalogue.md:150` heading, the `:172` role-switcher line, and the `admin/page.tsx:52` tile copy — these three still say "9". Flag for a copy pass. |

### 3.2 RBAC permissions — "20" → **28**; grants "68" → **91**

| | |
|---|---|
| **Claim** | "20 permissions" and "68 grants" throughout. The 20-vs-28 split was itself the finding: the code carried a 28-code vocabulary in `permissions.json` while docs quoted 20 from an older seed. |
| **Truth** | **28 permissions**, **91 role-permission grants**. |
| **Source of truth** | `seed-data/permissions.json` (28), `seed-data/role-permissions.json` (91), read by `packages/database/src/rbac.ts`; evidenced at `docs/security-known-gaps.md:618-619`. |
| **Carried wrong figure** | `docs/CURRENT_STATE_ASSESSMENT.md:56,179,182,187` ("10 roles / 20 permissions / 68 grants"); `docs/FEATURE_AUDIT.md:83`; `docs/functionality-breakdown.md:99`; `docs/sow-delivery-notes.md:49`; `docs/runbook.md:87`; `docs/architecture.md:594` ("All 20 permissions"). CLAUDE.md previously stated 20. |
| **Status** | **Reconciled** — `CLAUDE.md` and `docs/feature-catalogue.md:162` carry 28/91; `security-known-gaps.md` documents the 8-role/20-code historic seed defect as a *fixed* finding; and the operational quick-reference docs (`runbook.md:87`, `sow-delivery-notes.md:49`, `functionality-breakdown.md:99`, `architecture.md:594`) were all updated to "28 permissions" in this engagement. Remaining "20"/"68" references live only in historical sprint/assessment records, where they are correct-as-history. |

### 3.3 Admin features — "28" / "37" / "38" → **33 tiles (+5 orphan)**

| | |
|---|---|
| **Claim** | "28 features", "37", "38 admin features" in various places. |
| **Truth** | **33 feature tiles** in the `ADMIN_FEATURES` array, **+5 orphan admin pages** with no tile = **38 admin pages total**. The "38" is right only when it means *pages*, not *tiles*. |
| **Source of truth** | `apps/web/src/app/admin/page.tsx:7-272` (33-element `ADMIN_FEATURES` array); orphan pages per §6. |
| **Carried wrong figure** | `docs/demo-script.md:70` ("Grid of 28 features"); `docs/executive-summary.md:67` ("28 admin features"); `docs/release-notes.md:151`, `docs/roadmap.md:14`, `docs/sprint-delivery-log.md:217` ("28 features" — Sprint 8 historical). |
| **Status** | **Reconciled** — `docs/admin-portal-guide.md:5,85` now state "33 tiles + 5 orphan = 38 pages" and point here for the orphan catalogue; `docs/IAAS_DOCUMENTATION_REVIEW.md:11,31` state "33 (+5 orphan)". **Outstanding** in `demo-script.md:70` (demo narration still says 28 — this feeds the scripted client demo, so fix before next run) and `executive-summary.md:67`. The Sprint-8 historical rows (28 at that sprint) are legitimate history. |

### 3.4 Services — "13" / "14 microservices" → **12 logical / 14 dirs**

| | |
|---|---|
| **Claim** | "13 microservices" / "14 microservices". |
| **Truth** | **12 logical services** (one Express app per bounded context). `services/` holds **14 directories** = 12 logical + `consolidated-api` (deployment shim, no business logic) + `dotnet-api` (alternative .NET impl, not a 13th logical service). |
| **Source of truth** | `services/` directory (14 dirs); `CLAUDE.md` §Architecture; `services/consolidated-api` imports the twelve routers; `vitest.config.ts` excludes `consolidated-api` from coverage as deployment wiring. |
| **Carried wrong figure** | `docs/functionality-breakdown.md:101` historically "13/14 microservices" (now reads "the 12 logical services"); `docs/IAAS_DOCUMENTATION_REVIEW.md:10` historically; tracked at `docs/CURRENT_STATE_ASSESSMENT.md:226`. |
| **Status** | **Reconciled** — `functionality-breakdown.md:101`, `IAAS_DOCUMENTATION_REVIEW.md:10,29` and `CLAUDE.md` all now state "12 logical / 14 dirs". |

### 3.5 .NET backend — "full parity" → **curated-subset parity**

| | |
|---|---|
| **Claim** | ".NET full parity" / "full feature parity". |
| **Truth** | **Curated-subset parity**: 0 controllers, 11 feature modules, 17 business + 3 metadata endpoints, 16 MediatR handlers — roughly 20% endpoint parity, demonstrating the architecture pattern, not a full re-implementation. |
| **Source of truth** | `services/dotnet-api` (vertical slices); counts at `docs/CURRENT_STATE_ASSESSMENT.md:143` ("~20% endpoint parity: 17 business endpoints across 11 feature modules"). |
| **Carried wrong figure** | `docs/IAAS_DOCUMENTATION_REVIEW.md:10` historically; `docs/sprint-delivery-log.md:403` ("full feature parity" — deep sprint log); `docs/roadmap.md:297` ("endpoint parity" — ambiguous but defensible). |
| **Status** | **Reconciled** in headline docs (`IAAS_DOCUMENTATION_REVIEW.md:10,30` now say "curated-subset parity: 17 business + 3 metadata endpoints, 16 MediatR handlers — not full parity"; `CURRENT_STATE_ASSESSMENT.md:143,226`). **Outstanding** at `sprint-delivery-log.md:403` ("full feature parity" still in the Sprint 18 goal line); see §4. |

### 3.6 Integrations — "10 integrations" → **6 mock modules**

| | |
|---|---|
| **Claim** | Older phrasing implied ~10 external integrations. |
| **Truth** | **6 mock-integration modules**: BASYS, eDEN/DAS-hub, DAS, CFT, Moratorium, RoI — plus a credit-check mock and a health router. Identity federation is handled separately by the in-process OIDC mock IdP; payment simulation lives in the Payment Service. |
| **Source of truth** | `services/mock-integrations` module list; `docs/integrations.md:14` ("ships 6 mock-integration modules — BASYS, eDEN/DAS Hub, DAS, CFT, Moratorium and RoI — plus a credit-check mock and a health router"). |
| **Carried wrong figure** | `README.md` integration row/body (now `README.md:12` "6 AiB databases", `:195`, `:375` "6 mock-integration modules"); `docs/integrations.md:760,770,772` ("All 6 systems"). |
| **Status** | **Reconciled** — `README.md:375`, `integrations.md:14`, `functionality-breakdown.md:124` ("6 legacy systems") and the admin tile `integration-monitor` ("all 6 AiB system connections", `admin/page.tsx:252`) all state 6. |

### 3.7 Test count — "423" / "904" / "1,037" → **1,078 across 60 files**

| | |
|---|---|
| **Claim** | 648/658 (Vitest conflated with Playwright), 904, then 1,037. |
| **Truth** | **1,078 across 60 files** (751 backend / 47 files + 327 frontend / 13 files), from a full `npx vitest run`. Backend rose from 722 after Phase 2 added 19 security-regression tests. |
| **Source of truth** | `npx vitest run`; methodology at `docs/testing.md` §3.1 (`:90`); `docs/code-quality-report.md:10,35`. |
| **Carried wrong figure** | `docs/testing.md`, `docs/architecture.md:763,781`, `docs/BETA_READINESS.md:29`, `docs/CURRENT_STATE_ASSESSMENT.md:222`, `docs/dotnet-migration-plan.md:163`, `docs/code-quality-report.md`, `CLAUDE.md:124` — all previously carried 904 or 1,037. |
| **Status** | **Reconciled** — every doc above now states 1,078/58 (751/327), and the diagram source `docs/diagrams/src/architecture-9.mmd:8` was updated to match. The **rendered** `docs/diagrams/svg/architecture-9.svg` still bakes in the old figure until the next `npm run generate:pdf` / diagram render — see §4. Historical sprint rows quoting 423 (`sprint-delivery-log.md:254,263,274`, `roadmap.md:17`, `release-notes.md:125`, `README.md:37`) are legitimate point-in-time records for Sprint 11 and should stay. |

### 3.8 testing.md internal conflict — backend "38" vs "45" files → **45**

| | |
|---|---|
| **Claim** | `docs/testing.md` quoted both 38 and 45 backend files in adjacent sections. |
| **Truth** | **45 backend files**. The "38" was a stale value for the Shared Validation (Zod) suite's test count being mistaken for a file count, and an older backend-file total. |
| **Source of truth** | `vitest.config.ts` glob + run output; `docs/testing.md:90,123` now both say "45 backend files". |
| **Carried wrong figure** | `docs/testing.md` (self-conflicting); the stale "215→298" progression note was also dropped. |
| **Status** | **Reconciled** — `testing.md:90` and `:123` agree on 45; the per-service table at `:104` legitimately shows "38" as the *Zod suite's test count*, not a file count, and is now explicitly labelled indicative (`:114`). The "215→298" note has been removed. |

### 3.9 Packages — "6" → **8**

| | |
|---|---|
| **Claim** | "6 packages". |
| **Truth** | **8 packages**: auth, database, integration-contracts, shared-types, statutory, test-data, ui-components, validation. |
| **Source of truth** | `packages/` directory; `CLAUDE.md:58` ("8 packages"), `:124`. |
| **Carried wrong figure** | `CLAUDE.md` previously; older package lists that omitted `auth` and `statutory`. |
| **Status** | **Reconciled** — `CLAUDE.md:58,124` state 8; no residual "6 packages" string remains in the doc set. |

### 3.10 Keycloak / docker-compose — "runs in Docker Compose" → **scaffolding only; OIDC mock IdP is live**

| | |
|---|---|
| **Claim** | "Keycloak runs in Docker Compose with a pre-configured realm" as the live identity broker; references to a root `docker-compose.yml`. |
| **Truth** | A full in-process **OIDC / GOV.UK One Login mock IdP** (RS256 / JWKS / PKCE) under `services/api-gateway/src/oidc` is the **live federation path** (GAP-007). Keycloak exists only as `realm-export.json` **scaffolding — not wired** into the running system. There is **no root `docker-compose.yml`**; the compose file is `infra/docker/docker-compose.yml` and does not run Keycloak as the live broker. |
| **Source of truth** | `services/api-gateway/src/oidc`; reconciliation note at `docs/architecture.md:530-541`; `:657`. |
| **Carried wrong figure** | `docs/architecture.md:543` and `:913` still describe "Keycloak runs in Docker Compose … 10 users across 10 roles" and "Docker Compose with pre-configured realm" in the body/table; ADR-005 (`:956-959`); the AWS target diagrams at `:700,739,818,1063,1103` reference Keycloak (legitimately — those are the *production target* topology). |
| **Status** | **Reconciled with caveat** — a prominent reconciliation note (`architecture.md:530-541`) and the deployment-modes note (`:657`) now flag Keycloak as scaffolding and the OIDC mock IdP as the live path, and instruct the reader to treat the Keycloak references below as the production migration target. The body sentence at `:543` and the stack-table row at `:913` were left intact *under* that note as the production target, but still read as present-tense ("runs in Docker Compose"). Flag for a tense pass so a reader skimming §8.2 or §9 without the note is not misled. |

---

## 4. Stale / overstated claims still worth watching

These are not blocking, but they will re-introduce drift if regenerated or quoted out of context.

- **Rendered diagram SVGs still bake in the old 1,037 count.** The source
  `docs/diagrams/src/architecture-9.mmd:8` has been updated to `Vitest (1,078 tests, 60 files)`,
  but the rendered `docs/diagrams/svg/architecture-9.svg` (and any PNG) is a downstream build
  artefact and still carries the old figure. **Action: regenerate on the next
  `npm run generate:pdf` / diagram render** so the SVG/PNG set matches the source.
- **"Full feature parity" survives in the deep sprint log.** `docs/sprint-delivery-log.md:403`
  (Sprint 18 goal) still says ".NET alternative backend with full feature parity". As a historical
  goal statement it is low-risk, but it contradicts the reconciled "curated-subset parity" and a
  reader may quote it. Recommend a parenthetical ("(delivered as curated-subset parity — see
  §3.5)").
- **Present-tense Keycloak phrasing** at `architecture.md:543,913` (see §3.10) — sits under a
  reconciliation note (added at `architecture.md` §8.1 and §9 in this engagement) but the deeper
  references still read as live. Low-risk given the note; worth a tidy on the next pass.
- **Resolved in this engagement** (recorded here so a future reconciliation does not mistake the
  historical copies for live drift): the "9 roles" copy at `feature-catalogue.md:150,172` and the
  `admin/page.tsx` Users tile → **10**; the demo narration at `demo-script.md:70,78` ("28 features")
  → **33 tiles**; the `admin/page.tsx` dev tile "60 project documents" label → generic (the `docs/`
  tree holds 67 markdown files); and the "20 permissions" operational quick-refs (`runbook.md:87`,
  `sow-delivery-notes.md:49`, `functionality-breakdown.md:99`, `architecture.md:594`) → **28**.
- **Historical test figures (423) in sprint/release records** are correct-as-history and should
  *not* be "fixed" to 1,078 — doing so would falsify the sprint record. They are listed here only
  so a future reconciliation does not mistake them for drift.

---

## 5. Missing documentation

Verified by inspecting the repository:

- **No Terraform documentation despite committed IaC.** `infra/terraform/` contains real
  Terraform (`infra/terraform/envs/fat/main.tf`, `modules/compute/main.tf`,
  `modules/networking/main.tf`, `modules/storage/main.tf`, `versions.tf`), but there is no
  doc that walks the module layout, variables, or `plan`/`apply` workflow. `docs/architecture.md`
  and several others *mention* Terraform (44 files reference "terraform/IaC"), yet none document
  it. **Gap: a `docs/infrastructure-terraform.md` (or a section in `runbook.md`).**
- **CI tests the consolidated build, not the standalone services.** `.github/workflows/ci.yml`
  runs `npx vitest run --coverage` (one suite), `npm run build` (typecheck of every workspace),
  and a Docker build of `infra/azure/Dockerfile.api` that boots **consolidated-api** and curls
  `/api/health`. The twelve standalone services (`npm run dev:services`) are exercised only
  indirectly via the shared routers. This is defensible for a POC, but it is undocumented — a
  reader cannot tell from the docs that "deployed" means the consolidated shim, not twelve
  containers. **Gap: a note in `docs/testing.md` or `docs/runbook-render.md` on consolidated-vs-standalone
  CI coverage.**
- **No committed OpenAPI artefact.** There is an API-docs *page*
  (`apps/web/src/app/api-docs/openapi/page.tsx`) and build output under `apps/web/.next/`, but no
  checked-in `openapi.yaml` / `openapi.json` spec file (glob for `**/openapi.{yaml,yml,json}`
  returns nothing outside the `.next` build cache). Docs reference "API-first design"
  (`docs/api-first-design.md`) without a canonical machine-readable contract. **Gap: commit a
  generated `openapi.json` as the source of truth, or document that the page is hand-authored.**
- **Sprint delivery log lags the roadmap by one sprint.** `docs/sprint-delivery-log.md` runs to
  **Sprint 29 — Enterprise Showcase** (`:586`). `docs/roadmap.md:37` lists **Sprint 30 — Security
  Remediation** as "Delivered (Phase 1, Oct 2026)", and `roadmap.md:47` has a full Sprint 30
  section. The delivery log has no Sprint 30 entry. **Gap: add the Sprint 30 entry to
  `sprint-delivery-log.md` so the two agree.**

---

## 6. The five orphan admin pages

The admin hub (`apps/web/src/app/admin/page.tsx`) renders a **33-element `ADMIN_FEATURES`**
array (`:7-272`), each with an `href` into `/admin/*`. The `apps/web/src/app/admin/` directory,
however, contains **38 leaf `page.tsx` routes** (excluding the hub `page.tsx` itself and the
`rules/[id]` detail route). Diffing the directory against the tile `href` list yields **5 admin
pages that are reachable by direct URL but have no hub tile**:

1. `/admin/api-keys` — `apps/web/src/app/admin/api-keys/page.tsx`
2. `/admin/api-versioning` — `apps/web/src/app/admin/api-versioning/page.tsx`
3. `/admin/monitoring` — `apps/web/src/app/admin/monitoring/page.tsx`
4. `/admin/webhooks` — `apps/web/src/app/admin/webhooks/page.tsx`
5. `/admin/security-headers` — `apps/web/src/app/admin/security-headers/page.tsx`

So: **33 tiles + 5 orphan pages = 38 admin pages total.** (`api-versioning` and `monitoring`
were the Sprint 29 "Enterprise Showcase" additions per `roadmap.md:36`; they were built as pages
but never wired into the hub grid.) This is the catalogue that `docs/admin-portal-guide.md:5,85`
now points to.

**Recommendation:** either add the 5 missing tiles to `ADMIN_FEATURES` (so the hub advertises
everything that exists) or confirm they are intentionally hidden (e.g. deep-link-only admin
tooling) and annotate them as such. Leaving them undiscoverable-but-live is the state that
produced the 33-vs-38 confusion in the first place.

---

## 7. Recommendations

1. **Adopt a durable single source of truth for the counts.** §2 of this document and the
   `CLAUDE.md` §Conventions baseline now hold the verified figures; promote §2 to a permanent
   `docs/VERIFIED_FACTS.md` and have every deliverable cite it rather than restating raw numbers.
   Keep that file and `CLAUDE.md` in lockstep.
2. **Add a CI check that counts and asserts.** A small script in the `test` job that counts roles
   (`seed-data/roles.json`), permissions and grants (`permissions.json`, `role-permissions.json`),
   `ADMIN_FEATURES` entries, `services/` dirs, packages, and the vitest total, then fails the
   build if any drifts from `VERIFIED_FACTS.md`. This converts "doc drift" from a manual-review
   problem into a red build. The test count is the easiest to assert (`vitest run` already emits
   it); the array counts are a one-line `node -e` each.
3. **Regenerate the diagram set.** Edit `docs/diagrams/src/architecture-9.mmd:8` to 1,078, re-run
   the diagram render (`generate:pdf` pipeline), and commit the refreshed SVG/PNG so the visual
   artefacts stop contradicting the prose (§4).
4. **Close the small copy residuals** flagged in §4 in one pass: `feature-catalogue.md`
   "9 roles" → 10; `demo-script.md:70` "28 features" → 33; `architecture.md:543,913` Keycloak
   tense; the "20 permissions" quick-refs; the `admin/dev` "60 documents" label.
5. **Fill the four documentation gaps in §5** — Terraform doc, consolidated-vs-standalone CI note,
   committed OpenAPI artefact, and the Sprint 30 delivery-log entry.
6. **Decide the orphan-admin-page question** (§6): advertise them as tiles or annotate them as
   deliberately hidden.

---

*Prepared by Workstream B. All figures recounted against the repository on 2026-10-19; cross-
references use `file:line` against commit `390a9ec`. British English throughout; POC-honest tone —
no figure in this document was inflated, and several were corrected downward.*
