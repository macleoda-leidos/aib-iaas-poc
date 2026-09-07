# Security Known Gaps — Findings Register

## AiB IAAS — Initial Application Advice Service

---

## Document Control

| Field | Value |
|-------|-------|
| System | IAAS — Initial Application Advice Service |
| Document Type | Known-gaps register (security findings) |
| Review Type | Internal static code review (source-based, whole-repository) |
| Review Date | 24 August 2026 |
| Reviewer | Leidos Delivery (internal) |
| Classification | OFFICIAL-SENSITIVE |
| Version | 1.0 |
| Status | CURRENT |
| Supersedes | The "no critical or high-severity vulnerabilities" conclusion in docs/ithc-penetration-test-report.md v1.0 |
| Distribution | AiB Digital Services, AiB Information Security, Leidos Delivery |

---

## Purpose and Status

This register records security findings identified by internal static review of the IAAS
proof-of-concept source code. It is the authoritative statement of what the POC codebase
does today, and it takes precedence over control descriptions in the design documents
(`docs/authority-to-operate.md`, `docs/security.md`,
`docs/ithc-penetration-test-report.md`, `docs/gds-service-assessment.md`) wherever the two
disagree.

**No real personal data is exposed by any finding in this register.** The POC operates
exclusively on synthetic seed data. There is no live debtor, creditor, or adviser data in
any deployed environment, and no integration with a production AiB system carries real
records. The confidentiality impact of every finding below is therefore currently
theoretical.

**Every finding marked "Blocks production: Yes" must be closed before any environment
holds real debtor data.** The findings are not defects in a live service; they are the
distance between a demonstration build and a service that could be trusted with
OFFICIAL-SENSITIVE information. Several of them (unsigned tokens, absent authentication,
password-free login) are individually sufficient to permit full unauthorised access to
whatever data the system holds, and they compound: an attacker needs only one of them.

### Scope of Review

- **In scope:** All TypeScript/JavaScript source under `apps/`, `services/`, and
  `packages/`; deployment configuration (`render.yaml`, `infra/`); CI workflows
  (`.github/workflows/`).
- **Method:** Manual source reading and repository-wide symbol/dependency tracing. No
  dynamic testing, no exploitation against a running instance.
- **Deployment target:** `services/consolidated-api` is the service built and deployed per
  `render.yaml`. Findings are assessed against that service, since code that is not
  deployed cannot be a compensating control for code that is.

### Severity Definitions

| Severity | Definition |
|----------|------------|
| Critical | Permits complete authentication or authorisation bypass, or full unauthorised data access, with no privileged starting position. Would be an immediate incident in an environment holding real data. |
| High | Permits significant unauthorised access, integrity loss, or defeats a control the security case relies upon, possibly requiring some precondition. |
| Medium | Weakens a control materially but does not by itself yield unauthorised access to data. |
| Low | Hygiene, defence-in-depth, or dead-code issue with limited direct exploitability. |

### Findings Summary

| Ref | Title | Severity | Blocks Production | Status |
|-----|-------|----------|-------------------|--------|
| GAP-001 | Authentication tokens are unsigned base64 JSON — forgeable | Critical | Yes | **Closed** — Ed25519-signed JWTs, verified on every request |
| GAP-002 | Deployed service applies no authentication or authorisation to any route | Critical | Yes | **Closed** — every route carrying personal data now requires an authenticated caller |
| GAP-003 | Login accepts any password; passwords are never verified | Critical | Yes | Open — **one of two remaining Criticals, with GAP-025** |
| GAP-004 | Malware scanning is fail-open and filename-based in deployment | High | Yes | Open |
| GAP-005 | Insecure direct object reference on all application routes, including approve/reject | High | Yes | **Closed** — ownership enforced, and no longer bypassable by staying anonymous |
| GAP-006 | Audit events are unauthenticated and attacker-attributable | High | Yes | **Closed** — router authenticated; actor derived from the verified token |
| GAP-007 | No multi-factor authentication implemented | High | Yes | Open |
| GAP-008 | No brute-force protection or account lockout on login | Medium | Yes | Open |
| GAP-009 | Schema validation package is dead code with no importers | Medium | Yes | Partial — wired into the application routes; other services' routes still unvalidated |
| GAP-010 | Session tokens are not invalidated server-side on logout | Low | No | **Closed** — sessions validated per request; logout revokes immediately |
| GAP-011 | Role-permission grants were defined three times and the copies disagreed | Medium | Yes | Partial — seeding and vocabulary fixed; modelling gaps open |

Counts for **this table only** (the original 24–25 August review): 3 Critical, 4 High, 3 Medium,
1 Low. Ten of eleven findings block production. **Five are closed (GAP-001, GAP-002, GAP-005,
GAP-006, GAP-010), two partial (GAP-009, GAP-011) and four fully open (GAP-003, GAP-004, GAP-007,
GAP-008)**, all four of which block production.

Fourteen further findings (GAP-012 to GAP-025) were added on 4 September and are tabled in the next
section. See **Register status** below that table for the roll-up across all 25.

**GAP-002 is closed, and closing it is what made the others real.** Ownership checks,
per-request authorisation and body validation were all in place and all skippable by simply
not authenticating — worse than no control, because a reader of the code would conclude the
control existed. Every route carrying personal data now refuses an anonymous caller.

This was a **product decision, not only a security fix**, and it was taken deliberately: the
dashboard and case pages were viewable by anonymous visitors and now are not. The public site
sends an unauthenticated visitor to log in. `/api/health`, `/api/postcode` and the mock
integrations remain public.

**GAP-003 is one of the two remaining Criticals**, and it is the other half of the identity story:
any password authenticates any seeded account, so identity is unforgeable and revocable but still
not *proven*. Everything above rests on it.

The second is **GAP-025** (added 4 September): MFA is verified in the browser and the access token
is issued *before* the code is checked, so the second factor is skippable by anyone who does not
run the client's JavaScript. The two compound — a password that is never checked and a second
factor that can be bypassed mean the identity underpinning every ownership and permission control
in this register can still be assumed by anyone who knows an email address. Closing either one
alone leaves that true.

GAP-011 was added on 25 August 2026 and is not part of the original 24 August review. Its
seeding and vocabulary defects are fixed; the modelling gaps recorded under "Residual work"
remain open and gate the correct closure of GAP-002.

### Findings added on 4 September 2026 by a full multi-agent audit

Seven parallel read-only audits (backend/security, frontend/accessibility, AI, data, infrastructure,
testing, documentation) reviewed the codebase after the Sprint 31–34 work. They found the following,
none of which was in this register. **GAP-012 is more severe than anything previously recorded** and
would have voided the whole of GAP-001's remediation.

| Ref | Title | Severity | Status |
|-----|-------|----------|--------|
| GAP-012 | Unauthenticated account creation with an attacker-chosen role yields a *legitimate* admin session | **Critical** | **Closed** |
| GAP-013 | `PUT /api/applications/:id` accepted an arbitrary `status`, letting a debtor approve their own case | High | **Closed** |
| GAP-014 | `sessions` stored whole bearer tokens in plaintext | High | **Closed** |
| GAP-015 | Database TLS certificate verification was disabled | High | **Closed** |
| GAP-016 | Moratorium protection stated as 6 weeks; the statutory period is 6 months | High | **Closed** |
| GAP-017 | Notification endpoints expose and mutate any user's correspondence, unauthenticated | High | **Closed** — see below |
| GAP-018 | Credit-check consent endpoint is a no-op; result cache is keyed on identity and shared across applications | High | **Closed** |
| GAP-019 | Deployed uploads, notification and credit-check stores write off the persistent disk | High | **Closed** |
| GAP-020 | `/api/health` cannot fail, so Render never restarts a broken instance | Critical (operability) | **Closed** |
| GAP-021 | No structured logging, correlation ID, tracing or metrics in the deployed artefact | Critical (operability) | **Closed** |
| GAP-022 | Every text input in the citizen journey is programmatically unlabelled (WCAG 1.3.1, 3.3.2, 4.1.2) | Critical (legal — PSBAR 2018) | **Closed** |
| GAP-023 | A debt-solution recommendation is fabricated client-side when the API fails | Critical | **Closed** |
| GAP-024 | The .NET engine reproduces the withdrawn £1,500 MAP floor and inverts MAP/PTD precedence | Critical | **Closed** |
| GAP-025 | MFA is client-side only and the token is issued *before* it | Critical | **Open** |

### Register status

25 findings recorded. **18 Closed, 2 Partial, 5 Open.**

| Status | Refs |
|---|---|
| Closed | GAP-001, 002, 005, 006, 010, 012, 013, 014, 015, 016, 017, 018, 019, 020, 021, 022, 023, 024 |
| Partial | GAP-009 (validation wired into the application routes only), GAP-011 (seeding and vocabulary fixed; modelling gaps open) |
| Open | GAP-003, 004, 007, 008, 025 |

The two remaining **Critical** findings are both about authentication, and they compound:
**GAP-003** (login accepts any password) and **GAP-025** (MFA is client-side, and the token is
issued before the code is checked). Together they mean the identity every other control in this
register now depends on can still be assumed by anyone who knows an email address. Nothing else
outstanding is above High.

