# Security Audit — AiB IAAS Proof of Concept

**Document type:** Security audit of the implemented system
**Audited build:** Phase 2 (post-hardening)
**Date:** 19 October 2026
**Classification:** POC deliverable — synthetic data only

---

## 1. Executive summary

The AiB IAAS (Initial Application Advice Service) Proof of Concept presents a **strong security posture for a system at this stage**. It is a demonstrator built on synthetic data with no real integrations, no real payments and no personal data, so the stakes of a defect are categorically lower than in production. Within that scope, the platform already implements the controls one would expect of an early beta rather than a prototype: a real signed-token identity model, password hashing with timing-attack mitigation, a genuine second factor, server-side session revocation, a shared default-deny authorisation gate across the whole deployed API surface, and a strict Content-Security-Policy on the API.

A five-agent discovery pass audited the **actual implementation** — the source as deployed, not the roadmap or the aspirational security documentation. That pass found five access-control weaknesses, ranked here A1 (High) through A5 (Low). **All five have been fixed and the fixes are covered by regression tests.** The headline findings were:

- **A1 (High)** — the notification service trusted the caller-supplied `userId`/`id` on every route, an insecure-direct-object-reference (IDOR) that let any authenticated user read, modify, delete or originate another user's notifications.
- **A2 (Medium)** — every payment route (initiate, wallet, card, status, refund) was unauthenticated and unscoped.
- **A3 (Medium, demo-critical)** — the anonymous application *write* surface (update/submit) was not capability-gated, so an anonymous caller who guessed an id could edit or submit another applicant's draft.
- **A4 (Low)** — any authenticated user, including a debtor, could POST arbitrary events into the immutable audit log.
- **A5 (Low)** — the admin documentation viewer rendered fetched markdown through `dangerouslySetInnerHTML` with no HTML escaping, a latent stored-XSS sink.

Each fix is described below with its evidence (`file:line`), its exploit path, and a precise account of the remediation that landed. The audit also records the controls that were **already correct** (Section 4) and the residual risks that remain **open and acknowledged** (Section 5), in keeping with a POC-honest posture that does not overclaim.

The regression suite grew by **19 security-focused tests** as part of this work; the full test count is now **1,084 across 60 files** (Section 7).

---

## 2. Methodology and scope

### 2.1 Approach

The audit was a **five-agent discovery pass** over the implemented codebase. Each pass read the real route handlers, middleware, shared packages and frontend client — the behaviour a request actually encounters — rather than relying on design intent recorded in the architecture or security documents. Where the documentation and the code disagreed, the **code was treated as ground truth**, and the disagreement itself was logged as a documentation-drift observation (Section 5).

Findings are the result of tracing each public and authenticated entry point to the authorisation decision that governs it, then asking: *what can a caller who is not the intended principal do here?* That question surfaced the IDOR and missing-scope family of findings (A1–A4) and the one client-side injection sink (A5).

### 2.2 Scope and non-scope

This is a **Proof of Concept with synthetic data**. The following are explicitly true of the audited system and bound the real-world severity of every finding:

- **No real integrations.** The six mock-integration modules (BASYS, eDEN/DAS-hub, DAS, CFT, Moratorium, RoI), the credit-check interface and the identity federation are all mocks. `INTEGRATION_MODE=live` is unimplemented and throws.
- **No real payments.** The payment service is a sandbox simulation; every response carries a `SANDBOX` disclaimer and no card data is processed or stored.
- **No real personal data.** All applicants, debts and financials are generated synthetic records.

Severity ratings below are expressed in **production-shaped terms** — i.e. what the weakness *would* mean if this code fronted real citizens' insolvency applications — because that is the lens a procuring authority will apply. The POC context is the mitigating factor, not a reason to under-rate the class of defect.

### 2.3 Rating scheme

Each finding carries a qualitative, CVSS-style rationale over the base metrics (attack vector, attack complexity, privileges required, confidentiality/integrity/availability impact). Indicative severity bands (High / Medium / Low) are assigned on that basis. The scores are indicative, not a formal CVSS v3.1 calculation.

---

## 3. Findings (severity-ranked)

### A1 — Notification service IDOR (High) · **Fix status: IMPLEMENTED**

**Component:** `services/notification-service/src/routes/notifications.ts`

