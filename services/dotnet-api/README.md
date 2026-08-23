# IAAS .NET 9 API — Production Backend

## Architecture

- **Pattern**: CQS (Command Query Separation) with MediatR
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Entity Framework Core 9
- **Auth**: JWT Bearer tokens
- **Validation**: FluentValidation

## Run locally

```bash
cd services/dotnet-api
dotnet run
```

API at http://localhost:5001

## Run with PostgreSQL

```bash
dotnet run --environment Production
```

Requires PostgreSQL at localhost:5432 (use Docker Compose).

## Docker

```bash
docker build -t iaas-dotnet-api .
docker run -p 5001:5001 iaas-dotnet-api
```

## CQS Pattern

Each feature is a self-contained folder:
```
Features/
├── Applications/Commands.cs  — CreateApplication, UpdateStatus, ListApplications, GetApplication
├── Auth/Commands.cs          — Login
├── Audit/Commands.cs         — CreateAuditEvent, GetAuditEvents
├── Organisations/Commands.cs — ListOrganisations
├── Users/Commands.cs         — ListUsers, ListRoles
├── Recommendations/Commands.cs — GenerateRecommendation
└── Integrations/Commands.cs  — RunAllChecks (parallel mock)
```

Commands modify state. Queries read state. MediatR dispatches.

## Switch frontend

```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

Same JSON contracts as Node.js backend — frontend works unchanged.

## Endpoints

| Method | Path | Type |
|--------|------|------|
| GET | /api/health | Query |
| GET | /api/smoke-test | Query |
| GET | /api/applications | Query |
| GET | /api/applications/{id} | Query |
| POST | /api/applications | Command |
| PATCH | /api/applications/{id}/status | Command |
| POST | /api/auth/login | Command |
| GET | /api/audit/events | Query |
| GET | /api/audit/events/{appId} | Query |
| POST | /api/audit/events | Command |
| GET | /api/organisations | Query |
| GET | /api/users | Query |
| GET | /api/roles | Query |
| POST | /api/recommend | Query |
| POST | /api/integrations/check-all | Query |
