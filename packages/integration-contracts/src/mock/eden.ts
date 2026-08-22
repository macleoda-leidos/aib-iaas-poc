import { IEdenClient } from '../interfaces';
import { IntegrationResult, EdenArrangement, LookupParams } from '../types';

export interface MockClientOptions {
  failureRate?: number;
}

/**
 * Mock eDEN client - Debt Arrangement Scheme Electronic System.
 * Simulates lookup of DAS-related debt arrangements.
 *
 * Matching logic (consistent with mock-integrations service):
 * - Surname starting with 'M' triggers an active arrangement.
 */
export class EdenMockClient implements IEdenClient {
  private failureRate: number;

  constructor(options: MockClientOptions = {}) {
    this.failureRate = options.failureRate ?? 0;
  }

  async lookup(params: LookupParams): Promise<IntegrationResult<EdenArrangement>> {
    const start = Date.now();

    // Simulate network latency (50-200ms)
    await new Promise(r => setTimeout(r, 50 + Math.random() * 150));

    const responseTime = Date.now() - start;

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      return {
        found: false,
        data: null,
        system: 'eDEN',
        responseTime,
        error: 'Service temporarily unavailable (simulated failure)',
      };
    }

    // Synthetic matching: surname starting with 'M'
    const startsWithM = params.lastName?.toUpperCase().startsWith('M');

    if (startsWithM) {
      return {
        found: true,
        data: {
          arrangementRef: 'DAS-ARR-2022-007834',
          type: 'debt_payment_programme',
          status: 'active',
          debtorName: `${params.firstName || 'Unknown'} ${params.lastName || 'Unknown'}`,
          startDate: '2022-03-15',
        },
        system: 'eDEN',
        responseTime,
      };
    }

    return {
      found: false,
      data: null,
      system: 'eDEN',
      responseTime,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
