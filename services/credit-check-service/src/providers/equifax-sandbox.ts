import { CreditCheckProvider, CreditCheckInput, CreditCheckOutput } from './interface';

/**
 * Equifax Sandbox Provider
 * Simulates the Equifax API response format.
 *
 * PRODUCTION REPLACEMENT:
 * - Equifax InterConnect or ConsumerView API
 * - Certificate-based authentication
 * - XML/SOAP interface mapping (Equifax uses XML)
 * - ERS (Equifax Risk Score) mapping to internal model
 */
export class EquifaxSandboxProvider implements CreditCheckProvider {
  id = 'equifax';
  name = 'Equifax';
  displayName = 'Equifax (Sandbox Simulation)';
  features = ['equifax_risk_score', 'insight_data', 'fraud_indicators', 'electoral_roll', 'public_records'];

  async runCheck(input: CreditCheckInput): Promise<CreditCheckOutput> {
    await new Promise(r => setTimeout(r, 250 + Math.random() * 350));

    const hash = this.simpleHash(input.firstName + input.lastName + input.dateOfBirth);
    const ersScore = 200 + (hash % 500); // Equifax: 0-700

    // Normalise to 0-999 for consistency
    const normalisedScore = Math.round((ersScore / 700) * 999);

    return {
      creditScore: normalisedScore,
      scoreRange: { min: 0, max: 999 },
      scoreBand: normalisedScore >= 800 ? 'excellent' : normalisedScore >= 650 ? 'good' : normalisedScore >= 500 ? 'fair' : normalisedScore >= 350 ? 'poor' : 'very_poor',
      defaults: normalisedScore < 450 ? Math.floor(hash % 3) + 1 : 0,
      ccjs: normalisedScore < 350 ? 1 : 0,
      bankruptcyFlag: input.nationalInsuranceNumber?.endsWith('B') || false,
      ivaFlag: false,
      trustDeedFlag: input.nationalInsuranceNumber?.endsWith('C') || false,
      activeCreditAccounts: 1 + (hash % 5),
      totalCreditLimit: 6000 + (hash % 20000),
      totalOutstanding: 2000 + (hash % 12000),
      utilisationRate: 25 + (hash % 55),
      recentSearches: hash % 3,
      accountSummary: [
        { type: 'mortgage', provider: 'Test Mortgage Co', status: 'active', balance: 95000 + (hash % 50000), monthlyPayment: 650, startDate: '2018-03-01', lastUpdated: '2024-02-28' },
        { type: 'credit_card', provider: 'Equifax Test Card', status: 'active', limit: 4000, balance: 1800, monthlyPayment: 75, startDate: '2021-09-01', lastUpdated: '2024-03-01' },
      ],
      addressLinks: [
        { address: input.currentAddress.line1, postcode: input.currentAddress.postcode, dateFrom: '2018-03-01', confirmedResident: true },
      ],
      status: normalisedScore < 450 ? 'issues_found' : 'clear',
      riskIndicators: normalisedScore < 500 ? [
        { category: 'credit_utilisation', severity: 'medium' as const, description: 'High credit utilisation detected across accounts' },
      ] : [],
    };
  }

  private simpleHash(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) & 0x7fffffff;
    return h;
  }
}
