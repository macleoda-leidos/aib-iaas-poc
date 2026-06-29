import type { DebtorDetails, ApplicantDetails } from '@aib-iaas/shared-types';
import type { Address, ContactDetails } from '@aib-iaas/shared-types';
import type { Debt, Income, Expenditure, DebtSummary, HouseholdComposition, Asset } from '@aib-iaas/shared-types';
import type { CreditCheckResult, ExistingCaseCheck, ProductRecommendation } from '@aib-iaas/shared-types';

let idCounter = 1000;
function nextId(): string {
  return `TEST-${++idCounter}`;
}

export function generateDebtor(overrides?: Partial<DebtorDetails>): DebtorDetails {
  return {
    id: nextId(),
    title: 'Mr',
    firstName: 'John',
    middleName: 'Alexander',
    lastName: 'Testerton',
    dateOfBirth: '1985-03-15',
    nationalInsuranceNumber: 'AB123456C',
    maritalStatus: 'married',
    dependants: 2,
    employmentStatus: 'employed',
    employerName: 'Synthetic Corp Ltd',
    ...overrides,
  };
}

export function generateApplicant(overrides?: Partial<ApplicantDetails>): ApplicantDetails {
  return {
    relationship: 'self',
    firstName: 'John',
    lastName: 'Testerton',
    email: 'john.testerton@example.com',
    phone: '07700900001',
    ...overrides,
  };
}

export function generateAddress(overrides?: Partial<Address>): Address {
  return {
    id: nextId(),
    line1: '42 Example Street',
    line2: 'Sampletown',
    city: 'Edinburgh',
    county: 'Midlothian',
    postcode: 'EH1 1AA',
    country: 'Scotland',
    addressType: 'current',
    residenceSince: '2018-06-01',
    ...overrides,
  };
}

export function generateContactDetails(overrides?: Partial<ContactDetails>): ContactDetails {
  return {
    primaryPhone: '07700900001',
    secondaryPhone: '01311234567',
    email: 'john.testerton@example.com',
    preferredContactMethod: 'email',
    ...overrides,
  };
}

export function generateDebt(overrides?: Partial<Debt>): Debt {
  return {
    id: nextId(),
    creditorName: 'Sample Bank PLC',
    creditorType: 'bank',
    originalAmount: 8500,
    outstandingAmount: 7200,
    monthlyPayment: 150,
    isSecured: false,
    accountReference: 'ACC-001234',
    inArrears: true,
    arrearsAmount: 450,
    ...overrides,
  };
}

export function generateDebtSummary(debtCount = 3): DebtSummary {
  const debts: Debt[] = [
    generateDebt({ creditorName: 'Sample Bank PLC', outstandingAmount: 7200, creditorType: 'bank' }),
    generateDebt({ creditorName: 'TestCard Services', outstandingAmount: 3400, creditorType: 'credit_card' }),
    generateDebt({ creditorName: 'QuickLoans Ltd', outstandingAmount: 2100, creditorType: 'loan_company' }),
  ].slice(0, debtCount);

  const totalDebtAmount = debts.reduce((sum, d) => sum + d.outstandingAmount, 0);

  return {
    totalDebtAmount,
    numberOfCreditors: debts.length,
    debts,
  };
}

export function generateIncome(overrides?: Partial<Income>): Income {
  const base = {
    wages: 1800,
    benefits: 200,
    pension: 0,
    otherIncome: 50,
    ...overrides,
  };
  return {
    ...base,
    totalMonthlyIncome: base.wages + base.benefits + base.pension + base.otherIncome,
  };
}

export function generateExpenditure(overrides?: Partial<Expenditure>): Expenditure {
  const base = {
    mortgage: 0,
    rent: 650,
    councilTax: 120,
    utilities: 180,
    food: 350,
    transport: 150,
    insurance: 80,
    childcare: 200,
    otherExpenditure: 100,
    ...overrides,
  };
  return {
    ...base,
    totalMonthlyExpenditure: base.mortgage + base.rent + base.councilTax + base.utilities +
      base.food + base.transport + base.insurance + base.childcare + base.otherExpenditure,
  };
}

export function generateHousehold(overrides?: Partial<HouseholdComposition>): HouseholdComposition {
  return {
    numberOfAdults: 2,
    numberOfChildren: 2,
    childrenAges: [5, 8],
    ...overrides,
  };
}

export function generateAsset(overrides?: Partial<Asset>): Asset {
  return {
    type: 'vehicle',
    description: '2015 Ford Focus (used for commuting)',
    estimatedValue: 4500,
    outstandingFinance: 0,
    isEssential: true,
    ...overrides,
  };
}

export function generateCreditCheckResult(overrides?: Partial<CreditCheckResult>): CreditCheckResult {
  return {
    checkedAt: new Date().toISOString(),
    provider: 'SyntheticCredit Ltd (PLACEHOLDER)',
    creditScore: 520,
    defaults: 1,
    ccjs: 0,
    bankruptcyFlag: false,
    ivaFlag: false,
    status: 'issues_found',
    ...overrides,
  };
}

export function generateExistingCaseChecks(): ExistingCaseCheck[] {
  return [
    { system: 'BASYS', checkedAt: new Date().toISOString(), found: false },
    { system: 'eDEN', checkedAt: new Date().toISOString(), found: false },
    { system: 'DAS', checkedAt: new Date().toISOString(), found: false },
    { system: 'CFT', checkedAt: new Date().toISOString(), found: false },
    { system: 'Moratorium', checkedAt: new Date().toISOString(), found: false },
    { system: 'RoI', checkedAt: new Date().toISOString(), found: false },
  ];
}

export function generateRecommendation(overrides?: Partial<ProductRecommendation>): ProductRecommendation {
  return {
    recommendedProduct: 'debt_arrangement_scheme',
    confidence: 'high',
    reasoning: [
      'Total debt of £12,700 falls within DAS eligibility range',
      'Debtor has disposable income of £220/month',
      'No existing insolvency proceedings found',
      'Debtor can afford structured repayment over 48 months',
    ],
    alternativeProducts: ['protected_trust_deed'],
    factors: [
      { factor: 'Total Debt', value: '£12,700', impact: 'neutral' },
      { factor: 'Disposable Income', value: '£220/month', impact: 'positive' },
      { factor: 'Number of Creditors', value: '3', impact: 'neutral' },
      { factor: 'Employment Status', value: 'Employed', impact: 'positive' },
      { factor: 'Existing Cases', value: 'None found', impact: 'positive' },
    ],
    ...overrides,
  };
}