**GAP-025 is the only one of the 4 September findings still open, and it is deliberate scope, not
an oversight.**
MFA is verified in the browser and the access token is issued *before* the code is checked, so
the second factor can be skipped entirely by anyone who does not run the client's JavaScript.
It was not in the batch of work that closed GAP-017 through GAP-024 and remains the highest
outstanding item, alongside GAP-003 (passwords are never verified).

#### GAP-017 — the half that authentication did not close

The row above previously read "Closed — router authenticated, reads scoped to the caller, limit
clamped", which was true and was not the whole finding. Three defects survived it, and all three
were only reachable *because* the router now had authenticated callers to reason about:

- **`PATCH /:id/read` and `DELETE /:id` took an id and checked nothing.** Any authenticated
  user — a debtor included — could mark read, or **destroy**, any other user's case
  correspondence. The same IDOR class already closed on the read path, and the destructive one.
- **`PATCH /user/:userId/read-all` honoured the path parameter for everyone**, so a debtor could
  clear another user's unread state and destroy the signal that they had never seen a case update.
- **`POST /send` and `/send-bulk` let any authenticated caller write an arbitrary subject and
  body to any userId, attributed to the service.** The file's own comment called this "a phishing
  primitive inside the product's own channel"; authentication did not remove it, it only required
  the sender to log in first.

Additionally there was not one `try` in the file. Every route called `better-sqlite3`
synchronously, so a `NOT NULL` violation on `subject` — reachable by posting `{}` — threw into
Express's default handler, which renders an HTML stack trace; and this service mounted no error
handler at all.

Now: ownership is enforced in the `WHERE` clause rather than by a check-then-act pair, so "not
mine" and "does not exist" are the same zero-row result and answer 404 rather than 403 (the
endpoint is not an existence oracle). Sending requires a new `notifications.send` permission,
added by migration `002-notifications-send-permission` and granted to the four casework roles
only. Bulk sends are capped at 500 recipients. Covered by
`services/notification-service/src/__tests__/notificationOwnership.test.ts` (27 cases), every one
asserting across the boundary between two *different* debtors — a test with one debtor cannot
tell "scoped to me" from "scoped to nobody", which is how the original suite passed over an
unscoped DELETE.

#### GAP-018 — a receipt for a record that did not exist

`POST /api/credit-check/consent` destructured the body, minted a `uuid()`, and returned 201 with
`recordedAt`, an `expiresAt` 90 days out and the note "Consent recorded for audit purposes". It
executed no write. There was no `consents` table. `POST /run` separately set
`consentRecorded: true` on every response having recorded nothing.

UK GDPR Art. 7(1) requires the controller to be able to *demonstrate* consent. This is worse than
returning 501, because the receipt is exactly what an audit or a subject access request would have
relied on — it made the absence of a record look like the presence of one.

The cache was the second half, and the more consequential one. The key was
`${nationalInsuranceNumber || lastName}-${dateOfBirth}` on a 24-hour TTL, read before any provider
call:

1. **It crossed applications.** A second, separate application for the same person returned the
   cached result, so the new consent was never exercised against the provider. One consent
   silently authorised every check for a day.
2. **The `lastName` fallback collided people.** NI number is optional on this form, so two
   different applicants sharing a surname and date of birth received each other's credit data.
   MacDonald plus a shared DOB is a realistic collision in a Scottish caseload.
3. **It put an NI number in a primary-key index on disk in plaintext.**

Now: a `consents` table (`packages/database/src/repositories/consents.ts`, migration
`003-consents`) with `expires_at` enforced by `findLive()`, withdrawal modelled as a timestamp
rather than a deletion — "they withdrew on 3 March" is itself demonstrable-consent evidence — and
an explicit `consentGiven: false` in a request body overriding any stored consent, because
consent is withdrawable at any time under Art. 7(3) and the applicant's present "no" outranks a
stored "yes". The cache is keyed on `applicationId` plus a SHA-256 of the identity tuple, with a
1-hour TTL: its purpose is "do not bill the provider twice for a double-click", not "remember this
person for a day". 25 cases in
`services/credit-check-service/src/__tests__/consent.test.ts`, all asserting against what came
back out of the database rather than against the write's own 201.

#### GAP-019 — three of four stores were never on the disk

`render.yaml` mounts a 1 GB disk at `/data` and set only `DATABASE_PATH`. The other three stores
fell back to relative paths, and `Dockerfile.service` sets `WORKDIR` to
`/app/services/${SERVICE_NAME}` — so `./uploads` resolved to
`/app/services/consolidated-api/uploads` and the mount was never touched at all:

| Store | Default | Location |
|---|---|---|
| Document uploads | `./uploads` | `services/document-service/src/routes/documents.ts` |
| Notifications | `./data/notifications.db` | `services/notification-service/src/db.ts` |
| Credit-check cache | `./data/credit-check-cache.db` | `services/credit-check-service/src/providers/cache.ts` |

On the free plan the container spins down after 15 minutes idle, so every uploaded bank statement,
payslip and identity document and all case correspondence was destroyed several times a day. Worse
than a clean loss: the `documents` rows live in `iaas.db` on the disk while the files they point at
did not, so the case list kept offering downloads that 404'd — a dangling reference that reads as
an application bug.

Now: all four paths set in `render.yaml`, the Bicep template and Docker Compose;
`resolveStorePath()` logs an error at boot if any store path is relative under
`NODE_ENV=production` rather than silently relocating (a relative path works perfectly until the
first restart, which is why it must be loud); and `/api/health/ready` writes and deletes a probe
file in `UPLOAD_PATH`, because `fs.access(W_OK)` passes on a read-only bind mount whose permission
bits look right. `SCANNER_MODE` is now stated explicitly too — it defaulted to `auto`, and what
that resolved to in a container with no ClamAV was left to chance.

#### GAP-020 — liveness and readiness are different questions

Both deployed health endpoints were static object literals, and `render.yaml` names
`/api/health` as `healthCheckPath` for both services. So the platform's only signal was "the
process is listening": a container whose database was unreachable and which was answering 500 to
every real request was indistinguishable from a working one, and was never restarted.
`services/dotnet-api/Program.cs` even swallows a database-init failure with the comment "so
/api/health stays reachable" — correct for liveness, and precisely the problem.

The fix is *not* to make `/api/health` fail. On the free plan a failing health check fails the
deploy, and a Neon instance waking from idle takes several seconds — so a database-probing
liveness endpoint would turn a cold start into a failed deployment, most likely while a demo was
starting. Instead:

- `/api/health` stays cheap, always-200, and remains the platform probe.
- `/api/health/ready` probes the shared driver (`SELECT 1`, reporting dialect and latency), the
  notification store, the credit-check cache (optional — a cold cache costs a provider call, not
  a case) and whether `UPLOAD_PATH` is genuinely writable. 200 when all pass, 503 with
  per-dependency detail otherwise. Unauthenticated so an external prober can reach it, which is
  why it returns no stack trace and no connection string, and every check has a 3-second ceiling
  so an unroutable host cannot make the endpoint the outage it exists to report.

CI now curls both after starting the container, not just `/api/health`.

#### GAP-021 — the request id that only existed in development

`crypto.randomUUID()` was assigned to `req.headers['x-request-id']` in
`services/api-gateway/src/index.ts` and nowhere else. Three things were wrong, and the third is
the one that mattered: it mutated the *request* so nothing downstream saw it; nothing read it; and
it was mounted on the api-gateway **app**, which the deployed artefact does not use —
`services/consolidated-api` imports the *routers*. So the deployed container had no correlation id
at all. The whole of the logging was `console.error('[API Error]', err.message)`, and
`/admin/monitoring` was a 112-line hard-coded array with invented uptime figures ("98.2%",
"12s ago").

Now `packages/observability` (zero dependencies — the platform already ingests stdout JSON, so
what was missing was a shape, not a transport):

- `logger.ts` — one JSON line per event, with a name-based redaction list applied in the
  serialiser rather than at each call site, so it covers the call sites nobody has written yet.
  `nationalInsuranceNumber`, `dateOfBirth`, `postcode`, `authorization` and others never reach the
  log. Silent under `NODE_ENV=test`, because a great many suites assert 4xx by design.
- `requestId.ts` — honours an inbound `x-request-id` so a trace survives the browser → API hop,
  but length-caps and character-filters it first: it goes into a log aggregator and a response
  header, and an unfiltered attacker-controlled string in either is a log injection primitive.
- `requestLogger.ts` — logs the route *pattern* (`/api/applications/:id`), never the resolved URL,
  which carries application ids. `unmatched` for a 404 rather than substituting the path.
- `errorHandler.ts` — replaces two divergent copies. The deployed one returned `err.message` with
  **no `NODE_ENV` guard**, so a SQLite constraint message naming tables and columns reached the
  browser in production; the api-gateway copy guarded it correctly, which is the argument against
  having two. Several services mounted none at all.
- `metrics.ts` — Prometheus exposition at `/api/metrics`, guarded on `system.admin` because
  per-route volumes and error rates are reconnaissance. Per-process and resets on restart, which
  is stated in the file rather than implied.

The middleware is mounted in `consolidated-api` **and** in each of the twelve services, and
`services/consolidated-api/src/__tests__/observabilityParity.test.ts` fails if any of the thirteen
Express apps is missing it, if `requestId` is not first, or if `errorHandler` is not last. That
mount-point-versus-router divergence has now caused four defects in this codebase; the test exists
so it stops causing them.

