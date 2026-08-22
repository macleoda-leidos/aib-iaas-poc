# AiB IAAS Deployment Guide

This guide covers deploying the AiB Initial Application Advice Service from local development through to production.

## Local Development

The fastest way to run the full stack locally is via Docker Compose:

```bash
cd infra/docker
docker compose up -d
```

This starts:
- **PostgreSQL 16** on port 5432 (database for all services)
- **Keycloak 25** on port 8080 (identity provider with pre-configured realm)
- **ClamAV** on port 3310 (virus scanning for document uploads)
- **All microservices** on ports 3001-3011
- **Seed container** that populates demo data on first run

After startup, access:
- Keycloak Admin Console: http://localhost:8080 (admin / admin)
- API Gateway: http://localhost:3001/api/health
- Web Portal (run separately): `npm run dev -w apps/web` on port 3000
- Admin Portal (run separately): `npm run dev -w apps/admin` on port 3010

### Environment Variables

Copy `.env.example` to `.env` in the project root and adjust values as needed. The Docker Compose file passes its own environment variables to containers, so `.env` is primarily for running services outside Docker during development.

## Free Beta Deployment

The beta can run entirely on free-tier cloud services, keeping costs between zero and ten pounds per month.

### Frontend: Vercel (Free Tier)

Vercel provides the best Next.js hosting experience with zero configuration:

1. Connect your GitHub repository to Vercel
2. Set the root directory to `apps/web`
3. Configure environment variables from `infra/deploy/vercel.json`
4. Deploy — Vercel handles builds, CDN, and SSL automatically

The free tier includes 100GB bandwidth/month and serverless functions, more than sufficient for a beta with limited users.

### Backend: Railway (Free Tier)

Railway offers a generous free tier with five dollars of credit per month:

1. Create a new project from your GitHub repo
2. Add a PostgreSQL plugin (provisions automatically)
3. Deploy the API Gateway using `infra/deploy/railway.toml`
4. Set environment variables: `INTEGRATION_MODE=mock`, `PORT=3001`

Alternative: **Render** free tier provides 750 hours/month of compute with automatic deploys from Git. Services sleep after 15 minutes of inactivity on the free plan.

### Database: Neon PostgreSQL (Free Tier)

Neon provides serverless PostgreSQL with a generous free tier:
- 0.5 GB storage
- 1 compute unit (auto-suspends after 5 minutes idle)
- Branching for development/staging environments

Connection string format: `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/iaas?sslmode=require`

### Identity: Keycloak

Two options for hosting Keycloak in beta:

1. **Railway** — Deploy Keycloak as a separate service using the official Docker image. Mount the realm export for automatic configuration. Costs approximately two to three dollars per month from the free credit.

2. **Phase Two** (managed Keycloak) — Free tier includes one realm, unlimited users, and hosted Keycloak with no infrastructure management. Register at phasetwo.io and import `infra/keycloak/realm-export.json`.

### Environment Variables Per Service

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | API Gateway | PostgreSQL connection string |
| `KEYCLOAK_URL` | API Gateway | Keycloak base URL |
| `KEYCLOAK_REALM` | API Gateway | Realm name (`aib-iaas`) |
| `INTEGRATION_MODE` | API Gateway | `mock` for beta, `live` for production |
| `NEXT_PUBLIC_API_URL` | Web/Admin | Backend API URL |
| `NEXT_PUBLIC_KEYCLOAK_URL` | Web/Admin | Keycloak URL for frontend auth |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | Web | `iaas-web` |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | Admin | `iaas-admin` |

## Cost Breakdown

| Service | Provider | Monthly Cost |
|---------|----------|-------------|
| Frontend | Vercel Free | £0 |
| Backend API | Railway Free | £0-£4 |
| Database | Neon Free | £0 |
| Identity | Phase Two Free / Railway | £0-£3 |
| DNS/Domain | Optional | £0-£1 |
| **Total** | | **£0-£8/month** |

For a beta serving fewer than 100 users with moderate traffic, the entire stack runs comfortably within free tier limits.

## Production Pathway

When moving beyond POC/beta to a production Scottish Government deployment:

| Component | Production Choice | Rationale |
|-----------|------------------|-----------|
| Compute | AWS ECS Fargate | Serverless containers, no server management |
| Database | AWS RDS PostgreSQL | Multi-AZ, automated backups, encryption at rest |
| CDN/Frontend | AWS CloudFront + S3 | Global edge caching, DDoS protection |
| Identity | Keycloak on ECS or AWS Cognito | Federated with ScotAccount SAML |
| Secrets | AWS Secrets Manager | Rotation, audit trail |
| Monitoring | CloudWatch + X-Ray | Distributed tracing across microservices |
| CI/CD | GitHub Actions + AWS CodeDeploy | Blue/green deployments |

The Terraform configuration in `infra/terraform/` provides the foundation for AWS infrastructure provisioning. The Azure Bicep templates in `infra/azure/` offer an alternative for Azure Government Cloud deployments.

## Security Considerations

- All inter-service communication uses mTLS in production
- Keycloak tokens are validated on every API request
- Database connections use SSL with certificate verification
- Secrets are never committed — use environment variables or a secrets manager
- Rate limiting is enforced at the API Gateway level
- Brute force protection is configured in Keycloak (3 failures, 5 minute lockout)
