# IT Health Check — Penetration Test Report

## Document Control

| Field | Value |
|-------|-------|
| Client | Accountant in Bankruptcy (AiB) |
| System | IAAS — Initial Application Advice Service |
| Test Type | Web Application Penetration Test (OWASP-aligned) |
| Test Date | 18–22 August 2026 |
| Assessor | [Simulated] Leidos Cyber Security |
| Classification | OFFICIAL-SENSITIVE |
| Version | 1.1 |
| Status | FINAL — CONCLUSION SUPERSEDED (see banner below) |
| Report Date | 22 August 2026 (v1.0); revised 24 August 2026 (v1.1) |
| Distribution | AiB Digital Services, AiB Information Security, Leidos Delivery |

---

> ## ⚠️ STATUS: CONCLUSION SUPERSEDED — READ BEFORE RELYING ON THIS REPORT
>
> **This report describes a proof-of-concept system operating exclusively on synthetic
> data. It is not an assurance statement for a service holding real debtor information.**
>
> **The "no critical or high-severity vulnerabilities" conclusion of this report is
> superseded.** A subsequent internal static code review, conducted on 24 August 2026
> against the deployed source, identified **three Critical and four High** findings that
> were not surfaced by the original engagement. These include forgeable authentication
> tokens, a complete absence of authentication on the deployed API, and a login flow that
> accepts any password.
>
> - **Findings VUL-001 to VUL-010** below are the original scoped test results and are
>   retained unaltered except where explicitly marked as corrected.
> - **The "Subsequent Internal Static Review" section** records the Critical and High
>   findings identified afterwards, with file-and-line evidence.
> - **The authoritative current register is `docs/security-known-gaps.md`.** Refer to that
>   document, not this report's summary tables, for the present security position.
>
> No real personal data is exposed today, because all data in the POC is synthetic. The
> Critical and High findings are blockers for any environment holding real debtor data.

---

## Executive Summary

> **Note (v1.1):** The assessment in this section reflects the original August 2026 scoped
> engagement only. Its conclusion is superseded — see the banner above and the "Subsequent
> Internal Static Review" section.

The IAAS (Initial Application Advice Service) web application was subjected to a comprehensive IT Health Check and penetration test over a five-day engagement period. Testing was conducted in accordance with the OWASP Testing Guide v4.2, the Penetration Testing Execution Standard (PTES), and CHECK methodology. The assessment covered the static frontend deployment, the Express.js API Gateway and associated microservices, and the Keycloak identity provider integration.

**Overall Risk Rating (original engagement): AMBER (Acceptable with Remediation Plan)**
**Revised Overall Risk Rating (v1.1, following internal static review): RED — NOT FIT FOR REAL DATA**

No critical or high-severity vulnerabilities were identified **within the scope and by the
methods of this engagement**. Ten findings were raised: five at medium severity and five at
low severity. The medium-severity findings relate to missing security headers, rate limiting
bypass potential, session management, file upload size limits, and missing transport
security headers.

**This conclusion did not hold.** A subsequent internal static review of the deployed source
identified three Critical and four High findings, recorded in the "Subsequent Internal
Static Review" section below and in `docs/security-known-gaps.md`. The original engagement
tested a staging topology that included a Keycloak identity provider and treated the
API Gateway as the request entry point; the service actually deployed
(`services/consolidated-api`) has no Keycloak integration and applies no authentication
middleware. That divergence between the tested architecture and the deployed one is why
authentication and authorisation defects were not observed. See "Why the Original Engagement
Did Not Identify These Findings" for the full explanation.

The application is **not fit for any deployment holding real debtor data** until the
Critical and High findings are remediated. It remains suitable for demonstration purposes on
synthetic data, which is its current and only use.

---

## Scope

### Targets

| Target | Type | Environment |
|--------|------|-------------|
| https://macleoda-leidos.github.io/aib-iaas-poc/ | Static frontend (Next.js SSG) | Production |
| API Gateway (localhost:3001) | Backend BFF service | Staging |
| Keycloak (localhost:8080) | Identity Provider (OIDC) | Staging |
| Microservices (ports 3002–3007) | Backend services | Staging |

### Methodology

- **Standard:** OWASP Testing Guide v4.2 (all 91 test cases evaluated)
- **Framework:** Penetration Testing Execution Standard (PTES)
- **Accreditation:** CHECK standard (NCSC-approved methodology)
- **Approach:** Grey-box (authenticated and unauthenticated testing)

### Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Burp Suite Professional | 2024.7.2 | HTTP interception, active/passive scanning |
| OWASP ZAP | 2.15.0 | Automated vulnerability scanning |
| Nmap | 7.95 | Network reconnaissance, port scanning |
| Nikto | 2.5.0 | Web server misconfiguration detection |
| SQLMap | 1.8.7 | SQL injection testing |
| Nuclei | 3.3.0 | Template-based vulnerability scanning |
| ffuf | 2.1.0 | Directory and parameter fuzzing |
| jwt_tool | 2.2.7 | JWT token analysis and manipulation |

### Exclusions

- Denial-of-service testing (out of scope per Rules of Engagement)
- Social engineering
- Physical security assessment
- Third-party dependencies (GitHub Pages infrastructure, CDN)

---

## Findings Summary — Original Scoped Engagement (August 2026)

The table below records the findings of the original engagement only. It is **not** a
complete statement of the current security position; see the "Subsequent Internal Static
Review" section and `docs/security-known-gaps.md`.

