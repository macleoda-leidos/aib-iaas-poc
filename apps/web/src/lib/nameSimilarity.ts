/**
 * Similarity scoring for cross-system identity matching on /search.
 *
 * The search page has to answer a question Fuse.js cannot: how alike are these
 * two names, and *why* do they differ? Fuse scores relevance for ranking, not
 * similarity. Measured against the real corpus it puts "Jhon Smith" at 0.754
 * for a query of "John Smith" — which renders as 25% for a single transposition
 * — and it ties all four Morrisons at exactly 0.700, so there is no order
 * within a result set. Fuse still does candidate generation; this module does
 * the scoring, the gating and the explanation.
 *
 * Both off-the-shelf metrics were measured over all 110 seed records and both
 * fail at a threshold we could honestly put on screen:
 *
 * - Plain normalised Damerau-Levenshtein scores "Morisson" against "Morrison"
 *   at 75%, because under optimal alignment that pair is two edits. An 85% gate
 *   would silently drop the demo's flagship tile.
 * - Jaro-Winkler cannot separate identifiers: the *wrong* debtor's NI number
 *   scores 93.1%, above name variants we need to keep at 92.8%. It also admits
 *   three MacLeods for a "MacDonlad" query at exactly 85.0%.
 *
 * So the cost model below is domain-aware, and every weight earns its place —
 * nameSimilarity.test.ts pins the exact percentage each one produces, so a
 * loosened weight fails rather than quietly dropping a row. With gemination at full cost
 * "Morisson" stops matching "Morrison"; without Mac/Mc canonicalisation
 * "McDonald" falls to 83.3%. Over the whole corpus the tightest true match sits
 * at 87.5% and the highest false one at 56.3%, which is why MATCH_THRESHOLD can
 * be shown to an audience as a real number rather than a vague "fuzzy".
 */

/** Similarity at or above which two records are offered as the same identity. */
export const MATCH_THRESHOLD = 85;

// A human mistypes once; the metric should charge once. A transposition, and an
// inserted or dropped letter that merely doubles a neighbour ("Campbel" for
// "Campbell", "Morison" for "Morrison"), are each a single slip rather than the
// two independent edits a plain edit distance counts them as.
const TRANSPOSE_COST = 0.5;
const GEMINATION_COST = 0.5;
// Vowel-for-vowel is the commonest substitution in anglicised Scottish names
// (Smith/Smyth, MacKenzie/McKenzie), so it costs less than a random letter swap.
const VOWEL_SUB_COST = 0.75;
const FULL_COST = 1;

// Identifiers are scored against a fixed typo budget instead of proportionally,
// because every seeded reference shares the prefix "IAAS-2026-000": proportional
// scoring puts all 110 of them above any useful threshold for any ref query.
// Five is the budget that keeps one transposed digit at 90% and two at 80%.
const CODE_BUDGET = 5;

const VOWELS = 'aeiouy';

export type MatchField = 'name' | 'ni' | 'ref';

export interface SimilarityResult {
  /** 0–100, one decimal place. Rounded before gating, so the gate matches the display. */
  similarity: number;
  /** Why the record differs, e.g. "forename — letters transposed". */
  reason: string;
  field: MatchField;
  /** Character ranges in the matched field that differ from the query. */
  highlights: [number, number][];
}

/** Which field is this query aimed at? Decided by shape, not by trying all three. */
export function detectField(query: string): MatchField {
  const term = query.trim();
  if (/^[A-Za-z]{2}[\s-]*\d/.test(term)) return 'ni';
  if (/^IAAS/i.test(term) || /^\d{3,}$/.test(term)) return 'ref';
  return 'name';
}

/** Costs are multiples of 0.25 and so exact in binary, but compare tolerantly anyway. */
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/** Does this character simply double one of its neighbours? */
const doubles = (s: string, i: number) => s[i - 1] === s[i] || s[i + 1] === s[i];

const insCost = (s: string, i: number) => (doubles(s, i) ? GEMINATION_COST : FULL_COST);
const delCost = insCost;

const subCost = (a: string, b: string) =>
  VOWELS.includes(a) && VOWELS.includes(b) ? VOWEL_SUB_COST : FULL_COST;

/**
 * "Mac" and "Mc" are the same name under a different house style, not a typo, so
 * both collapse to one form before scoring. Requires a following letter so the
 * surname "Mac" is left alone.
 */
const canonical = (token: string) => token.replace(/^mac(?=[a-z])/, 'mc');

type OpKind = 'equal' | 'sub' | 'ins' | 'del' | 'trans';

interface Op {
  kind: OpKind;
  /** Set on ins/del when the character only doubles a neighbour. */
  gemination: boolean;
  /** Index in the candidate string this op lands on. */
  at: number;
}

/**
 * Weighted Damerau-Levenshtein (optimal string alignment) with a backtrace.
 *
 * The backtrace is the whole point of computing this by hand: the same
 * alignment that produces the score also tells us *which* edit was made, which
 * is what turns "88%" into "forename — letters transposed" on screen.
 */
