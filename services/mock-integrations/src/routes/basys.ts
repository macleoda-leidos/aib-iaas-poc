import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export const basysRouter = Router();

/**
 * BASYS Mock - Bankruptcy Administration System
 * Simulates lookup of debtor records in the bankruptcy/sequestration system.
 *
 * REPLACEMENT NOTE: In production, this would be replaced by a secure API call
 * to the actual BASYS system, likely via an ESB or API gateway with mTLS.
 */

interface BasysLookupRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationalInsuranceNumber?: string;
}

basysRouter.post('/lookup', (req: Request, res: Response) => {
  const { firstName, lastName, nationalInsuranceNumber } = req.body as BasysLookupRequest;

  const requestId = uuid();

  // Synthetic matching logic:
  // - NI number ending in 'A' OR surname 'SMITH' triggers a found case
  const niEndsA = nationalInsuranceNumber?.endsWith('A');
  const isSmith = lastName?.toUpperCase() === 'SMITH';

  if (niEndsA || isSmith) {
    res.json({
      requestId,
      system: 'BASYS',
      status: 'success',
      data: {
        found: true,
        caseReference: 'SEQ-2019-004521',
        caseType: 'sequestration',
        debtorName: `${firstName || 'Unknown'} ${lastName || 'Unknown'}`,
        dateAwarded: '2019-08-14',
        dateOfDischarge: '2020-08-14',
        status: 'discharged',
        trustee: 'Sample Trustees Ltd',
        totalDebt: 34500,
        dividendPaid: 0.12,
      },
      timestamp: new Date().toISOString(),
    });
  } else {
    res.json({
      requestId,
      system: 'BASYS',
      status: 'not_found',
      data: { found: false },
      timestamp: new Date().toISOString(),
    });
  }
});

basysRouter.get('/case/:caseId', (req: Request, res: Response) => {
  const { caseId } = req.params;

  res.json({
    requestId: uuid(),
    system: 'BASYS',
    status: 'success',
    data: {
      caseReference: caseId,
      caseType: 'sequestration',
      debtorName: 'John Smith',
      dateOfBirth: '1975-06-20',
      dateAwarded: '2019-08-14',
      dateOfDischarge: '2020-08-14',
      status: 'discharged',
      trustee: 'Sample Trustees Ltd',
      totalDebt: 34500,
      creditors: [
        { name: 'Bank of Test', amount: 15000, dividendPaid: 1800 },
        { name: 'Credit Corp', amount: 12000, dividendPaid: 1440 },
        { name: 'Utility Co', amount: 7500, dividendPaid: 900 },
      ],
    },
    timestamp: new Date().toISOString(),
  });
});
