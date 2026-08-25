# Administration Guide

## AiB IAAS — Initial Application Advice Service

**Version:** 1.0
**Classification:** OFFICIAL
**Date:** August 2026
**Author:** AiB Digital Services

---

## 1. User Management

### Creating Users

Users are provisioned through the Keycloak administration console or via the IAAS admin portal:

**Via Admin Portal (Recommended):**
1. Navigate to Admin Portal → User Management → Create User
2. Enter required fields: name, email, organisation
3. Select primary role from the 9 available roles
4. Set initial authentication method (email invitation or temporary password)
5. Submit — user receives onboarding email with MFA setup instructions

**Via Keycloak Console (System Administrators):**
1. Access Keycloak at `http://localhost:8080` (local) or `https://auth.iaas.aib.gov.uk/admin` (production)
2. Login with admin credentials (local: admin/admin)
3. Navigate to Users → Add User
4. Configure attributes, role mappings, and required actions
5. Set "Verify Email" and "Configure OTP" as required actions

### Assigning Roles

Role assignment follows a controlled process:
- **Self-service roles** (debtor) — Automatically assigned on citizen registration
- **Verified roles** (money_adviser, creditor, supplier) — Require organisation verification before activation
- **Internal roles** (aib_officer, aib_senior_officer, statistician, cyberops_analyst) — Require senior officer approval and line manager confirmation
- **Privileged roles** (system_admin) — Require two-person approval (senior officer + existing system_admin)

### Suspending Accounts

Account suspension is immediate and revocable:
1. Navigate to User Management → Find User
2. Select "Suspend Account" — all active sessions are terminated within 60 seconds
3. Suspended users cannot authenticate; existing tokens are invalidated
4. Reactivation requires the same approval level as original role assignment

---

## 2. Role Management

### Role Hierarchy

| Role | Scope | Typical User | Approval Required |
|------|-------|-------------|-------------------|
| system_admin | Full system access | IT operations | Two-person (senior officer + existing admin) |
| aib_senior_officer | Case oversight, rule approval, reporting | Senior AiB staff | Line manager |
| aib_officer | Case processing, application review | AiB case workers | Senior officer |
| money_adviser | Client management, application creation | Qualified money advisers | Organisation verification |
| creditor | View relevant cases, submit claims | Creditor representatives | Organisation verification |
| supplier | Manage assigned cases | Appointed trustees | Senior officer |
| aib_readonly | View-only access | Audit and oversight staff | Senior officer |
| debtor | Own application management | Citizens | Self-registration |
| statistician | Anonymised reporting and analytics | Research analysts | Senior officer |
| cyberops_analyst | Security monitoring and audit | Security operations | System admin |

### Permission Changes

Permission modifications to existing roles require:
1. Change request documenting the business justification
2. Security impact assessment
3. Senior officer approval
4. Implementation in Keycloak with audit trail
5. Verification testing across affected workflows
6. Communication to affected users

### Multi-Role Assignment

A user may hold multiple roles where business need is demonstrated. Restrictions:
- debtor + any staff role is prohibited (conflict of interest)
- cyberops_analyst + system_admin requires CISO approval
- All multi-role assignments logged and reviewed quarterly

---

## 3. Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Runtime environment | `development` | Yes |
| `API_GATEWAY_PORT` | API Gateway listen port | `3001` | Yes |
| `DATABASE_URL` | Database connection string (PostgreSQL) | `postgresql://iaas:iaas@localhost:5432/iaas` | Prod |
| `DATABASE_PATH` | SQLite database path (local dev / CI) | `./data/iaas.db` (or `:memory:` for CI) | Dev |
| `INTEGRATION_MODE` | Integration factory mode | `mock` (or `live` for production) | No |
| `KEYCLOAK_URL` | Keycloak server URL | `http://localhost:8080` | Yes |
| `KEYCLOAK_REALM` | Keycloak realm name | `iaas` | Yes |
| `KEYCLOAK_CLIENT_ID` | OIDC client identifier | `iaas-web` | Yes |
| `KEYCLOAK_CLIENT_SECRET` | OIDC client secret | — | Yes (prod) |
| `JWT_SECRET` | JWT signing secret (dev only) | — | Dev only |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `900000` (15 min) | No |
| `RATE_LIMIT_MAX` | Max requests per window | `100` | No |
| `DOCUMENT_STORAGE_PATH` | File storage directory | `./uploads` | Yes |
| `CLAMAV_HOST` | ClamAV daemon hostname | `localhost` | Prod |
| `CLAMAV_PORT` | ClamAV daemon port | `3310` | Prod |
| `LOG_LEVEL` | Logging verbosity | `info` | No |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3000` | Yes |

### Feature Flags

Feature flags control progressive rollout of capabilities:

| Flag | Description | Default |
|------|-------------|---------|
| `ENABLE_DOCUMENT_UPLOAD` | Allow document uploads | `true` |
| `ENABLE_PAYMENT_SIMULATION` | Show payment journey | `true` |
| `ENABLE_CREDIT_CHECK` | Integrate credit check service | `true` |
| `ENABLE_MORATORIUM_CHECK` | Check active moratoriums | `true` |
| `ENABLE_DRAFT_RULES` | Allow testing of draft rules | `false` |
| `ENABLE_POLICY_SIMULATION` | Enable what-if analysis | `false` |
| `ENABLE_BULK_EXPORT` | Allow bulk data export | `false` |

### Service Ports

See Section 11 for the complete service ports reference table.

### Database Management

**Seeding the Database:**

```bash
# Seed the database with synthetic data (applications, users, organisations)
npx tsx packages/database/src/seed.ts

