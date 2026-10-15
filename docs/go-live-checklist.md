# Go-Live Checklist — IAAS Platform

This checklist covers all items that must be completed, verified, or signed-off before the IAAS platform can accept live users. Items are grouped by category with ownership and status tracking.

**Target Go-Live Date**: TBD (estimated 18 months from POC completion)
**Last Updated**: 14 October 2026

> ## ⚠️ STATUS: POC ON SYNTHETIC DATA — PHASE 1 SECURITY BACKBONE DELIVERED
>
> **The platform this checklist governs is a proof of concept operating exclusively on
> synthetic data.** An internal static code review (24 August 2026) identified three Critical
> and four High findings in the deployed source. The **Phase 1 security backbone (October
> 2026) has since remediated them**: signed tokens, default-deny authentication, password
> verification, fail-closed malware scanning, resource ownership checks, authenticated audit
> attribution, brute-force limits, wired-in input validation and server-side session
> revocation (S16–S24, all Done). Input validation (S9) and the API Content Security Policy
> (S2) are likewise now Done.
>
> **Genuinely open blockers remain**, and they are host- or process-limited rather than
> unbuilt code: an independent ITHC against the deployed artefact (S1), HSTS on the GitHub
> Pages frontend (S3), encryption at rest (S13), real-IdP-enforced MFA (S7 / full GAP-007),
> pen-test remediation (S5) and WAF (S6). See **`docs/security-known-gaps.md`** for the
> findings register. No real personal data is exposed today because the POC holds none; these
> items are blockers for any environment holding real debtor data.

---

## Security (24 items)

### Foundational Security Findings (added 24 August 2026; delivered in the Phase 1 backbone, October 2026)

These derive from `docs/security-known-gaps.md` (Status column, all GAP-00x Remediated). S16-S18 address Critical findings.

| # | Item | Description | Owner | Status |
|---|------|-------------|-------|--------|
| S16 | **Token Integrity** | Replace unsigned base64 JSON tokens with signed tokens verified on every request; reject on any verification failure. | Backend Developer | **Done (Phase 1)** — HS256 signed tokens via `@aib-iaas/auth` (`signToken`/`verifyToken`), verified on every request; forged/tampered tokens rejected (GAP-001). RS256/JWKS foundation in place for the IdP cutover. |
| S17 | **API Authentication Enforced** | Apply authentication and permission middleware to every non-public route on the **deployed** service, default-deny. | Backend Developer | **Done (Phase 1)** — `enforceAuthentication` default-deny wired into `services/consolidated-api`, per-resource permission guards on each mount; the applicant-intake surface is public by design (GAP-002). |
| S18 | **Password Verification** | Verify submitted passwords against a memory-hard KDF hash. | Backend Developer | **Done (Phase 1)** — passwords verified against a stored hash; a wrong or empty password is rejected (GAP-003). |
| S19 | **Malware Scanning Fail-Closed** | Treat `scanned: false` as failure, never as a pass; withhold documents pending a successful scan. | DevOps Engineer | **Done (Phase 1)** — scanner fails closed; status computed from both `scanned` and `infected`; download withheld until confirmed clean (GAP-004). A real ClamAV engine remains a deployment dependency. |
| S20 | **Resource Ownership Checks** | Enforce ownership/assignment constraints on record-level routes; gate `PATCH /:id/status` behind an explicit decision permission. | Backend Developer | **Done (Phase 1)** — staff/owner scoping on reads and writes, approve/reject behind a decision permission with the actor taken from the token; anonymous read closed via signed per-application capability tokens. Anonymous write-intake remains open by design pending applicant identity (GAP-005). |
| S21 | **Audit Attribution** | Derive actor identity from the verified token, never from the request body. | Backend Developer | **Done (Phase 1)** — audit attribution taken from the authenticated principal, not body-supplied fields (GAP-006). |
| S22 | **Brute-Force Protection** | Per-account/per-IP login limits separate from the global limiter; temporary lockout with backoff. | Backend Developer | **Done (Phase 1)** — a dedicated `authRateLimiter` scoped to the login + verify-mfa routes, separate from the global limiter (GAP-008). |
| S23 | **Validation Wired In** | Apply the existing schemas as middleware on every route accepting input. | Backend Developer | **Done (Phase 1)** — `@aib-iaas/validation` schemas applied as route middleware (no longer dead code); handlers consume the validated body (GAP-009). |
| S24 | **Session Revocation** | Validate requests against server-side session state or a revocation list. | Backend Developer | **Done (Phase 1)** — sessions recorded server-side (`recordSession`/`sessionStore`) and checked on request, so logout/revocation takes effect (GAP-010). Shorter lifetimes + refresh rotation remain a hardening follow-up. |