| Ref | Title | Severity | CVSS | Status |
|-----|-------|----------|------|--------|
| VUL-001 | Missing Content-Security-Policy header | Medium | 5.3 | Open |
| VUL-002 | Rate limiting bypass via header manipulation | Medium | 5.8 | Partially addressed — see finding |
| VUL-003 | Verbose error messages in development mode | Low | 3.1 | Open |
| VUL-004 | Missing X-Content-Type-Options on static assets | Low | 3.4 | Remediated |
| VUL-005 | Session token not invalidated on logout | Medium | 5.4 | Open — cause restated, see finding |
| VUL-006 | CORS allows wildcard in development | Low | 3.7 | Not applicable to deployed service — see finding |
| VUL-007 | No request size limit on file upload endpoint | Medium | 5.1 | **WITHDRAWN — finding was inaccurate** |
| VUL-008 | Keycloak admin console accessible on same port | Low | 3.9 | Not applicable — no Keycloak deployed |
| VUL-009 | Database connection string in environment logs | Low | 3.5 | Open |
| VUL-010 | Missing Strict-Transport-Security header | Medium | 5.0 | Open |

### Corrections to the Original Findings (v1.1)

Four original findings do not survive verification against the deployed source. They are
corrected here because accuracy in both directions matters: two were wrong in the client's
favour, and stating so is necessary for the remainder of the report to be credible.

| Ref | Correction |
|-----|-----------|
| VUL-007 | **Withdrawn as inaccurate.** File size limits *are* enforced. `services/document-service/src/routes/documents.ts:10,27` applies multer `limits: { fileSize: MAX_FILE_SIZE }` (10MB default), and `services/consolidated-api/src/index.ts:99` sets `express.json({ limit: '10mb' })`. An extension allowlist is also enforced (`documents.ts:28-36`). The reported acceptance of a 500MB upload could not be reproduced and is not consistent with the code. |
| VUL-006 | **Not applicable to the deployed service.** CORS on the deployed service is a fixed origin allowlist, not a wildcard (`services/consolidated-api/src/index.ts:64`; `CORS_ORIGIN` is set to a single origin at `render.yaml:29-30`). |
| VUL-008 | **Not applicable.** No Keycloak service exists in the deployment (`render.yaml` defines only `iaas-api` and `iaas-dotnet-api`), and no Keycloak integration exists in the source. The absence of the component removes this finding — but see GAP-007, for which the same absence is a Critical-adjacent gap, since the MFA the security case depends on was to be enforced by that component. |
| VUL-005 | **Cause restated.** The finding is valid but was misattributed to Keycloak access-token lifetimes. The actual cause is that token validation consults only the `exp` value inside the token and never checks server-side session state (`services/api-gateway/src/middleware/rbac.ts:31-49`), so the logout that deletes the session row (`services/user-service/src/routes/auth.ts:100-107`) has no effect on token acceptance. Recorded as GAP-010. |

---

## Detailed Findings — Original Scoped Engagement

### VUL-001: Missing Content-Security-Policy Header

| Attribute | Detail |
|-----------|--------|
| **Severity** | Medium |
| **CVSS v3.1** | 5.3 (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N) |
| **CWE** | CWE-693 — Protection Mechanism Failure |
| **OWASP Category** | A05:2021 — Security Misconfiguration |

**Description:** The application does not set a Content-Security-Policy (CSP) response header on any page. CSP is a defence-in-depth mechanism that restricts the sources from which browsers may load content, significantly reducing the impact of cross-site scripting (XSS) vulnerabilities.

**Evidence:**
```http
GET / HTTP/2
Host: macleoda-leidos.github.io

HTTP/2 200 OK
content-type: text/html; charset=utf-8
x-frame-options: DENY
x-xss-protection: 1; mode=block
[No Content-Security-Policy header present]
```

**Impact:** Without CSP, if an XSS vector were discovered (none found during this test), an attacker could inject arbitrary scripts, exfiltrate session tokens, or modify page content without browser-level restriction.

**Recommendation:** Implement a strict CSP header:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.example.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

**Remediation Priority:** 30 days

---

### VUL-002: Rate Limiting Bypass via Header Manipulation

| Attribute | Detail |
|-----------|--------|
| **Severity** | Medium |
| **CVSS v3.1** | 5.8 (AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:L) |
| **CWE** | CWE-307 — Improper Restriction of Excessive Authentication Attempts |
| **OWASP Category** | A07:2021 — Identification and Authentication Failures |

**Description:** The rate limiting implementation uses the `X-Forwarded-For` header to identify clients. An attacker can bypass rate limiting by rotating the value of this header, effectively obtaining a fresh rate limit window with each request.

**Evidence:**
```http
# Request 1 (blocked after 100 requests):
GET /api/applications HTTP/1.1
X-Forwarded-For: 192.168.1.1

HTTP/1.1 429 Too Many Requests

# Request 2 (succeeds with different header):
GET /api/applications HTTP/1.1
X-Forwarded-For: 192.168.1.2

HTTP/1.1 200 OK
```

**Impact:** An attacker could bypass the 100 requests/15 minutes rate limit to perform brute-force attacks against authentication endpoints or enumerate application data at high volume.

**Recommendation:**
1. Configure the Express trust proxy setting to only trust known proxy IP addresses
2. Use a combination of identifiers (IP + session + fingerprint) for rate limiting
3. Implement rate limiting at the infrastructure level (WAF/load balancer) as primary control
4. Add stricter rate limits on authentication endpoints (e.g., 5 attempts/minute)

**Remediation Priority:** 14 days

---

### VUL-003: Verbose Error Messages in Development Mode

