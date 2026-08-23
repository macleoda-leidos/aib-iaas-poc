# API & SDK Guide — IAAS Platform

This guide provides everything needed to consume the IAAS API programmatically, whether building integrations, automating workflows, or developing client applications.

---

## Base URL

```
Production:  https://iaas-api.onrender.com
Local Dev:   http://localhost:3001
```

All endpoints are prefixed with `/api/`.

---

## Authentication

The API uses JWT Bearer token authentication. Obtain a token by posting credentials to the login endpoint.

### Login

```bash
curl -X POST https://iaas-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.chen@aib.gov.uk",
    "password": "password123"
  }'
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_001",
    "email": "sarah.chen@aib.gov.uk",
    "name": "Sarah Chen",
    "role": "senior_caseworker"
  }
}
```

### Using the Token

Include the token in the `Authorization` header for all subsequent requests:

```bash
curl https://iaas-api.onrender.com/api/applications \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Tokens expire after 8 hours. Re-authenticate to obtain a fresh token.

---

## Endpoints Overview

| Group | Base Path | Description |
|-------|-----------|-------------|
| Auth | `/api/auth` | Login, logout, token refresh |
| Applications | `/api/applications` | Create, read, update, list applications |
| Recommendations | `/api/recommendations` | Get product recommendations for an application |
| Users | `/api/users` | List users, get user by ID, filter by role |
| Organisations | `/api/organisations` | List organisations, get organisation details |
| Audit | `/api/audit` | Query audit trail events |
| Documents | `/api/documents` | Upload and retrieve documents |
| Payments | `/api/payments` | Payment status and history |
| Health | `/api/smoke-test` | System health check (no auth required) |

---

## Examples

### Create an Application

```bash
curl -X POST https://iaas-api.onrender.com/api/applications \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "applicant": {
      "firstName": "James",
      "lastName": "Morrison",
      "dateOfBirth": "1985-03-15",
      "niNumber": "AB123456C",
      "address": {
        "line1": "42 High Street",
        "city": "Edinburgh",
        "postcode": "EH1 1AA"
      }
    },
    "financial": {
      "monthlyIncome": 2200,
      "monthlyExpenses": 1800,
      "totalDebts": 45000
    },
    "debts": [
      { "creditor": "Bank of Scotland", "amount": 25000, "type": "personal_loan" },
      { "creditor": "Barclaycard", "amount": 12000, "type": "credit_card" },
      { "creditor": "HMRC", "amount": 8000, "type": "tax" }
    ]
  }'
```

**Response** (201 Created):
```json
{
  "id": "app_2024_00156",
  "status": "submitted",
  "createdAt": "2026-08-23T10:30:00Z",
  "reference": "IAAS-2024-00156"
}
```

### TypeScript Example — Create Application

```typescript
const response = await fetch('https://iaas-api.onrender.com/api/applications', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    applicant: {
      firstName: 'James',
      lastName: 'Morrison',
      dateOfBirth: '1985-03-15',
      niNumber: 'AB123456C',
      address: { line1: '42 High Street', city: 'Edinburgh', postcode: 'EH1 1AA' },
    },
    financial: { monthlyIncome: 2200, monthlyExpenses: 1800, totalDebts: 45000 },
    debts: [
      { creditor: 'Bank of Scotland', amount: 25000, type: 'personal_loan' },
      { creditor: 'Barclaycard', amount: 12000, type: 'credit_card' },
      { creditor: 'HMRC', amount: 8000, type: 'tax' },
    ],
  }),
});

const application = await response.json();
console.log(`Created: ${application.reference}`);
```

### Get Recommendation

```bash
curl https://iaas-api.onrender.com/api/recommendations/app_2024_00156 \
  -H "Authorization: Bearer <token>"
```

**Response** (200 OK):
```json
{
  "applicationId": "app_2024_00156",
  "recommendedProduct": "protected_trust_deed",
  "confidence": 0.87,
  "alternatives": [
    { "product": "sequestration", "confidence": 0.72 },
    { "product": "debt_arrangement_scheme", "confidence": 0.45 }
  ],
  "factors": [
    { "name": "debt_to_income_ratio", "value": 20.45, "impact": "high" },
    { "name": "asset_value", "value": 0, "impact": "medium" },
    { "name": "creditor_count", "value": 3, "impact": "low" }
  ]
}
```

### TypeScript Example — Get Recommendation

```typescript
const response = await fetch(
  `https://iaas-api.onrender.com/api/recommendations/${applicationId}`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);

