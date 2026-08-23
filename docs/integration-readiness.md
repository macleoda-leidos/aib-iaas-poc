# Integration Readiness Guide

This document describes how to transition each mock integration to its live counterpart in production. Each section covers the current mock behaviour, what is required for live operation, the code changes needed, fallback strategies, and environment variables.

---

## 1. ScotAccount SAML (Identity Verification)

**Current Mock:** The identity verification panel in the web portal simulates a 2-second delay then pre-fills personal details (name, DOB, NI number) with hardcoded test data. No external redirect occurs.

**What's Needed for Live:**
- Register as a Service Provider with the ScotAccount Identity Provider (IdP)
- Obtain SAML metadata XML, Entity ID, and assertion consumer service URL
- Install a SAML 2.0 library (e.g. `passport-saml` for Node.js or `Sustainsys.Saml2` for .NET)
- Configure certificate exchange for assertion signing/encryption

**Code Change:**
- Implement `ScotAccountSamlClient` behind the existing `IdentityVerificationService` interface
- Update the auth route factory to resolve the live client when `SCOTACCOUNT_ENABLED=true`
- Parse SAML assertions to extract verified claims (firstName, lastName, dateOfBirth, NI number)

**Fallback Strategy:** If the IdP is unreachable or returns an error, fall back to manual entry (LOA1) and log an audit event. Show a user-friendly message explaining the service is temporarily unavailable.

**Environment Variables:**
- `SCOTACCOUNT_ENABLED` — toggle live vs mock (`true`/`false`)
- `SCOTACCOUNT_IDP_METADATA_URL` — IdP metadata endpoint
- `SCOTACCOUNT_ENTITY_ID` — SP entity identifier
- `SCOTACCOUNT_CERT_PATH` — path to SP signing certificate
- `SCOTACCOUNT_PRIVATE_KEY_PATH` — path to SP private key

---

## 2. Experian Credit Check

**Current Mock:** The credit check service generates a deterministic score derived from a hash of the NI number. It returns synthetic values for score, band, defaults, CCJs, and utilisation percentage.

**What's Needed for Live:**
- Obtain Experian Connect API credentials (client ID, secret, subscriber code)
- Agree data-sharing terms and pass Experian's integration certification
- Implement consent capture (explicit user consent is required before running a credit search)
- Handle Experian's XML or JSON response schema for credit reports

**Code Change:**
- Implement `ExperianApiClient` conforming to the `CreditCheckProvider` interface
- Update the credit-check service factory: resolve `ExperianApiClient` when `CREDIT_CHECK_PROVIDER=experian`
- Map Experian response fields (score, defaults, CCJs, active accounts) to the internal `CreditCheckResult` model

**Fallback Strategy:** If Experian is unavailable, queue the credit check request and mark the application as "pending credit check". Retry with exponential backoff (max 3 attempts). Notify the case officer that manual review may be required.

**Environment Variables:**
- `CREDIT_CHECK_PROVIDER` — `synthetic` or `experian`
- `EXPERIAN_CLIENT_ID` — API client identifier
- `EXPERIAN_CLIENT_SECRET` — API secret (store in secrets manager)
- `EXPERIAN_API_URL` — base URL (sandbox vs production)
- `EXPERIAN_SUBSCRIBER_CODE` — subscriber identifier for search requests

---

## 3. BASYS & eDEN (AiB Internal Systems)

**Current Mock:** The integration orchestrator's mock-integrations service returns `clear` or `found` status based on pattern matching against the applicant's surname and NI number suffix. Response times are randomised between 100-400ms.

**What's Needed for Live:**
- VPN or private network connectivity to AiB's internal network
- Service accounts with appropriate role-based access for read-only queries
- API specifications for BASYS (Bankruptcy Administration System) and eDEN/DASH (Debt Arrangement Scheme Hub)
- Mutual TLS certificates for service-to-service authentication

**Code Change:**
- Implement `BasysApiClient` and `EdenApiClient` conforming to `SystemCheckProvider` interface
- Update the integration orchestrator's provider registry to resolve live clients per `BASYS_ENABLED` and `EDEN_ENABLED` flags
- Map BASYS case records and eDEN arrangement records to the internal `SystemCheckResult` model

