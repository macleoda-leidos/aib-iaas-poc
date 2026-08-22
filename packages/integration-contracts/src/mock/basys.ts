import { IBasysClient } from '../interfaces';
import { IntegrationResult, BasysCase, LookupParams } from '../types';

export interface MockClientOptions {
  failureRate?: number;
}

/**
 * Mock BASYS client - Bankruptcy Administration System.
 * Simulates lookup of debtor records in the bankruptcy/sequestration system.
 *
 * Matching logic (consistent with mock-integrations service):
 * - NI number ending in 'A' OR lastName 'SMITH' triggers a found case.
 */
export class BasysMockClient implements IBasysClient {
  private failureRate: number;

  constructor(options: MockClientOptions = {}) {
    this.failureRate = options.failureRate ?? 0;
  }

  async lookup(params: LookupParams): Promise<IntegrationResult<BasysCase>> {
    const start = Date.now();

    // Simulate network latency (50-200ms)
    await new Promise(r => setTimeout(r, 50 + Math.random() * 150));

    const responseTime = Date.now() - start;

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      return {
        found: false,
        data: null,
        system: 'BASYS',
        responseTime,
        error: 'Service temporarily unavailable (simulated failure)',
      };
    }

    // Synthetic matching: NI ending in 'A' or surname SMITH
    const niEndsA = params.niNumber?.endsWith('A');
    const isSmith = params.lastName?.toUpperCase() === 'SMITH';

    if (niEndsA || isSmith) {
      return {
        found: true,
        data: {
          caseRef: 'SEQ-2019-004521',
          type: 'sequestration',
          status: 'discharged',
          debtorName: `${params.firstName || 'Unknown'} ${params.lastName || 'Unknown'}`,
          dateRegistered: '2019-08-14',
        },
        system: 'BASYS',
        responseTime,
      };
    }

    return {
      found: false,
      data: null,
      system: 'BASYS',
      responseTime,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