# Use in-memory database for testing
DATABASE_PATH=:memory: npm test
```

**PostgreSQL (Docker Compose):**

The full-stack Docker Compose setup includes PostgreSQL 15:

```bash
# Start full stack including PostgreSQL
docker-compose up -d

# PostgreSQL is available on port 5432
# Connection: postgresql://iaas:iaas@localhost:5432/iaas

# Connect directly to PostgreSQL
docker-compose exec postgres psql -U iaas -d iaas
```

**Keycloak Administration:**

Keycloak 25.0 runs in Docker Compose with a pre-configured realm:

```bash
# Start Keycloak
docker-compose up -d keycloak

# Admin console: http://localhost:8080
# Credentials: admin / admin
# Pre-configured realm: aib-iaas
# Pre-seeded: 10 users across 10 roles
# Federation placeholders: SAML (ScotAccount), OIDC (GOV.UK Login)
```

---

## 4. Monitoring

### Health Checks

Every service exposes a `/api/health` endpoint returning:

```json
{
  "status": "healthy",
  "service": "api-gateway",
  "version": "1.4.2",
  "uptime": 86400,
  "timestamp": "2026-08-19T10:00:00.000Z",
  "dependencies": {
    "database": "healthy",
    "keycloak": "healthy",
    "recommendation-service": "healthy"
  }
}
```

Health status values:
- `healthy` — Service operating normally
- `degraded` — Service operational but with reduced capability
- `unhealthy` — Service unable to process requests

### System Status Dashboard

The admin portal provides a real-time system status view showing:
- All service health states with response times
- Active user count and session distribution
- Request throughput and error rates
- Database connection pool utilisation
- Document storage capacity remaining
- Recent deployment events

### Alerting Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Service health | Degraded > 2 min | Unhealthy > 30s | Page on-call |
| Error rate | > 1% of requests | > 5% of requests | Page on-call |
| Response time (p95) | > 500ms | > 2000ms | Investigate |
| CPU utilisation | > 70% sustained | > 90% sustained | Scale up |
| Memory utilisation | > 80% | > 95% | Investigate leak |
| Disk usage | > 75% | > 90% | Expand / archive |
| Failed logins | > 10/min from one IP | > 50/min total | Block + investigate |

---

## 5. Logging

### Structured JSON Logging

All services produce structured JSON logs for machine parsing:

```json
{
  "timestamp": "2026-08-19T10:30:45.123Z",
  "level": "info",
  "service": "api-gateway",
  "correlationId": "uuid-v4",
  "message": "Request completed",
  "method": "GET",
  "path": "/api/applications/APP-001",
  "statusCode": 200,
  "durationMs": 45,
  "userId": "uuid",
  "userRole": "aib_officer"
}
```

### Log Levels

| Level | Usage | Retention |
|-------|-------|-----------|
| `error` | Unhandled exceptions, service failures, data integrity issues | 1 year |
| `warn` | Recoverable issues, deprecation notices, near-limit conditions | 6 months |
| `info` | Request completion, business events, state transitions | 3 months |
| `debug` | Detailed execution flow, variable states (never in production) | Session only |

### Audit Events

Audit events are a specialised log category with enhanced retention (7 years) and integrity protection. They are written to the Audit Service and are distinct from operational logs. See the Security Architecture Document for the full audit event schema.

---

## 6. Operational Support

### Common Issues and Resolutions

| Issue | Symptoms | Resolution |
|-------|----------|------------|
| Service won't start | Port already in use error | Check for zombie processes: `lsof -i :PORT`, kill if safe |
| Database locked | SQLite SQLITE_BUSY errors | Restart service; check for long-running transactions |
| Authentication failures | 401 on all requests | Verify Keycloak is running; check token signing key rotation |
| Rate limit hit | 429 responses for legitimate users | Review rate limit config; whitelist internal services |
| Document upload fails | 413 or timeout errors | Check file size limits (10MB default); verify ClamAV is running |
| Recommendation timeout | 504 from API Gateway | Check recommendation service health; review rule complexity |
| Memory growth | Service gradually consuming more RAM | Check for event listener leaks; restart service; investigate |

### Restart Procedures

**Individual Service:**
```bash
# Development
npm run dev --workspace=services/api-gateway