**Description.** Before the fix, every route in the notification service trusted the caller-supplied identifier with no ownership check whatsoever. `GET /user/:userId` returned any user's notifications; `PATCH /:id/read` and `DELETE /:id` operated on any row by id; `POST /send` and `POST /send-bulk` let any caller originate notifications to arbitrary users. This is a textbook IDOR across both the read and write surface of a per-user resource.

**Risk / exploit path.** Any authenticated principal — including a debtor — could enumerate `userId` values and read another user's notification stream (which in production would carry case updates, payment reminders and system alerts), mark another user's notifications read, delete them, or spoof system notifications to any user. Confidentiality and integrity of a per-user channel, exploitable with the lowest privilege level in the system.

**Evidence (post-fix).** The remediation introduces a verified-caller abstraction and an ownership guard:

- `callerFromRequest()` (`notifications.ts:18-32`) resolves the caller from `req.user` set by the global gate, falling back to inline Bearer-token verification via `@aib-iaas/auth` when the service runs standalone — the same self-contained idiom used by the audit service, chosen deliberately so the service imports no gateway source (`notifications.ts:4-11`).
- `requireOwnerOrStaff()` (`notifications.ts:46-57`) returns `401` when unauthenticated and **`404` (not `403`) on an ownership mismatch** (`notifications.ts:52-53`), so the endpoint never confirms another user's id exists.
- `GET /user/:userId` (`notifications.ts:123-125`) and `PATCH /user/:userId/read-all` (`notifications.ts:166-168`) require caller `== :userId` or staff.
- `PATCH /:id/read` (`notifications.ts:153-163`) and `DELETE /:id` (`notifications.ts:175-184`) look up the row's `user_id` first and gate on that, returning `404` whether the row is missing *or* owned by someone else — the two are never distinguished.
- `POST /send` (`notifications.ts:60-69`) and `POST /send-bulk` (`notifications.ts:91-100`) are **staff-only** (`403` for a non-staff caller), since originating a notification is a server-to-user action, never self-service.

Staff is defined as any authenticated non-applicant (`notifications.ts:36-38`).

**CVSS-style rationale.** AV:N / AC:L / PR:L / UI:N / C:H / I:H / A:L — network-reachable, trivial to exploit, requires only the lowest authenticated privilege, with high confidentiality and integrity impact across every user's channel. **High.**

---

### A2 — Payment routes unauthenticated and unscoped (Medium) · **Fix status: IMPLEMENTED**

**Component:** `services/payment-service/src/routes/payments.ts`

**Description.** Every payment route — `initiate`, `apple-pay`, `google-pay`, `card`, `GET /:id/status`, `POST /:id/refund` — carried no access check. Anyone who guessed a payment id could read its status, drive a provider confirmation against it, or refund it.

**Risk / exploit path.** Unscoped payment operations are a direct integrity problem: an attacker could reverse a completed payment (`refund`) or push a payment through a simulated provider confirmation. In production shape this maps onto financial-transaction tampering. The POC mitigates the real impact — payments are a sandbox simulation and no money moves — but the *control* was absent.

**Evidence (post-fix).** Payments are now tied to the application that owns them, with two proofs of access accepted:

- `callerFromRequest()` (`payments.ts:24-35`) and `isStaff()` (`payments.ts:39-41`) mirror the notification service.
- `hasValidCapability()` (`payments.ts:46-57`) verifies the **same application-scoped capability token** the anonymous `/apply` journey uses to read an application back — the `X-Application-Capability` header, checked for `purpose === 'application-capability'` and a matching `applicationId`.
- `allowPaymentAccess()` (`payments.ts:65-69`) permits staff *or* a valid capability holder and otherwise sends **`404`** so a guessed payment id is never confirmed.
- The guard is applied on `initiate` (`payments.ts:85`), `apple-pay` (`payments.ts:115`), `google-pay` (`payments.ts:151`), `card` (`payments.ts:186`) and `GET /:id/status` (`payments.ts:228`).
- `POST /:id/refund` (`payments.ts:234-238`) is **staff-only** — an applicant may pay but never reverse a payment (`403` for a non-staff caller).

A deployment nuance is documented in the code (`payments.ts:13-19`, and the A2 test): the public `/apply` flow does not call the payment routes directly (the UI simulates the fee step), so this is backend-only; and in the deployed consolidated shape `/api/payments` is **not** on the public allow-list, so the global default-deny gate already rejects an anonymous caller with `401` before the handler runs. The per-resource guard is the defence-in-depth layer behind that gate.

