import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { calculateRecommendation, type RecommendationInput } from '../engine/rules';

/**
 * The Node half of the cross-backend parity check.
 *
 * `tests/fixtures/recommendation-cases.json` is read by this suite and by
 * `tests/dotnet/IAAS.Api.Tests/RecommendationParityTests.cs`. Two backends serve the same
 * API surface, and until this table existed they gave different statutory advice for
 * identical input with nothing detecting it — the .NET engine applied a £1,500 MAP floor
 * that SSI 2023/9 reg. 2 removed in February 2023, evaluated PTD before MAP, and required
 * a £100 surplus for DAS where this engine requires only that a surplus exists (GAP-024).
 *
 * Two independently written test files would drift, which is how the divergence arose in
 * the first place. One table both suites consume makes parity a property: change an
 * expectation here and both suites must go red.
 */

const FIXTURE = path.join(__dirname, '..', '..', '..', '..', 'tests', 'fixtures', 'recommendation-cases.json');

interface Case {
  name: string;
  why?: string;
  input: Partial<RecommendationInput>;
  expect: { product: string; confidence?: string; alternatives?: string[] };
}

const cases: Case[] = JSON.parse(fs.readFileSync(FIXTURE, 'utf8')).cases;

/** The table omits fields a case does not exercise; the engine requires all of them. */
function toInput(partial: Partial<RecommendationInput>): RecommendationInput {
  return {
    totalDebt: 0,
    numberOfCreditors: 1,
    monthlyIncome: 0,
    monthlyExpenditure: 0,
    employmentStatus: 'employed',
    hasAssets: false,
    totalAssetValue: 0,
    existingCases: [],
    hasMoratorium: false,
    ...partial,
  };
}

describe('shared recommendation cases (Node engine)', () => {
  it('reads a non-empty table, so the cases below are not vacuous', () => {
    // A fixture that failed to load would make every it.each below silently absent, and
    // the suite would report green over nothing.
    expect(cases.length).toBeGreaterThanOrEqual(20);
  });

  it.each(cases.map(c => [c.name, c] as const))('%s', (_name, c) => {
    const result = calculateRecommendation(toInput(c.input));

    expect(result.recommendedProduct, c.why ?? '').toBe(c.expect.product);
    if (c.expect.confidence) expect(result.confidence).toBe(c.expect.confidence);
    if (c.expect.alternatives) expect(result.alternativeProducts).toEqual(c.expect.alternatives);
  });

  it('never returns a product outside the known set', () => {
    // A typo in a product id renders as a blank panel in the journey rather than an
    // error, so it would reach a demo before anyone noticed.
    const known = new Set([
      'debt_arrangement_scheme', 'minimal_asset_process', 'protected_trust_deed',
      'bankruptcy', 'moratorium', 'debt_payment_programme', 'signposting_advice',
    ]);

    for (const c of cases) {
      const result = calculateRecommendation(toInput(c.input));
      expect(known.has(result.recommendedProduct), `${c.name}: ${result.recommendedProduct}`).toBe(true);
      for (const alt of result.alternativeProducts) {
        expect(known.has(alt), `${c.name} alternative: ${alt}`).toBe(true);
      }
    }
  });

  it('always gives reasoning, so no recommendation is unexplained', () => {
    // A statutory recommendation with no stated basis cannot be challenged, which is
    // the point of publishing the reasoning at all.
    for (const c of cases) {
      const result = calculateRecommendation(toInput(c.input));
      expect(result.reasoning.length, c.name).toBeGreaterThan(0);
      expect(result.factors.length, c.name).toBe(6);
    }
  });

  it('never lists the recommended product as its own alternative', () => {
    for (const c of cases) {
      const result = calculateRecommendation(toInput(c.input));
      expect(result.alternativeProducts, c.name).not.toContain(result.recommendedProduct);
    }
  });
});
