/**
 * Knowledge base for the AiB Digital Assistant.
 *
 * This is a deterministic keyword assistant, not a language model. It is kept
 * honest by two rules:
 *
 * 1. **No figure is retyped.** Every monetary limit and statutory period is read
 *    from `@aib-iaas/statutory`, and the provision travels with it as a citation
 *    shown to the user. The previous version hardcoded its numbers and drifted:
 *    it asserted a "no single debt over £17,000" MAP criterion that exists in no
 *    statute, a £150 sequestration fee that exists nowhere in this repo, and a
 *    four-year sequestration that contradicts the twelve-month discharge in
 *    `clocks.ts`. Sourcing the numbers is what stops that recurring.
 *
 * 2. **Where a figure is not held, say so.** Fees are set by regulation and are
 *    not modelled here, so the assistant declines rather than inventing one.
 *    `packages/statutory/src/thresholds.ts` sets the precedent: "Anything that
 *    could not be verified is absent rather than guessed."
 *
 * Matching is two-phase — product and topic are detected independently, then
 * combined. The old single-pass "first keyword wins" scan meant a product name
 * anywhere in the question shadowed the actual question: "Will DAS affect my
 * credit score?" matched `das` and returned the DAS overview, never the credit
 * answer. A ten-question probe got the wrong topic ten times out of ten.
 */

import {
  MAP,
  DAS,
  DCO,
  SEQUESTRATION_MIN_DEBT,
  PTD_OBJECTION,
  dischargeDeadlines,
  dischargeEffectiveFrom,
} from '@aib-iaas/statutory';

export type Product = 'das' | 'map' | 'ptd' | 'sequestration';

export type Topic =
  | 'cost'
  | 'duration'
  | 'credit'
  | 'documents'
  | 'eligibility'
  | 'property'
  | 'process'
  | 'engine';

export interface Answer {
  text: string;
  /** Provisions behind any figure quoted, surfaced under the answer. */
  citations: string[];
  /** Set when the assistant is declining to state something it cannot source. */
  unsourced?: boolean;
}

const money = (n: number) => '£' + n.toLocaleString('en-GB');

/**
 * Whole months between two dates, read from the same local calendar fields
 * `addMonths` writes to. Using UTC getters here would under-report by a month
 * whenever the target lands in BST: local midnight on 1 July is 23:00 UTC on
 * 30 June, so a UTC month index would say five months, not six.
 */
function monthsBetween(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  );
}

// Any fixed date works — the clocks are pure offsets — and a literal keeps this
// module free of the `Date.now()` non-determinism that would make tests flaky.
// Mid-month so `addMonths` never has to clamp a short month.
const REF = new Date(2026, 0, 15);
const MAP_DISCHARGE = dischargeDeadlines(REF, 'map')[0];
const SEQ_DISCHARGE = dischargeDeadlines(REF, 'sequestration')[0];
const MAP_DISCHARGE_MONTHS = monthsBetween(MAP_DISCHARGE.from, MAP_DISCHARGE.due);
const SEQ_DISCHARGE_MONTHS = monthsBetween(SEQ_DISCHARGE.from, SEQ_DISCHARGE.due);

const DISCHARGE_EFFECT = dischargeEffectiveFrom(REF);
const DISCHARGE_EFFECT_DAYS = Math.round(
  (DISCHARGE_EFFECT.due.getTime() - DISCHARGE_EFFECT.from.getTime()) / 86_400_000
);

const cite = (...sources: Array<{ citation: string }>) => sources.map((s) => s.citation);

/**
 * Word-boundary patterns. The abbreviations must not match inside longer words —
 * an unanchored `map` matched "roadmap" and an unanchored `das` was the single
 * biggest cause of misrouting in the previous implementation.
 */
const PRODUCT_PATTERNS: Array<[Product, RegExp]> = [
  ['das', /\b(das|debt arrangement(\s+scheme)?|dpp|debt payment programme)\b/],
  ['map', /\b(map|minimal asset(\s+process)?)\b/],
  ['ptd', /\b(ptd|trust deed|protected trust deed)\b/],
  ['sequestration', /\b(sequestration|bankrupt(cy)?)\b/],
];

/**
 * Topic patterns. Ordered only for determinism when a question genuinely spans
 * two topics; scoring below prefers the longest match rather than the first.
 */
