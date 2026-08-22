# Authority to Operate — Security Case

## AiB IAAS — Initial Application Advice Service

---

## Document Control

| Field | Value |
|-------|-------|
| System | IAAS — Initial Application Advice Service |
| Owner | Accountant in Bankruptcy (AiB), Scottish Government |
| Classification | OFFICIAL-SENSITIVE |
| Version | 1.0 DRAFT |
| Author | Leidos Security Architecture |
| Reviewer | AiB SIRO |
| Status | FOR APPROVAL |
| Date Issued | 21 August 2026 |
| Valid Until | 21 August 2027 (12-month review cycle) |
| Next Review | August 2027 or upon significant system change |
| Distribution | AiB SIRO, AiB CISO, AiB DPO, Scottish Government Cyber Resilience Unit |

---

## 1. System Description

### 1.1 Purpose

The Initial Application Advice Service (IAAS) is the Accountant in Bankruptcy's unified digital gateway for statutory debt solution applications in Scotland. It replaces the existing fragmented, product-centric application processes with a single, user-centred service that assesses an individual's financial circumstances, recommends the most appropriate debt solution, and manages the full application lifecycle from initial enquiry through to submission and decision.

### 1.2 Scope

IAAS processes personal and financial information from Scottish citizens (debtors), their appointed representatives (money advisers), and creditor organisations. The system integrates with existing AiB case management systems (BASYS, eDEN, DAS Register), identity providers (ScotAccount, GOV.UK Login), and credit reference agencies (Experian/Equifax) to provide a comprehensive assessment and recommendation service.

### 1.3 Users

| User Type | Estimated Volume | Access Method |
|-----------|-----------------|---------------|
| Citizens (Debtors) | 30,000 per annum | Public web portal (citizen self-service) |
| Money Advisers | 2,000 registered | Public web portal (professional account) |
| Creditors / Trustees | 500 registered | Public web portal (creditor account) |
| AiB Casework Officers | 80 staff | Admin portal (internal network) |
| AiB Senior Officers | 15 staff | Admin portal (internal network) |
| AiB Supervisors | 8 staff | Admin portal (internal network) |
| System Administrators | 4 staff | Direct infrastructure access |

### 1.4 Data Classification

The system processes data classified as **OFFICIAL-SENSITIVE** under the Government Security Classifications policy. This includes personal data (names, dates of birth, National Insurance numbers, addresses), financial data (income, expenditure, debt schedules), and credit reference agency data. All data is processed under the lawful basis of public task (Article 6(1)(e) UK GDPR) in fulfilment of AiB's statutory functions under the Bankruptcy (Scotland) Act 2016.

### 1.5 Hosting

| Component | Environment | Provider | Region |
|-----------|-------------|----------|--------|
| Web Applications | AWS ECS (Fargate) | Amazon Web Services | eu-west-2 (London) |
| API Services | AWS ECS (Fargate) | Amazon Web Services | eu-west-2 (London) |
| Database | AWS RDS (PostgreSQL 15) | Amazon Web Services | eu-west-2 (Multi-AZ) |
| Document Storage | AWS S3 (encrypted) | Amazon Web Services | eu-west-2 (London) |
| Identity Provider | AWS ECS (Keycloak) | Amazon Web Services | eu-west-2 (London) |
| CDN / WAF | AWS CloudFront + WAF | Amazon Web Services | Global (origin eu-west-2) |
| DNS | AWS Route 53 | Amazon Web Services | Global |
| Monitoring | AWS CloudWatch + Grafana | Amazon Web Services | eu-west-2 (London) |

All data processing and storage is within UK jurisdiction. No international data transfers occur.

---

## 2. Information Asset Register

