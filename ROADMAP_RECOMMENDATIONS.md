# IAAS — Roadmap & Forward Recommendations

> **Status:** Proof of Concept with synthetic data. No real integrations, payments,
> or personal data are involved. Every recommendation below is grounded in an asset
> that already exists in this repository, or a gap that has been verified against it.
> Figures are drawn from the verified baseline recounted on 2026-10-19 (DOCUMENTATION_GAP_ANALYSIS.md §2).

---

## 1. Executive summary

The Initial Application Advice Service (IAAS) POC is already a credible strategic
platform, not a throwaway prototype. It demonstrates **12 logical microservices**
(deployed as a single consolidated container to suit Render's free tier), **~120
Express endpoints**, a **deterministic statute-backed recommendation engine**, a
**dual backend** (TypeScript/Express *and* .NET 9 with endpoint parity on a curated
subset), and a security posture that has already closed five findings with
regression tests (**1,068 tests across 58 files**).

Critically, the architecture was built to be *finished*, not just demonstrated. The
integration layer is a factory/contract pattern where `INTEGRATION_MODE=live` is a
documented, test-covered seam waiting for real clients. Identity federation is a
fully working in-process OIDC/One Login mock IdP (RS256/JWKS/PKCE) that models the
exact flow a real IdP will use. Authorisation runs through a shared default-deny
gate that both deployment shapes install, so they cannot drift.

The recommendations in this document therefore divide cleanly into two kinds:

1. **Finishing seams that already exist** — turning `INTEGRATION_MODE=live` on,
   promoting the OIDC mock to a real IdP, bringing PostgreSQL index parity up to the
   SQLite baseline. These are low-risk because the shape is already proven in code.
2. **Maturing capabilities for a real service** — tenant-scoped RBAC, recommendation
   traceability and override capture, admin-portal consolidation, deep document
   inspection, observability, and dependency hygiene in CI.

None of these require re-architecture. They are the backlog of a platform that is
ready to become a product.

---

## 2. Scoring method

Each recommendation is scored against **seven criteria**, each on a **1–5** scale.
Six criteria are "higher is better"; **implementation complexity is inverted
(lower = better, i.e. 5 = simplest)** so that a high row-total always means "more
attractive to do". The rationale for each score is given per recommendation.

| Criterion | What a 5 means |
|-----------|----------------|
| **CX** (customer experience) | Materially better experience for debtors / representatives |
| **Operational efficiency** | Removes manual effort or cost from running the service |
| **Advice accuracy** | Improves correctness / defensibility of the product recommendation |
| **Caseworker productivity** | Saves AiB staff time per case |
| **Fraud reduction** | Closes an abuse or integrity gap |
| **Implementation complexity** *(inverted)* | 5 = a sprint or less; 1 = large, cross-cutting effort |
| **Strategic value** | Advances IAAS as a reusable AiB platform |

**Delivery buckets** (effort, not value):

| Bucket | Effort | Meaning |
|--------|--------|---------|
| **Quick Win** | 1 sprint | Isolated, low-risk, high certainty |
| **Near-Term** | 2–4 sprints | Single-team, bounded |
| **Medium** | 5–10 sprints | Cross-cutting or needs external coordination |
| **Strategic** | 10+ sprints | Programme-level, external dependencies, procurement |

Scores are relative judgements to aid sequencing, not a precise model. Complexity in
particular is a POC-honest estimate: the seam may be built, but the *live* side of it
(real third-party systems, contracts, data-sharing agreements) is often the larger
part of the work and sits outside this repository.

---

## 3. Recommendations

### 3.1 Finish `INTEGRATION_MODE=live` — real integration clients behind the factory

**Current state.** `packages/integration-contracts/src/factory.ts` already defines
the live seam. Mode is read from the environment
(`factory.ts:31`, defaulting to `mock`), and each of the seven client factories has a
`live` branch that currently throws, e.g. `factory.ts:42`
`throw new Error('Live BASYS integration not yet implemented')`. The same pattern
repeats for eDEN, DAS, CFT, Moratorium, RoI and Credit Check. The behaviour is even
locked by tests (`factory.test.ts:172` "Live mode throws"), so the contract is a
deliberate, documented placeholder rather than an accident. In `mock` mode, six mock
integration modules (BASYS, eDEN/DAS-hub, DAS, CFT, Moratorium, RoI) plus a
credit-check mock stand in for the real systems.

**Proposal.** Implement real clients behind each `live` branch, one integration at a
time, with each new client satisfying the existing contract interface so the
orchestrator and every caller remain unchanged. Keep `mock` as the default and the
test/demo path. Treat each integration as independently shippable: the first real
client (likely BASYS or RoI, whichever has the readiest API) proves the end-to-end
live path; the rest follow the same template.

| CX | Op. eff. | Advice acc. | Caseworker | Fraud | Complexity *(inv.)* | Strategic |
|----|----------|-------------|------------|-------|---------------------|-----------|
| 4 | 5 | 5 | 4 | 4 | 1 | 5 |

*Rationale:* real system checks remove the single biggest piece of synthetic data in
the journey, directly improve advice accuracy and operational efficiency, and are
the headline strategic unlock — but complexity is high (1) because each live client
depends on an external system, its credentials, rate limits, and a data-sharing
agreement that live outside this repo.

**Bucket:** Strategic (10+). Individual integrations may each be Near-Term once the
first is proven.
**Dependencies:** external API access and data-sharing agreements per system;
secrets management (the codebase already refuses the dev JWT secret in production via
`getJwtSecret()`, so a secrets convention exists to extend).
**Risks:** external systems may not match the mock contract exactly — budget for
contract reconciliation per integration; partial availability (some live, some mock)
must be a supported, clearly-surfaced state.

---

### 3.2 PostgreSQL index parity with SQLite

**Current state.** SQLite is the runtime query engine for the POC; PostgreSQL (Neon)
holds the schema and seed for the migration path. The two schemas are hand-maintained
in parallel, and they have **drifted on indexes**: `packages/database/src/schema.ts`
carries **24** index/`idx_` references, while `packages/database/src/pg-schema.ts`
carries only **10**. On migration to PostgreSQL as the primary engine, the missing
indexes become a query-plan divergence risk — queries that are cheap on SQLite could
table-scan on PG under production data volumes.

**Proposal.** Audit both schema files, reconcile the PG index set to match SQLite's,
and add a small test that asserts index parity between the two schema definitions so
the drift cannot silently reopen. This is a correctness fix, not a feature.

| CX | Op. eff. | Advice acc. | Caseworker | Fraud | Complexity *(inv.)* | Strategic |
|----|----------|-------------|------------|-------|---------------------|-----------|
| 2 | 4 | 1 | 2 | 1 | 5 | 3 |

*Rationale:* invisible to users and to advice accuracy, but a genuine
migration-correctness item with real operational-efficiency payoff (predictable
query performance) and very low complexity — it is a contained, well-understood change.

**Bucket:** Quick Win (1 sprint).
**Dependencies:** none; self-contained in `@aib-iaas/database`.
**Risks:** low — the risk is of *not* doing it before PG becomes primary. Verify
each added index against actual query patterns rather than copying blindly.

---

### 3.3 Real IdP federation (GAP-007) — promote the OIDC mock to ScotAccount / One Login

**Current state.** `services/api-gateway/src/oidc` contains a full in-process OIDC /
GOV.UK One Login **mock IdP**. It is not a stub: `mockIdp.ts` owns a per-process RSA
keypair, issues **RS256** ID tokens with a `kid`, publishes a **JWKS** at
`/idp/jwks.json` (`mockIdp.ts:115`), and enforces **PKCE** with the real
`base64url(SHA-256(verifier))` "S256" transform (`mockIdp.ts:110`), rejecting a
mismatched verifier (`mockIdp.ts:155`). This is the designated live federation path
(GAP-007). By contrast, the Keycloak `realm-export.json` is scaffolding only — not
wired — so the OIDC mock, not Keycloak, is the thing to promote.

**Proposal.** Point the existing OIDC client code at a real ScotAccount / GOV.UK One
Login endpoint: swap the mock authorise/token/JWKS URLs for the real discovery
document, register the service as a relying party, and keep the local mock IdP as the
test and demo backend behind a config switch. Because the API already verifies RS256
tokens against a published JWKS, the verification path should need little change.

| CX | Op. eff. | Advice acc. | Caseworker | Fraud | Complexity *(inv.)* | Strategic |
|----|----------|-------------|------------|-------|---------------------|-----------|
| 5 | 3 | 1 | 2 | 4 | 2 | 5 |

*Rationale:* a real government IdP is a major CX and trust uplift and a real fraud/
identity-assurance control, with high strategic value for a government service. The
code-side complexity is low because the flow is already built; the complexity (2)
comes from onboarding as a relying party and the assurance/accreditation process,
which are external.

**Bucket:** Medium (5–10) for the code; the external onboarding may push the
end-to-end to Strategic.
**Dependencies:** relying-party registration with the identity provider; redirect
URI allow-listing; the token-storage hardening in §3.9 should land alongside.
**Risks:** real IdPs impose assurance levels and consent screens that the mock does
not; budget for a conformance pass against the real discovery document.

---

### 3.4 Org-boundary RBAC — tenant-scope every route, not just role-check

**Current state.** Authorisation is strong on *identity* and *role*: a shared
default-deny gate (`accessPolicy.ts`) authenticates everything outside a small public
allow-list, there are **10 roles / 28 permissions / 91 role-permission grants**, and
IDOR on the anonymous applicant journey is closed by a signed, application-scoped
capability token (`issueCapabilityToken` / `hasValidCapability`,
`services/api-gateway/src/routes/applications.ts:38`). What is **partial** is
*tenant* scoping: authorisation is role-based, but not every route constrains results
to the caller's organisation. A correctly-authenticated user of one organisation
could, on routes that lack an org filter, reach another organisation's data.

**Proposal.** Introduce an organisation-scope check as a first-class, reusable guard
(the same way the capability token and ownership guards are reusable), and apply it
to every route that returns org-scoped data. Pair it with tests that assert
cross-org access returns 404 (matching the existing "404 not 403 on mismatch"
idiom from the Phase 2 fixes). The organisation hierarchy already exists in the
Organisation Service and the data model, so the scoping data is present.

| CX | Op. eff. | Advice acc. | Caseworker | Fraud | Complexity *(inv.)* | Strategic |
|----|----------|-------------|------------|-------|---------------------|-----------|
| 1 | 3 | 1 | 2 | 5 | 3 | 5 |

*Rationale:* the top fraud/data-integrity item (5) and high strategic value — true
multi-tenancy is a precondition for IAAS as a shared platform across intermediary
organisations. Moderate complexity (3) because it is cross-cutting across many routes,
though the pattern to follow already exists.

**Bucket:** Medium (5–10).
**Dependencies:** the organisation hierarchy in the Organisation Service; a decision
on how org membership is asserted in the token.
**Risks:** the main risk is incompleteness — a missed route reopens the gap. Mitigate
with a default-deny posture (routes must opt in to being org-unscoped, with
justification) and a conformance test over the route table.

---

### 3.5 Recommendation-engine maturity — traceability, override capture, calibration

**Current state.** The engine (`recommendation-service/src/engine/rules.ts`) is a
**deterministic, statute-backed cascade**. It already produces structured
`reasoning[]`, `factors[]` (each with a `factor`, `value` and
`positive`/`negative`/`neutral` impact, `rules.ts:15–21`), `alternativeProducts[]`,
and a confidence band mapped to a percentage, with optional per-application
persistence (`engineVersion`) and a template "AI" explanation. The thresholds come
from the `@aib-iaas/statutory` package (e.g. `MAP.maxDebt`, `SEQUESTRATION_MIN_DEBT`),
so the advice is traceable to statute by construction. What is *not* yet surfaced is
the factor weighting and the human workflow around an override.

**Proposal.** Three bounded increments, all building on the existing structured output:
1. **Surface traceability in the UI** — show the `factors[]`, their impact, and the
   statutory thresholds that drove the recommendation, so a caseworker (and an
   applicant) can see *why*.
2. **Override + justification capture** — let a caseworker override the recommended
   product, requiring a free-text justification, and write both to the audit log
   (the audit service already binds the actor from the token, not the body).
3. **Confidence calibration** — once real outcomes exist, compare the confidence band
   against actual accepted products to calibrate the band→percentage mapping.

Keep the engine deterministic and human-in-the-loop throughout; the recommendation is
advice, never an automated decision.

| CX | Op. eff. | Advice acc. | Caseworker | Fraud | Complexity *(inv.)* | Strategic |
|----|----------|-------------|------------|-------|---------------------|-----------|
| 4 | 3 | 5 | 5 | 2 | 3 | 4 |

*Rationale:* the strongest advice-accuracy and caseworker-productivity item (5/5) —
traceability and override capture are exactly what makes rules-based advice
defensible and auditable. Complexity is moderate (3): the structured output exists,
so increments 1 and 2 are mostly UI and an audit write; calibration (3) depends on
real outcome data and so trails the others.

**Bucket:** increments 1–2 are Near-Term (2–4); calibration is Medium (needs live
outcome data).
**Dependencies:** audit service (present); real outcomes for calibration.
**Risks:** overrides must never silently become the training signal for an automated
decision — keep the human-in-the-loop boundary explicit and documented.

---

### 3.6 Admin-portal consolidation — de-duplicate, surface orphans, rationalise tiles

**Current state.** There are **two** admin surfaces. The web app's admin area
(`apps/web/src/app/admin/`) exposes **33 tiles** (the `ADMIN_FEATURES` array in
`apps/web/src/app/admin/page.tsx`) plus **5 orphan admin pages with no tile** (38
admin pages total). Separately, the `apps/admin` app has its own **10 pages**. The two
overlap: `ai-governance`, `digital-mailroom`, `knowledge-hub`, `organisations`,
`policy-simulation`, `rules` and `users` exist in *both* trees. This is confusing to
maintain and risks the two drifting apart.

**Proposal.** Decide a single home for internal admin (the dedicated `apps/admin` app
is the natural candidate), then: (a) de-duplicate the overlapping pages onto one
implementation; (b) either surface or retire the 5 orphan pages that have no tile so
every page is reachable and intentional; (c) rationalise the 33 tiles into grouped
categories so the surface is navigable rather than a flat wall of features.

| CX | Op. eff. | Advice acc. | Caseworker | Fraud | Complexity *(inv.)* | Strategic |
|----|----------|-------------|------------|-------|---------------------|-----------|
| 2 | 4 | 1 | 4 | 1 | 3 | 3 |

*Rationale:* no applicant-facing CX impact and no advice-accuracy impact, but a real
caseworker-productivity and maintainability win (a coherent single admin surface),
with moderate complexity (3) because de-duplication touches two apps and needs a
clear decision on the canonical home first.

**Bucket:** Near-Term (2–4).
**Dependencies:** a product decision on the canonical admin app; the org-scope guard
(§3.4) should inform which admin pages are org-scoped.
**Risks:** retiring an orphan page that is actually used; mitigate by confirming each
orphan's intent before removing rather than deleting on sight.

---

### 3.7 Dependency hygiene in CI — axios ≥ 1.7, `npm audit`

**Current state.** The verified baseline (DOCUMENTATION_GAP_ANALYSIS.md §2) flags two dependency-hygiene items:
`axios` should be bumped to ≥ 1.7, and `npm audit` is not yet run in CI. The project
already has a CI pipeline (GitHub Actions) enforcing the test suite and coverage
thresholds, so there is a place to add the check.

**Proposal.** Bump `axios` to ≥ 1.7 across the workspaces, then add an `npm audit`
step to CI at an agreed severity threshold (fail on high/critical), plus a scheduled
run so new advisories against unchanged dependencies are caught. Consider Dependabot
or Renovate for ongoing bumps.

| CX | Op. eff. | Advice acc. | Caseworker | Fraud | Complexity *(inv.)* | Strategic |
|----|----------|-------------|------------|-------|---------------------|-----------|
| 1 | 3 | 1 | 1 | 3 | 5 | 3 |

*Rationale:* a security-hygiene baseline with low complexity (5) — it is a dependency
bump and a CI step. Modest fraud/security value (3), strategic because supply-chain
hygiene is table stakes for a government service going to assessment.

**Bucket:** Quick Win (1 sprint).
**Dependencies:** none; extends the existing CI pipeline.
**Risks:** an `audit`-fails-build gate can block unrelated work on a transitive
advisory with no fix available — allow a reviewed, time-boxed waiver path.

---

### 3.8 Document-upload content inspection — beyond extension-only

**Current state.** The Document Service simulates ClamAV, but the upload filter is
**extension-only**: it does not do deep content/MIME sniffing. A file renamed to a
permitted extension would pass the filter on its name alone.

**Proposal.** Add magic-byte / MIME sniffing so the declared extension is validated
against the actual content, reject on mismatch, and (for the live path) integrate a
real malware scanner in place of the ClamAV simulation. Keep the limits and the
rejection messaging user-friendly.

| CX | Op. eff. | Advice acc. | Caseworker | Fraud | Complexity *(inv.)* | Strategic |
|----|----------|-------------|------------|-------|---------------------|-----------|
| 2 | 2 | 1 | 2 | 4 | 4 | 3 |

*Rationale:* a solid integrity/fraud control (4) that closes a real "rename the file"
gap, at low complexity (4) because content-sniffing is a well-trodden library-level
change. Limited CX/productivity impact.

**Bucket:** Near-Term (2–4).
**Dependencies:** a content-type sniffing library; a real scanner for the live path.
**Risks:** over-strict sniffing can reject legitimate files (e.g. valid PDFs with
unusual headers) — tune against a representative corpus.

---

### 3.9 Security hardening follow-ons from the Phase 2 fixes

**Current state.** The five Phase 2 findings (A1 notification IDOR, A2 unscoped
payment routes, A3 anonymous application write not capability-gated, A4 audit-log
pollution, A5 unsanitised markdown → `dangerouslySetInnerHTML`) are **all implemented
with regression tests**. The baseline is strong: HS256 pinned-alg JWT, bcrypt-12 with
timing equalisation, real TOTP (no pre-MFA token), logout revocation, default-deny
gate, parameterised SQL, strict Helmet CSP (`default-src 'none'`), scoped
rate-limiting, no committed secrets. The *next tier* of residual risks is the honest
backlog beyond those fixes.

**Proposal.** Three follow-ons:
1. **Org isolation** — delivered by §3.4 (listed here for completeness; it is the top
   residual security item).
2. **Token storage** — session and capability tokens currently live in browser
   storage (localStorage/sessionStorage), XSS-exfiltratable in principle though
   mitigated by the CSP and the A5 fix. Evaluate HttpOnly, SameSite cookies for
   session tokens so they are not reachable from JavaScript.
3. **CSRF posture** — once any token moves to a cookie, add explicit CSRF defences
   (the current JSON-only API and strict CSP reduce but do not formalise this).

| CX | Op. eff. | Advice acc. | Caseworker | Fraud | Complexity *(inv.)* | Strategic |
|----|----------|-------------|------------|-------|---------------------|-----------|
| 1 | 2 | 1 | 1 | 5 | 2 | 4 |

*Rationale:* top-tier fraud/integrity value (5), but moving token storage to cookies
is cross-cutting (the frontend `apiClient` and the apply-journey retry path both read
the token today) and forces the CSRF work, so complexity is meaningful (2).

**Bucket:** Medium (5–10).
**Dependencies:** token-storage change couples to the real-IdP work (§3.3); CSRF
depends on the cookie decision.
**Risks:** changing token storage can break the anonymous apply journey's
capability-token flow — regression-test the A3 scenarios carefully.

---

### 3.10 OpenAPI artefact + contract tests (additional)

**Current state.** The service exposes **~120 Express endpoints**, and the `.NET 9`
backend offers endpoint parity on a **curated subset** (17 business + 3 metadata
endpoints, 16 MediatR handlers — curated-subset parity, not full parity). There is no
single machine-readable API description that both backends are proven against.

**Proposal.** Publish an OpenAPI document as a first-class artefact and add contract
tests that run it against **both** the Express and .NET backends in CI. This turns
"dual backend with parity" from an assertion into a continuously-verified property and
gives consumers a real SDK/spec surface.

| CX | Op. eff. | Advice acc. | Caseworker | Fraud | Complexity *(inv.)* | Strategic |
|----|----------|-------------|------------|-------|---------------------|-----------|
| 1 | 3 | 1 | 1 | 2 | 3 | 5 |

*Rationale:* high strategic value (5) — an API-first artefact is what makes IAAS
reusable and makes the dual-backend claim defensible. Moderate complexity because the
spec must be authored and both backends wired into contract tests.

**Bucket:** Near-Term (2–4).
**Dependencies:** agreement on the canonical endpoint set; both backends in CI.
**Risks:** a spec that drifts from the code is worse than none — generate or test it
from the code rather than maintaining it by hand.

---

### 3.11 Observability & metrics (additional)

**Current state.** There is an immutable audit event log (Audit Service) and a
background SLA worker that walks live cases and fires deadline reminders + audit
events off the same `@aib-iaas/statutory` engine the case screen and queue use, so
all three agree by construction. What is not yet present is operational
observability — structured logs, metrics and traces for running the service.

**Proposal.** Add structured logging, request metrics (latency, error rates per
service/route) and health/readiness signals suitable for the deployed consolidated
container, surfaced through the existing admin monitoring pages where sensible. This
underpins the pilot success criteria and incident response that the docs already
anticipate.

| CX | Op. eff. | Advice acc. | Caseworker | Fraud | Complexity *(inv.)* | Strategic |
|----|----------|-------------|------------|-------|---------------------|-----------|
| 1 | 5 | 1 | 2 | 2 | 3 | 4 |

*Rationale:* top operational-efficiency item (5) — you cannot run a real service you
cannot see. Moderate complexity; strategic because it is a precondition for a
supported pilot.

**Bucket:** Medium (5–10).
**Dependencies:** a decision on the metrics/log sink (depends on the production
hosting beyond Render's free tier).
**Risks:** logs must not capture personal data in production — enforce redaction given
the service handles debtor financial data in the live path.

---

### 3.12 Accessibility re-audit (additional)

**Current state.** The frontend follows GOV.UK Design System patterns and there is a
WCAG accessibility audit in the docs (`docs/wcag-accessibility-audit.md`). As the UI
grows (recommendation traceability §3.5, consolidated admin §3.6), an accessibility
regression is a live risk, and a government service will face a formal GDS
accessibility assessment.

**Proposal.** Re-run a WCAG 2.2 AA audit against the current UI, fix findings, and add
automated accessibility checks (e.g. axe) to the frontend test suite so regressions
are caught in CI — the frontend already has 327 tests across 13 files to extend.

| CX | Op. eff. | Advice acc. | Caseworker | Fraud | Complexity *(inv.)* | Strategic |
|----|----------|-------------|------------|-------|---------------------|-----------|
| 5 | 1 | 1 | 2 | 1 | 4 | 4 |

*Rationale:* direct, significant CX value (5) and a hard requirement for a government
service, at low complexity (4) because the tooling is mature and a prior audit exists
to build on.

**Bucket:** Near-Term (2–4).
**Dependencies:** none blocking; best done after the UI-heavy items (§3.5, §3.6) land
so the audit reflects the final surface.
**Risks:** automated checks catch only a subset of WCAG — pair them with a manual pass.

---

## 4. Sequenced roadmap

The ordering below favours **finishing proven seams and closing integrity gaps first**
(low risk, high certainty, unblock everything else), then **maturing capabilities**,
then the **strategic external-dependency items** that need procurement and
agreements.

| # | Recommendation | Bucket | Suggested order | Key dependencies |
|---|----------------|--------|-----------------|------------------|
| 3.2 | PostgreSQL index parity | Quick Win | 1 | None — self-contained |
| 3.7 | Dependency hygiene in CI | Quick Win | 2 | None — extends CI |
| 3.5 | Recommendation traceability + override (incr. 1–2) | Near-Term | 3 | Audit service (present) |
| 3.8 | Document content inspection | Near-Term | 4 | Sniffing library |
| 3.12 | Accessibility re-audit | Near-Term | 5 | Best after §3.5/§3.6 UI lands |
| 3.6 | Admin-portal consolidation | Near-Term | 6 | Canonical-app decision; informs §3.4 |
| 3.10 | OpenAPI artefact + contract tests | Near-Term | 7 | Both backends in CI |
| 3.4 | Org-boundary RBAC | Medium | 8 | Org hierarchy; token org claim |
| 3.9 | Security hardening (token storage, CSRF) | Medium | 9 | Couples to §3.3; includes §3.4 |
| 3.11 | Observability & metrics | Medium | 10 | Production hosting decision |
| 3.3 | Real IdP federation (GAP-007) | Medium → Strategic | 11 | RP registration; §3.9 alongside |
| 3.5 | Recommendation confidence calibration | Medium | 12 | Real outcome data |
| 3.1 | Finish `INTEGRATION_MODE=live` | Strategic | 13 | External APIs, data-sharing agreements |

**Dependency notes.**
- §3.4 (org RBAC) is the hinge: it is both the top security residual *and* a
  precondition for §3.6 (which admin pages are org-scoped) and for IAAS as a
  multi-tenant platform. Do it before the strategic items but after the quick wins
  that de-risk the codebase.
- §3.9 (token storage / CSRF) and §3.3 (real IdP) should be scheduled together — moving
  tokens to cookies is cleanest to do once, alongside the real identity provider.
- §3.1 (live integrations) is last by *effort and external dependency*, not by value.
  Its value is the highest in the set; it is sequenced late only because the external
  agreements gate it. Start the procurement/agreement conversations early, in parallel
  with the near-term engineering.

---

## 5. Strategic framing — why this positions IAAS as a reusable AiB platform

IAAS is not a single-service application that happens to be well-built. The
architecture choices visible in this repository are **platform** choices, and the
recommendations above are the path to realising that platform:

- **Shared services, not a monolith.** Twelve logical bounded contexts
  (recommendation, document, integration orchestration, payment, audit, credit check,
  organisation, user, notification, identity, plus the gateway) each own their domain.
  New AiB journeys can reuse these services rather than rebuilding auth, audit, or
  document handling. The consolidation into one deployed container is a *hosting*
  decision for the POC's free tier, not an architectural one — the seams are real.

- **API-first and verifiable.** ~120 endpoints behind a BFF gateway, with the OpenAPI
  artefact (§3.10) turning the API into a contract that consumers and the second
  backend are tested against. This is what lets other AiB services — or external
  intermediaries — build on IAAS.

- **Dual-backend proof.** The .NET 9 implementation with curated-subset parity (17
  business + 3 metadata endpoints, 16 MediatR handlers) demonstrates that the API
  surface is genuinely implementation-independent. That de-risks any future
  technology decision and proves the contract is the product, not the framework.

- **Statute-backed, auditable advice.** The recommendation engine is a deterministic
  cascade whose thresholds come from the `@aib-iaas/statutory` package, producing
  structured `reasoning[]` and `factors[]`, with the same statutory engine driving the
  case screen, the queue, and the SLA worker so they agree by construction. Adding
  traceability and override capture (§3.5) makes the advice defensible to an auditor —
  the difference between a demo and a service AiB can stand behind.

- **Security built to be finished, not bolted on.** A shared default-deny gate that
  both deployment shapes install (so they cannot drift), a capability-token design that
  closed IDOR without forcing login into the anonymous journey, and five findings
  already closed with regression tests. The residual items (§3.4, §3.9) are a known,
  honest backlog with the patterns to close them already in the codebase.

- **Finishing seams, not re-architecture.** `INTEGRATION_MODE=live` throws *by design*
  behind a test-covered factory; the OIDC mock IdP already speaks RS256/JWKS/PKCE
  exactly as a real IdP will. The gap between POC and production is a backlog of
  finishing work on proven seams — which is precisely why these recommendations are
  low-risk to commit to.

The honest POC caveats remain: synthetic data throughout, `live` integration mode
unimplemented, identity federation still mocked, org isolation partial, and PG index
drift. This document names every one of them. The strategic point is that none of them
require starting over — IAAS has already earned the right to be finished.

---

*Scores are relative judgements to aid sequencing. Buckets express effort, not value —
the highest-value item (live integrations) is also the largest. All figures trace to
the verified baseline (2026-10-19, DOCUMENTATION_GAP_ANALYSIS.md §2) and the file:line references given above.*