# Production (Docker)
docker-compose restart api-gateway
```

**Full Stack:**
```bash
# Development
npm run dev  # Starts all workspaces via concurrently

# Production
docker-compose down && docker-compose up -d
```

---

## 7. Environment Management

### Environment Configuration

| Environment | Purpose | Data | URL Pattern |
|-------------|---------|------|-------------|
| Local Dev | Developer workstations | Synthetic only | `localhost:PORT` |
| CI/Test | Automated testing in GitHub Actions | Synthetic only | Ephemeral containers |
| Staging | Pre-production verification, UAT | Synthetic + anonymised | `staging.iaas.aib.gov.uk` |
| Production | Live service | Real data | `iaas.aib.gov.uk` |

### Environment Promotion

Code progresses through environments via the CI/CD pipeline:
1. **Local** → Developer commits and pushes
2. **CI** → Automated tests pass on PR
3. **Staging** → Merge to main triggers staging deployment
4. **Production** → Manual approval gate, then automated deployment

### Environment Parity

All environments use identical:
- Docker images (same build, different config)
- Service versions (no version skew between environments)
- Network topology (service mesh structure)
- Security controls (Helmet, CORS, rate limiting active everywhere)

Differences are limited to:
- Database engine (SQLite locally, PostgreSQL in staging/production)
- Secret values (per-environment credentials)
- Scale (single instance locally, multi-instance in production)
- External integrations (mocked locally, stubbed in staging, live in production)

---

## 8. Release Management

### Git Flow

- **main** — Production-ready code; protected branch
- **feature/** — Individual feature branches from main
- **fix/** — Bug fix branches from main
- **release/** — Release candidate branches for final verification

### CI/CD Pipeline

```
Developer Push → GitHub Actions → Lint/Test/Build → PR Review → Merge to Main
                                                                      ↓