| Attribute | Detail |
|-----------|--------|
| **Severity** | Low |
| **CVSS v3.1** | 3.1 (AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N) |
| **CWE** | CWE-209 — Generation of Error Message Containing Sensitive Information |
| **OWASP Category** | A05:2021 — Security Misconfiguration |

**Description:** When an unhandled exception occurs, the API Gateway returns a stack trace and internal file paths in the error response. While the `NODE_ENV` variable should suppress this in production, testing confirmed that certain error paths still leak internal information.

**Evidence:**
```json
{
  "error": "Cannot read properties of undefined (reading 'applicationId')",
  "stack": "TypeError: Cannot read properties of undefined (reading 'applicationId')\n    at /app/services/api-gateway/src/routes/applications.ts:47:23\n    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)",
  "path": "/api/applications/invalid-uuid"
}
```

**Impact:** Stack traces reveal internal file structure, framework versions, and code logic that could assist an attacker in crafting targeted exploits.

**Recommendation:**
1. Ensure production deployment sets `NODE_ENV=production`
2. Implement a global error handler that returns generic messages to clients
3. Log detailed errors server-side only (the existing `errorHandler` middleware should catch all routes)

**Remediation Priority:** 30 days

---

### VUL-004: Missing X-Content-Type-Options on Static Assets

| Attribute | Detail |
|-----------|--------|
| **Severity** | Low |
| **CVSS v3.1** | 3.4 (AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N) |
| **CWE** | CWE-16 — Configuration |
| **OWASP Category** | A05:2021 — Security Misconfiguration |
| **Status** | **REMEDIATED** |

**Description:** Static assets served by the Next.js frontend did not include the `X-Content-Type-Options: nosniff` header, potentially allowing MIME-type sniffing attacks.

**Evidence:** This was identified during initial testing on 18 August. The development team remediated the finding on 19 August by confirming Helmet.js configuration includes `noSniff: true`. Re-testing on 20 August confirmed the header is now present on all responses.

**Impact:** Without this header, browsers may interpret files as a different MIME type than declared, potentially executing uploaded content as scripts.

**Recommendation:** No further action required — remediated during test window.

**Remediation Priority:** Complete

---

### VUL-005: Session Token Not Invalidated on Logout

| Attribute | Detail |
|-----------|--------|
| **Severity** | Medium |
| **CVSS v3.1** | 5.4 (AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N) |
| **CWE** | CWE-613 — Insufficient Session Expiration |
| **OWASP Category** | A07:2021 — Identification and Authentication Failures |

**Description:** When a user initiates logout, the client-side session is cleared but the Keycloak access token remains valid until its natural expiry (default 5 minutes). During this window, a captured token can still authenticate API requests.

**Evidence:**
```http
# 1. User logs out via UI
# 2. Using the previously captured Bearer token:
GET /api/applications HTTP/1.1
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...

HTTP/1.1 200 OK
[Application data returned despite logout]
```

**Impact:** If an attacker captures a session token (e.g., via shoulder surfing, shared computer, or XSS), they have a 5-minute window after user logout to impersonate the user.

**Recommendation:**
1. Implement Keycloak token revocation on logout (`/protocol/openid-connect/revoke`)
2. Maintain a server-side token blacklist for the short validity window
3. Reduce access token lifetime to 60 seconds with refresh token rotation
4. Implement back-channel logout notification from Keycloak to API Gateway

**Remediation Priority:** 30 days

---

### VUL-006: CORS Allows Wildcard in Development

| Attribute | Detail |
|-----------|--------|
| **Severity** | Low |
| **CVSS v3.1** | 3.7 (AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N) |
| **CWE** | CWE-942 — Overly Permissive Cross-domain Whitelist |
| **OWASP Category** | A05:2021 — Security Misconfiguration |

**Description:** The CORS configuration in the API Gateway allows `origin: '*'` when `NODE_ENV` is not set to `production`. While this is intentional for local development, there is a risk that the environment variable is not correctly set in staging or preview deployments.

**Evidence:**
```http
OPTIONS /api/applications HTTP/1.1
Origin: https://evil-site.example.com

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Impact:** In a misconfigured deployment, any website could make authenticated cross-origin requests to the API if combined with credentials.

**Recommendation:**
1. Replace wildcard with explicit origin allowlist: `['https://macleoda-leidos.github.io', 'https://iaas.aib.gov.uk']`
2. Add deployment pipeline check to verify CORS configuration per environment
3. Ensure `Access-Control-Allow-Credentials: true` is never combined with wildcard origin

**Remediation Priority:** Before production deployment

---

### VUL-007: No Request Size Limit on File Upload Endpoint — **WITHDRAWN (v1.1)**

| Attribute | Detail |
|-----------|--------|
| **Severity** | ~~Medium~~ — **WITHDRAWN, FINDING INACCURATE** |
| **CVSS v3.1** | ~~5.1 (AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:L)~~ |
| **CWE** | ~~CWE-770 — Allocation of Resources Without Limits~~ |
| **OWASP Category** | ~~A05:2021 — Security Misconfiguration~~ |
| **Status** | **WITHDRAWN — 24 August 2026** |

> **Withdrawal note (v1.1).** This finding is withdrawn as factually incorrect. Verification
> against source confirms that request and file size limits **are** enforced:
>
> - `services/document-service/src/routes/documents.ts:10` —
>   `const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024`
> - `services/document-service/src/routes/documents.ts:27` —
>   `limits: { fileSize: MAX_FILE_SIZE }` passed to multer
> - `services/consolidated-api/src/index.ts:99` — `express.json({ limit: '10mb' })`
>
> An extension allowlist is enforced in the same multer configuration
> (`documents.ts:28-36`: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`, `.xls`, `.xlsx`),
> and stored filenames are regenerated as UUIDs (`documents.ts:19-22`). The reported
> acceptance of a 500MB upload could not be reproduced and is inconsistent with the code as
> written.
>
> Recommendations 1-3 in the original text below were therefore already implemented at the
> time of the report. Recommendations 4 (per-user upload quotas) and 5 (infrastructure-level
> limits) remain valid as future hardening but do not constitute a vulnerability.
>
> **The genuine defect in the upload pipeline is malware scanning, not size limiting.** The
> scanner is fail-open and filename-based in the deployed configuration — recorded as
> GAP-004 (High) in `docs/security-known-gaps.md`. Note that the original description below
> asserts "the file is processed by ClamAV for virus scanning"; no ClamAV service exists in
> the deployment, so that premise was also incorrect.

