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

🤖 Generated with [Claude Code](https://claude.com/claude-code)