| Asset ID | Asset | Classification | Owner | Location | Retention |
|----------|-------|---------------|-------|----------|-----------|
| IA-001 | Applicant personal data (name, DOB, NI number, address) | OFFICIAL-SENSITIVE | AiB | PostgreSQL (AWS RDS, encrypted) | 6 years post case closure |
| IA-002 | Financial data (income, expenditure, debt schedule) | OFFICIAL-SENSITIVE | AiB | PostgreSQL (AWS RDS, encrypted) | 6 years post case closure |
| IA-003 | Credit check results (score, defaults, CCJs) | OFFICIAL-SENSITIVE | AiB (sourced from Experian) | PostgreSQL (AWS RDS, encrypted) | 6 years post case closure |
| IA-004 | Uploaded documents (payslips, bank statements, ID) | OFFICIAL-SENSITIVE | AiB | AWS S3 (SSE-S3 AES-256) | 6 years post case closure |
| IA-005 | Application decisions and recommendations | OFFICIAL | AiB | PostgreSQL (AWS RDS, encrypted) | 6 years post case closure |
| IA-006 | Audit trail (all system events) | OFFICIAL | AiB | PostgreSQL (AWS RDS, encrypted) | 7 years |
| IA-007 | User credentials and session data | OFFICIAL-SENSITIVE | AiB | Keycloak (bcrypt hashed, encrypted at rest) | Account lifetime + 1 year |
| IA-008 | Integration data (BASYS, eDEN, DAS responses) | OFFICIAL-SENSITIVE | AiB | PostgreSQL (AWS RDS, encrypted) | 6 years post case closure |
| IA-009 | System configuration and secrets | OFFICIAL-SENSITIVE | Leidos (managed) | AWS Secrets Manager | Current + 90-day rotation |
| IA-010 | Backup data (database snapshots) | OFFICIAL-SENSITIVE | AiB | AWS RDS Snapshots (encrypted) | 30 days rolling |

---

## 3. Risk Assessment

This risk assessment is aligned with the NCSC Cyber Assessment Framework (CAF) and the Scottish Government Cyber Resilience Framework. Risks are assessed against likelihood (Very Low, Low, Medium, High, Very High) and impact (Negligible, Low, Medium, High, Critical).

### 3.1 Risk Register

| ID | Risk Description | Likelihood | Impact | Inherent Risk | Mitigation Controls | Residual Risk |
|----|-----------------|-----------|--------|---------------|-------------------|---------------|
| R01 | Unauthorised access to applicant personal/financial data by external attacker | Low | High | High | Keycloak MFA, WAF, rate limiting, ITHC-validated, input validation, parameterised queries | Low |
| R02 | Data breach via application vulnerability (injection, XSS, CSRF) | Low | High | High | Zod validation, React auto-escaping, Helmet headers, ITHC passed (0 critical/high), OWASP controls | Low |
| R03 | Malicious file upload (malware, ransomware) | Medium | Medium | Medium | ClamAV real-time scanning, file type whitelist, 10MB size limit, quarantine workflow, S3 isolation | Low |
| R04 | Denial of service (volumetric or application-layer) | Medium | Medium | Medium | AWS WAF, CloudFront CDN, rate limiting (100/15min), auto-scaling, circuit breakers | Low |
| R05 | Insider threat — AiB staff data misuse or unauthorised access | Low | High | Medium | 9-role RBAC with least privilege, complete audit trail, quarterly access reviews, anomaly detection | Medium |
| R06 | Supply chain compromise (malicious npm package) | Low | Medium | Medium | Dependabot automated alerts, npm audit in CI, package-lock.json integrity, minimal dependency footprint | Low |
| R07 | Loss of service availability (infrastructure failure) | Low | Medium | Medium | Multi-AZ RDS, ECS service auto-restart, health checks, load balancer failover, infrastructure-as-code recovery | Low |
| R08 | Data loss (database corruption or accidental deletion) | Very Low | High | Medium | Automated daily backups, Multi-AZ replication, point-in-time recovery (35-day window), monthly restore testing | Low |
| R09 | Identity fraud — impersonation of debtor or adviser | Low | High | Medium | ScotAccount/GOV.UK Login identity verification, MFA enforcement, address verification, adviser accreditation checks | Low |
| R10 | GDPR breach — data retained beyond lawful period | Low | High | Medium | Retention policy defined (6 years), automated purge job (scheduled), DPO oversight, annual retention audit | Medium |
| R11 | Credential compromise (password reuse, phishing) | Medium | Medium | Medium | MFA enforced for all users, brute force protection (5 attempts lockout), breach detection (haveibeenpwned integration) | Low |
| R12 | Misconfiguration of cloud infrastructure | Low | High | Medium | Infrastructure-as-code (Terraform), peer-reviewed changes, AWS Config rules, CIS benchmark alignment | Low |
| R13 | Third-party service compromise (Experian, ScotAccount) | Very Low | Medium | Low | mTLS for all integrations, circuit breaker pattern, graceful degradation, contractual security requirements | Low |
| R14 | Audit trail tampering or deletion | Very Low | High | Medium | Append-only audit table, database-level access controls, separate audit service, CloudWatch log immutability | Low |