**Original description (retained for record):** The document upload endpoint (`POST /api/documents/upload`) does not enforce a maximum request body size at the application level. While the file is processed by ClamAV for virus scanning, an attacker could submit extremely large files to exhaust server memory or disk space.

**Evidence:**
```http
POST /api/documents/upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----
Content-Length: 524288000

[500MB file payload accepted and processed]
```

The server accepted a 500MB upload without rejection, consuming significant memory during processing.

**Impact:** An authenticated attacker could exhaust server resources by submitting multiple large file uploads concurrently, potentially causing denial of service for other users.

**Recommendation:**
1. Implement `express.json({ limit: '10mb' })` for JSON payloads
2. Configure multer with `limits: { fileSize: 10 * 1024 * 1024 }` (10MB) for file uploads
3. Add file type validation (restrict to PDF, PNG, JPG, DOCX)
4. Implement per-user upload quotas (e.g., 50MB total per application)
5. Add infrastructure-level request size limits at load balancer

**Remediation Priority:** 14 days

---

### VUL-008: Keycloak Admin Console Accessible on Same Port

| Attribute | Detail |
|-----------|--------|
| **Severity** | Low |
| **CVSS v3.1** | 3.9 (AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N) |
| **CWE** | CWE-668 — Exposure of Resource to Wrong Sphere |
| **OWASP Category** | A05:2021 — Security Misconfiguration |

**Description:** The Keycloak admin console is accessible on the same port (8080) as the user-facing authentication endpoints. While protected by separate admin credentials, this increases the attack surface by exposing the administrative interface to the same network segment as end users.

**Evidence:**
```
https://localhost:8080/admin/master/console/ — Keycloak Admin Console login page accessible
https://localhost:8080/realms/iaas/ — User-facing OIDC endpoints
```

**Impact:** An attacker could target the admin console with brute-force attacks or exploit any future Keycloak admin vulnerabilities without needing access to a separate management network.

**Recommendation:**
1. Bind admin console to a separate port (e.g., 9990) accessible only from management network
2. Restrict admin console access via network policy (allow only internal IPs)
3. Enable Keycloak brute-force detection on admin realm
4. Consider disabling admin console entirely in production (manage via CLI/API)

**Remediation Priority:** Before Beta launch

---

### VUL-009: Database Connection String in Environment Logs

| Attribute | Detail |
|-----------|--------|
| **Severity** | Low |
| **CVSS v3.1** | 3.5 (AV:L/AC:L/PR:H/UI:N/S:U/C:L/I:N/A:N) |
| **CWE** | CWE-532 — Insertion of Sensitive Information into Log File |
| **OWASP Category** | A09:2021 — Security Logging and Monitoring Failures |

**Description:** During application startup, the service logs include the SQLite database file path. While SQLite connection strings do not contain credentials, this pattern could leak sensitive information if the application migrates to PostgreSQL with credential-bearing connection strings.

**Evidence:**
```
[2026-08-18T09:14:22.331Z] INFO: Database connected: /app/services/api-gateway/data/iaas.db
[2026-08-18T09:14:22.445Z] INFO: Running migrations from: /app/services/api-gateway/src/db/migrations
```

**Impact:** Current risk is minimal (SQLite has no credentials). However, when migrating to PostgreSQL, connection strings containing usernames and passwords could be logged, exposing credentials to anyone with log access.

**Recommendation:**
1. Redact connection strings in log output (log only `Database connected: [REDACTED]`)
2. Use environment variable references rather than inline values
3. Implement a log sanitisation layer that strips known sensitive patterns
4. Ensure log aggregation systems (if used) have appropriate access controls

**Remediation Priority:** Before PostgreSQL migration

---

### VUL-010: Missing Strict-Transport-Security Header

| Attribute | Detail |
|-----------|--------|
| **Severity** | Medium |
| **CVSS v3.1** | 5.0 (AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:L/A:N) |
| **CWE** | CWE-319 — Cleartext Transmission of Sensitive Information |
| **OWASP Category** | A02:2021 — Cryptographic Failures |

**Description:** The application does not set the `Strict-Transport-Security` (HSTS) header. While GitHub Pages enforces HTTPS, the absence of HSTS means browsers will not automatically upgrade HTTP requests to HTTPS, leaving a window for protocol downgrade attacks on first visit.

**Evidence:**
```http
GET / HTTP/2
Host: macleoda-leidos.github.io

HTTP/2 200 OK
[No Strict-Transport-Security header present]
```

**Impact:** On first visit (or after HSTS cache expiry), a man-in-the-middle attacker on the network path could intercept the initial HTTP request before the redirect to HTTPS, potentially capturing session cookies or injecting content.

**Recommendation:**
1. Add HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
2. Note: GitHub Pages does not allow custom headers; this must be implemented via meta tag or when moving to custom infrastructure
3. For API services, configure Helmet.js: `helmet.hsts({ maxAge: 31536000, includeSubDomains: true })`
4. Consider HSTS preload list submission for production domain

