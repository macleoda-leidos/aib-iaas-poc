import { Router, Request, Response } from 'express';

export const postcodeRouter = Router();

/**
 * Placeholder Postcode Lookup
 * Returns synthetic addresses for any valid UK postcode format.
 *
 * REPLACEMENT NOTE: In production, this would connect to the Royal Mail PAF
 * or a service like Ordnance Survey / Ideal Postcodes / getAddress.io
 */

const syntheticAddresses: Record<string, Array<{ line1: string; line2?: string; city: string; county: string }>> = {
  'EH1 1AA': [
    { line1: '1 Princes Street', city: 'Edinburgh', county: 'City of Edinburgh' },
    { line1: '2 Princes Street', city: 'Edinburgh', county: 'City of Edinburgh' },
    { line1: '3 Princes Street', line2: 'Flat A', city: 'Edinburgh', county: 'City of Edinburgh' },
  ],
  'G1 2AB': [
    { line1: '10 Buchanan Street', city: 'Glasgow', county: 'Glasgow City' },
    { line1: '12 Buchanan Street', city: 'Glasgow', county: 'Glasgow City' },
    { line1: '14 Buchanan Street', line2: 'Suite 3', city: 'Glasgow', county: 'Glasgow City' },
  ],
  'DD1 3CD': [
    { line1: '5 Reform Street', city: 'Dundee', county: 'Dundee City' },
    { line1: '7 Reform Street', city: 'Dundee', county: 'Dundee City' },
  ],
  'AB10 1AB': [
    { line1: '20 Union Street', city: 'Aberdeen', county: 'Aberdeen City' },
    { line1: '22 Union Street', line2: 'Floor 2', city: 'Aberdeen', county: 'Aberdeen City' },
  ],
};

postcodeRouter.get('/:postcode', (req: Request, res: Response) => {
  const postcode = req.params.postcode.toUpperCase().replace(/\s+/g, ' ').trim();

  // Check for exact match first
  if (syntheticAddresses[postcode]) {
    res.json({
      success: true,
      data: {
        postcode,
        addresses: syntheticAddresses[postcode].map((addr, i) => ({
          id: `ADDR-${i + 1}`,
          ...addr,
          postcode,
          country: 'Scotland',
        })),
      },
    });
    return;
  }

  // Generate synthetic addresses for any postcode
  const city = postcode.startsWith('EH') ? 'Edinburgh'
    : postcode.startsWith('G') ? 'Glasgow'
    : postcode.startsWith('DD') ? 'Dundee'
    : postcode.startsWith('AB') ? 'Aberdeen'
    : postcode.startsWith('FK') ? 'Stirling'
    : postcode.startsWith('PH') ? 'Perth'
    : postcode.startsWith('IV') ? 'Inverness'
    : 'Sample Town';

  res.json({
    success: true,
    data: {
      postcode,
      addresses: [
        { id: 'ADDR-1', line1: '1 Sample Street', city, postcode, county: `${city} Area`, country: 'Scotland' },
        { id: 'ADDR-2', line1: '2 Sample Street', city, postcode, county: `${city} Area`, country: 'Scotland' },
        { id: 'ADDR-3', line1: '3 Sample Street', line2: 'Flat 1', city, postcode, county: `${city} Area`, country: 'Scotland' },
      ],
      note: 'PLACEHOLDER: These are synthetic addresses for POC demonstration.',
    },
  });
});
