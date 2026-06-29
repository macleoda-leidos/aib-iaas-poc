import { Router, Request, Response } from 'express';
import { calculateRecommendation } from '../engine/rules';
import { getAiExplanation } from '../engine/ai-mock';

export const recommendRouter = Router();

interface RecommendationRequest {
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
    res.json({ success: true, data: recommendation });
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
