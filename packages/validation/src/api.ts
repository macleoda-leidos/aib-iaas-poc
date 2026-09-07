import { z } from 'zod';

/**
 * Schemas for the shapes the **API actually receives**.
 *
 * `schemas.ts` next door describes the shape of the *frontend form* — nested
 * `debtorDetails`/`applicantDetails`/`contactDetails` objects with every field
 * required. That is not what any endpoint is sent, which is the practical reason it
 * was never wired in: applying it as middleware would have rejected every real
 * request. The two files answer different questions and both are worth having, so
 * this one exists rather than bending that one.
 *
 * Three properties are deliberate:
 *
 *  - **Everything is optional at the top level.** `/apply` creates a draft with
 *    `POST {}` and then auto-saves partial sections as the applicant fills them in.
 *    A schema demanding a complete application would break the journey on the first
 *    keystroke. Completeness is a *submission* rule, not a *save* rule.
 *  - **Fields that are present are checked strictly.** The value of validation here
 *    is rejecting a malformed NI number or a negative debt, not insisting the form
 *    is finished.
 *  - **Messages match the hand-rolled validator this replaces**, so the error text
 *    the frontend already renders does not change.
 */

/**
 * A National Insurance number, per HMRC's actual rules.
 *
 * Two checks, because neither is sufficient alone: the character classes exclude
 * D, F, I, Q, U and V from the prefix and restrict the suffix to A–D, while the
 * prefix list rules out combinations HMRC never issues. The validator this replaces
 * used `[A-Z]{2}\d{6}[A-Z]`, which accepts `DF123456Z` — not a possible NI number.
 */
const INVALID_NI_PREFIXES = ['BG', 'GB', 'NK', 'KN', 'TN', 'NT', 'ZZ'];

export const niNumberSchema = z
  .string()
  .transform(value => value.replace(/\s/g, '').toUpperCase())
  .refine(value => /^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/.test(value), {
    message: 'NI number must be in format AB123456C (2 letters, 6 digits, 1 letter)',
  })
  .refine(value => !INVALID_NI_PREFIXES.includes(value.slice(0, 2)), {
    message: 'NI number cannot start with BG, GB, NK, KN, TN, NT, or ZZ',
  });

/** A date of birth: parseable, and not in the future. */
export const dateOfBirthSchema = z
  .string()
  .refine(value => !Number.isNaN(new Date(value).getTime()), {
    message: 'Date of birth must be a valid date',
  })
  .refine(value => new Date(value) <= new Date(), {
    message: 'Date of birth cannot be in the future',
  });

export const EMPLOYMENT_STATUSES = [
  'employed', 'self_employed', 'unemployed', 'retired', 'student', 'other',
] as const;

/**
 * The applicant's own details, as the `/apply` journey sends them.
 *
 * `.partial()`-style optionality throughout: a section is saved as soon as it is
 * touched, so most fields are absent most of the time.
 */
export const debtorDetailsInputSchema = z.object({
  title: z.string().max(20).optional(),
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters').max(100).optional(),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters').max(100).optional(),
  dateOfBirth: dateOfBirthSchema.optional(),
  // Empty string is how an untouched optional input arrives, and means "not
  // answered" rather than "answered badly" — so it is skipped rather than rejected.
  nationalInsuranceNumber: z.union([z.literal(''), niNumberSchema]).optional(),
  maritalStatus: z.string().max(50).optional(),
  dependants: z.coerce
    .number({ invalid_type_error: 'Dependants must be between 0 and 20' })
    .int('Dependants must be between 0 and 20')
    .min(0, 'Dependants must be between 0 and 20')
    .max(20, 'Dependants must be between 0 and 20')
    .optional(),
  employmentStatus: z
    .enum(EMPLOYMENT_STATUSES, {
      errorMap: () => ({ message: `Employment status must be one of: ${EMPLOYMENT_STATUSES.join(', ')}` }),
    })
    .optional(),
  employerName: z.string().max(200).optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().max(30).optional(),
}).passthrough();

/**
 * One debt as the journey sends it.
 *
 * `z.coerce.number` because the form posts amounts as strings — the hand-rolled
 * validator ran `parseFloat` for the same reason. Coercing here means the rest of
 * the stack sees a number.
 */