#### GAP-022 — a journey a screen reader could not describe

`Input` in `apps/web/src/app/apply/page.tsx` rendered `<label>` with no `htmlFor` and `<input>`
with no `id`, and seven `<select>` elements had sibling labels with no association. Nothing tied
any of them together, so a screen reader announced "edit text, blank" for the applicant's name,
date of birth, National Insurance number, every address, every creditor and every figure. Errors
were plain `<p>` with no `aria-describedby`, `aria-invalid` or `role="alert"`, so someone
submitting an invalid form was told nothing. The alias fields had only `placeholder`, which is not
an accessible name and disappears on typing. The delete buttons were bare "✕" glyphs.

Two further failures found while fixing it: the document-upload drop zone was a `<div onClick>`
wrapping a `display: none` file input, so neither element was reachable and the upload step could
not be operated by keyboard at all (2.1.1, 4.1.2).

`packages/ui-components/src/GovInput.tsx` already did all of this correctly and was imported by
nothing. It was not swapped in wholesale — it has no `data-demo` support and different Tailwind
classes, so it would have changed the journey's visual design and broken the demo script. The two
now share a contract; only the styling differs.

The controls moved to `apps/web/src/app/apply/fields.tsx`, because Next.js App Router permits only
`default`, `metadata` and a fixed set of route config keys as exports from a route file — a
component defined in a `page.tsx` cannot be imported by a test. `useId()` rather than deriving ids
from label text, because four creditors legitimately share "Outstanding amount (£)" and duplicate
ids associate the last label with every input — a defect that looks fixed and is not. 25 cases in
`apps/web/src/app/apply/__tests__/applyAccessibility.test.tsx`, using `getByLabelText` throughout
because it resolves through the accessibility tree and so fails where `getByText` would pass.

#### GAP-023 — advice the system invented

There were **three** fabrication sites in `RecommendationSection`, not one, all rendering as
though they were engine output:

1. The `catch` returned a complete response — `product: 'debt_arrangement_scheme'`,
   `confidence: 'high'`, hard-coded reasoning prose, and three factor weights (0.3, 0.25, 0.15)
   that no engine ever produced — and set `received: true`, so the journey advanced.
   `console.warn` was the only trace.
2. The result heading read `{result ? PRODUCT_LABELS[result.product] : 'Debt Arrangement Scheme
   (DAS)'}`, so a null result still displayed a product.
3. The confidence line read `{result?.confidence || 'High'}`.

All three chose DAS, which is not a neutral default: it is a repayment programme, so the
fabricated answer specifically told people who cannot afford to repay that they should. An
applicant whose figures point to MAP, to sequestration or to signposting was told DAS was their
best route, with high confidence.

The same class sat in the system-check step and was worse, because it fed the engine. A failed
BASYS/eDEN/DAS/CFT/Moratorium/RoI check was recorded as `status: 'clear'` with an invented
response time — telling the applicant they had no existing case when a register was merely
unreachable — and `calculateRecommendation` reads `existingCases` from exactly those results, so a
cosmetic fallback became a false negative in statutory advice. A failed credit check became a
hard-coded score of 620; a *different* hard-coded 520 appeared in the render fallback, so the
system disagreed with itself about a fictional applicant. And when there were no results at all,
the page rendered six hard-coded "✓ Clear" badges for six statutory registers none of which had
been contacted.

Now: `withOneRetry` distinguishes a cold start from an outage (Render spins an idle container down
after 15 minutes, which is what the fallback was really covering for); persistent failure renders
an explicit panel naming no product, with `received` left false so the journey cannot advance on a
non-answer; failed checks read `unavailable`, visually distinct from `clear`, with a banner saying
the search was incomplete; and the deliberate offline demo mode is kept but every result it
produces is labelled `simulated`. That last distinction is the whole of the fix — the branch was
always a legitimate feature, and what made it a defect was being indistinguishable from a real
check.

`apps/web/src/app/apply/__tests__/recommendationHonesty.test.tsx` asserts the negative: with the
engine unreachable, **no product name appears anywhere in the rendered output**. Asserting only
that an error is shown would still pass if a product were rendered beside it.

#### GAP-024 — two backends, two different statutory answers

`services/dotnet-api/Features/Recommendations/Commands.cs` diverged from
`services/recommendation-service/src/engine/rules.ts` in four ways:

1. `if (r.TotalDebt < 1500) return signposting_advice` — the £1,500 MAP minimum, which
   **SSI 2023/9 reg. 2 removed on 6 February 2023** with nothing prescribed in its place. DAS never
   had a monetary minimum at all (reg. 21(1) permits a programme for "one or more debts"). So the
   .NET service turned a £900 debtor away from every statutory route while the Node service routed
   the same applicant to a Debt Payment Programme.
2. PTD was evaluated **before** MAP, so a debtor with minimal assets and no ability to pay was
   routed to a trust deed rather than the cheaper, simpler process they qualified for.
3. DAS required `disposable > 100`. A £1–£100 surplus then matched no branch at all — too much for
   MAP, not enough for DAS — and fell to the generic default.
4. A single `bool ExistingCaseFound` meant any hit in any register produced signposting, including
   a case discharged years ago.

Every figure was a bare literal. There was no C# equivalent of `packages/statutory`, no .NET test
project, and no `dotnet` step in CI — so this code had never been executed by anything but a person
clicking through the demo.

Now: `services/dotnet-api/Domain/Statutory/Thresholds.cs` mirrors the Node package structurally,
carrying `Value`, `Citation`, `AmendedBy` and `EffectiveFrom`, with `Map.MinDebt` modelled
explicitly as `null` because "no minimum" is a deliberate policy position that third-party
summaries still get wrong. The handler follows the Node branch order exactly, and
`RecommendationRules.IsLiveCaseStatus` ports the eight-marker vocabulary test.

The parity mechanism matters more than the port: `tests/fixtures/recommendation-cases.json` is read
by **both** suites — `services/recommendation-service/src/__tests__/engineParity.test.ts` (vitest)
and `tests/dotnet/IAAS.Api.Tests/RecommendationParityTests.cs` (xunit, the repository's first .NET
test project). Two independently written test files would drift, which is how the divergence arose.
Verified by changing one expectation in the table and confirming both suites go red. A `dotnet-test`
job now runs in CI.

#### GAP-012 — the chain, and why signing tokens did not stop it

Verified end to end against a running instance before and after the fix:

1. `GET /api/roles` — unauthenticated, returned every `roleId` including `role-sysadmin`.
2. `POST /api/users` with `{"roleId":"role-sysadmin"}` — unauthenticated, created an `active` account.
3. `POST /api/users/auth/login` with any password — returned a **genuinely signed** Ed25519 token
   carrying all 20 permissions, which then opened the one guarded route (200).

`PUT /api/users/:id` was the same defect against an existing account: an unauthenticated request
demoted the seeded officer to `debtor` and deactivated them.

The reason this matters more than a forged token: **nothing was forged.** GAP-001's remediation makes
tokens unforgeable, and that is worth nothing when the service will issue a real one for an account an
anonymous caller just created at whatever privilege they asked for. An audit trail would show a real
account acting, indistinguishable from staff.

**Fixed** by moving the Express guards into `@aib-iaas/auth` (`createAuthGuards`, injected per service)
and applying `authenticate` plus an explicit `requirePermission` **on the router** rather than at the
mount point — the divergence described below is exactly why a mount-point guard is not enough. Also
added: a role-escalation check (`canAssignRole`) refusing any role above the caller's own level, on
create, update and deactivate; and an unknown `roleId` now returns 403 rather than a 500 from a foreign
key. 8 regression tests in `services/user-service/src/__tests__/routes.test.ts`.

**One regression this introduced and its fix**, recorded because the shape recurs: `/api/users/auth` is
mounted *under* `/api/users`, and Express matches mount prefixes in registration order — so router-level
`authenticate` on `usersRouter` made login itself return 401 and locked everyone out. The consolidated
API now mounts the auth router first, with a test asserting login still works.

#### GAP-013 — ownership cannot catch the owner

`PATCH /:id/status` refuses debtors and enforces `validTransitions`. `PUT /:id` enforced neither and
forwarded the whole body, so `status` reached the repository. A debtor who *owns* a draft is precisely
who the ownership check is designed to admit, so GAP-005's work could not catch this: they could
`PUT {"status":"approved"}` and decide their own sequestration.

**Fixed** by withholding `status`, `assignedTo` and `submittedAt` from the mapped update unless a caller
explicitly opts in (`MappingOptions.allowLifecycleFields`, off by default). Creation can no longer be
born `approved` either. 5 tests, including one asserting the applicant's own answers still save on the
same request — so the fix cannot have gone too far and silently broken the journey's auto-save.

#### GAP-014 — the session table was a credential store

`sessions.token` held the entire bearer token. Any read of that table — a backup, a read replica, a
debug `SELECT *`, an operator with database access — was immediate session hijack for every logged-in
user, for the token's full eight-hour life, with no cracking step. `jwt.ts` had always specified the
right design: *"Callers must check the `jti` against stored sessions."*

