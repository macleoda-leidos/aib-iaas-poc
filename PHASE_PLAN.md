# IAAS — Next 5 Phases

**Planned:** 19 October 2026
**Baseline:** Phase 2 complete (five security findings fixed + tested, docs reconciled, six strategic deliverables). Full suite **1,068/58 passing**.
**Sequencing:** roadmap-default — *de-risk and finish proven seams first*, then mature capabilities, then strategic external-dependency items. Each phase is scoped to ~1 sprint and derived from `ROADMAP_RECOMMENDATIONS.md` §4 and `DOCUMENTATION_GAP_ANALYSIS.md`.

> Convention: every phase lands with tests and keeps the suite green (`DATABASE_PATH="$(mktemp -d)/fresh.db" npx vitest run`), touches no `data-demo` hooks or DemoMode narration except to correct a stated count, and updates the verified-count baseline (CLAUDE.md + `DOCUMENTATION_GAP_ANALYSIS.md`) if any number moves.

---

## Phase 3 — Integrity & CI hygiene (Quick Wins) — ✅ DELIVERED (19 Oct 2026)

**Delivered:** PG index parity (10→24; +14 indexes in `pg-schema.ts`) with a source-diff parity test (`packages/database/src/__tests__/schema-index-parity.test.ts`); axios floor raised to `^1.7.0` across all direct deps; non-blocking `npm audit --audit-level=high` step added to CI; canonical `openapi.json` (OpenAPI 3.1, 20 paths, both security schemes) committed at repo root, referenced from `api-first-design.md`, guarded by `packages/validation/src/__tests__/openapi-contract.test.ts`. Suite **1,078/60** passing.

**Goal:** close the two self-contained integrity gaps and the OpenAPI gap. Lowest risk, unblocks later work, no external dependency.

**Scope**
1. **PostgreSQL index parity** (`ROADMAP §3.2`; `ARCHITECTURE_REVIEW §5.3`). PG defines **10** indexes (`packages/database/src/pg-schema.ts:28-37`) vs SQLite's **24** (`packages/database/src/schema.ts`). Add the 14 missing `CREATE INDEX IF NOT EXISTS` statements to `pg-schema.ts` — notably the FK-join indexes the case screen uses (`idx_applications_app`-family) and `idx_sessions_token` (hit on every authenticated request). Several already share a cosmetic name difference (`idx_applications_ref` vs `idx_applications_reference`) — do not double-add.
2. **Index-parity test.** A `packages/database` test that parses both schema files and asserts the index sets match (modulo the known name alias), so the gap cannot silently reopen.
3. **Dependency hygiene in CI** (`ROADMAP §3.7`). Bump `axios` to ≥1.7; add an `npm audit --audit-level=high` step to `.github/workflows/ci.yml` (non-blocking at first, then promote to a gate once clean).
4. **Committed OpenAPI artefact** (`ROADMAP §3.10`; `DOC_GAP §5`). No `openapi.{json,yaml}` is committed today (the `/api-docs/openapi` page is hand-authored). Generate/author one canonical `openapi.json` at repo root or `docs/`, covering the ~120 Express endpoints, as the machine-readable contract.

**Acceptance:** PG and SQLite index sets match (test proves it); `npm audit` runs in CI; `openapi.json` committed and referenced from `api-first-design.md`. Suite stays green.

**Effort:** S. **Risk:** very low. **Dependencies:** none.

---

## Phase 4 — Recommendation traceability & override capture (Near-Term) — ✅ DELIVERED (19 Oct 2026)