### 3.2 Risk Appetite Statement

The Accountant in Bankruptcy accepts **LOW** residual risk for systems processing OFFICIAL-SENSITIVE personal and financial data relating to Scottish citizens. Medium residual risks are accepted only where:

- Active monitoring is in place to detect materialisation
- A documented remediation plan exists with target completion date
- The risk is reported to the SIRO at quarterly governance meetings
- The risk does not involve potential for bulk data exposure

### 3.3 Risk Treatment Summary

| Residual Risk Level | Count | Treatment |
|--------------------|-------|-----------|
| Low | 11 | Accepted within risk appetite; monitored via standard controls |
| Medium | 3 | Accepted with active monitoring; remediation plans in progress |
| High | 0 | — |
| Critical | 0 | — |

---

## 4. Security Controls Implementation

### 4.1 Technical Controls

| Control Domain | Control | Implementation | Evidence Reference |
|---------------|---------|---------------|-------------------|
| **Authentication** | Multi-factor authentication | Keycloak with TOTP, SMS OTP, and WebAuthn (FIDO2) support; MFA mandatory for all user types | Keycloak realm configuration |
| **Authentication** | Identity federation | ScotAccount (SAML 2.0) and GOV.UK Login (OpenID Connect) integration | docs/identity-architecture.md |
| **Authentication** | Brute force protection | Account lockout after 5 failed attempts (30-minute duration); progressive CAPTCHA | Keycloak brute force settings |
| **Authorisation** | Role-based access control | 9 roles with least privilege: Citizen, Representative, Adviser, Creditor, Casework Officer, Senior Officer, Supervisor, System Admin, Auditor | packages/shared-types/src/rbac.ts |
| **Authorisation** | API-level enforcement | RBAC middleware validates JWT role claims against endpoint permission matrix | services/api-gateway/src/middleware/rbac.ts |
| **Encryption (transit)** | TLS 1.3 | HTTPS enforced on all endpoints; HSTS with 1-year max-age and preload; TLS 1.0/1.1 disabled | CloudFront + ALB configuration |
| **Encryption (at rest)** | AES-256 | RDS encryption (AWS KMS managed key); S3 SSE-S3; EBS volume encryption | Terraform infrastructure code |
| **Input validation** | Schema validation | Zod schemas validate all API inputs (type, format, length, range); reject-by-default | packages/validation/ |
| **Input validation** | SQL injection prevention | Parameterised queries throughout; no dynamic SQL construction | All database access code |
| **Output encoding** | XSS prevention | React automatic escaping; Helmet X-Content-Type-Options; DOMPurify for user content rendering | Next.js framework + Helmet config |
| **Security headers** | HTTP response headers | Helmet.js: X-Frame-Options DENY, X-Content-Type-Options nosniff, Strict-Transport-Security, Referrer-Policy | services/api-gateway/src/index.ts |
| **File security** | Malware scanning | ClamAV daemon scans all uploads in real-time; infected files quarantined and logged | docker-compose.yml (clamav service) |
| **File security** | Upload restrictions | Whitelist: PDF, JPG, PNG, DOCX; max 10MB; filename sanitisation; stored with UUID keys | services/document-service/ |
| **Rate limiting** | Throttling | 100 requests per 15 minutes per IP; stricter limits on authentication endpoints (10/min) | services/api-gateway/ middleware |
| **Session management** | Token lifecycle | Access token: 15-minute expiry; Refresh token: 8-hour expiry with rotation; Secure HttpOnly SameSite=Strict cookies | Keycloak realm settings |
| **Logging & audit** | Comprehensive audit trail | All data access, modifications, and security events logged with actor, timestamp, action, resource, IP, and correlation ID | services/audit-service/ |
| **Vulnerability management** | Dependency scanning | Dependabot automated PRs for vulnerable dependencies; npm audit in CI pipeline; weekly vulnerability review | GitHub Dependabot configuration |
| **Network security** | Segmentation | VPC with public/private subnets; services in private subnet; NAT gateway for outbound; security groups restrict inter-service communication | Terraform VPC module |
| **Network security** | WAF | AWS WAF with managed rule groups: Core Rule Set, Known Bad Inputs, SQL Injection, IP Reputation | Terraform WAF configuration |

