import { IMoratoriumClient } from '../interfaces';
import { IntegrationResult, MoratoriumRecord, LookupParams } from '../types';

export interface MockClientOptions {
  failureRate?: number;
}

/**
 * Mock Moratorium client - Moratorium on Diligence Registration.
 * Checks if a debtor has an active moratorium (6-week breathing space).
 *
 * Matching logic (consistent with mock-integrations service):
 * - NI number ending in an even digit triggers an active moratorium.
 *   (The HTTP service uses postcode starting with 'EH', but LookupParams
 *    provides NI number as the primary identifier.)
 */
export class MoratoriumMockClient implements IMoratoriumClient {
  private failureRate: number;

  constructor(options: MockClientOptions = {}) {
    this.failureRate = options.failureRate ?? 0;
  }

  async check(params: LookupParams): Promise<IntegrationResult<MoratoriumRecord>> {
    const start = Date.now();

    // Simulate network latency (50-200ms)
    await new Promise(r => setTimeout(r, 50 + Math.random() * 150));

    const responseTime = Date.now() - start;

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      return {
        found: false,
        data: null,
        system: 'Moratorium',
        responseTime,
        error: 'Service temporarily unavailable (simulated failure)',
      };
    }

    // Synthetic matching: last character of NI number before the letter suffix
    // e.g., "AB123456C" -> check digit '6' (even = active moratorium)
    const digits = params.niNumber.replace(/[^0-9]/g, '');
    const lastDigit = digits.length > 0 ? parseInt(digits[digits.length - 1], 10) : 1;
    const hasActiveMoratorium = lastDigit % 2 === 0;

    if (hasActiveMoratorium) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14); // Started 2 weeks ago
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 42); // 6-week duration

      return {
        found: true,
        data: {
          id: 'MOR-2024-003456',
          status: 'active',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        system: 'Moratorium',
        responseTime,
      };
    }

    return {
      found: false,
      data: null,
      system: 'Moratorium',
      responseTime,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