**Remediation Priority:** Immediate (API services); deferred for static frontend until custom infrastructure

---

## Positive Security Observations

> **Correction (v1.1).** Five of the eleven observations originally listed here were not
> supported by the deployed source. They are corrected below rather than deleted, so the
> record of what was claimed remains auditable. Observations verified as genuine are listed
> first.

### Verified — Genuinely Implemented

These controls were re-verified against source during the internal static review and are
confirmed present.

1. **Parameterised database queries** — Confirmed. No SQL injection vectors exist. Every query uses `?` placeholders with user values bound as parameters; dynamic `WHERE` fragments are assembled only from hardcoded literals selected by code-controlled branches, never from user input. This is a genuine strength and the original observation stands without qualification.
2. **Helmet.js security headers** — Confirmed as partially configured (`services/consolidated-api/src/index.ts:60`). X-Frame-Options and X-Content-Type-Options are present. Note that CSP is explicitly disabled (`contentSecurityPolicy: false`), consistent with VUL-001 remaining open.
3. **Foreign key constraints** — Confirmed. Database integrity constraints are enforced at schema level.
4. **No sensitive data in client bundles** — Confirmed. No API keys or secrets in the built frontend. `.env.example` holds placeholders only, and `render.yaml:48-49` uses `sync: false` for `DATABASE_URL` so it is injected at deploy time rather than committed.
5. **HTTPS enforced** — Confirmed for both the GitHub Pages frontend and the Render-hosted API.
6. **CORS allowlist** — Confirmed as a fixed allowlist on the deployed service (`services/consolidated-api/src/index.ts:64`), not the wildcard reported in VUL-006.
7. **Upload size and type restrictions** — Confirmed enforced (`services/document-service/src/routes/documents.ts:10,27,28-36`), contradicting VUL-007, which is withdrawn.
8. **CI/CD workflow hygiene** — Confirmed. Workflows trigger on `pull_request` rather than `pull_request_target`; no script-injection sinks; Azure authentication via OIDC federation rather than stored long-lived credentials.

### Corrected — Not Implemented as Originally Stated

| Original observation | Correction |
|---------------------|-----------|
| "**Authentication via Keycloak** — Industry-standard OpenID Connect implementation with **RS256 JWT token validation**" | **Incorrect.** There is no Keycloak integration and no JWT signature validation in the Node source. Tokens are unsigned base64-encoded JSON, minted at `services/user-service/src/routes/auth.ts:37-46` and trusted verbatim at `services/api-gateway/src/middleware/rbac.ts:31-49`. No `jsonwebtoken` dependency and no `JWT_SECRET` exist anywhere in the repository. Any party can mint a `system_admin` token. Recorded as **GAP-001 (Critical)** and **GAP-007 (High)**. |
| "**Input validation with Zod** — Comprehensive schema validation on all API endpoints" | **Incorrect.** `packages/validation` has zero importers outside its own tests; it is dead code. Route handlers read `req.body` directly without schema validation. Recorded as **GAP-009 (Medium)**. Note that SQL injection remains genuinely mitigated by parameterisation, which does not depend on Zod. |
| "**ClamAV virus scanning** — Document uploads are scanned for malware before storage" | **Incorrect for the deployed configuration.** No ClamAV service exists in `render.yaml`, so the scanner factory falls back to `PlaceholderScanner` (`services/document-service/src/scanner/index.ts:29-46`), which decides infection by testing whether the **filename** contains `eicar`, `virus`, or `malware` (`placeholder.ts:32`) and never reads file contents. Separately, ClamAV errors and timeouts resolve to `{scanned:false, infected:false}` (`clamav.ts:152-178`), which is recorded as `clean` (`documents.ts:118`). Recorded as **GAP-004 (High)**. |
| "**Role-based access control** — RBAC middleware enforces permission boundaries between user roles" | **Incorrect for the deployed service.** The RBAC middleware exists and is correct in isolation, but is applied in exactly one place repository-wide — `services/api-gateway/src/index.ts:48` — which is a different service from the deployment target. All 13 routers in `services/consolidated-api/src/index.ts:259-288` are mounted with no authentication or permission middleware. Recorded as **GAP-002 (Critical)** and **GAP-005 (High)**. |
| "**Audit trail logging** — All significant actions are logged with timestamp, user, and action detail" | **Partially incorrect.** Audit events are recorded, but `POST /api/audit/events` is unauthenticated and takes `actorId`, `actorName`, and `actorType` directly from the request body (`services/audit-service/src/routes/audit.ts:9-16`). Entries are therefore forgeable and attacker-attributable, and cannot support non-repudiation. Recorded as **GAP-006 (High)**. |
| "**Rate limiting** — configured at 100 requests per 15 minutes" | **Figure incorrect.** The deployed limit is 500 requests per 15 minutes, applied globally (`services/consolidated-api/src/index.ts:73-98`). No stricter limit applies to authentication endpoints, and there is no account lockout. Recorded as **GAP-008 (Medium)**. |

---

## Subsequent Internal Static Review (24 August 2026)

> **This section was added in v1.1 and supersedes the "no critical or high-severity
> vulnerabilities" conclusion of the original engagement.** It is not a new penetration
> test. No dynamic testing or exploitation was performed.

### Nature and Scope of the Review