Production ← Manual Approval ← Staging Deploy ← Automated Deploy
```

### Deployment Process

1. **Pre-deployment:** Run full test suite; verify staging health
2. **Deployment:** Rolling update with zero-downtime (one service at a time)
3. **Verification:** Automated smoke tests hit all health endpoints
4. **Monitoring:** Enhanced alerting for 30 minutes post-deploy
5. **Rollback:** Automated rollback if health checks fail within 5 minutes

---

## 9. Incident Management

### Severity Classification

| Severity | Definition | Response Time | Update Frequency |
|----------|-----------|---------------|------------------|
| P1 — Critical | Service unavailable; data breach; security compromise | 15 minutes | Every 30 minutes |
| P2 — High | Major feature broken; significant user impact | 1 hour | Every 2 hours |
| P3 — Medium | Feature degraded; workaround available | 4 hours | Daily |
| P4 — Low | Minor issue; cosmetic; no user impact | Next business day | As resolved |

### Response Procedures

1. **Detect** — Alert fires or user reports issue
2. **Acknowledge** — On-call engineer acknowledges within response SLA
3. **Assess** — Determine severity, scope, and initial impact
4. **Communicate** — Notify stakeholders via appropriate channel (Slack for P3/P4, phone for P1/P2)
5. **Mitigate** — Apply immediate fix or workaround to restore service
6. **Resolve** — Implement permanent fix with appropriate testing
7. **Review** — Post-incident review within 5 working days (P1/P2 mandatory)

---

## 10. Backup and Recovery

### Database Backup Strategy

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| Full backup | Daily at 02:00 UTC | 30 days | Encrypted S3, separate account |
| Incremental | Every 6 hours | 7 days | Encrypted S3, separate account |
| Transaction log | Continuous (WAL) | 72 hours | Local + replicated |
| Point-in-time snapshot | Before each deployment | 7 days | Encrypted S3 |

### Recovery Targets

| Metric | Target | Tested |
|--------|--------|--------|
| Recovery Time Objective (RTO) | 4 hours | Quarterly DR drill |
| Recovery Point Objective (RPO) | 6 hours (last incremental) | Verified daily |
| Maximum data loss | 6 hours of transactions | Accepted risk for POC |
| Backup verification | Weekly restore test | Automated |

### Recovery Procedures

**Database Recovery:**
1. Identify most recent clean backup
2. Restore to staging environment first
3. Verify data integrity and application functionality
4. Promote restored database to production
5. Replay any recoverable transaction logs

**Full Service Recovery:**
1. Provision fresh infrastructure from Terraform
2. Deploy latest known-good container images
3. Restore database from backup
4. Verify all service health checks pass
5. Update DNS if infrastructure changed
6. Notify users of service restoration

---

## 11. Service Ports Reference

| Service | Port | Health Endpoint | Description |
|---------|------|-----------------|-------------|
| Web Portal (Next.js) | 3000 | `/api/health` | Public-facing citizen application portal |
| API Gateway (Express) | 3001 | `/api/health` | Backend-for-frontend; routing, auth, rate limiting |
| Recommendation Service | 3002 | `/api/health` | Rules engine for product recommendations |
| Document Service | 3003 | `/api/health` | File upload, storage, virus scanning |
| Integration Orchestrator | 3004 | `/api/health` | Coordinates checks across external systems |
| Mock Integrations | 3005 | `/api/health` | Simulated BASYS, eDEN, DAS, CFT, Moratorium, RoI |
| Payment Service | 3006 | `/api/health` | Payment simulation and status tracking |
| Audit Service | 3007 | `/api/health` | Event logging, audit trail, tamper detection |
| Credit Check Service | 3008 | `/api/health` | Synthetic credit bureau integration |
| Organisation Service | 3009 | `/api/health` | Organisation registry and verification |
| User Service | 3010 | `/api/health` | User profile management and preferences |
| Notification Service | 3011 | `/api/health` | Email, SMS, in-app notification dispatch |
| Admin Portal (Next.js) | 3010 | `/api/health` | Internal staff administration interface |
| ClamAV | 3310 | TCP connection | Virus scanning daemon |
| PostgreSQL | 5432 | TCP connection | Database server (Docker Compose) |
| Keycloak | 8080 | `/health` | Identity provider and federation broker (admin: admin/admin) |

---

## 12. Troubleshooting

### Common Errors and Resolutions

| Error | Cause | Resolution |
|-------|-------|------------|
| `EADDRINUSE :3001` | Port already occupied | `kill $(lsof -t -i:3001)` or change port in .env |
| `SQLITE_BUSY` | Concurrent write contention | Reduce concurrent operations; consider WAL mode |
| `ECONNREFUSED :8080` | Keycloak not running | Start Keycloak: `docker-compose up keycloak` |
| `JWT malformed` | Token corruption or wrong secret | Verify `JWT_SECRET` matches across services |
| `Rate limit exceeded` | Too many requests from client | Wait 15 minutes or adjust `RATE_LIMIT_MAX` for testing |
| `EPERM: operation not permitted` | File system permissions | Check service user has write access to upload directory |
| `Module not found` | Missing dependencies | Run `npm install` from repository root |
| `Type error in shared-types` | Package not built | Run `npm run build --workspace=packages/shared-types` |
| `Connection timeout` | Downstream service unresponsive | Check target service health; review network connectivity |
| `ClamAV: Connection refused` | Virus scanner not running | Start ClamAV: `docker-compose up clamav` |

### Diagnostic Commands

```bash
# Check all service health
for port in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010 3011; do
  echo "Port $port: $(curl -s http://localhost:$port/api/health | jq -r .status)"
done

# View service logs (Docker)
docker-compose logs -f api-gateway --tail=100

# Check database integrity
sqlite3 ./data/iaas.db "PRAGMA integrity_check;"

# Monitor active connections
netstat -tlnp | grep -E '300[0-9]|301[0-1]'

# Test Keycloak connectivity
curl -s http://localhost:8080/realms/iaas/.well-known/openid-configuration | jq .issuer
```

### Escalation Path

1. **L1 — On-call engineer:** Service restarts, configuration fixes, known issue resolution
2. **L2 — Development team:** Code-level investigation, emergency patches
3. **L3 — Architecture/Security:** Design issues, security incidents, data integrity concerns
4. **Vendor escalation:** Keycloak, infrastructure provider, dependency maintainers

---

*Document Control: This guide is maintained by the platform operations team and updated with each release.*
