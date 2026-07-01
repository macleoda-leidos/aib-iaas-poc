# Identity Architecture — Keycloak Consolidation Strategy

## Current State: Siloed Identity

Each AiB system manages its own users independently:

```
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│  BASYS  │  │  ASTRA  │  │  eDEN   │  │   CFT   │  │   RoI   │
│ 85 users│  │120 users│  │340 users│  │180 users│  │ 45 users│
│  LDAP   │  │  LDAP   │  │  SAML   │  │  OIDC   │  │  LDAP   │
└────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
     │            │            │            │            │
     └────────────┴────────────┴────────────┴────────────┘
                         No federation
                   Users duplicated across systems
                   No single sign-on
                   500+ accounts, many duplicates
```

**Problems:**
- Users maintain separate credentials per system
- No SSO — logging into eDEN doesn't carry to CFT
- Role management is per-system, inconsistent
- Joiners/movers/leavers require updates in each system
- No single audit trail for identity events
- ScotAccount only integrated with eDEN currently

## Target State: Keycloak Federation

```
                    ┌─────────────────────────┐
                    │      Keycloak 24.x       │
                    │   (HA on Azure)          │
                    │                          │
                    │  ┌─────────────────────┐ │
                    │  │  Identity Providers  │ │
                    │  │  - Active Directory  │ │
                    │  │  - ScotAccount SAML  │ │
                    │  │  - GOV.UK One Login  │ │
                    │  └─────────────────────┘ │
                    │                          │
                    │  ┌─────────────────────┐ │
                    │  │      Realms          │ │
                    │  │  - aib-internal      │ │
                    │  │  - external-advisers │ │
                    │  │  - public-debtors    │ │
                    │  │  - creditors         │ │
                    │  └─────────────────────┘ │
                    └────────────┬─────────────┘
                                 │
           ┌──────────┬──────────┼──────────┬──────────┐
           │          │          │          │          │
      ┌────┴───┐ ┌───┴────┐ ┌──┴───┐ ┌───┴───┐ ┌───┴───┐
      │ BASYS  │ │ ASTRA  │ │ eDEN │ │  CFT  │ │  RoI  │
      │(client)│ │(client)│ │(cli) │ │(cli)  │ │(cli)  │
      └────────┘ └────────┘ └──────┘ └───────┘ └───────┘
                                                    │
                                              ┌─────┴─────┐
                                              │   IAAS    │
                                              │(new client)│
                                              └───────────┘
```

## Keycloak Realm Structure

### Realm: `aib-internal`
- **Users:** ~120 AiB staff (case officers, senior officers, policy, IT)
- **IdP:** Active Directory (LDAP federation)
- **Clients:** BASYS, ASTRA, RoI, IAAS-admin
- **Roles:** system_admin, senior_officer, case_officer, readonly, das_team, policy

### Realm: `external-advisers`
- **Users:** ~220 money advisers, trustees, payment distributors
- **IdP:** ScotAccount (SAML), organisation-managed SSO
- **Clients:** eDEN, CFT, IAAS-adviser
- **Roles:** money_adviser, trustee, payment_distributor, supervisor
- **Org mapping:** Users belong to parent organisations (CAS → Edinburgh Bureau)

### Realm: `public-debtors`
- **Users:** ~150+ applicants (growing)
- **IdP:** ScotAccount (SAML), GOV.UK One Login (OIDC), manual registration
- **Clients:** IAAS-web
- **Roles:** debtor, applicant
- **Self-service:** password reset, MFA, consent management

### Realm: `creditors`
- **Users:** ~80 creditor representatives
- **IdP:** Organisation SSO (various), manual
- **Clients:** CFT, IAAS-creditor
- **Roles:** creditor_admin, creditor_user, claims_handler

## Identity Providers

| Provider | Protocol | Used By | Level of Assurance |
|----------|----------|---------|-------------------|
| Active Directory | LDAP | AiB internal staff | High (managed) |
| ScotAccount | SAML 2.0 | eDEN users, public debtors | LOA2 Medium |
| GOV.UK One Login | OIDC | Public debtors (UK-wide) | LOA2 Medium |
| Organisation SSO | OIDC/SAML | Creditors, large adviser firms | Varies |
| Manual + MFA | Password + TOTP | Fallback for all | LOA1 + MFA |

## ScotAccount Integration

ScotAccount is the Scottish Government's digital identity service, already used by eDEN. Integration approach:

1. **Keycloak Identity Broker** — ScotAccount configured as external IdP via SAML 2.0
2. **Attribute mapping:** ScotAccount provides: name, DOB, address, NINO (verified)
3. **Account linking:** First login creates Keycloak account, subsequent logins link
4. **eDEN users migrate seamlessly** — existing ScotAccount sessions carry over

```
User → IAAS → Keycloak → "Sign in with ScotAccount" → ScotAccount
                                                            ↓
                                                     SAML Assertion
                                                            ↓
Keycloak ← verified attributes (name, DOB, address, NINO)
    ↓
IAAS ← JWT token with verified claims + roles
```

## Role Mapping

Keycloak manages **realm roles** which map to **application permissions**:

| Keycloak Role | IAAS Permission | BASYS | eDEN | CFT |
|--------------|-----------------|-------|------|-----|
| aib_senior | All + approve | Case admin | DAS admin | Provider admin |
| aib_officer | Read + update | Case view | DAS process | — |
| money_adviser | Create + submit | — | Full access | Provider view |
| trustee | Case manage | Trustee view | — | Full access |
| creditor | View relevant | — | — | Claims + vote |
| debtor | Own data only | — | Self-service | — |