### 4.2 Operational Controls

| Control Domain | Control | Implementation | Frequency |
|---------------|---------|---------------|-----------|
| **Patch management** | Security patching | Critical/High CVEs patched within 72 hours; Medium within 14 days; Low within 30 days; routine monthly patch cycle | Monthly (routine) / ad-hoc (critical) |
| **Access management** | Privileged access review | Quarterly review of all admin and elevated access accounts by AiB Senior Officer; evidence retained | Quarterly |
| **Access management** | Joiners/Movers/Leavers | Immediate Keycloak deactivation on departure; role change within 24 hours of notification; HR integration for triggers | Event-driven |
| **Incident response** | Incident management | Severity-based response: P1 (1h response, 4h resolution target), P2 (4h/24h), P3 (24h/5 days), P4 (72h/30 days) | Event-driven |
| **Incident response** | Security incident reporting | Security incidents reported to AiB SIRO within 4 hours; ICO notification within 72 hours where required (Article 33 UK GDPR) | Event-driven |
| **Backup & recovery** | Automated backups | Daily automated RDS snapshots; S3 versioning enabled; 30-day retention; point-in-time recovery enabled (5-minute granularity) | Daily |
| **Backup & recovery** | Restore testing | Monthly restore test to isolated non-production environment; success/failure documented | Monthly |
| **Penetration testing** | ITHC | Annual IT Health Check by CHECK/CREST-accredited provider; findings remediated per severity SLA | Annual |
| **Monitoring** | Security monitoring | Real-time alerting on: failed authentication (>10/min), privilege escalation attempts, unusual data access patterns, WAF blocks | Continuous |
| **Monitoring** | Log retention | CloudWatch Logs retained for 13 months; audit trail database retained for 7 years; tamper-evident (append-only) | Continuous |
| **Change management** | Controlled deployment | All changes peer-reviewed (GitHub PR); automated CI/CD pipeline; staging environment validation; rollback capability | Per change |
| **Business continuity** | Disaster recovery | RTO: 4 hours; RPO: 5 minutes (point-in-time recovery); documented DR procedure; annual DR exercise | Annual exercise |

### 4.3 Personnel Controls

| Control | Implementation | Evidence |
|---------|---------------|----------|
| Security clearance | SC clearance required for all personnel with administrative access to production systems; BPSS for standard development access | Clearance records held by Leidos Security |
| Security awareness training | Annual mandatory training covering phishing, social engineering, data handling, and incident reporting; completion tracked | Training records (>95% completion target) |
| Acceptable use policy | All personnel acknowledge AiB acceptable use policy and data handling procedures on engagement | Signed acknowledgements on file |
| Separation of duties | Code author cannot approve own PR; deployment approval separated from development; audit log reviewers cannot modify audit data | Git branch protection rules; AWS IAM policies |
| Leavers process | Immediate credential revocation upon departure notification; access audit within 24 hours; equipment return tracked | JML process documentation |
| Contractor oversight | All Leidos personnel operate under contracted security obligations; annual renewal of security commitments | Contract schedule (security) |
| Phishing simulation | Quarterly simulated phishing campaigns targeting all users with system access; results reported to SIRO | Quarterly campaign reports |

