import { describe, it, expect } from 'vitest';
import { debtorDetailsSchema, addressSchema, contactDetailsSchema, debtSchema, incomeSchema, applicationSubmissionSchema } from '../schemas';

describe('Debtor Details Schema', () => {
  const valid = { title: 'Mr', firstName: 'John', lastName: 'Test', dateOfBirth: '1985-03-15', maritalStatus: 'single' as const, dependants: 0, employmentStatus: 'employed' as const };

  it('accepts valid debtor details', () => { expect(debtorDetailsSchema.safeParse(valid).success).toBe(true); });
  it('rejects missing first name', () => { expect(debtorDetailsSchema.safeParse({ ...valid, firstName: '' }).success).toBe(false); });
  it('rejects invalid date format', () => { expect(debtorDetailsSchema.safeParse({ ...valid, dateOfBirth: '15/03/1985' }).success).toBe(false); });
  it('rejects invalid NI number', () => { expect(debtorDetailsSchema.safeParse({ ...valid, nationalInsuranceNumber: 'INVALID' }).success).toBe(false); });
  it('accepts valid NI number', () => { expect(debtorDetailsSchema.safeParse({ ...valid, nationalInsuranceNumber: 'AB123456C' }).success).toBe(true); });
  it('rejects negative dependants', () => { expect(debtorDetailsSchema.safeParse({ ...valid, dependants: -1 }).success).toBe(false); });
});

describe('Address Schema', () => {
  const valid = { line1: '1 Test St', city: 'Edinburgh', postcode: 'EH1 1AA', country: 'Scotland', addressType: 'current' as const };

  it('accepts valid address', () => { expect(addressSchema.safeParse(valid).success).toBe(true); });
  it('rejects missing city', () => { expect(addressSchema.safeParse({ ...valid, city: '' }).success).toBe(false); });
  it('rejects invalid postcode', () => { expect(addressSchema.safeParse({ ...valid, postcode: '123' }).success).toBe(false); });
  it('accepts various postcode formats', () => {
    ['EH1 1AA', 'G2 3AB', 'AB10 1XY', 'FK8 1AA'].forEach(pc => {
      expect(addressSchema.safeParse({ ...valid, postcode: pc }).success).toBe(true);
    });
  });
});

describe('Contact Details Schema', () => {
  it('accepts valid contact', () => {
    const valid = { primaryPhone: '07700900001', email: 'test@example.com', preferredContactMethod: 'email' as const };
    expect(contactDetailsSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects invalid email', () => {
    expect(contactDetailsSchema.safeParse({ primaryPhone: '07700900001', email: 'invalid', preferredContactMethod: 'email' }).success).toBe(false);
  });
  it('rejects invalid phone', () => {
    expect(contactDetailsSchema.safeParse({ primaryPhone: '123', email: 'a@b.com', preferredContactMethod: 'phone' }).success).toBe(false);
  });
});

describe('Debt Schema', () => {
  const valid = { creditorName: 'Bank', creditorType: 'bank' as const, originalAmount: 5000, outstandingAmount: 3000, monthlyPayment: 100, isSecured: false, inArrears: false };

  it('accepts valid debt', () => { expect(debtSchema.safeParse(valid).success).toBe(true); });
  it('rejects negative outstanding amount', () => { expect(debtSchema.safeParse({ ...valid, outstandingAmount: -100 }).success).toBe(false); });
  it('rejects missing creditor name', () => { expect(debtSchema.safeParse({ ...valid, creditorName: '' }).success).toBe(false); });
});

describe('Income Schema', () => {
  it('accepts valid income', () => {
    expect(incomeSchema.safeParse({ wages: 1800, benefits: 200, pension: 0, otherIncome: 0, totalMonthlyIncome: 2000 }).success).toBe(true);
  });
  it('rejects negative wages', () => {
    expect(incomeSchema.safeParse({ wages: -100, benefits: 0, pension: 0, otherIncome: 0, totalMonthlyIncome: 0 }).success).toBe(false);
  });
});
