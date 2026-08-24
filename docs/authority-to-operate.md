# Authority to Operate — Security Case

## AiB IAAS — Initial Application Advice Service

---

## Document Control

| Field | Value |
|-------|-------|
| System | IAAS — Initial Application Advice Service |
| Owner | Accountant in Bankruptcy (AiB), Scottish Government |
| Classification | OFFICIAL-SENSITIVE |
| Version | 1.1 DRAFT |
| Author | Leidos Security Architecture |
| Reviewer | AiB SIRO |
| Status | **NOT FOR APPROVAL — TARGET-STATE DESIGN, SEE BANNER** |
| Date Issued | 21 August 2026 (v1.0); revised 24 August 2026 (v1.1) |
| Valid Until | 21 August 2027 (12-month review cycle) |
| Next Review | August 2027 or upon significant system change |
| Distribution | AiB SIRO, AiB CISO, AiB DPO, Scottish Government Cyber Resilience Unit |

---

> ## ⚠️ STATUS: TARGET-STATE SECURITY CASE — NOT AN ASSURANCE STATEMENT
>
> **This document describes a proof-of-concept system operating exclusively on synthetic
> data. The security controls it describes are predominantly TARGET STATE — designed and
> specified, but not implemented in the POC codebase.**
>
> **This document must not be used to support an Authority to Operate for any environment
> holding real debtor data in its current form.** An internal static code review on
> 24 August 2026 identified **three Critical and four High** findings in the deployed
> source, including forgeable authentication tokens, no authentication on any deployed API
> route, and a login flow that accepts any password.
>
> **Read `docs/security-known-gaps.md` before relying on any control statement in this
> document.** That register is authoritative on what the code does today; where it and this
> document disagree, the register is correct.
>
> ### How to read this document
>
> Sections 1, 2, 5, and 6 describe the intended production service — its hosting, data
> assets, data protection posture, and compliance alignment. **None of the AWS hosting
> described in §1.5 exists**; the POC runs on Render.com free-tier with SQLite. Section 4
> control tables have been annotated with an **Implementation Status** column distinguishing:
>
> | Marker | Meaning |
> |--------|---------|
> | ✅ **POC** | Implemented and verified in the POC codebase today |
> | ⚠️ **PARTIAL** | Partially implemented; see the note and the gaps register |
> | 🎯 **TARGET** | Designed and specified; **not implemented** in the POC |
>
> No real personal data is exposed today, because the POC holds none. The Critical and High
> findings are blockers for any environment holding real debtor data.

---

## 1. System Description

### 1.1 Purpose

The Initial Application Advice Service (IAAS) is the Accountant in Bankruptcy's unified digital gateway for statutory debt solution applications in Scotland. It replaces the existing fragmented, product-centric application processes with a single, user-centred service that assesses an individual's financial circumstances, recommends the most appropriate debt solution, and manages the full application lifecycle from initial enquiry through to submission and decision.

### 1.2 Scope

IAAS processes personal and financial information from Scottish citizens (debtors), their appointed representatives (money advisers), and creditor organisations. The system integrates with existing AiB case management systems (BASYS, eDEN, DAS Register), identity providers (ScotAccount, GOV.UK Login), and credit reference agencies (Experian/Equifax) to provide a comprehensive assessment and recommendation service.

### 1.3 Users

| User Type | Estimated Volume | Access Method |
|-----------|-----------------|---------------|
| Citizens (Debtors) | 30,000 per annum | Public web portal (citizen self-service) |
| Money Advisers | 2,000 registered | Public web portal (professional account) |
| Creditors / Trustees | 500 registered | Public web portal (creditor account) |
| AiB Casework Officers | 80 staff | Admin portal (internal network) |
| AiB Senior Officers | 15 staff | Admin portal (internal network) |
| AiB Supervisors | 8 staff | Admin portal (internal network) |
| System Administrators | 4 staff | Direct infrastructure access |

### 1.4 Data Classification

The system processes data classified as **OFFICIAL-SENSITIVE** under the Government Security Classifications policy. This includes personal data (names, dates of birth, National Insurance numbers, addresses), financial data (income, expenditure, debt schedules), and credit reference agency data. All data is processed under the lawful basis of public task (Article 6(1)(e) UK GDPR) in fulfilment of AiB's statutory functions under the Bankruptcy (Scotland) Act 2016.

### 1.5 Hosting

> 🎯 **TARGET STATE.** The AWS architecture below is the intended production hosting design.
> **It does not exist.** The POC is deployed on Render.com free-tier (Frankfurt) with a
> SQLite database on a 1GB attached disk, and a static frontend on GitHub Pages — see
> `render.yaml`. There is no AWS account, no RDS, no S3, no WAF, no CloudFront, and no
> Keycloak deployment. Consequently no control in this document that depends on AWS services
> (KMS encryption at rest, WAF rule groups, Secrets Manager, VPC segmentation, Multi-AZ
> resilience) is in place.
>
> Note also that the POC's Frankfurt hosting region means the UK-data-residency statement
> below does not hold for the POC. This is acceptable only because the POC data is
> synthetic; it would be a compliance failure for real data.

| Component | Environment | Provider | Region |
|-----------|-------------|----------|--------|
| Web Applications | AWS ECS (Fargate) | Amazon Web Services | eu-west-2 (London) |
| API Services | AWS ECS (Fargate) | Amazon Web Services | eu-west-2 (London) |
| Database | AWS RDS (PostgreSQL 15) | Amazon Web Services | eu-west-2 (Multi-AZ) |
| Document Storage | AWS S3 (encrypted) | Amazon Web Services | eu-west-2 (London) |
| Identity Provider | AWS ECS (Keycloak) | Amazon Web Services | eu-west-2 (London) |
| CDN / WAF | AWS CloudFront + WAF | Amazon Web Services | Global (origin eu-west-2) |
| DNS | AWS Route 53 | Amazon Web Services | Global |
| Monitoring | AWS CloudWatch + Grafana | Amazon Web Services | eu-west-2 (London) |

All data processing and storage is within UK jurisdiction. No international data transfers occur.

---

## 2. Information Asset Register

> 🎯 **The Location column describes the target production architecture, not the POC.** The POC
> holds only synthetic data, in SQLite on a Render persistent disk with documents on the local
> filesystem — there is no AWS RDS, S3, Secrets Manager, or Keycloak in the deployed POC. The
> register is retained as the intended production position for the assets the live service would
> hold.
>
> **IA-007 specifically:** "Keycloak (bcrypt hashed, encrypted at rest)" is target state and is
> **not implemented**. There is no Keycloak integration, no password hashing of any kind, and
> passwords are never verified — see **GAP-001**, **GAP-003** and **GAP-007** in
> [security-known-gaps.md](./security-known-gaps.md). No real credentials exist in the POC; the
> seeded accounts are synthetic.

