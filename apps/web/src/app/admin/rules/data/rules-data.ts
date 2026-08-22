export interface RuleCondition {
  field: string;
  operator: string;
  value: string;
  displayText: string;
}

export interface RuleAction {
  type: 'recommend' | 'flag' | 'refer';
  target: string;
  displayText: string;
}

export interface ChangeHistoryEntry {
  version: string;
  date: string;
  author: string;
  summary: string;
}

export interface RuleDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  lastUpdated: string;
  updatedBy: string;
  status: 'active' | 'draft' | 'archived';
  product: string;
  productKey: string;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  changeHistory: ChangeHistoryEntry[];
  testResults: { lastRun: string; passed: number; failed: number; coverage: number };
}

export const RULES: RuleDefinition[] = [
  {
    id: 'rule-existing-case',
    name: 'Existing Case Diversion',
    description: 'Diverts applicants who already have an active case in another insolvency system (BASYS, eDEN, DAS Register) to signposting rather than creating duplicate applications.',
    version: '2.1',
    lastUpdated: '2026-08-14',
    updatedBy: 'Karen MacLeod',
    status: 'active',
    product: 'Signposting',
    productKey: 'signposting',
    priority: 1,
    conditions: [
      {
        field: 'existingCases',
        operator: '==',
        value: 'found',
        displayText: 'Existing active case found in cross-system check',
      },
    ],
    actions: [
      {
        type: 'recommend',
        target: 'Signposting',
        displayText: 'Recommend Signposting to existing case handler',
      },
    ],
    changeHistory: [
      { version: '1.0', date: '2025-01-15', author: 'James Wilson', summary: 'Initial rule — checks BASYS only for existing sequestration cases' },
      { version: '1.5', date: '2025-03-22', author: 'Karen MacLeod', summary: 'Extended check to include eDEN and DAS Register lookups' },
      { version: '2.0', date: '2025-06-10', author: 'Sarah Mitchell', summary: 'Added cross-system orchestrated check via Integration Service' },
      { version: '2.1', date: '2026-08-14', author: 'Karen MacLeod', summary: 'Refined to check active cases only — closed/discharged cases no longer trigger diversion' },
    ],
    testResults: { lastRun: '2026-08-12', passed: 18, failed: 0, coverage: 97 },
  },
  {
    id: 'rule-active-moratorium',
    name: 'Active Moratorium',
    description: 'Identifies applicants with an active moratorium on diligence and recommends extension rather than a new product application, aligning with the proposed 12-week policy.',
    version: '1.3',
    lastUpdated: '2026-08-09',
    updatedBy: 'Robert Anderson',
    status: 'draft',
    product: 'Moratorium Extension',
    productKey: 'moratorium',
    priority: 2,
    conditions: [
      {
        field: 'hasMoratorium',
        operator: '==',
        value: 'true',
        displayText: 'Applicant has an active moratorium on diligence',
      },
    ],
    actions: [
      {
        type: 'recommend',
        target: 'Moratorium Extension',
        displayText: 'Recommend Moratorium extension (12-week proposed period)',
      },
    ],
    changeHistory: [
      { version: '1.0', date: '2025-02-01', author: 'James Wilson', summary: 'Original moratorium detection rule — flags for manual review' },
      { version: '1.1', date: '2025-05-18', author: 'Sarah Mitchell', summary: 'Changed action from flag to recommend extension pathway' },
      { version: '1.2', date: '2025-09-04', author: 'Robert Anderson', summary: 'Added 6-week remaining check — only triggers if moratorium still has time to extend' },
      { version: '1.3', date: '2026-08-09', author: 'Robert Anderson', summary: 'DRAFT: Extending qualifying period from 6 weeks to 12 weeks per new policy proposal from Scottish Government consultation' },
    ],
    testResults: { lastRun: '2026-08-08', passed: 12, failed: 2, coverage: 88 },
  },
  {
    id: 'rule-low-debt-signpost',
    name: 'Low Debt Signposting',
    description: 'Applicants with total debt below £1,500 are directed to free debt advice signposting rather than formal insolvency products, as statutory solutions are disproportionate for low-value debt.',
    version: '1.4',
    lastUpdated: '2026-07-22',
    updatedBy: 'Sarah Mitchell',
    status: 'active',
    product: 'Signposting',
    productKey: 'signposting',
    priority: 3,
    conditions: [
      {
        field: 'totalDebt',
        operator: '<',
        value: '1500',
        displayText: 'Total debt is less than £1,500',
      },
    ],
    actions: [
      {
        type: 'recommend',
        target: 'Signposting',
        displayText: 'Recommend Signposting to free debt advice services',
      },
    ],
    changeHistory: [
      { version: '1.0', date: '2025-01-15', author: 'James Wilson', summary: 'Initial low debt threshold set at £1,000' },
      { version: '1.1', date: '2025-04-10', author: 'Karen MacLeod', summary: 'Increased threshold from £1,000 to £1,200 following policy review' },
      { version: '1.3', date: '2025-11-28', author: 'Sarah Mitchell', summary: 'Threshold raised to £1,500 to align with DPP minimum entry point' },
      { version: '1.4', date: '2026-07-22', author: 'Sarah Mitchell', summary: 'Updated signposting destinations to include new Money & Pensions Service portal' },
    ],
    testResults: { lastRun: '2026-08-10', passed: 22, failed: 0, coverage: 100 },
  },
  {
    id: 'rule-dpp-eligibility',
    name: 'DPP Eligibility',
    description: 'Debt Payment Programme eligibility for applicants with moderate debt that can be repaid within 48 months from disposable income. DPP is the least formal statutory solution.',
    version: '2.2',
    lastUpdated: '2026-06-18',
    updatedBy: 'James Wilson',
    status: 'active',
    product: 'Debt Payment Programme (DPP)',
    productKey: 'dpp',
    priority: 4,
    conditions: [
      {
        field: 'totalDebt',
        operator: '>=',
        value: '1500',
        displayText: 'Total debt is at least £1,500',
      },
      {
        field: 'totalDebt',
        operator: '<=',
        value: '5000',
        displayText: 'Total debt does not exceed £5,000',
      },
      {
        field: 'disposableIncome',
        operator: '>=',
        value: 'totalDebt/48',
        displayText: 'Repayment capacity: disposable income × 48 months covers total debt',
      },
    ],
    actions: [
      {
        type: 'recommend',
        target: 'Debt Payment Programme (DPP)',
        displayText: 'Recommend DPP — debt repayable within statutory 48-month period',
      },
    ],
    changeHistory: [
      { version: '1.0', date: '2025-01-15', author: 'James Wilson', summary: 'Initial DPP rule with basic debt band check' },
      { version: '1.5', date: '2025-04-02', author: 'Karen MacLeod', summary: 'Added repayment capacity calculation (disposable × 48 >= debt)' },
      { version: '2.0', date: '2025-08-14', author: 'James Wilson', summary: 'Adjusted lower bound from £1,000 to £1,500 to match signposting threshold change' },
      { version: '2.2', date: '2026-06-18', author: 'James Wilson', summary: 'Added validation that applicant is not currently in another active DPP' },
    ],
    testResults: { lastRun: '2026-08-11', passed: 31, failed: 1, coverage: 95 },
  },
  {
    id: 'rule-das-eligibility',
    name: 'DAS Eligibility',
    description: 'Debt Arrangement Scheme eligibility for applicants with significant debt who can sustain regular payments. DAS provides statutory protection from creditor action while debts are repaid.',
    version: '3.4',
    lastUpdated: '2026-08-01',
    updatedBy: 'Karen MacLeod',
    status: 'active',
    product: 'Debt Arrangement Scheme (DAS)',
    productKey: 'das',
    priority: 5,
    conditions: [
      {
        field: 'totalDebt',
        operator: '>=',
        value: '5000',
        displayText: 'Total debt is at least £5,000',
      },
      {
        field: 'totalDebt',
        operator: '<=',
        value: '25000',
        displayText: 'Total debt does not exceed £25,000',
      },
      {
        field: 'disposableIncome',
        operator: '>',
        value: '100',
        displayText: 'Monthly disposable income exceeds £100',
      },
    ],
    actions: [
      {
        type: 'recommend',
        target: 'Debt Arrangement Scheme (DAS)',
        displayText: 'Recommend DAS — statutory debt repayment plan with creditor protection',
      },
    ],
    changeHistory: [
      { version: '1.0', date: '2025-01-15', author: 'James Wilson', summary: 'Basic DAS eligibility — debt band £5,000–£25,000' },
      { version: '2.0', date: '2025-05-20', author: 'Sarah Mitchell', summary: 'Added minimum disposable income check (£150/month)' },
      { version: '3.0', date: '2025-10-12', author: 'Robert Anderson', summary: 'Added insolvency exclusion — applicants in active sequestration cannot enter DAS' },
      { version: '3.2', date: '2026-03-15', author: 'Karen MacLeod', summary: 'Reduced minimum disposable income from £150 to £100 following affordability review' },
      { version: '3.4', date: '2026-08-01', author: 'Karen MacLeod', summary: 'Updated priority ordering and added enhanced logging for audit trail compliance' },
    ],
    testResults: { lastRun: '2026-08-12', passed: 45, failed: 0, coverage: 98 },
  },
  {
    id: 'rule-ptd-assets',
    name: 'PTD with Assets',
    description: 'Protected Trust Deed recommendation for applicants with significant debt and realisable assets. PTD allows asset contribution toward debt while providing discharge after 4 years.',
    version: '2.0',
    lastUpdated: '2026-05-30',
    updatedBy: 'Robert Anderson',
    status: 'active',
    product: 'Protected Trust Deed (PTD)',
    productKey: 'ptd',
    priority: 6,
    conditions: [
      {
        field: 'totalDebt',
        operator: '>',
        value: '5000',
        displayText: 'Total debt exceeds £5,000',
      },
      {
        field: 'totalAssets',
        operator: '>',
        value: '5000',
        displayText: 'Total realisable assets exceed £5,000',
      },
    ],
    actions: [
      {
        type: 'recommend',
        target: 'Protected Trust Deed (PTD)',
        displayText: 'Recommend PTD — asset-based solution with 4-year discharge',
      },
    ],
    changeHistory: [
      { version: '1.0', date: '2025-01-15', author: 'James Wilson', summary: 'Initial PTD rule — debt > £10,000 and assets > £10,000' },
      { version: '1.5', date: '2025-06-22', author: 'Sarah Mitchell', summary: 'Lowered thresholds — debt > £5,000 and assets > £5,000 per updated guidance' },
      { version: '2.0', date: '2026-05-30', author: 'Robert Anderson', summary: 'Added exclusion for applicants already subject to a trust deed; improved asset valuation guidance notes' },
    ],
    testResults: { lastRun: '2026-08-10', passed: 28, failed: 0, coverage: 92 },
  },
  {
    id: 'rule-map-eligibility',
    name: 'MAP Eligibility',
    description: 'Minimal Asset Process (MAP) — the simplified bankruptcy route for applicants with low income, minimal assets, and moderate debt. Provides faster discharge than full sequestration.',
    version: '2.3',
    lastUpdated: '2026-07-15',
    updatedBy: 'Karen MacLeod',
    status: 'active',
    product: 'Minimal Asset Process (MAP)',
    productKey: 'map',
    priority: 7,
    conditions: [
      {
        field: 'totalDebt',
        operator: '>=',
        value: '1500',
        displayText: 'Total debt is at least £1,500',
      },
      {
        field: 'totalDebt',
        operator: '<=',
        value: '25000',
        displayText: 'Total debt does not exceed £25,000',
      },
      {
        field: 'totalAssets',
        operator: '<',
        value: '2000',
        displayText: 'Total assets below £2,000',
      },
      {
        field: 'disposableIncome',
        operator: '<',
        value: '50',
        displayText: 'Monthly disposable income below £50',
      },
    ],
    actions: [
      {
        type: 'recommend',
        target: 'Minimal Asset Process (MAP)',
        displayText: 'Recommend MAP — simplified bankruptcy with 6-month discharge',
      },
    ],
    changeHistory: [
      { version: '1.0', date: '2025-01-15', author: 'James Wilson', summary: 'Initial MAP rule with £1,000 asset threshold and £25 income limit' },
      { version: '1.5', date: '2025-04-28', author: 'Sarah Mitchell', summary: 'Raised asset threshold to £2,000 and income limit to £50 following stakeholder feedback' },
      { version: '2.0', date: '2025-09-15', author: 'Robert Anderson', summary: 'Added vehicle equity exclusion (first £3,000 of vehicle value disregarded)' },
      { version: '2.3', date: '2026-07-15', author: 'Karen MacLeod', summary: 'Updated debt band upper limit validation and added cross-reference to PTD pathway' },
    ],
    testResults: { lastRun: '2026-08-11', passed: 35, failed: 0, coverage: 96 },
  },
  {
    id: 'rule-sequestration',
    name: 'Sequestration',
    description: 'Full bankruptcy (sequestration) recommendation for applicants with very high debt or those with significant debt and no ability to repay. Last-resort statutory solution.',
    version: '1.8',
    lastUpdated: '2026-06-28',
    updatedBy: 'James Wilson',
    status: 'active',
    product: 'Sequestration (Bankruptcy)',
    productKey: 'sequestration',
    priority: 8,
    conditions: [
      {
        field: 'totalDebt',
        operator: '>',
        value: '25000',
        displayText: 'Total debt exceeds £25,000',
      },
      {
        field: 'disposableIncome',
        operator: '<=',
        value: '0',
        displayText: 'No disposable income available (zero or negative)',
      },
    ],
    actions: [
      {
        type: 'recommend',
        target: 'Sequestration (Bankruptcy)',
        displayText: 'Recommend Sequestration — full bankruptcy with trustee appointment',
      },
    ],
    changeHistory: [
      { version: '1.0', date: '2025-01-15', author: 'James Wilson', summary: 'Initial sequestration rule — debt > £25,000 only' },
      { version: '1.3', date: '2025-05-10', author: 'Karen MacLeod', summary: 'Added alternative trigger: debt > £10,000 AND zero disposable income' },
      { version: '1.5', date: '2025-08-22', author: 'Sarah Mitchell', summary: 'Clarified OR logic — either high debt OR moderate debt with no repayment capacity' },
      { version: '1.8', date: '2026-06-28', author: 'James Wilson', summary: 'Refined zero-income check to include negative disposable income (expenses exceed income)' },
    ],
    testResults: { lastRun: '2026-08-12', passed: 24, failed: 0, coverage: 91 },
  },
  {
    id: 'rule-digital-das-fast-track',
    name: 'Digital DAS Fast-Track',
    description: 'Experimental fast-track pathway for straightforward DAS cases — employed applicants with moderate debt, no assets, and good repayment capacity. Aims to reduce processing time from 6 weeks to 5 days.',
    version: '0.2',
    lastUpdated: '2026-08-16',
    updatedBy: 'Sarah Mitchell',
    status: 'draft',
    product: 'DAS (Fast-Track)',
    productKey: 'das-fast-track',
    priority: 10,
    conditions: [
      {
        field: 'totalDebt',
        operator: '>=',
        value: '5000',
        displayText: 'Total debt is at least £5,000',
      },
      {
        field: 'totalDebt',
        operator: '<=',
        value: '15000',
        displayText: 'Total debt does not exceed £15,000',
      },
      {
        field: 'employmentStatus',
        operator: '==',
        value: 'employed',
        displayText: 'Applicant is in employment',
      },
      {
        field: 'totalAssets',
        operator: '<=',
        value: '0',
        displayText: 'No realisable assets',
      },
      {
        field: 'disposableIncome',
        operator: '>',
        value: '200',
        displayText: 'Monthly disposable income exceeds £200',
      },
    ],
    actions: [
      {
        type: 'recommend',
        target: 'DAS (Fast-Track)',
        displayText: 'Recommend DAS Fast-Track — automated approval pathway (5-day target)',
      },
    ],
    changeHistory: [
      { version: '0.1', date: '2026-07-01', author: 'Sarah Mitchell', summary: 'NEW: Initial draft of digital fast-track rule for straightforward DAS applications' },
      { version: '0.2', date: '2026-08-16', author: 'Sarah Mitchell', summary: 'Refined eligibility — added employment requirement and raised disposable income threshold from £150 to £200' },
    ],
    testResults: { lastRun: '2026-08-15', passed: 8, failed: 3, coverage: 72 },
  },
];