## Migration Strategy

### Phase 1: Keycloak Deployment (Week 1-2)
- Deploy Keycloak on Azure Container Apps
- Configure AD federation for internal users
- Import existing user data from each system

### Phase 2: ScotAccount Federation (Week 3-4)
- Configure ScotAccount as SAML IdP in Keycloak
- Migrate eDEN's ScotAccount integration to go via Keycloak
- Test account linking for existing eDEN users

### Phase 3: Client Migration (Week 5-8)
- Register each system as Keycloak OIDC client
- Migrate BASYS auth → Keycloak (LDAP already federated)
- Migrate CFT auth → Keycloak OIDC
- Configure IAAS as new client

### Phase 4: GOV.UK One Login (Week 9-10)
- Register as GOV.UK One Login relying party
- Configure as additional IdP in public-debtors realm
- Allow debtors to choose ScotAccount or GOV.UK

### Phase 5: Decommission Legacy Auth (Week 11-12)
- Remove per-system user databases
- All auth flows via Keycloak
- Unified audit trail operational

## Why Keycloak?

| Requirement | Keycloak Capability |
|-------------|-------------------|
| 500+ users, multiple orgs | Multi-realm, federation |
| ScotAccount SAML | Built-in Identity Brokering |
| GOV.UK OIDC | Standard OIDC client support |
| Active Directory | LDAP federation (real-time) |
| Role-based access | Realm + client roles, composites |
| Organisation hierarchy | Groups with sub-groups |
| Audit trail | Built-in event logging |
| MFA | TOTP, WebAuthn, SMS (plugin) |
| Self-service | Account console, password reset |
| Open source | Apache 2.0, no licensing cost |
| Scottish Gov precedent | Used by other SG services |

## Answer: Should We Consolidate First?

**Yes — consolidate identity first, then build applications on top.** Reasoning:

1. IAAS needs to query user identity across BASYS, eDEN, CFT, RoI for case checks
2. Without consolidated identity, each cross-system check requires separate auth
3. Keycloak provides the "identity fabric" that all services (old and new) can plug into
4. The organisation hierarchy (parent/child) maps naturally to Keycloak Groups
5. Future services automatically get SSO, RBAC, and audit for free

The POC's `user-service` and `organisation-service` demonstrate the **data model**. In production, Keycloak replaces the auth portions while the services retain business logic (permissions, org hierarchy queries, etc.).

## Multi-Factor Authentication (MFA)

### Keycloak Native MFA

Keycloak provides built-in MFA with the following methods:

| Method | Protocol | User Experience | Supported Apps |
|--------|----------|-----------------|----------------|
| TOTP (Time-based OTP) | RFC 6238 | 6-digit code from authenticator app | Google Authenticator, Microsoft Authenticator, Okta Verify, Authy |
| WebAuthn / FIDO2 | W3C WebAuthn | Fingerprint, Face ID, or USB security key | YubiKey, Windows Hello, Touch ID, Android biometric |
| Email OTP | SMTP | One-time code sent to registered email | Any email client |
| SMS OTP | Plugin | One-time code via text message | Any mobile phone |

### MFA Policy Configuration

```
Per-realm MFA policies in Keycloak:
- aib-internal:     Required (TOTP or WebAuthn)
- external-advisers: Required (TOTP, WebAuthn, or Email)
- public-debtors:   Conditional (required for financial actions, optional for read-only)
- creditors:        Required (TOTP or WebAuthn)
```

### Okta Integration Options

If the customer has existing Okta infrastructure, three integration patterns are available:

**Option A: Okta as Identity Provider in Keycloak (Recommended)**
```
User → Keycloak login → "Sign in with Okta" button → Okta handles auth + MFA
  → OIDC token returned to Keycloak → Keycloak issues session for all AiB systems
```
- Okta enforces its own MFA policies (Okta Verify, push notifications)
- Keycloak receives verified identity without handling MFA itself
- Best of both: Okta's MFA + Keycloak's multi-system federation

**Option B: Okta replaces Keycloak entirely**
- Use Okta as the sole identity provider
- Each AiB system registered as an Okta OIDC application
- MFA handled entirely by Okta
- Simpler if all users are already in Okta
- Less flexible for ScotAccount/GOV.UK federation (requires Okta Inbound Federation)

**Option C: Keycloak with Okta Verify as authenticator**
- Keycloak handles authentication and federation
- Okta Verify app used as the TOTP authenticator (compatible with standard TOTP)
- No Okta platform dependency — just the authenticator app
- Cheapest option (no Okta licence needed for just the app)

### Recommendation

**Option A** is recommended because:
1. Preserves Keycloak's multi-realm federation (ScotAccount, GOV.UK, AD)
2. Leverages existing Okta investment for MFA (push notifications, adaptive policies)
3. Users with Okta accounts get SSO across both Okta and AiB systems
4. Non-Okta users (debtors via ScotAccount) aren't forced into Okta

### Adaptive MFA (Risk-Based)

Keycloak 24+ supports conditional MFA based on risk signals:
- New device → require MFA
- Unusual location → require MFA
- High-value action (payment, case decision) → step-up MFA
- Trusted device + normal hours → skip MFA (remember for 30 days)

This reduces friction for low-risk actions while enforcing strong auth for sensitive operations.
