import { describe, it, expect } from 'vitest';
import { scoreMatch, detectField, MATCH_THRESHOLD } from '../nameSimilarity';

/**
 * Pins the scoring model that /search puts on screen.
 *
 * The page shows "85%+" to the audience as a real threshold, so these tests
 * assert exact percentages rather than ranges. That is deliberate: the cost
 * model's weights are only justified by the separation they produce, and a
 * loosened weight would slide a tile's matches under the gate silently. If you
 * change TRANSPOSE_COST, GEMINATION_COST, VOWEL_SUB_COST or the Mac/Mc rule,
 * these numbers move and you must re-check the margin at the bottom.
 */

const name = (n: string) => ({ name: n, ni: '', ref: '' });
const score = (query: string, candidate: string) => scoreMatch(query, name(candidate)).similarity;
const reason = (query: string, candidate: string) => scoreMatch(query, name(candidate)).reason;

describe('detectField', () => {
  it('routes by query shape', () => {
    expect(detectField('John Smith')).toBe('name');
    expect(detectField('MacDonlad')).toBe('name');
    expect(detectField('SC129837A')).toBe('ni');
    expect(detectField('AB 12 34 56 C')).toBe('ni');
    expect(detectField('IAAS-2026-00001')).toBe('ref');
    expect(detectField('00042')).toBe('ref');
  });

  it('does not mistake a surname for an identifier', () => {
    // "Mc" is two letters, but no digit follows, so it stays a name.
    expect(detectField('McDonald')).toBe('name');
  });
});

describe('name scoring — the six quick-search tiles', () => {
  it('clusters the four Smiths for an exactly-spelled query', () => {
    expect(score('John Smith', 'John Smith')).toBe(100);
    expect(score('John Smith', 'Jhon Smith')).toBe(93.8);
    expect(score('John Smith', 'John Smyth')).toBe(92.5);
    expect(score('John Smith', 'Jon Smith')).toBe(87.5);
  });

  it('matches every Morrison spelling, including the two-edit alignment', () => {
    // The whole reason gemination costs half: under a plain edit distance
    // "Morisson" -> "Morrison" is two edits and scores 75%, below the gate.
    expect(score('Morisson', 'Alistair Morrison')).toBe(87.5);
    expect(score('Morisson', 'Ronald Morison')).toBe(93.8);
    expect(score('Morisson', 'Elaine Morrisson')).toBe(94.4);
  });

  it('matches Campbell with and without the doubled letter', () => {
    expect(score('Campbel', 'Ian Campbel')).toBe(100);
    expect(score('Campbel', 'Fiona Campbell')).toBe(93.8);
  });

  it('treats Mac and Mc as a house style rather than a typo', () => {
    // Without canonicalisation McDonald falls to 83.3% and drops out.
    expect(score('MacDonlad', 'Sarah McDonald')).toBe(93.8);
    expect(score('MacDonlad', 'Kenneth MacDonald')).toBe(93.8);
    expect(score('MacDonlad', 'Iain MacDonnald')).toBe(88.9);
  });

  it('matches the Eleanor variants', () => {
    expect(score('Eleanro', 'Eleanor MacPherson')).toBe(92.9);
    expect(score('Eleanro', 'Elleanor Ross')).toBe(87.5);
  });

  it('scores a transposed NI against the whole cross-system cluster', () => {
    const ni = (n: string) => scoreMatch('SC129837A', { name: '', ni: n, ref: '' }).similarity;
    expect(ni('SC129837A')).toBe(100);
    expect(ni('SC192837A')).toBe(90);
    expect(ni('SC129387A')).toBe(90);
    expect(ni('SC129873A')).toBe(90);
  });
});

describe('name scoring — what must NOT match', () => {
  it.each([
    ['John Smith', 'John Stewart', 58.9],
    ['John Smith', 'Robert Johnston', 27.1],
    ['John Smith', 'Janet Clark', 15],
    ['MacDonlad', 'Iain MacLeod', 43.8],
  ])('keeps %s well clear of %s', (query, candidate, expected) => {
    expect(score(query, candidate)).toBe(expected);
    expect(score(query, candidate)).toBeLessThan(MATCH_THRESHOLD);
  });

  it('separates a different debtor sharing an NI shape', () => {
    // Jaro-Winkler scores this pair 93.1% — above real name variants — which is
    // why identifiers are scored against a fixed typo budget instead.
    const wrong = scoreMatch('SC129837A', { name: '', ni: 'SC123456B', ref: '' });
    expect(wrong.similarity).toBeLessThan(MATCH_THRESHOLD);
  });
});

describe('token handling', () => {
  it('compares a bare surname against the best token, not the whole name', () => {
    // Whole-string comparison scores this pair in the 40s, below unrelated
    // names, which made single-token queries useless.
    expect(score('Morisson', 'Alistair Morrison')).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });

  it('consumes a candidate token once so a repeated stem cannot inflate a score', () => {
    // Without one-to-one consumption both query tokens map onto "Johnston".
    expect(score('John Smith', 'Robert Johnston')).toBeLessThan(MATCH_THRESHOLD);
  });

  it('is order independent', () => {
    expect(score('Smith John', 'John Smith')).toBe(100);
  });
});

