# IAAS Beta Platform — Readiness Assessment

> ## ⚠️ STATUS: POC ON SYNTHETIC DATA — PHASE 1 SECURITY BACKBONE DELIVERED
>
> **This assessment describes a proof of concept operating exclusively on synthetic data.** The
> **Phase 1 security backbone (October 2026)** has implemented the controls the "Security
> Posture" section previously listed as target-only: signed-token verification, default-deny
> authentication and authorisation, password verification, fail-closed malware scanning,
> resource ownership checks, authenticated audit attribution, brute-force limits, wired-in input
> validation and server-side session revocation.
>
> An internal static code review (24 August 2026) had identified three Critical and four High
> findings in the deployed source; `docs/security-known-gaps.md` now records GAP-001…GAP-010 as
> **Remediated (Phase 1)** and GAP-011 residual #1/#2/#4 delivered. **The platform is still not
> ready for Beta with real users or real data**: real-IdP federation (full GAP-007), an ITHC
> against the deployed build, encryption at rest and HSTS on the frontend host remain open.
>
> See **`docs/security-known-gaps.md`** for the full findings register. No real personal data is
> exposed today because the POC holds none; the remaining items are blockers for any environment
> holding real debtor data.

## Current State

| Metric | Value |
|--------|-------|
| UI Pages | 57+ |
| Admin Features | 32 |
| AI Capabilities | 12+ |
| Automated Tests | 1,078 vitest tests across 60 files (see `docs/testing.md`) |
| Documentation | 36+ files |
| Live API | https://iaas-api.onrender.com |
| Live Frontend | https://macleoda-leidos.github.io/aib-iaas-poc/ |
| Sprints Delivered | 30 (see `docs/roadmap.md`) |
| Monthly Cost | £0 |

## What's Production-Ready

**Functionally complete** (feature-complete for demonstration; the Phase 1 security backbone is now applied to the deployed API — see Security Posture):

- ✅ Citizen self-service application journey (9 steps)
- ✅ Recommendation engine (rules-based, 7 products)
- ✅ Cross-system identity matching (fuzzy search)
- ✅ AI chatbot, anomaly detection, quality checks
- ✅ 32 admin features
- ✅ Full documentation suite

**Prototype / interface demonstration** (screens exist and are navigable, but are static mocks with no service behind them):

- 🎯 **TARGET** Creditor portal (`/creditor-portal`) — **Not implemented.** Hardcoded synthetic cases, dividends and proposals; no API calls. The claim form is self-labelled a placeholder and the Accept/Reject voting controls are disabled. No `claims` resource or permission exists in `packages/database/src/seed-data/permissions.json`.
- 🎯 **TARGET** Money adviser workspace (`/adviser-workspace`) — **Not implemented.** Hardcoded synthetic clients, appointments and activity; no API calls. "Submit on Behalf" links to the standard citizen wizard with no client context or authority declaration; "New Client" is disabled. See UC-09 / US-011 for the specified behaviour.

**Security backbone now applied (Phase 1):**

