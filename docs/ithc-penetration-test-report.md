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
| Version | 1.0 |
| Status | FINAL |
| Report Date | 22 August 2026 |
| Distribution | AiB Digital Services, AiB Information Security, Leidos Delivery |

---

## Executive Summary

The IAAS (Initial Application Advice Service) web application was subjected to a comprehensive IT Health Check and penetration test over a five-day engagement period. Testing was conducted in accordance with the OWASP Testing Guide v4.2, the Penetration Testing Execution Standard (PTES), and CHECK methodology. The assessment covered the static frontend deployment, the Express.js API Gateway and associated microservices, and the Keycloak identity provider integration.

**Overall Risk Rating: AMBER (Acceptable with Remediation Plan)**

The application demonstrates a good security posture for a Beta-stage service. No critical or high-severity vulnerabilities were identified during the engagement. Ten findings were raised: five at medium severity and five at low severity. The medium-severity findings relate to missing security headers, rate limiting bypass potential, session management, unrestricted file upload size, and missing transport security headers. These are common in early-stage applications and are readily addressable within standard remediation timeframes. The application is considered **fit for controlled Beta deployment** provided the remediation plan outlined in this report is followed within the stated timescales.

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

## Findings Summary

| Ref | Title | Severity | CVSS | Status |
|-----|-------|----------|------|--------|
| VUL-001 | Missing Content-Security-Policy header | Medium | 5.3 | Open |
| VUL-002 | Rate limiting bypass via header manipulation | Medium | 5.8 | Open |
| VUL-003 | Verbose error messages in development mode | Low | 3.1 | Open |
| VUL-004 | Missing X-Content-Type-Options on static assets | Low | 3.4 | Remediated |
| VUL-005 | Session token not invalidated on logout | Medium | 5.4 | Open |
| VUL-006 | CORS allows wildcard in development | Low | 3.7 | Open |
| VUL-007 | No request size limit on file upload endpoint | Medium | 5.1 | Open |
| VUL-008 | Keycloak admin console accessible on same port | Low | 3.9 | Open |
| VUL-009 | Database connection string in environment logs | Low | 3.5 | Open |
| VUL-010 | Missing Strict-Transport-Security header | Medium | 5.0 | Open |

---

## Detailed Findings

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

### VUL-007: No Request Size Limit on File Upload Endpoint

| Attribute | Detail |
|-----------|--------|
| **Severity** | Medium |
| **CVSS v3.1** | 5.1 (AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:L) |
| **CWE** | CWE-770 — Allocation of Resources Without Limits |
| **OWASP Category** | A05:2021 — Security Misconfiguration |

**Description:** The document upload endpoint (`POST /api/documents/upload`) does not enforce a maximum request body size at the application level. While the file is processed by ClamAV for virus scanning, an attacker could submit extremely large files to exhaust server memory or disk space.

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

The following security controls were observed and commended:

1. **Helmet.js security headers** — Partially configured with X-Frame-Options (DENY), X-XSS-Protection, and X-Download-Options present on all API responses
2. **Authentication via Keycloak** — Industry-standard OpenID Connect implementation with RS256 JWT token validation
3. **Input validation with Zod** — Comprehensive schema validation on all API endpoints prevents injection and type confusion attacks
4. **ClamAV virus scanning** — Document uploads are scanned for malware before storage
5. **Rate limiting** — Express-rate-limit configured at 100 requests per 15 minutes on API endpoints
6. **Parameterised database queries** — No SQL injection vectors identified; all database operations use parameterised queries via the database abstraction layer
7. **Foreign key constraints** — Database integrity enforced, preventing orphaned records or data manipulation via direct database access
8. **No sensitive data in client bundles** — JavaScript bundle analysis revealed no API keys, secrets, or sensitive configuration
9. **HTTPS enforced** — Production deployment on GitHub Pages enforces TLS 1.2+ with valid certificates
10. **Role-based access control** — RBAC middleware enforces permission boundaries between user roles (debtor, representative, adviser, staff)
11. **Audit trail logging** — All significant actions are logged to the audit service with timestamp, user, and action detail