const recommendation = await response.json();
console.log(`Recommended: ${recommendation.recommendedProduct} (${Math.round(recommendation.confidence * 100)}% confidence)`);
```

### List Users with Role Filter

```bash
curl "https://iaas-api.onrender.com/api/users?role=caseworker" \
  -H "Authorization: Bearer <token>"
```

**Response** (200 OK):
```json
{
  "users": [
    { "id": "usr_001", "name": "Sarah Chen", "email": "sarah.chen@aib.gov.uk", "role": "senior_caseworker" },
    { "id": "usr_002", "name": "Michael Brown", "email": "m.brown@aib.gov.uk", "role": "caseworker" }
  ],
  "total": 2,
  "page": 1,
  "pageSize": 20
}
```

---

## Rate Limiting

The API enforces rate limiting to ensure fair usage and system stability.

| Limit | Value |
|-------|-------|
| Requests per window | 500 |
| Window duration | 15 minutes |
| Header: remaining | `X-RateLimit-Remaining` |
| Header: reset | `X-RateLimit-Reset` (Unix timestamp) |
| Exceeded response | 429 Too Many Requests |

When rate limited, wait until the `X-RateLimit-Reset` timestamp before retrying. Implement exponential backoff for production integrations.

---

## Error Handling

The API returns consistent error responses across all endpoints.

| Status | Meaning | Example |
|--------|---------|---------|
| 400 | Validation Error | Missing required field, invalid format |
| 401 | Unauthorised | Missing or expired token |
| 403 | Forbidden | Insufficient role permissions |
| 404 | Not Found | Application/user does not exist |
| 429 | Rate Limited | Too many requests in window |
| 500 | Server Error | Unexpected internal error |

**Error Response Format**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "applicant.niNumber", "message": "Must be a valid National Insurance number" },
      { "field": "financial.monthlyIncome", "message": "Must be a positive number" }
    ]
  }
}
```

---

## Versioning

The current API is unversioned (v0 / POC). Future production releases will use URL path versioning:

```
/api/v1/applications    (stable, production)
/api/v2/applications    (breaking changes, with migration period)
```

Breaking changes will never be made to a versioned endpoint. Deprecated versions will receive 6 months notice before removal.

---

## SDK Generation

The IAAS API provides an OpenAPI 3.0 specification that can be used to auto-generate client SDKs for any programming language.

**OpenAPI Spec URL**: https://iaas-api.onrender.com/api-docs/openapi

### Generate a TypeScript SDK

```bash
npx @openapitools/openapi-generator-cli generate \
  -i https://iaas-api.onrender.com/api-docs/openapi \
  -g typescript-fetch \
  -o ./generated/iaas-client
```

### Generate a Python SDK

```bash
npx @openapitools/openapi-generator-cli generate \
  -i https://iaas-api.onrender.com/api-docs/openapi \
  -g python \
  -o ./generated/iaas-python-client
```

### Generate a C# SDK

```bash
npx @openapitools/openapi-generator-cli generate \
  -i https://iaas-api.onrender.com/api-docs/openapi \
  -g csharp-netcore \
  -o ./generated/iaas-csharp-client
```

Supported generators include: TypeScript, Python, Java, C#, Go, Ruby, PHP, Kotlin, Swift, and 40+ more languages via the OpenAPI Generator project.

---

## Demo Accounts

For testing purposes, the following demo accounts are available:

| Email | Password | Role |
|-------|----------|------|
| sarah.chen@aib.gov.uk | password123 | Senior Caseworker |
| m.brown@aib.gov.uk | password123 | Caseworker |
| admin@aib.gov.uk | password123 | System Administrator |
| adviser@moneyadvice.org | password123 | Money Adviser |

**Note**: These accounts contain synthetic data only. No real personal information is stored.

---

## Related Documents

- [API Documentation (Interactive)](https://macleoda.github.io/aib-iaas-poc/api-docs)
- [OpenAPI Specification](https://macleoda.github.io/aib-iaas-poc/api-docs/openapi)
- [Architecture Decisions](./architecture-decisions.md)
- [Go-Live Checklist](./go-live-checklist.md)