**Fixed**: the column now holds the token's `jti` — a random UUID that identifies a session without
being usable as one. Revocation and logout are unaffected; 3 tests, including one asserting a forged
token carrying a *real* `jti` is still rejected, since the signature is checked first.

#### GAP-015 — encrypted but unauthenticated

`pg-connection.ts` rewrote a caller-supplied `sslmode=require` down to `sslmode=no-verify` and set
`rejectUnauthorized: false`. Anyone on the path to the database could present their own certificate and
read or rewrite every query — the queries carrying NI numbers, addresses, debts and income (CWE-295).

**Fixed**: the connection string is passed through unmodified and verification is on. `DATABASE_CA_CERT`
supplies an explicit root where a provider needs one; `DATABASE_SSL_INSECURE=true` exists for a local
self-signed proxy and **throws in production** rather than being quietly honoured. Pool idle and
connect timeouts added at the same time, so a suspended Neon instance no longer leaves requests hanging
on a dead socket.

#### GAP-016 — advice that was wrong in the direction that harms

`ai-mock.ts` told a debtor a moratorium gives "6 weeks of legal protection". The Coronavirus (Recovery
and Reform) (Scotland) Act 2022 s.23(2)(a) substituted **six months** into s.198(1)(b)(i) on 1 October
2022, and `packages/statutory/src/clocks.ts` has it right — the user-facing explanation did not. Wrong
by a factor of four, in the direction that pressures someone in distress to decide faster than the law
requires. Two further unsourced claims removed at the same time: a "4 year" Protected Trust Deed term
(no statutory basis) and sequestration "lasts for one year" (discharge is 12 months, but a contribution
order runs 48 — s.91(2)(a) — so payments can continue three years past discharge).

#### A defect the audit found in the test suite, not the code

`tests/integration/recommendation-flow.test.ts` declared its **own 85-line copy** of the recommendation
engine and asserted against the copy, so it could never fail for a product reason — and the copy had
frozen the £1,500 MAP floor that SSI 2023/9 removed. A green, named test specifying a withdrawn
statutory threshold is worse than no test: it is an argument against fixing it. Replaced with an import
of the real engine, plus assertions that a sub-£1,500 debtor is not turned away.

Fixing it immediately surfaced a genuine defect the copy had masked: existing-case detection matched
only `caseStatus.includes('Active')`, so a live case reported by an upstream system as `Open`,
`Current`, `In Progress` or `application_in_progress` — a value the DAS mock contract itself declares —
fell through and the debtor was recommended a *second* statutory product while already inside one. Now
matched against a list of live-case markers, case-insensitively, with 7 parametrised tests.

### A finding the original review did not separate out

The GAP-002 write-up describes deployed routes as unauthenticated in general terms. The specific
form was worse than it reads: `api-gateway/src/index.ts` had *always* guarded `/api/reports` with
`authenticate + requirePermission('reports.read')`, but `services/consolidated-api/src/index.ts`
— the only artefact that deploys — mounted the same router with no middleware at all. So the sole
authorised route in the repository was authorised in the standalone service that nobody runs and
unauthorised everywhere it actually served traffic.

The lesson generalises beyond this one route: the consolidation layer re-mounts routers by hand,
so any middleware applied in a service's own `index.ts` is invisible to deployment unless it is
repeated there. Closing GAP-002 properly means the guard cannot live in two places that can
disagree — it belongs on the router, or in a table both entry points read.

---

## Critical Findings

### GAP-001: Authentication Tokens Are Unsigned Base64 JSON — Forgeable

| Attribute | Detail |
|-----------|--------|
| **Severity** | Critical |
| **CWE** | CWE-345 — Insufficient Verification of Data Authenticity; CWE-347 — Improper Verification of Cryptographic Signature |
| **OWASP Category** | A07:2021 — Identification and Authentication Failures |
| **Blocks production** | **Yes** |

**Finding.** Session tokens are base64-encoded JSON with no cryptographic signature. They
are encoded, not signed; base64 is a transport encoding and provides no integrity
guarantee. Any party who can construct a JSON object can construct a valid token bearing
any identity, role, and permission set.

**Evidence.**

- `services/user-service/src/routes/auth.ts:37-46` mints the token:
  `Buffer.from(JSON.stringify({ userId, email, role, roleLevel, organisationId, permissions, exp })).toString('base64')`.
  No signing key, no HMAC, no asymmetric signature.
- `services/api-gateway/src/middleware/rbac.ts:31-49` consumes it:
  `JSON.parse(Buffer.from(token, 'base64').toString())`, then assigns `payload.role`,
  `payload.roleLevel`, and `payload.permissions` directly onto `req.user`. The decoded
  values are trusted verbatim; the only check performed is `payload.exp` against the
  current time (line 34).
- Repository-wide: no `jsonwebtoken` (or equivalent) dependency in any `package.json`
  under `apps/`, `services/`, or `packages/`; no `JWT_SECRET` or signing-key environment
  variable in `.env.example` or `render.yaml`; no signature verification call anywhere in
  the Node source.

**Exploit path.** No authenticated starting position is required.

1. Construct the payload:
   `{"userId":"any","email":"attacker@example.com","role":"system_admin","roleLevel":100,"permissions":["*"],"exp":<now + 8h in ms>}`
2. Base64-encode it.
3. Send it as `Authorization: Bearer <encoded>`.

The token is indistinguishable from one issued by the service, because issuance adds no
integrity material. `exp` is inside the attacker-controlled payload, so token lifetime is
also attacker-chosen. Where `roleLevel` gates access (`requireRoleLevel`,
`rbac.ts:117-134`) the attacker sets an arbitrarily high integer; where named permissions
gate access (`requirePermission`, `rbac.ts:64-87`) the attacker enumerates the required
strings from the 403 response body, which returns `details.required` (line 79).

**Required fix.**

1. Adopt signed tokens — RS256 or EdDSA via a maintained library (`jsonwebtoken`, `jose`)
   — with the signing key supplied by secret injection and never committed.
2. Verify the signature, `iss`, `aud`, and `exp` on every request before any claim is
   read. Reject on any verification failure; never fall through to trusting the payload.
3. Preferably delegate issuance entirely to the intended identity provider (see GAP-007)
   and verify against its published JWKS, so the application holds no signing key.
4. Add a negative test asserting that a token with a tampered `role` or `permissions`
   claim is rejected with 401.

**Status: closed.** Points 1, 2 and 4 are implemented. Point 3 remains the intended end
state and is tracked under GAP-007; until an IdP exists, the application holds its own key.

- `packages/auth/src/jwt.ts` issues and verifies EdDSA (Ed25519) JWTs. Ed25519 is native to
  Node's `crypto`, so this added **no dependency** — a consideration worth stating, since
  the recommendation above was to add one and the supply-chain cost of doing so to fix a
  security finding is real.
- The `alg` header is pinned to `EdDSA` and checked *before* verification is attempted, so
  neither `alg: none` nor HS256-signed-with-the-public-key is accepted. Both have explicit
  tests, as does a token signed by a foreign key and the legacy unsigned format itself.
- Keys come from `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` (PEM, or base64-wrapped PEM for
  dashboards that mangle newlines). When unset, an ephemeral keypair is generated **and a
  warning is logged**; the fallback never reverts to accepting unsigned tokens. Note the
  operational consequence: running the twelve services as separate processes requires the
  variables to be set, because each process would otherwise hold a different key.
- **Permissions were removed from the token entirely.** They were the most damaging claim to
  have forgeable, and carrying them made revocation impossible until expiry. Authorisation
  is now resolved per request from `role_permissions` (5-second cache), so a role change or
  revocation takes effect immediately — see GAP-010.
- Negative tests: `packages/auth/src/__tests__/jwt.test.ts` (32 cases, mostly forgery
  attempts) and `services/api-gateway/src/__tests__/rbac.test.ts` (31 cases), which assert
  a tampered role claim, a legacy unsigned token, and a valid token with no live session are
  each rejected with 401.

**Residual.** Password verification (GAP-003) is unchanged: any password is still accepted
for a seeded user, because no real hashes exist to check. Identity is now *unforgeable* but
still not *proven* — the two halves of stage 1, and only one is done.

---

### GAP-002: Deployed Service Applies No Authentication or Authorisation to Any Route

| Attribute | Detail |
|-----------|--------|
| **Severity** | Critical |
| **CWE** | CWE-306 — Missing Authentication for Critical Function; CWE-862 — Missing Authorization |
| **OWASP Category** | A01:2021 — Broken Access Control |
| **Blocks production** | **Yes** |

**Finding.** The service that is actually deployed applies no authentication middleware
and no permission check to any of its mounted routers. Every endpoint — applications,
documents, users, roles, organisations, payments, audit, credit checks, notifications,
identity — is reachable with no credential of any kind.

**Evidence.**

- `render.yaml:6-9` defines the deployed Node service `iaas-api`, built from
  `infra/azure/Dockerfile.api` with the repository root as context. The Express entry
  point for that image is `services/consolidated-api/src/index.ts`.
- `services/consolidated-api/src/index.ts:259-288` mounts 13 application routers plus the
  mock-integration routers. Each mount takes the form `app.use('/api/<path>', <router>)`
  with no middleware argument. Example: `app.use('/api/applications', applicationsRouter)`
  (line 259); `app.use('/api/users', usersRouter)` (line 273). The only middleware
  interposed on any mount is `latencyMiddleware` on the mock routes (lines 281-287), which
  is a latency simulator, not a security control.