| Asset ID | Asset | Classification | Owner | Location | Retention |
|----------|-------|---------------|-------|----------|-----------|
| IA-001 | Applicant personal data (name, DOB, NI number, address) | OFFICIAL-SENSITIVE | AiB | PostgreSQL (AWS RDS, encrypted) | 6 years post case closure |
| IA-002 | Financial data (income, expenditure, debt schedule) | OFFICIAL-SENSITIVE | AiB | PostgreSQL (AWS RDS, encrypted) | 6 years post case closure |
| IA-003 | Credit check results (score, defaults, CCJs) | OFFICIAL-SENSITIVE | AiB (sourced from Experian) | PostgreSQL (AWS RDS, encrypted) | 6 years post case closure |
| IA-004 | Uploaded documents (payslips, bank statements, ID) | OFFICIAL-SENSITIVE | AiB | AWS S3 (SSE-S3 AES-256) | 6 years post case closure |
| IA-005 | Application decisions and recommendations | OFFICIAL | AiB | PostgreSQL (AWS RDS, encrypted) | 6 years post case closure |
| IA-006 | Audit trail (all system events) | OFFICIAL | AiB | PostgreSQL (AWS RDS, encrypted) | 7 years |
| IA-007 | User credentials and session data | OFFICIAL-SENSITIVE | AiB | Keycloak (bcrypt hashed, encrypted at rest) | Account lifetime + 1 year |
| IA-008 | Integration data (BASYS, eDEN, DAS responses) | OFFICIAL-SENSITIVE | AiB | PostgreSQL (AWS RDS, encrypted) | 6 years post case closure |
| IA-009 | System configuration and secrets | OFFICIAL-SENSITIVE | Leidos (managed) | AWS Secrets Manager | Current + 90-day rotation |
| IA-010 | Backup data (database snapshots) | OFFICIAL-SENSITIVE | AiB | AWS RDS Snapshots (encrypted) | 30 days rolling |

---

## 3. Risk Assessment

This risk assessment is aligned with the NCSC Cyber Assessment Framework (CAF) and the Scottish Government Cyber Resilience Framework. Risks are assessed against likelihood (Very Low, Low, Medium, High, Very High) and impact (Negligible, Low, Medium, High, Critical).

### 3.1 Risk Register

> ⚠️ **The residual risk ratings below assume the target-state controls in §4 are in place.
> They are not.** For the POC as built, the residual risk for R01, R02, R03, R05, R09, R11,
> and R14 is **HIGH**, because the controls cited as mitigations for those risks are either
> not implemented or not applied to the deployed service. The table is retained as the
> intended production risk position; see the "POC Risk Position" table immediately following
> it for the actual current position.
>
> Specific corrections to the mitigation column below: "Keycloak MFA" (R01, R09, R11) does not
> exist — there is no Keycloak integration and no MFA (GAP-007). "Zod validation" (R02) is
> dead code with no importers (GAP-009). "ITHC passed (0 critical/high)" (R02) is superseded —
> 3 Critical and 4 High findings are now recorded. "ClamAV real-time scanning" (R03) is a
> filename-matching placeholder in deployment (GAP-004). "Brute force protection (5 attempts
> lockout)" (R11) does not exist (GAP-008). "Append-only audit table" (R14) is not implemented,
> and audit records are forgeable (GAP-006). "Rate limiting (100/15min)" (R04) is actually
> 500/15min. The "9-role RBAC" (R05) is written but not applied to any deployed route (GAP-002).

| ID | Risk Description | Likelihood | Impact | Inherent Risk | Mitigation Controls (target state) | Residual Risk (target state) |
|----|-----------------|-----------|--------|---------------|-------------------|---------------|
| R01 | Unauthorised access to applicant personal/financial data by external attacker | Low | High | High | Keycloak MFA, WAF, rate limiting, ITHC-validated, input validation, parameterised queries | Low |
| R02 | Data breach via application vulnerability (injection, XSS, CSRF) | Low | High | High | Zod validation, React auto-escaping, Helmet headers, ITHC passed (0 critical/high), OWASP controls | Low |
| R03 | Malicious file upload (malware, ransomware) | Medium | Medium | Medium | ClamAV real-time scanning, file type whitelist, 10MB size limit, quarantine workflow, S3 isolation | Low |
| R04 | Denial of service (volumetric or application-layer) | Medium | Medium | Medium | AWS WAF, CloudFront CDN, rate limiting (100/15min), auto-scaling, circuit breakers | Low |
| R05 | Insider threat — AiB staff data misuse or unauthorised access | Low | High | Medium | 9-role RBAC with least privilege, complete audit trail, quarterly access reviews, anomaly detection | Medium |
| R06 | Supply chain compromise (malicious npm package) | Low | Medium | Medium | Dependabot automated alerts, npm audit in CI, package-lock.json integrity, minimal dependency footprint | Low |
| R07 | Loss of service availability (infrastructure failure) | Low | Medium | Medium | Multi-AZ RDS, ECS service auto-restart, health checks, load balancer failover, infrastructure-as-code recovery | Low |
| R08 | Data loss (database corruption or accidental deletion) | Very Low | High | Medium | Automated daily backups, Multi-AZ replication, point-in-time recovery (35-day window), monthly restore testing | Low |
| R09 | Identity fraud — impersonation of debtor or adviser | Low | High | Medium | ScotAccount/GOV.UK Login identity verification, MFA enforcement, address verification, adviser accreditation checks | Low |
| R10 | GDPR breach — data retained beyond lawful period | Low | High | Medium | Retention policy defined (6 years), automated purge job (scheduled), DPO oversight, annual retention audit | Medium |
| R11 | Credential compromise (password reuse, phishing) | Medium | Medium | Medium | MFA enforced for all users, brute force protection (5 attempts lockout), breach detection (haveibeenpwned integration) | Low |
| R12 | Misconfiguration of cloud infrastructure | Low | High | Medium | Infrastructure-as-code (Terraform), peer-reviewed changes, AWS Config rules, CIS benchmark alignment | Low |
| R13 | Third-party service compromise (Experian, ScotAccount) | Very Low | Medium | Low | mTLS for all integrations, circuit breaker pattern, graceful degradation, contractual security requirements | Low |
| R14 | Audit trail tampering or deletion | Very Low | High | Medium | Append-only audit table, database-level access controls, separate audit service, CloudWatch log immutability | Low |