---

## 5. Data Protection Impact Assessment (Summary)

### 5.1 Data Processing Purpose

IAAS processes personal and financial data for the purpose of:
- Assessing citizen eligibility for Scottish statutory debt solutions
- Generating rules-based product recommendations
- Facilitating application submission to AiB for decision
- Maintaining statutory records as required by the Bankruptcy (Scotland) Act 2016

### 5.2 Lawful Basis for Processing

| Data Category | Lawful Basis | Justification |
|---------------|-------------|---------------|
| Personal data (name, DOB, NI, address) | Article 6(1)(e) UK GDPR — Public task | Statutory function of AiB under Bankruptcy (Scotland) Act 2016 |
| Financial data (income, expenditure, debts) | Article 6(1)(e) UK GDPR — Public task | Required for eligibility assessment and recommendation |
| Special category data (health-related debt) | Article 9(2)(g) UK GDPR — Substantial public interest | Schedule 1, Part 2, Paragraph 6 DPA 2018 (statutory purposes) |
| Credit reference data | Article 6(1)(e) UK GDPR — Public task | Required for comprehensive financial assessment |
| Criminal offence data (if disclosed) | Article 10 UK GDPR — Official authority | Section 10(5) DPA 2018 (exercise of official functions) |

### 5.3 Data Minimisation

- Only data strictly necessary for the recommendation and application is collected
- Credit check results stored in summary form only (score band, default count) — full credit file not retained
- Financial data collected at category level — individual transaction detail not required
- Documents purged automatically after case closure plus statutory retention period (6 years)
- IP addresses logged for security purposes only; purged after 13 months

### 5.4 Data Subject Rights

| Right | Supported | Mechanism | Response Time |
|-------|-----------|-----------|---------------|
| Right of access (Art 15) | Yes | Self-service data export in citizen portal; formal SAR process via DPO for complex requests | 30 days (self-service: immediate) |
| Right to rectification (Art 16) | Yes | Self-service edit for draft applications; staff correction for submitted applications with audit trail | 30 days |
| Right to erasure (Art 17) | Partial | Anonymisation after retention period expires; erasure not available during statutory retention window (legal obligation exemption) | N/A during retention |
| Right to restrict processing (Art 18) | Yes | Application freeze function available to casework officers pending dispute resolution | 72 hours |
| Right to data portability (Art 20) | Yes | JSON export of application data available via citizen portal and API | Immediate (self-service) |
| Right to object (Art 21) | Limited | Processing under statutory obligation — right to object does not apply to public task processing | N/A |
| Automated decision-making (Art 22) | Yes | Recommendation is advisory only — human review for all final decisions; citizen can request full explanation of recommendation logic | Immediate (explanation) |

### 5.5 International Data Transfers

No international data transfers occur. All data is processed and stored within the United Kingdom:
- Computing: AWS eu-west-2 (London)
- Backups: AWS eu-west-2 (London)
- CDN origin: AWS eu-west-2 (London)
- Support personnel: UK-based only

AWS Data Processing Agreement confirms UK data residency with no cross-border processing.

### 5.6 Data Protection by Design

- Privacy by design embedded throughout development lifecycle
- Data minimisation enforced at schema level (Zod validation rejects unnecessary fields)
- Pseudonymisation applied in non-production environments
- Automated retention enforcement prevents indefinite data storage
- Consent withdrawal mechanism available for optional processing (e.g., marketing communications)

---

## 6. Compliance Framework Alignment

