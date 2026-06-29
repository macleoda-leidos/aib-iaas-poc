import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export const dasRouter = Router();

/**
 * DAS Mock - Debt Arrangement Scheme Programme Checks
 * Simulates checking for existing DAS applications or active programmes.
 *
 * REPLACEMENT NOTE: In production, this interfaces with the DAS system to check
 * for existing applications, active Debt Payment Programmes, and historic arrangements.
 */

interface DasLookupRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationalInsuranceNumber?: string;
  totalDebt?: number;
}

dasRouter.post('/lookup', (req: Request, res: Response) => {
  const { totalDebt } = req.body as DasLookupRequest;
  const requestId = uuid();

  // Synthetic logic: if total debt is between £5,000-£20,000, suggest existing application
  const hasExisting = totalDebt !== undefined && totalDebt >= 5000 && totalDebt <= 20000;

  if (hasExisting) {
    res.json({
      requestId,
      system: 'DAS',
      status: 'success',
      data: {
        found: true,
        programmeReference: 'DPP-2023-001234',
        programmeStatus: 'application_in_progress',
        applicationDate: '2023-11-20',
        approvedMoneyAdviser: 'Citizens Advice Scotland (Sample)',
        totalDebtDeclared: totalDebt,
        proposedPayment: Math.round((totalDebt || 0) / 48),
      },
      timestamp: new Date().toISOString(),
    });
  } else {
    res.json({
      requestId,
      system: 'DAS',
      status: 'not_found',
      data: { found: false },
      timestamp: new Date().toISOString(),
    });
  }
});

dasRouter.get('/programme/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  res.json({
    requestId: uuid(),
    system: 'DAS',
    status: 'success',
    data: {
      programmeReference: id,
      status: 'active',
      approvedDate: '2023-12-01',
      debtorName: 'Test Debtor',
      totalDebt: 12000,
      monthlyPayment: 250,
      paymentDistributor: 'Test Payment Distributor Ltd',
      creditorCount: 3,
      moneyAdviser: 'Citizens Advice Scotland (Sample)',
      reviewDate: '2024-12-01',
    },
    timestamp: new Date().toISOString(),
  });
});
