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

| Ref | Title | Severity | Blocks Production |
|-----|-------|----------|-------------------|
| GAP-001 | Authentication tokens are unsigned base64 JSON — forgeable | Critical | Yes |
| GAP-002 | Deployed service applies no authentication or authorisation to any route | Critical | Yes |
| GAP-003 | Login accepts any password; passwords are never verified | Critical | Yes |
| GAP-004 | Malware scanning is fail-open and filename-based in deployment | High | Yes |
| GAP-005 | Insecure direct object reference on all application routes, including approve/reject | High | Yes |
| GAP-006 | Audit events are unauthenticated and attacker-attributable | High | Yes |
| GAP-007 | No multi-factor authentication implemented | High | Yes |
| GAP-008 | No brute-force protection or account lockout on login | Medium | Yes |
| GAP-009 | Schema validation package is dead code with no importers | Medium | Yes |
| GAP-010 | Session tokens are not invalidated server-side on logout | Low | No |
| GAP-011 | Role-permission grants were defined three times and the copies disagreed | Medium | Yes — seeding fixed, residual items open |

Counts: 3 Critical, 4 High, 3 Medium, 1 Low. Ten of eleven findings block production.

GAP-011 was added on 25 August 2026 and is not part of the original 24 August review. Its
seeding and vocabulary defects are fixed; the modelling gaps recorded under "Residual work"
remain open and gate the correct closure of GAP-002.

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
`seed-data/roles.json` (10 roles), `permissions.json` (20 permissions) and
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
