# Go-Live Checklist — IAAS Platform

This checklist covers all items that must be completed, verified, or signed-off before the IAAS platform can accept live users. Items are grouped by category with ownership and status tracking.

**Target Go-Live Date**: TBD (estimated 18 months from POC completion)
**Last Updated**: 24 August 2026

> ## ⚠️ STATUS: POC ON SYNTHETIC DATA — SECURITY ITEMS ARE MOSTLY OPEN
>
> **The platform this checklist governs is a proof of concept operating exclusively on
> synthetic data.** An internal static code review on 24 August 2026 identified **three
> Critical and four High** security findings in the deployed source. Nine blocking security
> items (S16-S24) have been added below to track them, and one item previously marked Done
> (S9) is corrected to Not Started.
>
> See **`docs/security-known-gaps.md`** for the findings register. No real personal data is
> exposed today because the POC holds none; these items are blockers for any environment
> holding real debtor data.

---

## Security (24 items)

### Foundational Security Findings (added 24 August 2026 — all block go-live)

These derive from `docs/security-known-gaps.md`. S16-S18 address Critical findings.

| # | Item | Description | Owner | Status |
|---|------|-------------|-------|--------|
| S16 | **Token Integrity** | Replace unsigned base64 JSON tokens with signed tokens (RS256/EdDSA) verified on every request; reject on any verification failure. Tokens are currently forgeable — anyone can mint a `system_admin` token (GAP-001). | Backend Developer | **Not Started** |
| S17 | **API Authentication Enforced** | Apply authentication and permission middleware to every non-public route on the **deployed** service (`services/consolidated-api`), default-deny. All 13 mounted routers are currently unauthenticated (GAP-002). | Backend Developer | **Not Started** |
| S18 | **Password Verification** | Verify submitted passwords against a memory-hard KDF hash (Argon2id, or bcrypt cost ≥12). Any password is currently accepted (GAP-003). | Backend Developer | **Not Started** |
| S19 | **Malware Scanning Fail-Closed** | Deploy a real scanning engine; treat `scanned: false` as failure, never as a pass; withhold documents pending a successful scan. The deployed scanner currently infers infection from the filename (GAP-004). | DevOps Engineer | **Not Started** |
| S20 | **Resource Ownership Checks** | Enforce ownership/assignment constraints on all record-level routes; gate `PATCH /:id/status` behind an explicit decision permission (GAP-005). | Backend Developer | **Not Started** |
| S21 | **Audit Attribution** | Authenticate audit ingestion; derive actor identity from the verified token, never from the request body (GAP-006). | Backend Developer | **Not Started** |
| S22 | **Brute-Force Protection** | Per-account and per-IP login limits separate from the global limiter; temporary lockout with backoff; alert on lockout (GAP-008). | Backend Developer | **Not Started** |
| S23 | **Validation Wired In** | Apply the existing schemas as middleware on every route accepting input; add a CI check preventing handlers reading `req.body` unvalidated (GAP-009). | Backend Developer | **Not Started** |
| S24 | **Session Revocation** | Validate requests against server-side session state or a revocation list; shorten token lifetime with refresh rotation (GAP-010). | Backend Developer | **Not Started** |

### Original Security Items

| # | Item | Description | Owner | Status |
|---|------|-------------|-------|--------|
| S1 | ITHC Passed | Independent IT Health Check completed with no Critical/High findings unresolved. **Must be scoped to the deployed artefact rather than a staging topology, and conducted after S16-S24.** The existing `docs/ithc-penetration-test-report.md` is a simulated document whose "no critical or high" conclusion is superseded. | Security Engineer | Pending |
| S2 | CSP Configured | Content Security Policy headers block inline scripts, restrict sources. Currently explicitly disabled (`contentSecurityPolicy: false`). | DevOps Engineer | Pending |
| S3 | HSTS Enabled | HTTP Strict Transport Security with min 1-year max-age, includeSubDomains | DevOps Engineer | Pending |
| S4 | Secrets Rotated | All API keys, database passwords, and token signing keys rotated from development values. No token signing key exists yet — depends on S16. Verified positive: no secrets are committed to the repository today. | DevOps Engineer | Pending |
| S5 | Pen Test Remediated | All penetration test findings at Medium+ severity remediated and retested | Security Engineer | Pending |
| S6 | WAF Configured | Web Application Firewall rules active (OWASP Core Rule Set, rate limiting). Sequence after S16-S18 — a WAF in front of a service that authenticates no requests adds little. | DevOps Engineer | Pending |
| S7 | MFA Enforced | Multi-factor authentication mandatory for all staff/admin accounts. No MFA is implemented and no IdP integration exists to enforce it (GAP-007). | Security Engineer | Pending |
| S8 | Session Management | Session timeout configured (15min idle, 8hr absolute), secure cookie flags. Currently a single 8-hour token with no refresh, no idle timeout, and no server-side validity check. | Backend Developer | Pending |
| S9 | Input Validation | All user inputs validated server-side with appropriate error messages | Backend Developer | **Not Started** — *corrected from "Done" on 24 Aug 2026: the Zod schema package has zero importers outside its own tests and is dead code. Tracked as S23 (GAP-009).* |
| S10 | SQL Injection Prevention | Parameterised queries verified across all database operations | Backend Developer | **Done** — *verified genuine. All queries use `?` placeholders with user values bound; dynamic `WHERE` fragments are built only from hardcoded literals. No injection vector identified.* |
| S11 | XSS Prevention | Output encoding verified, React default escaping confirmed, dangerouslySetInnerHTML audited | Frontend Developer | Done — React auto-escaping confirmed. CSP is disabled (S2), so the defence-in-depth layer is absent. |
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
| Security | 24 | 3 | 21 | 0 |
| Accessibility | 8 | 5 | 3 | 0 |
| Performance | 8 | 1 | 7 | 0 |
| Data | 8 | 0 | 8 | 0 |
| Operations | 10 | 2 | 8 | 0 |
| Compliance | 6 | 1 | 5 | 0 |
| Launch | 5 | 0 | 5 | 0 |
| **TOTAL** | **69** | **12** | **57** | **0** |

Security count revised 24 August 2026: 15 → 24 items (S16-S24 added); Done 4 → 3 (S9 corrected
from Done to Not Started). Of the 21 open security items, **9 address Critical or High findings
in `docs/security-known-gaps.md` and block any use of real data.**

---

## Sign-Off

> ⚠️ **Not for signature.** Nine security items addressing Critical and High findings (S16-S24)
> are open. Sign-off should not be sought until those are closed and an independent ITHC (S1)
> has been completed against the remediated build.

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
