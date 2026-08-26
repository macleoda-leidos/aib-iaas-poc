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

The Node service (`iaas-api`) uses SQLite at `DATABASE_PATH`, backed by the 1GB persistent disk
declared in `render.yaml` and mounted at `/data`, so it survives deploys and restarts. (An earlier
version of this section called the filesystem ephemeral — true of a free service with no disk attached,
but this one has one.) Reference data is auto-seeded on startup either way.

The .NET service (`iaas-dotnet-api`) has **no disk declared**, so its SQLite file really is ephemeral,
lost on every deploy or restart. Pointing it at PostgreSQL is what fixes that.

### Setting `DATABASE_URL` for the .NET service (Neon PostgreSQL)

`DATABASE_URL` is declared in `render.yaml` as `sync: false`, meaning Render deliberately does **not**
sync it from the blueprint — it has to be entered in the dashboard. That is the correct handling for a
credential; it should never be committed to the repo.

1. Render dashboard → **iaas-dotnet-api** → **Environment**
2. `DATABASE_URL` will already be listed with no value. Add one.
3. Paste the Neon connection string in this form:
   `postgresql://user:password@ep-xxx-yyy.eu-central-1.aws.neon.tech/iaas?sslmode=require`
   Prefer Neon's **pooled** string if offered: the service opens connections per request and Neon's
   free compute has a low connection ceiling.
4. **Save Changes** — this triggers a redeploy. The value only takes effect on the new container,
   because it is read once at startup (`services/dotnet-api/Program.cs`).

Confirm which store it settled on from the deploy logs. `Program.cs` probes the connection *before*
registering the DbContext and logs the outcome:

- `[IAAS.Api] Database ready (PostgreSQL)` — connected to Neon.
- `[IAAS.Api] PostgreSQL unreachable, using SQLite instead: <reason>` — wrong string, stale
  credentials, or Neon suspended. **The service still starts and serves from SQLite**, so a green
  health check does not by itself prove Neon is in use. Read the log.

Two things to expect. Neon's free compute auto-suspends after roughly 5 minutes idle, so the first
request after a quiet spell pays a Neon cold start *on top of* Render's 15-minute spin-down — two in
series. And the two backends still do not share a database: the Node service stays on its SQLite disk,
so switching at `/admin/feature-flags` shows different records in each. The roadmap's hosting section
records what a genuinely shared database would take.

For production the recommendation remains managed PostgreSQL (Render's own service, Neon, or RDS on the
documented AWS path), for persistent storage, point-in-time recovery and automated backups.

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
