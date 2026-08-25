import { describe, it, expect } from 'vitest';
import {
  MAP,
  DAS,
  DCO,
  SEQUESTRATION_MIN_DEBT,
  dischargeDeadlines,
  dischargeEffectiveFrom,
} from '@aib-iaas/statutory';
import {
  answer,
  detectProduct,
  detectTopic,
  FALLBACK,
  SUGGESTED_QUESTIONS,
  PRODUCT_OVERVIEWS_FOR_TEST,
  TOPIC_GENERIC_FOR_TEST,
  PRODUCT_SPECIFIC_FOR_TEST,
  type Answer,
  type Product,
  type Topic,
} from '../chatbotKnowledge';

/** Every answer the assistant can return, from all three tables. */
function allAnswers(): Answer[] {
  return [
    ...Object.values(PRODUCT_OVERVIEWS_FOR_TEST),
    ...Object.values(TOPIC_GENERIC_FOR_TEST),
    ...Object.values(PRODUCT_SPECIFIC_FOR_TEST).flatMap((byProduct) =>
      Object.values(byProduct)
    ),
    FALLBACK,
  ];
}

describe('chatbot intent routing', () => {
  /**
   * The regression this file exists for. Under the previous first-match-wins
   * scan every one of these ten returned a product overview instead of the
   * topic asked about, because a product keyword matched by substring anywhere
   * in the question won outright.
   */
  const PROBE: Array<{
    question: string;
    product: Product | null;
    topic: Topic | null;
  }> = [
    { question: 'Will DAS affect my credit score?', product: 'das', topic: 'credit' },
    { question: 'How long does sequestration last?', product: 'sequestration', topic: 'duration' },
    { question: 'How much does a trust deed cost?', product: 'ptd', topic: 'cost' },
    { question: 'What documents do I need for bankruptcy?', product: 'sequestration', topic: 'documents' },
    { question: 'Am I eligible for MAP?', product: 'map', topic: 'eligibility' },
    { question: 'Will I lose my house in sequestration?', product: 'sequestration', topic: 'property' },
    { question: 'What happens after I apply?', product: null, topic: 'process' },
    { question: 'How does the recommendation engine decide?', product: null, topic: 'engine' },
    { question: 'Can I keep my home under DAS?', product: 'das', topic: 'property' },
    { question: 'What is the Debt Arrangement Scheme?', product: 'das', topic: null },
  ];

  it.each(PROBE)('routes "$question" to $product/$topic', ({ question, product, topic }) => {
    expect(detectProduct(question)).toBe(product);
    expect(detectTopic(question)).toBe(topic);
  });

  it('answers the topic, not the product, when a question names both', () => {
    // The exact shadowing case: a DAS question about credit must not return the
    // DAS overview.
    expect(answer('Will DAS affect my credit score?').text).toBe(
      TOPIC_GENERIC_FOR_TEST.credit.text
    );
    expect(answer('Will DAS affect my credit score?').text).not.toBe(
      PRODUCT_OVERVIEWS_FOR_TEST.das.text
    );
  });

  it('scopes a product-specific topic to the product named', () => {
    expect(answer('How long does sequestration last?').text).toBe(
      PRODUCT_SPECIFIC_FOR_TEST.duration!.sequestration.text
    );
    expect(answer('How long does MAP last?').text).toBe(
      PRODUCT_SPECIFIC_FOR_TEST.duration!.map.text
    );
  });

  it('falls back to the product overview when no topic is asked', () => {
    expect(answer('Tell me about a protected trust deed').text).toBe(
      PRODUCT_OVERVIEWS_FOR_TEST.ptd.text
    );
  });

  it('falls back when neither product nor topic matches', () => {
    expect(answer('what is the capital of France').text).toBe(FALLBACK.text);
    expect(answer('').text).toBe(FALLBACK.text);
  });

  it('does not match a product abbreviation inside a longer word', () => {
    // 'map' inside 'roadmap' and 'das' inside 'dashboard' both matched before
    // the patterns were word-anchored.
    expect(detectProduct('where is the product roadmap')).toBeNull();
    expect(detectProduct('open the dashboard')).toBeNull();
  });

  it('answers every suggested question with something other than the fallback', () => {
    for (const question of SUGGESTED_QUESTIONS) {
      expect(answer(question).text, question).not.toBe(FALLBACK.text);
    }
  });
});

