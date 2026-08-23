import { describe, it, expect } from 'vitest';
import {
  debtorDetailsSchema,
  addressSchema,
  contactDetailsSchema,
  debtSchema,
  incomeSchema,
  expenditureSchema,
  householdSchema,
  assetSchema,
  applicantDetailsSchema,
  applicationSubmissionSchema,
} from '../schemas';

describe('Expenditure Schema', () => {
  const valid = { mortgage: 800, rent: 0, councilTax: 120, utilities: 150, food: 300, transport: 100, insurance: 50, childcare: 0, otherExpenditure: 80, totalMonthlyExpenditure: 1600 };

  it('accepts valid expenditure', () => { expect(expenditureSchema.safeParse(valid).success).toBe(true); });
  it('rejects negative mortgage', () => { expect(expenditureSchema.safeParse({ ...valid, mortgage: -100 }).success).toBe(false); });
  it('rejects negative rent', () => { expect(expenditureSchema.safeParse({ ...valid, rent: -50 }).success).toBe(false); });
  it('rejects negative council tax', () => { expect(expenditureSchema.safeParse({ ...valid, councilTax: -1 }).success).toBe(false); });
  it('rejects negative utilities', () => { expect(expenditureSchema.safeParse({ ...valid, utilities: -10 }).success).toBe(false); });
  it('rejects negative food', () => { expect(expenditureSchema.safeParse({ ...valid, food: -1 }).success).toBe(false); });
  it('rejects negative transport', () => { expect(expenditureSchema.safeParse({ ...valid, transport: -1 }).success).toBe(false); });
  it('accepts zero values for all fields', () => {
    const zeros = { mortgage: 0, rent: 0, councilTax: 0, utilities: 0, food: 0, transport: 0, insurance: 0, childcare: 0, otherExpenditure: 0, totalMonthlyExpenditure: 0 };
    expect(expenditureSchema.safeParse(zeros).success).toBe(true);
  });
  it('accepts high expenditure values', () => {
    expect(expenditureSchema.safeParse({ ...valid, mortgage: 5000, totalMonthlyExpenditure: 6000 }).success).toBe(true);
  });
});

describe('Household Schema', () => {
  it('accepts valid household', () => { expect(householdSchema.safeParse({ numberOfAdults: 2, numberOfChildren: 3 }).success).toBe(true); });
  it('rejects zero adults', () => { expect(householdSchema.safeParse({ numberOfAdults: 0, numberOfChildren: 0 }).success).toBe(false); });
  it('rejects negative children', () => { expect(householdSchema.safeParse({ numberOfAdults: 1, numberOfChildren: -1 }).success).toBe(false); });
  it('accepts maximum adults (10)', () => { expect(householdSchema.safeParse({ numberOfAdults: 10, numberOfChildren: 0 }).success).toBe(true); });
  it('rejects too many adults (11)', () => { expect(householdSchema.safeParse({ numberOfAdults: 11, numberOfChildren: 0 }).success).toBe(false); });
  it('accepts maximum children (15)', () => { expect(householdSchema.safeParse({ numberOfAdults: 1, numberOfChildren: 15 }).success).toBe(true); });
  it('rejects too many children (16)', () => { expect(householdSchema.safeParse({ numberOfAdults: 1, numberOfChildren: 16 }).success).toBe(false); });
  it('accepts children ages array', () => { expect(householdSchema.safeParse({ numberOfAdults: 2, numberOfChildren: 2, childrenAges: [5, 12] }).success).toBe(true); });
  it('rejects children age > 18', () => { expect(householdSchema.safeParse({ numberOfAdults: 1, numberOfChildren: 1, childrenAges: [19] }).success).toBe(false); });
  it('rejects negative children age', () => { expect(householdSchema.safeParse({ numberOfAdults: 1, numberOfChildren: 1, childrenAges: [-1] }).success).toBe(false); });
});