const TOPIC_PATTERNS: Array<[Topic, RegExp]> = [
  ['cost', /\b(cost|costs|fee|fees|how much|price|pay for|charge)\b/],
  ['duration', /\b(how long|duration|last|lasts|years|months|discharge)\b/],
  ['credit', /\b(credit score|credit rating|credit file|credit report|credit)\b/],
  ['documents', /\b(document|documents|paperwork|evidence|upload|what do i need)\b/],
  ['eligibility', /\b(eligib\w*|qualify|qualifies|criteria|can i get|entitled)\b/],
  ['property', /\b(house|home|property|mortgage|my flat)\b/],
  ['process', /\b(apply|application|process|what happens|next steps|after)\b/],
  ['engine', /\b(recommendation engine|algorithm|how does it decide|rules engine)\b/],
];

function longestMatch(input: string, patterns: Array<[string, RegExp]>): string | null {
  let best: string | null = null;
  let bestLen = 0;
  for (const [key, re] of patterns) {
    const m = input.match(re);
    if (m && m[0].length > bestLen) {
      best = key;
      bestLen = m[0].length;
    }
  }
  return best;
}

export function detectProduct(input: string): Product | null {
  return longestMatch(input.toLowerCase(), PRODUCT_PATTERNS) as Product | null;
}

export function detectTopic(input: string): Topic | null {
  return longestMatch(input.toLowerCase(), TOPIC_PATTERNS) as Topic | null;
}

/** Fees are set by regulation and are not modelled in this service. */
const FEES_NOT_HELD: Answer = {
  text:
    'This service does not hold the application fees, so I will not quote one — fees are set by regulation and change. AiB publishes the current fees, and a money adviser can confirm what applies to you. There is no charge for this initial assessment or for the recommendation it produces.',
  citations: [],
  unsourced: true,
};

const PRODUCT_OVERVIEW: Record<Product, Answer> = {
  das: {
    text: `The Debt Arrangement Scheme (DAS) is a statutory debt management scheme. You repay your debts in full over an extended period through a Debt Payment Programme, with interest and charges frozen and creditors unable to take enforcement action while the programme runs. You keep your assets. A programme can cover as few as ${DAS.minDebts.value} debt, and the regulations set no minimum amount of debt.`,
    citations: cite(DAS.minDebts),
  },
  map: {
    text: `The Minimal Asset Process (MAP) is a simplified route into bankruptcy for people with low income and few assets. To qualify your debts must not exceed ${money(MAP.maxDebt.value)}, your total assets must be under ${money(MAP.maxTotalAssets.value)} with no single asset worth more than ${money(MAP.maxSingleAsset.value)}, and you must not own land or property. There is currently no minimum debt — the figure that used to apply was removed and nothing has been prescribed since. Discharge is automatic after ${MAP_DISCHARGE_MONTHS} months.`,
    citations: cite(
      MAP.maxDebt,
      MAP.maxTotalAssets,
      MAP.maxSingleAsset,
      MAP.mustNotOwnLand,
      MAP.minDebt,
      MAP_DISCHARGE
    ),
  },
  ptd: {
    text: `A Protected Trust Deed (PTD) is a formal agreement with your creditors, managed by a licensed insolvency practitioner acting as trustee, under which you make regular contributions and the remaining debt is written off at the end. It becomes "protected" — binding on creditors who did not agree — unless enough of them object: protection is defeated if a majority in number object, or if creditors representing no fewer than one third in value do. Either alone is enough, so both are assessed.`,
    citations: cite(PTD_OBJECTION.majorityInNumber, PTD_OBJECTION.fractionInValue),
  },
  sequestration: {
    text: `Sequestration is the Scottish legal term for bankruptcy. A trustee takes control of your estate, and assets including your home may be sold to pay creditors. For a debtor application your debts must be at least ${money(SEQUESTRATION_MIN_DEBT.value)}. Discharge normally becomes available ${SEQ_DISCHARGE_MONTHS} months after the award. Contributions from income are typically set for ${DCO.defaultPeriodMonths.value} months, though that is a default rather than a cap and can be shorter or longer.`,
    citations: cite(SEQUESTRATION_MIN_DEBT, SEQ_DISCHARGE, DCO.defaultPeriodMonths),
  },
};

