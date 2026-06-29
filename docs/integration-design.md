# Integration Design

## Overview

The IAAS integrates with six existing AiB systems plus external services. In the POC, all integrations are mocked with synthetic data. This document describes the integration architecture and the path from mock to production.

## Integration Architecture

```
┌─────────────────────────────────────────┐
│         Integration Orchestrator         │
│  - Parallel execution                    │
│  - Circuit breaker per system            │
│  - Timeout handling                      │
│  - Result aggregation                    │
└───────┬──────┬──────┬──────┬──────┬────┘
        │      │      │      │      │
   ┌────┴─┐ ┌─┴───┐ ┌┴────┐ ┌┴───┐ ┌┴────┐
   │BASYS │ │eDEN │ │ DAS │ │CFT │ │Morat│ │RoI│
   └──────┘ └─────┘ └─────┘ └────┘ └─────┘ └───┘
```

## Mock Integration Specifications

### BASYS (Bankruptcy Administration System)

| Attribute | Value |
|-----------|-------|
| Mock endpoint | POST /api/basys/lookup |
| Purpose | Check for existing sequestration/bankruptcy cases |
| Match criteria (mock) | NI number ending 'A' OR surname 'SMITH' |
| Response model | Case reference, type, status, date, trustee |
| Latency simulation | 100-500ms configurable |
| Production replacement | Secure API to BASYS case management system |
| Auth requirement (prod) | mTLS + API key |
| Data sensitivity | HIGH - personal insolvency records |

### eDEN/DASH (DAS Electronic System)

| Attribute | Value |
|-----------|-------|
| Mock endpoint | POST /api/eden/lookup |
| Purpose | Check for DAS arrangements and payment programmes |
| Match criteria (mock) | Surname starting with 'M' |
| Response model | Arrangement ref, status, approved date, payments |
| Production replacement | eDEN API or message queue integration |
| Auth requirement (prod) | OAuth 2.0 client credentials |

### DAS (Debt Arrangement Scheme)

| Attribute | Value |
|-----------|-------|
| Mock endpoint | POST /api/das/lookup |
| Purpose | Check for DAS applications or active DPPs |
| Match criteria (mock) | Total debt £5,000-£20,000 |
| Response model | Programme ref, status, adviser, payment amount |
| Production replacement | DAS programme management API |

### CFT (Creditor/Trustee/Provider)

| Attribute | Value |
|-----------|-------|
| Mock endpoint | POST /api/cft/lookup |
| Purpose | Reference data - available providers and trustees |
| Match criteria (mock) | Always returns provider list |
| Response model | Provider name, registration, type, status |
| Production replacement | CFT reference data service |

### Moratorium

| Attribute | Value |
|-----------|-------|
| Mock endpoint | POST /api/moratorium/check |
| Purpose | Check for active moratorium (breathing space) |
| Match criteria (mock) | Postcode starting with 'EH' |
| Response model | Moratorium ref, start/end dates, status |
| Production replacement | Moratorium register API |

### RoI (Register of Insolvencies)

| Attribute | Value |
|-----------|-------|
| Mock endpoint | POST /api/roi/search |
| Purpose | Public register search for insolvency entries |
| Match criteria (mock) | Surname containing 'TEST' |
| Response model | Entry ID, type, dates, status, linked case |
| Production replacement | RoI public search API (may be partially open) |

## Contract Testing

Each integration has contract tests that verify:
1. Request format matches expected schema
2. Response format matches expected schema
3. Success scenario returns correct structure
4. Not-found scenario returns correct structure
5. Error scenario is handled gracefully

## Production Migration Path

For each integration:

1. **Define API contract** — OpenAPI 3.0 specification
2. **Implement adapter** — Replace mock HTTP client with production client
3. **Configure auth** — mTLS certificates, API keys, OAuth tokens via Secrets Manager
4. **Network path** — VPN/PrivateLink to AiB internal network
5. **Error handling** — Retry policies, circuit breaker thresholds
6. **Monitoring** — Response time alerts, error rate alerts
7. **Fallback** — Graceful degradation if a system is unavailable

## Circuit Breaker Configuration

| Parameter | Value |
|-----------|-------|
| Failure threshold | 5 failures |
| Reset timeout | 30 seconds |
| Half-open requests | 1 |
| Timeout per call | 5 seconds |
| Total orchestration timeout | 15 seconds |