- The RBAC middleware in `services/api-gateway/src/middleware/rbac.ts` is used in exactly
  one place repository-wide outside its own unit tests:
  `services/api-gateway/src/index.ts:48`
  (`app.use('/api/reports', authenticate, requirePermission('reports.view'), reportsRouter)`).
  That is a different service, and it is not the deployment target per `render.yaml`.

**Exploit path.** No credential and no token — forged or otherwise — is required.

```
GET  /api/applications          -> full application list
GET  /api/users                 -> full user list
PATCH /api/applications/:id/status -> approve or reject any case
```

A bare unauthenticated HTTP request suffices. Note the relationship to GAP-001: the forged
token there is only needed for the api-gateway service; against the deployed service, no
token is needed at all. The RBAC middleware, its permission matrix, and its unit tests
exist and are correct in isolation — they are simply not wired into the deployed request
path. This is why the review treats the middleware's existence as design intent rather
than as an implemented control.

**Required fix.**

1. Apply `authenticate` to every non-public router mount in
   `services/consolidated-api/src/index.ts`, and `requirePermission` / `requireRoleLevel`
   per the permission matrix in `docs/security.md` §4.
2. Default to deny: mount authentication globally ahead of the router table and opt
   specific paths out (health, and login itself), rather than opting each router in, so a
   newly added router is protected by default.
3. Add an integration test that asserts 401 for every mounted route when no
   `Authorization` header is present, so regression is caught in CI rather than review.
4. Reconcile the two services. Maintaining `api-gateway` and `consolidated-api` in
   parallel is what allowed the control to be present in one and absent in the deployed
   other.

---

### GAP-003: Login Accepts Any Password; Passwords Are Never Verified

| Attribute | Detail |
|-----------|--------|
| **Severity** | Critical |
| **CWE** | CWE-287 — Improper Authentication; CWE-521 — Weak Password Requirements |
| **OWASP Category** | A07:2021 — Identification and Authentication Failures |
| **Blocks production** | **Yes** |

**Finding.** Neither login implementation compares the submitted password against a stored
credential. Authentication succeeds on proof of a known email address alone. Any password
value, including an empty string, is accepted.

**Evidence.**

- `services/user-service/src/routes/auth.ts:9` destructures
  `const { email, password } = req.body`. The identifier `password` does not appear again
  anywhere in the file. The authentication decision at lines 19-22 is
  `if (!user || user.status !== 'active')` — existence and status only. Line 18 carries the
  comment `// POC: accept any password for seeded users with active status`, so the
  behaviour is deliberate and understood as a POC shortcut; it is nonetheless the deployed
  behaviour.
- `services/api-gateway/src/routes/auth.ts:27` short-circuits identically on user
  existence.
- The `password_hash` column is written on user creation but never read for comparison in
  any code path.
- No password-hashing dependency exists in the Node source: no `bcrypt`, `argon2`, or
  `scrypt` in any `package.json`, and no call to `crypto.scrypt`/`pbkdf2` for credential
  verification. The single repository reference to bcrypt is explanatory UI copy in
  `apps/web/src/app/admin/api-keys/page.tsx:230`.

**Exploit path.** Given any valid user's email address — obtainable from the
unauthenticated `GET /api/users` (GAP-002), or by guessing an institutional address format
— `POST /api/users/auth/login` with an arbitrary password returns a valid session token
and the full user object including role and permission list. Combined with GAP-001 the
attacker does not even need a real email, but with GAP-003 they do not need to forge
anything: the service issues a genuine token for the impersonated account.

**Required fix.**

1. Store passwords using a memory-hard KDF — Argon2id preferred, bcrypt (cost ≥ 12)
   acceptable — and verify on every login with a constant-time comparison.
2. Return the same generic failure message and a comparable response time whether the
   email is unknown or the password is wrong, to avoid account enumeration.
3. Reject authentication if `password_hash` is absent for a user rather than defaulting to
   success.
4. Preferably remove local password authentication altogether in favour of the federated
   identity provider (GAP-007), leaving no local credential path to get wrong.
5. Add tests asserting that a wrong password and an empty password both yield 401.

---

## High Findings

### GAP-004: Malware Scanning Is Fail-Open and Filename-Based in Deployment

| Attribute | Detail |
|-----------|--------|
| **Severity** | High |
| **CWE** | CWE-636 — Not Failing Securely ("Failing Open"); CWE-434 — Unrestricted Upload of File with Dangerous Type |
| **OWASP Category** | A04:2021 — Insecure Design |
| **Blocks production** | **Yes** |

**Finding.** The upload pipeline reports files as `clean` in two circumstances where no
malware scan has actually taken place. There is no ClamAV service in the deployment, so the
placeholder path is what runs.

**Evidence — fail-open layer 1 (scanner selection).**
`services/document-service/src/scanner/index.ts:29-46`: in the default `auto` mode, if
`clamav.isAvailable()` returns false the factory falls back to `PlaceholderScanner`
(lines 43-46) and logs the substitution. `PlaceholderScanner`
(`services/document-service/src/scanner/placeholder.ts:23-44`) determines infection from
the **filename**: `lowerName.includes('eicar') || lowerName.includes('virus') || lowerName.includes('malware')`
(line 32). It never reads file contents — `scanBuffer` discards its buffer argument
(line 19). It reports `scanned: true` (line 37), so downstream code cannot distinguish its
verdict from a real scan.

**Evidence — fail-open layer 2 (ClamAV error handling).**
`services/document-service/src/scanner/clamav.ts:152-178`: the socket `error` and `timeout`
handlers both `resolve({ scanned: false, infected: false, ... })` rather than rejecting.
`services/document-service/src/routes/documents.ts:118` then records
`doc.status = result.infected ? 'quarantined' : 'clean'` — it branches on `infected`
alone and never consults `scanned`. A connection failure or timeout is therefore recorded
as `clean`.

**Evidence — deployment.** `render.yaml` defines two services (`iaas-api`,
`iaas-dotnet-api`) and no ClamAV service; no `CLAMAV_HOST`/`CLAMAV_PORT` is set and
`SCANNER_MODE` is unset, so `auto` applies. The filename-based placeholder is the scanner
in the deployed environment.

**Exploit path.** Upload genuine malware named `payslip.pdf`. The placeholder finds none of
its three trigger substrings, returns `infected: false, scanned: true`, and the document is
recorded `clean` and retained. Conversely a harmless file named `virus-notes.pdf` is
quarantined, so the control is both permissive and inaccurate. Where ClamAV is configured
but unreachable, an attacker who can induce a timeout gets the same `clean` outcome.

Scope note: the extension allowlist and size limit (`documents.ts:26-36`) do hold and are
genuine controls, so the delivered file must carry an allowed extension. This constrains
but does not prevent the finding — a malicious `.docx` or `.pdf` is squarely within the
allowlist.

**Required fix.**

1. Deploy a real scanning engine and make it a hard dependency of the upload path.
2. Fail closed. Treat `scanned: false` as an error, never as a pass. Set status to
   `scan_failed`/`pending` and withhold the document from download until a scan succeeds.
3. Branch on `scanned` as well as `infected` at `documents.ts:118`, and record the scanner
   name and version alongside the verdict so a placeholder result is auditable.
4. Restrict `PlaceholderScanner` to explicit opt-in (`SCANNER_MODE=placeholder`) and refuse
   to start in a production `NODE_ENV` when it is selected. Remove the `auto` fallback.
5. Retain content-based EICAR detection for tests rather than filename matching.

---

### GAP-005: Insecure Direct Object Reference on All Application Routes, Including Approve/Reject

| Attribute | Detail |
|-----------|--------|
| **Severity** | High |
| **CWE** | CWE-639 — Authorization Bypass Through User-Controlled Key (IDOR) |
| **OWASP Category** | A01:2021 — Broken Access Control |
| **Blocks production** | **Yes** |

**Finding.** Every parameterised route on the applications router resolves the target
record from `req.params.id` alone, with no check that the caller owns the record or holds a
role permitting access to it. This includes the status-transition route that approves and
rejects cases.

**Evidence.** `services/api-gateway/src/routes/applications.ts`, handlers at lines 140
(`GET /:id`), 157 (`PUT /:id`), 202 (`POST /:id/submit`), 232
(`PATCH /:id/status`), and 309 (`POST /:id/notes`). Each looks the record up by identifier
and proceeds; none compares an owning user or organisation against the caller. There is no
ownership predicate in the router. The design intent is documented — `docs/security.md` §4
shows a "Resource-level constraint / User owns resource?" decision node in the
authorisation flowchart, and the permission matrix qualifies roles with "(own)" and
"(assigned)" — but no such constraint is implemented in code.

**Exploit path.** Since the deployed service requires no authentication at all (GAP-002),
enumerate or guess an application identifier and then:

- `GET /api/applications/<id>` — read another applicant's personal and financial data.
- `PATCH /api/applications/<id>/status` — approve or reject that case, a statutory
  decision, with the outcome attributed to whatever actor the request supplies (GAP-006).

Even with authentication restored, any authenticated user of any role would retain full
access to every other user's applications until ownership checks exist, so this finding
must be fixed independently of GAP-002 rather than being considered covered by it.

