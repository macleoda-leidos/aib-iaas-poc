import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export const edenDashRouter = Router();

/**
 * eDEN/DASH Mock - Debt Arrangement Scheme Electronic System
 * Simulates lookup of DAS-related debt arrangements.
 *
 * REPLACEMENT NOTE: In production, this connects to the eDEN system which manages
 * DAS applications and the DASH portal for payment distribution.
 */

interface EdenLookupRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationalInsuranceNumber?: string;
}

edenDashRouter.post('/lookup', (req: Request, res: Response) => {
  const { lastName } = req.body as EdenLookupRequest;
  const requestId = uuid();

  // Synthetic logic: surname starting with 'M' triggers an active arrangement
  const startsWithM = lastName?.toUpperCase().startsWith('M');

  if (startsWithM) {
    res.json({
      requestId,
      system: 'eDEN',
      status: 'success',
      data: {
        found: true,
        arrangementReference: 'DAS-ARR-2022-007834',
        status: 'active',
        approvedDate: '2022-03-15',
        totalDebt: 18500,
        monthlyPayment: 285,
        paymentDistributor: 'Sample Payment Services Ltd',
        creditorCount: 4,
        completionDate: '2027-03-15',
        paymentsRemaining: 36,
      },
      timestamp: new Date().toISOString(),
    });
  } else {
    res.json({
      requestId,
      system: 'eDEN',
      status: 'not_found',
      data: { found: false },
      timestamp: new Date().toISOString(),
    });
  }
});

edenDashRouter.get('/arrangement/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  res.json({
    requestId: uuid(),
    system: 'eDEN',
    status: 'success',
    data: {
      arrangementReference: id,
      status: 'active',
      approvedDate: '2022-03-15',
      debtorName: 'Mary Morrison',
      totalDebt: 18500,
      totalPaid: 5700,
      monthlyPayment: 285,
      paymentDistributor: 'Sample Payment Services Ltd',
      creditors: [
        { name: 'Bank A', originalDebt: 8000, outstanding: 6200 },
        { name: 'Card Co B', originalDebt: 5500, outstanding: 4300 },
        { name: 'Loans Ltd', originalDebt: 3000, outstanding: 2100 },
        { name: 'Council', originalDebt: 2000, outstanding: 1600 },
      ],
      nextPaymentDate: '2024-04-01',
      completionDate: '2027-03-15',
    },
    timestamp: new Date().toISOString(),
  });
});