describe('Asset Schema', () => {
  const valid = { type: 'property' as const, description: 'Family home', estimatedValue: 150000, outstandingFinance: 120000, isEssential: true };

  it('accepts valid asset', () => { expect(assetSchema.safeParse(valid).success).toBe(true); });
  it('rejects empty description', () => { expect(assetSchema.safeParse({ ...valid, description: '' }).success).toBe(false); });
  it('rejects negative estimated value', () => { expect(assetSchema.safeParse({ ...valid, estimatedValue: -1000 }).success).toBe(false); });
  it('accepts vehicle type', () => { expect(assetSchema.safeParse({ ...valid, type: 'vehicle' }).success).toBe(true); });
  it('accepts savings type', () => { expect(assetSchema.safeParse({ ...valid, type: 'savings' }).success).toBe(true); });
  it('accepts investments type', () => { expect(assetSchema.safeParse({ ...valid, type: 'investments' }).success).toBe(true); });
  it('accepts other type', () => { expect(assetSchema.safeParse({ ...valid, type: 'other' }).success).toBe(true); });
  it('rejects invalid type', () => { expect(assetSchema.safeParse({ ...valid, type: 'crypto' }).success).toBe(false); });
  it('accepts zero outstanding finance', () => { expect(assetSchema.safeParse({ ...valid, outstandingFinance: 0 }).success).toBe(true); });
  it('accepts asset without outstanding finance', () => { expect(assetSchema.safeParse({ type: 'savings', description: 'ISA account', estimatedValue: 5000, isEssential: false }).success).toBe(true); });
});

describe('Applicant Details Schema', () => {
  const valid = { relationship: 'self' as const, firstName: 'John', lastName: 'Test', email: 'john@example.com', phone: '07700900001' };

  it('accepts valid applicant', () => { expect(applicantDetailsSchema.safeParse(valid).success).toBe(true); });
  it('accepts representative relationship', () => { expect(applicantDetailsSchema.safeParse({ ...valid, relationship: 'representative' }).success).toBe(true); });
  it('accepts executor relationship', () => { expect(applicantDetailsSchema.safeParse({ ...valid, relationship: 'executor' }).success).toBe(true); });
  it('accepts trustee relationship', () => { expect(applicantDetailsSchema.safeParse({ ...valid, relationship: 'trustee' }).success).toBe(true); });
  it('accepts adviser relationship', () => { expect(applicantDetailsSchema.safeParse({ ...valid, relationship: 'adviser' }).success).toBe(true); });
  it('rejects invalid relationship', () => { expect(applicantDetailsSchema.safeParse({ ...valid, relationship: 'friend' }).success).toBe(false); });
  it('rejects empty first name', () => { expect(applicantDetailsSchema.safeParse({ ...valid, firstName: '' }).success).toBe(false); });
  it('rejects empty last name', () => { expect(applicantDetailsSchema.safeParse({ ...valid, lastName: '' }).success).toBe(false); });
  it('rejects invalid email', () => { expect(applicantDetailsSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false); });
  it('rejects invalid phone', () => { expect(applicantDetailsSchema.safeParse({ ...valid, phone: '123' }).success).toBe(false); });
  it('accepts +44 phone format', () => { expect(applicantDetailsSchema.safeParse({ ...valid, phone: '+447700900001' }).success).toBe(true); });
  it('accepts optional organisation name', () => { expect(applicantDetailsSchema.safeParse({ ...valid, organisationName: 'Citizens Advice' }).success).toBe(true); });
  it('accepts optional reference number', () => { expect(applicantDetailsSchema.safeParse({ ...valid, referenceNumber: 'REF-001' }).success).toBe(true); });
});