### 3.1a POC Risk Position (Actual — as built, 24 August 2026)

The following is the residual risk position for the POC as it exists today, assessed against
implemented controls only.

| ID | Risk | Residual Risk (POC) | Basis |
|----|------|--------------------|-------|
| R01 | Unauthorised access to personal/financial data | **High** | No authentication on any deployed route (GAP-002); tokens forgeable (GAP-001); any password accepted (GAP-003). No MFA or WAF. |
| R02 | Data breach via application vulnerability | **Medium** | SQL injection genuinely prevented by parameterisation, and React escaping mitigates XSS — both verified. Schema validation absent (GAP-009). CSP disabled. |
| R03 | Malicious file upload | **High** | Scanner is filename-matching placeholder, fail-open (GAP-004). Size limit and extension allowlist *are* enforced, which constrains but does not prevent. |
| R04 | Denial of service | **Medium** | Global rate limit present (500/15min) with correct 429 handling. No WAF, no CDN, no auto-scaling; free-tier single instance. |
| R05 | Insider threat / staff data misuse | **High** | RBAC not applied to deployed routes (GAP-002); no ownership checks (GAP-005); audit trail forgeable (GAP-006), so misuse would not be reliably detectable or attributable. |
| R06 | Supply chain compromise | **Low** | Dependabot and `npm audit` in CI; `package-lock.json` committed; CI workflow hygiene verified sound (`pull_request` triggers, OIDC, no injection sinks). |
| R07 | Loss of service availability | **Medium** | Free-tier single instance, no Multi-AZ, no failover. Health checks present. Acceptable for a POC. |
| R08 | Data loss | **Medium** | SQLite on a single attached disk; no automated backup or point-in-time recovery. Data is synthetic and reproducible from seed scripts, which caps the impact. |
| R09 | Identity fraud / impersonation | **High** | No identity verification, no MFA (GAP-007); federation endpoints are mocks returning synthetic responses. |
| R10 | GDPR breach — over-retention | **Low (POC)** | No real personal data is held, so the risk cannot currently materialise. Reverts to Medium on introduction of real data; automated purge is not implemented. |
| R11 | Credential compromise | **High** | Passwords are not checked at all (GAP-003), so credential compromise is not even a precondition for access. No MFA, no lockout (GAP-008). |
| R12 | Cloud misconfiguration | **Low** | Minimal deployed surface; no committed secrets verified; `DATABASE_URL` injected via `sync: false`. No IaC-managed cloud estate to misconfigure. |
| R13 | Third-party service compromise | **Low** | All integrations are mocks; no live third-party connections exist. |
| R14 | Audit trail tampering | **High** | Audit ingestion is unauthenticated and actor fields are taken from the request body (GAP-006). No append-only storage or hash chaining. |

**POC residual risk summary: 6 High, 5 Medium, 4 Low (one risk, R10, is suppressed by the
absence of real data).**

This position is **tolerable for the POC only because all data is synthetic**. It is not
tolerable for any environment holding real debtor data.

### 3.2 Risk Appetite Statement

The Accountant in Bankruptcy accepts **LOW** residual risk for systems processing OFFICIAL-SENSITIVE personal and financial data relating to Scottish citizens. Medium residual risks are accepted only where:

- Active monitoring is in place to detect materialisation
- A documented remediation plan exists with target completion date
- The risk is reported to the SIRO at quarterly governance meetings
- The risk does not involve potential for bulk data exposure

### 3.3 Risk Treatment Summary

**Target state** (assumes all §4 controls implemented):

| Residual Risk Level | Count | Treatment |
|--------------------|-------|-----------|
| Low | 11 | Accepted within risk appetite; monitored via standard controls |
| Medium | 3 | Accepted with active monitoring; remediation plans in progress |
| High | 0 | — |
| Critical | 0 | — |

**POC as built** (24 August 2026) — see §3.1a:

| Residual Risk Level | Count | Treatment |
|--------------------|-------|-----------|
| Low | 4 | Accepted |
| Medium | 4 | Accepted for synthetic-data POC only |
| High | 6 | **Outside risk appetite.** Tolerated solely because no real data is held. Must be remediated before any real data is introduced — see `docs/security-known-gaps.md`. |
| Critical | 0 | No risk is rated Critical because the absence of real data caps the impact of every finding. The underlying *findings* include 3 rated Critical. |

The §3.2 risk appetite statement — which requires that accepted Medium risks not involve
"potential for bulk data exposure" — is **not satisfied** by the POC as built. R01 and R05
would both permit bulk data exposure were real data present. This is the central reason the
POC must not be loaded with real data before remediation.

---

## 4. Security Controls Implementation

### 4.1 Technical Controls

> **Implementation Status key:** ✅ **POC** = implemented and verified in the POC codebase
> today. ⚠️ **PARTIAL** = partially implemented, see note. 🎯 **TARGET** = designed and
> specified, **not implemented** in the POC.
>
> Where a control is marked TARGET or PARTIAL, the "Implementation" column describes the
> intended production design, not current behaviour. Gap references (GAP-nnn) point to
> `docs/security-known-gaps.md`.