| Framework | Status | Notes |
|-----------|--------|-------|
| **NCSC Cyber Essentials Plus** | Aligned | All five controls addressed: boundary firewalls/gateways (WAF, security groups), secure configuration (CIS benchmarks), access control (Keycloak RBAC), malware protection (ClamAV), patch management (72h critical) |
| **NCSC Cyber Assessment Framework** | Aligned | CAF objectives B1 (service protection policies), B2 (identity and access), B3 (data security), B4 (system security), B5 (resilient networks) addressed |
| **Scottish Government Cyber Resilience Framework** | Aligned | Meets requirements for public sector bodies handling OFFICIAL-SENSITIVE data |
| **ISO 27001:2022** | Principles followed | Formal certification not sought for POC phase; control selection aligned with Annex A |
| **OWASP Top 10 (2021)** | Mitigated | All Top 10 risks addressed: A01 (RBAC), A02 (bcrypt+MFA), A03 (Zod), A04 (rate limiting), A05 (Helmet), A06 (Dependabot), A07 (Keycloak), A08 (parameterised queries), A09 (CloudWatch), A10 (SSRF mitigation) |
| **PCI DSS v4.0** | Not applicable | No card data stored or processed; payment via GOV.UK Pay (PCI-compliant gateway) |
| **NHS Data Security & Protection Toolkit** | Not applicable | No health data processing (NHS not a data source) |
| **UK GDPR / DPA 2018** | Compliant | Lawful basis established; DPIA completed; data subject rights implemented; DPO appointed |
| **Equality Act 2010** | Compliant | WCAG 2.1 AA accessibility; no discriminatory data processing; reasonable adjustments available |

---

## 7. Residual Risk Statement

Following implementation of all technical, operational, and personnel controls described in Section 4, the residual risk profile of the IAAS system is:

| Risk Level | Count | Details |
|-----------|-------|---------|
| **Critical** | 0 | — |
| **High** | 0 | — |
| **Medium** | 3 | R05 (insider threat), R10 (data retention compliance), R01 (unauthorised access — reduced from Low to Medium during initial operational period due to limited monitoring baseline) |
| **Low** | 11 | All other identified risks |

### Medium Risk Remediation Plans

| Risk | Remediation Action | Target Date | Owner |
|------|-------------------|-------------|-------|
| R05 (Insider threat) | Deploy SIEM with user behaviour analytics; establish anomaly detection baseline; implement data loss prevention rules | Q4 2026 | AiB CISO |
| R10 (Data retention) | Complete automated purge job implementation; conduct first retention audit; verify purge effectiveness | Q1 2027 | AiB DPO |
| R01 (Unauthorised access — monitoring gap) | Establish monitoring baseline from 3 months operational data; tune alerting thresholds; confirm detection capability | Q1 2027 | Leidos Security |

### Overall Assessment

The system presents an **acceptable level of risk** for processing OFFICIAL-SENSITIVE data in a controlled Beta environment. No critical or high residual risks exist. The three medium risks have documented remediation plans, assigned owners, and target dates, and are monitored at quarterly SIRO governance meetings.

---

## 8. Conditions of Operation

The following conditions must be maintained for this Authority to Operate to remain valid:

1. **Authentication** — All users must authenticate via Keycloak with multi-factor authentication enabled; no bypass mechanisms permitted
2. **Personnel clearance** — Administrative access to production systems restricted to SC-cleared personnel only
3. **Penetration testing** — Annual ITHC conducted by CHECK/CREST-accredited provider; all critical and high findings remediated within 14 days
4. **Patch management** — Monthly patching cycle maintained; critical vulnerabilities patched within 72 hours of disclosure
5. **Access reviews** — Quarterly review of all privileged access conducted and evidenced by AiB Senior Officer
6. **Annual re-approval** — SIRO re-approval required annually or upon significant system change (architecture modification, new data category, new integration, change of hosting provider)
7. **Incident reporting** — Security incidents reported to AiB SIRO within 4 hours; ICO notification within 72 hours where personal data breach confirmed
8. **Data retention** — 6-year statutory retention period enforced; automated purge operational and audited annually
9. **Monitoring** — Security monitoring operational 24/7; alerting configured for authentication anomalies, data exfiltration indicators, and availability degradation
10. **Backup verification** — Monthly restore test conducted and documented; annual disaster recovery exercise
11. **Change control** — All production changes approved via peer review; automated CI/CD pipeline with security scanning gates
12. **Third-party assurance** — Annual security assurance review of critical third-party services (AWS, Experian, ScotAccount)