**Required fix.**

1. Scope every read and write by the caller's identity: filter list queries by owner, and
   on single-record fetches verify the record's owner (or assigned adviser, or
   organisation) against `req.user` before returning it.
2. Return 404 rather than 403 for records the caller may not see, to avoid confirming
   existence.
3. Gate `PATCH /:id/status` behind an explicit decision permission and require the caller
   to be an AiB officer role; record the authenticated actor from the verified token, not
   from the body.
4. Add tests asserting that user A cannot read, modify, or transition user B's application.

**Status: partial — points 1, 2 and 4 implemented for authenticated callers.**

There was no link between an application and a debtor *user* to check against:
`applications` had `assigned_to` (the member of staff) and `applicants` was a separate table
with no user reference. So the first part of the fix was a data-model change, not a code one.

- `applications.debtor_user_id` added to the SQLite schema, the PostgreSQL schema and the
  .NET EF model, nullable and referencing `users(id)`. Null means owned by nobody, so a
  debtor never matches it — the safe default for staff-created and anonymously-started cases.
- Ownership is enforced on read, update and submit via `ownsApplication`
  (`services/api-gateway/src/middleware/rbac.ts`). Refusals return **404, not 403**, so the
  endpoint cannot be used to enumerate which reference numbers exist (point 2).
- List queries are filtered by the owner taken **from the verified token**, not the query
  string, so the scope cannot be widened by naming another user or dropped by omitting the
  parameter. The reported total is scoped too, so it does not leak how many cases exist.
- `PATCH /:id/status` and `POST /:id/notes` refuse debtors outright. Ownership is the wrong
  test for a statutory decision — owning the case is precisely what must not grant it.
- Mass assignment closed: `debtorUserId` is stamped from the token on create and stripped
  from the update body, so a debtor cannot give their case away or claim an unowned one.
- 18 tests in `services/api-gateway/src/__tests__/applicationOwnership.test.ts`, using two
  distinct debtors and asserting across the boundary between them. A single-debtor test
  cannot distinguish "scoped to me" from "scoped to nobody", which is how this went unnoticed.

**Residual.** Point 3 is partly done: the route refuses debtors but is not yet behind an
explicit decision permission, and the audit actor still comes from the request body (GAP-006).
More importantly, **an anonymous caller remains unrestricted**, because no deployed
application route requires a token (GAP-002). The enforcement above is real for anyone who
identifies themselves and bypassable by anyone who does not. That is stated in the test suite
as a deliberate, asserted gap rather than left as an assumption.

---

### GAP-006: Audit Events Are Unauthenticated and Attacker-Attributable

| Attribute | Detail |
|-----------|--------|
| **Severity** | High |
| **CWE** | CWE-345 — Insufficient Verification of Data Authenticity; CWE-778 — Insufficient Logging |
| **OWASP Category** | A09:2021 — Security Logging and Monitoring Failures |
| **Blocks production** | **Yes** |

**Finding.** The audit event ingestion endpoint is unauthenticated and takes the actor
identity from the request body. The audit trail therefore records what a caller asserts
about itself, not what the system observed. It cannot support non-repudiation.

**Evidence.** `services/audit-service/src/routes/audit.ts:9` destructures
`applicationId, action, actor, actorId, actorName, actorType, details` from `req.body` and
persists those values (lines 14-16) with no cross-check against an authenticated principal.
The router is mounted at `services/consolidated-api/src/index.ts:270` with no middleware
(GAP-002), so `POST /api/audit/events` is open to anonymous callers.

**Exploit path.** An attacker may:

- **Forge entries** — post events attributing arbitrary actions to a named officer,
  fabricating an audit history that implicates a real member of staff.
- **Misattribute their own actions** — perform a real action via the unauthenticated API
  (GAP-005) while supplying another user's `actorId`/`actorName`.
- **Flood the trail** — bulk-post noise to bury genuine events, degrading any subsequent
  investigation.

This finding undermines the investigative value of every other control: after any incident,
the audit trail could not be relied upon to establish what happened or who did it. The
tamper-evidence measures described in `docs/security.md` §6 (append-only storage, hash
chaining) are target-state and not implemented; note that they would not fix this finding
in any case, since they protect records after writing and this finding concerns the
truthfulness of the record at the point of writing.

**Required fix.**

1. Require authentication on the audit ingestion route and derive `actorId`, `actorName`,
   and `actorType` exclusively from the verified token, ignoring any body-supplied actor
   fields.
2. Treat the endpoint as internal: restrict it to service-to-service calls with a
   dedicated credential and network restriction, not a public route.
3. Record server-observed context (source IP, correlation ID, server timestamp) rather than
   client-supplied equivalents.
4. Implement the append-only storage and hash chaining already described in the security
   architecture, and reconcile that document with the delivered state.

---

### GAP-007: No Multi-Factor Authentication Implemented

| Attribute | Detail |
|-----------|--------|
| **Severity** | High |
| **CWE** | CWE-308 — Use of Single-factor Authentication |
| **OWASP Category** | A07:2021 — Identification and Authentication Failures |
| **Blocks production** | **Yes** |

**Finding.** No second authentication factor is implemented or enforced anywhere in the
codebase, and there is no identity-provider integration to delegate it to. The design
documents describe Keycloak-enforced TOTP, SMS OTP, and WebAuthn as mandatory for all user
types; none of this exists in the Node source.

**Evidence.**

- No TOTP, WebAuthn/FIDO2, or OTP library appears in any `package.json`; no verification
  code for any second factor exists in the source.
- No Keycloak client, adapter, OIDC discovery, or JWKS retrieval exists in any service. The
  repository's Keycloak references are display copy in
  `apps/web/src/app/architecture/page.tsx:19,53` and mock response payloads in
  `services/identity-service/src/routes/federation.ts:36,90` (which synthesise a
  `keycloakId` string). No network call is ever made to an identity provider.
- The `mfa_enabled` column is written on user records but never read in any authentication
  decision.
- The login flow (`services/user-service/src/routes/auth.ts:7-74`) issues a session token
  immediately upon matching an email; there is no challenge step of any kind.
- The federated ScotAccount (SAML 2.0) and GOV.UK One Login (OIDC) paths described in
  `docs/security.md` §3 are mock endpoints returning synthetic responses, not federation.

**Exploit path.** A single stolen, phished, or guessed email address is sufficient for full
account takeover — with GAP-003, the password is not checked, so no credential theft is
even required. There is no second factor to interrupt the chain at any point.

**Required fix.**

1. Integrate a real identity provider and delegate authentication to it, verifying its
   signed tokens against published JWKS (this also closes GAP-001 and GAP-003).
2. Enforce MFA as an IdP policy for all roles; require phishing-resistant factors
   (WebAuthn/FIDO2 or TOTP) for privileged roles and disallow SMS-only for those roles, as
   `docs/security.md` §3 already specifies as the target.
3. Check `mfa_enabled` (or the IdP's `amr`/`acr` claim) in the authorisation decision, and
   deny privileged operations where the required assurance level was not met.
4. Until integration lands, keep the MFA claims in the design documents labelled as target
   state (see the status banners now carried by those documents).

---

## Medium Findings

### GAP-008: No Brute-Force Protection or Account Lockout on Login

| Attribute | Detail |
|-----------|--------|
| **Severity** | Medium |
| **CWE** | CWE-307 — Improper Restriction of Excessive Authentication Attempts |
| **OWASP Category** | A07:2021 — Identification and Authentication Failures |
| **Blocks production** | **Yes** |

**Finding.** There is no account lockout, no per-account attempt counter, no progressive
delay, and no CAPTCHA. Authentication endpoints are covered only by one global rate limit
shared with all other traffic.

**Evidence.** `services/consolidated-api/src/index.ts:73-98` configures a single
`express-rate-limit` instance: `windowMs: 15 * 60 * 1000`, `max: 500`, applied globally
with `/api/health` skipped. No stricter limiter is attached to any authentication route. No
failed-attempt counter or lockout state is persisted for any user. The
`docs/authority-to-operate.md` claim of "lockout after 5 failed attempts (30-minute
duration); progressive CAPTCHA" and the `docs/security.md` §10 claim of "lockout at 5,
alert at 3" have no implementation.

**Exploit path.** 500 requests per 15-minute window against a single account with no
lockout permits sustained credential guessing; a distributed source set removes even that
ceiling, since the limit is per-IP. The severity is held at Medium only because GAP-003
makes password guessing unnecessary — any password already works. **Closing GAP-003
without also closing this finding would elevate it to High**, as the login endpoint would
then become the primary attack surface it was always intended to be.

Note also that this global limiter is the control that ITHC finding VUL-002 (rate-limit
bypass via `X-Forwarded-For`) concerns. `trust proxy` is now set to `1`
(`services/consolidated-api/src/index.ts:71`), which addresses the original bypass for the
current single-proxy topology, but the absence of an authentication-specific limit is a
separate and unremediated gap.

**Required fix.**

1. Add a strict per-account and per-IP limiter on login and any credential-reset route
   (for example 5 attempts per 15 minutes per account), separate from the global limiter.
2. Implement temporary account lockout with exponential backoff, and emit an audit and
   alert event on lockout.
