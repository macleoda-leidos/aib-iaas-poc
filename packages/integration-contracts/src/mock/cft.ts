import { ICftClient } from '../interfaces';
import { IntegrationResult, CftProvider, LookupParams } from '../types';

export interface MockClientOptions {
  failureRate?: number;
}

/**
 * Mock CFT client - Creditor/Trustee/Provider Facing Information.
 * Returns registered providers, trustees, and creditor information.
 *
 * Matching logic (consistent with mock-integrations service):
 * - CFT is a reference data service; it always returns a found provider.
 */
export class CftMockClient implements ICftClient {
  private failureRate: number;

  constructor(options: MockClientOptions = {}) {
    this.failureRate = options.failureRate ?? 0;
  }

  async lookup(params: LookupParams): Promise<IntegrationResult<CftProvider>> {
    const start = Date.now();

    // Simulate network latency (50-200ms)
    await new Promise(r => setTimeout(r, 50 + Math.random() * 150));

    const responseTime = Date.now() - start;

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      return {
        found: false,
        data: null,
        system: 'CFT',
        responseTime,
        error: 'Service temporarily unavailable (simulated failure)',
      };
    }

    // CFT always returns data (it's a reference data service)
    return {
      found: true,
      data: {
        id: 'PROV-001',
        name: 'Sample Insolvency Practitioners LLP',
        type: 'insolvency_practitioner',
        status: 'active',
      },
      system: 'CFT',
      responseTime,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
