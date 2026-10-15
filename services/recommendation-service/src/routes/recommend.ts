import { Router, Request, Response } from 'express';
import { calculateRecommendation } from '../engine/rules';
import { getAiExplanation } from '../engine/ai-mock';
import { createRepositories } from '@aib-iaas/database';

export const recommendRouter = Router();

// A generated recommendation now persists one-to-one against its application via
// RecommendationRepository (previously the result was computed and thrown away, so
// a case view had to regenerate it on every load). The repo deletes any prior row
// for the application, so a regenerate overwrites rather than duplicating.
const { recommendations } = createRepositories();

// The rules engine yields a confidence BAND ('high'|'medium'|'low'); the
// recommendations table records a numeric confidence_pct. This is a coarse,
// documented stand-in — the band remains the source of truth, the percentage is
// only for display/ordering on the case view.
const CONFIDENCE_PCT: Record<string, number> = { high: 85, medium: 70, low: 55 };

interface RecommendationRequest {
  /** When supplied, the result is persisted against this application (one-to-one).
   *  The public /apply pre-submission call omits it, so that path stays stateless. */
  applicationId?: string;
  totalDebt: number;
  numberOfCreditors: number;
  monthlyIncome: number;
  monthlyExpenditure: number;
  employmentStatus: string;
  hasAssets: boolean;
  totalAssetValue: number;
  existingCases: Array<{ system: string; found: boolean; caseStatus?: string }>;
  hasMoratorium: boolean;
}

recommendRouter.post('/', (req: Request, res: Response) => {
  const input = req.body as RecommendationRequest;

  try {
    const recommendation = calculateRecommendation(input);

    // Persist the full engine output verbatim (factors/reasoning/alternatives) so
    // the case view reads back exactly what was generated instead of recomputing.
    let recommendationId: string | undefined;
    if (input.applicationId) {
      try {
        const stored = recommendations.create({
          applicationId: input.applicationId,
          product: recommendation.recommendedProduct,
          confidence: recommendation.confidence,
          confidencePct: CONFIDENCE_PCT[recommendation.confidence] ?? 70,
          reasoning: recommendation.reasoning,
          factors: recommendation.factors,
          alternatives: recommendation.alternativeProducts,
          engineVersion: 'rules-1.0',
        });
        recommendationId = stored.id;
      } catch {
        // A bad/unknown applicationId (e.g. FK miss) must not fail the advice
        // itself — the recommendation is still returned, just not linked to a case.
        recommendationId = undefined;
      }
    }

    res.json({ success: true, data: { ...recommendation, recommendationId } });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'RECOMMENDATION_FAILED', message: (error as Error).message },
    });
  }
});

recommendRouter.post('/explain', (req: Request, res: Response) => {
  const { product, factors } = req.body;

  const explanation = getAiExplanation(product, factors);
  res.json({ success: true, data: { explanation } });
});