3. Add CAPTCHA or equivalent friction after a small number of failures.
4. Keep `trust proxy` matched to the actual proxy hop count; revisit if the topology
   changes.

---

### GAP-009: Schema Validation Package Is Dead Code with No Importers

| Attribute | Detail |
|-----------|--------|
| **Severity** | Medium |
| **CWE** | CWE-20 — Improper Input Validation |
| **OWASP Category** | A03:2021 — Injection (control claimed but absent) |
| **Blocks production** | **Yes** |

**Finding.** The `packages/validation` Zod schema package has no importers anywhere in the
repository outside its own unit tests. It is dead code. Route handlers read `req.body`
properties directly without schema validation.

**Evidence.** A repository-wide search for imports of the validation package across
`apps/`, `services/`, and `packages/` returns no consumers outside
`packages/validation`'s own tests. Handlers destructure request bodies without validating
them — for example `services/audit-service/src/routes/audit.ts:9` and
`services/user-service/src/routes/auth.ts:9`. The claims that Zod "validates all API
inputs" (`docs/authority-to-operate.md` §4.1), that data minimisation is "enforced at
schema level" (§5.6), and that A03 is mitigated by Zod (§6) are unsupported by the code.

**Impact.** This is the reason A03 could not be marked as mitigated on the strength of Zod.
The practical consequence is unvalidated type and range handling: absent, malformed, or
wrong-typed fields reach business logic and database calls, producing 500s from unhandled
type errors (compare ITHC finding VUL-003) and permitting out-of-range or overlong values
to be persisted.

**Injection is nonetheless not exploitable through this gap.** Every database query uses
`?` placeholders with all user values bound as parameters; dynamic `WHERE` fragments are
assembled only from hardcoded string literals selected by code-controlled branches, never
from user input. SQL injection was assessed as genuinely clean and remains so — that
control does not depend on Zod. React's automatic escaping likewise mitigates XSS
independently. The severity is Medium rather than High for this reason: the gap is a missing
defence-in-depth and data-quality control and a false assurance claim, not an open
injection vector.

**Required fix.**

1. Apply the existing schemas as validation middleware on every route that accepts a body,
   query, or path parameter, rejecting unknown fields (`.strict()`) by default.
2. Have handlers consume the parsed and typed output of validation rather than raw
   `req.body`.
3. Add a CI check (lint rule or import-graph assertion) that fails if a route handler reads
   `req.body` without a validator, so the package cannot silently fall out of use again.
4. Correct the A03 and data-minimisation claims in the security case until this is wired in
   — done in the current revision of those documents.

**Status: partial — points 1 and 2 done for the application routes.**

The package had a **mechanical** reason for being unimportable that the original finding did
not identify: `packages/validation/package.json` declared `"main": "./dist/index.js"`, and the
built `dist/index.js` imports `./schemas` without a file extension, which fails to resolve
under ESM. `require('@aib-iaas/validation')` therefore threw `ERR_MODULE_NOT_FOUND`. No amount
of intent would have wired these schemas in; the package could not be loaded at all. Fixed by
pointing `main`/`types` at `src/index.ts`, matching `@aib-iaas/database` and `@aib-iaas/auth`.

- `validateBody(schema)` middleware added at `services/api-gateway/src/middleware/validate.ts`,
  returning the project's existing error envelope with Zod issues flattened into
  `error.details`, so the text the frontend already renders is unchanged.
- Applied to `POST /api/applications`, `PUT /api/applications/:id`,
  `PATCH /api/applications/:id/status` and `POST /api/applications/:id/notes`. The 75-line
  hand-rolled `validateApplicationBody` is deleted.
- The middleware replaces `req.body` with the **parsed** value, so declared coercions reach
  the handler (point 2): amounts posted as strings become numbers, and NI numbers are
  upper-cased and stripped of spaces once rather than at each point of use.

**A correctness improvement that came out of it.** The API's hand-rolled NI check was
`/^[A-Z]{2}\d{6}[A-Z]$/` plus a disallowed-prefix list, which accepts `DF123456Z` — not a
number HMRC issues, since D is not a valid first letter and Z is not a valid suffix. The
shared schema had the correct character classes all along. The two rules are now combined, so
both the invalid prefixes and the invalid character classes are caught. This is exactly the
frontend/backend drift the finding predicted.

**Point 1 is not fully met, deliberately.** Two limits, both stated rather than glossed:

- `.strict()` is **not** used. The `/apply` auto-save posts several sections the repository
  does not persist (`addressHistory`, `contactDetails`, `assets`, `recommendation`), and
  rejecting unknown fields would break the journey. Those fields being accepted and then
  silently discarded is a separate defect — validation should not be the thing that hides it.
- New schemas were required rather than reusing `schemas.ts`. That file describes the
  *frontend form*: nested `debtorDetails`/`applicantDetails`/`contactDetails` with every field
  required. No endpoint receives that shape, and applying it as middleware would reject every
  real request — which is the practical reason it was never wired in. `packages/validation/src/api.ts`
  now describes what the endpoints actually receive: draft-tolerant (every field optional,
  because `/apply` saves section by section) but strict on any field that is present.

**Residual.** The routes in `user-service`, `organisation-service`, `audit-service`,
`document-service` and `payment-service` still read `req.body` with no schema. Point 3 (a CI
guard against silent disuse) is not implemented, so this can regress. 29 tests in
`services/api-gateway/src/__tests__/applicationValidation.test.ts` cover the wired routes,
including the draft-tolerance cases that would fail if someone tightened the schemas.

---

### GAP-011: Role-Permission Grants Were Defined Three Times and the Copies Disagreed

| Attribute | Detail |
|-----------|--------|
| **Severity** | Medium |
| **CWE** | CWE-1188 — Insecure Default Initialization of Resource |
| **OWASP Category** | A01:2021 — Broken Access Control |
| **Blocks production** | Yes — GAP-002 cannot be closed correctly on top of it |
| **Status** | **Seeding and vocabulary fixed** (Sprint 30). Residual items below remain open. |

**Finding.** The `role_permissions` table was populated by three independent hardcoded lists
that had drifted apart, so the grants a role received depended on which code path created the
database:

| Seed path | Behaviour before fix |
|-----------|---------------------|
| `packages/database/src/seed.ts` | Correct — 8 roles against the 20-code vocabulary |
| `packages/database/src/schema.ts` | Omitted `creditor`, `aib_readonly` and `supplier` entirely, and granted a six-code vocabulary (`application.read.all`, `application.write`, `user.manage`, …) that no other file in the repo recognised |
| `packages/database/src/pg-seed.ts` | Seeded **no permissions at all**; `pg-schema.ts` never created the `permissions` or `role_permissions` tables, so on PostgreSQL every role held zero |

`schema.ts` is the one that mattered most, because `initializeSchema()` is called by
`createRepositories()` and therefore ran for every consumer, including those that never invoked
the full seed.

**Why it was invisible.** No deployed route checks a permission (GAP-002), and `hasPermission`
is never consulted, so a role with zero grants was indistinguishable from a role with every
grant. The defect had no observable symptom — which is precisely why it survived.

**Exploit path.** Latent rather than live. Two failure modes on the day authorisation is
switched on: on PostgreSQL (the production backend, per `render.yaml`) every role holds nothing,
so default-deny locks out every user including `system_admin`; on SQLite the vocabulary mismatch
means `requirePermission('applications.read')` denies a role whose seeded grant reads
`application.read.all`. A deployment that responded by loosening the check to get users back in
would arrive at a worse position than before.

**Related live defect, now fixed.** `services/api-gateway/src/index.ts` — the only route in the
repo that applied `requirePermission` asked for `reports.view`, a code absent from
`permissions.json` and held by no role. That route returned 403 to every caller, `system_admin`
included. Corrected to `reports.read`.

**Fix applied.** `packages/database/src/rbac.ts` is now the single definition, reading
`seed-data/roles.json` (10 roles), `permissions.json` (21 permissions) and
`role-permissions.json` (68 grants), and exposing one seeding function per backend. `schema.ts`,
`seed.ts` and `pg-seed.ts` all call it; the two missing PostgreSQL tables were added to
`pg-schema.ts`. `pg-seed.ts` now seeds RBAC *before* its "already seeded" guard, because that
guard counted `roles` — the one thing it did insert — so any database created before permissions
existed would have skipped them on every subsequent run, permanently.
`packages/database/src/__tests__/rbac.test.ts` asserts referential integrity, that no role
resolves to zero permissions, that no code outside the canonical vocabulary is seeded, that both
backends issue the full grant set, and that the `UserRole` union in `packages/shared-types` still
matches `roles.json`.

**Residual work.**

1. `permissions.json` defines no `documents.*` or `credit_check.*` resources, though both
   services exist and hold the most sensitive data in the system. GAP-002 cannot place a
   meaningful check on those routes until the resources are modelled.
   `services/user-service/src/__tests__/rbac.test.ts` unit-tests its helpers with invented codes
   (`credit_check.run`, `document.delete`) that no role holds, which reads as coverage of grants
   that do not exist.
2. The RBAC matrix on `/admin/users` is a separate hardcoded illustration (9 role tiers × 11
   capability groups) with no relationship to the seeded data. It should be driven by the API
   before it is used to evidence an access-control claim.
