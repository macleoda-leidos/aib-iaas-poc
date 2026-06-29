/**
 * Synthetic case data used by mock integration services.
 * All data is fictitious and for demonstration purposes only.
 */

export const syntheticBasysCases = [
  { caseRef: 'SEQ-2019-004521', name: 'John Smith', type: 'sequestration', status: 'discharged', date: '2019-08-14' },
  { caseRef: 'SEQ-2020-001234', name: 'Jane Doe', type: 'sequestration', status: 'active', date: '2020-03-01' },
  { caseRef: 'MAP-2021-005678', name: 'Robert Test', type: 'minimal_asset_process', status: 'completed', date: '2021-06-15' },
  { caseRef: 'SEQ-2022-009012', name: 'Alice Wonder', type: 'sequestration', status: 'active', date: '2022-01-20' },
  { caseRef: 'PTD-2020-003456', name: 'Bob Builder', type: 'protected_trust_deed', status: 'discharged', date: '2020-09-10' },
];

export const syntheticDasArrangements = [
  { ref: 'DAS-ARR-2022-007834', name: 'Mary Morrison', status: 'active', totalDebt: 18500, monthly: 285 },
  { ref: 'DAS-ARR-2021-004567', name: 'Peter Parker', status: 'completed', totalDebt: 12000, monthly: 250 },
  { ref: 'DAS-ARR-2023-001234', name: 'Susan Storm', status: 'active', totalDebt: 22000, monthly: 340 },
  { ref: 'DPP-2023-001234', name: 'David Banner', status: 'application_in_progress', totalDebt: 9500, monthly: 198 },
  { ref: 'DAS-ARR-2020-008901', name: 'Clark Kent', status: 'revoked', totalDebt: 30000, monthly: 0 },
];

export const syntheticMoratoriums = [
  { ref: 'MOR-2024-003456', postcode: 'EH1', status: 'active', weeksRemaining: 4 },
  { ref: 'MOR-2024-002345', postcode: 'EH3', status: 'expired', weeksRemaining: 0 },
  { ref: 'MOR-2024-001234', postcode: 'EH7', status: 'active', weeksRemaining: 2 },
];

export const syntheticRoiEntries = [
  { id: 'ROI-2018-012345', name: 'Testerton', type: 'sequestration', status: 'discharged', date: '2018-11-20' },
  { id: 'ROI-2020-023456', name: 'Testworth', type: 'trust_deed', status: 'active', date: '2020-05-10' },
  { id: 'ROI-2019-034567', name: 'McTest', type: 'map', status: 'completed', date: '2019-08-01' },
];

export const syntheticProviders = [
  { id: 'PROV-001', name: 'Sample Insolvency Practitioners LLP', type: 'insolvency_practitioner', status: 'active' },
  { id: 'PROV-002', name: 'Test Trustees & Co', type: 'trustee', status: 'active' },
  { id: 'PROV-003', name: 'Citizens Advice Scotland (Sample)', type: 'money_adviser', status: 'active' },
  { id: 'PROV-004', name: 'Sample Payment Services Ltd', type: 'payment_distributor', status: 'active' },
  { id: 'PROV-005', name: 'Highland Debt Solutions (Test)', type: 'money_adviser', status: 'suspended' },
];