const DURATION: Record<Product, Answer> = {
  map: {
    text: `MAP discharge is automatic ${MAP_DISCHARGE_MONTHS} months after the award — no decision is required and there is no further waiting period.`,
    citations: cite(MAP_DISCHARGE),
  },
  sequestration: {
    text: `In a full sequestration, discharge becomes available ${SEQ_DISCHARGE_MONTHS} months after the award, and then takes effect ${DISCHARGE_EFFECT_DAYS} days after the decision is notified. That is separate from your contributions, which are typically set for ${DCO.defaultPeriodMonths.value} months by default.`,
    citations: cite(SEQ_DISCHARGE, DISCHARGE_EFFECT, DCO.defaultPeriodMonths),
  },
  ptd: {
    text: `This service does not hold a statutory term for a Protected Trust Deed, so I will not quote one — the contribution period is set in the trust deed itself and agreed with the trustee. What is fixed in law is the creditor objection window and the thresholds that defeat protection. A money adviser can tell you the term being proposed in your case.`,
    citations: cite(PTD_OBJECTION.majorityInNumber, PTD_OBJECTION.fractionInValue),
    unsourced: true,
  },
  das: {
    text: 'This service does not hold a standard length for a Debt Payment Programme, so I will not quote one. A DAS programme runs until the debts are repaid in full, so its length follows from what you can afford each month rather than from a fixed term. A money adviser will calculate it with you.',
    citations: [],
    unsourced: true,
  },
};

const ELIGIBILITY: Record<Product, Answer> = {
  map: PRODUCT_OVERVIEW.map,
  sequestration: {
    text: `For a debtor application for sequestration your debts must be at least ${money(SEQUESTRATION_MIN_DEBT.value)}. Other conditions apply, including that you have not been sequestrated too recently, and your income and assets are assessed to set any contribution.`,
    citations: cite(SEQUESTRATION_MIN_DEBT),
  },
  das: {
    text: `DAS has no minimum debt and can cover as few as ${DAS.minDebts.value} debt. What matters is that you have some surplus income after reasonable living costs, because a Debt Payment Programme repays the debt in full over time.`,
    citations: cite(DAS.minDebts),
  },
  ptd: {
    text: 'This service does not hold a statutory minimum debt for a Protected Trust Deed, so I will not quote one. Eligibility turns on whether you can make regular contributions that creditors will accept, which a licensed insolvency practitioner assesses. Our assessment will tell you whether a PTD looks viable alongside the alternatives.',
    citations: [],
    unsourced: true,
  },
};

const PROPERTY: Record<Product, Answer> = {
  das: {
    text: 'Under DAS you keep your assets, including your home. The programme repays the debt from income, so there is no realisation of property.',
    citations: [],
  },
  map: {
    text: `MAP is only open to people who do not own land or property, so it does not arise — if you own your home, MAP is not available and another route would be considered. A vehicle you reasonably need is disregarded as an asset where it is worth less than ${money(MAP.vehicleDisregard.value)}; note that is a disregard, not a separate eligibility ceiling.`,
    citations: cite(MAP.mustNotOwnLand, MAP.vehicleDisregard),
  },
  ptd: {
    text: 'In a Protected Trust Deed your property equity forms part of what creditors expect to receive, so it must be addressed — often by a third party contributing its value so the property need not be sold. Whether you can remain depends on how much equity there is and what the trustee and creditors accept.',
    citations: [],
  },
  sequestration: {
    text: 'In sequestration the trustee takes control of your estate and your home may be sold to pay creditors. If keeping your home is the priority, DAS keeps your assets intact and a trust deed may allow equity to be bought out instead.',
    citations: [],
  },
};

