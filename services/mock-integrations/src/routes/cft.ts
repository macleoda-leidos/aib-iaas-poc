import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export const cftRouter = Router();

/**
 * CFT Mock - Creditor/Trustee/Provider Facing Information
 * Returns registered providers, trustees, and creditor information.
 *
 * REPLACEMENT NOTE: In production, this connects to CFT to validate providers,
 * retrieve trustee information, and support creditor-facing workflows.
 */

cftRouter.post('/lookup', (req: Request, res: Response) => {
  const requestId = uuid();

  // Always returns registered providers (CFT is a reference data service)
  res.json({
    requestId,
    system: 'CFT',
    status: 'success',
    data: {
      found: true,
      providers: [
        {
          id: 'PROV-001',
          name: 'Sample Insolvency Practitioners LLP',
          registrationNumber: 'IP-2019-0045',
          status: 'active',
          type: 'insolvency_practitioner',
          contactEmail: 'admin@sample-ip.example.com',
          contactPhone: '0131 555 0001',
          address: '10 Commerce Street, Edinburgh, EH1 2AA',
        },
        {
          id: 'PROV-002',
          name: 'Test Trustees & Co',
          registrationNumber: 'TR-2018-0123',
          status: 'active',
          type: 'trustee',
          contactEmail: 'info@test-trustees.example.com',
          contactPhone: '0141 555 0002',
          address: '25 Trust Lane, Glasgow, G2 1BB',
        },
        {
          id: 'PROV-003',
          name: 'Citizens Advice Scotland (Sample)',
          registrationNumber: 'MA-2015-0001',
          status: 'active',
          type: 'money_adviser',
          contactEmail: 'advice@cas-sample.example.com',
          contactPhone: '0800 555 0003',
          address: '1 Advice Square, Edinburgh, EH3 3CC',
        },
      ],
    },
    timestamp: new Date().toISOString(),
  });
});

cftRouter.get('/provider/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  res.json({
    requestId: uuid(),
    system: 'CFT',
    status: 'success',
    data: {
      id,
      name: 'Sample Insolvency Practitioners LLP',
      registrationNumber: 'IP-2019-0045',
      status: 'active',
      type: 'insolvency_practitioner',
      registeredSince: '2019-04-01',
      lastReviewDate: '2023-10-15',
      casesHandled: 156,
      contactDetails: {
        email: 'admin@sample-ip.example.com',
        phone: '0131 555 0001',
        address: '10 Commerce Street, Edinburgh, EH1 2AA',
      },
    },
    timestamp: new Date().toISOString(),
  });
});