describe('identifier scoring', () => {
  it('treats a partial reference as a prefix search, not a typo', () => {
    // Proportional scoring would call "00042" 60% wrong about its own case.
    expect(scoreMatch('00042', { name: '', ni: '', ref: 'IAAS-2026-00042' }).similarity).toBe(100);
  });

  it('does not admit every reference just because they share a prefix', () => {
    // All 110 seeded refs start "IAAS-2026-000". Under proportional
    // normalisation every one of them clears 85% for any ref query.
    const other = scoreMatch('IAAS-2026-00001', { name: '', ni: '', ref: 'IAAS-2026-00002' });
    expect(other.similarity).toBeLessThan(MATCH_THRESHOLD);
  });

  it('still recognises a genuine transposition in a reference', () => {
    const swapped = scoreMatch('IAAS-2026-00001', { name: '', ni: '', ref: 'IAAS-2026-00010' });
    expect(swapped.similarity).toBe(90);
    expect(swapped.reason).toBe('reference — digits transposed');
  });

  it('highlights positions in the rendered reference, not the stripped one', () => {
    // Two dashes sit before the digits, so the transposed pair is at 13-14 of
    // "IAAS-2026-00010" even though scoring saw it at 11-12.
    const swapped = scoreMatch('IAAS-2026-00001', { name: '', ni: '', ref: 'IAAS-2026-00010' });
    expect(swapped.highlights).toEqual([[13, 14]]);
  });

  it('marks the matched span of a partial reference', () => {
    const partial = scoreMatch('00042', { name: '', ni: '', ref: 'IAAS-2026-00042' });
    expect(partial.highlights).toEqual([[10, 14]]);
  });

  it('tolerates a spaced NI number', () => {
    const spaced = scoreMatch('SC 12 98 37 A', { name: '', ni: 'SC129837A', ref: '' });
    expect(spaced.similarity).toBe(100);
    expect(spaced.field).toBe('ni');
  });
});

describe('reason labels', () => {
  it.each([
    ['John Smith', 'Jon Smith', 'forename — letter missing'],
    ['John Smith', 'Jhon Smith', 'forename — letters transposed'],
    ['John Smith', 'John Smyth', 'surname — letter substituted'],
    ['Morisson', 'Alistair Morrison', 'surname — double letters differ'],
    ['Morisson', 'Ronald Morison', 'surname — double letter typed once'],
    ['Campbel', 'Fiona Campbell', 'surname — double letter'],
    ['MacDonlad', 'Kenneth MacDonald', 'surname — letters transposed'],
    ['MacDonlad', 'Sarah McDonald', 'surname — Mac/Mc prefix variant + letters transposed'],
    ['Eleanro', 'Eleanor MacPherson', 'forename — letters transposed'],
  ])('explains %s -> %s', (query, candidate, expected) => {
    expect(reason(query, candidate)).toBe(expected);
  });

  it('says so when nothing differs', () => {
    expect(reason('John Smith', 'John Smith')).toBe('exact match');
  });

  it('stops claiming to know what happened past two edits', () => {
    // A confidently wrong explanation is worse than an honest vague one.
    expect(reason('John Smith', 'Janet Clark')).toContain('spelling variant');
  });
});

describe('highlight ranges', () => {
  it('marks only the characters that differ, not the whole name', () => {
    // Fuse's own match indices return [[0, 9]] here — the entire string — which
    // is why highlights come from the alignment instead.
    const { highlights } = scoreMatch('John Smith', name('Jhon Smith'));
    expect(highlights).toEqual([[1, 2]]);
  });

  it('returns nothing to highlight for an exact match', () => {
    expect(scoreMatch('John Smith', name('John Smith')).highlights).toEqual([]);
  });
});

describe('the gate the UI advertises', () => {
  it('leaves a wide margin either side of MATCH_THRESHOLD', () => {
    // The page tells the audience "85%+". That claim is only honest while the
    // worst true match sits above it and the best false one sits below. The
    // false set below is deliberately harsher than the seed corpus — it includes
    // "John Stewart", a near miss no seed record actually contains — so the
    // margin here is tighter than the 56.3% the corpus itself produces.
    const trueMatches = [
      score('John Smith', 'Jon Smith'),
      score('Morisson', 'Alistair Morrison'),
      score('Campbel', 'Fiona Campbell'),
      score('MacDonlad', 'Iain MacDonnald'),
      score('Eleanro', 'Elleanor Ross'),
    ];
    const falseMatches = [
      score('John Smith', 'John Stewart'),
      score('MacDonlad', 'Iain MacLeod'),
      score('John Smith', 'Robert Johnston'),
    ];

    expect(Math.min(...trueMatches)).toBe(87.5);
    expect(Math.max(...falseMatches)).toBe(58.9);
    expect(Math.min(...trueMatches)).toBeGreaterThan(MATCH_THRESHOLD);
    expect(Math.max(...falseMatches)).toBeLessThan(MATCH_THRESHOLD);
  });
});
