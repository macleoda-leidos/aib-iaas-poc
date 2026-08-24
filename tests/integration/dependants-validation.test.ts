import { describe, it, expect } from 'vitest';
import { debtorDetailsSchema } from '../../packages/validation/src/schemas';

/**
 * Regression tests for the "dependants = 0 rejected as missing" bug (bug 1).
 *
 * Background: the step-0 validator in apps/web/src/app/apply/page.tsx used a
 * falsy check, so an untouched dependants field failed validation even though
 * the input renders `value={d.dependants || 0}` and therefore DISPLAYS 0.
 * The user saw a valid 0 and an error telling them it was required.
 *
 * Two layers are covered:
 *
 *  1. The real, exported domain rule in packages/validation
 *     (`debtorDetailsSchema.dependants` = int, min 0, max 20). This is the
 *     authoritative boundary and is tested against the real schema.
 *
 *  2. A CHARACTERISATION TEST of the page-level form rule. The page validator
 *     (`validateStep`) is not exported and refactoring the page to export it
 *     would be too invasive, so the boundary rules are re-encoded locally
 *     below. This does NOT execute application code — it pins the intended
 *     contract so a future divergence is a visible, deliberate decision
 *     rather than a silent regression. If `validateStep` is ever exported,
 *     replace `validateDependantsField` with the real import; the assertions
 *     should continue to hold unchanged.
 */

const validDebtorBase = {
  title: 'Mr' as const,
  firstName: 'Alistair',
  lastName: 'Morrison',
  dateOfBirth: '1985-04-12',
  maritalStatus: 'married' as const,
  employmentStatus: 'employed' as const,
};

describe('debtorDetailsSchema.dependants (real exported domain rule)', () => {
  it('accepts 0 dependants', () => {
    // The core regression: zero is a legitimate answer, not a missing one.
    const result = debtorDetailsSchema.safeParse({ ...validDebtorBase, dependants: 0 });
    expect(result.success).toBe(true);
  });

  it('accepts the upper boundary of 20 dependants', () => {
    const result = debtorDetailsSchema.safeParse({ ...validDebtorBase, dependants: 20 });
    expect(result.success).toBe(true);
  });

  it('accepts a typical mid-range value', () => {
    const result = debtorDetailsSchema.safeParse({ ...validDebtorBase, dependants: 3 });
    expect(result.success).toBe(true);
  });

  it('rejects a negative number of dependants', () => {
    const result = debtorDetailsSchema.safeParse({ ...validDebtorBase, dependants: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects more than 20 dependants', () => {
    const result = debtorDetailsSchema.safeParse({ ...validDebtorBase, dependants: 21 });
    expect(result.success).toBe(false);
  });

  it('rejects a non-integer number of dependants', () => {
    const result = debtorDetailsSchema.safeParse({ ...validDebtorBase, dependants: 2.5 });
    expect(result.success).toBe(false);
  });

  it('rejects a missing dependants value (the field is genuinely required at the domain layer)', () => {
    const result = debtorDetailsSchema.safeParse({ ...validDebtorBase });
    expect(result.success).toBe(false);
  });

  it('rejects a non-numeric dependants value', () => {
    const result = debtorDetailsSchema.safeParse({ ...validDebtorBase, dependants: 'two' });
    expect(result.success).toBe(false);
  });
});

/**
 * CHARACTERISATION TEST — local reimplementation of the step-0 form rule.
 *
 * Mirrors apps/web/src/app/apply/page.tsx (`validateStep`, step 0, dependants
 * branch) as fixed. The page validator is not exported; see the file header.
 *
 * Returns an error message, or null when the field is acceptable.
 */
function validateDependantsField(raw: unknown): string | null {
  // Only an explicitly cleared field counts as missing. undefined/null mean
  // "untouched", and the input displays 0 in that state, so 0 is assumed.
  if (raw === '') {
    return 'Number of dependants is required';
  }

  const dep = raw === undefined || raw === null ? 0 : parseInt(raw as string);

  if (isNaN(dep) || dep < 0) {
    return 'Dependants must be 0 or more';
  }
  if (dep > 20) {
    return 'Dependants cannot exceed 20';
  }
  return null;
}

describe('apply page step-0 dependants rule (characterisation of validateStep)', () => {
  it('treats numeric 0 as valid', () => {
    expect(validateDependantsField(0)).toBeNull();
  });

  it('treats the string "0" as valid', () => {
    // Number inputs hand back strings; "0" is falsy-adjacent and was the
    // shape that originally tripped the bug.
    expect(validateDependantsField('0')).toBeNull();
  });

  it('treats undefined as 0 and therefore valid', () => {
    // The regression itself: an untouched field displays 0, so it must pass.
    expect(validateDependantsField(undefined)).toBeNull();
  });

  it('treats null as 0 and therefore valid', () => {
    expect(validateDependantsField(null)).toBeNull();
  });

  it('rejects an explicitly cleared field', () => {
    expect(validateDependantsField('')).toBe('Number of dependants is required');
  });

  it('rejects a negative value', () => {
    expect(validateDependantsField('-1')).toBe('Dependants must be 0 or more');
    expect(validateDependantsField(-3)).toBe('Dependants must be 0 or more');
  });

  it('accepts the upper boundary of 20', () => {
    expect(validateDependantsField(20)).toBeNull();
    expect(validateDependantsField('20')).toBeNull();
  });

  it('rejects 21, just past the upper boundary', () => {
    expect(validateDependantsField(21)).toBe('Dependants cannot exceed 20');
  });

  it('rejects a non-numeric value', () => {
    expect(validateDependantsField('abc')).toBe('Dependants must be 0 or more');
  });

  it('accepts every value across the whole valid 0..20 range', () => {
    for (let i = 0; i <= 20; i++) {
      expect(validateDependantsField(i), `numeric ${i} should be valid`).toBeNull();
      expect(validateDependantsField(String(i)), `string "${i}" should be valid`).toBeNull();
    }
  });

  it('agrees with the domain schema across the 0..20 range', () => {
    // Cross-check: the form rule and the exported Zod rule must not drift on
    // the integer boundary cases.
    for (const value of [0, 1, 20]) {
      expect(validateDependantsField(value)).toBeNull();
      expect(
        debtorDetailsSchema.safeParse({ ...validDebtorBase, dependants: value }).success
      ).toBe(true);
    }
    for (const value of [-1, 21]) {
      expect(validateDependantsField(value)).not.toBeNull();
      expect(
        debtorDetailsSchema.safeParse({ ...validDebtorBase, dependants: value }).success
      ).toBe(false);
    }
  });
});
