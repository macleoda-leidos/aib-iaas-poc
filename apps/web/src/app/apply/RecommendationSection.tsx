'use client';

import Link from 'next/link';
import { useState } from 'react';
import { recommendations, Recommendation } from '../../lib/apiClient';
import { withOneRetry, PRODUCT_LABELS } from './fields';

/**
 * The recommendation step of the citizen journey.
 *
 * In its own module rather than inside `page.tsx` because Next.js App Router permits only
 * `default`, `metadata` and a fixed set of route config keys as exports from a route file —
 * so a component defined there cannot be imported by a test, and this one carries the
 * highest-consequence behaviour on the page.
 *
 * **A statutory recommendation is never synthesised on the client.** (GAP-023)
 *
 * There were three fabrication sites in this component, all rendering as though they were
 * engine output:
 *
 *  1. The `catch` returned a complete response — `product: 'debt_arrangement_scheme'`,
 *     `confidence: 'high'`, hard-coded reasoning prose, and three factor weights (0.3, 0.25,
 *     0.15) that no engine ever produced — and set `received: true`, so the journey advanced.
 *     `console.warn` was the only trace.
 *  2. The result heading read
 *     `{result ? PRODUCT_LABELS[result.product] : 'Debt Arrangement Scheme (DAS)'}`, so a
 *     null result still displayed a product.
 *  3. The confidence line read `{result?.confidence || 'High'}`, so an absent confidence
 *     displayed as high.
 *
 * All three chose DAS, which is not a neutral default: it is a repayment programme, so the
 * fabricated answer specifically told people who cannot afford to repay that they should. An
 * applicant whose figures point to MAP, to sequestration or to signposting was told DAS was
 * their best route, with high confidence, by a system presenting that as a rules-engine
 * output.
 *
 * The honest failure state costs one retry and a visible error. `withOneRetry` is why that is
 * acceptable: Render's free plan spins the API down after 15 minutes, so the first request
 * after idle legitimately fails, and that cold start is what the fabrication was really
 * papering over.
 */
export function RecommendationSection({ formData, updateField }: { formData: any; updateField: any }) {
  const rec = formData.recommendation || {};
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Recommendation | null>(null);
  /** Set when the engine could not be reached. Rendered as an error, never as a product. */
  const [failed, setFailed] = useState(false);

  const getRecommendation = async () => {
    setLoading(true);
    setFailed(false);

    // Simulate processing delay for demo effect (2-3 seconds)
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));

    const income = formData.income || {};
    const expenditure = formData.expenditure || {};
    const debts = formData.debts?.items || [];
    const assets = formData.assets || {};
    const personal = formData.personal || {};

    const totalIncome = Object.values(income).reduce((s: number, v: any) => s + (parseFloat(v) || 0), 0);
    const totalExpenditure = Object.values(expenditure).reduce((s: number, v: any) => s + (parseFloat(v) || 0), 0);
    const totalDebt = debts.reduce((s: number, d: any) => s + (parseFloat(d.outstandingAmount) || 0), 0);

    const engineInput = {
      totalDebt,
      creditorsCount: debts.length,
      monthlyIncome: totalIncome,
      monthlyExpenditure: totalExpenditure,
      disposableIncome: totalIncome - totalExpenditure,
      employmentStatus: personal.employmentStatus || 'employed',
      hasAssets: !assets.noAssets && (assets.properties?.length > 0 || assets.vehicles?.length > 0),
      existingCases: formData.checks?.results?.some((r: any) => r.status === 'found') || false,
      hasMoratorium: false,
    };

    try {
      const response = await withOneRetry(() => recommendations.get(engineInput));

      setResult(response.data);
      setFailed(false);
      updateField('recommendation', 'received', true);
      updateField('recommendationResult', 'product', response.data.product);
      updateField('recommendationResult', 'confidence', response.data.confidence);
      updateField('recommendationResult', 'reasoning', response.data.reasoning);
    } catch (err) {
      console.warn('Recommendation unavailable', err);
      setResult(null);
      setFailed(true);
      // Left false: the step must not count as complete on a non-answer, or the journey
      // advances past the recommendation without one. Nothing is written to
      // `recommendationResult` either — the fabrication wrote nothing there, so the *stored*
      // application and the *displayed* recommendation disagreed, and a caseworker reviewing
      // the case saw no product while the applicant had been shown one.
      updateField('recommendation', 'received', false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!rec.received ? (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400">Based on your information, our rules engine will recommend the most suitable debt solution.</p>
          <button data-demo="recommend-button" onClick={getRecommendation} disabled={loading} className="bg-green-700 text-white font-bold py-3 px-6 hover:bg-green-800 disabled:opacity-50">
            {loading ? '⏳ Analysing...' : failed ? 'Try again' : 'Get my recommendation'}
          </button>

          {/* The honest failure state. Names no product on purpose: there is nothing to name. */}
          {failed && !loading && (
            <div
              data-demo="recommendation-unavailable"
              role="alert"
              className="mt-4 p-4 border-l-4 border-red-700 bg-red-50 dark:bg-red-950"
            >
              <h3 className="font-bold text-sm mb-1">We could not work out your recommendation</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                The advice service did not respond, so we have not produced a recommendation. Nothing
                you have entered has been lost — select the button above to retry.
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                We will not guess at a debt solution. If this keeps happening, a money adviser can go
                through your options with you — see{' '}
                <Link href="/support" className="underline">getting help</Link>.
              </p>
            </div>
          )}

          {loading && (
            <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="animate-spin w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full"></div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm mb-1">Analysing your financial profile...</p>
                  <p className="text-xs text-gray-500">Evaluating debt level, disposable income, credit history, and assets against eligibility criteria for all Scottish debt solutions</p>
                </div>
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-green-600 h-1.5 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* `result &&`, not a ternary with a hard-coded product.
              This read `{result ? PRODUCT_LABELS[result.product] : 'Debt Arrangement Scheme (DAS)'}`
              and `{result?.confidence || 'High'}` — so a null result rendered DAS at high
              confidence anyway. `received` is only ever set true alongside a real result now,
              so this branch cannot be reached without one; the guard is here because the
              previous version's defaults were exactly the kind of "harmless" fallback that
              turns into displayed advice. */}
          {result && (
            <div data-demo="recommendation-result" className="bg-green-700 text-white p-6 rounded text-center animate-[fadeIn_0.5s_ease-in]">
              <h3 className="text-xl font-bold text-white">Recommended: {PRODUCT_LABELS[result.product] || result.product}</h3>
              <p className="text-green-100 mt-1">Confidence: {result.confidence}</p>
            </div>
          )}

          {result?.reasoning && (
            <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-600 p-4">
              <h4 className="font-bold mb-2">Why we recommend this</h4>
              <p className="text-sm">{result.reasoning}</p>
            </div>
          )}

          {result?.factors && result.factors.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
              <h4 className="font-bold text-sm mb-2">Decision Factors</h4>
              <div className="space-y-2">
                {result.factors.map((f, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span>{f.factor}</span>
                    <span className="font-mono text-gray-600 dark:text-gray-400">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border border-gray-300 dark:border-gray-700 p-4 rounded">
            <p className="text-sm italic text-gray-600 dark:text-gray-400">This is an automated recommendation for information only. Speak with a money adviser before making decisions.</p>
          </div>
        </>
      )}
    </div>
  );
}
