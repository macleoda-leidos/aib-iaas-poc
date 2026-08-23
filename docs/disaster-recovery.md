# Disaster Recovery Plan

## Recovery Objectives

| Metric | Target | Rationale |
|--------|--------|-----------|
| **RPO** (Recovery Point Objective) | Last successful git push | All code and configuration is in GitHub; no data loss beyond the last commit |
| **RTO** (Recovery Time Objective) | < 15 minutes | Redeploy from main branch takes 3-5 minutes; verification adds 5-10 minutes |

## Architecture Resilience Summary

The AiB IAAS POC is designed with stateless services and ephemeral data, which simplifies disaster recovery:

- **Code:** Stored in GitHub (distributed, redundant)
- **Frontend:** Hosted on GitHub Pages (CDN-backed, independent of backend)
- **Backend:** Deployed on Render.com (auto-deploys from main branch)
- **Database:** SQLite with auto-seeding on startup (no persistent state required for POC)
- **Documents:** Stored on local filesystem (ephemeral on free tier; acceptable for POC synthetic data)

## Scenario 1: Backend Service Down

**Symptoms:** `/api/health` returns non-200 or times out; frontend shows connection errors.

**Recovery Steps:**

1. Open Render dashboard (https://dashboard.render.com)
2. Navigate to `iaas-api` service
3. Check the "Events" tab for deploy failures or crash loops
4. Click "Manual Deploy" → "Deploy latest commit"
5. Wait for build to complete (~3-5 minutes)
6. Verify: `curl https://iaas-api.onrender.com/api/health`
7. Verify seed data: `curl https://iaas-api.onrender.com/api/smoke-test`
8. Confirm frontend reconnects (auto-checks every 30 seconds)

**Total time:** 5-10 minutes

## Scenario 2: Frontend Unavailable

**Symptoms:** GitHub Pages returns 404 or the site is inaccessible.

**Recovery Steps:**

1. Verify GitHub repository is accessible (https://github.com)
2. Check GitHub Pages settings: repo → Settings → Pages
3. If deployment failed: re-run the GitHub Actions workflow manually
4. If DNS issue: verify custom domain configuration (if applicable)
5. Fallback: run locally with `npm run dev` in `apps/web`

**Total time:** 5-15 minutes (depending on cause)

## Scenario 3: Database Corruption or Loss

**Symptoms:** API returns empty results or 500 errors on data endpoints.

**Recovery Steps:**

1. The SQLite database is ephemeral on Render free tier — it resets on every deploy
2. Trigger a redeploy: Render dashboard → Manual Deploy
3. The application seeds all reference data automatically on startup
4. Verify: `curl https://iaas-api.onrender.com/api/applications` (should return 12 seeded applications)

**Total time:** 3-5 minutes

**Note:** No user-submitted data persists across deploys on the free tier. This is acceptable for the POC where all data is synthetic.

## Scenario 4: Complete Environment Loss

If both Render and GitHub Pages are unavailable simultaneously:

**Recovery Steps:**

1. Verify GitHub repository is accessible
2. Clone the repository locally: `git clone <repo-url>`
3. Install dependencies: `npm install`
4. Start all services locally: `npm run dev`
5. Access the application at `http://localhost:3000`
6. Once cloud services recover, push any hotfixes and redeploy

**Total time:** 10-15 minutes (local), cloud recovery depends on provider

## Scenario 5: Repository Compromise

If the GitHub repository is compromised or deleted:

**Recovery Steps:**

1. Every developer with a local clone has a full copy of the repository history
2. Create a new repository on GitHub
3. Push from any local clone: `git remote set-url origin <new-url> && git push --all`
4. Update Render deployment to point to the new repository
5. Update GitHub Pages source

**Total time:** 15-30 minutes

## Production Recommendations

For a production deployment, the following enhancements are recommended:

### Database

- **PostgreSQL** with Render managed database (or AWS RDS)
- **Point-in-time recovery** enabled (continuous WAL archiving)
- **Daily automated backups** with 30-day retention
- **Cross-region read replicas** for resilience

### Infrastructure

- **Multi-region deployment** — primary in eu-west-1, failover in eu-west-2
- **Automated failover** via health check-based DNS routing (Route 53 or Cloudflare)
- **Container orchestration** (ECS/Kubernetes) with auto-restart and scaling
- **Infrastructure as Code** — Terraform state stored in S3 with versioning

### Monitoring & Alerting

- **Health check monitoring** — PagerDuty/Opsgenie alerts within 2 minutes of downtime
- **Log aggregation** — CloudWatch or Datadog for centralised log analysis
- **APM** — distributed tracing across microservices
- **Synthetic monitoring** — automated E2E tests running every 5 minutes

### Process

- **Incident response playbook** — defined roles (Incident Commander, Communications Lead)
- **Runbook automation** — scripted recovery procedures executable with one command
- **DR testing** — quarterly disaster recovery drills
- **Backup verification** — daily automated restore tests to confirm backup integrity
- **Communication plan** — status page (Statuspage.io) for external stakeholders

## Contact & Escalation

| Role | Responsibility |
|------|---------------|
| On-call Developer | First response, initial diagnosis, standard recovery procedures |
| Tech Lead | Escalation for non-standard issues, architecture decisions |
| Product Owner | Business impact assessment, stakeholder communication |

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 23 Aug 2026 | AiB IAAS Team | Initial DR plan for POC |
