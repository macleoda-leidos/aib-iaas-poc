# ITHC Scope Document — IAAS Web Application Penetration Test

## 1. Document Control

| Field | Value |
|-------|-------|
| Document Title | ITHC Scope — IAAS Application Penetration Test |
| Version | 1.0 |
| Classification | OFFICIAL |
| Author | IAAS Programme Team |
| Date | August 2026 |
| Review Date | September 2026 |

## 2. System Under Test

The system under test is the Initial Application Advice Service (IAAS), a web-based application that provides a unified gateway for insolvency product applications managed by the Accountant in Bankruptcy (AiB).

**Components:**

- **API Backend**: https://iaas-api.onrender.com — Express.js consolidated API providing authentication, application processing, recommendation engine, document handling, and audit logging.
- **Frontend Portal**: Hosted on GitHub Pages — Next.js static export providing the citizen-facing application journey and staff review interface.

The system processes synthetic data only. No real personal data, financial records, or live integrations are present in the test environment.

## 3. Test Type

Web Application Penetration Test aligned to the OWASP Testing Guide v4.2 and OWASP Top 10 (2021 edition). The assessment will cover:

- Authentication and session management testing
- Authorization and access control testing
- Input validation and injection testing
- Business logic testing
- API security testing
- File upload security testing
- Information disclosure and error handling
- Transport layer security

## 4. In Scope

The following assets and functionality are within scope for this assessment:

- All `/api/` endpoints on https://iaas-api.onrender.com including:
  - `/api/auth/*` — Login, logout, session management, MFA verification
  - `/api/applications/*` — CRUD operations on applications
  - `/api/recommendations/*` — Rules engine and AI-assisted recommendations
  - `/api/documents/*` — File upload, retrieval, and deletion
  - `/api/reports/*` — Reporting and export endpoints
  - `/api/audit/*` — Audit trail queries
  - `/api/health` — Health check endpoint
- Authentication flow including credential validation, token issuance, and MFA
- File upload functionality including type validation and size limits
- Rate limiting mechanisms (per-IP and per-authenticated-token)
- Role-based access control (debtor, representative, adviser, staff, admin roles)
- Cross-Origin Resource Sharing (CORS) configuration
- Content Security Policy and security headers
- Session handling and token lifecycle
- Frontend application logic and client-side security controls

## 5. Out of Scope

The following are explicitly excluded from testing:

- **Third-party infrastructure**: Render.com platform infrastructure, GitHub Pages CDN, GitHub Actions CI/CD
- **Third-party services**: Any external services not operated by the IAAS team
- **Mock integrations**: The simulated BASYS, eDEN, DAS, CFT, Moratorium, and RoI systems (these are test doubles with no real backing systems)
- **DNS and network infrastructure**: Domain registrars, DNS providers, CDN edge nodes
- **Physical security**: No physical access testing
- **Social engineering**: No phishing or pretexting attacks against staff
- **Source code review**: This is a black-box/grey-box test (source is available on GitHub for reference but formal SAST is separate)

## 6. Test Accounts

The following accounts are provided for authenticated testing:

| Account | Email | Password | Role | MFA |
|---------|-------|----------|------|-----|
| Admin | admin@aib-poc.example.com | demo | Staff/Admin | TOTP seed provided separately |
| Citizen | demo@example.com | demo | Debtor | TOTP seed provided separately |

Additional test accounts can be created via the registration flow during testing. Testers should document any accounts created for cleanup purposes.

## 7. Testing Window

- **Duration**: 5 working days
- **Proposed dates**: To be confirmed with programme team (target: Sprint 19)
- **Hours**: Testing may be conducted 08:00–18:00 GMT Monday to Friday
- **Out-of-hours testing**: Not permitted without prior written agreement
- **Environment availability**: The test environment is available 24/7 but support is only available during working hours

## 8. Rules of Engagement

Testers MUST adhere to the following rules:

1. **No Denial of Service**: Do not conduct volumetric attacks, resource exhaustion, or any testing intended to degrade service availability. Automated scanning tools must be rate-limited to a maximum of 10 requests per second.
2. **No data destruction**: Do not delete or corrupt data beyond what is necessary to demonstrate a vulnerability. Use create/read operations where possible.
3. **Immediate critical reporting**: If a critical vulnerability is discovered (CVSS 9.0+) that could lead to data breach or system compromise, cease exploitation immediately and report to the programme team within 1 hour via the agreed secure channel.
4. **No lateral movement**: Do not attempt to pivot from the application to underlying infrastructure (Render.com containers, GitHub systems).
5. **Evidence preservation**: Screenshot or log all findings at time of discovery. Do not rely on reproducing later.
6. **No automated exploitation tools**: Tools like sqlmap or Metasploit modules may be used for detection but automated exploitation must be supervised.
7. **Clean up**: Remove any test artifacts (uploaded files, created accounts, modified data) at the conclusion of testing, or document them for the team to clean up.

## 9. Environment Details

| Attribute | Detail |
|-----------|--------|
| Hosting | Render.com (Web Service, free tier for POC) |
| Runtime | Node.js 18+ |
| Database | SQLite (in-memory for POC) |
| TLS | Enforced by Render.com (TLS 1.2+ with automatic certificate management) |
| WAF | None (testing raw application security) |
| Monitoring | Application-level health checks and audit logging |

Note: The environment uses Render.com's free tier which may spin down after inactivity. Allow 30 seconds for cold start if the first request times out.

## 10. Expected Output

The ITHC report shall include:

1. **Executive Summary**: High-level overview of security posture suitable for senior management
2. **Findings Table**: All vulnerabilities listed with:
   - Unique identifier (e.g., VUL-001)
   - CVSS v3.1 score and vector string
   - Severity rating (Critical/High/Medium/Low/Informational)
   - Description of the vulnerability
   - Evidence (screenshots, request/response pairs)
   - Remediation recommendation with priority
3. **Methodology**: Tools used, testing approach, coverage achieved
4. **Positive findings**: Security controls that were tested and found effective
5. **Retest recommendations**: Which findings should be retested after remediation

The report shall be delivered in PDF format within 5 working days of test completion, with a draft findings debrief conducted on the final day of testing.

## 11. Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Programme Lead | TBC | Working hours |
| Technical Lead | TBC | Working hours |
| Incident Escalation | TBC | Working hours |

## 12. Sign-Off

This scope document must be agreed and signed by both the IAAS programme team and the testing provider before work commences. Any changes to scope require written agreement from both parties.
