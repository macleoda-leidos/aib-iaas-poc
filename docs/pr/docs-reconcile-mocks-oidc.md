# Persist mocks, advance GAP-007 mock IdP, reconcile docs to Phase 1

**Branch:** `docs-reconcile-mocks-oidc` → `main` · 33 files, +970/−287 · full suite **1,031 pass / 57 files, 0 failures** (local Node 24 + CI Node 20)

## Summary
Three independent threads: convert the cheapest mocks to real persistence (wiring repos that already existed but were unused), advance the GAP-007 mock OIDC flow as far as it goes without a real IdP, and reconcile the planning docs to the Phase-1 security reality that had already landed on `main`.

## Thread 2 — convert mocks to real
- **document-service:** in-memory `Map` → `DocumentRepository`. Metadata + scan-state persist (survive restart); `documents.application_id` made nullable so a pre-submission `/apply` upload stores cleanly. Disk storage + fail-closed scan gate unchanged.
- **payment-service:** `Map` → `PaymentRepository`. Core record persisted; simulated provider fields (method, providerResponse, transactionReference, sandbox disclaimer) stay in the HTTP response, not the row.
- **recommendation-service:** generated recommendation persisted via `RecommendationRepository`; the gateway reads it back on the case view instead of regenerating.
- **gateway:** new `GET /api/applications/:id/cft-assessment` surfaces `@aib-iaas/statutory` (reg.15 CFS) on the case page, with the POC indicative-trigger caveat.
- **dashboard:** honest copy for un-persisted sample rows.

## Thread 3 — advance GAP-007 (mock); real cutover still blocked
- First-login provisioning for an unseen IdP-verified email.
- Opt-in account picker (`prompt=select_account`); selected subject/email threaded through `authorizeRedirectCode → exchange → ID token`.
- Env-driven OIDC config scaffolding (`OIDC_ISSUER`/`JWKS_URI`/`TOKEN_ENDPOINT`/client creds), defaulting to the in-process mock.
- `oidc.test.ts` extended: provisioning, picker, default-subject-unchanged, unknown-subject.
- **Explicitly out of scope (blocked on AiB IdP decision + sandbox creds):** real discovery/JWKS with `kid` rotation, real back-channel token exchange, MFA delegation, RS256 session cutover.

## Thread 1 — reconcile docs to delivered Phase 1
- `go-live-checklist`: S16–S24, S9, S2 → Done with per-item evidence; summary table + banners recomputed.
- `roadmap` Sprint 30 → Delivered; `BETA_READINESS` security posture table; `security-known-gaps` GAP-011 residual #2/#4 confirmed delivered (commits `07f049a` / `262d5eb`), only #3 open.
- Test count standardised to the **measured 1,031 across 57 files** (716 backend / 315 frontend) across the doc set + CLAUDE.md + the demo's closing narration.
- Dated **Phase-1 addenda** on the two code-grounded baseline docs rather than rewriting them.
- **Host-limited items kept open** (not over-claimed): ITHC against the deployed build, HSTS on the GitHub Pages frontend, encryption-at-rest on SQLite.

## Verification
- `npx vitest run --no-file-parallelism` → **1,031 pass / 57 files, 0 failures** (local Node 24, after rebuilding `better-sqlite3`). Coverage 86.6% stmts / 74.4% branch / 85.7% funcs — above the 50/45/45 gate.
- `tsc --noEmit` clean on every touched workspace; `apps/web` build clean.
- Demo guard `demoSelectors.test.ts` green (98/98).

## Not included (follow-ups)
- document-service / payment-service are still *excluded* from coverage counting despite now holding real logic — tracked as a follow-up to un-exclude + add unit tests.
- Rendered SVG/PNG diagram exports (diagrams are currently Mermaid-only).
- Requirement docs (use-cases / user-stories / user-journeys) refresh for CFT, OIDC, SLA worker, capability-token IDOR.

---

## Phase 2 addendum — Security hardening, audit & strategic docs

Three further commits land on this branch after the Phase-1 reconciliation above. Full suite now **1,068 pass / 58 files, 0 failures** (741 backend / 45 files, 327 frontend / 13 files).

### Workstream A — five security fixes with tests (`fix(security): close 5 access-control findings`)
A five-strand audit of the *running code* found five access-control weaknesses; all five are fixed, mirroring existing in-repo idioms, and covered by regression tests.

| ID | Sev | Finding | Fix |
|----|-----|---------|-----|
| A1 | High | Notification IDOR — every route trusted `:userId`/`:id`/body | Ownership guard (`req.user` or inline `@aib-iaas/auth`); user routes require owner-or-staff, `/:id` row-lookup, send/send-bulk staff-only; 404 on mismatch |
| A2 | Med | Payment routes unauthenticated/unscoped | Capability (anonymous `/apply`) or staff on every route; refund staff-only; 404 on mismatch |
| A3 | Med (demo-critical) | Anonymous application **write** not capability-gated | `enforceAnonymousWrite` requires the capability on PUT/submit; frontend threads `X-Application-Capability` through create→update→submit + the pending-submission retry |
| A4 | Low | Any authenticated user could POST arbitrary audit events | `POST /api/audit/events` refuses `role=debtor` (staff/service-only) |
| A5 | Low | Unsanitised markdown → `dangerouslySetInnerHTML` in admin/dev | HTML-escape before transforms; no new dep; functions extracted to `markdown.ts` and unit-tested |

Tests: 19 backend regression tests + a 12-assertion A5 frontend suite.

### Workstream B — count reconciliation (`docs: reconcile verified counts…`)
Every load-bearing figure recounted against the repo and corrected across CLAUDE.md + the doc set: permissions 20→**28**, roles →**10**, grants 68→**91**, services →**12 logical / 14 dirs**, .NET →**curated-subset parity**, admin →**33 tiles (+5 orphan)**, integrations →**6 mock modules**, packages 6→**8**, tests →**1,068/58**. Keycloak flagged as scaffolding-only; `render.yaml` .NET-parity comment corrected.

### Workstream C — six strategic deliverables (`docs: add six strategic audit deliverables`)
`IAAS_MASTER_AUDIT.md` (umbrella + implementation summary), `SECURITY_AUDIT.md`, `ARCHITECTURE_REVIEW.md`, `DOCUMENTATION_GAP_ANALYSIS.md`, `ROADMAP_RECOMMENDATIONS.md`, `BENEFITS_INTEGRATION_OPTIONS.md` — each grounded in `file:line` evidence.

### Verification
`DATABASE_PATH="$(mktemp -d)/fresh.db" npx vitest run --no-file-parallelism` → **1,068 pass / 58 files, 0 failures**. `demoSelectors.test.ts` green (no `data-demo` hooks moved).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