| Control Domain | Control | Implementation (design intent) | Status | Evidence / Gap |
|---------------|---------|-------------------------------|--------|----------------|
| **Authentication** | Multi-factor authentication | Keycloak with TOTP, SMS OTP, and WebAuthn (FIDO2) support; MFA mandatory for all user types | 🎯 **TARGET** | **Not implemented.** No Keycloak integration, no TOTP/WebAuthn/OTP library, and no IdP network call exists in the Node source. `mfa_enabled` is written to the user record but never read in any authentication decision. → **GAP-007** |
| **Authentication** | Credential verification | Passwords stored using a memory-hard KDF and verified on every login | 🎯 **TARGET** | **Not implemented.** Login accepts any password; `password` is destructured at `services/user-service/src/routes/auth.ts:9` and never referenced again. No bcrypt/argon2/scrypt in the source. `password_hash` is written but never compared. → **GAP-003** |
| **Authentication** | Token integrity | Signed tokens (RS256/EdDSA) verified on every request | 🎯 **TARGET** | **Not implemented.** Tokens are unsigned base64 JSON (`auth.ts:37-46`), decoded and trusted verbatim (`rbac.ts:31-49`). No `jsonwebtoken` dependency, no `JWT_SECRET`. → **GAP-001** |
| **Authentication** | Identity federation | ScotAccount (SAML 2.0) and GOV.UK Login (OpenID Connect) integration | 🎯 **TARGET** | **Mock only.** `services/identity-service/src/routes/federation.ts` returns synthetic responses; no SAML or OIDC exchange occurs. → docs/identity-architecture.md (design) |
| **Authentication** | Brute force protection | Account lockout after 5 failed attempts (30-minute duration); progressive CAPTCHA | 🎯 **TARGET** | **Not implemented.** No lockout, no per-account attempt counter, no CAPTCHA. One global 500/15min rate limit covers login. → **GAP-008** |
| **Authorisation** | Role-based access control | 9 roles with least privilege: Citizen, Representative, Adviser, Creditor, Casework Officer, Senior Officer, Supervisor, System Admin, Auditor | ⚠️ **PARTIAL** | Role and permission model is **defined** (`packages/shared-types/src/rbac.ts`) and the enforcing middleware is written and unit-tested. Not applied to the deployed service. → **GAP-002** |
| **Authorisation** | API-level enforcement | RBAC middleware validates token role claims against endpoint permission matrix | 🎯 **TARGET** | **Not enforced on the deployed service.** All 13 routers in `services/consolidated-api/src/index.ts:259-288` are mounted with no auth middleware. `authenticate` is applied in exactly one place repo-wide — `services/api-gateway/src/index.ts:48` — a different service from the deployment target per `render.yaml`. Note the middleware validates *decoded* claims, not *verified* ones (GAP-001). → **GAP-002** |
| **Authorisation** | Resource ownership checks | Users may access only their own records; officers only assigned cases | 🎯 **TARGET** | **Not implemented.** Every parameterised applications route resolves by `req.params.id` alone with no ownership predicate, including `PATCH /:id/status` which approves/rejects cases. → **GAP-005** |
| **Encryption (transit)** | TLS 1.3 | HTTPS enforced on all endpoints; HSTS with 1-year max-age and preload; TLS 1.0/1.1 disabled | ⚠️ **PARTIAL** | HTTPS **is** enforced (Render.com and GitHub Pages TLS). HSTS header is not set. → VUL-010 |
| **Encryption (at rest)** | AES-256 | RDS encryption (AWS KMS managed key); S3 SSE-S3; EBS volume encryption | 🎯 **TARGET** | **Not implemented.** POC uses unencrypted SQLite on a Render attached disk. No AWS estate exists. |
| **Input validation** | Schema validation | Zod schemas validate all API inputs (type, format, length, range); reject-by-default | 🎯 **TARGET** | **Not wired in.** `packages/validation` has zero importers outside its own tests — dead code. Handlers read `req.body` directly. → **GAP-009** |
| **Input validation** | SQL injection prevention | Parameterised queries throughout; no dynamic SQL construction | ✅ **POC** | **Verified genuine.** All queries use `?` placeholders with user values bound; dynamic `WHERE` fragments are built only from hardcoded literals in code-controlled branches. No injection vector identified. |
| **Input validation** | NI number validation | Format validation including invalid-prefix rejection | ✅ **POC** | **Verified genuine.** Correct implementation including the real invalid-prefix list (BG, GB, NK, KN, TN, NT, ZZ) and suffix rules. |
| **Output encoding** | XSS prevention | React automatic escaping; Helmet X-Content-Type-Options; DOMPurify for user content rendering | ⚠️ **PARTIAL** | React auto-escaping and `X-Content-Type-Options` **are** in place. CSP is explicitly disabled (`contentSecurityPolicy: false`, `services/consolidated-api/src/index.ts:60`). → VUL-001 |
| **Security headers** | HTTP response headers | Helmet.js: X-Frame-Options DENY, X-Content-Type-Options nosniff, Strict-Transport-Security, Referrer-Policy | ⚠️ **PARTIAL** | Helmet **is** applied (`services/consolidated-api/src/index.ts:60`) providing X-Frame-Options and nosniff. CSP disabled; HSTS not set. → VUL-001, VUL-010 |
| **CORS** | Origin allowlist | Fixed allowlist of permitted origins; no wildcard with credentials | ✅ **POC** | **Verified genuine.** Fixed allowlist on the deployed service (`services/consolidated-api/src/index.ts:64`; `CORS_ORIGIN` at `render.yaml:29-30`). |
| **File security** | Malware scanning | ClamAV daemon scans all uploads in real-time; infected files quarantined and logged | 🎯 **TARGET** | **Not implemented; fails open.** No ClamAV service in `render.yaml`, so the factory falls back to a placeholder that infers infection from the **filename** (`scanner/placeholder.ts:32`) without reading contents. ClamAV errors/timeouts also resolve to `{scanned:false, infected:false}` (`clamav.ts:152-178`) and are recorded as `clean` (`documents.ts:118`). → **GAP-004** |
| **File security** | Upload restrictions | Whitelist: PDF, JPG, PNG, DOCX; max 10MB; filename sanitisation; stored with UUID keys | ✅ **POC** | **Verified genuine.** Extension allowlist and 10MB size limit both enforced (`services/document-service/src/routes/documents.ts:10,27,28-36`); stored filenames regenerated as UUIDs (`documents.ts:19-22`). |
| **Rate limiting** | Throttling | 100 requests per 15 minutes per IP; stricter limits on authentication endpoints (10/min) | ⚠️ **PARTIAL** | A global limiter **is** implemented, but at **500** per 15 minutes (not 100), applied to all traffic including login. No authentication-specific limit exists. → **GAP-008** |
| **Session management** | Token lifecycle | Access token: 15-minute expiry; Refresh token: 8-hour expiry with rotation; Secure HttpOnly SameSite=Strict cookies | 🎯 **TARGET** | **Not implemented as described.** A single 8-hour token is issued with no refresh mechanism and no rotation. Validity is determined only by the `exp` value inside the (unsigned, attacker-editable) token; logout deletes the session row but tokens remain accepted. → **GAP-001, GAP-010** |
| **Logging & audit** | Comprehensive audit trail | All data access, modifications, and security events logged with actor, timestamp, action, resource, IP, and correlation ID | ⚠️ **PARTIAL** | Events **are** recorded with useful detail. However ingestion is unauthenticated and `actorId`/`actorName`/`actorType` are taken from the request body (`services/audit-service/src/routes/audit.ts:9-16`), so entries are forgeable and cannot support non-repudiation. Append-only storage and hash chaining are not implemented. → **GAP-006** |
| **Secret management** | No committed secrets | Secrets injected at deploy time; none in source or images | ✅ **POC** | **Verified genuine.** `.env.example` holds placeholders only; `render.yaml:48-49` uses `sync: false` for `DATABASE_URL`. |
| **Vulnerability management** | Dependency scanning | Dependabot automated PRs for vulnerable dependencies; npm audit in CI pipeline; weekly vulnerability review | ✅ **POC** | Dependabot and `npm audit` in CI are configured; `package-lock.json` committed. Weekly manual review is a target-state process. |
| **CI/CD integrity** | Pipeline hygiene | Untrusted code cannot access secrets; no script injection; federated cloud credentials | ✅ **POC** | **Verified genuine.** Workflows use `pull_request` (not `pull_request_target`); no untrusted interpolation into `run:` blocks; Azure authentication via OIDC rather than stored credentials. |
| **Network security** | Segmentation | VPC with public/private subnets; services in private subnet; NAT gateway for outbound; security groups restrict inter-service communication | 🎯 **TARGET** | **Not implemented.** Single Render.com container; no VPC. |
| **Network security** | WAF | AWS WAF with managed rule groups: Core Rule Set, Known Bad Inputs, SQL Injection, IP Reputation | 🎯 **TARGET** | **Not implemented.** No WAF of any kind is deployed. |

