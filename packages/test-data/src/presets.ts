import { generateDebtor, generateApplicant, generateAddress, generateContactDetails,
  generateDebtSummary, generateIncome, generateExpenditure, generateHousehold,
  generateAsset, generateDebt } from './generators';

/**
 * Preset 1: Low-debt individual suitable for Debt Payment Programme
 */
export const lowDebtDebtor = {
  debtor: generateDebtor({ firstName: 'Sarah', lastName: 'Lowdebt', employmentStatus: 'employed' }),
  applicant: generateApplicant({ firstName: 'Sarah', lastName: 'Lowdebt', email: 'sarah.lowdebt@example.com' }),
  address: generateAddress({ line1: '5 Modest Lane', city: 'Glasgow', postcode: 'G1 2AB' }),
  contact: generateContactDetails({ email: 'sarah.lowdebt@example.com' }),
  debts: {
    totalDebtAmount: 3200,
    numberOfCreditors: 2,
    debts: [
      generateDebt({ creditorName: 'Store Card Co', outstandingAmount: 1800, creditorType: 'credit_card' }),
      generateDebt({ creditorName: 'Local Utility', outstandingAmount: 1400, creditorType: 'utility' }),
    ],
  },
  income: generateIncome({ wages: 2200 }),
  expenditure: generateExpenditure({ rent: 500 }),
  expectedProduct: 'debt_payment_programme' as const,
};

/**
 * Preset 2: Medium-debt individual suitable for DAS
 */
export const mediumDebtDebtor = {
  debtor: generateDebtor({ firstName: 'James', lastName: 'Midrange', employmentStatus: 'employed' }),
  applicant: generateApplicant({ firstName: 'James', lastName: 'Midrange', email: 'james.midrange@example.com' }),
  address: generateAddress({ line1: '22 Average Road', city: 'Dundee', postcode: 'DD1 3CD' }),
  contact: generateContactDetails({ email: 'james.midrange@example.com' }),
  debts: generateDebtSummary(3),
  income: generateIncome({ wages: 1900 }),
  expenditure: generateExpenditure({ rent: 600 }),
  expectedProduct: 'debt_arrangement_scheme' as const,
};

/**
 * Preset 3: High-debt individual with assets - suitable for Protected Trust Deed
 */
export const highDebtWithAssets = {
  debtor: generateDebtor({ firstName: 'Margaret', lastName: 'Highdebt', employmentStatus: 'self_employed' }),
  applicant: generateApplicant({ firstName: 'Margaret', lastName: 'Highdebt', email: 'margaret.h@example.com' }),
  address: generateAddress({ line1: '1 Expensive Avenue', city: 'Aberdeen', postcode: 'AB10 1AB' }),
  contact: generateContactDetails({ email: 'margaret.h@example.com' }),
  debts: {
    totalDebtAmount: 45000,
    numberOfCreditors: 6,
    debts: [
      generateDebt({ creditorName: 'Major Bank', outstandingAmount: 15000, creditorType: 'bank' }),
      generateDebt({ creditorName: 'Credit Corp', outstandingAmount: 12000, creditorType: 'loan_company' }),
      generateDebt({ creditorName: 'Card Services', outstandingAmount: 8000, creditorType: 'credit_card' }),
      generateDebt({ creditorName: 'HMRC', outstandingAmount: 5000, creditorType: 'hmrc' }),
      generateDebt({ creditorName: 'Council', outstandingAmount: 3000, creditorType: 'council_tax' }),
      generateDebt({ creditorName: 'Utility Co', outstandingAmount: 2000, creditorType: 'utility' }),
    ],
  },
  income: generateIncome({ wages: 2500 }),
  expenditure: generateExpenditure({ mortgage: 800, rent: 0 }),
  assets: [
    generateAsset({ type: 'property', description: 'Flat in Aberdeen', estimatedValue: 120000, outstandingFinance: 95000 }),
    generateAsset({ type: 'vehicle', description: '2018 BMW 3 Series', estimatedValue: 12000, isEssential: false }),
  ],
  expectedProduct: 'protected_trust_deed' as const,
};

/**
 * Preset 4: Minimal assets, cannot pay - suitable for MAP (Minimal Asset Process)
 */
export const minimalAssetDebtor = {
  debtor: generateDebtor({ firstName: 'David', lastName: 'Minimal', employmentStatus: 'unemployed', dependants: 0 }),
  applicant: generateApplicant({ firstName: 'David', lastName: 'Minimal', email: 'david.m@example.com' }),
  address: generateAddress({ line1: '8B Council House', city: 'Stirling', postcode: 'FK8 1AA' }),
  contact: generateContactDetails({ email: 'david.m@example.com' }),
  debts: {
    totalDebtAmount: 8500,
    numberOfCreditors: 4,
    debts: [
      generateDebt({ creditorName: 'Payday Loans', outstandingAmount: 3000, creditorType: 'loan_company' }),
      generateDebt({ creditorName: 'Catalogue Co', outstandingAmount: 2500, creditorType: 'other' }),
      generateDebt({ creditorName: 'Council Tax', outstandingAmount: 1800, creditorType: 'council_tax' }),
      generateDebt({ creditorName: 'Energy Provider', outstandingAmount: 1200, creditorType: 'utility' }),
    ],
  },
  income: generateIncome({ wages: 0, benefits: 850 }),
  expenditure: generateExpenditure({ rent: 0, councilTax: 0, food: 250, transport: 50 }),
  assets: [],
  expectedProduct: 'minimal_asset_process' as const,
};

/**
 * Preset 5: Already in DAS system - existing case found
 */
export const existingDasDebtor = {
  debtor: generateDebtor({ firstName: 'Fiona', lastName: 'Existing', nationalInsuranceNumber: 'CD654321A' }),
  applicant: generateApplicant({ firstName: 'Fiona', lastName: 'Existing', email: 'fiona.e@example.com' }),
  address: generateAddress({ line1: '15 Prior Street', city: 'Perth', postcode: 'PH1 5AB' }),
  contact: generateContactDetails({ email: 'fiona.e@example.com' }),
  debts: generateDebtSummary(2),
  income: generateIncome({ wages: 1600 }),
  expenditure: generateExpenditure({ rent: 550 }),
  existingCase: {
    system: 'DAS' as const,
    found: true,
    caseReference: 'DAS-2022-00456',
    caseStatus: 'Active DPP',
    details: 'Active Debt Payment Programme since March 2022',
  },
  expectedProduct: 'signposting_advice' as const,
};

export const allPresets = [
  { name: 'Low Debt - Debt Payment Programme', data: lowDebtDebtor },
  { name: 'Medium Debt - DAS', data: mediumDebtDebtor },
  { name: 'High Debt with Assets - Protected Trust Deed', data: highDebtWithAssets },
  { name: 'Minimal Assets - MAP', data: minimalAssetDebtor },
  { name: 'Existing DAS Case', data: existingDasDebtor },
];