| Field | Value |
|-------|-------|
| Review type | Internal static code review (source reading and repository-wide symbol/dependency tracing) |
| Conducted by | Leidos Delivery (internal) — **not** an independent CHECK/CREST-accredited assessment |
| Date | 24 August 2026 |
| Scope | All source under `apps/`, `services/`, `packages/`; deployment configuration; CI workflows |
| Method | Manual source review. No dynamic testing, no scanning tools, no exploitation against a running instance. |
| Deployment target assessed | `services/consolidated-api`, being the service built and deployed per `render.yaml:6-9` |

This review makes no claim to the independence or coverage of an accredited ITHC. It is
recorded here because it identified findings that materially contradict this report's
conclusion, and allowing that conclusion to stand unqualified would be misleading.

### Findings

Seven Critical and High findings were identified. Full evidence, exploit paths, and required
fixes for each are in **`docs/security-known-gaps.md`**, which is the authoritative register.

| Ref | Title | Severity | Primary Evidence |
|-----|-------|----------|------------------|
| GAP-001 | Authentication tokens are unsigned base64 JSON — forgeable | **Critical** | `services/user-service/src/routes/auth.ts:37-46`; `services/api-gateway/src/middleware/rbac.ts:31-49` |
| GAP-002 | Deployed service applies no authentication or authorisation to any route | **Critical** | `services/consolidated-api/src/index.ts:259-288`; `render.yaml:6-9` |
| GAP-003 | Login accepts any password; passwords never verified | **Critical** | `services/user-service/src/routes/auth.ts:9-22`; `services/api-gateway/src/routes/auth.ts:27` |
| GAP-004 | Malware scanning fail-open and filename-based in deployment | **High** | `scanner/index.ts:29-46`; `scanner/placeholder.ts:32`; `scanner/clamav.ts:152-178`; `routes/documents.ts:118` |
| GAP-005 | IDOR on all application routes, including approve/reject | **High** | `services/api-gateway/src/routes/applications.ts:140,157,202,232,309` |
| GAP-006 | Audit events unauthenticated and attacker-attributable | **High** | `services/audit-service/src/routes/audit.ts:9-16` |
| GAP-007 | No MFA implemented; no identity-provider integration exists | **High** | No TOTP/WebAuthn/OIDC libraries or IdP calls in source; `mfa_enabled` written, never read |

Two Medium and one Low finding were also raised (GAP-008 brute-force, GAP-009 dead
validation code, GAP-010 session revocation); see the register.

### Why the Original Engagement Did Not Identify These Findings

This is set out plainly because it bears on how much weight the rest of the report can carry.

1. **The tested architecture was not the deployed architecture.** The Scope section of this
   report lists Keycloak (localhost:8080) as a target and the API Gateway (localhost:3001)
   as the API entry point. The deployed service is `services/consolidated-api`, which has no
   Keycloak integration and does not apply the API Gateway's RBAC middleware. Testing a
   topology that included an identity provider meant the absence of one in the deployed
   build was never exercised.
2. **Authentication was assumed rather than verified.** The report's Appendix A records
   "Identity Management: 4 tests, 0 findings" and "Authorisation: 6 tests, 0 findings", and
   the Positive Observations assert RS256 JWT validation. A single inspection of the token
   in `jwt_tool` — listed among the tools used — would have shown an unsigned two-segment
   base64 string rather than a three-segment signed JWT.
3. **Grey-box testing with valid credentials masked the login defect.** Testing
   authenticated as legitimate users with correct passwords would not reveal that an
   incorrect password is also accepted.
4. **Static review reaches what dynamic testing against a staging instance does not.**
   Dead code (GAP-009), missing middleware wiring (GAP-002), and fail-open error branches
   (GAP-004) are visible in source but may not manifest in a functional test.