function align(query: string, candidate: string): { cost: number; ops: Op[] } {
  const n = query.length;
  const m = candidate.length;

  const d: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) d[i][0] = d[i - 1][0] + delCost(query, i - 1);
  for (let j = 1; j <= m; j++) d[0][j] = d[0][j - 1] + insCost(candidate, j - 1);

  const transposable = (i: number, j: number) =>
    i > 1 && j > 1 && query[i - 1] === candidate[j - 2] && query[i - 2] === candidate[j - 1];

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const same = query[i - 1] === candidate[j - 1];
      let best = d[i - 1][j - 1] + (same ? 0 : subCost(query[i - 1], candidate[j - 1]));
      best = Math.min(best, d[i - 1][j] + delCost(query, i - 1));
      best = Math.min(best, d[i][j - 1] + insCost(candidate, j - 1));
      if (transposable(i, j)) best = Math.min(best, d[i - 2][j - 2] + TRANSPOSE_COST);
      d[i][j] = best;
    }
  }

  const ops: Op[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (transposable(i, j) && near(d[i][j], d[i - 2][j - 2] + TRANSPOSE_COST)) {
      ops.push({ kind: 'trans', gemination: false, at: j - 2 });
      i -= 2;
      j -= 2;
      continue;
    }
    if (i > 0 && j > 0) {
      const same = query[i - 1] === candidate[j - 1];
      const cost = same ? 0 : subCost(query[i - 1], candidate[j - 1]);
      if (near(d[i][j], d[i - 1][j - 1] + cost)) {
        ops.push({ kind: same ? 'equal' : 'sub', gemination: false, at: j - 1 });
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && near(d[i][j], d[i - 1][j] + delCost(query, i - 1))) {
      // A character present in the query and absent from the candidate. There is
      // no candidate position to highlight, so anchor on the nearest one.
      ops.push({ kind: 'del', gemination: doubles(query, i - 1), at: Math.max(0, j - 1) });
      i--;
      continue;
    }
    ops.push({ kind: 'ins', gemination: doubles(candidate, j - 1), at: j - 1 });
    j--;
  }

  return { cost: d[n][m], ops: ops.reverse() };
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Merge scattered character indices into contiguous ranges for highlighting. */
function toRanges(indices: number[], offset: number): [number, number][] {
  const ranges: [number, number][] = [];
  for (const index of [...new Set(indices)].sort((a, b) => a - b)) {
    const at = index + offset;
    const last = ranges[ranges.length - 1];
    if (last && at === last[1] + 1) last[1] = at;
    else ranges.push([at, at]);
  }
  return ranges;
}

/** Positions in the candidate that an alignment says differ from the query. */
function changedIndices(ops: Op[]): number[] {
  return ops.filter(op => op.kind !== 'equal' && op.kind !== 'del').flatMap(op =>
    op.kind === 'trans' ? [op.at, op.at + 1] : [op.at]
  );
}

function describe(op: Op, unit: 'letter' | 'digit'): string {
  switch (op.kind) {
    case 'trans':
      return `${unit}s transposed`;
    case 'sub':
      return `${unit} substituted`;
    case 'ins':
      return op.gemination ? `double ${unit}` : `extra ${unit}`;
    default:
      return op.gemination ? `double ${unit} typed once` : `${unit} missing`;
  }
}

/**
 * Turn an alignment into a phrase a caseworker would accept.
 *
 * Deliberately conservative: past two edits we stop claiming to know what
 * happened and say "spelling variant", because a specific-sounding explanation
 * that is wrong is worse than a vague one that is right.
 */
function reasonFor(ops: Op[], unit: 'letter' | 'digit', macVaries: boolean): string {
  const edits = ops.filter(op => op.kind !== 'equal');
  const macNote = macVaries ? 'Mac/Mc prefix variant' : '';

  if (edits.length === 0) return macNote || 'exact match';

  let label: string;
  if (edits.length === 1) {
    label = describe(edits[0], unit);
  } else if (edits.length === 2) {
    const [first, second] = edits.map(op => describe(op, unit));
    // One doubled letter added and another dropped is how "Morisson" reaches
    // "Morrison". Naming both halves separately reads as gibberish.
    if (edits.every(op => op.gemination)) label = `double ${unit}s differ`;
    else if (first === second) label = `two ${unit}s ${first.split(' ').slice(1).join(' ')}`;
    else label = `${first} and ${second}`;
  } else {
    label = unit === 'digit' ? `multiple ${unit}s differ` : 'spelling variant';
  }

  return macNote ? `${macNote} + ${label}` : label;
}

interface Token {
  text: string;
  start: number;
}

function tokenise(value: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /[a-z0-9]+/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value.toLowerCase())) !== null) {
    tokens.push({ text: match[0], start: match.index });
  }
  return tokens;
}