export const debtInputSchema = z.object({
  creditorName: z.string().trim().min(2, 'Creditor name must be at least 2 characters').max(200).optional(),
  creditorType: z.string().max(50).optional(),
  outstandingAmount: z.coerce
    .number()
    .positive('Outstanding amount must be greater than 0')
    .max(10_000_000, 'Outstanding amount cannot exceed 10,000,000')
    .optional(),
  monthlyPayment: z.coerce.number().min(0, 'Monthly payment cannot be negative').optional(),
  accountReference: z.string().max(50).optional(),
}).passthrough();

export const debtSummaryInputSchema = z.object({
  debts: z.array(debtInputSchema).optional(),
  totalDebtAmount: z.coerce.number().min(0).optional(),
  creditorsCount: z.coerce.number().int().min(0).optional(),
}).passthrough();

/**
 * A money map — `{ wages: 2150, benefits: 180 }` — with the same per-entry bounds
 * the hand-rolled validator applied. The keys are open because the form's income and
 * expenditure categories are presentational and have changed before now.
 */
function moneyMap(label: string) {
  return z.record(
    z.coerce
      .number()
      .min(0, `${label} amount must be 0 or more`)
      .max(99_999, `${label} amount cannot exceed 99,999`)
  );
}

export const incomeExpenditureInputSchema = z.object({
  income: moneyMap('Income').optional(),
  expenditure: moneyMap('Expenditure').optional(),
}).passthrough();

/**
 * The body accepted by `POST /api/applications` and `PUT /api/applications/:id`.
 *
 * `.passthrough()` rather than `.strict()`: the journey posts several sections the
 * repository does not yet persist (`addressHistory`, `contactDetails`, `assets`,
 * `recommendation`), and rejecting them would break the auto-save that sends them.
 * That they are accepted and then discarded is a separate defect, recorded in
 * docs/security-known-gaps.md — validation should not be the thing that hides it.
 */
export const applicationBodySchema = z.object({
  status: z.string().max(50).optional(),
  debtorDetails: debtorDetailsInputSchema.optional(),
  debtSummary: debtSummaryInputSchema.optional(),
  incomeExpenditure: incomeExpenditureInputSchema.optional(),
  submittedAt: z.string().optional(),
  assignedTo: z.string().max(100).optional(),
}).passthrough();

export const APPLICATION_STATUSES = [
  'draft', 'submitted', 'under_review', 'additional_info_required',
  'recommendation_issued', 'approved', 'accepted', 'rejected', 'withdrawn',
] as const;

/** `PATCH /api/applications/:id/status`. */
export const applicationStatusBodySchema = z.object({
  status: z.enum(APPLICATION_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${APPLICATION_STATUSES.join(', ')}` }),
  }),
  notes: z.string().max(5_000).optional(),
});

/** `POST /api/applications/:id/notes`. */
export const caseNoteBodySchema = z.object({
  content: z.string().trim().min(1, 'Note content is required').max(5_000),
  noteType: z.string().max(50).optional(),
  authorName: z.string().max(200).optional(),
});

/**
 * Render a ZodError as the flat list of strings the API's error envelope carries in
 * `error.details`, which is what the frontend already displays.
 *
 * The path is prefixed so a failure inside an array says which entry it was —
 * "Debt 2: ..." rather than an unattributed message, matching the hand-rolled
 * validator's output. Framework-agnostic on purpose: the Express middleware that
 * uses this lives in the gateway, but nothing here depends on Express.
 */
export function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map(issue => {
    const path = issue.path;

    // debtSummary.debts.1.outstandingAmount -> "Debt 2: ..."
    const debtIndex = path[0] === 'debtSummary' && path[1] === 'debts' ? path[2] : undefined;
    if (typeof debtIndex === 'number') return `Debt ${debtIndex + 1}: ${issue.message}`;

    // incomeExpenditure.income.wages -> "Income wages: ..." — the message already
    // carries the Income/Expenditure label, so only the category is added.
    if (path[0] === 'incomeExpenditure' && (path[1] === 'income' || path[1] === 'expenditure')) {
      const category = path[2];
      const [label, ...rest] = issue.message.split(' ');
      return category ? `${label} ${category}: ${rest.join(' ')}` : issue.message;
    }

    return issue.message;
  });
}