**Fallback Strategy:** If either system is unreachable, return a `degraded` status rather than blocking the application. Flag the application for manual verification. Implement circuit breaker pattern (open after 5 consecutive failures, half-open after 30 seconds).

**Environment Variables:**
- `BASYS_ENABLED` / `EDEN_ENABLED` — toggle live vs mock
- `BASYS_API_URL` / `EDEN_API_URL` — internal service endpoints
- `BASYS_CLIENT_CERT_PATH` / `EDEN_CLIENT_CERT_PATH` — mTLS certificates
- `BASYS_SERVICE_ACCOUNT` / `EDEN_SERVICE_ACCOUNT` — service account identifiers
- `INTEGRATION_TIMEOUT_MS` — request timeout (default 5000ms)

---

## 4. GOV.UK Pay (Payment Processing)

**Current Mock:** The payment section simulates a successful £90 payment after the user selects a payment method and clicks submit. No actual payment gateway interaction occurs.

**What's Needed for Live:**
- Register a GOV.UK Pay service account and obtain API keys
- Configure webhook endpoints for payment status callbacks
- Implement the create-payment / get-payment flow per GOV.UK Pay API specification
- Set up reconciliation processes for payment tracking

**Code Change:**
- Implement `GovUkPayClient` behind the `PaymentGateway` interface
- Update the payment service factory: resolve `GovUkPayClient` when `PAYMENT_PROVIDER=govuk_pay`
- Create payment via POST to GOV.UK Pay, redirect user to hosted payment page, handle return URL with status check

**Fallback Strategy:** If GOV.UK Pay is unavailable, offer the user an option to "pay later" with a 7-day deadline. Store the pending payment reference and send a reminder notification. Never block submission solely due to payment gateway unavailability.

**Environment Variables:**
- `PAYMENT_PROVIDER` — `sandbox` or `govuk_pay`
- `GOVUK_PAY_API_KEY` — API key (store in secrets manager)
- `GOVUK_PAY_API_URL` — `https://publicapi.payments.service.gov.uk` (production)
- `GOVUK_PAY_RETURN_URL` — URL users return to after payment
- `GOVUK_PAY_WEBHOOK_SECRET` — webhook signature verification secret

---

## 5. GOV.UK Notify (Notifications)

**Current Mock:** The notification service logs notification events to the audit trail but does not send any actual emails or SMS messages. Templates are referenced by name but not rendered.

**What's Needed for Live:**
- Register a GOV.UK Notify service and obtain API keys
- Create email and SMS templates in the GOV.UK Notify dashboard
- Map internal template names to GOV.UK Notify template IDs
- Configure reply-to email addresses

**Code Change:**
- Implement `GovUkNotifyClient` behind the `NotificationSender` interface
- Update the notification service factory: resolve `GovUkNotifyClient` when `NOTIFICATION_PROVIDER=govuk_notify`
- Pass personalisation parameters (applicant name, reference number, dates) when sending via the Notify API

**Fallback Strategy:** If GOV.UK Notify is unavailable, queue notifications in a retry table with exponential backoff. Log all attempted notifications to the audit service regardless of delivery status. Implement a dead-letter queue for notifications that fail after 5 retries.

**Environment Variables:**
- `NOTIFICATION_PROVIDER` — `mock` or `govuk_notify`
- `GOVUK_NOTIFY_API_KEY` — API key (store in secrets manager)
- `GOVUK_NOTIFY_EMAIL_TEMPLATE_ID` — default email template
- `GOVUK_NOTIFY_SMS_TEMPLATE_ID` — default SMS template
- `GOVUK_NOTIFY_REPLY_TO_EMAIL` — reply-to address for outbound emails

---

## General Recommendations

1. **Feature Flags:** Use environment-variable-based feature flags to toggle each integration independently. This allows gradual rollout and instant rollback.
2. **Secrets Management:** Store all API keys and certificates in Azure Key Vault or AWS Secrets Manager. Never commit credentials to source control.
3. **Circuit Breakers:** Implement circuit breaker patterns for all external calls to prevent cascade failures.
4. **Audit Logging:** Log every external integration call (request, response status, duration) to the audit service for compliance and debugging.
5. **Health Checks:** Add health check endpoints that verify connectivity to each external dependency, enabling infrastructure monitoring and alerting.
