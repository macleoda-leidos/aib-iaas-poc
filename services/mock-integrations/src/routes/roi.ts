import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export const roiRouter = Router();

/**
 * RoI Mock - Register of Insolvencies
 * Searches the public Register of Insolvencies for existing entries.
 *
 * REPLACEMENT NOTE: In production, this connects to the Register of Insolvencies
 * which is a public-facing register of all insolvency cases in Scotland.
 */

interface RoiSearchRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  postcode?: string;
}

roiRouter.post('/search', (req: Request, res: Response) => {
  const { lastName } = req.body as RoiSearchRequest;
  const requestId = uuid();

  // Synthetic logic: name containing 'TEST' triggers a register entry
  const hasEntry = lastName?.toUpperCase().includes('TEST');

  if (hasEntry) {
    res.json({
      requestId,
      system: 'RoI',
      status: 'success',
      data: {
        found: true,
        entries: [
          {
            entryId: 'ROI-2018-012345',
            entryType: 'sequestration',
            debtorName: `${lastName}`,
            dateRegistered: '2018-11-20',
            dateOfDischarge: '2019-11-20',
            status: 'discharged',
            linkedCaseReference: 'SEQ-2018-004521',
            trustee: 'Sample Trustees & Co',
          },
        ],
      },
      timestamp: new Date().toISOString(),
    });
  } else {
    res.json({
      requestId,
      system: 'RoI',
      status: 'not_found',
      data: { found: false, entries: [] },
      timestamp: new Date().toISOString(),
    });
  }
});

roiRouter.get('/entry/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  res.json({
    requestId: uuid(),
    system: 'RoI',
    status: 'success',
    data: {
      entryId: id,
      entryType: 'sequestration',
      debtorName: 'Test Person',
      dateOfBirth: '1980-05-10',
      address: '1 Register Road, Edinburgh, EH1 1AA',
      dateRegistered: '2018-11-20',
      dateOfDischarge: '2019-11-20',
      status: 'discharged',
      linkedCaseReference: 'SEQ-2018-004521',
      trustee: 'Sample Trustees & Co',
      totalDebt: 28000,
      courtReference: 'SC-2018-0456',
    },
    timestamp: new Date().toISOString(),
  });
});