3. The permission matrix in `docs/security.md` §4 carries scoping qualifiers ("own", "assigned",
   "relevant") that no seeded permission expresses — the same gap as GAP-005.
4. **Existing databases are not migrated.** Seeding uses `INSERT OR IGNORE` (SQLite) and
   `ON CONFLICT DO NOTHING` (PostgreSQL), which add missing rows but never delete obsolete ones.
   A database created before this fix therefore retains the withdrawn permission codes and the
   grants built on them; the fix corrects what a *new* database receives, not what an old one
   holds. This was observed in practice: a local `data/iaas.db` predating the fix still contained
   `application.read.all` and `audit.view` and failed a permission assertion that passes against
   a clean database. Any environment with a persistent volume needs a migration that removes
   codes no longer in `permissions.json`, and that migration must run before default-deny is
   switched on.

---

## Low Findings

### GAP-010: Session Tokens Are Not Invalidated Server-Side on Logout

| Attribute | Detail |
|-----------|--------|
| **Severity** | Low |
| **CWE** | CWE-613 — Insufficient Session Expiration |
| **OWASP Category** | A07:2021 — Identification and Authentication Failures |
| **Blocks production** | No — but must be closed alongside GAP-001 |

**Finding.** Token validity is determined solely by the `exp` value carried inside the
token payload. The session table is not consulted on request validation, so deleting a
session row at logout does not stop the token being accepted.

**Evidence.** `services/user-service/src/routes/auth.ts:100-107` deletes the session record
on logout. However `services/api-gateway/src/middleware/rbac.ts:31-49` validates a token by
decoding it and comparing `payload.exp` to the current time only — it performs no session
lookup and consults no revocation list. `authRouter.get('/me')`
(`services/user-service/src/routes/auth.ts:77-97`) behaves the same way. A token therefore
remains acceptable for its full 8-hour window after logout.

**Exploit path.** A captured token continues to work after the user logs out, for up to
8 hours (`auth.ts:36,45`). This is the same weakness as ITHC finding VUL-005, though the
original report attributed it to Keycloak token lifetimes; the actual cause is the absence
of a server-side validity check.

Severity is Low **only because it is subsumed by more severe findings** — where tokens are
forgeable (GAP-001) and routes are unauthenticated (GAP-002), revocation is not the
attacker's obstacle. Once those are fixed this finding becomes materially important, since
session revocation is then a control users and operators would rely on.

**Required fix.**

1. Validate every request against server-side session state, or maintain a revocation list
   checked on each request.
2. Shorten access-token lifetime substantially (minutes, not 8 hours) and use refresh-token
   rotation, so the revocation window is small by construction.
3. Revoke at the identity provider on logout once GAP-007 is implemented, and support
   back-channel logout.
4. Add a test asserting a token is rejected after logout.

**Status: closed for points 1 and 4.** `authenticate`
(`services/api-gateway/src/middleware/rbac.ts`) now looks the presented token up in
`sessions` on **every** request and returns 401 `SESSION_ENDED` when no row exists. Logout
deletes that row, so revocation is immediate. `GET /api/auth/me` on both services performs
the same check, since the frontend treats it as "am I still logged in?" and answering from
the token alone would keep a logged-out client believing it had a session.

Session validity is deliberately **not** cached, unlike the permission lookup beside it:
caching it would reintroduce exactly the window this finding describes, merely shortening
it. `optionalAuth` performs the check too — "optional" governs whether a token is required,
not whether it is verified, or it would be the way around every other guard.

Tests: `services/user-service/src/__tests__/routes.test.ts` asserts a token stops working
immediately after logout; `services/api-gateway/src/__tests__/rbac.test.ts` asserts both a
never-registered token and a deleted session are rejected.

**Residual.** Point 2 is not done — access tokens still live 8 hours with no refresh-token
rotation, so a captured token is usable for that long unless someone logs out. Point 3
depends on GAP-007. Both are smaller risks now that revocation works at all, but the long
lifetime remains the weakest part of the session model.

---

## Controls Verified as Genuinely Implemented

The review confirmed the following controls are correctly implemented in the POC codebase.
These are stated so the register is a balanced record and so remediation does not disturb
what already works.

| Control | Verification |
|---------|-------------|
| **SQL injection prevention** | Genuinely clean. All queries use `?` placeholders with user values bound as parameters. Dynamic `WHERE` fragments are concatenated only from hardcoded literals chosen by code-controlled branches; no user-supplied string reaches SQL text. The A08 "parameterised queries" claim in `docs/authority-to-operate.md` §6 holds up, as does ITHC finding "Input Validation: 0 findings" in respect of SQL injection specifically. |
| **No committed secrets** | `.env.example` contains placeholder values only, no live credentials. `render.yaml:48-49` uses `sync: false` for `DATABASE_URL`, so the value is injected at deploy time rather than committed. |
| **CI/CD workflow hygiene** | Workflows trigger on `pull_request`, not `pull_request_target`, so untrusted fork code does not execute with repository secrets. No script-injection sinks (no untrusted `${{ }}` interpolation into `run:` blocks). Azure authentication uses OIDC federation rather than long-lived stored credentials. |
| **CORS allowlist** | The deployed service uses a fixed origin allowlist, not a wildcard (`services/consolidated-api/src/index.ts:64`, driven by `CORS_ORIGIN` set to a single origin in `render.yaml:29-30`). Credentials are not combined with a wildcard origin. This supersedes ITHC finding VUL-006 for the deployed service. |
| **File upload size limit** | Enforced. `MAX_FILE_SIZE` (default 10MB) is applied via multer `limits: { fileSize: MAX_FILE_SIZE }` (`services/document-service/src/routes/documents.ts:10,27`), and `express.json({ limit: '10mb' })` bounds JSON bodies (`services/consolidated-api/src/index.ts:99`). **ITHC finding VUL-007 ("no request size limit on file upload endpoint") is inaccurate against the current code** and has been corrected in that report. |
| **File extension allowlist** | Enforced. A fixed allowlist (`.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`, `.xls`, `.xlsx`) is applied in the multer `fileFilter` (`documents.ts:28-36`). Stored filenames are regenerated as UUIDs plus extension (`documents.ts:19-22`), preventing path traversal via `originalname`. |
| **NI number validation** | Correct, including the genuine invalid-prefix list (`BG`, `GB`, `NK`, `KN`, `TN`, `NT`, `ZZ`), the disallowed suffix letters, and rejection of `O` as the second letter. |
| **Security headers** | Helmet is applied (`services/consolidated-api/src/index.ts:60`), providing `X-Frame-Options`, `X-Content-Type-Options: nosniff`, and related headers. CSP is explicitly disabled for the POC (`contentSecurityPolicy: false`), consistent with ITHC finding VUL-001, which remains open. |
| **Rate limiting present** | A global limiter is implemented and returns a correct 429 envelope with `RateLimit-*` and `Retry-After` headers (`services/consolidated-api/src/index.ts:73-98`). Its limitation is granularity, not absence — see GAP-008. |

---

## Remediation Sequencing

The findings are interdependent; fixing them in the wrong order produces a false sense of
progress. The recommended order:

| Stage | Findings | Rationale |
|-------|----------|-----------|
| 1 | GAP-001, GAP-003, GAP-007 | Establish a trustworthy identity: signed tokens verified against an IdP, real password verification, enforced MFA. Nothing downstream can be trusted until identity is. |
| 2 | GAP-011, GAP-002 | Model the missing permission resources and drive the admin matrix from real data, then wire authentication and permission checks into every deployed route, defaulting to deny. GAP-011 comes first within the stage: default-deny against grants that are wrong or absent is a lockout, and the natural response to a lockout is to weaken the check. Meaningful only once tokens are trustworthy (stage 1). |
| 3 | GAP-005, GAP-006 | Add resource ownership checks and server-derived audit attribution. Both depend on an authenticated principal existing (stages 1-2). |
| 4 | GAP-008, GAP-010 | Brute-force protection and session revocation. Both become materially important precisely because stage 1 made credentials and sessions meaningful. |
| 5 | GAP-004, GAP-009 | Deploy real malware scanning with fail-closed handling; wire schema validation into the request path. Independent of the identity chain and may proceed in parallel. |

A re-review against source should follow completion of stages 1-3, before any environment
is loaded with real debtor data.

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| docs/ithc-penetration-test-report.md | Original scoped test. Its "no critical or high" conclusion is superseded by this register; see the "Subsequent Internal Static Review" section of that report. |
| docs/authority-to-operate.md | Security case. Its control tables now separate implemented-in-POC from target-state and reference this register. |
| docs/security.md | Security architecture. Describes target-state design; now labelled as such. |
| docs/gds-service-assessment.md | GDS Standard 9 verdict revised in light of this register. |
| docs/go-live-checklist.md | Security items S1-S15 reconciled against these findings. |
| docs/BETA_READINESS.md | Security posture section reconciled against these findings. |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 24 August 2026 | Leidos Delivery (internal) | Initial register from internal static code review; 10 findings recorded (3 Critical, 4 High, 2 Medium, 1 Low). |

---

*This register describes a proof-of-concept system operating on synthetic data. It is
maintained as the authoritative record of the gap between the POC implementation and the
security case, and is updated on each security review or material code change.*

*Classification: OFFICIAL-SENSITIVE — handle in accordance with Scottish Government
security policy.*