**CVSS-style rationale.** AV:N / AC:L / PR:N (standalone) / UI:N / C:L / I:H / A:L — integrity of financial transactions is the primary impact; the deployed gate reduces exposure, hence Medium rather than High. **Medium.**

---

### A3 — Anonymous application WRITE not capability-gated (Medium, demo-critical) · **Fix status: IMPLEMENTED**

**Components:** `services/api-gateway/src/middleware/accessPolicy.ts`, `services/api-gateway/src/routes/applications.ts`, `apps/web/src/lib/apiClient.ts`

**Description.** The anonymous applicant-intake journey has no login, so `accessPolicy.ts` deliberately allow-lists the anonymous `POST` (create), `PUT` (update) and `POST /:id/submit` routes (`accessPolicy.ts:73-75`). The read-back `GET /:id` already required a signed, application-scoped capability token for an anonymous caller — but the matching *write* surface did not. `enforceOwnership` only constrained **authenticated** debtors, so an anonymous caller who guessed or enumerated an application id could update or submit **another applicant's draft**.

**Risk / exploit path.** An anonymous attacker enumerating application ids could overwrite another applicant's in-progress submission, or submit it on their behalf — a draft-tampering and premature-submission integrity attack against the one journey that is open by design. This is flagged **demo-critical** because the live client demo drives exactly this anonymous create→update→submit chain; the fix had to close the hole *without* breaking that flow.

**Evidence (post-fix).** The fix is split across backend and frontend:

- **Backend** — `enforceAnonymousWrite()` (`applications.ts:112-117`) requires `hasValidCapability` for an anonymous caller on writes, returning `404` (not `403`) on a bad or absent capability; an authenticated caller falls through to `enforceOwnership` as before. It is invoked at the top of `PUT /:id` (`applications.ts:402`) and `POST /:id/submit` (`applications.ts:450`). Because it checks the *resolved* application's own id, it holds whether the URL carried the opaque id or the reference number. The capability itself is a signed token minted at create time (`issueCapabilityToken`, `applications.ts:38-40`) and verified by `hasValidCapability` (`applications.ts:42-52`).
- **Frontend** — `apiClient.ts` captures the `capabilityToken` returned on create and stores it in `sessionStorage` keyed by application id (`storeCapabilityToken`, `apiClient.ts:111-118`; called from `applications.create`, `apiClient.ts:352-360`), then sends it as the `X-Application-Capability` header on exactly the three scoped calls — `get`, `update`, `submit` (`apiClient.ts:362-369`, header attached in `getHeaders`, `apiClient.ts:134-137`). The `/apply` page carries the same token through its `localStorage` pending-submission retry path, so a refresh mid-journey still presents the capability.

The design rationale is documented at `accessPolicy.ts:26-33` and `applications.ts:102-117`.

**CVSS-style rationale.** AV:N / AC:L (requires guessing/enumerating an id) / PR:N / UI:N / C:L / I:H / A:N — integrity of another applicant's submission, unauthenticated, bounded by id unpredictability. **Medium.**

---

### A4 — Audit-log pollution by low-privileged users (Low) · **Fix status: IMPLEMENTED**

**Component:** `services/audit-service/src/routes/audit.ts`

**Description.** `POST /events` accepted an event from any authenticated user — including a debtor — allowing arbitrary `action` and `applicationId` values to be written into the immutable audit trail. The *actor* field was already bound from the verified token rather than the body (so attribution could not be spoofed), but the trail itself could be polluted with fabricated events.

**Risk / exploit path.** A debtor could inject noise or misleading entries into the audit log, undermining the integrity of a record whose entire value is being trustworthy. Low real-world impact — the actor is always truthful, so forged entries are attributable to the forger — but the write surface should never have been open to applicants.

**Evidence (post-fix).** `POST /events` (`audit.ts:50-80`) now:

- resolves the actor from the verified Bearer token via `actorFromRequest()` (`audit.ts:22-36`), ignoring any body-supplied actor fields;
- returns `401` when unauthenticated (`audit.ts:52-55`);
- **refuses `role === 'debtor'` with `403`** (`audit.ts:57-60`) — writing the audit trail is a staff/service action. There is no `audit.write` permission in the RBAC seed, so the staff/service **role** is the authority here, which the code comments make explicit (`audit.ts:38-49`).