describe('Application Submission Schema — Full Validation', () => {
  const validApplication = {
    debtorDetails: { title: 'Mr', firstName: 'John', lastName: 'Test', dateOfBirth: '1985-03-15', maritalStatus: 'single' as const, dependants: 0, employmentStatus: 'employed' as const },
    applicantDetails: { relationship: 'self' as const, firstName: 'John', lastName: 'Test', email: 'john@example.com', phone: '07700900001' },
    addresses: [{ line1: '1 Test St', city: 'Edinburgh', postcode: 'EH1 1AA', country: 'Scotland', addressType: 'current' as const }],
    contactDetails: { primaryPhone: '07700900001', email: 'john@example.com', preferredContactMethod: 'email' as const },
    debts: [{ creditorName: 'Bank', creditorType: 'bank' as const, originalAmount: 5000, outstandingAmount: 3000, monthlyPayment: 100, isSecured: false, inArrears: false }],
    income: { wages: 1800, benefits: 200, pension: 0, otherIncome: 0, totalMonthlyIncome: 2000 },
    expenditure: { mortgage: 600, rent: 0, councilTax: 120, utilities: 150, food: 300, transport: 100, insurance: 50, childcare: 0, otherExpenditure: 80, totalMonthlyExpenditure: 1400 },
    household: { numberOfAdults: 1, numberOfChildren: 0 },
  };

  it('accepts valid full application', () => { expect(applicationSubmissionSchema.safeParse(validApplication).success).toBe(true); });
  it('rejects application without debtor details', () => { const { debtorDetails, ...rest } = validApplication; expect(applicationSubmissionSchema.safeParse(rest).success).toBe(false); });
  it('rejects application without addresses', () => { const { addresses, ...rest } = validApplication; expect(applicationSubmissionSchema.safeParse(rest).success).toBe(false); });
  it('rejects application with empty addresses array', () => { expect(applicationSubmissionSchema.safeParse({ ...validApplication, addresses: [] }).success).toBe(false); });
  it('rejects application with empty debts array', () => { expect(applicationSubmissionSchema.safeParse({ ...validApplication, debts: [] }).success).toBe(false); });
  it('accepts application with optional assets', () => {
    const withAssets = { ...validApplication, assets: [{ type: 'vehicle' as const, description: 'Car', estimatedValue: 5000, isEssential: true }] };
    expect(applicationSubmissionSchema.safeParse(withAssets).success).toBe(true);
  });
  it('accepts application without assets field', () => { expect(applicationSubmissionSchema.safeParse(validApplication).success).toBe(true); });
  it('rejects application with invalid debtor email', () => {
    const invalid = { ...validApplication, contactDetails: { ...validApplication.contactDetails, email: 'bad' } };
    expect(applicationSubmissionSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('Debtor Details Schema — Extended Edge Cases', () => {
  const valid = { title: 'Mr', firstName: 'John', lastName: 'Test', dateOfBirth: '1985-03-15', maritalStatus: 'single' as const, dependants: 0, employmentStatus: 'employed' as const };

  it('accepts all title variants', () => {
    ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Rev'].forEach(title => {
      expect(debtorDetailsSchema.safeParse({ ...valid, title }).success).toBe(true);
    });
  });
  it('rejects invalid title', () => { expect(debtorDetailsSchema.safeParse({ ...valid, title: 'Lord' }).success).toBe(false); });
  it('accepts all employment statuses', () => {
    ['employed', 'self_employed', 'unemployed', 'retired', 'student', 'other'].forEach(employmentStatus => {
      expect(debtorDetailsSchema.safeParse({ ...valid, employmentStatus }).success).toBe(true);
    });
  });
  it('rejects invalid employment status', () => { expect(debtorDetailsSchema.safeParse({ ...valid, employmentStatus: 'freelance' }).success).toBe(false); });
  it('accepts all marital statuses', () => {
    ['single', 'married', 'civil_partnership', 'divorced', 'widowed', 'separated'].forEach(maritalStatus => {
      expect(debtorDetailsSchema.safeParse({ ...valid, maritalStatus }).success).toBe(true);
    });
  });
  it('rejects invalid marital status', () => { expect(debtorDetailsSchema.safeParse({ ...valid, maritalStatus: 'cohabiting' }).success).toBe(false); });
  it('accepts maximum dependants (20)', () => { expect(debtorDetailsSchema.safeParse({ ...valid, dependants: 20 }).success).toBe(true); });
  it('rejects too many dependants (21)', () => { expect(debtorDetailsSchema.safeParse({ ...valid, dependants: 21 }).success).toBe(false); });
  it('rejects non-integer dependants', () => { expect(debtorDetailsSchema.safeParse({ ...valid, dependants: 1.5 }).success).toBe(false); });
  it('accepts optional employer name', () => { expect(debtorDetailsSchema.safeParse({ ...valid, employerName: 'ACME Corp' }).success).toBe(true); });
  it('accepts optional middle name', () => { expect(debtorDetailsSchema.safeParse({ ...valid, middleName: 'James' }).success).toBe(true); });
});

describe('Address Schema — Extended Postcode Validation', () => {
  const valid = { line1: '1 Test St', city: 'Edinburgh', postcode: 'EH1 1AA', country: 'Scotland', addressType: 'current' as const };

  it('accepts Edinburgh postcode', () => { expect(addressSchema.safeParse({ ...valid, postcode: 'EH1 1AA' }).success).toBe(true); });
  it('accepts Glasgow postcode', () => { expect(addressSchema.safeParse({ ...valid, postcode: 'G1 1AA' }).success).toBe(true); });
  it('accepts Aberdeen postcode', () => { expect(addressSchema.safeParse({ ...valid, postcode: 'AB10 1XY' }).success).toBe(true); });
  it('accepts Dundee postcode', () => { expect(addressSchema.safeParse({ ...valid, postcode: 'DD1 1AA' }).success).toBe(true); });
  it('accepts Inverness postcode', () => { expect(addressSchema.safeParse({ ...valid, postcode: 'IV1 1AA' }).success).toBe(true); });
  it('rejects empty postcode', () => { expect(addressSchema.safeParse({ ...valid, postcode: '' }).success).toBe(false); });
  it('rejects numeric-only postcode', () => { expect(addressSchema.safeParse({ ...valid, postcode: '12345' }).success).toBe(false); });
  it('accepts correspondence address type', () => { expect(addressSchema.safeParse({ ...valid, addressType: 'correspondence' }).success).toBe(true); });
  it('accepts previous address type', () => { expect(addressSchema.safeParse({ ...valid, addressType: 'previous' }).success).toBe(true); });
  it('rejects invalid address type', () => { expect(addressSchema.safeParse({ ...valid, addressType: 'work' }).success).toBe(false); });
  it('accepts optional residence since date', () => { expect(addressSchema.safeParse({ ...valid, residenceSince: '2020-01-15' }).success).toBe(true); });
});

describe('Debt Schema — Extended Creditor Types', () => {
  const valid = { creditorName: 'Bank', creditorType: 'bank' as const, originalAmount: 5000, outstandingAmount: 3000, monthlyPayment: 100, isSecured: false, inArrears: false };

  it('accepts all creditor types', () => {
    ['bank', 'credit_card', 'loan_company', 'utility', 'council_tax', 'hmrc', 'other'].forEach(creditorType => {
      expect(debtSchema.safeParse({ ...valid, creditorType }).success).toBe(true);
    });
  });
  it('rejects invalid creditor type', () => { expect(debtSchema.safeParse({ ...valid, creditorType: 'payday_lender' }).success).toBe(false); });
  it('accepts zero monthly payment', () => { expect(debtSchema.safeParse({ ...valid, monthlyPayment: 0 }).success).toBe(true); });
  it('rejects zero original amount', () => { expect(debtSchema.safeParse({ ...valid, originalAmount: 0 }).success).toBe(false); });
  it('accepts debt in arrears with amount', () => { expect(debtSchema.safeParse({ ...valid, inArrears: true, arrearsAmount: 500 }).success).toBe(true); });
  it('accepts optional account reference', () => { expect(debtSchema.safeParse({ ...valid, accountReference: 'ACC-12345' }).success).toBe(true); });
  it('accepts secured debt', () => { expect(debtSchema.safeParse({ ...valid, isSecured: true }).success).toBe(true); });
});
