export const DEMO_FORM_DATA = {
  personal: {
    title: 'Mr',
    firstName: 'John',
    lastName: 'Testerton',
    dateOfBirth: '1985-03-15',
    nationalInsuranceNumber: 'AB 12 34 56 C',
    maritalStatus: 'married',
    employmentStatus: 'employed',
    dependants: 2,
    verifiedVia: 'scotaccount',
    aliases: [{ firstName: 'Johnny', lastName: 'Testerton', type: 'other' }],
  },
  address: {
    line1: '14 Meadow Lane',
    line2: 'Flat 3',
    city: 'Edinburgh',
    county: 'Midlothian',
    postcode: 'EH4 7QR',
    residentSince: '2021-06-01',
    email: 'john.testerton@example.com',
    phone: '07700 900123',
    previousAddresses: [
      { line1: '8 Burns Street', city: 'Glasgow', postcode: 'G12 8NP', dateFrom: '2018-09-01', dateTo: '2021-05-31' },
    ],
  },
  debts: {
    items: [
      { creditorName: 'Royal Bank of Scotland', creditorType: 'bank', outstandingAmount: 4200, monthlyPayment: 120 },
      { creditorName: 'Capital One', creditorType: 'credit_card', outstandingAmount: 3100, monthlyPayment: 85 },
      { creditorName: 'Provident', creditorType: 'loan_company', outstandingAmount: 2800, monthlyPayment: 95 },
      { creditorName: 'Scottish Power', creditorType: 'utility', outstandingAmount: 850, monthlyPayment: 0 },
      { creditorName: 'Edinburgh City Council', creditorType: 'council_tax', outstandingAmount: 1750, monthlyPayment: 0 },
    ],
  },
  income: {
    wages: 2100,
    benefits: 280,
    pension: 0,
    other: 50,
  },
  expenditure: {
    rent: 750,
    councilTax: 125,
    utilities: 180,
    food: 350,
    transport: 120,
    insurance: 45,
    childcare: 200,
    other: 80,
  },
  assets: {
    noAssets: false,
    properties: [],
    vehicles: [
      { description: '2016 Vauxhall Corsa 1.4i', value: 3500, finance: 0, essential: 'yes' },
    ],
    savings: [
      { type: 'bank_savings', provider: 'Nationwide', value: 320 },
    ],
    other: [],
  },
  documents: {
    uploaded: 3,
    files: [
      { name: 'payslip_march_2025.pdf', type: 'Payslip', size: '124KB' },
      { name: 'bank_statement_feb_2025.pdf', type: 'Bank Statement', size: '256KB' },
      { name: 'council_tax_bill.pdf', type: 'Council Tax', size: '89KB' },
    ],
  },
  checks: {
    started: true,
    completed: true,
    results: [
      { system: 'BASYS', status: 'clear', detail: 'No existing bankruptcy records' },
      { system: 'eDEN/DASH', status: 'clear', detail: 'No active debt enforcement' },
      { system: 'DAS', status: 'clear', detail: 'No existing DAS application' },
      { system: 'CFT', status: 'clear', detail: 'No common financial tool records' },
      { system: 'Moratorium', status: 'clear', detail: 'No active moratorium' },
      { system: 'RoI', status: 'clear', detail: 'No inhibitions registered' },
    ],
    creditCheck: {
      score: 520,
      band: 'Fair',
      provider: 'SyntheticCredit Ltd',
      defaults: 2,
      ccjs: 0,
    },
  },
  recommendation: {
    received: true,
    product: 'Debt Arrangement Scheme (DAS)',
    reason: 'Based on your positive disposable income of £580/month and total debt of £12,700, a Debt Arrangement Scheme is recommended. This allows you to repay your debts in full over an extended period (approximately 22 months) with statutory protection from creditor action.',
    alternatives: [
      { product: 'Protected Trust Deed', reason: 'Possible if you prefer a 4-year fixed arrangement, but DAS is more suitable given your repayment capacity.' },
    ],
    confidence: 94,
  },
  payment: {
    method: 'card',
    amount: 90,
    completed: true,
    reference: 'PAY-2025-00847',
  },
};

// Computed totals for display
export const DEMO_TOTALS = {
  totalDebt: 12700,
  totalIncome: 2430,
  totalExpenditure: 1850,
  disposableIncome: 580,
  totalAssetValue: 3820,
  creditorCount: 5,
};