### Original Security Items

| # | Item | Description | Owner | Status |
|---|------|-------------|-------|--------|
| S1 | ITHC Passed | Independent IT Health Check completed with no Critical/High findings unresolved. **Must be scoped to the deployed artefact rather than a staging topology, and conducted after S16-S24.** The existing `docs/ithc-penetration-test-report.md` is a simulated document whose "no critical or high" conclusion is superseded. | Security Engineer | Pending |
| S2 | CSP Configured | Content Security Policy headers block inline scripts, restrict sources. | DevOps Engineer | **Done (API surface)** — strict JSON-API CSP (`default-src 'none'; frame-ancestors 'none'`) set via the shared `securityHeaders()` middleware in the 1 October 2026 header remediation (closes ITHC VUL-001 on the API). The GitHub Pages frontend cannot send HTTP headers and carries a best-effort `<meta>` CSP; the full header set is staged in `_headers`/`staticwebapp.config.json` for a header-capable host (S3 remains open for the frontend). |
| S3 | HSTS Enabled | HTTP Strict Transport Security with min 1-year max-age, includeSubDomains | DevOps Engineer | Pending — set on the API via `securityHeaders()`, but the GitHub Pages frontend host cannot send it; kept open until a header-capable host serves the frontend. |
| S4 | Secrets Rotated | All API keys, database passwords, and token signing keys rotated from development values. A token signing key now exists (S16 done, injected as a secret); rotating it and all other secrets from development values remains a production-deploy task. Verified positive: no secrets are committed to the repository today. | DevOps Engineer | Pending |
| S5 | Pen Test Remediated | All penetration test findings at Medium+ severity remediated and retested | Security Engineer | Pending |
| S6 | WAF Configured | Web Application Firewall rules active (OWASP Core Rule Set, rate limiting). Sequenced after S16-S18 (now done) — the deployed service authenticates requests, so a WAF now adds defence-in-depth rather than standing in for absent authentication. | DevOps Engineer | Pending |
| S7 | MFA Enforced | Multi-factor authentication mandatory for all staff/admin accounts. Real server-side TOTP is now enforced (demo accounts), but full enforcement across all roles depends on real-IdP federation (GAP-007), which remains target. | Security Engineer | Pending |
| S8 | Session Management | Session timeout configured (15min idle, 8hr absolute), secure cookie flags. Server-side session validity/revocation is now checked (S24); a single 8-hour token with no idle timeout and no refresh rotation remains. | Backend Developer | Pending |
| S9 | Input Validation | All user inputs validated server-side with appropriate error messages | Backend Developer | **Done (Phase 1)** — the `@aib-iaas/validation` Zod schemas are wired in as route middleware (GAP-009 / S23); handlers consume the validated body rather than raw `req.body`. |
| S10 | SQL Injection Prevention | Parameterised queries verified across all database operations | Backend Developer | **Done** — *verified genuine. All queries use `?` placeholders with user values bound; dynamic `WHERE` fragments are built only from hardcoded literals. No injection vector identified.* |
| S11 | XSS Prevention | Output encoding verified, React default escaping confirmed, dangerouslySetInnerHTML audited | Frontend Developer | Done — React auto-escaping confirmed; the API CSP is now configured (S2) and the frontend carries a `<meta>` CSP, so the defence-in-depth layer is present. |
| S12 | Dependency Audit | No known Critical/High vulnerabilities in production dependencies (npm audit) | DevOps Engineer | Pending — Dependabot and `npm audit` in CI are configured |
| S13 | Encryption at Rest | Database encryption enabled (AWS RDS encryption), S3 bucket encryption (SSE-S3) | DevOps Engineer | Pending — POC uses unencrypted SQLite |
| S14 | Encryption in Transit | TLS 1.2+ enforced on all connections (API, database, inter-service) | DevOps Engineer | Pending — HTTPS enforced at the edge today |
| S15 | Security Headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy configured | Backend Developer | Done — via Helmet; CSP and HSTS tracked separately (S2, S3) |

### Additional Verified-Positive Controls