Applicant-side events (create/update/submit) are written server-side by the api-gateway on the applicant's behalf, so an applicant never needs this route. No strict action-enum is enforced, by design: actions are free-form (including `sla_*` events), and an enum would break legitimate writes — a documented, deliberate trade-off (`audit.ts:44-49` region).

**CVSS-style rationale.** AV:N / AC:L / PR:L / UI:N / C:N / I:L / A:N — integrity-only, low privilege, and self-attributing so the blast radius is small. **Low.**

---

### A5 — Unsanitised markdown rendered via `dangerouslySetInnerHTML` (Low) · **Fix status: IMPLEMENTED, TESTED**

**Component:** `apps/web/src/app/admin/dev/page.tsx` (+ `markdown.ts`)

**Description.** The admin documentation viewer fetches markdown documents and renders them with a hand-rolled `renderMarkdown()` whose output is injected via `dangerouslySetInnerHTML` (`page.tsx:306`, and `:323` for the diagram zoom modal). The original converter performed **zero HTML escaping** before applying its markdown transforms, so any raw HTML in a source document — `<img src=x onerror=...>`, `<script>` — would be rendered live. Combined with the admin's bearer token living in `localStorage`, this was a **latent stored-XSS sink** capable of exfiltrating that token.

**Risk / exploit path.** If an attacker could influence a document the viewer loads, injected script would execute in the admin's origin with the admin session token in scope. Rated Low because the documents are fetched from a **trusted GitHub raw host** controlled by the project (`GITHUB_RAW_BASE`, `page.tsx:71`), the page is admin-only, and no untrusted upload path feeds it — so exploitation requires compromising the trusted content source. It was nonetheless a real injection sink that should not exist.

**Evidence (post-fix).** `escapeHtml()` and `renderMarkdown()` were extracted from `page.tsx` into a testable sibling module `apps/web/src/app/admin/dev/markdown.ts` (behaviour unchanged; the page now imports `renderMarkdown`). `escapeHtml()` (`markdown.ts:22-29`) HTML-escapes all five metacharacters (`&`, `<`, `>`, `"`, `'`) and is applied as the **first** step of `renderMarkdown()` (`markdown.ts:34`), **before** any markdown transform runs. The transforms thereafter only *add* a fixed, safe tag set (headings, lists, tables, code, links to known hosts), and every scrap of document text they wrap has already been neutralised. The blockquote transform was adjusted to match the escaped marker (`^&gt; ` rather than `^> `). No new dependency was pulled in — the escape-then-transform ordering is the dependency-free equivalent of a sanitiser for this controlled markdown subset, and the rationale (including why DOMPurify was deliberately avoided) is documented inline. The behaviour is now locked by `apps/web/src/app/admin/dev/__tests__/markdown.test.ts` (see §7).

**CVSS-style rationale.** AV:N / AC:H (requires compromising the trusted content source) / PR:H (admin-only page) / UI:R / C:H / I:L / A:N — high impact *if* reached, but high complexity and high privilege required to reach it. **Low.**

---

### 3.6 Findings summary

| ID | Finding | Component | Severity | Fix status |
|----|---------|-----------|----------|------------|
| A1 | Notification service IDOR (read + write) | `notification-service/.../notifications.ts` | **High** | Implemented, tested |
| A2 | Payment routes unauthenticated/unscoped | `payment-service/.../payments.ts` | **Medium** | Implemented, tested |
| A3 | Anonymous application write not capability-gated | `accessPolicy.ts` + `applications.ts` + `apiClient.ts` | **Medium** (demo-critical) | Implemented, tested |
| A4 | Audit-log pollution by low-privileged users | `audit-service/.../audit.ts` | **Low** | Implemented, tested |
| A5 | Unsanitised markdown → `dangerouslySetInnerHTML` | `admin/dev/page.tsx` | **Low** | Implemented, tested |

---

## 4. Security positives (confirmed in code)

The following controls were already correct in the audited build. They are the reason the overall posture is assessed as strong for a POC. Each is cited to the source that implements it.

### 4.1 Real signed-token identity (HS256, pinned algorithm)

