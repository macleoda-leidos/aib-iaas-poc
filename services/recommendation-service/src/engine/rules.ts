interface RecommendationInput {
  totalDebt: number;
  numberOfCreditors: number;
  monthlyIncome: number;
  monthlyExpenditure: number;
  employmentStatus: string;
  hasAssets: boolean;
  totalAssetValue: number;
  existingCases: Array<{ system: string; found: boolean; caseStatus?: string }>;
  hasMoratorium: boolean;
}

interface Recommendation {
  recommendedProduct: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
  alternativeProducts: string[];
  factors: Array<{ factor: string; value: string; impact: 'positive' | 'negative' | 'neutral' }>;
}

export function calculateRecommendation(input: RecommendationInput): Recommendation {
  const disposableIncome = input.monthlyIncome - input.monthlyExpenditure;
  const factors: Recommendation['factors'] = [];
  const reasoning: string[] = [];

  // Collect factors
  factors.push({
    factor: 'Total Debt',
    value: `£${input.totalDebt.toLocaleString()}`,
    impact: input.totalDebt > 25000 ? 'negative' : input.totalDebt < 5000 ? 'positive' : 'neutral',
  });

  factors.push({
    factor: 'Disposable Income',
    value: `£${disposableIncome.toFixed(0)}/month`,
    impact: disposableIncome > 200 ? 'positive' : disposableIncome > 0 ? 'neutral' : 'negative',
  });

  factors.push({
    factor: 'Number of Creditors',
    value: `${input.numberOfCreditors}`,
    impact: input.numberOfCreditors > 5 ? 'negative' : 'neutral',
  });

  factors.push({
    factor: 'Employment Status',
    value: input.employmentStatus,
    impact: ['employed', 'self_employed'].includes(input.employmentStatus) ? 'positive' : 'negative',
  });

  factors.push({
    factor: 'Assets',
    value: input.hasAssets ? `£${input.totalAssetValue.toLocaleString()}` : 'None significant',
    impact: input.totalAssetValue > 10000 ? 'neutral' : 'positive',
  });

  const existingCaseFound = input.existingCases.some(c => c.found);
  factors.push({
    factor: 'Existing Cases',
    value: existingCaseFound ? 'Case found' : 'None found',
    impact: existingCaseFound ? 'negative' : 'positive',
  });

  // Check for existing active cases first
  const activeExistingCase = input.existingCases.find(c => c.found && c.caseStatus?.includes('Active'));
  if (activeExistingCase) {
    reasoning.push(`Active case found in ${activeExistingCase.system}`);
    reasoning.push('Applicant should be signposted to existing case handler');
    return {
      recommendedProduct: 'signposting_advice',
      confidence: 'high',
      reasoning,
      alternativeProducts: [],
      factors,
    };
  }

  // Check moratorium
  if (input.hasMoratorium) {
    reasoning.push('Active moratorium in place - breathing space protection active');
    reasoning.push('Debtor has time to seek advice and consider options');
    return {
      recommendedProduct: 'moratorium',
      confidence: 'high',
      reasoning,
      alternativeProducts: ['debt_arrangement_scheme', 'signposting_advice'],
      factors,
    };
  }

  // Very low debt - signposting
  if (input.totalDebt < 1500) {
    reasoning.push('Total debt below £1,500 threshold');
    reasoning.push('Formal insolvency solutions not typically appropriate');
    reasoning.push('Debtor should seek free money advice for budgeting support');
    return {
      recommendedProduct: 'signposting_advice',
      confidence: 'high',
      reasoning,
      alternativeProducts: ['debt_payment_programme'],
      factors,
    };
  }

  // Calculate months to repay at current disposable income
  const monthsToRepay = disposableIncome > 0 ? input.totalDebt / disposableIncome : Infinity;

  // Low-medium debt, can repay within 48 months
  if (input.totalDebt >= 1500 && input.totalDebt <= 5000 && monthsToRepay <= 48) {
    reasoning.push(`Total debt of £${input.totalDebt.toLocaleString()} within Debt Payment Programme range`);
    reasoning.push(`Can repay in approximately ${Math.ceil(monthsToRepay)} months`);
    reasoning.push('Disposable income sufficient for structured repayment');
    return {
      recommendedProduct: 'debt_payment_programme',
      confidence: 'high',
      reasoning,
      alternativeProducts: ['debt_arrangement_scheme'],
      factors,
    };
  }

  // Medium debt, can afford payments - DAS
  if (input.totalDebt >= 5000 && input.totalDebt <= 25000 && disposableIncome > 100) {
    reasoning.push(`Total debt of £${input.totalDebt.toLocaleString()} falls within DAS eligibility`);
    reasoning.push(`Disposable income of £${disposableIncome.toFixed(0)}/month allows structured repayment`);
    reasoning.push('Debt Arrangement Scheme provides statutory protection from creditors');

    const alternatives = monthsToRepay > 48 ? ['protected_trust_deed'] : ['debt_payment_programme'];
    return {
      recommendedProduct: 'debt_arrangement_scheme',
      confidence: disposableIncome > 200 ? 'high' : 'medium',
      reasoning,
      alternativeProducts: alternatives,
      factors,
    };
  }

  // Higher debt with significant assets - Protected Trust Deed
  if (input.totalDebt > 5000 && input.hasAssets && input.totalAssetValue > 5000) {
    reasoning.push(`Total debt of £${input.totalDebt.toLocaleString()} with assets valued at £${input.totalAssetValue.toLocaleString()}`);
    reasoning.push('Protected Trust Deed may be appropriate given asset position');
    reasoning.push('Allows structured repayment over 4 years with asset realisation');
    return {
      recommendedProduct: 'protected_trust_deed',
      confidence: 'medium',
      reasoning,
      alternativeProducts: ['bankruptcy', 'debt_arrangement_scheme'],
      factors,
    };
  }

  // Minimal assets, cannot afford payments - MAP
  if (input.totalDebt >= 1500 && input.totalDebt <= 25000 && disposableIncome <= 50 && input.totalAssetValue < 2000) {
    reasoning.push('Debtor has minimal assets and limited ability to pay');
    reasoning.push(`Total debt of £${input.totalDebt.toLocaleString()} with disposable income of £${disposableIncome.toFixed(0)}/month`);
    reasoning.push('Minimal Asset Process (MAP) provides route to debt relief without significant cost');
    return {
      recommendedProduct: 'minimal_asset_process',
      confidence: 'high',
      reasoning,
      alternativeProducts: ['bankruptcy'],
      factors,
    };
  }

  // High debt or complex - Bankruptcy/Sequestration
  if (input.totalDebt > 25000 || (input.totalDebt > 10000 && disposableIncome <= 0)) {
    reasoning.push(`Total debt of £${input.totalDebt.toLocaleString()} exceeds thresholds for simpler solutions`);
    reasoning.push('Formal sequestration (bankruptcy) may be the most appropriate route');
    reasoning.push('Provides comprehensive debt relief but with significant consequences');
    return {
      recommendedProduct: 'bankruptcy',
      confidence: 'medium',
      reasoning,
      alternativeProducts: ['protected_trust_deed', 'minimal_asset_process'],
      factors,
    };
  }

  // Default fallback - signposting
  reasoning.push('Case does not clearly match standard product criteria');
  reasoning.push('Professional money advice recommended to explore all options');
  return {
    recommendedProduct: 'signposting_advice',
    confidence: 'low',
    reasoning,
    alternativeProducts: ['debt_arrangement_scheme', 'debt_payment_programme'],
    factors,
  };
}
