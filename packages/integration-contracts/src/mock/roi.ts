import { IRoiClient } from '../interfaces';
import { IntegrationResult, RoiEntry, LookupParams } from '../types';

export interface MockClientOptions {
  failureRate?: number;
}

/**
 * Mock RoI client - Register of Insolvencies.
 * Searches the public Register of Insolvencies for existing entries.
 *
 * Matching logic (consistent with mock-integrations service):
 * - Surname containing 'TEST' (case-insensitive) triggers a register entry.
 */
export class RoiMockClient implements IRoiClient {
  private failureRate: number;

  constructor(options: MockClientOptions = {}) {
    this.failureRate = options.failureRate ?? 0;
  }

  async search(params: LookupParams): Promise<IntegrationResult<RoiEntry>> {
    const start = Date.now();

    // Simulate network latency (50-200ms)
    await new Promise(r => setTimeout(r, 50 + Math.random() * 150));

    const responseTime = Date.now() - start;

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      return {
        found: false,
        data: null,
        system: 'RoI',
        responseTime,
        error: 'Service temporarily unavailable (simulated failure)',
      };
    }

    // Synthetic matching: surname contains 'TEST'
    const hasEntry = params.lastName?.toUpperCase().includes('TEST');

    if (hasEntry) {
      return {
        found: true,
        data: {
          entryRef: 'ROI-2018-012345',
          type: 'sequestration',
          status: 'discharged',
          dateRegistered: '2018-11-20',
        },
        system: 'RoI',
        responseTime,
      };
    }

    return {
      found: false,
      data: null,
      system: 'RoI',
      responseTime,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
