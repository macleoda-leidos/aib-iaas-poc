# Mock Integrations Service

Provides stub APIs for all AiB external systems used in the IAAS POC.

## Systems Mocked

| System | Endpoint Base | Purpose | Trigger Condition |
|--------|--------------|---------|-------------------|
| BASYS | `/api/basys/` | Bankruptcy/sequestration lookup | NI ending 'A' or surname 'SMITH' |
| eDEN/DASH | `/api/eden/` | DAS arrangement lookup | Surname starting with 'M' |
| DAS | `/api/das/` | Debt Payment Programme check | Total debt £5k-£20k |
| CFT | `/api/cft/` | Provider/trustee reference data | Always returns data |
| Moratorium | `/api/moratorium/` | Breathing space check | Postcode starting 'EH' |
| RoI | `/api/roi/` | Register of Insolvencies search | Surname containing 'TEST' |
| Credit Check | `/api/credit-check/` | Credit reference check | Always returns synthetic score |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3005 | Service port |
| `MOCK_LATENCY_MIN_MS` | 100 | Minimum simulated latency |
| `MOCK_LATENCY_MAX_MS` | 500 | Maximum simulated latency |
| `MOCK_FAILURE_RATE` | 0.05 | Probability of simulated 503 error |

## Production Replacement

Each mock would be replaced by:
1. A real HTTP/message client with proper authentication (mTLS, OAuth, API keys)
2. Network connectivity to AiB internal systems (VPN/PrivateLink)
3. Production-grade error handling, retry, and circuit-breaking
4. Monitoring and alerting on response times and error rates
5. Data mapping from AiB-specific formats to IAAS canonical model

The mock integration contracts serve as the specification for what the real integrations must provide.
