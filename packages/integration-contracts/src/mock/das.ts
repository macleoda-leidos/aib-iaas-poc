import { IDasClient } from '../interfaces';
import { IntegrationResult, DasEntry, LookupParams } from '../types';

export interface MockClientOptions {
  failureRate?: number;
}

/**
 * Mock DAS client - Debt Arrangement Scheme Programme Checks.
 * Simulates checking for existing DAS applications or active programmes.
 *
 * Matching logic (consistent with mock-integrations service):
 * - NI number containing digits that sum to an even number triggers a found entry.
 *   (Simplified from the HTTP service which uses totalDebt range, since LookupParams
 *    does not include debt amounts.)
 */
export class DasMockClient implements IDasClient {
  private failureRate: number;

  constructor(options: MockClientOptions = {}) {
    this.failureRate = options.failureRate ?? 0;
  }

  async lookup(params: LookupParams): Promise<IntegrationResult<DasEntry>> {
    const start = Date.now();

    // Simulate network latency (50-200ms)
    await new Promise(r => setTimeout(r, 50 + Math.random() * 150));

    const responseTime = Date.now() - start;

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      return {
        found: false,
        data: null,
        system: 'DAS',
        responseTime,
        error: 'Service temporarily unavailable (simulated failure)',
      };
    }

    // Synthetic matching: NI number digit sum is even (deterministic based on input)
    const digitSum = params.niNumber
      .replace(/[^0-9]/g, '')
      .split('')
      .reduce((sum, d) => sum + parseInt(d, 10), 0);
    const hasExisting = digitSum % 2 === 0;

    if (hasExisting) {
      return {
        found: true,
        data: {
          programmeRef: 'DPP-2023-001234',
          status: 'application_in_progress',
          debtorName: `${params.firstName || 'Unknown'} ${params.lastName || 'Unknown'}`,
        },
        system: 'DAS',
        responseTime,
      };
    }

    return {
      found: false,
      data: null,
      system: 'DAS',
      responseTime,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
