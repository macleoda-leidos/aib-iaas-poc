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

There are **two**, and the distinction matters for anything you wire an alert to.

- **Liveness — `GET /api/health`.** Cheap, and deliberately cannot fail: it answers "is this
  process alive", nothing more. This is the path `render.yaml` names as `healthCheckPath`.
- **Readiness — `GET /api/health/ready`.** Answers "can it actually serve traffic". Probes the
  shared database, both auxiliary SQLite stores and whether the uploads directory is genuinely
  writable, and returns **503** with per-dependency detail when any required check fails.
- **Smoke test — `GET /api/smoke-test`.** Row counts per table, for confirming seed data landed.

**Point monitoring and alerting at `/api/health/ready`, not `/api/health`.** Until readiness
existed, the only signal available was "the process is listening", so a container whose database
was unreachable — answering 500 to every real request — looked identical to a healthy one and was
never restarted (GAP-020 in the known-gaps register).

**Why liveness is not simply made to fail instead.** On the free plan a failing health check fails
the *deploy*, and a Neon instance waking from idle can take several seconds. A database-probing
liveness endpoint would therefore turn an ordinary cold start into a failed deployment, most likely
at the moment a demo was starting. The two questions need two endpoints.

### Expected Responses

```bash
curl https://iaas-api.onrender.com/api/health
# {"status":"healthy","liveness":true,"readiness":"/api/health/ready", ...}

curl https://iaas-api.onrender.com/api/health/ready
# 200 {"status":"ready","checks":{"database":{"ok":true,"dialect":"postgres","ms":14}, ...}}
#
# 503 when something is down — the `checks` object names it:
# {"status":"degraded","checks":{"database":{"ok":false,"ms":3001,"error":"timed out after 3000ms"},
#                               "uploads":{"ok":true,"writable":true,"absolute":true}}}

curl https://iaas-api.onrender.com/api/smoke-test
# {"success":true,"dialect":"postgres","counts":{"applications":100,"users":11, ...}}
```

`creditCache` is marked `optional` in the readiness response: a cold cache costs one extra provider
call, not a case, so it degrades the status without producing a 503.

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

### Log format

One JSON object per line, from `@aib-iaas/observability`. Render parses these, so they are
searchable by field:

```json
{"level":"info","msg":"request","time":"2026-09-07T10:04:49.229Z","service":"iaas-api",
 "method":"GET","route":"/api/applications/:id","status":200,"durationMs":31,
 "requestId":"6f1c8e2a-...","userId":"user-demo"}
```

- **`requestId` is how you trace a reported failure.** It is accepted from an inbound
  `x-request-id` header, generated when absent, echoed on the response, and included in every
  error envelope — so a user who says "it failed" can be asked for the id from their browser's
  network tab, and it will match a log line. Search `requestId:"<value>"`.
- **`route` is the route pattern, never the URL.** A resolved URL carries application ids and
  reference numbers; `unmatched` appears for a 404 rather than the path being substituted.
- **Health polling is logged at `debug`**, so it does not drown the useful lines — but a 5xx on a
  health path is still logged at `error`.
- **Personal data is redacted in the serialiser**, not at each call site: National Insurance
  numbers, dates of birth, postcodes, `authorization` headers and similar are replaced with
  `[redacted]` at any depth. Add to `REDACTED_KEYS` in `packages/observability/src/logger.ts`, not
  to individual call sites.

Set `LOG_LEVEL=debug` temporarily in the dashboard to see health polling and per-request debug
lines; revert afterwards, as it is a significant volume increase.

### Metrics

`GET /api/metrics` returns Prometheus exposition format, and `GET /api/metrics/summary` a JSON
roll-up the admin monitoring page renders. **Both require the `system.admin` permission** — route
volumes and error rates tell an attacker which endpoints exist and which are currently broken.

Per-process and reset on restart, so on the free plan they describe the current wake period and
nothing longer. That is still the difference between "somebody is getting 500s on
`POST /api/applications`" and no information at all; a durable time series needs a scraper pointed
at the endpoint.

## Environment Variables

| Variable | Purpose | Value in `render.yaml` |
|----------|---------|---------|
| `PORT` | Server listen port | 3001 |
| `DATABASE_PATH` | Shared SQLite database file | `/data/iaas.db` |
| `UPLOAD_PATH` | Uploaded documents | `/data/uploads` |
| `NOTIFICATION_DB_PATH` | Case correspondence store | `/data/notifications.db` |
| `CREDIT_CHECK_DB_PATH` | Credit-check result cache | `/data/credit-check-cache.db` |
| `SCANNER_MODE` | Malware scanner selection | `placeholder` |
| `LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error` \| `silent` | `info` |
| `SERVICE_NAME` | Emitted as the `service` field on every log line | `iaas-api` |
| `JWT_PRIVATE_KEY` | Ed25519 signing key (PEM) — `sync: false` | *set in dashboard* |
| `DATABASE_URL` | PostgreSQL URI; SQLite is used when unset | *set in dashboard* |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | https://macleoda-leidos.github.io |
| `INTEGRATION_MODE` | mock or live | mock |
| `MOCK_FAILURE_RATE` | Percentage of mock calls that simulate failure | 0 |

