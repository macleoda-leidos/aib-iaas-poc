import { ICreditClient } from '../interfaces';
import { IntegrationResult, CreditCheckResult, LookupParams } from '../types';

export interface MockClientOptions {
  failureRate?: number;
}

/**
 * Mock Credit Check client - Placeholder Credit Reference Agency.
 * Simulates a credit check against a reference agency (Experian/Equifax).
 *
 * Uses a deterministic hash of the NI number to generate consistent scores
 * across repeated lookups (important for demo consistency).
 */
export class CreditMockClient implements ICreditClient {
  private failureRate: number;

  constructor(options: MockClientOptions = {}) {
    this.failureRate = options.failureRate ?? 0;
  }

  async runCheck(
    params: LookupParams & { consentGiven: boolean }
  ): Promise<IntegrationResult<CreditCheckResult>> {
    const start = Date.now();

    // Simulate network latency (50-200ms)
    await new Promise(r => setTimeout(r, 50 + Math.random() * 150));

    const responseTime = Date.now() - start;

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      return {
        found: false,
        data: null,
        system: 'CreditCheck',
        responseTime,
        error: 'Service temporarily unavailable (simulated failure)',
      };
    }

    // Consent check
    if (!params.consentGiven) {
      return {
        found: false,
        data: null,
        system: 'CreditCheck',
        responseTime,
        error: 'Credit check requires explicit consent from the applicant',
      };
    }

    // Deterministic score based on NI number hash (consistent across lookups)
    const hash = this.hashNiNumber(params.niNumber);
    const score = 200 + (hash % 600); // Range 200-799

    let defaults = 0;
    let ccjs = 0;

    if (score < 400) {
      defaults = 1 + (hash % 4);
      ccjs = hash % 3;
    } else if (score < 550) {
      defaults = hash % 2;
    }

    const result: 'PASS' | 'FAIL' = score >= 400 ? 'PASS' : 'FAIL';

    return {
      found: true,
      data: {
        score,
        result,
        defaults,
        ccjs,
        provider: 'SyntheticCredit Ltd (PLACEHOLDER)',
      },
      system: 'CreditCheck',
      responseTime,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  /**
   * Simple deterministic hash of an NI number string.
   * Not cryptographic — just ensures consistent synthetic data for the same input.
   */
  private hashNiNumber(niNumber: string): number {
    let hash = 0;
    for (let i = 0; i < niNumber.length; i++) {
      const char = niNumber.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0; // Force 32-bit integer
    }
    return Math.abs(hash);
  }
}