### 4.2 Operational Controls

> 🎯 **TARGET STATE — entire section.** The operational controls below describe the intended
> production service-management regime. **None are operational for the POC.** There is no
> 24/7 monitoring, no SIEM, no alerting, no backup or restore testing, no patch cycle, no
> access review process, and no incident-response rota. The POC is a demonstration build with
> no operational service wrap.
>
> Two specific corrections: the "Annual ITHC by CHECK/CREST-accredited provider" line has not
> occurred — `docs/ithc-penetration-test-report.md` is a simulated document, as its own
> Appendix C states, and its conclusion has been superseded by internal static review.
> "Immediate Keycloak deactivation on departure" cannot occur, as no Keycloak deployment
> exists.

| Control Domain | Control | Implementation (target state) | Frequency |
|---------------|---------|---------------|-----------|
| **Patch management** | Security patching | Critical/High CVEs patched within 72 hours; Medium within 14 days; Low within 30 days; routine monthly patch cycle | Monthly (routine) / ad-hoc (critical) |
| **Access management** | Privileged access review | Quarterly review of all admin and elevated access accounts by AiB Senior Officer; evidence retained | Quarterly |
| **Access management** | Joiners/Movers/Leavers | Immediate Keycloak deactivation on departure; role change within 24 hours of notification; HR integration for triggers | Event-driven |
| **Incident response** | Incident management | Severity-based response: P1 (1h response, 4h resolution target), P2 (4h/24h), P3 (24h/5 days), P4 (72h/30 days) | Event-driven |
| **Incident response** | Security incident reporting | Security incidents reported to AiB SIRO within 4 hours; ICO notification within 72 hours where required (Article 33 UK GDPR) | Event-driven |
| **Backup & recovery** | Automated backups | Daily automated RDS snapshots; S3 versioning enabled; 30-day retention; point-in-time recovery enabled (5-minute granularity) | Daily |
| **Backup & recovery** | Restore testing | Monthly restore test to isolated non-production environment; success/failure documented | Monthly |
| **Penetration testing** | ITHC | Annual IT Health Check by CHECK/CREST-accredited provider; findings remediated per severity SLA | Annual |
| **Monitoring** | Security monitoring | Real-time alerting on: failed authentication (>10/min), privilege escalation attempts, unusual data access patterns, WAF blocks | Continuous |
| **Monitoring** | Log retention | CloudWatch Logs retained for 13 months; audit trail database retained for 7 years; tamper-evident (append-only) | Continuous |
| **Change management** | Controlled deployment | All changes peer-reviewed (GitHub PR); automated CI/CD pipeline; staging environment validation; rollback capability | Per change |
| **Business continuity** | Disaster recovery | RTO: 4 hours; RPO: 5 minutes (point-in-time recovery); documented DR procedure; annual DR exercise | Annual exercise |

### 4.3 Personnel Controls

> 🎯 **TARGET STATE — entire section.** These describe the personnel-security regime intended
> for a live service handling OFFICIAL-SENSITIVE data. They are contractual and process
> commitments for the production phase, not controls verifiable in the POC codebase. SC
> clearance, phishing simulation, and separation-of-duties enforcement are not in effect for
> POC development, which operates on synthetic data only.

| Control | Implementation (target state) | Evidence |
|---------|---------------|----------|
| Security clearance | SC clearance required for all personnel with administrative access to production systems; BPSS for standard development access | Clearance records held by Leidos Security |
| Security awareness training | Annual mandatory training covering phishing, social engineering, data handling, and incident reporting; completion tracked | Training records (>95% completion target) |
| Acceptable use policy | All personnel acknowledge AiB acceptable use policy and data handling procedures on engagement | Signed acknowledgements on file |
| Separation of duties | Code author cannot approve own PR; deployment approval separated from development; audit log reviewers cannot modify audit data | Git branch protection rules; AWS IAM policies |
| Leavers process | Immediate credential revocation upon departure notification; access audit within 24 hours; equipment return tracked | JML process documentation |
| Contractor oversight | All Leidos personnel operate under contracted security obligations; annual renewal of security commitments | Contract schedule (security) |
| Phishing simulation | Quarterly simulated phishing campaigns targeting all users with system access; results reported to SIRO | Quarterly campaign reports |

---

## 5. Data Protection Impact Assessment (Summary)

### 5.1 Data Processing Purpose

IAAS processes personal and financial data for the purpose of:
- Assessing citizen eligibility for Scottish statutory debt solutions
- Generating rules-based product recommendations
- Facilitating application submission to AiB for decision
- Maintaining statutory records as required by the Bankruptcy (Scotland) Act 2016

### 5.2 Lawful Basis for Processing

| Data Category | Lawful Basis | Justification |
|---------------|-------------|---------------|
| Personal data (name, DOB, NI, address) | Article 6(1)(e) UK GDPR — Public task | Statutory function of AiB under Bankruptcy (Scotland) Act 2016 |
| Financial data (income, expenditure, debts) | Article 6(1)(e) UK GDPR — Public task | Required for eligibility assessment and recommendation |
| Special category data (health-related debt) | Article 9(2)(g) UK GDPR — Substantial public interest | Schedule 1, Part 2, Paragraph 6 DPA 2018 (statutory purposes) |
| Credit reference data | Article 6(1)(e) UK GDPR — Public task | Required for comprehensive financial assessment |
| Criminal offence data (if disclosed) | Article 10 UK GDPR — Official authority | Section 10(5) DPA 2018 (exercise of official functions) |