Breach of any condition requires immediate notification to the SIRO and may result in suspension of the Authority to Operate pending remediation.

---

## 9. Recommendation

Based on the comprehensive security assessment, risk analysis, and controls implementation described in this document, and considering:

- The clean ITHC result (0 critical, 0 high findings)
- The defence-in-depth architecture with multiple overlapping controls
- The acceptable residual risk profile (0 critical, 0 high, 3 medium, 11 low)
- The clear remediation plans for medium residual risks
- The alignment with NCSC, Scottish Government, and OWASP frameworks
- The robust data protection measures and UK GDPR compliance

The IAAS service is recommended for **Authority to Operate at OFFICIAL-SENSITIVE** classification for a period of **12 months** from the date of SIRO approval, subject to the Conditions of Operation defined in Section 8.

This authority covers the Beta deployment phase. A revised security case will be submitted prior to Live (general availability) deployment, incorporating operational monitoring data, user research outcomes, and any findings from the Beta operational period.

---

## 10. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| System Owner (AiB) | Robert Anderson | _________________ | ____/____/2026 |
| Senior Information Risk Owner (SIRO) | Alastair Campbell | _________________ | ____/____/2026 |
| Chief Information Security Officer | David Chen | _________________ | ____/____/2026 |
| Data Protection Officer | Fiona Stewart | _________________ | ____/____/2026 |
| Delivery Manager (Leidos) | Karen MacLeod | _________________ | ____/____/2026 |
| Security Architect (Leidos) | James Murray | _________________ | ____/____/2026 |

### Approval Decision

☐ **APPROVED** — Authority to Operate granted for 12 months from signature date

☐ **APPROVED WITH CONDITIONS** — Authority granted subject to additional conditions (specify below)

☐ **DEFERRED** — Additional information or remediation required before approval (specify below)

☐ **REJECTED** — Unacceptable risk; system must not process live data

**Additional Conditions / Comments:**

_________________________________________________________________________

_________________________________________________________________________

_________________________________________________________________________

**SIRO Signature:** _________________________________ **Date:** ____/____/2026

---

## Appendices

| Appendix | Title | Reference |
|----------|-------|-----------|
| A | IT Health Check (ITHC) Penetration Test Report | docs/ithc-penetration-test-report.md |
| B | WCAG 2.1 Accessibility Audit | docs/wcag-accessibility-audit.md |
| C | GDS Service Standard Self-Assessment | docs/gds-service-assessment.md |
| D | Security Architecture Document | docs/security.md |
| E | Integration Architecture | docs/integrations.md |
| F | Data Protection Impact Assessment (Full) | docs/dpia.md (in progress) |
| G | Disaster Recovery Plan | docs/runbook.md (Section: DR Procedures) |
| H | Incident Response Playbook | docs/runbook.md (Section: Incident Management) |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 1 August 2026 | Leidos Security Architecture | Initial draft |
| 0.2 | 12 August 2026 | Leidos Security Architecture | Incorporated ITHC findings; updated risk register |
| 1.0 | 21 August 2026 | Leidos Security Architecture | Final draft for SIRO review; DPIA summary added |

---

*This document has been prepared by Leidos Security Architecture on behalf of the Accountant in Bankruptcy. It represents the security case for the IAAS system at the point of Beta deployment. The assessment is based on design documentation, code review, automated testing results, and the IT Health Check conducted in August 2026. This document should be read in conjunction with the referenced appendices for full technical detail.*

*Classification: OFFICIAL-SENSITIVE — handle in accordance with Scottish Government security policy. Do not distribute outside the named distribution list without SIRO approval.*