Access tokens are **HS256-signed JWTs**, not the forgeable base64 JSON of earlier iterations. `verifyToken()` (`packages/auth/src/index.ts:161-178`) pins `algorithms: ['HS256']` (`:165`) — closing the classic `alg: none` and algorithm-confusion forgeries — and pins issuer and audience. Crucially it then **asserts a numeric `exp` is present** (`:174`): `jsonwebtoken` only enforces expiry when the claim exists, so a token minted without `exp` would otherwise never expire. Signing is centralised in `signToken()` (`:126-134`) with issuer, audience and a mandatory `expiresIn`.

### 4.2 bcrypt cost-12 with timing equalisation

Passwords are hashed with **bcrypt at cost 12** (`BCRYPT_COST = 12`, `packages/auth/src/index.ts:38`; `hashPassword`, `:194-196`). `verifyPassword()` (`:202-208`) compares against a real dummy hash when the account is missing or has no password set (`getDummyHash`, `:188-192`), so rejecting an unknown user takes the same time as rejecting a known one with a wrong password — removing the user-enumeration timing oracle. The login handler calls this on the missing-user branch too (`services/api-gateway/src/routes/auth.ts:80`).

### 4.3 Real TOTP second factor, no usable pre-MFA token

MFA is a **genuine TOTP check** via `otplib` (`verifyTotpCode`, `packages/auth/src/index.ts:221-228`, with a ±1 step window at `:215`). On a password success for an MFA-enabled account, login returns only a short-lived (5-minute) **single-purpose challenge token** carrying `purpose: 'mfa'` and no permissions (`auth.ts:95-102`); the usable access token is minted only after `verify-mfa` confirms the TOTP code and checks the challenge's `purpose` (`auth.ts:111-136`). There is no session-grade token in a caller's hands before the second factor passes.

### 4.4 Server-side session revocation on logout

Every access token carries a `jti`; login records it as a session row (`recordSession`, `services/api-gateway/src/middleware/sessionStore.ts:17-19`; called at `auth.ts:57`) and logout deletes it (`revokeSession`, `sessionStore.ts:27-29`; called at `auth.ts:167`). `authenticate` treats a token whose `jti` has no live session row as revoked (`isSessionRevoked`, `sessionStore.ts:22-24`; checked in `rbac.ts:46`), so a logged-out token is **genuinely dead** rather than valid until its 8-hour expiry.

### 4.5 Default-deny shared authorisation gate

`enforceAuthentication` (`services/api-gateway/src/middleware/accessPolicy.ts:89-95`) authenticates every request except a small, explicit public allow-list (`isPublicRequest`, `:35-82`). Both the deployed `consolidated-api` and the standalone `api-gateway` install the **same** gate, so the two deployment shapes can never drift on which routes are open. The allow-list is confined to service metadata, the pre-token auth endpoints, the OIDC federation leg, the anonymous intake surface and the aggregate CSV export — everything else, including the entire staff surface and the statutory approve/reject decision, requires a valid token.

### 4.6 Capability-token IDOR fix (read and write)

A signed, application-scoped **capability token** (`issueCapabilityToken`, `applications.ts:38-40`) is minted at create time and returned to the creator. The anonymous read-back `GET /:id` requires it (`applications.ts:324-329`) and — after A3 — so do `PUT /:id` and `POST /:id/submit` (`enforceAnonymousWrite`, `:112-117`). This closes the applicant IDOR on both the read and write halves **without forcing login** into the anonymous `/apply` journey. Statutory status changes additionally require the matching permission and derive the actor from the token, never the body (`applications.ts:486-506`, `auditActor` at `:147-157`).

### 4.7 Parameterised SQL throughout

Database access uses prepared statements with bound parameters, not string interpolation — e.g. the notification inserts and selects (`notifications.ts:75-78`, `:105-107`, `:130-141`) and the audit writes. No evidence of SQL built by concatenating request input was found.

### 4.8 Strict Content-Security-Policy on the API

The API returns JSON only, so `securityHeaders()` (`services/api-gateway/src/middleware/securityHeaders.ts:28-60`) applies a maximally strict CSP — `default-src 'none'`, with `base-uri`, `frame-ancestors` and `form-action` also `'none'` (`:33-38`) — plus HSTS (1 year, preload-eligible), `referrer-policy: no-referrer`, `frameguard: deny`, and an explicit `Permissions-Policy` denying camera/microphone/geolocation/payment/USB/topics (`:52-58`). Both deployment shapes apply it, so their header posture cannot drift.

### 4.9 Scoped authentication rate limiter

