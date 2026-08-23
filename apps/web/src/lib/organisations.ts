export type OrganisationType = 'creditor' | 'bank' | 'utility' | 'local_authority' | 'debt_advice_provider' | 'trust_deed_provider' | 'insolvency_practitioner' | 'government_agency' | 'other';

export interface Organisation {
  id: string;
  name: string;
  type: OrganisationType;
  registrationNumber?: string;
  status: 'active' | 'inactive';
  address?: string;
  website?: string;
  phone?: string;
  email?: string;
}

export const ORGANISATIONS: Organisation[] = [
  // Banks (10)
  { id: 'org-rbs', name: 'Royal Bank of Scotland', type: 'bank', status: 'active', website: 'rbs.co.uk' },
  { id: 'org-bos', name: 'Bank of Scotland', type: 'bank', status: 'active', website: 'bankofscotland.co.uk' },
  { id: 'org-natwest', name: 'NatWest', type: 'bank', status: 'active' },
  { id: 'org-barclays', name: 'Barclays', type: 'bank', status: 'active' },
  { id: 'org-lloyds', name: 'Lloyds Bank', type: 'bank', status: 'active' },
  { id: 'org-virgin', name: 'Virgin Money', type: 'bank', status: 'active' },
  { id: 'org-tsb', name: 'TSB', type: 'bank', status: 'active' },
  { id: 'org-santander', name: 'Santander', type: 'bank', status: 'active' },
  { id: 'org-hsbc', name: 'HSBC', type: 'bank', status: 'active' },
  { id: 'org-halifax', name: 'Halifax', type: 'bank', status: 'active' },

  // Government / Creditors (8)
  { id: 'org-hmrc', name: 'HM Revenue & Customs', type: 'government_agency', status: 'active', website: 'gov.uk/hmrc' },
  { id: 'org-dwp', name: 'Department for Work and Pensions', type: 'government_agency', status: 'active' },
  { id: 'org-slc', name: 'Student Loans Company', type: 'government_agency', status: 'active' },
  { id: 'org-aib', name: 'Accountant in Bankruptcy', type: 'government_agency', status: 'active', website: 'aib.gov.uk' },
  { id: 'org-dvla', name: 'DVLA', type: 'government_agency', status: 'active' },
  { id: 'org-tvl', name: 'TV Licensing', type: 'creditor', status: 'active' },
  { id: 'org-council-tax', name: 'Council Tax (Generic)', type: 'creditor', status: 'active' },
  { id: 'org-nhs', name: 'NHS Scotland', type: 'government_agency', status: 'active' },

  // Utilities (8)
  { id: 'org-scottish-power', name: 'Scottish Power', type: 'utility', status: 'active' },
  { id: 'org-british-gas', name: 'British Gas', type: 'utility', status: 'active' },
  { id: 'org-ovo', name: 'OVO Energy', type: 'utility', status: 'active' },
  { id: 'org-edf', name: 'EDF Energy', type: 'utility', status: 'active' },
  { id: 'org-sse', name: 'SSE Energy', type: 'utility', status: 'active' },
  { id: 'org-scottish-water', name: 'Scottish Water', type: 'utility', status: 'active' },
  { id: 'org-bt', name: 'BT', type: 'utility', status: 'active' },
  { id: 'org-sky', name: 'Sky', type: 'utility', status: 'active' },

  // Local Authorities (8)
  { id: 'org-glasgow-cc', name: 'Glasgow City Council', type: 'local_authority', status: 'active' },
  { id: 'org-edinburgh-cc', name: 'City of Edinburgh Council', type: 'local_authority', status: 'active' },
  { id: 'org-aberdeen-cc', name: 'Aberdeen City Council', type: 'local_authority', status: 'active' },
  { id: 'org-dundee-cc', name: 'Dundee City Council', type: 'local_authority', status: 'active' },
  { id: 'org-stirling-cc', name: 'Stirling Council', type: 'local_authority', status: 'active' },
  { id: 'org-fife-cc', name: 'Fife Council', type: 'local_authority', status: 'active' },
  { id: 'org-highland-cc', name: 'Highland Council', type: 'local_authority', status: 'active' },
  { id: 'org-perth-cc', name: 'Perth & Kinross Council', type: 'local_authority', status: 'active' },

  // Debt Advice Providers (6)
  { id: 'org-cas', name: 'Citizens Advice Scotland', type: 'debt_advice_provider', status: 'active', website: 'cas.org.uk' },
  { id: 'org-stepchange', name: 'StepChange Debt Charity', type: 'debt_advice_provider', status: 'active' },
  { id: 'org-cap', name: 'Christians Against Poverty', type: 'debt_advice_provider', status: 'active' },
  { id: 'org-money-helper', name: 'MoneyHelper', type: 'debt_advice_provider', status: 'active' },
  { id: 'org-carrington-dean', name: 'Carrington Dean', type: 'debt_advice_provider', status: 'active' },
  { id: 'org-scotlands-people', name: "Scotland's Money Advice", type: 'debt_advice_provider', status: 'active' },

  // Trust Deed / Insolvency Practitioners (6)
  { id: 'org-wylie', name: 'Wylie & Bisset LLP', type: 'trust_deed_provider', status: 'active' },
  { id: 'org-french-duncan', name: 'French Duncan LLP', type: 'trust_deed_provider', status: 'active' },
  { id: 'org-begbies', name: 'Begbies Traynor', type: 'insolvency_practitioner', status: 'active' },
  { id: 'org-kpmg', name: 'KPMG Restructuring', type: 'insolvency_practitioner', status: 'active' },
  { id: 'org-azets', name: 'Azets (formerly Campbell Dallas)', type: 'trust_deed_provider', status: 'active' },
  { id: 'org-johnston-carmichael', name: 'Johnston Carmichael', type: 'insolvency_practitioner', status: 'active' },

  // Other Creditors (8)
  { id: 'org-amex', name: 'American Express', type: 'creditor', status: 'active' },
  { id: 'org-capital-one', name: 'Capital One', type: 'creditor', status: 'active' },
  { id: 'org-vanquis', name: 'Vanquis Bank', type: 'creditor', status: 'active' },
  { id: 'org-provident', name: 'Provident Financial', type: 'creditor', status: 'active' },
  { id: 'org-catalogue', name: 'Very / Littlewoods (Shop Direct)', type: 'creditor', status: 'active' },
  { id: 'org-brighthouse', name: 'BrightHouse', type: 'creditor', status: 'inactive' },
  { id: 'org-quickquid', name: 'QuickQuid', type: 'creditor', status: 'inactive' },
  { id: 'org-payplan', name: 'PayPlan', type: 'debt_advice_provider', status: 'active' },
];

// Organisation Service functions
export function searchOrganisations(query: string, types?: OrganisationType[]): Organisation[] {
  const q = query.toLowerCase();
  return ORGANISATIONS.filter(org => {
    if (types && !types.includes(org.type)) return false;
    if (org.status !== 'active') return false;
    return org.name.toLowerCase().includes(q);
  });
}

export function getCreditorOrganisations(): Organisation[] {
  return ORGANISATIONS.filter(org =>
    ['bank', 'creditor', 'utility', 'local_authority', 'government_agency'].includes(org.type) &&
    org.status === 'active'
  );
}

export function getOrganisationById(id: string): Organisation | undefined {
  return ORGANISATIONS.find(org => org.id === id);
}

export function getOrganisationsByType(type: OrganisationType): Organisation[] {
  return ORGANISATIONS.filter(org => org.type === type && org.status === 'active');
}
