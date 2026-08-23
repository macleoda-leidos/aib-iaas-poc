# Operational Runbook — Render Deployment

## Service Overview

| Field | Value |
|-------|-------|
| Service Name | iaas-api |
| Platform | Render.com (Free Tier) |
| URL | https://iaas-api.onrender.com |
| Repository | GitHub — aib-iaas-poc |
| Branch | main |
| Runtime | Node.js 20 |
| Framework | Express.js (TypeScript) |

## Deployment

### How to Deploy

Deployment is fully automated via GitHub integration. Any push to the `main` branch triggers an automatic deployment on Render. The typical deployment pipeline is:

1. Developer pushes to `main` (or merges a PR)
2. Render detects the push via webhook
3. Build step runs: `npm install && npm run build`
4. Start command executes: `npm run start:api`
5. Health check confirms the service is live

There is no manual CI/CD configuration required. Render handles build, deploy, and routing automatically.

### Manual Deploy

If automatic deployment fails or you need to force a redeploy:

1. Open the Render dashboard (https://dashboard.render.com)
2. Navigate to the `iaas-api` service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for build to complete (~2-3 minutes)

## Health Checks

### Endpoints

- **Primary health check:** `GET /api/health` — returns `{ status: "ok", uptime: <seconds>, timestamp: <ISO> }`
- **Smoke test:** `GET /api/smoke-test` — verifies database connectivity, seed data presence, and all internal service modules are loaded

### Expected Responses

```bash
curl https://iaas-api.onrender.com/api/health
# {"status":"ok","uptime":1234,"timestamp":"2026-08-23T10:00:00.000Z"}

curl https://iaas-api.onrender.com/api/smoke-test
# {"status":"ok","database":"connected","applications":12,"services":"all_loaded"}
```

## Cold Start Behaviour

The Render free tier spins down the service after 15 minutes of inactivity. Key facts:

- **Sleep trigger:** No inbound requests for 15 minutes
- **Wake time:** Approximately 30 seconds on first request after sleep
- **User impact:** First visitor sees a loading delay; subsequent requests are fast
- **Mitigation:** External uptime monitors (e.g., UptimeRobot) can ping `/api/health` every 14 minutes to keep the service warm — though this consumes free tier hours

## Logs

Access logs via the Render dashboard:

1. Navigate to https://dashboard.render.com
2. Select the `iaas-api` service
3. Click the "Logs" tab

Logs include stdout/stderr from the application. Filter by timestamp or search for keywords. Logs are retained for 7 days on the free tier.

Application-level structured logs use the format: `[TIMESTAMP] [LEVEL] [SERVICE] message`

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Server listen port | 3001 |
| `DATABASE_PATH` | SQLite database file location | /data/iaas.db |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | https://macleoda.github.io |
| `INTEGRATION_MODE` | mock or live | mock |
| `MOCK_FAILURE_RATE` | Percentage of mock calls that simulate failure | 0.05 |

To update environment variables:
1. Render dashboard → iaas-api → Environment
2. Edit or add the variable
3. Click "Save Changes" — this triggers an automatic redeploy

## Database

The POC uses SQLite stored at the path specified by `DATABASE_PATH`. On the Render free tier, the filesystem is **ephemeral** — data is lost on every deploy or restart. The application auto-seeds reference data on startup, so this is acceptable for the POC.

For production, the recommendation is PostgreSQL with Render's managed database service, which provides persistent storage, point-in-time recovery, and automated backups.

## Restart Procedure

If the service is unresponsive and health checks fail:

1. Open Render dashboard → iaas-api
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for the build and health check to pass
4. Verify with `curl https://iaas-api.onrender.com/api/health`

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| CORS errors in browser console | `CORS_ORIGIN` doesn't include the requesting domain | Update the env var to include the frontend URL |
| 503 on first request | Cold start — service was sleeping | Wait ~30s and retry; consider uptime monitoring |
| "Module not found" in build logs | Missing dependency or incorrect import path | Check `package.json`, verify Dockerfile/build command |
| Database empty after deploy | Ephemeral filesystem wiped | Expected on free tier — seed runs automatically |
| Build timeout | npm install taking too long | Clear Render build cache, reduce dependency count |

## Rollback

To rollback to a previous version:

1. **Quick rollback:** `git revert <commit> && git push origin main` — triggers a new deploy with the revert
2. **Dashboard rollback:** Render dashboard → iaas-api → Events → select a previous successful deploy → "Rollback to this deploy"

## Scaling

| Tier | Cost | Benefits |
|------|------|----------|
| Free | $0/mo | 750 hours/mo, sleeps after 15 min |
| Individual | $7/mo | No sleep, persistent disk, custom domains |
| Team | $19/mo | Collaborative dashboard, preview environments |
| Pro | Custom | Autoscaling, dedicated instances, SLA |

To upgrade: Render dashboard → iaas-api → Settings → Instance Type → select new tier.

## Monitoring

- **Uptime badge:** shields.io badge in README pings `/api/health`
- **External monitoring:** Configure UptimeRobot or similar to check `/api/health` every 5 minutes
- **Alerting:** Render sends email notifications on deploy failures and service crashes
- **Application metrics:** `/api/health` returns uptime in seconds for basic availability tracking
