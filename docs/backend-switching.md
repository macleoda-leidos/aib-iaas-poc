# Backend Switching — Node.js ↔ .NET 9

## Overview

The IAAS platform has TWO fully-functional backends that produce identical JSON responses:

| Backend | Technology | URL | Status |
|---------|-----------|-----|--------|
| Node.js | Express.js + TypeScript | https://iaas-api.onrender.com | ✅ Live (Render) |
| .NET 9 | ASP.NET Core + MediatR + CQS | http://localhost:5001 | ✅ Local (Docker) |

The frontend works with EITHER backend unchanged — same endpoints, same JSON.

## How to Switch

### Option 1: UI Toggle (Runtime)

1. Go to `/admin/feature-flags`
2. In the "Backend API" section, click either "Node.js (Render)" or ".NET 9 (Local)"
3. Page reloads with the new backend active
4. The API Status Bar shows which backend is connected

### Option 2: Environment Variable (Build Time)

```bash
# Node.js backend (default)
NEXT_PUBLIC_API_URL=https://iaas-api.onrender.com

# .NET backend (local Docker)
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Option 3: localStorage (Developer)

```javascript
// Switch to .NET
localStorage.setItem('iaas-backend-url', 'http://localhost:5001');
location.reload();

// Switch back to Node.js
localStorage.removeItem('iaas-backend-url');
location.reload();
```

## Running the .NET Backend

```bash
cd services/dotnet-api
dotnet run
```

API available at http://localhost:5001

Or with Docker:
```bash
docker build -t iaas-dotnet-api services/dotnet-api
docker run -p 5001:5001 iaas-dotnet-api
```

## Endpoint Parity

Both backends implement ALL 11 endpoint groups identically:

| Endpoint | Node.js | .NET 9 |
|----------|---------|--------|
| GET /api/health | ✅ | ✅ |
| GET/POST /api/applications | ✅ | ✅ |
| POST /api/auth/login | ✅ | ✅ |
| GET/POST /api/audit/events | ✅ | ✅ |
| GET /api/organisations | ✅ | ✅ |
| GET /api/users | ✅ | ✅ |
| GET /api/roles | ✅ | ✅ |
| POST /api/recommend | ✅ | ✅ |
| POST /api/integrations/check-all | ✅ | ✅ |
| POST /api/documents/upload | ✅ | ✅ |
| POST /api/payments/initiate | ✅ | ✅ |
| POST /api/credit-check/run | ✅ | ✅ |
| POST /api/notifications/send | ✅ | ✅ |

## Architecture Comparison

| Aspect | Node.js | .NET 9 |
|--------|---------|--------|
| Pattern | Express routes → Repository | MediatR CQS (Commands/Queries → Handlers) |
| Database | SQLite (better-sqlite3) | EF Core (SQLite dev, PostgreSQL prod) |
| Auth | Manual JWT | ASP.NET JWT Bearer |
| Validation | Zod schemas | FluentValidation |
| Testing | Vitest | xUnit (planned) |
| Deployment | Render.com (free) | Azure App Service / Docker |

## Why Two Backends?

1. **De-risks migration**: Proves .NET works before committing to full rewrite
2. **Demo power**: "Same app, two backends — click to switch" is compelling
3. **Team flexibility**: Node.js developers work on POC, .NET developers on production
4. **Gradual transition**: Can route specific endpoints to .NET while others stay Node.js
