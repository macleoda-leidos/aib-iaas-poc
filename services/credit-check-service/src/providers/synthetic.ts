import { CreditCheckProvider, CreditCheckInput, CreditCheckOutput } from './interface';

/**
 * Synthetic Credit Provider - generates realistic-looking but entirely fake credit data.
 * Deterministic based on input (same person always gets same score for consistent testing).
 */
export class SyntheticCreditProvider implements CreditCheckProvider {
  id = 'synthetic';
  name = 'SyntheticCredit Ltd';
  displayName = 'SyntheticCredit Ltd (PLACEHOLDER)';
  features = ['credit_score', 'defaults', 'ccjs', 'account_summary', 'address_links', 'risk_indicators'];

  async runCheck(input: CreditCheckInput): Promise<CreditCheckOutput> {
    // Deterministic score based on name hash
    const nameHash = this.hashString(input.lastName + input.dateOfBirth);
    const creditScore = 200 + (nameHash % 750); // 200-950 range

    const niEndsBBankruptcy = input.nationalInsuranceNumber?.endsWith('B');
    const niEndsC_TrustDeed = input.nationalInsuranceNumber?.endsWith('C');
    const lowScore = creditScore < 400;
    const mediumScore = creditScore >= 400 && creditScore < 600;

    const defaults = lowScore ? Math.floor(nameHash % 4) + 1 : mediumScore ? Math.floor(nameHash % 2) : 0;
    const ccjs = lowScore ? Math.floor(nameHash % 2) : 0;

    const totalCreditLimit = 5000 + (nameHash % 30000);
    const totalOutstanding = Math.floor(totalCreditLimit * (0.2 + (nameHash % 60) / 100));

    const accountSummary = this.generateAccounts(nameHash, defaults);
    const addressLinks = this.generateAddressLinks(input);
    const riskIndicators = this.generateRiskIndicators(creditScore, defaults, ccjs);

    return {
      creditScore,
      scoreRange: { min: 0, max: 999 },
      scoreBand: this.getScoreBand(creditScore),
      defaults,
      ccjs,
      bankruptcyFlag: !!niEndsBBankruptcy,
      ivaFlag: false,
      trustDeedFlag: !!niEndsC_TrustDeed,
      activeCreditAccounts: accountSummary.filter(a => a.status === 'active').length,
      totalCreditLimit,
      totalOutstanding,
      utilisationRate: Math.round((totalOutstanding / totalCreditLimit) * 100),
      recentSearches: nameHash % 5,
      accountSummary,
      addressLinks,
      status: defaults > 0 || ccjs > 0 || niEndsBBankruptcy ? 'issues_found' : 'clear',
      riskIndicators,
    };
  }

  private getScoreBand(score: number): CreditCheckOutput['scoreBand'] {
    if (score >= 800) return 'excellent';
    if (score >= 650) return 'good';
    if (score >= 500) return 'fair';
    if (score >= 350) return 'poor';
    return 'very_poor';
  }

  private generateAccounts(hash: number, defaults: number): CreditCheckOutput['accountSummary'] {
    const accounts: CreditCheckOutput['accountSummary'] = [];

    // Always add a current account / overdraft
    accounts.push({
      type: 'overdraft',
      provider: 'Sample Bank PLC',
      status: 'active',
      limit: 1500,
      balance: 200 + (hash % 1200),
      monthlyPayment: 0,
      startDate: '2016-03-01',
      lastUpdated: '2024-03-01',
    });

    // Add credit card if hash suggests it
    if (hash % 3 !== 0) {
      accounts.push({
        type: 'credit_card',
        provider: 'TestCard Services',
        status: defaults > 1 ? 'defaulted' : 'active',
        limit: 3000 + (hash % 7000),
        balance: 1000 + (hash % 5000),
        monthlyPayment: 85,
        startDate: '2019-07-01',
        lastUpdated: '2024-02-15',
      });
    }

    // Add personal loan
    if (hash % 4 !== 0) {
      accounts.push({
        type: 'personal_loan',
        provider: 'QuickLoans Ltd',
        status: defaults > 0 ? 'in_arrears' : 'active',
        balance: 2000 + (hash % 8000),
        monthlyPayment: 150 + (hash % 200),
        startDate: '2021-01-15',
        lastUpdated: '2024-03-01',
      });
    }

    // Add utility account
    accounts.push({
      type: 'utility',
      provider: 'ScotPower (Sample)',
      status: defaults > 2 ? 'defaulted' : 'active',
      balance: 50 + (hash % 300),
      monthlyPayment: 85,
      startDate: '2018-09-01',
      lastUpdated: '2024-02-28',
    });

    return accounts;
  }

  private generateAddressLinks(input: CreditCheckInput): CreditCheckOutput['addressLinks'] {
    const links: CreditCheckOutput['addressLinks'] = [
      {
        address: input.currentAddress.line1,
        postcode: input.currentAddress.postcode,
        dateFrom: '2020-06-01',
        confirmedResident: true,
      },
    ];

    if (input.previousAddresses?.length) {
      input.previousAddresses.forEach((addr, i) => {
        links.push({
          address: addr.line1,
          postcode: addr.postcode,
          dateFrom: `${2016 + i}-01-01`,
          dateTo: `${2018 + i}-05-31`,
          confirmedResident: true,
        });
      });
    }

    return links;
  }

  private generateRiskIndicators(score: number, defaults: number, ccjs: number): CreditCheckOutput['riskIndicators'] {
    const indicators: CreditCheckOutput['riskIndicators'] = [];

    if (defaults > 0) {
      indicators.push({
        category: 'payment_history',
        severity: defaults > 2 ? 'high' : 'medium',
        description: `${defaults} default(s) recorded in the last 6 years`,
      });
    }

    if (ccjs > 0) {
      indicators.push({
        category: 'public_records',
        severity: 'high',
        description: `${ccjs} County Court Judgement(s) found`,
      });
    }

    if (score < 500) {
      indicators.push({
        category: 'credit_utilisation',
        severity: 'medium',
        description: 'Credit utilisation above 75% of available limits',
      });
    }

    if (score < 400) {
      indicators.push({
        category: 'search_frequency',
        severity: 'medium',
        description: 'Multiple credit searches in recent months may indicate financial stress',
      });
    }

    return indicators;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
