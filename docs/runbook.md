# AiB IAAS POC — Operational Runbook

## Service Inventory

| Service | Port | Health Endpoint | Dependencies |
|---------|------|-----------------|--------------|
| API Gateway | 3001 | /api/health | Database, all downstream services |
| Recommendation | 3002 | /api/health | None |
| Document | 3003 | /api/health | Filesystem |
| Integration Orchestrator | 3004 | /api/health | Mock Integrations |
| Mock Integrations | 3005 | /api/mock/health | None |
| Payment | 3006 | /api/health | None |
| Audit | 3007 | /api/health | Database |
| Credit Check | 3008 | /api/health | Database (cache) |
| Organisation | 3009 | /api/health | Database |
| User Service | 3011 | /api/health | Database |
| Notification | 3012 | /api/health | Database |
| Web Portal | 3000 | / | API Gateway |
| Admin Portal | 3010 | / | API Gateway |

## Starting Services Locally

### Option 1: Individual services (development)
```bash
cd services/mock-integrations && npm run dev    # Start first (no deps)
cd services/recommendation-service && npm run dev
cd services/api-gateway && npm run dev          # Start after mock-integrations
cd services/user-service && npm run dev
cd services/organisation-service && npm run dev
# ... etc

# Frontend
cd apps/web && npm run dev
cd apps/admin && npm run dev
```

### Option 2: All backend services
```bash
npm run dev:services   # Starts all backend services via concurrently
```

### Option 3: Docker Compose
```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

## Startup Order

1. **Mock Integrations** (no dependencies)
2. **Recommendation Service** (no dependencies)
3. **Document Service** (filesystem only)
4. **Payment Service** (no dependencies)
5. **Audit Service** (creates own DB)
6. **Credit Check Service** (creates own DB)
7. **Organisation Service** (creates own DB with seeds)
8. **User Service** (creates own DB with seeds)
9. **Notification Service** (creates own DB)
10. **Integration Orchestrator** (needs Mock Integrations)
11. **API Gateway** (needs all services available)
12. **Web/Admin portals** (need API Gateway)

## Health Monitoring

### Check all services:
```bash
for port in 3001 3002 3003 3004 3005 3006 3007 3008 3009 3011 3012; do
  echo -n "Port $port: "
  curl -sf "http://localhost:$port/api/health" | jq -r '.status' 2>/dev/null || echo "DOWN"
done
```

### Run smoke tests:
```bash
bash scripts/smoke-test.sh
```

## Database Management

All services use SQLite with WAL mode. Database files are created automatically on first start.

| Service | DB Location | Seed Data |
|---------|-------------|-----------|
| API Gateway | ./data/iaas.db | Admin user |
| Audit | ./data/audit.db | None |
| Credit Check | ./data/credit-check-cache.db | None (cache only) |
| Organisation | ./data/organisations.db | Full org hierarchy |
| User | ./data/users.db | 10 demo users, 8 roles, 23 permissions |
| Notification | ./data/notifications.db | None |

### Reset databases:
```bash
rm -f data/*.db    # All services will recreate and re-seed on next start
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Port already in use | Previous process | `lsof -ti:PORT | xargs kill` or `netstat -ano | findstr :PORT` |
| Database locked | Concurrent write | Restart service (WAL mode prevents most issues) |
| Integration orchestrator 502 | Mock integrations not running | Start mock-integrations first |
| API Gateway ECONNREFUSED | Downstream service not started | Check start order |
| better-sqlite3 install fails | Missing build tools | Install C++ build tools: `npm install -g windows-build-tools` |

## Environment Variables

See `.env.example` for all configurable values. Key overrides:

```bash
PORT=3001                      # Override service port
DATABASE_PATH=./data/iaas.db   # Custom DB location
MOCK_LATENCY_MIN_MS=0          # Disable latency simulation
MOCK_FAILURE_RATE=0            # Disable failure simulation
PAYMENT_MODE=sandbox           # Always sandbox in POC
```

## Production Considerations (Not POC)

- Replace SQLite with PostgreSQL (RDS)
- Replace local filesystem with S3
- Add TLS termination at ALB
- Enable container health checks
- Add CloudWatch log groups
- Configure auto-scaling policies
- Implement blue/green deployment
- Add WAF rules
- Enable GuardDuty
- Set up SNS for alerts