Recorded so that remediation does not disturb what already works: CORS is a fixed origin
allowlist on the deployed service; file upload size limit (10MB) and extension allowlist are
enforced; no secrets are committed (`sync: false` for `DATABASE_URL`); CI/CD workflows use
`pull_request` rather than `pull_request_target`, contain no script-injection sinks, and
authenticate to Azure via OIDC; NI number validation is correct including the real
invalid-prefix list.

---

## Accessibility (8 items)

| # | Item | Description | Owner | Status |
|---|------|-------------|-------|--------|
| A1 | WCAG AA Audit | Full WCAG 2.1 Level AA audit completed by certified accessibility specialist | Tester | Pending |
| A2 | Screen Reader Tested | All user journeys verified with NVDA (Windows) and VoiceOver (macOS) | Tester | Pending |
| A3 | Keyboard Navigation | All interactive elements reachable and operable via keyboard alone | Frontend Developer | Done |
| A4 | Colour Contrast | All text meets 4.5:1 contrast ratio (3:1 for large text) — verified via axe-core | Frontend Developer | Done |
| A5 | Focus Indicators | Visible focus indicators on all interactive elements (2px+ outline) | Frontend Developer | Done |
| A6 | Form Labels | All form inputs have associated labels, error messages linked via aria-describedby | Frontend Developer | Done |
| A7 | Alt Text | All images have appropriate alt text; decorative images have empty alt="" | Frontend Developer | Done |
| A8 | Responsive 200% Zoom | All content remains usable at 200% browser zoom without horizontal scrolling | Frontend Developer | Pending |

---

## Performance (8 items)

| # | Item | Description | Owner | Status |
|---|------|-------------|-------|--------|
| P1 | Load Tested | Application tested at 2x expected peak (1,000 concurrent users) — response times <2s | Tester | Pending |
| P2 | LCP Target | Largest Contentful Paint <2.5 seconds on 3G connection for all key pages | Frontend Developer | Pending |
| P3 | No Memory Leaks | 24-hour soak test shows stable memory usage (no upward trend) | Backend Developer | Pending |
| P4 | CDN Configured | Static assets served from CDN with appropriate cache headers (1 year immutable) | DevOps Engineer | Pending |
| P5 | Database Indexed | All frequent queries have appropriate indexes; explain plans reviewed | DBA | Pending |
| P6 | API Response Times | 95th percentile response time <500ms for all API endpoints under normal load | Backend Developer | Pending |
| P7 | Bundle Size | Frontend JavaScript bundle <200KB gzipped (excluding vendor chunks) | Frontend Developer | Pending |
| P8 | Image Optimisation | All images served in WebP/AVIF format with appropriate sizing (srcset) | Frontend Developer | Done |

---

## Data (8 items)

| # | Item | Description | Owner | Status |
|---|------|-------------|-------|--------|
| D1 | DPIA Complete | Data Protection Impact Assessment completed and approved by DPO | BA / DPO | Pending |
| D2 | Retention Policies | Automated data retention policies active (7 years for case data, 2 years for audit logs) | DBA | Pending |
| D3 | Backup Tested | Database backup and restore procedure tested; RTO <4 hours confirmed | DBA | Pending |
| D4 | GDPR Notices | Privacy notice published, cookie consent implemented, data subject rights process defined | BA | Pending |
| D5 | Data Migration | Migration from POC data verified; no test/synthetic data in production database | DBA | Pending |
| D6 | Seed Data Removed | All synthetic test data removed from production environment | DevOps Engineer | Pending |
| D7 | PII Handling | Personal data encrypted, access logged, minimum necessary principle applied | Security Engineer | Pending |
| D8 | Data Classification | All data fields classified (OFFICIAL, OFFICIAL-SENSITIVE) with appropriate handling | Security Engineer | Pending |

---

## Operations (10 items)

| # | Item | Description | Owner | Status |
|---|------|-------------|-------|--------|
| O1 | Monitoring Active | Infrastructure and application monitoring configured with alerting (Datadog/CloudWatch) | DevOps Engineer | Pending |
| O2 | Runbooks Complete | Operational runbooks written for all common scenarios (restart, scale, rollback, incident) | DevOps Engineer | Done |
| O3 | On-Call Rota | On-call rotation defined with escalation paths and contact details | Delivery Manager | Pending |
| O4 | Incident Process | Incident management process defined (severity levels, response times, comms templates) | Delivery Manager | Pending |
| O5 | Log Aggregation | Centralised logging configured with 30-day retention and search capability | DevOps Engineer | Pending |
| O6 | Health Checks | Health check endpoints configured for all services; load balancer uses them for routing | Backend Developer | Done |
| O7 | Auto-Scaling | Horizontal auto-scaling configured with appropriate min/max/target metrics | DevOps Engineer | Pending |
| O8 | Deployment Pipeline | Zero-downtime deployment pipeline tested (blue/green or rolling) | DevOps Engineer | Pending |
| O9 | Rollback Tested | Rollback procedure tested; can revert to previous version within 5 minutes | DevOps Engineer | Pending |
| O10 | Capacity Planning | 12-month capacity forecast documented with scaling triggers defined | DevOps Engineer | Pending |

