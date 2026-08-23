# IAAS Beta Platform — Readiness Assessment

## Current State

| Metric | Value |
|--------|-------|
| UI Pages | 57+ |
| Admin Features | 32 |
| AI Capabilities | 12+ |
| Automated Tests | 648 |
| Documentation | 36+ files |
| Live API | https://iaas-api.onrender.com |
| Live Frontend | https://macleoda-leidos.github.io/aib-iaas-poc/ |
| Sprints Delivered | 14 |
| Monthly Cost | £0 |

## What's Production-Ready

- ✅ Citizen self-service application journey (9 steps)
- ✅ Recommendation engine (rules-based, 7 products)
- ✅ Cross-system identity matching (fuzzy search)
- ✅ AI chatbot, anomaly detection, quality checks
- ✅ Role-based access control (9 roles)
- ✅ Comprehensive audit trail
- ✅ Creditor portal + Money adviser workspace
- ✅ 32 admin features
- ✅ Full documentation suite

## Remaining Production Work

### Must Have (Alpha)
1. Real ScotAccount/GOV.UK Login identity federation
2. Real credit bureau API (Experian sandbox → live)
3. Real BASYS/eDEN API connections
4. PostgreSQL migration (managed, Multi-AZ)
5. Document storage (S3/R2)
6. ITHC penetration testing (CHECK-accredited)
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
| BASYS API unavailable | High | Medium | Mock service fallback, queue-based retry |
| Identity federation delays | High | Medium | Interim username/password with MFA |
| ITHC findings | Medium | High | Security-first design, early remediation |
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

The POC implements defence-in-depth patterns that carry forward to production:

1. **Authentication**: Simulated identity → Keycloak OIDC federation
2. **Authorisation**: RBAC with 9 roles, permission matrix enforced at API layer
3. **Transport**: HTTPS everywhere (Render.com TLS → AWS Certificate Manager)
4. **Input validation**: Zod schemas shared frontend/backend → FluentValidation
5. **Rate limiting**: Express rate-limit → AWS WAF + API Gateway throttling
6. **Audit**: Full event trail with actor, timestamp, IP, action
7. **Headers**: Helmet.js security headers → CloudFront response headers policy
8. **CORS**: Whitelist-only origin policy
9. **Data**: No real PII in POC; production will use encryption at rest (KMS)

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

The 14 sprints of delivery have produced a comprehensive prototype covering the full citizen journey, staff workflows, creditor access, and AI-assisted decision support. Every integration point is abstracted behind interfaces, making the transition from mock to real systems a configuration change rather than a rewrite.

**Recommendation**: Proceed to Alpha phase with 3.5 FTE team, focusing on identity federation, real system integration, and ITHC security testing. The POC provides sufficient evidence of feasibility and architectural soundness to justify the investment.