- ✅ Role-based access control (10 roles) — the enforcing middleware is now applied to the deployed service with **default-deny** and per-resource permissions (GAP-002 remediated); the UI and API both respect roles. Residual: the scoping qualifiers "own"/"assigned"/"relevant" (GAP-011 #3) are not yet modelled as permissions.
- ✅ Comprehensive audit trail — ingestion is authenticated and the actor is derived from the **verified token**, not the request body, so entries are no longer forgeable (GAP-006 remediated). Append-only storage + hash chaining remain target state.

## Remaining Production Work

### Must Have (Alpha)
0. **Security remediation — delivered in the POC (Phase 1).** The 3 Critical and 4 High findings in `docs/security-known-gaps.md` are remediated: signed token verification (GAP-001), authentication and authorisation on all deployed routes (GAP-002), real password verification (GAP-003), fail-closed malware scanning (GAP-004), resource ownership checks (GAP-005), authenticated audit attribution (GAP-006) and real server-side TOTP (GAP-007 — partial; real-IdP federation outstanding). **Still blocking real-data use:** a static re-review plus an ITHC against the deployed build. Items 1 and 6 below remain.
1. Real ScotAccount/GOV.UK Login identity federation (subsumes GAP-001, GAP-003, GAP-007 if delegated to the IdP)
2. Real credit bureau API (Experian sandbox → live)
3. Real BASYS/eDEN API connections
4. PostgreSQL migration (managed, Multi-AZ)
5. Document storage (S3/R2)
6. ITHC penetration testing (CHECK-accredited) — must be scoped to the **deployed** artefact, not a staging topology, and conducted **after** item 0. The existing `docs/ithc-penetration-test-report.md` is a simulated document whose conclusion has been superseded.
7. WCAG 2.1 AA full audit + remediation
8. GDS service assessment panel

### Should Have (Beta)
1. GOV.UK Notify for emails/SMS
2. GOV.UK Pay for payments
3. Full case workflow automation
4. Multi-channel notifications
5. Reporting (Power BI/Grafana)
6. Disaster recovery (Multi-AZ, automated failover)

### Could Have (Live)
1. Machine learning recommendations
2. Mobile native app
3. Open Banking income verification
4. Real-time collaboration
5. Event-driven architecture

## Architecture Roadmap

### Current (POC)
```
GitHub Pages → Render.com (Express.js + SQLite)
```

### Target (Alpha)
```
CloudFront → ALB → ECS Fargate (Express.js + PostgreSQL)
                               + Keycloak
                               + S3
```

### Target (Production)
```
CloudFront → ALB → ECS Fargate (.NET 9 + PostgreSQL)
                               + Keycloak (managed)
                               + S3 + SES
                               + EventBridge
                               + CloudWatch
```

## .NET 9 API Migration Plan

The current Node.js/Express backend maps cleanly to .NET 9:

| Current (Node.js) | Target (.NET 9) |
|-------------------|-----------------|
| Express.js routes | ASP.NET Minimal APIs |
| better-sqlite3 | Entity Framework Core |
| @aib-iaas/database repositories | IRepository<T> pattern |
| Zod validation | FluentValidation |
| axios HTTP client | HttpClient + Refit |
| Vitest | xUnit + NUnit |
| Docker (node:20-alpine) | Docker (mcr.microsoft.com/dotnet/aspnet:9.0) |

Migration approach:
1. .NET 9 Web API project (`IAAS.Api`)
2. Entity Framework Core with existing PostgreSQL schema
3. Same REST endpoints, same JSON contracts
4. Frontend unchanged (just points to new API URL)
5. Parallel running during transition

## PostgreSQL Schema (Production)

Already defined in `packages/database/prisma/schema.prisma`:
- 15 models: User, Role, Organisation, Application, Applicant, Address, Debt, Asset, Document, Recommendation, AuditEvent, Payment, Session, Permission, RolePermission
- Indexes on: email, reference_number, status, application_id, timestamp
- Foreign keys with CASCADE delete
- JSON fields for flexible data (income, expenditure, factors)

## Integration Roadmap

| System | POC (Mock) | Alpha (Sandbox) | Live |
|--------|-----------|-----------------|------|
| BASYS | ✅ Mock client | Test environment | Real API |
| eDEN | ✅ Mock client | Test environment | Real API |
| DAS Register | ✅ Mock client | Test environment | Real API |
| CFT | ✅ Mock client | Test environment | Real API |
| Moratorium | ✅ Mock client | Test environment | Real API |
| RoI | ✅ Mock client | Test environment | Real API |
| Credit Bureau | ✅ Synthetic | Experian sandbox | Experian live |
| ScotAccount | ✅ Simulated | Test IdP | SAML federation |
| GOV.UK Login | ✅ Simulated | Test OIDC | Production OIDC |
| GOV.UK Pay | ✅ Mock | Sandbox | Live |
| GOV.UK Notify | ✅ Mock | Test key | Production key |

## Funding Roadmap

| Phase | Duration | Team | Estimated Cost |
|-------|----------|------|---------------|
| POC (current) | Complete | 1 FTE | £0 |
| Alpha | 6 months | 3.5 FTE | £175k |
| Beta | 6 months | 7 FTE | £350k |
| Live | 6 months | 10 FTE | £500k |
| BAU | Ongoing | 4 FTE | £200k/year |

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Re-review/ITHC not completed before real data introduced** | **Critical** | — | Phase 1 **remediated** the Critical/High findings in the POC (`docs/security-known-gaps.md`); the residual risk is shipping real data before a static re-review + ITHC against the deployed build. Mitigation: no real data in any environment until that re-review passes (Alpha item 0). |
| BASYS API unavailable | High | Medium | Mock service fallback, queue-based retry |
| Identity federation delays | High | Medium | Interim credential login now has **real password verification, brute-force limits and server-side TOTP** (GAP-003/008 remediated; GAP-007 partial), so it is a viable interim fallback; full real-IdP federation remains the target |
| ITHC findings | High | High | The internal static review found 3 Critical and 4 High, now **remediated in the POC**. An accredited ITHC against the remediated build should still be expected to find issues. Early remediation per Alpha item 0. |
| Team scaling | Medium | Medium | Documented architecture, onboarding guides |
| Budget constraints | High | Low | Phased delivery, cloud cost optimisation |

## Performance Targets

| Metric | POC (Current) | Alpha Target | Production Target |
|--------|---------------|--------------|-------------------|
| Page load (P95) | <2s | <1.5s | <1s |
| API response (P95) | <500ms | <300ms | <200ms |
| Availability | Best effort | 99.5% | 99.9% |
| Recovery time | Manual | <1 hour | <15 minutes |
| Concurrent users | ~50 | 500 | 5,000 |

## Security Posture

The POC establishes security *patterns* that carry forward to production, but most are not
yet implemented as controls. The table below separates the two honestly. Full evidence in
`docs/security-known-gaps.md`.

| # | Area | Implemented in POC | Target state |
|---|------|-------------------|--------------|
| 1 | **Authentication** | ✅ **Signed tokens.** HS256 tokens via `@aib-iaas/auth`, verified per request (GAP-001); passwords verified against a stored hash (GAP-003); real server-side TOTP enforced for demo accounts, and a working mock OIDC flow with first-login provisioning + account picker (GAP-007 — real IdP outstanding). | Identity-provider OIDC federation with enforced MFA and RS256 tokens verified against the IdP's JWKS |
| 2 | **Authorisation** | ✅ **Enforced, default-deny.** Every deployed route authenticates and applies per-resource permissions (GAP-002); record-level ownership scoping with approve/reject behind a decision permission (GAP-005). Residual: scoping qualifiers (GAP-011 #3). | RBAC with 10 roles enforced at the API layer, default-deny, with full ownership constraints |
| 3 | **Transport** | ✅ HTTPS everywhere (Render.com and GitHub Pages managed TLS). HSTS set on the API; the Pages frontend host cannot send it. | AWS Certificate Manager, TLS 1.3, HSTS with preload on all hosts |
| 4 | **Input validation** | ✅ **Wired in.** `@aib-iaas/validation` Zod schemas are applied as route middleware (GAP-009); handlers consume the validated body. SQL injection remains completely prevented by universal query parameterisation. | Schema validation on every endpoint → FluentValidation in .NET |
| 5 | **Rate limiting** | ✅ Global limiter (500/15min, correct 429 handling) **plus a dedicated per-account/per-IP limiter on the login + verify-mfa routes** (GAP-008). | AWS WAF + API Gateway throttling, per-account login limits |
| 6 | **Audit** | ✅ Events recorded with actor, timestamp, action; ingestion authenticated and the actor **derived from the verified token** (GAP-006). Append-only storage + hash chaining remain target state. | Server-derived attribution, append-only storage, hash chaining |
| 7 | **Headers** | ✅ Helmet applied with a strict JSON-API CSP (`default-src 'none'`), HSTS, nosniff, frame-deny, referrer and permissions policy on the API (1 Oct 2026 remediation). The Pages frontend carries a best-effort `<meta>` CSP. | CloudFront response headers policy with strict CSP on all hosts |
| 8 | **CORS** | ✅ **Genuine.** Fixed origin allowlist on the deployed service; no wildcard. | Unchanged |
| 9 | **Data** | ✅ No real PII in the POC — all data synthetic. No encryption at rest (SQLite on attached disk). | Encryption at rest via KMS; UK data residency |
| 10 | **Malware scanning** | ✅ **Fails closed.** Status is computed from both `scanned` and `infected`; a scan that did not run is `scan_failed`, never clean, and downloads are withheld until confirmed clean (GAP-004). A real ClamAV engine remains a deployment dependency. Size limits and extension allowlist are genuinely enforced. | Real scanning engine, fail-closed, quarantine workflow |
| 11 | **Secrets & CI/CD** | ✅ **Genuine.** No committed secrets; `DATABASE_URL` injected via `sync: false`. CI uses `pull_request` (not `pull_request_target`), no script-injection sinks, Azure auth via OIDC. | Unchanged, plus secret rotation |

**Genuine security strengths to preserve through migration:** universal query parameterisation
(no SQL injection vector anywhere), secret hygiene, CI/CD pipeline integrity, CORS restriction,
upload size and extension limits, and correct NI number validation.

**Blocking security work before Beta with real users:** real-IdP federation (full GAP-007), a
static re-review plus an ITHC against the deployed build, encryption at rest, and HSTS on the
frontend host. GAP-001 through GAP-010 are **remediated in the POC (Phase 1)**; see
`docs/security-known-gaps.md`.

## Accessibility Compliance

Current state: GOV.UK Design System patterns followed throughout. Full WCAG 2.1 AA audit required before public beta. Key areas:

- Semantic HTML structure with ARIA landmarks
- Keyboard navigation throughout
- Screen reader tested (VoiceOver, NVDA)
- Colour contrast ratios meeting AA minimum
- Focus management on route changes
- Error messages associated with form fields
- Skip links and progressive disclosure

## Conclusion

The IAAS POC has demonstrated the viability of a unified digital insolvency platform. The architectural decisions (microservices, repository pattern, interface abstraction, static frontend) provide a clear migration path to .NET 9 + PostgreSQL production without rewriting the frontend. The platform is ready for Alpha funding.

The 30 sprints of delivery have produced a comprehensive prototype covering the full citizen journey, staff workflows, creditor access, and AI-assisted decision support. Every integration point is abstracted behind interfaces, making the transition from mock to real systems a configuration change rather than a rewrite.

**Recommendation**: Proceed to Alpha phase with 3.5 FTE team, focusing on identity federation, real system integration, and ITHC security testing. The POC provides sufficient evidence of feasibility and architectural soundness to justify the investment.
