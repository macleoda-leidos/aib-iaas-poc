# IAAS .NET 9 API

Production-target backend for the IAAS platform.

## Run locally

```bash
cd services/dotnet-api
dotnet run
```

API available at http://localhost:5001

## Endpoints

- GET / — Service info
- GET /api/health — Health check
- GET /api/applications — List applications
- POST /api/applications — Create application
- POST /api/auth/login — Authenticate
- POST /api/recommend — Generate recommendation

## Docker

```bash
docker build -t iaas-dotnet-api .
docker run -p 5001:5001 iaas-dotnet-api
```

## Switch frontend to .NET API

```
NEXT_PUBLIC_API_URL=http://localhost:5001
```
