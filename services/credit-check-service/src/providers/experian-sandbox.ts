import { CreditCheckProvider, CreditCheckInput, CreditCheckOutput } from './interface';

/**
 * Experian Sandbox Provider
 * Simulates the Experian Connect API response format.
 * In production, this would use actual Experian API credentials and endpoints.
 *
 * PRODUCTION REPLACEMENT:
 * - Register for Experian Connect API access
 * - Implement OAuth 2.0 client credentials flow
 * - Map Experian Delphi score to internal model
 * - Handle Experian-specific error codes
 * - Implement Experian data mapping (CAIS data, public information)
 */
export class ExperianSandboxProvider implements CreditCheckProvider {
  id = 'experian';
  name = 'Experian';
  displayName = 'Experian (Sandbox Simulation)';
  features = ['delphi_score', 'cais_data', 'public_information', 'cifas_markers', 'address_confirmation'];

  async runCheck(input: CreditCheckInput): Promise<CreditCheckOutput> {
    // Simulate API latency
    await new Promise(r => setTimeout(r, 300 + Math.random() * 400));

    const hash = this.simpleHash(input.lastName + input.dateOfBirth);
    const delphiScore = 300 + (hash % 700); // Experian Delphi: 0-999

    return {
      creditScore: delphiScore,
      scoreRange: { min: 0, max: 999 },
      scoreBand: delphiScore >= 881 ? 'excellent' : delphiScore >= 721 ? 'good' : delphiScore >= 561 ? 'fair' : delphiScore >= 440 ? 'poor' : 'very_poor',
      defaults: delphiScore < 500 ? Math.floor(hash % 3) + 1 : 0,
      ccjs: delphiScore < 400 ? 1 : 0,
      bankruptcyFlag: input.nationalInsuranceNumber?.endsWith('B') || false,
      ivaFlag: false,
      trustDeedFlag: false,
      activeCreditAccounts: 2 + (hash % 6),
      totalCreditLimit: 8000 + (hash % 25000),
      totalOutstanding: 3000 + (hash % 15000),
      utilisationRate: 30 + (hash % 50),
      recentSearches: hash % 4,
      accountSummary: [
        { type: 'credit_card', provider: 'Sample Card Co', status: 'active', limit: 5000, balance: 2300, monthlyPayment: 100, startDate: '2020-01-01', lastUpdated: '2024-03-01' },
        { type: 'personal_loan', provider: 'Loan Provider Ltd', status: 'active', balance: 4500, monthlyPayment: 180, startDate: '2022-06-01', lastUpdated: '2024-03-01' },
      ],
      addressLinks: [
        { address: input.currentAddress.line1, postcode: input.currentAddress.postcode, dateFrom: '2019-01-01', confirmedResident: true },
      ],
      status: delphiScore < 500 ? 'issues_found' : 'clear',
      riskIndicators: delphiScore < 600 ? [
        { category: 'payment_history', severity: 'medium' as const, description: 'Some missed payments in last 12 months' },
      ] : [],
    };
  }

  private simpleHash(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) & 0x7fffffff;
    return h;
  }
}
