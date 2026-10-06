# IAAS — Feature Audit

Per-feature view of what works today, what's missing, the cheap wins, and future enhancements.
Companion to `docs/CURRENT_STATE_ASSESSMENT.md` (inventories) and `docs/SECURITY_REVIEW.md`
(findings). Evidence is code-grounded; "REAL/MOCK" tags follow the assessment's definitions.

Legend: **Current** = what the code actually does · **Missing** = the gap vs how it presents ·
**Quick win** = low-effort, high-visibility · **Future** = strategic enhancement.

---

## Login / Authentication  — *partly REAL (auth), MOCK (MFA)*
- **Current:** `/login` issues a real session token via `POST /api/auth/login`; user looked up by email; token stored and used for subsequent calls.
- **Missing:** password is **never checked** (any password works); token is **unsigned base64 JSON** (forgeable); **MFA is client-side theatre** (any 6-digit code passes — the real token is issued *before* the MFA screen); no server-side session validation on verify; "Powered by Keycloak"/"MFA enforced by Keycloak" copy is false. (SECURITY_REVIEW C1/C3/H4; GAP-001/003/007.)
- **Quick win:** POST the MFA code to a real TOTP verify endpoint; correct the Keycloak copy to describe the real mechanism; seed one demo credential + known TOTP so the scripted demo still runs.
- **Future:** delegate to an IdP (Keycloak/OIDC — scaffolding exists in compose but is unused), WebAuthn for privileged roles, refresh-token rotation.

## Dashboard  — *REAL*
- **Current:** `/dashboard` consumes `applications.list` + detail; falls back to `seedData` when the free-tier API is cold.
- **Missing:** role-scoped views (every caller sees everything — no authz); the seed fallback can mask an API outage.
- **Quick win:** add status/role filters; surface the real/seed source so a cold start is obvious.
- **Future:** SLA timers, assignment queues, caseworker workload views.

## Applications (the `/apply` citizen journey)  — *REAL (deepest real flow)*
- **Current:** multi-step create → update → submit against `ApplicationRepository` (SQLite), with live calls to recommend, integrations check-all, and credit-check; writes audit events; hand-rolled NI/body validation.
- **Missing:** **ownership checks** (any caller can read/modify/approve any application — IDOR, GAP-005); **Zod validation not wired** (the shared schemas are dead code — bespoke validators run instead); the generated recommendation isn't persisted to the `recommendations` table.
- **Quick win:** add an ownership/org predicate on `/:id` routes; wire `packages/validation` `.safeParse` at the mutating handlers; persist the recommendation.
- **Future:** save-and-resume, co-applicant/joint applications, document-driven pre-fill.

## Recommendation engine  — *REAL (a genuine asset)*
- **Current:** `POST /api/recommend` runs the real rules engine over 7 products, sourcing citation-backed thresholds from `packages/statutory`; the £1,500 floor was correctly removed.
- **Missing:** `/recommend/explain` is hardcoded AI-mock text; the **.NET implementation diverges** (keeps the £1,500 floor + inline literals → different products for the same input); no shared Node↔.NET golden fixtures.
- **Quick win:** persist each recommendation; align `.NET` `Commands.cs` to the statutory thresholds.
- **Future:** shared golden-fixture suite run by both engines; genuine explainability tied to the rule that fired; policy-simulation backed by the live engine.

## Income & Expenditure  — *REAL (capture), MOCK (assessment surfacing)*
- **Current:** captured in `/apply`, stored in `income_expenditure`; drives disposable-income branches in the engine.
- **Missing:** `packages/statutory` `cft.ts` (Common Financial Tool contribution assessment) is implemented but **not surfaced in any UI/endpoint**; CFT trigger figures are POC stand-ins.
- **Quick win:** expose a CFT assessment endpoint/panel using `assessContribution`.
- **Future:** open-banking income import; licensed CFT trigger figures.

## Debt & Assets  — *REAL (capture + engine use)*
- **Current:** `debts` and `assets` tables populated from `/apply`; asset value drives MAP (<£2,000) and PTD (>£5,000) branches; sequestration/DAS/PTD boundaries applied.
- **Missing:** creditor verification is only via the mock integrations; the statutory vehicle-disregard (<£3,000 where reasonably required) isn't surfaced to the user.
- **Quick win:** link captured debts to BASYS/DAS mock results in the UI; show the vehicle-disregard rationale.
- **Future:** real creditor/arrangement data via `integration-contracts` live clients.