**All four store paths must be absolute and under `/data`.** Three of them were previously unset,
and their relative defaults (`./uploads`, `./data/notifications.db`,
`./data/credit-check-cache.db`) resolved under the container's working directory rather than the
mounted disk — `Dockerfile.service` sets `WORKDIR` to `/app/services/<name>`, so the mount was never
touched at all. Every uploaded bank statement and payslip and all case correspondence was therefore
destroyed on each spin-down from idle, several times a day, while the `documents` rows pointing at
those files survived on the disk — leaving a case list whose downloads 404'd (GAP-019).

The service now logs an error at boot if any store path is relative under `NODE_ENV=production`,
and `/api/health/ready` reports whether `UPLOAD_PATH` is actually writable. A relative store path
works perfectly until the first restart, which is why both checks exist.

`SCANNER_MODE` is stated rather than left to its `auto` default, because what `auto` resolves to in
a container that has never had ClamAV installed was previously left to chance. Docker Compose is
the one environment that legitimately uses `auto` — it has a real ClamAV container.

To update environment variables:
1. Render dashboard → iaas-api → Environment
2. Edit or add the variable
3. Click "Save Changes" — this triggers an automatic redeploy

## Database

The Node service (`iaas-api`) uses SQLite at `DATABASE_PATH`, backed by the 1GB persistent disk
declared in `render.yaml` and mounted at `/data`, so it survives deploys and restarts. (An earlier
version of this section called the filesystem ephemeral — true of a free service with no disk attached,
but this one has one.) Reference data is auto-seeded on startup either way.

Setting `DATABASE_URL` to a `postgresql://` URI switches the shared store to PostgreSQL; the
auxiliary stores below stay on SQLite either way.

### The `/data` layout

```
/data/
  iaas.db                    DATABASE_PATH          shared schema — 17 tables
  uploads/                   UPLOAD_PATH            document files
  notifications.db           NOTIFICATION_DB_PATH   case correspondence
  credit-check-cache.db      CREDIT_CHECK_DB_PATH   result cache, 1-hour TTL
```

Four stores, not one. Three of them are separate SQLite files rather than tables in the shared
schema for historical reasons; the credit-check cache is genuinely disposable, but the notification
store is not — it holds correspondence.

**Schema changes are made by migrations, not by editing the CREATE statements.**
`packages/database/src/schema.ts` and `pg-schema.ts` are `CREATE TABLE IF NOT EXISTS` blocks, which
handle a fresh database perfectly and an existing one not at all — a column added to a CREATE
statement is invisible to `/data/iaas.db` because that table already exists. Add to
`packages/database/src/migrations.ts` as well, and check `schema_migrations` to see what a given
deployment has applied.

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
4. Verify with `curl https://iaas-api.onrender.com/api/health/ready` — readiness, not liveness.
   A green liveness check only means the process started; readiness is what confirms it can reach
   its database and its disk.

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

- **Uptime badge:** shields.io badge in README pings `/api/health`. Correct for a badge — it is
  asking whether the process is up.
- **External monitoring:** configure UptimeRobot or similar against **`/api/health/ready`**, not
  `/api/health`. Liveness cannot fail by design, so a monitor pointed at it reports green for a
  container that is serving 500s to every real request — which is the defect readiness exists to
  surface. Every 5 minutes.
- **Alerting:** Render sends email notifications on deploy failures and service crashes. For
  anything application-level, alert on a 503 from `/api/health/ready` (which names the failing
  dependency in `checks`) or on the `iaas_http_requests_total{status="5.."}` counter from
  `/api/metrics`.
- **Application metrics:** `/api/metrics` (Prometheus) and `/api/metrics/summary` (JSON), both
  behind `system.admin`. Per-route request counts, error rates and latency histograms. Per-process
  and reset on restart — see the Logs section.
- **In-product:** `/admin/monitoring` and `/admin/system-health` read `/api/health/ready` and
  `/api/metrics/summary`. They previously displayed hard-coded uptime figures ("98.2%", "12s ago")
  that nothing had measured, which is worse than an empty page.