### 5.3 Data Minimisation

- Only data strictly necessary for the recommendation and application is collected
- Credit check results stored in summary form only (score band, default count) — full credit file not retained
- Financial data collected at category level — individual transaction detail not required
- Documents purged automatically after case closure plus statutory retention period (6 years)
- IP addresses logged for security purposes only; purged after 13 months

### 5.4 Data Subject Rights

| Right | Supported | Mechanism | Response Time |
|-------|-----------|-----------|---------------|
| Right of access (Art 15) | Yes | Self-service data export in citizen portal; formal SAR process via DPO for complex requests | 30 days (self-service: immediate) |
| Right to rectification (Art 16) | Yes | Self-service edit for draft applications; staff correction for submitted applications with audit trail | 30 days |
| Right to erasure (Art 17) | Partial | Anonymisation after retention period expires; erasure not available during statutory retention window (legal obligation exemption) | N/A during retention |
| Right to restrict processing (Art 18) | Yes | Application freeze function available to casework officers pending dispute resolution | 72 hours |
| Right to data portability (Art 20) | Yes | JSON export of application data available via citizen portal and API | Immediate (self-service) |
| Right to object (Art 21) | Limited | Processing under statutory obligation — right to object does not apply to public task processing | N/A |
| Automated decision-making (Art 22) | Yes | Recommendation is advisory only — human review for all final decisions; citizen can request full explanation of recommendation logic | Immediate (explanation) |

### 5.5 International Data Transfers

> 🎯 **TARGET STATE.** The UK-residency position below applies to the intended AWS production
> hosting. **The POC is hosted in Render.com's Frankfurt region** (`render.yaml:12`), so POC
> data does leave the UK. This is acceptable only because that data is entirely synthetic and
> contains no personal data of any data subject; there is therefore no transfer of personal
> data to assess under Chapter V UK GDPR. UK residency must be established before any real
> data is processed.

For the target production deployment, no international data transfers occur. All data is processed and stored within the United Kingdom:
- Computing: AWS eu-west-2 (London)
- Backups: AWS eu-west-2 (London)
- CDN origin: AWS eu-west-2 (London)
- Support personnel: UK-based only

AWS Data Processing Agreement confirms UK data residency with no cross-border processing.

### 5.6 Data Protection by Design

> ⚠️ **Mixed status.** Corrections below.

- Privacy by design embedded throughout development lifecycle — ⚠️ **PARTIAL** (design principle applied to data-model decisions; not independently assured)
- Data minimisation enforced at schema level (Zod validation rejects unnecessary fields) — 🎯 **TARGET.** **Not enforced.** The Zod schema package has no importers outside its own tests; no schema-level rejection of unnecessary fields occurs at runtime. → **GAP-009**
- Pseudonymisation applied in non-production environments — ✅ **POC** in effect, though by a stronger means than pseudonymisation: the POC contains no real personal data at all, only synthetic seed data
- Automated retention enforcement prevents indefinite data storage — 🎯 **TARGET.** No automated purge job is implemented (consistent with the R10 remediation plan in §7)
- Consent withdrawal mechanism available for optional processing — 🎯 **TARGET.** Not implemented

---

## 6. Compliance Framework Alignment

| Framework | Status | Notes |
|-----------|--------|-------|
| **NCSC Cyber Essentials Plus** | 🎯 **Target — not currently met** | Design addresses all five controls: boundary firewalls/gateways (WAF, security groups), secure configuration (CIS benchmarks), access control (RBAC), malware protection, patch management (72h critical). **As built, three of the five are not met:** no boundary firewall or WAF is deployed; access control is not enforced on the deployed service (GAP-002); malware protection is a filename-matching placeholder (GAP-004). |
| **NCSC Cyber Assessment Framework** | 🎯 **Target — partially met** | B3 (data security) is supported by verified query parameterisation and secret hygiene. **B2 (identity and access control) is not met** — no MFA (GAP-007), forgeable tokens (GAP-001), no password verification (GAP-003), no access enforcement (GAP-002). B1, B4, and B5 depend on the target-state operational and network controls in §4.2 and are not in place. |
| **Scottish Government Cyber Resilience Framework** | 🎯 **Target — not currently met** | The POC does not meet the requirements for handling OFFICIAL-SENSITIVE data. It handles synthetic data only, and must not be loaded with real data before remediation. |
| **ISO 27001:2022** | Principles followed | Formal certification not sought for POC phase; control selection aligned with Annex A. Unchanged. |
| **OWASP Top 10 (2021)** | ⚠️ **Partially mitigated — see per-item breakdown below** | The original blanket "all Top 10 risks addressed" claim is not supportable. Corrected item by item in the table below. |
| **PCI DSS v4.0** | Not applicable | No card data stored or processed; payment via GOV.UK Pay (PCI-compliant gateway). Unchanged. |
| **NHS Data Security & Protection Toolkit** | Not applicable | No health data processing (NHS not a data source) |
| **UK GDPR / DPA 2018** | ⚠️ **Not assessable for the POC** | Lawful basis, DPIA, data subject rights, and DPO appointment are established at design level. The POC processes **no personal data**, so compliance cannot be demonstrated or breached by it. Compliance must be re-assessed before real data is introduced — the access-control findings (GAP-001/002/003/005) would each constitute a failure of the Article 32 "appropriate technical measures" obligation if real personal data were held. |
| **Equality Act 2010** | Compliant | WCAG 2.1 AA accessibility; no discriminatory data processing; reasonable adjustments available |

### 6.1 OWASP Top 10 (2021) — Item-by-Item Status

The original entry claimed all ten risks were addressed. Corrected:

| # | Risk | Original claim | Actual status |
|---|------|---------------|---------------|
| A01 | Broken Access Control | RBAC | ❌ **Not mitigated.** No auth on deployed routes (GAP-002); no ownership checks (GAP-005). This is the POC's most significant gap. |
| A02 | Cryptographic Failures | bcrypt + MFA | ❌ **Not mitigated.** No bcrypt (or any KDF) in the source (GAP-003); no MFA (GAP-007); tokens unsigned (GAP-001). TLS in transit is in place; no encryption at rest. |
| A03 | Injection | Zod | ⚠️ **Mitigated, but not by Zod.** Zod is dead code (GAP-009). **SQL injection is genuinely prevented** by universal query parameterisation, and XSS by React auto-escaping — both verified. The mitigation is real; the stated mechanism was wrong. |
| A04 | Insecure Design | Rate limiting | ⚠️ **Partial.** Rate limiting is present (500/15min, not 100). The fail-open malware scanner (GAP-004) is itself an insecure-design finding under this heading. |
| A05 | Security Misconfiguration | Helmet | ⚠️ **Partial.** Helmet applied; CSP explicitly disabled; HSTS absent. CORS correctly restricted. |
| A06 | Vulnerable Components | Dependabot | ✅ **Mitigated.** Dependabot and `npm audit` in CI; lockfile committed. |
| A07 | Authentication Failures | Keycloak | ❌ **Not mitigated.** No Keycloak (GAP-007); any password accepted (GAP-003); forgeable tokens (GAP-001); no lockout (GAP-008). |
| A08 | Software and Data Integrity | Parameterised queries | ⚠️ **Partial.** CI/CD pipeline integrity is sound (verified: `pull_request` triggers, OIDC, no injection sinks) and no secrets are committed. Container images are not signed; audit logs are not hash-chained and are forgeable (GAP-006). *Note: parameterised queries are an A03 control, not A08 — the original mapping was misfiled, though the control itself is genuine.* |
| A09 | Logging and Monitoring | CloudWatch | ❌ **Not mitigated.** No CloudWatch or monitoring stack exists; audit events are unauthenticated and forgeable (GAP-006). |
| A10 | Server-Side Request Forgery | SSRF mitigation | ✅ **Mitigated.** No user-controlled URLs in server-side fetches; outbound calls target fixed mock endpoints. |

**Summary: 2 mitigated, 4 partially mitigated, 4 not mitigated.**

---

## 7. Residual Risk Statement

> ⚠️ **This statement is conditional and the condition is not met.** The profile below applies
> **"following implementation of all technical, operational, and personnel controls described
> in Section 4"** — and as §4 now records, the majority of those controls are target state and
> not implemented. For the POC as built, see §3.1a: **6 High, 5 Medium, 4 Low.**

**Target-state residual risk** (conditional on full §4 implementation):

| Risk Level | Count | Details |
|-----------|-------|---------|
| **Critical** | 0 | — |
| **High** | 0 | — |
| **Medium** | 3 | R05 (insider threat), R10 (data retention compliance), R01 (unauthorised access — reduced from Low to Medium during initial operational period due to limited monitoring baseline) |
| **Low** | 11 | All other identified risks |

### Medium Risk Remediation Plans

| Risk | Remediation Action | Target Date | Owner |
|------|-------------------|-------------|-------|
| R05 (Insider threat) | Deploy SIEM with user behaviour analytics; establish anomaly detection baseline; implement data loss prevention rules | Q4 2026 | AiB CISO |
| R10 (Data retention) | Complete automated purge job implementation; conduct first retention audit; verify purge effectiveness | Q1 2027 | AiB DPO |
| R01 (Unauthorised access — monitoring gap) | Establish monitoring baseline from 3 months operational data; tune alerting thresholds; confirm detection capability | Q1 2027 | Leidos Security |

### Overall Assessment

> **Superseded (v1.1).** The original assessment read: *"The system presents an acceptable level
> of risk for processing OFFICIAL-SENSITIVE data in a controlled Beta environment. No critical
> or high residual risks exist."* That statement was conditional on controls that are not
> implemented, and it does not hold.

**Revised assessment (24 August 2026).**

The POC as built **does not present an acceptable level of risk for processing
OFFICIAL-SENSITIVE data**, and must not be used for that purpose. Six risks sit at High
residual (§3.1a), driven by three Critical and four High code findings recorded in
`docs/security-known-gaps.md`.

The risk is nonetheless **currently contained**, for one reason only: the POC holds no real
personal data. All data is synthetic seed data, so there is no data subject whose information
could be exposed. This containment is a property of the deployment, not of the controls, and
it ends the moment real data is introduced.

**Prerequisites for reconsidering this assessment:**

1. Remediation of all Critical and High findings (GAP-001 to GAP-007), plus GAP-008 and
   GAP-009.
2. Implementation of the §4.1 controls currently marked TARGET that bear on identity, access
   control, and encryption at rest.
3. Establishment of the §4.2 operational wrap (monitoring, alerting, backup, patching, access
   review) in some form, since several §3 mitigations depend on detection rather than
   prevention.
4. An independent ITHC by a CHECK/CREST-accredited provider against the remediated build,
   scoped to the deployed artefact.
5. Re-review of this security case against the remediated code, and re-issue at v2.0.

---

## 8. Conditions of Operation

> ⚠️ **Conditions 1, 3, 4, 5, 8, 9, 10, 11, and 12 are not currently satisfied.** They are
> stated as the conditions that would attach to a granted Authority to Operate. Condition 1 in
> particular — authentication via an identity provider with MFA and no bypass — is not merely
> unsatisfied but inverted: the deployed service requires no authentication at all (GAP-002)
> and accepts any password where a login is attempted (GAP-003).
>
> **These conditions are therefore prerequisites for approval, not maintenance obligations
> under an existing approval.** No Authority to Operate is in force.

The following conditions must be maintained for this Authority to Operate to remain valid:

1. **Authentication** — All users must authenticate via the identity provider with multi-factor authentication enabled; no bypass mechanisms permitted — ❌ **not satisfied (GAP-001, GAP-002, GAP-003, GAP-007)**
2. **Personnel clearance** — Administrative access to production systems restricted to SC-cleared personnel only
3. **Penetration testing** — Annual ITHC conducted by CHECK/CREST-accredited provider; all critical and high findings remediated within 14 days
4. **Patch management** — Monthly patching cycle maintained; critical vulnerabilities patched within 72 hours of disclosure
5. **Access reviews** — Quarterly review of all privileged access conducted and evidenced by AiB Senior Officer
6. **Annual re-approval** — SIRO re-approval required annually or upon significant system change (architecture modification, new data category, new integration, change of hosting provider)
7. **Incident reporting** — Security incidents reported to AiB SIRO within 4 hours; ICO notification within 72 hours where personal data breach confirmed
8. **Data retention** — 6-year statutory retention period enforced; automated purge operational and audited annually
9. **Monitoring** — Security monitoring operational 24/7; alerting configured for authentication anomalies, data exfiltration indicators, and availability degradation
10. **Backup verification** — Monthly restore test conducted and documented; annual disaster recovery exercise
11. **Change control** — All production changes approved via peer review; automated CI/CD pipeline with security scanning gates
12. **Third-party assurance** — Annual security assurance review of critical third-party services (AWS, Experian, ScotAccount)

Breach of any condition requires immediate notification to the SIRO and may result in suspension of the Authority to Operate pending remediation.

---

## 9. Recommendation