const TOPIC_GENERIC: Record<Topic, Answer> = {
  cost: FEES_NOT_HELD,
  duration: {
    text: `Timescales differ by solution. MAP discharges automatically after ${MAP_DISCHARGE_MONTHS} months. In a full sequestration, discharge becomes available after ${SEQ_DISCHARGE_MONTHS} months, and contributions are typically set for ${DCO.defaultPeriodMonths.value} months by default. DAS and trust deed terms depend on what you can afford rather than on a fixed statutory period. Ask about a specific solution and I will give you the provision.`,
    citations: cite(MAP_DISCHARGE, SEQ_DISCHARGE, DCO.defaultPeriodMonths),
  },
  credit: {
    text: 'Formal debt solutions are recorded on your credit file for six years from the start date, and obtaining new credit is likely to be restricted while one is running. Trust deeds and sequestrations also appear on the public Register of Insolvencies. Your credit position improves gradually after discharge or completion.',
    citations: [],
  },
  documents: {
    // Deliberately silent on virus scanning. The old copy promised uploads were
    // "virus-scanned automatically"; `/scan` exists but no caller invokes it
    // (GAP-004), so the promise was false. Restore the sentence when it is true.
    text: 'You will normally need proof of identity, proof of address, evidence of your income such as payslips or benefit letters, and evidence of what you owe such as creditor statements. Uploads accept PDF, JPG, PNG and common Word and Excel formats, up to 10MB per file by default.',
    citations: [],
  },
  eligibility: {
    text: `Eligibility depends on your debts, your income and outgoings, and what you own. In outline: MAP requires debts no higher than ${money(MAP.maxDebt.value)} with total assets under ${money(MAP.maxTotalAssets.value)} and no property; sequestration requires debts of at least ${money(SEQUESTRATION_MIN_DEBT.value)}; DAS has no minimum debt but needs surplus income. Completing an assessment evaluates all of these against your circumstances.`,
    citations: cite(MAP.maxDebt, MAP.maxTotalAssets, MAP.mustNotOwnLand, SEQUESTRATION_MIN_DEBT, DAS.minDebts),
  },
  property: {
    text: 'What happens to your home depends on the solution. DAS leaves your assets untouched. A trust deed must address your equity, often through a third-party contribution instead of a sale. In sequestration your home may be sold. MAP is only available if you do not own property.',
    citations: cite(MAP.mustNotOwnLand),
  },
  process: {
    text: 'After you submit an application, checks run across six AiB systems — BASYS, eDEN, the DAS Register, CFT, the Moratorium register and the Register of Insolvencies. A credit check runs with your consent. The recommendation engine then assesses your circumstances and produces a recommendation with a confidence rating, which a case officer reviews before it is issued. Typical processing is three to ten working days depending on the solution.',
    citations: [],
  },
  engine: {
    text: 'The recommendation engine is rules-based rather than a machine-learning model, so every outcome can be traced to the criteria that produced it. It evaluates your debts, income, outgoings and assets against the statutory criteria for each available option and returns a primary recommendation with a confidence rating of high, medium or low, the factors behind it, and the alternatives considered. A case officer reviews it before you receive it.',
    citations: [],
  },
};

/** Topics whose answer is meaningfully product-specific. */
const PRODUCT_SPECIFIC: Partial<Record<Topic, Record<Product, Answer>>> = {
  duration: DURATION,
  eligibility: ELIGIBILITY,
  property: PROPERTY,
};

export const FALLBACK: Answer = {
  text: 'I can help with the Debt Arrangement Scheme, the Minimal Asset Process, Protected Trust Deeds and sequestration — including who qualifies, how long each lasts, what it means for your home and your credit file, and what happens after you apply. If your question is about your own circumstances, I can arrange for a money adviser to contact you instead.',
  citations: [],
};

/**
 * Resolve a question to an answer. Topic wins over product, because the product
 * is usually context ("how much does a trust deed cost") rather than the ask.
 */
export function answer(input: string): Answer {
  const product = detectProduct(input);
  const topic = detectTopic(input);

  if (topic) {
    const specific = PRODUCT_SPECIFIC[topic];
    if (product && specific) return specific[product];
    return TOPIC_GENERIC[topic];
  }
  if (product) return PRODUCT_OVERVIEW[product];
  return FALLBACK;
}

/** Exposed for the offer-a-human path and for tests. */
export const SUGGESTED_QUESTIONS = [
  'What is the Debt Arrangement Scheme?',
  'Am I eligible for MAP?',
  'How long does sequestration last?',
  'What documents do I need?',
];

export const PRODUCT_OVERVIEWS_FOR_TEST = PRODUCT_OVERVIEW;
export const TOPIC_GENERIC_FOR_TEST = TOPIC_GENERIC;
export const PRODUCT_SPECIFIC_FOR_TEST = PRODUCT_SPECIFIC;
