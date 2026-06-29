import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export const moratoriumRouter = Router();

/**
 * Moratorium Mock - Moratorium on Diligence Registration
 * Checks if a debtor has an active moratorium (6-week breathing space).
 *
 * REPLACEMENT NOTE: In production, this connects to AiB's moratorium register
 * to check for active moratoriums and support new registrations.
 */

interface MoratoriumCheckRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  postcode?: string;
  nationalInsuranceNumber?: string;
}

moratoriumRouter.post('/check', (req: Request, res: Response) => {
  const { postcode } = req.body as MoratoriumCheckRequest;
  const requestId = uuid();

  // Synthetic logic: postcode starting with 'EH' triggers active moratorium
  const hasActiveMoratorium = postcode?.toUpperCase().startsWith('EH');

  if (hasActiveMoratorium) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14); // Started 2 weeks ago
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 42); // 6-week duration

    res.json({
      requestId,
      system: 'Moratorium',
      status: 'success',
      data: {
        found: true,
        moratoriumReference: 'MOR-2024-003456',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'active',
        weeksRemaining: 4,
        registeredBy: 'Citizens Advice Scotland (Sample)',
        debtorPostcode: postcode,
      },
      timestamp: new Date().toISOString(),
    });
  } else {
    res.json({
      requestId,
      system: 'Moratorium',
      status: 'not_found',
      data: { found: false },
      timestamp: new Date().toISOString(),
    });
  }
});

moratoriumRouter.post('/register', (req: Request, res: Response) => {
  const requestId = uuid();

  // Placeholder registration - always succeeds
  res.status(201).json({
    requestId,
    system: 'Moratorium',
    status: 'success',
    data: {
      moratoriumReference: `MOR-2024-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'registered',
      message: 'PLACEHOLDER: Moratorium registered successfully. In production, this would trigger formal notification to creditors.',
    },
    timestamp: new Date().toISOString(),
  });
});