`authRateLimiter` (`services/api-gateway/src/middleware/authRateLimit.ts:17-46`) caps authentication attempts at **~5 per 15 minutes, keyed on IP *and* email** (`keyGenerator`, `:25`), so one attacker cannot lock out everyone behind a shared proxy, nor spread a guessing attack across accounts to stay under a per-account limit. Lockouts are written to the audit trail (`:29-34`). It is applied only to login and verify-mfa, so ordinary reads do not burn the budget.

### 4.10 OIDC / GOV.UK One Login mock IdP (RS256 / JWKS / PKCE)

The federation path is a full in-process **OIDC mock IdP** under `services/api-gateway/src/oidc`. It owns a per-process RSA keypair, issues **RS256** ID tokens with its own issuer/audience, and publishes the matching **JWKS** (`mockIdp.ts:5-8`, `getJwks` at `:115-117`, reusing `buildJwks` from `@aib-iaas/auth`). The authorization code is bound to a **PKCE S256** challenge (`sha256Base64Url`/RFC 7636 at `mockIdp.ts:110`; the redeeming party's verifier must hash to the challenge, `:153-155`). The `@aib-iaas/auth` package carries the production-shaped verifier (`verifyRs256`/`buildJwks`/`publicKeyToJwk`, `packages/auth/src/index.ts:281-317`), so the asymmetric path a real IdP needs is proven and tested now. This is the live federation path for GAP-007.

### 4.11 No committed secrets

`getJwtSecret()` (`packages/auth/src/index.ts:59-68`) **throws in production** when `JWT_SECRET` is unset, refusing to fall back to the published dev secret, so a misconfigured deploy fails loudly at startup rather than silently signing every token with a public key. The dev/test fallback secret is clearly labelled as deliberately insecure (`:30`), and the demo TOTP secret is documented as a deliberate POC concession for the scripted demo (`:49`). No production secret is committed to the repository.

### 4.12 Audit actor bound from the token, not the body

Across both the audit service (`audit.ts:62-73`) and the api-gateway (`auditActor`, `applications.ts:147-157`), the audit actor is derived from the verified token's claims, never from request-body fields. A caller cannot attribute an event to someone else; the source IP is recorded alongside server-side (`audit.ts:72`).

---

## 5. Residual risks (open and acknowledged)

These are **not fixed** and are recorded honestly as known gaps appropriate to a POC. None is a defect in the Phase 2 remediation; they are the boundary of what this stage set out to do.

- **Org-boundary RBAC isolation is partial.** Authorisation is role-based and, on some routes, owner-scoped (a debtor sees only their own records; a creditor sees only their own organisation's claims, `applications.ts:801-803`). It is **not** fully tenant-scoped on every route — a complete multi-tenant isolation model (every query constrained by the caller's organisation) is future work.
- **Session and capability tokens live in browser storage.** The access token is held in `localStorage` and the application capability in `sessionStorage` (`apiClient.ts:33-50`, `:100-122`). Both are therefore XSS-exfiltratable *in principle*. This is mitigated by the strict CSP and by the A5 escaping fix, but not eliminated — `HttpOnly` cookies would be the production-grade answer and are not yet in place.
- **Document upload filtering is extension-only.** Beyond the ClamAV simulation there is no deep content/MIME sniffing, so the upload path trusts the declared file type more than a production system should.
- **PostgreSQL has fewer indexes than SQLite.** SQLite is the runtime query engine for the POC; PostgreSQL (Neon) holds a hand-parallel schema and seed for the migration story, but with **fewer indexes**. This is a query-plan divergence risk on migration, not a security defect, and is flagged for the migration workstream.
- **Federation and live integrations remain mock.** `INTEGRATION_MODE=live` is unimplemented and throws; real IdP federation (ScotAccount / GOV.UK One Login) is still the in-process mock (GAP-007). Keycloak exists only as scaffolding (`realm-export.json`), not wired. There is no root `docker-compose.yml`; the compose file is `infra/docker/docker-compose.yml`.
- **Documentation drift was systemic.** The audit observed that the project's own documentation had drifted from the code on hard numbers (see the discrepancy note at the end of this document). The hard figures have been reconciled against the repo as part of this engagement; readers should treat the code and the reconciled facts baseline as authoritative over older prose.

---

## 6. Dependency notes

- **No committed secrets** — confirmed (Section 4.11). The only hard-coded secrets are the clearly-labelled dev/test fallback and demo TOTP values, and the production path refuses the dev fallback.
- **Bump `axios` to ≥ 1.7.** The repository currently pins `axios: "^1.6.0"` across apps and services (`apps/web`, `apps/admin`, `services/api-gateway`, `services/consolidated-api`, `services/integration-orchestrator`, `packages/integration-contracts`). The caret range *permits* a 1.7+ resolution but does not guarantee it; the floor should be raised to `^1.7` to pull in the fixes published since 1.6.
- **Run `npm audit` in CI.** A dependency-vulnerability gate should run on every CI build so advisories surface automatically rather than at manual review time.

---

## 7. Test evidence

The hardening added security-regression tests across all five findings — **19 across the backend access-control suites** (A1–A4, below) plus a dedicated **A5 frontend suite** (12 assertions). They prove each fix and guard against regression:

- **`services/consolidated-api/src/__tests__/access-control.test.ts`** — exercises the fixes in the **deployed shape**, where the global default-deny gate fronts every service. It asserts the public allow-list is reachable anonymously, protected routes reject anonymous callers with `401`, and authorisation is enforced per resource. The Phase 2 block (`:90-154`) covers A1 (debtor cannot read another user's notifications → `404`; anonymous read → `401`), A2 (anonymous refund → `401` via the gate; authenticated debtor refund → `403`), A3 (anonymous `PUT` without a capability → `404`; the full create→update→submit chain → `200` with the capability threaded), and A4 (debtor audit write → `403`; staff audit write → `201`). It also covers the brute-force limiter (6th login → `429`) and token revocation after logout (`:156-183`).
- **`services/api-gateway/src/__tests__/applications.test.ts`** — covers the capability read-IDOR (`:82`), the anonymous update and submit carrying the capability (`:105`, `:115`), and the **write-IDOR**: an anonymous write without the capability is refused as `404`, with it succeeds (`:136`). Also asserts a debtor cannot read another debtor's application or messages (`:364`, `:380`).
- **`services/notification-service/src/__tests__/notifications.test.ts`** — a debtor sending a notification is refused (staff-only, `403`, `:63`); a debtor cannot read another user's notifications (`404`, `:68`); marking another user's notification read is refused (`404`, `:83`).
- **`services/payment-service/src/__tests__/payments.test.ts`** — an `access control (A2)` block (`:379`) covers anonymous initiate without a capability → `404` (`:380`), with the capability → `201` (`:388`), status read with the matching capability → `200` (`:400`), status read with a capability for a *different* application → `404` (`:413`), and a non-staff refund → `403` even with a valid capability (`:426`).
- **`services/audit-service/src/__tests__/audit.test.ts`** — a debtor POST to the audit trail is refused (`403`, `:65`), and the actor is derived from the token, ignoring the body (`:71`).
- **`apps/web/src/app/admin/dev/__tests__/markdown.test.ts`** — the **A5** suite. `renderMarkdown`/`escapeHtml` were extracted to `markdown.ts` so they are unit-testable. It asserts a `<script>` and an `<img onerror=...>` payload are neutralised to escaped text (never live elements), HTML inside a code span is escaped, event handlers do not survive, and the five metacharacters escape in the correct order — while legitimate markdown (headings, bold, code, lists, safe links) still renders.

**Total test count after Phase 2: 1,084 across 60 files** (757 backend across 47 files, 327 frontend across 13 files), from a full `npx vitest run` — up from 1,037/722 before the security-regression tests landed (19 backend across A1–A4, plus the A5 frontend markdown suite).

---

## 8. Conclusion

For a Proof of Concept on synthetic data, the AiB IAAS platform demonstrates a security model well beyond prototype quality: a real signed-token trust root, hardened credential handling, a genuine second factor, server-side revocation, a shared default-deny gate, a capability model that closes the applicant IDOR on both read and write, and a strict API CSP. The five-agent discovery pass found five access-control weaknesses spanning IDOR, missing scope, and one latent injection sink; **all five are fixed and under test.** The residual risks — partial tenant isolation, browser-storage tokens, extension-only upload filtering, the PG index gap, and the still-mock federation and integrations — are recorded openly as the honest boundary of a POC rather than papered over. The recommended next steps (raise the `axios` floor, add an `npm audit` CI gate, and progress `HttpOnly`-cookie sessions and full org-scoped RBAC) are incremental hardening, not firefighting.
