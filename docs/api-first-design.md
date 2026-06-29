# API-First Design

## Principles

1. **Contract-first** — API contracts are defined before implementation
2. **Consumer-driven** — APIs serve frontend and integration needs
3. **Versioned** — All APIs are versioned (v1 prefix reserved for production)
4. **Consistent** — Standard response envelope, error format, pagination
5. **Documented** — Every endpoint has clear documentation

## API Response Envelope

All APIs return a consistent structure:

```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "pageSize": 20, "totalCount": 100, "totalPages": 5 },
  "error": null
}
```

Error responses:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": { "firstName": ["First name is required"] }
  }
}
```

## Core API Endpoints

### Applications API (API Gateway - port 3001)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/applications | Create new application |
| GET | /api/applications/:id | Get application by ID |
| PUT | /api/applications/:id | Update application data |
| POST | /api/applications/:id/submit | Submit application |
| GET | /api/applications | List applications (admin) |
| POST | /api/applications/:id/notes | Add staff note |

### Postcode Lookup

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/postcode/:postcode | Look up addresses by postcode |

### Recommendation API (port 3002)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/recommend | Get product recommendation |
| POST | /api/recommend/explain | Get AI-style explanation |

### Document API (port 3003)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/documents/upload | Upload document (multipart) |
| GET | /api/documents/:id | Get document metadata |
| GET | /api/documents/:id/download | Download document |
| DELETE | /api/documents/:id | Delete document |
| POST | /api/documents/:id/scan | Trigger virus scan |

### Integration API (port 3004)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/integrations/check-all | Run all system checks |
| POST | /api/integrations/check/:system | Check specific system |
| GET | /api/integrations/health | Integration health status |

### Payment API (port 3006)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/payments/initiate | Create payment session |
| POST | /api/payments/apple-pay | Process Apple Pay |
| POST | /api/payments/google-pay | Process Google Pay |
| POST | /api/payments/card | Process card payment |
| GET | /api/payments/:id/status | Get payment status |

### Audit API (port 3007)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/audit/events | Record event |
| GET | /api/audit/events/:applicationId | Get application audit trail |
| GET | /api/audit/events | Search/filter events |

## Authentication

POC uses simple base64-encoded token. Production would use:
- **Public users:** Scottish Government myaccount / OIDC
- **Staff users:** Active Directory / Azure AD via OIDC
- **Service-to-service:** mTLS + API keys

## Rate Limiting

| Tier | Limit |
|------|-------|
| Public (unauthenticated) | 20 req/min |
| Authenticated users | 100 req/15min |
| Staff/Admin | 500 req/15min |
| Service-to-service | 1000 req/min |
