# Cloud Provider Vendor Assessment

## Comparison Matrix

| Criteria | AWS | Azure | GCP |
|----------|-----|-------|-----|
| Compute | ECS/Fargate | Container Apps | Cloud Run |
| Database | RDS PostgreSQL | Azure SQL | Cloud SQL |
| Identity | Cognito/Keycloak | Azure AD B2C | Firebase Auth |
| Storage | S3 | Blob Storage | Cloud Storage |
| CDN | CloudFront | Azure CDN | Cloud CDN |
| Scot Gov Alignment | ✅ Primary | ✅ Strong | ⚠️ Limited |
| Existing AiB/Leidos | ✅ Yes | ⚠️ Some | ❌ No |
| UK Data Centres | ✅ London | ✅ London | ✅ London |
| Cost (100 users) | ~£50/mo | ~£45/mo | ~£40/mo |
| Cost (10,000 users) | ~£450/mo | ~£500/mo | ~£400/mo |

## Recommendation: AWS

1. Scottish Government alignment — primary Crown Hosting platform
2. Existing Leidos capability — deep expertise, existing accounts
3. GDS precedent — GOV.UK runs on AWS
4. Fargate — serverless containers, no EC2 management
5. RDS PostgreSQL — managed, Multi-AZ, PITR

### Alternative: Azure
Choose if AiB has Microsoft EA or Azure AD B2C is mandated.

### Not Recommended: GCP
Lacks Scottish Government relationship and existing contracts.

## Related Documents
- [Cost Model](./cost-model.md)
- [Architecture](./architecture.md)
