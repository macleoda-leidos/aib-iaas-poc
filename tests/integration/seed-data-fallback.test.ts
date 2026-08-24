import { describe, it, expect } from 'vitest';
import { seedApplications, type SeedApplication } from '../../apps/web/src/lib/seedData';

/**
 * Regression tests for the dashboard demo-data fallback (bug 3).
 *
 * Background: when the API is unreachable the dashboard falls back to demo
 * rows, but the KPI cards at the top of the page count over ALL of
 * `seedApplications`. The bug was that the fallback table rendered only 4
 * hardcoded rows, so the queue visibly contradicted the counts above it
 * ("Approved: 34" over a table of 4 rows). The fix maps `seedApplications`
 * for the fallback so both come from the same source.
 *
 * These tests guard the seed dataset itself: if it shrinks, gains duplicate
 * references, loses required fields, or grows a status the dashboard's
 * STATUS_LABELS map does not know about, the fallback silently degrades again.
 */

// The label map in apps/web/src/app/dashboard/page.tsx keys off these exact
// status strings. A status outside this set falls through to the raw value and
// renders an untranslated snake_case badge.
const KNOWN_STATUSES = [
  'submitted',
  'under_review',
  'additional_info_required',
  'approved',
  'rejected',
  'draft',
  'withdrawn',
] as const;

const REQUIRED_STRING_FIELDS: Array<keyof SeedApplication> = [
  'ref',
  'firstName',
  'lastName',
  'status',
  'product',
  'date',
  'ni',
  'source',
  'postcode',
  'email',
  'employment',
  'assignedTo',
  'city',
];

describe('seedApplications (dashboard demo fallback dataset)', () => {
  it('contains exactly 100 applications', () => {
    // The KPI cards count over the whole array; the fallback table must be
    // able to render the same population. 100 is the documented demo size.
    expect(seedApplications).toHaveLength(100);
  });

  it('has a unique reference for every application', () => {
    // `ref` is used as the React key and as the row identity for batch
    // selection, so duplicates would drop rows and corrupt selection state.
    const refs = seedApplications.map((a) => a.ref);
    const unique = new Set(refs);
    expect(unique.size).toBe(refs.length);
  });

  it('gives every application a non-empty value for each required field', () => {
    const offenders: string[] = [];

    for (const app of seedApplications) {
      for (const field of REQUIRED_STRING_FIELDS) {
        const value = app[field];
        if (typeof value !== 'string' || value.trim().length === 0) {
          offenders.push(`${app.ref ?? '<no ref>'}.${String(field)}=${JSON.stringify(value)}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('only uses statuses the dashboard knows how to label', () => {
    const unknown = seedApplications
      .map((a) => a.status)
      .filter((status) => !KNOWN_STATUSES.includes(status as (typeof KNOWN_STATUSES)[number]));

    expect(unknown).toEqual([]);
  });

  it('gives every application a positive numeric debt', () => {
    const offenders = seedApplications
      .filter((a) => typeof a.debt !== 'number' || !Number.isFinite(a.debt) || a.debt <= 0)
      .map((a) => `${a.ref}=${JSON.stringify(a.debt)}`);

    expect(offenders).toEqual([]);
  });

  it('gives every application a confidence score between 0 and 100', () => {
    const offenders = seedApplications
      .filter(
        (a) =>
          typeof a.confidence !== 'number' ||
          !Number.isFinite(a.confidence) ||
          a.confidence < 0 ||
          a.confidence > 100
      )
      .map((a) => `${a.ref}=${JSON.stringify(a.confidence)}`);

    expect(offenders).toEqual([]);
  });

  it('uses parseable ISO dates so the fallback rows format rather than show "Invalid Date"', () => {
    // The fallback maps `new Date(a.date).toLocaleDateString(...)`. An
    // unparseable date renders literally as "Invalid Date" in the queue.
    const offenders = seedApplications
      .filter((a) => Number.isNaN(new Date(a.date).getTime()))
      .map((a) => `${a.ref}=${a.date}`);

    expect(offenders).toEqual([]);
  });

  it('exposes more than the 4 rows the buggy fallback rendered', () => {
    // Directly encodes the regression: the pre-fix fallback showed 4
    // hardcoded rows while the KPI cards counted 100. This asserts the seed
    // source the fallback now maps is genuinely a full dataset.
    expect(seedApplications.length).toBeGreaterThan(4);
  });

  it('populates every status bucket the KPI cards count, so the fallback is never an empty queue', () => {
    // KPI cards compute Pending Review / Awaiting Info / Approved / Total
    // Active. Each of those buckets must be non-empty in the fallback,
    // otherwise a card shows a count with no matching rows beneath it.
    const pendingReview = seedApplications.filter(
      (a) => a.status === 'under_review' || a.status === 'submitted'
    );
    const awaitingInfo = seedApplications.filter((a) => a.status === 'additional_info_required');
    const approved = seedApplications.filter((a) => a.status === 'approved');
    const totalActive = seedApplications.filter(
      (a) => a.status !== 'draft' && a.status !== 'rejected'
    );

    expect(pendingReview.length).toBeGreaterThan(0);
    expect(awaitingInfo.length).toBeGreaterThan(0);
    expect(approved.length).toBeGreaterThan(0);
    expect(totalActive.length).toBeGreaterThan(0);

    // Total Active must be a subset-consistent count, never exceeding the set.
    expect(totalActive.length).toBeLessThanOrEqual(seedApplications.length);
  });
});
