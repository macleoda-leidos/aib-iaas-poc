import { z } from 'zod';

export const debtorDetailsSchema = z.object({
  title: z.enum(['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Rev']),
  firstName: z.string().min(1, 'First name is required').max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  nationalInsuranceNumber: z.string()
    .regex(/^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/, 'Invalid National Insurance number format')
    .optional(),
  maritalStatus: z.enum(['single', 'married', 'civil_partnership', 'divorced', 'widowed', 'separated']),
  dependants: z.number().int().min(0).max(20),
  employmentStatus: z.enum(['employed', 'self_employed', 'unemployed', 'retired', 'student', 'other']),
  employerName: z.string().max(200).optional(),
});

export const applicantDetailsSchema = z.object({
  relationship: z.enum(['self', 'representative', 'executor', 'trustee', 'adviser']),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^(\+44|0)\d{9,10}$/, 'Invalid UK phone number'),
  organisationName: z.string().max(200).optional(),
  referenceNumber: z.string().max(50).optional(),
});

export const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required').max(200),
  line2: z.string().max(200).optional(),
  line3: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required').max(100),
  county: z.string().max(100).optional(),
  postcode: z.string()
    .regex(/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i, 'Invalid UK postcode format'),
  country: z.string().min(1).default('Scotland'),
  addressType: z.enum(['current', 'previous', 'correspondence']),
  residenceSince: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const contactDetailsSchema = z.object({
  primaryPhone: z.string().regex(/^(\+44|0)\d{9,10}$/, 'Invalid UK phone number'),
  secondaryPhone: z.string().regex(/^(\+44|0)\d{9,10}$/).optional(),
  email: z.string().email('Invalid email address'),
  preferredContactMethod: z.enum(['phone', 'email', 'post']),
});

export const debtSchema = z.object({
  creditorName: z.string().min(1, 'Creditor name is required').max(200),
  creditorType: z.enum(['bank', 'credit_card', 'loan_company', 'utility', 'council_tax', 'hmrc', 'other']),
  originalAmount: z.number().positive('Original amount must be positive'),
  outstandingAmount: z.number().min(0, 'Outstanding amount cannot be negative'),
  monthlyPayment: z.number().min(0),
  isSecured: z.boolean(),
  accountReference: z.string().max(50).optional(),
  inArrears: z.boolean(),
  arrearsAmount: z.number().min(0).optional(),
});

export const incomeSchema = z.object({
  wages: z.number().min(0),
  benefits: z.number().min(0),
  pension: z.number().min(0),
  otherIncome: z.number().min(0),
  totalMonthlyIncome: z.number().min(0),
});

export const expenditureSchema = z.object({
  mortgage: z.number().min(0),
  rent: z.number().min(0),
  councilTax: z.number().min(0),
  utilities: z.number().min(0),
  food: z.number().min(0),
  transport: z.number().min(0),
  insurance: z.number().min(0),
  childcare: z.number().min(0),
  otherExpenditure: z.number().min(0),
  totalMonthlyExpenditure: z.number().min(0),
});

export const householdSchema = z.object({
  numberOfAdults: z.number().int().min(1).max(10),
  numberOfChildren: z.number().int().min(0).max(15),
  childrenAges: z.array(z.number().int().min(0).max(18)).optional(),
});

export const assetSchema = z.object({
  type: z.enum(['property', 'vehicle', 'savings', 'investments', 'other']),
  description: z.string().min(1).max(500),
  estimatedValue: z.number().min(0),
  outstandingFinance: z.number().min(0).optional(),
  isEssential: z.boolean(),
});

export const applicationSubmissionSchema = z.object({
  debtorDetails: debtorDetailsSchema,
  applicantDetails: applicantDetailsSchema,
  addresses: z.array(addressSchema).min(1, 'At least one address is required'),
  contactDetails: contactDetailsSchema,
  debts: z.array(debtSchema).min(1, 'At least one debt must be entered'),
  income: incomeSchema,
  expenditure: expenditureSchema,
  household: householdSchema,
  assets: z.array(assetSchema).optional(),
});

export type DebtorDetailsInput = z.infer<typeof debtorDetailsSchema>;
export type ApplicationSubmissionInput = z.infer<typeof applicationSubmissionSchema>;