## Supporting Information / Documents  — *MOCK (not persisted)*
- **Current:** upload UI works; files written to disk; metadata held in an **in-memory `Map`** (lost on restart).
- **Missing:** `DocumentRepository` (full SQLite CRUD) exists but is **unused**; scanning is a **separate manual endpoint, fail-open and filename-based**; **download is not scan-gated**; upload/download/delete are unauthenticated. (SECURITY_REVIEW H2/M5; GAP-004.)
- **Quick win:** switch the route to `DocumentRepository`; scan on upload and fail **closed**; withhold download until `scanned && !infected`.
- **Future:** S3 storage, real ClamAV as a hard dependency, content-type magic-byte checks.

## Reporting / Statistics  — *PARTIAL*
- **Current:** `/statistics` and `/admin/reports` consume `/api/reports/*`; `summary` + `byStatus` are **real SQLite aggregates**.
- **Missing:** `byProduct`, `trends`, `performance`, `geographic`, `financial`, `/by-product`, `/organisation-activity`, `/processing-times`, and both CSV exports are **hardcoded**.
- **Quick win:** replace the hardcoded blocks with SQLite aggregates over `applications`/`applicants`/`recommendations` (high demo value — the pages already render them).
- **Future:** scheduled MI, drill-down, export to the real reporting pipeline.

## User & Organisation management  — *REAL (web `/admin/users`, org CRUD); MOCK duplicates*
- **Current:** web `/admin/users` lists/creates via `/api/users`; organisation list/get/hierarchy/create/update are real SQLite. RBAC model is complete (10 roles / 20 permissions / 68 grants).
- **Missing:** **no enforcement** (every route unauthenticated); the RBAC matrix on the admin page is a hardcoded illustration, not driven by the API; the separate `apps/admin` app and `/manage-users` are **100% hardcoded duplicates**.
- **Quick win:** drive the RBAC matrix from `/api/roles/matrix/full`; retire `/manage-users` and `apps/admin` onto the API-backed surface.
- **Future:** delegated/org-scoped administration once authz is enforced.

## Security portal  — *STATIC (`/security`), now-accurate (`/admin/security-headers`)*
- **Current:** `/security` is informational; `/admin/security-headers` now reflects the **real** API header set (CSP/HSTS/etc. hardened 1 Oct 2026).
- **Missing:** no live posture check (the page is a static table, not a probe of the live API).
- **Quick win:** fetch the live API and display observed headers; link to `security-known-gaps.md`.
- **Future:** continuous external-scan integration; surface the GAP register status live.

## Audit  — *REAL (persistence), weak (integrity)*
- **Current:** real SQLite audit; events written on application create/status/notes; `/case/[ref]/audit` renders them.
- **Missing:** **actor taken from the request body**, not an authenticated token; reads **and** writes are unauthenticated; no tamper-evidence. (SECURITY_REVIEW H3; GAP-006.)
- **Quick win:** require auth; derive actor from the verified token; persist staff notes to a real `notes` table (today a note survives only inside an audit event's `details`).
- **Future:** append-only storage + hash-chaining for non-repudiation.

## Notifications  — *REAL (service), MOCK (page)*
- **Current:** notification service persists to its own SQLite DB (send/bulk/read/read-all/delete); `NotificationBell` is wired.
- **Missing:** the `/notifications` page and `/my-application/messages` reply are **not wired** to the API (local state only); `/preferences` is a hardcoded stub.
- **Quick win:** wire `/notifications` and the message reply to the real notification endpoints.
- **Future:** real email/SMS channels, user-managed preferences.

## Admin surface (tiles)  — *mostly MOCK (illustrative)*
- **Current:** ~37 web `/admin/*` tiles + the separate `apps/admin` app are convincing but **illustrative** (no backend); `/admin/users` is the one real tile.
- **Missing:** backends for the tiles; honest labelling that most are demonstrations.
- **Quick win:** convert `integration-monitor`, `feature-flags`, `open-banking` to the real `/api/integrations/health`; label the rest "illustrative".
- **Future:** consolidate onto the API-backed surface; retire the duplicate `apps/admin` app to remove "which one is real?" confusion in the demo.

---

## Cross-cutting quick wins (highest demo value, lowest effort)
1. `/feedback` → POST to a feedback/notification endpoint (today its submit only sets local state).
2. `/case/[ref]` Approve → `applications.updateStatus` + `audit` (apiClient already exposes both).
3. `/search` → ensure it reads `applications.list` (not just the seed fallback).
4. Real reports (replace hardcoded report blocks with SQLite aggregates).
5. Persist documents + payments via the existing (unused) repositories.

These pair naturally with the Phase-1 security backbone: the ownership/auth work (SECURITY_REVIEW
C2/H1) is the prerequisite that makes the staff-facing conversions trustworthy rather than just
visible. See `CURRENT_STATE_ASSESSMENT.md` §6 for the phase mapping.

---

*Classification: OFFICIAL-SENSITIVE. POC on synthetic data.*
