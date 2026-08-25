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

  // Minimal assets, cannot afford payments - MAP
  //
  // Evaluated before DAS because it is the more specific test: minimal assets
  // AND almost no ability to pay. DAS now accepts any surplus above zero (see
  // below), so leaving MAP later in the chain would let DAS capture debtors who
  // qualify for the cheaper, simpler route.
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

  // Medium debt, can afford payments - DAS
  //
  // The gate is `disposableIncome > 0`, not > 100. A DPP under DAS requires only
  // that the debtor can offer something to creditors, so anyone in the statutory
  // debt range with a surplus is eligible — the size of that surplus is a matter
  // of confidence, not eligibility. Gating at 100 left debtors with £1-£100
  // spare matching no branch at all: too much surplus for MAP (which caps at 50)
  // and not enough for DAS, so they fell through to the generic signposting
  // default and were told their case "does not clearly match standard product
  // criteria" while sitting squarely inside DAS range.
  //
  // The asset carve-out defers to the trust deed branch below: with substantial
  // assets and only a token surplus, realising the assets is the realistic route
  // and a DPP would run implausibly long. Above £100/month a DPP is viable, so
  // DAS continues to take precedence over PTD as it always has.
  // Note the > 5000 rather than >= : it mirrors the trust deed branch's own debt
  // gate exactly, so debt of precisely £5,000 is never deferred to a branch that
  // would then decline it and drop through to signposting.
  const deferToTrustDeed = disposableIncome <= 100 && input.totalAssetValue > 5000 && input.totalDebt > 5000;
  if (input.totalDebt >= 5000 && input.totalDebt <= 25000 && disposableIncome > 0 && !deferToTrustDeed) {
    reasoning.push(`Total debt of £${input.totalDebt.toLocaleString()} falls within DAS eligibility`);
    reasoning.push(`Disposable income of £${disposableIncome.toFixed(0)}/month allows structured repayment`);
    reasoning.push('Debt Arrangement Scheme provides statutory protection from creditors');

    // A surplus this small repays £5,000+ very slowly, so flag the trust deed
    // route as the realistic alternative rather than a shorter DPP.
    if (disposableIncome <= 100) {
      reasoning.push('Low disposable income means an extended programme — money adviser should confirm affordability');
    }

    const alternatives = monthsToRepay > 48 ? ['protected_trust_deed'] : ['debt_payment_programme'];
    return {
      recommendedProduct: 'debt_arrangement_scheme',
      confidence: disposableIncome > 200 ? 'high' : disposableIncome > 100 ? 'medium' : 'low',
      reasoning,
      alternativeProducts: alternatives,
      factors,
    };
  }

  // Higher debt with significant assets - Protected Trust Deed
  //
  // Keyed on the asset VALUE alone. hasAssets is a separate self-declared flag
  // and nothing keeps the two consistent, so requiring both meant a debtor
  // declaring £50,000 of assets with the flag unset skipped PTD and bankruptcy
  // and landed on generic signposting — while the MAP branch below, which reads
  // totalAssetValue on its own, could route the same record to a process
  // premised on having minimal assets.
  if (input.totalDebt > 5000 && input.totalAssetValue > 5000) {
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

  // High debt or complex - Bankruptcy/Sequestration
  //
  // The no-surplus arm starts at £3,000, the statutory minimum for a debtor
  // application under s.2(8) of the Bankruptcy (Scotland) Act 2016, rather than
  // £10,000. A debtor with no disposable income cannot fund any repayment
  // programme, so above that minimum sequestration is the applicable route.
  // Starting at £10,000 stranded £3,000-£10,000 no-surplus debtors whose assets
  // were too high for MAP (which caps at £2,000) on the signposting default.
  if (input.totalDebt > 25000 || (input.totalDebt >= 3000 && disposableIncome <= 0)) {
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