---

## Compliance (6 items)

| # | Item | Description | Owner | Status |
|---|------|-------------|-------|--------|
| C1 | GDS Assessment | Service assessed against GDS Service Standard (14 points); all points met | Delivery Manager | Pending |
| C2 | ATO Signed | Authority to Operate signed by Senior Information Risk Owner (SIRO) | Security Engineer | Pending |
| C3 | DPO Approved | Data Protection Officer has reviewed and approved data processing activities | BA / DPO | Pending |
| C4 | Audit Trail Verified | Tamper-proof audit trail captures all state changes with user attribution | Backend Developer | Done |
| C5 | Records Management | Document retention aligned with Scottish Government records management policy | BA | Pending |
| C6 | Cyber Essentials Plus | Cyber Essentials Plus certification obtained for hosting infrastructure | Security Engineer | Pending |

---

## Launch (5 items)

| # | Item | Description | Owner | Status |
|---|------|-------------|-------|--------|
| L1 | DNS Configured | Production domain configured with appropriate TTL, CAA records, DNSSEC | DevOps Engineer | Pending |
| L2 | SSL Verified | SSL certificate valid, auto-renewal configured, certificate transparency logged | DevOps Engineer | Pending |
| L3 | Rollback Tested | Full rollback to previous version tested under production-like conditions | DevOps Engineer | Pending |
| L4 | Comms Sent | Launch communications sent to all stakeholders (staff, advisers, partner orgs) | Delivery Manager | Pending |
| L5 | Support Team Briefed | Support team trained on system, escalation paths confirmed, FAQ documented | Support Engineer | Pending |

---

## Summary

| Category | Total Items | Done | Pending | N/A |
|----------|-------------|------|---------|-----|
| Security | 24 | 14 | 10 | 0 |
| Accessibility | 8 | 5 | 3 | 0 |
| Performance | 8 | 1 | 7 | 0 |
| Data | 8 | 0 | 8 | 0 |
| Operations | 10 | 2 | 8 | 0 |
| Compliance | 6 | 1 | 5 | 0 |
| Launch | 5 | 0 | 5 | 0 |
| **TOTAL** | **69** | **23** | **46** | **0** |

Security counts: 15 → 24 items on 24 August 2026 (S16-S24 added). The Phase 1 backbone
(October 2026) delivered S16-S24, re-corrected S9 to Done (GAP-009 wired in) and marked S2 Done
(API CSP, 1 October header remediation), taking Security Done from 3 to 14. The remaining open
security items are **host- or process-limited** (ITHC against the deployed build S1, HSTS on the
Pages frontend S3, encryption at rest S13, real-IdP-enforced MFA S7, pen-test remediation S5,
WAF S6) rather than unbuilt code.

---

## Sign-Off

> ⚠️ **Not for signature.** The Phase 1 security backbone (S16-S24) is delivered, but sign-off
> should not be sought until the remaining blockers are closed — an independent ITHC (S1) against
> the remediated build, encryption at rest (S13), HSTS on the frontend host (S3), real-IdP-enforced
> MFA (S7) — and the Data, Compliance and Launch categories are completed for a real environment.

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Technical Lead | | | |
| Security Engineer | | | |
| Delivery Manager | | | |
| SIRO | | | |
| DPO | | | |

---

## Related Documents

- [**Security Known Gaps — Findings Register**](./security-known-gaps.md) — authoritative on current security state; source of items S16-S24
- [Authority to Operate](./authority-to-operate.md)
- [ITHC Penetration Test Report](./ithc-penetration-test-report.md) — conclusion superseded
- [Vendor Assessment](./vendor-assessment.md)
- [Architecture Decisions](./architecture-decisions.md)
- [Team Scaling Guide](./team-scaling-guide.md)
- [Roadmap](./roadmap.md)
