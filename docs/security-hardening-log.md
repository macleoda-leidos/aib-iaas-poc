# Security Hardening Log

## Document Control

| Field | Value |
|-------|-------|
| Document Title | Security Remediation and Hardening Log |
| Version | 1.0 |
| Date | August 2026 |
| Classification | OFFICIAL |
| Related Documents | ITHC Scope (docs/ithc-scope.md), Security Architecture (docs/security.md) |

## Overview

This document tracks security vulnerabilities identified during the ITHC penetration test and internal security review, along with their remediation status. All findings are from the web application penetration test conducted against the IAAS consolidated API and frontend portal.

## Findings Register

| ID | Finding | Severity | CVSS | Status | Remediation | Date Fixed |
|----|---------|----------|------|--------|-------------|------------|
| VUL-001 | Missing Content Security Policy | Medium | 5.3 | Remediated | Helmet.js configured with strict CSP in consolidated-api. Policy restricts script-src to 'self', blocks inline scripts, and sets frame-ancestors to 'none'. | Sprint 17 |
| VUL-002 | Rate limit bypass via header manipulation | Medium | 5.9 | Remediated | Rate limiting now applies per IP address AND per authenticated token. X-Forwarded-For header is validated against trusted proxy list. Implemented express-rate-limit with sliding window algorithm. | Sprint 17 |
| VUL-003 | Verbose error messages exposing stack traces | Low | 3.1 | Remediated | Error handling middleware checks NODE_ENV. In production, generic error messages are returned without stack traces, file paths, or internal details. Full details logged server-side only. | Sprint 16 |
| VUL-004 | Missing X-Content-Type-Options header | Low | 2.4 | Remediated | Helmet.js noSniff() middleware enabled, setting X-Content-Type-Options: nosniff on all responses. Prevents MIME type sniffing attacks. | Sprint 16 |
| VUL-005 | Session not fully invalidated on logout | Medium | 5.5 | Remediated | Logout endpoint now clears all tokens (access, refresh, session), invalidates server-side session record, and sets token expiry to immediate. Client-side storage (localStorage, sessionStorage, cookies) all cleared. | Sprint 18 |
| VUL-006 | File upload lacks content validation | Medium | 6.1 | Remediated | File upload validates MIME type against allowlist (PDF, PNG, JPG, DOCX only), checks magic bytes match declared type, enforces 10MB size limit, and sanitises filenames. Uploaded files stored outside web root. | Sprint 17 |
| VUL-007 | No request body size limit | Medium | 5.3 | Remediated | Express.js body parser configured with explicit limits: `express.json({ limit: '10mb' })` and `express.urlencoded({ limit: '10mb', extended: true })`. Prevents memory exhaustion from oversized payloads. | Sprint 16 |
| VUL-008 | CORS allows broad origins in development config | Low | 3.4 | Remediated | Production CORS configuration restricts allowed origins to specific domains (GitHub Pages URL, admin portal URL). Wildcard origin only permitted in development environment. | Sprint 17 |
| VUL-009 | Missing Referrer-Policy header | Low | 2.1 | Remediated | Helmet.js referrerPolicy() set to 'strict-origin-when-cross-origin'. Prevents leakage of URL paths to external sites. | Sprint 16 |
| VUL-010 | Missing HSTS (HTTP Strict Transport Security) | Medium | 5.0 | Remediated | Render.com enforces HSTS automatically on all deployed services with includeSubDomains and a 1-year max-age. Verified via response header inspection. | N/A (Platform) |

## Summary

| Severity | Total | Remediated | Outstanding |
|----------|-------|------------|-------------|
| Critical | 0 | 0 | 0 |
| High | 0 | 0 | 0 |
| Medium | 6 | 6 | 0 |
| Low | 4 | 4 | 0 |
| **Total** | **10** | **10** | **0** |

## Security Posture Assessment

**Overall Status: GREEN**

All identified vulnerabilities have been remediated. No critical or high severity findings were identified during the assessment, indicating a strong baseline security posture for a POC-phase application. The defence-in-depth approach (Helmet.js headers, rate limiting, input validation, error handling, CORS restrictions) provides multiple layers of protection.

## Remediation Approach

Findings were addressed using the following priority order:

1. **Medium severity findings** — addressed within the same sprint as discovery or the immediately following sprint
2. **Low severity findings** — batched and addressed in security-focused sprints
3. **Platform-provided controls** — validated that hosting platform (Render.com) provides certain controls automatically (HSTS, TLS enforcement)

## Verification

Each remediation was verified through:

- Manual testing to confirm the vulnerability is no longer exploitable
- Automated security header scanning (securityheaders.com)
- Review of relevant middleware configuration in source code
- Regression testing to ensure fixes do not break functionality

## Ongoing Security Controls

Beyond vulnerability remediation, the following security controls are maintained:

- **Dependency scanning**: npm audit runs in CI pipeline, blocking deployment on high/critical vulnerabilities
- **Input validation**: All API inputs validated via Zod schemas before processing
- **Audit logging**: All authentication events and data access logged to audit service
- **Principle of least privilege**: RBAC middleware enforces role-based access on all protected endpoints
- **Secure defaults**: New endpoints inherit security middleware (rate limiting, validation, authentication) by default