---

## Risk Assessment

| Severity | Count | Acceptable for Beta? |
|----------|-------|---------------------|
| Critical | 0 | N/A |
| High | 0 | N/A |
| Medium | 5 | Yes — with remediation plan within 30 days |
| Low | 5 | Yes — acceptable residual risk |

**Residual Risk Rating:** LOW

The combination of findings does not present a compounding risk. Each vulnerability is independently exploitable but none provide a path to full system compromise. The absence of critical and high-severity findings indicates a mature security development approach.

---

## Recommendations (Priority Order)

| # | Recommendation | Priority | Effort |
|---|----------------|----------|--------|
| 1 | Add Strict-Transport-Security header to API services | Immediate | Low |
| 2 | Implement request body size limits on all endpoints | 14 days | Low |
| 3 | Fix rate limiting to use trusted proxy configuration | 14 days | Medium |
| 4 | Implement Content-Security-Policy header | 30 days | Medium |
| 5 | Implement token revocation on logout | 30 days | Medium |
| 6 | Restrict Keycloak admin to separate port/network | Beta launch | Medium |
| 7 | Sanitise log output (remove connection strings) | Before PostgreSQL migration | Low |
| 8 | Lock down CORS to explicit origin allowlist | Before production | Low |
| 9 | Suppress verbose error messages in all environments | 30 days | Low |

---

## Conclusion

The IAAS application demonstrates a **good security posture for a Beta-stage government service**. No critical or high-severity vulnerabilities were identified during five days of comprehensive penetration testing. The development team has implemented appropriate security controls including authentication, input validation, rate limiting, and virus scanning.

The ten findings identified are typical of applications at this stage of maturity and do not prevent controlled Beta deployment. The five medium-severity issues should be addressed within 30 days, and the five low-severity issues represent acceptable residual risk for a POC environment.

**The application is assessed as FIT FOR CONTROLLED BETA USE** with implementation of the remediation plan above. A re-test of medium-severity findings is recommended following remediation.

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

| Ref | Finding | Owner | Due Date | Status | Re-test Date |
|-----|---------|-------|----------|--------|--------------|
| VUL-001 | Missing CSP header | Platform Team | 22 Sep 2026 | Open | 25 Sep 2026 |
| VUL-002 | Rate limiting bypass | Backend Team | 05 Sep 2026 | Open | 08 Sep 2026 |
| VUL-003 | Verbose error messages | Backend Team | 22 Sep 2026 | Open | 25 Sep 2026 |
| VUL-004 | Missing X-Content-Type-Options | Platform Team | — | Remediated | 20 Aug 2026 |
| VUL-005 | Session token not invalidated | Backend Team | 22 Sep 2026 | Open | 25 Sep 2026 |
| VUL-006 | CORS wildcard | Backend Team | Pre-production | Open | At deployment |
| VUL-007 | No upload size limit | Backend Team | 05 Sep 2026 | Open | 08 Sep 2026 |
| VUL-008 | Keycloak admin exposed | Platform Team | Beta launch | Open | At Beta |
| VUL-009 | Connection string in logs | Backend Team | Pre-PostgreSQL | Open | At migration |
| VUL-010 | Missing HSTS header | Platform Team | 25 Aug 2026 | Open | 27 Aug 2026 |

---

## Appendix C: Disclaimer

This report represents the findings of a point-in-time security assessment. The absence of findings does not guarantee the absence of vulnerabilities. The test was conducted against the system as configured during the test window. Changes to the system after testing may introduce new vulnerabilities. Regular re-testing is recommended in accordance with NCSC guidance.

This is a **simulated assessment document** produced for the AiB IAAS Proof of Concept. No actual penetration testing was performed. The findings are representative of issues commonly identified in applications of this type and architecture.

---

*End of Report*