This is a documented limitation of point-in-time, scope-bounded dynamic testing, and is why
the disclaimer in Appendix C ("the absence of findings does not guarantee the absence of
vulnerabilities") is material rather than boilerplate.

### Revised Position

| Severity | Original Engagement | Internal Static Review | Combined Current Position |
|----------|--------------------|-----------------------|--------------------------|
| Critical | 0 | 3 | **3** |
| High | 0 | 4 | **4** |
| Medium | 5 | 2 | 6 (VUL-007 withdrawn) |
| Low | 5 | 1 | 6 |

**The system is not fit for any environment holding real debtor data until the Critical and
High findings are remediated.** No real personal data is exposed today because all POC data
is synthetic. Remediation sequencing is set out in `docs/security-known-gaps.md`.

---

## Risk Assessment

### Original Engagement (August 2026) — Superseded

| Severity | Count | Acceptable for Beta? |
|----------|-------|---------------------|
| Critical | 0 | N/A |
| High | 0 | N/A |
| Medium | 5 | Yes — with remediation plan within 30 days |
| Low | 5 | Yes — acceptable residual risk |

**Residual Risk Rating (as originally assessed):** LOW

> **This assessment is superseded (v1.1).** The original text stated that "each vulnerability
> is independently exploitable but none provide a path to full system compromise" and that
> "the absence of critical and high-severity findings indicates a mature security development
> approach." Neither statement holds against the deployed source.

### Revised Assessment (v1.1)

| Severity | Count | Acceptable for POC on synthetic data? | Acceptable for real data? |
|----------|-------|--------------------------------------|--------------------------|
| Critical | 3 | Tolerated — no real data present | **No — blocker** |
| High | 4 | Tolerated — no real data present | **No — blocker** |
| Medium | 6 | Yes | Remediation required |
| Low | 6 | Yes | Acceptable residual risk |

**Residual Risk Rating:** **HIGH** for any environment holding real data; **LOW** for the
current POC, solely because all data is synthetic and no real debtor information exists in
any deployed environment.

Contrary to the original assessment, the findings **do** compound and **do** provide a path
to full system compromise:

- GAP-002 alone yields unauthenticated read and write access to every endpoint, including
  `PATCH /api/applications/:id/status`, which approves or rejects statutory cases.
- GAP-001 and GAP-003 each independently yield `system_admin`-equivalent access — one by
  forging a token, the other by logging in as any known user with any password.
- GAP-006 means the audit trail cannot be relied upon to establish what an attacker did, or
  to distinguish their actions from a legitimate officer's.

An attacker needs to succeed at only one of these. There is no compensating control between
them.

---

## Recommendations (Priority Order)

> **Revised (v1.1).** The Critical and High findings from the internal static review take
> precedence over all items below. The original recommendations follow as items 5-12.

| # | Recommendation | Priority | Effort |
|---|----------------|----------|--------|
| 1 | Replace unsigned base64 tokens with signed tokens verified on every request (GAP-001) | **Blocker** | Medium |
| 2 | Implement real password verification with a memory-hard KDF (GAP-003) | **Blocker** | Low |
| 3 | Apply authentication and permission middleware to all deployed routes, default-deny (GAP-002) | **Blocker** | Medium |
| 4 | Add resource ownership checks on all application routes (GAP-005) | **Blocker** | Medium |
| 5 | Authenticate audit ingestion; derive actor from verified token, not request body (GAP-006) | **Blocker** | Low |
| 6 | Integrate an identity provider and enforce MFA (GAP-007) | **Blocker** | High |
| 7 | Deploy real malware scanning; make the scan path fail closed (GAP-004) | **Blocker** | Medium |
| 8 | Add authentication-specific rate limiting and account lockout (GAP-008) | High | Low |
| 9 | Wire schema validation into the request path (GAP-009) | High | Medium |
| 10 | Add Strict-Transport-Security header to API services (VUL-010) | Medium | Low |
| 11 | Implement Content-Security-Policy header (VUL-001) | Medium | Medium |
| 12 | Implement server-side token revocation on logout (VUL-005 / GAP-010) | Medium | Medium |
| 13 | Sanitise log output (remove connection strings) (VUL-009) | Before PostgreSQL migration | Low |
| 14 | Suppress verbose error messages in all environments (VUL-003) | Medium | Low |

Withdrawn or superseded original recommendations: request body size limits (already
implemented — VUL-007 withdrawn); CORS allowlist (already implemented on the deployed
service); Keycloak admin port restriction (no Keycloak deployed); trusted proxy configuration
(`trust proxy` is now set at `services/consolidated-api/src/index.ts:71`, though GAP-008
remains open).

---

## Conclusion

> **Superseded (v1.1).** The original conclusion is retained below for the record, followed
> by the revised conclusion.

### Original Conclusion (August 2026) — Superseded

The IAAS application demonstrates a **good security posture for a Beta-stage government service**. No critical or high-severity vulnerabilities were identified during five days of comprehensive penetration testing. The development team has implemented appropriate security controls including authentication, input validation, rate limiting, and virus scanning.

The ten findings identified are typical of applications at this stage of maturity and do not prevent controlled Beta deployment. The five medium-severity issues should be addressed within 30 days, and the five low-severity issues represent acceptable residual risk for a POC environment.

**The application is assessed as FIT FOR CONTROLLED BETA USE** with implementation of the remediation plan above. A re-test of medium-severity findings is recommended following remediation.

### Revised Conclusion (24 August 2026)

The conclusion above does not hold. Three of the controls it credits — authentication, input
validation, and virus scanning — are not implemented in the deployed service as described.

The IAAS POC is a functionally rich demonstration of the service design, and several of its
security properties are genuine and worth stating: SQL injection is cleanly prevented
throughout, no secrets are committed, CI/CD workflow hygiene is sound, CORS is correctly
restricted, and upload size and type limits are enforced. The RBAC permission model and
validation schemas are designed and written, and the middleware that enforces them is
correct in isolation.

However, the authentication and authorisation layer is not implemented in the deployed
service. Tokens are unsigned and forgeable, no route requires authentication, and login does
not check passwords. Any of these alone permits complete unauthorised access.

**The application is assessed as SUITABLE FOR DEMONSTRATION ON SYNTHETIC DATA ONLY.** It is
**NOT FIT** for Beta, pilot, or any other deployment involving real debtor, creditor, or
adviser data until the Critical and High findings in `docs/security-known-gaps.md` are
remediated and independently re-tested.

No real personal data is exposed today, because the POC contains none. That is a property of
the current deployment, not of the controls.

An independent ITHC by a CHECK/CREST-accredited provider should be commissioned against the
remediated build, scoped explicitly to the deployed artefact rather than a staging topology,
before any decision to process real data.

---

## Appendix A: Testing Methodology

### OWASP Testing Categories Assessed

| Category | Tests Performed | Findings |
|----------|----------------|----------|
| Information Gathering | 10 | 1 (VUL-009) |
| Configuration Management | 8 | 3 (VUL-001, VUL-004, VUL-010) |
| Identity Management | 4 | 0 |
| Authentication | 8 | 1 (VUL-005) |
| Authorisation | 6 | 0 |
| Session Management | 5 | 1 (VUL-002) |
| Input Validation | 18 | 0 |
| Error Handling | 4 | 1 (VUL-003) |
| Cryptography | 4 | 0 |
| Business Logic | 8 | 0 |
| Client-Side | 12 | 1 (VUL-006) |
| API Testing | 4 | 1 (VUL-007, VUL-008) |

> **Correction (v1.1).** The zero-finding results recorded above for **Identity Management**,
> **Authentication** (beyond VUL-005), **Authorisation**, **Input Validation**, and
> **Cryptography** are not supportable against the deployed source. The internal static
> review identified findings in each of these categories:
>
> | Category | Originally recorded | Revised |
> |----------|--------------------|---------|
> | Identity Management | 0 findings | GAP-007 (no MFA, no IdP integration) |
> | Authentication | 1 finding (VUL-005) | GAP-001, GAP-003, GAP-008, GAP-010 |
> | Authorisation | 0 findings | GAP-002, GAP-005 |
> | Input Validation | 0 findings | GAP-009 (validation package unused). SQL injection specifically remains genuinely clean. |
> | Cryptography | 0 findings | GAP-001 (tokens unsigned — no integrity protection) |
>
> The Input Validation result of "18 tests, 0 findings" is accurate in respect of injection
> resistance, which is delivered by query parameterisation rather than by the schema
> validation the report credited.

### Test Duration

| Phase | Duration |
|-------|----------|
| Reconnaissance and scoping | 4 hours |
| Automated scanning | 8 hours |
| Manual testing (unauthenticated) | 12 hours |
| Manual testing (authenticated, all roles) | 12 hours |
| Reporting and verification | 4 hours |
| **Total** | **40 hours** |

---

## Appendix B: Remediation Tracker

### Critical and High Findings (Internal Static Review) — Production Blockers

These must be closed before any environment holds real debtor data. Full detail in
`docs/security-known-gaps.md`.

| Ref | Finding | Severity | Owner | Status | Blocks Production |
|-----|---------|----------|-------|--------|-------------------|
| GAP-001 | Unsigned base64 tokens — forgeable | Critical | Backend Team | Open | **Yes** |
| GAP-002 | No auth/authz on deployed routes | Critical | Backend Team | Open | **Yes** |
| GAP-003 | Login accepts any password | Critical | Backend Team | Open | **Yes** |
| GAP-004 | Malware scanning fail-open | High | Backend Team | Open | **Yes** |
| GAP-005 | IDOR on application routes | High | Backend Team | Open | **Yes** |
| GAP-006 | Audit events forgeable | High | Backend Team | Open | **Yes** |
| GAP-007 | No MFA implemented | High | Platform Team | Open | **Yes** |
| GAP-008 | No brute-force lockout | Medium | Backend Team | Open | **Yes** |
| GAP-009 | Validation package unused | Medium | Backend Team | Open | **Yes** |
| GAP-010 | No server-side token revocation | Low | Backend Team | Open | No |

### Original Engagement Findings

| Ref | Finding | Owner | Due Date | Status | Re-test Date |
|-----|---------|-------|----------|--------|--------------|
| VUL-001 | Missing CSP header | Platform Team | 22 Sep 2026 | Open | 25 Sep 2026 |
| VUL-002 | Rate limiting bypass | Backend Team | 05 Sep 2026 | Partially addressed (`trust proxy` set); GAP-008 open | At GAP-008 fix |
| VUL-003 | Verbose error messages | Backend Team | 22 Sep 2026 | Open | 25 Sep 2026 |
| VUL-004 | Missing X-Content-Type-Options | Platform Team | — | Remediated | 20 Aug 2026 |
| VUL-005 | Session token not invalidated | Backend Team | 22 Sep 2026 | Open — tracked as GAP-010 | At GAP-010 fix |
| VUL-006 | CORS wildcard | Backend Team | — | Not applicable to deployed service (fixed allowlist in place) | — |
| VUL-007 | No upload size limit | Backend Team | — | **Withdrawn — finding inaccurate; limits are enforced** | — |
| VUL-008 | Keycloak admin exposed | Platform Team | — | Not applicable — no Keycloak deployed (see GAP-007) | — |
| VUL-009 | Connection string in logs | Backend Team | Pre-PostgreSQL | Open | At migration |
| VUL-010 | Missing HSTS header | Platform Team | 25 Aug 2026 | Open | 27 Aug 2026 |

---

## Appendix C: Disclaimer

This report represents the findings of a point-in-time security assessment. The absence of findings does not guarantee the absence of vulnerabilities. The test was conducted against the system as configured during the test window. Changes to the system after testing may introduce new vulnerabilities. Regular re-testing is recommended in accordance with NCSC guidance.

This is a **simulated assessment document** produced for the AiB IAAS Proof of Concept. No actual penetration testing was performed. The findings VUL-001 to VUL-010 are representative of issues commonly identified in applications of this type and architecture; they are illustrative rather than the product of an accredited external engagement, and this report should not be presented as independent assurance.

**Addendum (v1.1).** By contrast, the findings recorded in the "Subsequent Internal Static
Review" section (GAP-001 to GAP-010) are **not** simulated or illustrative. They were
identified by direct reading of the repository source and each carries file-and-line
evidence that can be independently verified against the codebase. They describe the actual
state of the deployed POC.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 22 August 2026 | [Simulated] Leidos Cyber Security | Original scoped engagement report; 10 findings (5 Medium, 5 Low); "no critical or high" conclusion. |
| 1.1 | 24 August 2026 | Leidos Delivery (internal) | Added status banner and "Subsequent Internal Static Review" section recording 3 Critical and 4 High findings; superseded the executive summary, risk assessment, and conclusion; withdrew VUL-007 as inaccurate; marked VUL-006 and VUL-008 not applicable to the deployed service; restated the cause of VUL-005; corrected five Positive Security Observations (RS256 JWT, Zod, ClamAV, RBAC, audit trail) and the rate-limit figure; corrected Appendix A category results. Original text retained throughout for auditability. |

---

*End of Report*