/** forename / surname / middle name, from a token's position in the full name. */
function namePart(index: number, total: number): string {
  if (total === 1) return 'name';
  if (index === 0) return 'forename';
  if (index === total - 1) return 'surname';
  return 'middle name';
}

function scoreName(query: string, candidate: string): Omit<SimilarityResult, 'field'> {
  const queryTokens = tokenise(query);
  const candidateTokens = tokenise(candidate);

  if (queryTokens.length === 0 || candidateTokens.length === 0) {
    return { similarity: 0, reason: 'no match', highlights: [] };
  }

  // Greedy one-to-one, iterating over the QUERY's tokens and consuming the
  // candidate's. Both halves matter: comparing whole strings scores "Morisson"
  // against "Alistair Morrison" at 45%, below unrelated names; and without
  // consuming, "John Smith" maps both of its tokens onto "Johnston" and inflates
  // to 68%.
  const taken = new Set<number>();
  const scores: number[] = [];
  const highlights: [number, number][] = [];
  const reasons: string[] = [];

  for (const queryToken of queryTokens) {
    let bestIndex = -1;
    let bestScore = -1;
    let bestOps: Op[] = [];
    let bestMacVaries = false;

    candidateTokens.forEach((candidateToken, index) => {
      if (taken.has(index)) return;
      const a = canonical(queryToken.text);
      const b = canonical(candidateToken.text);
      const { cost, ops } = align(a, b);
      const score = clamp01(1 - cost / Math.max(a.length, b.length));
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
        bestOps = ops;
        bestMacVaries = /^mac/.test(queryToken.text) !== /^mac/.test(candidateToken.text);
      }
    });

    if (bestIndex === -1) break;
    taken.add(bestIndex);
    scores.push(bestScore);

    if (bestScore < 1 || bestMacVaries) {
      const matched = candidateTokens[bestIndex];
      const unit = /^\d+$/.test(matched.text) ? 'digit' : 'letter';
      reasons.push(
        `${namePart(bestIndex, candidateTokens.length)} — ${reasonFor(bestOps, unit, bestMacVaries)}`
      );
      // Canonicalisation shifts every index after the prefix, so highlights are
      // only trustworthy when it did not fire on this token.
      if (canonical(matched.text) === matched.text) {
        highlights.push(...toRanges(changedIndices(bestOps), matched.start));
      }
    }
  }

  const similarity = round1((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 100);
  return {
    similarity,
    reason: reasons.length > 0 ? reasons.join('; ') : 'exact match',
    highlights,
  };
}

/**
 * Drop separators, remembering where each surviving character came from.
 *
 * Scoring works on the stripped form so "SC 12 98 37 A" and "SC129837A" compare
 * equal, but highlights have to land on the string the page renders — and a
 * reference like "IAAS-2026-00010" carries two dashes, so stripped index 12 is
 * original index 14.
 */
function strip(value: string): { text: string; positions: number[] } {
  const positions: number[] = [];
  let text = '';
  for (let i = 0; i < value.length; i++) {
    if (/[\s-]/.test(value[i])) continue;
    text += value[i].toLowerCase();
    positions.push(i);
  }
  return { text, positions };
}

function scoreCode(query: string, candidate: string, field: 'ni' | 'ref'): Omit<SimilarityResult, 'field'> {
  const a = strip(query).text;
  const { text: b, positions } = strip(candidate);
  const part = field === 'ni' ? 'NI number' : 'reference';

  if (!a || !b) return { similarity: 0, reason: 'no match', highlights: [] };

  // A partial identifier is a prefix search, not a typo — "00042" is not 60%
  // wrong about "IAAS-2026-00042".
  if (b.includes(a)) {
    const at = b.indexOf(a);
    return {
      similarity: 100,
      reason: `${part} — exact match`,
      // Marking the matched span only tells the reader something when the query
      // is the shorter string; on a full match it would highlight everything.
      highlights:
        a.length < b.length
          ? toRanges(Array.from({ length: a.length }, (_, k) => positions[at + k]), 0)
          : [],
    };
  }

  const { cost, ops } = align(a, b);
  const similarity = round1(clamp01(1 - cost / CODE_BUDGET) * 100);
  const unit = /\d/.test(a) ? 'digit' : 'letter';
  return {
    similarity,
    reason: `${part} — ${reasonFor(ops, unit, false)}`,
    highlights: toRanges(changedIndices(ops).map(i => positions[i]), 0),
  };
}

/**
 * Score one candidate record against a query.
 *
 * The field is chosen from the query's shape rather than by scoring all three
 * and taking the best — a name query should never be answered with "your name
 * is 40% like this reference number".
 */
export function scoreMatch(
  query: string,
  record: { name: string; ni: string; ref: string }
): SimilarityResult {
  const field = detectField(query);
  const scored =
    field === 'name'
      ? scoreName(query, record.name)
      : scoreCode(query, field === 'ni' ? record.ni : record.ref, field);
  return { ...scored, field };
}