**Delivered:** `PATCH /api/applications/:id/recommendation/override` — staff-gated (`applications.update`), mandatory justification (≥10 chars, `recommendationOverrideSchema`), product constrained to the engine's own menu, preserves the engine's original output, and writes a `recommendation_overridden` audit event capturing the divergence. New `recommendations.applyOverride()` repo method + nullable `override_*` columns on the `recommendations` table (SQLite **and** PG). The engine already emits `factors[]`/`reasoning[]`/`alternativeProducts[]`, which `/case/[ref]/recommendation` renders; an additive override banner surfaces the human decision when present (`data-demo="recommendation-override"`). 6 new backend tests (gating 403, mandatory-justification 400, off-menu 400, no-recommendation 404, success+audit, anonymous 401). Suite **1,084/60**.

> **Note:** the case recommendation page reads static demo data (`recommendation-data.ts`), so the override banner is wired to an optional view-model field rather than the live API — fully API-backing that page is deferred to the admin-portal/case-screen work (ROADMAP §3.6), not Phase 4.

> **Confidence calibration** (needs real outcome data) remains deferred — not available in the POC.

**Goal:** make the deterministic recommendation engine *demonstrably* explainable and auditable, and let a caseworker override with recorded justification — human-in-the-loop by construction.

**Scope** (engine already emits the structured data — this is mostly surfacing + capture)
1. **Surface factor weights/traceability in the case UI.** The engine returns `reasoning[]`, `factors[]` (`{factor, value, impact}`), `alternativeProducts[]` and a confidence band (`services/recommendation-service/src/engine/rules.ts:17-20`). Render *which rule fired on which input* on `/case/[ref]/recommendation`, not just the outcome.
2. **Override + mandatory justification.** New endpoint `PATCH /api/applications/:id/recommendation/override` (staff permission) persisting the override product, free-text justification, and the original engine output; write an `audit` event (`recommendation_overridden`) so divergence from the engine is on the immutable trail.
3. **Persist override alongside the engine result** using the existing `RecommendationRepository`/`engineVersion` pattern so a case reload shows both the engine's answer and the human decision.

**Acceptance:** case screen shows traceable factors + alternatives; an override requires a justification (400 without it), is staff-gated (403 otherwise), and emits an audit event; tests cover gating, the mandatory-justification path, and audit emission.

**Effort:** M. **Risk:** low. **Dependencies:** audit service (present), recommendation persistence (present).

**Deferred to a later phase:** *confidence calibration* (`ROADMAP §3.5 incr. 3`) needs real outcome data — not available in the POC.

---

## Phase 5 — Org-boundary RBAC & token-storage/CSRF hardening (Medium)

**Goal:** close the top security residual (partial tenant isolation) and the browser-token residual together — the hinge item that also unblocks multi-tenant platform use and admin-portal consolidation.

**Scope**
1. **Org-boundary RBAC** (`ROADMAP §3.4`; `SECURITY_AUDIT §5`). Today authorisation is role-based; a creditor/adviser is scoped by `organisationId` only on some routes (e.g. claims filter in `applications.ts`). Add an organisation-boundary check to **every** multi-org resource so a correct role cannot read across organisations. Thread the token's `organisationId` claim through a shared helper (mirror `enforceOwnership`) and apply at each mount. Add cross-org denial tests to `access-control.test.ts`.
2. **Token storage → HttpOnly cookies** (`ROADMAP §3.9`; `SECURITY_AUDIT §5`). Move the session token out of `localStorage` into an `HttpOnly`, `Secure`, `SameSite` cookie (keep the short, application-scoped capability token where it is). This removes the XSS-exfiltration residual the A5 fix only mitigated.
3. **CSRF posture.** With cookies, add a double-submit / `SameSite=strict` CSRF defence on state-changing routes.

**Acceptance:** a creditor/adviser with the right role but wrong org gets 404 on another org's resources (tested); session token no longer readable from JS; CSRF defence on mutations; suite green. Capability-token `/apply` flow unchanged.

**Effort:** L. **Risk:** medium (touches the auth path — stage behind a flag, keep HS256 verification intact). **Dependencies:** org hierarchy (present), token `organisationId` claim (present).

---

## Phase 6 — Real IdP federation (GAP-007) (Medium → Strategic)

