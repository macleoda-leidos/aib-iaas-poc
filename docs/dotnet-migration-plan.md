# .NET 9 Migration Plan

## Overview

This document outlines the migration path from the current Node.js/Express POC backend to a production .NET 9 Web API.

## Current Architecture (Node.js)

| Component | Technology |
|-----------|-----------|
| API Framework | Express.js 4.18 |
| Language | TypeScript 5.4 |
| Database ORM | better-sqlite3 (repository pattern) |
| Validation | Zod schemas |
| Authentication | JWT (manual) |
| Testing | Vitest + Playwright |
| Deployment | Docker (Render.com) |

## Target Architecture (.NET 9)

| Component | Technology |
|-----------|-----------|
| API Framework | ASP.NET Core Minimal APIs |
| Language | C# 13 |
| Database ORM | Entity Framework Core 9 |
| Validation | FluentValidation |
| Authentication | ASP.NET Identity + Keycloak OIDC |
| Testing | xUnit + NUnit + Playwright |
| Deployment | Docker (Azure App Service / AWS ECS) |

## Migration Mapping

### Services → Controllers/Endpoints

| Current (Express) | Target (.NET) |
|-------------------|--------------|
| `services/api-gateway/src/routes/applications.ts` | `IAAS.Api/Endpoints/ApplicationEndpoints.cs` |
| `services/api-gateway/src/routes/auth.ts` | `IAAS.Api/Endpoints/AuthEndpoints.cs` |
| `services/audit-service/src/routes/audit.ts` | `IAAS.Api/Endpoints/AuditEndpoints.cs` |
| `services/recommendation-service/src/engine/rules.ts` | `IAAS.Api/Services/RecommendationEngine.cs` |
| `services/organisation-service/src/routes/organisations.ts` | `IAAS.Api/Endpoints/OrganisationEndpoints.cs` |
| `services/user-service/src/routes/users.ts` | `IAAS.Api/Endpoints/UserEndpoints.cs` |

### Repository Pattern (Already Aligned)

The current `@aib-iaas/database` package uses the repository pattern:
```
IApplicationRepository → ApplicationRepository (SQLite)
```

.NET equivalent:
```csharp
public interface IApplicationRepository
{
    Task<Application?> GetByIdAsync(string id);
    Task<IEnumerable<Application>> ListAsync(ApplicationFilter filter);
    Task<Application> CreateAsync(CreateApplicationDto dto);
    Task UpdateStatusAsync(string id, string status);
}

public class ApplicationRepository : IApplicationRepository
{
    private readonly IaasDbContext _context;
    // EF Core implementation
}
```

### Database Schema

The Prisma schema (`packages/database/prisma/schema.prisma`) maps directly to EF Core:

```csharp
public class Application
{
    public string Id { get; set; }
    public string ReferenceNumber { get; set; }
    public string Status { get; set; }
    public Applicant? Applicant { get; set; }
    public List<Address> Addresses { get; set; }
    public List<Debt> Debts { get; set; }
    public List<Asset> Assets { get; set; }
    public Recommendation? Recommendation { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### Validation

Zod → FluentValidation:

```csharp
public class CreateApplicationValidator : AbstractValidator<CreateApplicationDto>
{
    public CreateApplicationValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MinimumLength(2);
        RuleFor(x => x.NiNumber).Matches(@"^[A-Z]{2}\d{6}[A-Z]$");
        RuleFor(x => x.DateOfBirth).LessThan(DateTime.Today.AddYears(-16));
    }
}
```

## Migration Strategy

### Phase 1: Parallel Running (2 weeks)
1. Create .NET 9 solution: `IAAS.Api`
2. Implement health endpoint
3. Deploy alongside Node.js on same infrastructure
4. Verify builds and deploys

### Phase 2: Core Endpoints (4 weeks)
1. Applications CRUD
2. Authentication (Keycloak OIDC)
3. Audit logging
4. Recommendation engine port
5. Organisation service

### Phase 3: Full Migration (4 weeks)
1. All remaining endpoints
2. Document upload (S3/Blob)
3. Integration adapters (BASYS, eDEN, etc.)
4. Notification service

### Phase 4: Cutover (1 week)
1. Update frontend API_URL to .NET endpoint
2. Monitor for errors
3. Decommission Node.js service
4. Final performance testing

## Why .NET 9?

1. **Performance**: ASP.NET Core consistently outperforms Node.js in TechEmpower benchmarks
2. **Type Safety**: C# provides stronger compile-time guarantees than TypeScript
3. **Enterprise Support**: Long-term support, Microsoft backing, enterprise ecosystem
4. **Azure Integration**: Native Azure AD, App Service, SQL integration
5. **Team Capability**: Leidos has strong .NET capability across programmes
6. **Scottish Government**: .NET is widely used across Scottish Government digital services

## Frontend Impact

**Zero changes required.** The frontend (Next.js on GitHub Pages) calls REST APIs via `apiClient.ts`. Changing the backend URL from Render to Azure is a single environment variable change:

```
NEXT_PUBLIC_API_URL=https://iaas-api.azurewebsites.net
```

Same JSON contracts, same endpoints, same response shapes.

## Estimated Effort

| Phase | Duration | Team |
|-------|----------|------|
| Phase 1 (Setup) | 2 weeks | 1 .NET dev |
| Phase 2 (Core) | 4 weeks | 2 .NET devs |
| Phase 3 (Full) | 4 weeks | 2 .NET devs + 1 tester |
| Phase 4 (Cutover) | 1 week | Full team |
| **Total** | **11 weeks** | **~5 FTE-weeks** |

## Risk Mitigation

- Repository interfaces ensure database logic is identical
- Existing 648 tests validate behaviour (port tests to xUnit)
- Frontend is completely decoupled — no UI changes needed
- Parallel running eliminates big-bang risk
- Rollback: revert API_URL to Node.js endpoint (30 seconds)
