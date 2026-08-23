# Cost Model — IAAS Platform

This document projects the infrastructure and operational costs of the IAAS platform at different user scales, from the current zero-cost POC through to a production deployment serving 10,000 users.

---

## Cost Projections by Scale

| Component | POC (Current) | 100 Users | 1,000 Users | 10,000 Users |
|-----------|---------------|-----------|-------------|--------------|
| Frontend Hosting | £0 (GitHub Pages) | £0 (GitHub Pages) | £20/mo (Vercel Pro) | £50/mo (CloudFront) |
| Backend API | £0 (Render Free) | £7/mo (Render Starter) | £25/mo (Render Standard) | £100/mo (AWS ECS) |
| Database | £0 (SQLite) | £0 (Neon Free) | £19/mo (Neon Launch) | £69/mo (AWS RDS) |
| Identity (Keycloak) | £0 (Docker local) | £0 (Phase Two Free) | £25/mo (Phase Two) | £100/mo (Self-hosted) |
| Storage (Docs) | £0 (Local) | £0 (R2 Free) | £5/mo (R2) | £20/mo (S3) |
| Monitoring | £0 (Manual) | £0 (UptimeRobot Free) | £30/mo (Datadog) | £100/mo (Datadog) |
| Email (GOV.UK Notify) | £0 (Mock) | £0 (Free tier) | £0 (Free tier) | £0 (Free tier) |
| **TOTAL** | **£0/mo** | **£7/mo** | **£124/mo** | **£439/mo** |

---

## Detailed Breakdown

### Frontend Hosting

- **POC → 100 users**: GitHub Pages provides unlimited bandwidth for static sites. With Next.js static export, this handles high traffic with global CDN distribution at zero cost.
- **1,000 users**: Vercel Pro (£20/mo) adds server-side rendering capability, preview deployments, and analytics. Required if dynamic rendering is needed.
- **10,000 users**: CloudFront distribution (£50/mo estimated) with S3 origin provides enterprise-grade CDN with WAF integration and custom SSL.

### Backend API

- **POC**: Render.com free tier provides 512MB RAM with cold starts after 15 minutes of inactivity. Acceptable for demonstration but not for production use.
- **100 users**: Render Starter (£7/mo) eliminates cold starts, provides 512MB RAM with always-on availability.
- **1,000 users**: Render Standard (£25/mo) provides 2GB RAM, auto-scaling, and zero-downtime deploys.
- **10,000 users**: AWS ECS Fargate (£100/mo estimated) with Application Load Balancer, auto-scaling groups, and multi-AZ deployment for high availability.

### Database

- **POC**: SQLite requires zero infrastructure. Single file on local filesystem.
- **100 users**: Neon Free tier provides managed PostgreSQL with 0.5GB storage and autoscaling compute. Sufficient for early adoption.
- **1,000 users**: Neon Launch (£19/mo) provides 10GB storage, connection pooling, and branching for development workflows.
- **10,000 users**: AWS RDS PostgreSQL (£69/mo) with db.t3.medium instance, Multi-AZ deployment, automated backups, and read replicas.

### Identity (Keycloak)

- **POC**: Keycloak runs locally in Docker for development and testing.
- **100 users**: Phase Two (managed Keycloak) free tier supports up to 1,000 users with standard OIDC flows.
- **1,000 users**: Phase Two paid tier (£25/mo) adds SLA guarantees, custom domains, and federation support.
- **10,000 users**: Self-hosted Keycloak on AWS (£100/mo) with HA configuration, external PostgreSQL, and Redis for session clustering.

### Document Storage

- **POC**: Local filesystem storage. Documents are not persisted across deployments.
- **100 users**: Cloudflare R2 free tier (10GB storage, 10M requests/month). S3-compatible API for easy migration.
- **1,000 users**: R2 paid tier (£5/mo) with lifecycle policies and larger storage allowance.
- **10,000 users**: AWS S3 (£20/mo) with intelligent tiering, versioning, cross-region replication, and integration with AWS security services.

### Monitoring

- **POC**: Manual monitoring via Render.com dashboard and browser DevTools.
- **100 users**: UptimeRobot free tier (50 monitors, 5-minute intervals) for basic availability monitoring.
- **1,000 users**: Datadog (£30/mo) with APM, log management, infrastructure monitoring, and alerting.
- **10,000 users**: Datadog full suite (£100/mo) with distributed tracing, real user monitoring, synthetic tests, and custom dashboards.

### Email (GOV.UK Notify)

- GOV.UK Notify is free for all government services at all volumes. No cost at any scale for transactional email, SMS, and letter notifications. This is a significant cost advantage of being a public sector service.

---

## Cost Optimisation Strategies

### Reserved Instances & Commitments

At the 10,000 user tier, significant savings are available through commitment discounts:

| Strategy | Saving | Applicable Components |
|----------|--------|----------------------|
| AWS Reserved Instances (1 year) | 30-40% | RDS, ECS |
| AWS Savings Plans (3 year) | 50-60% | Compute (ECS/Fargate) |
| Cloudflare Annual Plan | 20% | CDN, R2, WAF |
| Render Annual Billing | 15% | Backend API |

Applying reserved instances at the 10,000 user tier reduces the monthly total from £439 to approximately £310/mo.

### Architecture Optimisations

1. **Edge caching**: Cache API responses at CDN edge for read-heavy endpoints (recommendations, product info). Reduces backend compute by 40-60%.
2. **Database connection pooling**: PgBouncer reduces database connections, enabling smaller instance sizes.
3. **Serverless for spiky workloads**: Move document processing and PDF generation to Lambda functions (pay-per-invocation rather than always-on).
4. **Static API responses**: Pre-generate recommendation results nightly for common scenarios, serve from CDN.

### Free Tier Maximisation

The POC demonstrates that a fully functional platform can operate at £0/month by combining:
- GitHub Pages (static hosting, unlimited bandwidth)
- Render.com free tier (backend with cold starts)
- SQLite (embedded database)
- GOV.UK Notify (free government email)
- GitHub Actions (CI/CD, 2,000 minutes/month free)

This approach is suitable for demonstrations, user research, and stakeholder reviews.

---

## Annual Cost Summary

| Scale | Monthly | Annual | Per-User/Year |
|-------|---------|--------|---------------|
| POC | £0 | £0 | £0 |
| 100 Users | £7 | £84 | £0.84 |
| 1,000 Users | £124 | £1,488 | £1.49 |
| 10,000 Users | £439 | £5,268 | £0.53 |

The per-user cost decreases significantly at scale, demonstrating strong unit economics. At 10,000 users, the platform costs less than £0.53 per user per year — substantially cheaper than any commercial case management solution.

---

## Comparison with Commercial Alternatives

| Solution | 1,000 Users Cost | Notes |
|----------|------------------|-------|
| IAAS (custom build) | £124/mo | Full control, no licensing |
| Salesforce Government Cloud | £5,000+/mo | Per-seat licensing |
| ServiceNow | £8,000+/mo | Enterprise pricing |
| Microsoft Dynamics 365 | £3,000+/mo | Per-seat + platform |

The custom-build approach delivers 25-65x cost savings compared to commercial platforms while providing full control over the user experience and integration approach.

---

## Related Documents

- [Vendor Assessment](./vendor-assessment.md)
- [Architecture Decisions](./architecture-decisions.md)
- [Team Scaling Guide](./team-scaling-guide.md)