**Goal:** promote the in-process OIDC mock IdP (already RS256/JWKS/PKCE) to a real ScotAccount / GOV.UK One Login federation. The flow shape is already proven in code; this is the cutover.

**Scope**
1. **Real discovery/JWKS with `kid` rotation.** Replace the in-process JWKS with the IdP's published endpoint; verify RS256 ID tokens against the rotating key set (`@aib-iaas/auth` already has `verifyRs256`/`buildJwks`).
2. **Real back-channel token exchange** against the IdP token endpoint (env-driven config scaffolding already exists: `OIDC_ISSUER`/`JWKS_URI`/`TOKEN_ENDPOINT`/client creds).
3. **RS256 session cutover** (or federated-login → local HS256 session mint, decided with AiB), done alongside the Phase 5 cookie work so tokens move once.
4. **MFA delegation** to the IdP where it provides a second factor.

**Acceptance:** a real sandbox IdP login completes end-to-end against discovery/JWKS; `kid` rotation handled; mock remains the default for local/CI; tests cover JWKS rotation and the exchange with mocked IdP responses.

**Effort:** L. **Risk:** medium–high (external). **Dependencies — EXTERNAL, start procurement now:** AiB IdP decision, RP (relying-party) registration, sandbox credentials. These gate the phase; begin the agreement conversations in parallel with Phases 3–5.

---

## Phase 7 — `INTEGRATION_MODE=live` + DWP/benefits pilot (Strategic)

**Goal:** turn on the real integration seam and deliver the first high-value external integration — a consent-based DWP/benefits check — on the existing I&E + CFT engine. Highest value in the set; sequenced last only because external agreements gate it.

**Scope**
1. **Finish `INTEGRATION_MODE=live`** (`ROADMAP §3.1`). Today the factory throws for `live` (only `mock` works). Implement real clients behind the existing seven `packages/integration-contracts` interfaces so the swap is a config change; start with one real integration end-to-end.
2. **DWP/benefits pilot** (`BENEFITS_INTEGRATION_OPTIONS.md`). Build the **Quick Win → Near-Term** path from that paper on the real foundation (I&E capture + `assessContribution` CFT engine, `GET /api/applications/:id/cft-assessment`):
   - Structured **consent capture** (mirror the credit-check consent + 90-day expiry pattern).
   - **Adviser-assisted check** using the existing adviser submit-on-behalf `authorityDeclared` model.
   - A **sandbox DWP client** behind the integration-contract factory; verified benefit income flows straight into the CFT contribution figure (`income.benefits` is already a first-class line).
3. **DPIA + data-sharing agreement** (non-engineering prerequisite — surface early).

**Acceptance:** one integration runs live behind the factory with mock still the CI default; consent is captured and audited; a sandbox benefits check feeds the CFT assessment; tests cover the factory swap and the consent/verification path. DPIA drafted.

**Effort:** XL. **Risk:** high (external + privacy). **Dependencies — EXTERNAL:** DWP API access, lawful basis, DPIA, information-sharing agreement. **Start these conversations during Phase 3.**

---

## Cross-cutting (every phase)
- Keep the single verified-count baseline in lockstep (CLAUDE.md + `DOCUMENTATION_GAP_ANALYSIS.md` §2); regenerate diagram SVGs (`npm run generate:pdf`) when a count in a diagram changes.
- Admin-portal consolidation (`ROADMAP §3.6`) and surfacing the 5 orphan admin pages (`api-keys`, `api-versioning`, `monitoring`, `security-headers`, `webhooks`) can ride alongside Phase 4/5 UI work.
- Accessibility re-audit (`ROADMAP §3.12`) best scheduled right after the Phase 4 recommendation-UI lands.
- Observability/metrics (`ROADMAP §3.11`) couples to the production-hosting decision; fold into Phase 6/7 once hosting is firmer.