describe('statutory traceability', () => {
  const REF = new Date(2026, 0, 15);

  /** Every monetary figure the statutory package holds, in pounds. */
  const ALLOWED_MONEY = new Set<number>([
    MAP.maxDebt.value,
    MAP.maxTotalAssets.value,
    MAP.maxSingleAsset.value,
    MAP.vehicleDisregard.value,
    SEQUESTRATION_MIN_DEBT.value,
  ]);

  /**
   * Every month count the statutory package holds, derived from the clocks
   * rather than written out, so this guard cannot drift the way the copy did.
   */
  const monthsOf = (from: Date, to: Date) =>
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  const mapDischarge = dischargeDeadlines(REF, 'map')[0];
  const seqDischarge = dischargeDeadlines(REF, 'sequestration')[0];
  const ALLOWED_MONTHS = new Set<number>([
    monthsOf(mapDischarge.from, mapDischarge.due),
    monthsOf(seqDischarge.from, seqDischarge.due),
    DCO.defaultPeriodMonths.value,
  ]);

  const effect = dischargeEffectiveFrom(REF);
  const ALLOWED_DAYS = new Set<number>([
    Math.round((effect.due.getTime() - effect.from.getTime()) / 86_400_000),
  ]);

  /**
   * The guard that matters. A future edit that types "£17,000" or "4 years"
   * back into an answer fails here, which is exactly how the previous version
   * came to assert a MAP single-debt ceiling that exists in no statute.
   */
  it('quotes no monetary figure absent from the statutory package', () => {
    for (const a of allAnswers()) {
      const figures = a.text.match(/£[\d,]+(?:\.\d+)?/g) ?? [];
      for (const figure of figures) {
        const pounds = Number(figure.replace(/[£,]/g, ''));
        expect(
          ALLOWED_MONEY.has(pounds),
          `${figure} in "${a.text.slice(0, 60)}..." is not a statutory threshold`
        ).toBe(true);
      }
    }
  });

  it('quotes no statutory period absent from the clocks', () => {
    for (const a of allAnswers()) {
      for (const [, n] of a.text.matchAll(/(\d+) months\b/g)) {
        expect(ALLOWED_MONTHS.has(Number(n)), `"${n} months" is not a clock period`).toBe(
          true
        );
      }
      for (const [, n] of a.text.matchAll(/(\d+) days\b/g)) {
        expect(ALLOWED_DAYS.has(Number(n)), `"${n} days" is not a clock period`).toBe(true);
      }
    }
  });

  it('cites a provision alongside every answer that quotes a figure', () => {
    for (const a of allAnswers()) {
      if (/£[\d,]+|\d+ (months|days)\b/.test(a.text)) {
        expect(a.citations.length, `uncited figure in "${a.text.slice(0, 60)}..."`)
          .toBeGreaterThan(0);
      }
    }
  });

  it('cites only provisions that come from the statutory package', () => {
    // Guards against a citation being typed in as prose. Every citation in the
    // package names an Act or an instrument and a provision.
    for (const a of allAnswers()) {
      for (const citation of a.citations) {
        expect(citation, `suspicious citation: ${citation}`).toMatch(
          /(Act 2016|Regulations \d{4})/
        );
      }
    }
  });

  it('declines rather than guessing where a figure is not held', () => {
    // Fees are set by regulation and are not modelled, so the cost answer must
    // state no amount at all.
    const cost = TOPIC_GENERIC_FOR_TEST.cost;
    expect(cost.unsourced).toBe(true);
    expect(cost.text).not.toMatch(/£/);
  });

  it('carries no retired or invented figure that the old copy asserted', () => {
    const everything = allAnswers()
      .map((a) => a.text)
      .join(' ');
    // £1,500 was the MAP debt floor removed by SSI 2023/9; £17,000, £150 and
    // the 4-year sequestration were never in any statute.
    expect(everything).not.toMatch(/£1,500/);
    expect(everything).not.toMatch(/£17,000/);
    expect(everything).not.toMatch(/£150\b/);
    expect(everything).not.toMatch(/4 years/);
    expect(everything).not.toMatch(/4-7 years/);
    // The engine has no credit-history input, so no answer may claim it uses one.
    expect(everything).not.toMatch(/credit history/);
  });

  it('states the MAP vehicle figure as a disregard, not an eligibility ceiling', () => {
    const text = PRODUCT_SPECIFIC_FOR_TEST.property!.map.text;
    expect(text).toMatch(/disregard/);
    expect(text).toMatch(/reasonably need/);
  });

  it('includes the MAP single-asset criterion the old copy omitted', () => {
    expect(PRODUCT_OVERVIEWS_FOR_TEST.map.text).toContain('£1,000');
    expect(PRODUCT_OVERVIEWS_FOR_TEST.map.citations).toContain(MAP.maxSingleAsset.citation);
  });

  it('states that DAS has no minimum debt', () => {
    expect(PRODUCT_OVERVIEWS_FOR_TEST.das.text).toMatch(/no minimum amount of debt/);
    expect(PRODUCT_OVERVIEWS_FOR_TEST.das.citations).toContain(DAS.minDebts.citation);
  });
});