> **Superseded (v1.1).** The original recommendation, retained below for the record, rested on
> four premises that do not hold. It is replaced by the revised recommendation that follows.

### Original Recommendation (21 August 2026) — Superseded

*Based on the comprehensive security assessment, risk analysis, and controls implementation described in this document, and considering: the clean ITHC result (0 critical, 0 high findings); the defence-in-depth architecture with multiple overlapping controls; the acceptable residual risk profile (0 critical, 0 high, 3 medium, 11 low); the clear remediation plans for medium residual risks; the alignment with NCSC, Scottish Government, and OWASP frameworks; and the robust data protection measures and UK GDPR compliance — the IAAS service is recommended for **Authority to Operate at OFFICIAL-SENSITIVE** classification for a period of 12 months from the date of SIRO approval, subject to the Conditions of Operation defined in Section 8.*

Each of the first four premises is now known to be unsound:

| Premise | Status |
|---------|--------|
| "Clean ITHC result (0 critical, 0 high)" | Superseded — 3 Critical, 4 High findings now recorded (`docs/security-known-gaps.md`) |
| "Defence-in-depth with multiple overlapping controls" | Not supported — the authentication and authorisation layers are absent from the deployed service, so there is no depth to the access-control defence |
| "Acceptable residual risk profile (0 critical, 0 high)" | Superseded — 6 High residual risks as built (§3.1a) |
| "Alignment with NCSC, Scottish Government, OWASP frameworks" | Overstated — see §6 and §6.1; four OWASP Top 10 items are not mitigated |

### Revised Recommendation (24 August 2026)

**Authority to Operate at OFFICIAL-SENSITIVE classification is NOT recommended, and must not
be granted on the basis of this document in its current version.**

The IAAS POC is recommended for **continued use as a demonstration and design-validation
platform on synthetic data only**. In that capacity it is valuable: the service design, user
journeys, recommendation engine, role model, and integration patterns are substantially
worked through, and several security properties are genuinely well implemented — universal
query parameterisation, secret hygiene, CI/CD pipeline integrity, CORS restriction, and upload
type and size controls.

**Conditions on continued POC use:**

1. No real debtor, creditor, or adviser data may be entered into any POC environment.
2. The POC must not be represented to any third party as a security-assured service.
3. This document must be distributed together with `docs/security-known-gaps.md`.

**Path to an Authority to Operate:** complete the five prerequisites in §7, then re-issue this
security case at v2.0 for SIRO consideration. The prerequisites are substantial but
well-defined; none requires redesign, as the intended controls are already specified in §4 and
the enforcing code for several exists but is unwired.

---

## 10. Approval

> ⚠️ **This approval block must not be signed against v1.1.** It is retained because the
> document is a controlled template and the signatory list is part of the intended governance
> process. Per §9, Authority to Operate is not recommended at this version. Signatures should
> be sought only against a v2.0 issued after the §7 prerequisites are met.

| Role | Name | Signature | Date |
|------|------|-----------|------|
| System Owner (AiB) | Robert Anderson | _________________ | ____/____/2026 |
| Senior Information Risk Owner (SIRO) | Alastair Campbell | _________________ | ____/____/2026 |
| Chief Information Security Officer | David Chen | _________________ | ____/____/2026 |
| Data Protection Officer | Fiona Stewart | _________________ | ____/____/2026 |
| Delivery Manager (Leidos) | Karen MacLeod | _________________ | ____/____/2026 |
| Security Architect (Leidos) | James Murray | _________________ | ____/____/2026 |

### Approval Decision

☐ **APPROVED** — Authority to Operate granted for 12 months from signature date

☐ **APPROVED WITH CONDITIONS** — Authority granted subject to additional conditions (specify below)

☐ **DEFERRED** — Additional information or remediation required before approval (specify below)

☐ **REJECTED** — Unacceptable risk; system must not process live data

**Additional Conditions / Comments:**

_________________________________________________________________________

_________________________________________________________________________

_________________________________________________________________________

**SIRO Signature:** _________________________________ **Date:** ____/____/2026

---

## Appendices

| Appendix | Title | Reference |
|----------|-------|-----------|
| **A0** | **Security Known Gaps — Findings Register (authoritative on current state)** | **docs/security-known-gaps.md** |
| A | IT Health Check (ITHC) Penetration Test Report (conclusion superseded — see Appendix A0) | docs/ithc-penetration-test-report.md |
| B | WCAG 2.1 Accessibility Audit | docs/wcag-accessibility-audit.md |
| C | GDS Service Standard Self-Assessment | docs/gds-service-assessment.md |
| D | Security Architecture Document | docs/security.md |
| E | Integration Architecture | docs/integrations.md |
| F | Data Protection Impact Assessment (Full) | docs/dpia.md (in progress) |
| G | Disaster Recovery Plan | docs/runbook.md (Section: DR Procedures) |
| H | Incident Response Playbook | docs/runbook.md (Section: Incident Management) |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 1 August 2026 | Leidos Security Architecture | Initial draft |
| 0.2 | 12 August 2026 | Leidos Security Architecture | Incorporated ITHC findings; updated risk register |
| 1.0 | 21 August 2026 | Leidos Security Architecture | Final draft for SIRO review; DPIA summary added |
| 1.1 | 24 August 2026 | Leidos Delivery (internal) | Added target-state status banner. Added Implementation Status column to §4.1 separating implemented-in-POC from target-state controls. Marked §1.5 hosting, §4.2, §4.3, §5.5 as target state. Added §3.1a POC risk position (6 High) and corrected §3.3 treatment summary. Corrected §5.6 data-minimisation claims. Rewrote §6 framework alignment and added §6.1 OWASP item-by-item breakdown. Superseded §7 overall assessment and §9 recommendation; ATO no longer recommended at this version. Annotated §8 conditions as unsatisfied prerequisites. Added `docs/security-known-gaps.md` as Appendix A0. |

---

*This document has been prepared by Leidos Security Architecture on behalf of the Accountant in Bankruptcy. It represents the **target-state** security case for the IAAS system, together with an accurate statement of which controls are implemented in the proof of concept as at 24 August 2026. The POC operates exclusively on synthetic data. The assessment is based on design documentation, static code review, and automated testing results; the referenced IT Health Check is a simulated document whose conclusion has been superseded by internal static review. This document must be read in conjunction with `docs/security-known-gaps.md`, which is authoritative on the current implementation state.*

*Classification: OFFICIAL-SENSITIVE — handle in accordance with Scottish Government security policy. Do not distribute outside the named distribution list without SIRO approval.*
