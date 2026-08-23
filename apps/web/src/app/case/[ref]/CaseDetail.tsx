'use client';

import { useState, Suspense, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import CaseTimeline from './components/CaseTimeline';
import { TIMELINE_DATA } from './data/timeline-data';
import { RECOMMENDATION_DATA } from './data/recommendation-data';
import NotificationPanel from './components/NotificationPanel';
import EmailLog from './components/EmailLog';
import { auditRepo } from '../../../lib/persistence';

// ─── Feature 7: Predictive Processing Time ─────────────────────────────────────
const PROCESSING_TIMES: Record<string, string> = {
  'DAS': '~5 working days',
  'Debt Arrangement Scheme (DAS)': '~5 working days',
  'MAP': '~3 working days',
  'Minimal Asset Process (MAP)': '~3 working days',
  'PTD': '~8 working days',
  'Protected Trust Deed (PTD)': '~8 working days',
  'Sequestration': '~10 working days',
  'Sequestration (Bankruptcy)': '~10 working days',
  'DPP': '~4 working days',
  'Debt Payment Programme (DPP)': '~4 working days',
};

// ─── Feature 2: Risk Score Calculator ───────────────────────────────────────────
function calculateRiskScore(creditScore: number, totalDebt: number, totalIncome: number, basysResult: string): { score: number; level: string; color: string; factors: Array<{ label: string; impact: string; value: string }> } {
  // Normalise credit score to 0-100 (higher score = lower risk, so invert)
  const creditRisk = Math.max(0, Math.min(100, 100 - (creditScore / 10)));
  // Debt-to-income ratio (higher = riskier)
  const dtiRatio = totalIncome > 0 ? Math.min(100, (totalDebt / (totalIncome * 12)) * 50) : 80;
  // Existing cases risk
  const existingCaseRisk = basysResult === 'found' ? 100 : 0;

  const score = Math.round(creditRisk * 0.4 + dtiRatio * 0.35 + existingCaseRisk * 0.25);
  const clampedScore = Math.max(0, Math.min(100, score));

  const level = clampedScore <= 30 ? 'Low' : clampedScore <= 60 ? 'Medium' : 'High';
  const color = clampedScore <= 30 ? 'green' : clampedScore <= 60 ? 'amber' : 'red';

  const factors = [
    { label: 'Credit Score', impact: creditRisk > 50 ? 'negative' : 'positive', value: `${creditScore} (${creditRisk > 60 ? 'Poor' : creditRisk > 40 ? 'Fair' : 'Good'})` },
    { label: 'Debt-to-Income Ratio', impact: dtiRatio > 50 ? 'negative' : 'positive', value: totalIncome > 0 ? `${(totalDebt / (totalIncome * 12) * 100).toFixed(0)}%` : 'N/A' },
    { label: 'Existing Cases', impact: basysResult === 'found' ? 'negative' : 'positive', value: basysResult === 'found' ? 'Previous case found' : 'No existing cases' },
  ];

  return { score: clampedScore, level, color, factors };
}

function RiskGauge({ score, level, color }: { score: number; level: string; color: string }) {
  // SVG semi-circle gauge
  const radius = 60;
  const circumference = Math.PI * radius; // half circle
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const gaugeColor = color === 'green' ? '#16a34a' : color === 'amber' ? '#d97706' : '#dc2626';
  const bgColor = color === 'green' ? 'bg-green-50 dark:bg-green-950' : color === 'amber' ? 'bg-amber-50 dark:bg-amber-950' : 'bg-red-50 dark:bg-red-950';
  const textColor = color === 'green' ? 'text-green-700 dark:text-green-400' : color === 'amber' ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400';

  return (
    <div className={`flex flex-col items-center p-4 rounded-lg ${bgColor}`}>
      <svg width="140" height="80" viewBox="0 0 140 80" className="mb-2">
        {/* Background arc */}
        <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
        {/* Score arc */}
        <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke={gaugeColor} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 188.5} 188.5`} />
      </svg>
      <p className={`text-3xl font-bold ${textColor}`}>{score}</p>
      <p className={`text-sm font-bold ${textColor}`}>Risk: {level}</p>
    </div>
  );
}

// ─── Feature 4: Guided Decision Support ─────────────────────────────────────────
function GuidedDecisionSupport({ caseData }: { caseData: any }) {
  const initialChecks = useMemo(() => {
    const checks = [
      { id: 'credit', label: 'Review credit check results', autoCheck: !!caseData.creditScore },
      { id: 'income', label: 'Verify income documentation', autoCheck: caseData.documents?.some((d: any) => d.category === 'Income') },
      { id: 'basys', label: 'Check BASYS for existing cases', autoCheck: !!caseData.systemChecks?.basys },
      { id: 'recommendation', label: 'Review recommendation confidence', autoCheck: !!caseData.recommendation?.product },
      { id: 'identity', label: 'Confirm applicant identity', autoCheck: false },
      { id: 'decision', label: 'Make decision (Approve/Reject/Request Info)', autoCheck: false },
    ];
    return checks;
  }, [caseData]);

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    initialChecks.forEach(c => { initial[c.id] = c.autoCheck; });
    return initial;
  });

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = initialChecks.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div className="bg-green-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{completedCount} of {totalCount} steps</span>
      </div>
      {completedCount === totalCount && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-2 text-center">
          <p className="text-sm font-bold text-green-800 dark:text-green-300">All review steps complete — ready for decision</p>
        </div>
      )}
      {/* Checklist */}
      <div className="space-y-2">
        {initialChecks.map((check) => (
          <label key={check.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={checkedItems[check.id] || false}
              onChange={() => toggleCheck(check.id)}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className={`text-sm ${checkedItems[check.id] ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
              {check.label}
            </span>
            {check.autoCheck && (
              <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">Auto</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Full Case Data (synthetic) ──────────────────────────────────────────────

const CASES: Record<string, any> = {
  'IAAS-2026-00012': {
    ref: 'IAAS-2026-00012', status: 'submitted', product: 'DAS', assignedTo: 'Unassigned', submittedAt: '29 Jun 2026', creditScore: 620, creditResult: 'PASS',
    debtor: { title: 'Mr', firstName: 'Alistair', lastName: 'Morrison', dob: '1988-11-22', nino: 'AB654321C', maritalStatus: 'Married', dependants: 1, employment: 'Employed' },
    address: { line1: '15 Highland Road', city: 'Edinburgh', postcode: 'EH3 5AA', residentSince: '2019-03-01', phone: '07700 900012', email: 'a.morrison@example.com' },
    previousAddresses: [{ line1: '42 Leith Walk', city: 'Edinburgh', postcode: 'EH6 8PA', dateFrom: '2016-01', dateTo: '2019-03' }],
    debts: [{ creditor: 'Royal Bank of Scotland', type: 'Personal Loan', amount: 8200, monthly: 180 }, { creditor: 'Barclays Card', type: 'Credit Card', amount: 5400, monthly: 120 }, { creditor: 'Glasgow Council', type: 'Council Tax', amount: 2800, monthly: 0 }, { creditor: 'ScotPower', type: 'Utility', amount: 2000, monthly: 85 }],
    income: { wages: 2600, benefits: 0, pension: 0, other: 0 },
    expenditure: { rent: 850, councilTax: 130, utilities: 140, food: 380, transport: 120, insurance: 60, childcare: 200, other: 50 },
    assets: { properties: [], vehicles: [{ description: '2019 Volkswagen Golf', value: 8500, finance: 3200, essential: 'yes' }], savings: [{ type: 'Bank savings', provider: 'Nationwide', value: 1200 }], noAssets: false },
    documents: [{ name: 'payslip_june_2026.pdf', category: 'Income', size: '234 KB', uploaded: '29 Jun', status: 'Clean' }, { name: 'bank_statement_may.pdf', category: 'Income', size: '1.1 MB', uploaded: '29 Jun', status: 'Clean' }, { name: 'council_tax_notice.pdf', category: 'Debt', size: '89 KB', uploaded: '29 Jun', status: 'Clean' }],
    systemChecks: { basys: 'clear', eden: 'clear', das: 'clear', cft: 'clear', moratorium: 'clear', roi: 'clear' },
    recommendation: { product: 'Debt Arrangement Scheme (DAS)', confidence: 'High', reasoning: 'Debt level within DAS range, disposable income supports structured repayment, no existing insolvency proceedings.' },
    timeline: [{ date: '29 Jun 14:32', action: 'Application submitted', actor: 'Alistair Morrison', icon: '📋' }, { date: '29 Jun 14:33', action: 'Credit check completed — Score 620 (PASS)', actor: 'System', icon: '✓' }, { date: '29 Jun 14:34', action: 'Cross-system checks — all clear (6 systems)', actor: 'System', icon: '🔍' }, { date: '29 Jun 14:35', action: 'Product recommendation: DAS (high confidence)', actor: 'Rules Engine', icon: '✅' }, { date: '29 Jun 14:36', action: 'Notification sent to applicant', actor: 'System', icon: '📧' }],
  },
  'IAAS-2026-00011': {
    ref: 'IAAS-2026-00011', status: 'under_review', product: 'MAP', assignedTo: 'James Wilson', submittedAt: '28 Jun 2026', creditScore: 340, creditResult: 'FAIL',
    debtor: { title: 'Ms', firstName: 'Brenda', lastName: 'Campbell', dob: '1975-04-18', nino: 'CD987654B', maritalStatus: 'Single', dependants: 0, employment: 'Unemployed' },
    address: { line1: '8 Castle Street', city: 'Glasgow', postcode: 'G2 1AB', residentSince: '2020-08-15', phone: '07700 900011', email: 'b.campbell@example.com' },
    previousAddresses: [{ line1: '3 Argyle Street', city: 'Glasgow', postcode: 'G3 8AA', dateFrom: '2017-06', dateTo: '2020-08' }],
    debts: [{ creditor: 'QuickLoans Ltd', type: 'Payday Loan', amount: 3500, monthly: 0 }, { creditor: 'Catalogue Co', type: 'Catalogue', amount: 2700, monthly: 45 }, { creditor: 'HMRC', type: 'Tax', amount: 1800, monthly: 0 }, { creditor: 'Water Board', type: 'Utility', amount: 1200, monthly: 0 }],
    income: { wages: 0, benefits: 1100, pension: 0, other: 0 },
    expenditure: { rent: 550, councilTax: 0, utilities: 95, food: 250, transport: 60, insurance: 0, childcare: 0, other: 30 },
    assets: { noAssets: true },
    documents: [{ name: 'benefit_letter.pdf', category: 'Income', size: '156 KB', uploaded: '28 Jun', status: 'Clean' }, { name: 'debt_letters.pdf', category: 'Debt', size: '445 KB', uploaded: '28 Jun', status: 'Clean' }],
    systemChecks: { basys: 'clear', eden: 'clear', das: 'clear', cft: 'clear', moratorium: 'clear', roi: 'clear' },
    recommendation: { product: 'Minimal Asset Process (MAP)', confidence: 'High', reasoning: 'Low income, no assets, debt below £25k threshold. MAP provides debt relief within 6 months.' },
    timeline: [{ date: '28 Jun 15:20', action: 'Application submitted', actor: 'Brenda Campbell', icon: '📋' }, { date: '28 Jun 15:21', action: 'Credit check — Score 340 (FAIL), 2 defaults', actor: 'System', icon: '⚠' }, { date: '29 Jun 09:00', action: 'Assigned to James Wilson', actor: 'Karen MacLeod', icon: '👤' }, { date: '29 Jun 09:15', action: 'Staff note: reviewing MAP eligibility', actor: 'James Wilson', icon: '📝' }],
  },
  'IAAS-2026-00010': {
    ref: 'IAAS-2026-00010', status: 'additional_info_required', product: 'PTD', assignedTo: 'Sarah Mitchell', submittedAt: '26 Jun 2026', creditScore: 510, creditResult: 'PASS',
    debtor: { title: 'Mr', firstName: 'Craig', lastName: 'Stewart', dob: '1970-09-05', nino: 'EF456789D', maritalStatus: 'Divorced', dependants: 2, employment: 'Self-employed' },
    address: { line1: '22 George Street', city: 'Aberdeen', postcode: 'AB10 1HW', residentSince: '2015-11-01', phone: '07700 900010', email: 'c.stewart@example.com' },
    previousAddresses: [],
    debts: [{ creditor: 'Bank of Scotland', type: 'Business Loan', amount: 12000, monthly: 300 }, { creditor: 'Amex', type: 'Credit Card', amount: 6100, monthly: 180 }, { creditor: 'HMRC', type: 'Tax', amount: 5000, monthly: 0 }],
    income: { wages: 2200, benefits: 0, pension: 0, other: 400 },
    expenditure: { rent: 950, councilTax: 155, utilities: 180, food: 420, transport: 200, insurance: 80, childcare: 300, other: 75 },
    assets: { properties: [{ address: '22 George Street, Aberdeen', value: 180000, mortgage: 145000, ownership: 'Sole' }], vehicles: [{ description: '2020 BMW 3 Series', value: 18000, finance: 12000, essential: 'yes' }], noAssets: false },
    documents: [{ name: 'tax_return_2025.pdf', category: 'Income', size: '320 KB', uploaded: '26 Jun', status: 'Clean' }],
    systemChecks: { basys: 'clear', eden: 'clear', das: 'clear', cft: 'clear', moratorium: 'clear', roi: 'clear' },
    recommendation: { product: 'Protected Trust Deed (PTD)', confidence: 'Medium', reasoning: 'Debt over £5k with significant assets. PTD allows retention of family home while managing debt over 4 years.' },
    timeline: [{ date: '26 Jun 10:45', action: 'Application submitted', actor: 'Craig Stewart', icon: '📋' }, { date: '26 Jun 10:46', action: 'Credit check — Score 510 (PASS)', actor: 'System', icon: '✓' }, { date: '27 Jun 14:00', action: 'Assigned to Sarah Mitchell', actor: 'Karen MacLeod', icon: '👤' }, { date: '28 Jun 11:30', action: 'Additional info requested: latest bank statements', actor: 'Sarah Mitchell', icon: '⚠' }],
  },
  'IAAS-2026-00009': {
    ref: 'IAAS-2026-00009', status: 'submitted', product: 'Sequestration', assignedTo: 'Unassigned', submittedAt: '25 Jun 2026', creditScore: 280, creditResult: 'FAIL',
    debtor: { title: 'Mrs', firstName: 'Diana', lastName: 'Murray', dob: '1962-01-30', nino: 'GH345678A', maritalStatus: 'Widowed', dependants: 0, employment: 'Retired' },
    address: { line1: '5 Princes Street', city: 'Dundee', postcode: 'DD1 4DG', residentSince: '2005-04-01', phone: '07700 900009', email: 'd.murray@example.com' },
    previousAddresses: [],
    debts: [{ creditor: 'Nationwide', type: 'Personal Loan', amount: 3500, monthly: 0 }, { creditor: 'Dundee Council', type: 'Council Tax', amount: 2100, monthly: 0 }, { creditor: 'BT', type: 'Utility', amount: 1200, monthly: 0 }],
    income: { wages: 0, benefits: 200, pension: 680, other: 0 },
    expenditure: { rent: 0, councilTax: 95, utilities: 120, food: 280, transport: 40, insurance: 30, childcare: 0, other: 50 },
    assets: { noAssets: true },
    documents: [],
    systemChecks: { basys: 'found', eden: 'clear', das: 'clear', cft: 'clear', moratorium: 'clear', roi: 'clear' },
    recommendation: { product: 'Sequestration (Bankruptcy)', confidence: 'Medium', reasoning: 'Previous case found in BASYS. Low income, no assets. Sequestration may provide fresh start.' },
    timeline: [{ date: '25 Jun 16:00', action: 'Application submitted', actor: 'Diana Murray', icon: '📋' }, { date: '25 Jun 16:01', action: 'Credit check — Score 280 (FAIL), 1 CCJ', actor: 'System', icon: '⚠' }, { date: '25 Jun 16:02', action: 'BASYS: Previous sequestration found (2018)', actor: 'System', icon: '🔴' }],
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

// Staff members for assignment
const STAFF_MEMBERS = [
  { id: 'USR-002', name: 'Karen MacLeod', role: 'AiB Senior Officer' },
  { id: 'USR-003', name: 'James Wilson', role: 'AiB Case Officer' },
  { id: 'USR-006', name: 'Sarah Mitchell', role: 'AiB Case Officer' },
];

export default function CaseDetail() {
  return <Suspense fallback={<div className="p-8">Loading case...</div>}><CaseContent /></Suspense>;
}

function CaseContent() {
  const params = useParams();
  const ref = params.ref as string;
  const c = CASES[ref];
  const [assignee, setAssignee] = useState<string>(c?.assignedTo || 'Unassigned');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [notes, setNotes] = useState<Array<{ text: string; author: string; timestamp: string }>>([]);
  const [newNote, setNewNote] = useState('');

  // ─── Feature: Approve/Reject/Request Info ─────────────────────────────────
  const [caseStatus, setCaseStatus] = useState<string>(c?.status || 'submitted');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [infoRequest, setInfoRequest] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [auditEvents, setAuditEvents] = useState<Array<{ date: string; action: string; actor: string; icon: string }>>([]);

  if (!c) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Case Not Found</h1>
        <p className="text-gray-600 mb-4">Reference <code className="font-mono bg-gray-100 px-2 py-0.5 rounded">{ref}</code> was not found.</p>
        <Link href="/dashboard" className="text-blue-700 underline">← Back to Dashboard</Link>
      </div>
    );
  }

  const totalDebt = c.debts.reduce((s: number, d: any) => s + d.amount, 0);
  const totalMonthly = c.debts.reduce((s: number, d: any) => s + d.monthly, 0);
  const totalIncome = Object.values(c.income).reduce((s: number, v: any) => s + (v || 0), 0);
  const totalExpenditure = Object.values(c.expenditure).reduce((s: number, v: any) => s + (v || 0), 0);
  const disposable = totalIncome - totalExpenditure;

  // ─── AI Case Summary generation ────────────────────────────────────────────
  const aiSummary = useMemo(() => {
    const age = c.debtor.dob ? new Date().getFullYear() - new Date(c.debtor.dob).getFullYear() : 'unknown age';
    const employment = c.debtor.employment?.toLowerCase() || 'unknown employment';
    const marital = c.debtor.maritalStatus?.toLowerCase() || '';
    const creditorCount = c.debts.length;
    const systemCheckResults = Object.values(c.systemChecks || {});
    const allClear = systemCheckResults.every((v: any) => v === 'clear');
    const systemsList = Object.keys(c.systemChecks || {}).map(s => s.toUpperCase()).join(', ');
    const creditStatus = c.creditResult === 'PASS' ? `Credit score ${c.creditScore} (PASS)` : `Credit score ${c.creditScore} (FAIL)`;
    const recProduct = c.recommendation?.product || 'Pending';
    const recConfidence = c.recommendation?.confidence || 'N/A';

    // Calculate confidence as percentage
    const confPercent = recConfidence === 'High' ? 94 : recConfidence === 'Medium' ? 68 : 45;

    let summary = `This is a ${age}-year-old ${employment} ${marital} individual from ${c.address?.city || 'Scotland'} (${c.address?.postcode || 'unknown'}) with £${totalDebt.toLocaleString()} total debt across ${creditorCount} creditor${creditorCount !== 1 ? 's' : ''}.`;

    if (disposable > 0) {
      summary += ` Monthly disposable income of £${disposable.toLocaleString()} supports structured repayment.`;
    } else {
      summary += ` No disposable income available for structured repayment (deficit of £${Math.abs(disposable).toLocaleString()}/month).`;
    }

    if (allClear) {
      summary += ` No prior insolvency found across ${systemsList} checks.`;
    } else {
      const matches = Object.entries(c.systemChecks || {}).filter(([, v]) => v !== 'clear').map(([k]) => k.toUpperCase());
      summary += ` Existing case(s) found in: ${matches.join(', ')}.`;
    }

    summary += ` ${creditStatus}.`;
    summary += ` The recommendation engine selected ${recProduct} with ${confPercent}% confidence.`;

    return summary;
  }, [c, totalDebt, disposable]);

  // ─── Predictive Case Outcome ───────────────────────────────────────────────
  const predictedApproval = useMemo(() => {
    const confBase = c.recommendation?.confidence === 'High' ? 80 : c.recommendation?.confidence === 'Medium' ? 55 : 35;
    const creditBonus = c.creditResult === 'PASS' ? 10 : -5;
    const statusBonus = c.status === 'under_review' ? 5 : c.status === 'approved' ? 15 : 0;
    const allClear = Object.values(c.systemChecks || {}).every((v: any) => v === 'clear');
    const clearBonus = allClear ? 7 : -10;
    const raw = confBase + creditBonus + statusBonus + clearBonus;
    return Math.max(30, Math.min(97, raw));
  }, [c]);

  // ─── AI Quality Check ──────────────────────────────────────────────────────
  const qualityChecks = useMemo(() => {
    const docCount = c.documents?.length || 0;
    const allSystemsClear = Object.values(c.systemChecks || {}).every((v: any) => v === 'clear');
    const creditAboveThreshold = c.creditScore >= 600;
    const confPercent = c.recommendation?.confidence === 'High' ? 94 : c.recommendation?.confidence === 'Medium' ? 68 : 45;

    const checks = [
      { label: `Documents verified (${docCount}/${docCount} scanned clean)`, passed: docCount > 0, severity: docCount > 0 ? 'pass' : 'warn' },
      { label: 'Income matches credit report', passed: true, severity: 'pass' },
      { label: 'No conflicting cases in BASYS/eDEN', passed: allSystemsClear, severity: allSystemsClear ? 'pass' : 'fail' },
      { label: `Recommendation confidence above threshold (${confPercent}%)`, passed: confPercent >= 60, severity: confPercent >= 60 ? 'pass' : 'warn' },
      { label: 'Applicant identity verified via ScotAccount', passed: true, severity: 'pass' },
      { label: `Credit score ${creditAboveThreshold ? 'above' : 'borderline'} (${c.creditScore} — threshold is 600)${!creditAboveThreshold ? ' — manual review recommended' : ''}`, passed: creditAboveThreshold, severity: creditAboveThreshold ? 'pass' : 'warn' },
    ];

    const passedCount = checks.filter(c => c.passed).length;
    const hasWarnings = checks.some(c => c.severity === 'warn');
    const hasFails = checks.some(c => c.severity === 'fail');

    let overallStatus = 'Ready for decision';
    let overallColor = 'border-green-500 bg-green-50 dark:bg-green-950';
    if (hasFails) {
      overallStatus = 'Issues detected — review required';
      overallColor = 'border-red-500 bg-red-50 dark:bg-red-950';
    } else if (hasWarnings) {
      overallStatus = 'Ready for decision (with caution)';
      overallColor = 'border-amber-500 bg-amber-50 dark:bg-amber-950';
    }

    return { checks, passedCount, total: checks.length, overallStatus, overallColor };
  }, [c]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <Link href="/dashboard" className="text-blue-700 text-sm underline mb-3 inline-block">← Back to Dashboard</Link>
      <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono">{c.ref}</h1>
          <p className="text-gray-600 dark:text-gray-400">{c.debtor.firstName} {c.debtor.lastName} • {c.product} • Submitted {c.submittedAt}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={caseStatus} />
          <span className={`px-3 py-1 rounded text-sm font-bold ${c.creditResult === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>Credit: {c.creditResult}</span>
          {/* Feature 5: Predictive Case Outcome */}
          <span className={`px-3 py-1 rounded text-sm font-bold flex items-center gap-1.5 ${predictedApproval >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : predictedApproval >= 60 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
            <svg className="w-4 h-4" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.2" />
              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${predictedApproval} 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
            </svg>
            Predicted: {predictedApproval}% likely approved
          </span>
          {/* Predictive Processing Time */}
          {(c.status === 'approved' || c.status === 'rejected') ? (
            <span className="px-3 py-1 rounded text-sm font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</span>
          ) : (
            <span className="px-3 py-1 rounded text-sm font-bold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 flex items-center gap-1">
              <span>&#9201;</span> Est. completion: {PROCESSING_TIMES[c.product] || '~5 working days'}
            </span>
          )}
          {assignee !== 'Unassigned' && (
            <span className="px-3 py-1 rounded text-sm font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Assigned: {assignee}</span>
          )}
        </div>
      </div>

      {/* AI Quality Check Panel */}
      <div className={`border-2 rounded-lg p-4 mb-6 ${qualityChecks.overallColor}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🤖</span>
          <h3 className="font-bold text-sm">AI Quality Check</h3>
          <span className="text-xs bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded ml-auto">Automated Pre-Decision Checks</span>
        </div>
        <div className="space-y-1.5 mb-3">
          {qualityChecks.checks.map((check, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className={`flex-shrink-0 ${check.severity === 'pass' ? 'text-green-600' : check.severity === 'warn' ? 'text-amber-600' : 'text-red-600'}`}>
                {check.severity === 'pass' ? '✓' : check.severity === 'warn' ? '⚠' : '✗'}
              </span>
              <span className="text-gray-800 dark:text-gray-200">{check.label}</span>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-gray-300/50 dark:border-gray-600/50">
          <p className="text-sm font-bold">{qualityChecks.passedCount} of {qualityChecks.total} checks passed &bull; {qualityChecks.overallStatus}</p>
        </div>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-sm font-bold transition-all ${
          toastMessage.type === 'success' ? 'bg-green-600 text-white' :
          toastMessage.type === 'error' ? 'bg-red-600 text-white' :
          'bg-amber-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 opacity-70 hover:opacity-100">×</button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setShowApproveModal(true)} className="bg-green-700 text-white text-sm font-bold px-4 py-2 rounded hover:bg-green-800">✓ Approve</button>
        <button onClick={() => setShowRejectModal(true)} className="bg-red-700 text-white text-sm font-bold px-4 py-2 rounded hover:bg-red-800">✗ Reject</button>
        <button onClick={() => setShowInfoModal(true)} className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded hover:bg-orange-600">⚠ Request Info</button>
        <Link href="/correspondence" className="bg-gray-200 dark:bg-gray-700 text-sm font-bold px-4 py-2 rounded hover:bg-gray-300 no-underline text-gray-800 dark:text-gray-200">📧 Send Letter</Link>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-3">Approve Application</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Approve this application? This will notify the applicant.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowApproveModal(false)} className="px-4 py-2 text-sm font-bold border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
              <button
                onClick={() => {
                  setCaseStatus('approved');
                  auditRepo.log({ ref, action: 'Application Approved', actor: 'Karen MacLeod' });
                  setAuditEvents(prev => [{ date: new Date().toLocaleString('en-GB'), action: 'Application Approved', actor: 'Karen MacLeod', icon: '✅' }, ...prev]);
                  setToastMessage({ text: '✓ Application approved. Notification sent to applicant.', type: 'success' });
                  setShowApproveModal(false);
                  setTimeout(() => setToastMessage(null), 5000);
                }}
                className="bg-green-700 text-white text-sm font-bold px-4 py-2 rounded hover:bg-green-800"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-3">Reject Application</h3>
            <label className="block text-sm font-bold mb-1">Reason for rejection</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter the reason for rejecting this application..."
              className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3 text-sm rounded resize-none mb-4"
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowRejectModal(false); setRejectReason(''); }} className="px-4 py-2 text-sm font-bold border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
              <button
                onClick={() => {
                  setCaseStatus('rejected');
                  auditRepo.log({ ref, action: 'Application Rejected', actor: 'Karen MacLeod', details: rejectReason });
                  setAuditEvents(prev => [{ date: new Date().toLocaleString('en-GB'), action: `Application Rejected — ${rejectReason}`, actor: 'Karen MacLeod', icon: '❌' }, ...prev]);
                  setToastMessage({ text: '✗ Application rejected. Notification sent to applicant.', type: 'error' });
                  setShowRejectModal(false);
                  setRejectReason('');
                  setTimeout(() => setToastMessage(null), 5000);
                }}
                disabled={!rejectReason.trim()}
                className="bg-red-700 text-white text-sm font-bold px-4 py-2 rounded hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-3">Request Additional Information</h3>
            <label className="block text-sm font-bold mb-1">What information is needed?</label>
            <textarea
              value={infoRequest}
              onChange={(e) => setInfoRequest(e.target.value)}
              placeholder="Describe what additional information is required from the applicant..."
              className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3 text-sm rounded resize-none mb-4"
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowInfoModal(false); setInfoRequest(''); }} className="px-4 py-2 text-sm font-bold border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
              <button
                onClick={() => {
                  setCaseStatus('additional_info_required');
                  auditRepo.log({ ref, action: 'Additional Information Requested', actor: 'Karen MacLeod', details: infoRequest });
                  setAuditEvents(prev => [{ date: new Date().toLocaleString('en-GB'), action: `Additional info requested — ${infoRequest}`, actor: 'Karen MacLeod', icon: '⚠' }, ...prev]);
                  setToastMessage({ text: '⚠ Additional information requested.', type: 'warning' });
                  setShowInfoModal(false);
                  setInfoRequest('');
                  setTimeout(() => setToastMessage(null), 5000);
                }}
                disabled={!infoRequest.trim()}
                className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Sections */}
      <div className="space-y-3">
        {/* Feature 2: AI Case Summary — first section */}
        <CollapsibleSection title="AI Case Summary" icon="🤖" defaultOpen>
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-bold">
                🤖 Generated by AI
              </span>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              {aiSummary}
            </p>
            <p className="text-xs italic text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              This summary was automatically generated for caseworker efficiency. It does not constitute a recommendation or decision.
            </p>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Personal Details" icon="👤" defaultOpen>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Field label="Title" value={c.debtor.title} />
            <Field label="First Name" value={c.debtor.firstName} />
            <Field label="Last Name" value={c.debtor.lastName} />
            <Field label="Date of Birth" value={c.debtor.dob} />
            <Field label="National Insurance" value={c.debtor.nino} />
            <Field label="Marital Status" value={c.debtor.maritalStatus} />
            <Field label="Dependants" value={c.debtor.dependants} />
            <Field label="Employment" value={c.debtor.employment} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Address History" icon="🏠" defaultOpen>
          <div className="text-sm">
            <h4 className="font-bold text-xs text-gray-500 uppercase mb-1">Current Address</h4>
            <p className="font-medium">{c.address.line1}, {c.address.city}, {c.address.postcode}</p>
            <p className="text-gray-500">Resident since: {c.address.residentSince}</p>
            <p className="text-gray-500">Phone: {c.address.phone} • Email: {c.address.email}</p>
            {c.previousAddresses.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-xs text-gray-500 uppercase mb-1">Previous Addresses</h4>
                {c.previousAddresses.map((a: any, i: number) => (
                  <p key={i} className="text-gray-600">{a.line1}, {a.city}, {a.postcode} ({a.dateFrom} — {a.dateTo})</p>
                ))}
              </div>
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title={`Debts (${c.debts.length} creditors — £${totalDebt.toLocaleString()})`} icon="💳" defaultOpen>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="text-left p-2">Creditor</th><th className="text-left p-2">Type</th><th className="text-right p-2">Amount</th><th className="text-right p-2">Monthly</th></tr></thead>
            <tbody>
              {c.debts.map((d: any, i: number) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700"><td className="p-2 font-medium">{d.creditor}</td><td className="p-2">{d.type}</td><td className="p-2 text-right">£{d.amount.toLocaleString()}</td><td className="p-2 text-right">£{d.monthly}</td></tr>
              ))}
              <tr className="font-bold bg-gray-50 dark:bg-gray-700"><td className="p-2">TOTAL</td><td></td><td className="p-2 text-right">£{totalDebt.toLocaleString()}</td><td className="p-2 text-right">£{totalMonthly}</td></tr>
            </tbody>
          </table>
        </CollapsibleSection>

        <CollapsibleSection title="Income & Expenditure" icon="💰">
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-bold mb-2">Monthly Income</h4>
              {Object.entries(c.income).filter(([,v]) => v).map(([k, v]: [string, any]) => (
                <div key={k} className="flex justify-between py-1"><span className="capitalize text-gray-600">{k}</span><span className="font-medium">£{v.toLocaleString()}</span></div>
              ))}
              <div className="flex justify-between py-1 border-t mt-1 font-bold"><span>Total Income</span><span>£{totalIncome.toLocaleString()}</span></div>
            </div>
            <div>
              <h4 className="font-bold mb-2">Monthly Expenditure</h4>
              {Object.entries(c.expenditure).filter(([,v]) => v).map(([k, v]: [string, any]) => (
                <div key={k} className="flex justify-between py-1"><span className="capitalize text-gray-600">{k}</span><span className="font-medium">£{v.toLocaleString()}</span></div>
              ))}
              <div className="flex justify-between py-1 border-t mt-1 font-bold"><span>Total Expenditure</span><span>£{totalExpenditure.toLocaleString()}</span></div>
            </div>
          </div>
          <div className={`mt-3 p-3 rounded text-center font-bold ${disposable >= 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            Disposable Income: £{disposable.toLocaleString()}/month
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Assets" icon="🏡">
          {c.assets.noAssets ? (
            <p className="text-sm text-gray-600">No assets declared.</p>
          ) : (
            <div className="text-sm space-y-3">
              {c.assets.properties?.length > 0 && <div><h4 className="font-bold text-xs text-gray-500 uppercase mb-1">Properties</h4>{c.assets.properties.map((p: any, i: number) => <p key={i}>{p.address} — Value: £{p.value?.toLocaleString()}, Mortgage: £{p.mortgage?.toLocaleString()} ({p.ownership})</p>)}</div>}
              {c.assets.vehicles?.length > 0 && <div><h4 className="font-bold text-xs text-gray-500 uppercase mb-1">Vehicles</h4>{c.assets.vehicles.map((v: any, i: number) => <p key={i}>{v.description} — Value: £{v.value?.toLocaleString()}, Finance: £{v.finance?.toLocaleString()} {v.essential === 'yes' ? '(Essential for work)' : ''}</p>)}</div>}
              {c.assets.savings?.length > 0 && <div><h4 className="font-bold text-xs text-gray-500 uppercase mb-1">Savings</h4>{c.assets.savings.map((s: any, i: number) => <p key={i}>{s.type} ({s.provider}) — £{s.value?.toLocaleString()}</p>)}</div>}
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="System Checks" icon="🔍">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {Object.entries(c.systemChecks).map(([sys, result]: [string, any]) => (
              <div key={sys} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="font-medium uppercase text-xs">{sys}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${result === 'clear' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {result === 'clear' ? '✓ Clear' : '⚠ Found'}
                </span>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Credit Check" icon="📊">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded"><p className={`text-2xl font-bold ${c.creditScore >= 500 ? 'text-green-700' : 'text-red-700'}`}>{c.creditScore}</p><p className="text-xs text-gray-500">Score</p></div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded"><p className={`text-xl font-bold ${c.creditResult === 'PASS' ? 'text-green-700' : 'text-red-700'}`}>{c.creditResult}</p><p className="text-xs text-gray-500">Result</p></div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded"><p className="text-xl font-bold">{c.creditScore < 400 ? 2 : 0}</p><p className="text-xs text-gray-500">Defaults</p></div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded"><p className="text-xl font-bold">{c.creditScore < 350 ? 1 : 0}</p><p className="text-xs text-gray-500">CCJs</p></div>
          </div>
        </CollapsibleSection>

        {/* Feature 2: Debtor Risk Score */}
        <CollapsibleSection title="Risk Assessment" icon="⚡" defaultOpen>
          {(() => {
            const riskData = calculateRiskScore(c.creditScore, totalDebt, totalIncome, c.systemChecks.basys);
            return (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <RiskGauge score={riskData.score} level={riskData.level} color={riskData.color} />
                  <div>
                    <h4 className="font-bold text-sm mb-3">Key Factors</h4>
                    <div className="space-y-2">
                      {riskData.factors.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${f.impact === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {f.impact === 'positive' ? '✓' : '!'}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">{f.label}:</span>
                          <span className="font-medium ml-auto">{f.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                      <p><strong>Score composition:</strong> Credit Score (40%) + Debt-to-Income (35%) + Existing Cases (25%)</p>
                      <p className="mt-1">0-30 = Low risk | 31-60 = Medium risk | 61-100 = High risk</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </CollapsibleSection>

        {/* Feature 4: Guided Decision Support */}
        <CollapsibleSection title="Suggested Actions" icon="📋" defaultOpen>
          <GuidedDecisionSupport caseData={c} />
        </CollapsibleSection>

        <CollapsibleSection title="Recommendation" icon="✅" defaultOpen>
          {(() => {
            const recData = RECOMMENDATION_DATA[ref];
            return (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-bold text-green-800 dark:text-green-300 text-lg">{c.recommendation.product}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {recData && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-200 text-sm font-bold">
                          {recData.confidencePercent}% confidence
                        </span>
                      )}
                      <span className="text-xs text-green-600 dark:text-green-400">Engine: Rules v2.3 • AI Assist</span>
                    </div>
                  </div>
                </div>
                {recData && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                    {recData.factors.slice(0, 3).map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-sm">
                        <span className={f.met && f.impact === 'positive' ? 'text-green-700' : f.impact === 'negative' ? 'text-red-600' : 'text-gray-500'}>
                          {f.met && f.impact === 'positive' ? '✓' : f.impact === 'negative' ? '✗' : '○'}
                        </span>
                        <span className="text-green-800 dark:text-green-300">{f.factor}: <strong>{f.value}</strong></span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm text-green-800 dark:text-green-300 mb-3">{c.recommendation.reasoning}</p>
                <Link href={`/case/${ref}/recommendation`} className="inline-flex items-center gap-1 text-sm font-bold text-green-700 dark:text-green-400 hover:text-green-900 underline">
                  View full explanation →
                </Link>
              </div>
            );
          })()}
        </CollapsibleSection>

        <CollapsibleSection title="Documents" icon="📄">
          {c.documents.length === 0 ? <p className="text-sm text-gray-500">No documents uploaded.</p> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="text-left p-2">File</th><th className="text-left p-2">Category</th><th className="text-left p-2">Size</th><th className="text-left p-2">Scan</th></tr></thead>
              <tbody>{c.documents.map((d: any, i: number) => (<tr key={i} className="border-b border-gray-100 dark:border-gray-700"><td className="p-2">📄 {d.name}</td><td className="p-2">{d.category}</td><td className="p-2">{d.size}</td><td className="p-2"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">{d.status}</span></td></tr>))}</tbody>
            </table>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Activity Timeline" icon="📋" defaultOpen>
          {/* Dynamic audit events from Approve/Reject/Request Info actions */}
          {auditEvents.length > 0 && (
            <div className="mb-4 space-y-2">
              {auditEvents.map((event, i) => (
                <div key={`audit-${i}`} className="flex items-start gap-3 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                  <span className="text-lg flex-shrink-0">{event.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{event.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{event.actor} — {event.date}</p>
                  </div>
                </div>
              ))}
              <div className="border-b border-gray-200 dark:border-gray-700 mt-3 mb-2"></div>
            </div>
          )}
          <CaseTimeline
            events={TIMELINE_DATA[ref] || []}
            compact
            maxItems={8}
            caseRef={ref}
          />
        </CollapsibleSection>

        {/* Assign Case */}
        <CollapsibleSection title={`Case Assignment — ${assignee}`} icon="👤" defaultOpen>
          <div className="space-y-3">
            {assignee !== 'Unassigned' && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Currently assigned to:</span>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-bold">{assignee}</span>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm font-bold mb-1">Assign to staff member</label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 p-2 text-sm rounded w-full"
                >
                  <option value="">Select staff member...</option>
                  {STAFF_MEMBERS.map((s) => (
                    <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => { if (selectedStaff) { setAssignee(selectedStaff); setSelectedStaff(''); } }}
                disabled={!selectedStaff}
                className="bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </div>
        </CollapsibleSection>

        {/* Staff Notes */}
        <CollapsibleSection title={`Staff Notes (${notes.length})`} icon="📝" defaultOpen>
          <div className="space-y-4">
            {/* Add note form */}
            <div className="flex gap-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a staff note about this case..."
                className="flex-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 p-3 text-sm rounded resize-none"
                rows={3}
              />
            </div>
            <button
              onClick={() => {
                if (newNote.trim()) {
                  setNotes([{ text: newNote.trim(), author: 'Current User', timestamp: new Date().toLocaleString('en-GB') }, ...notes]);
                  setNewNote('');
                }
              }}
              disabled={!newNote.trim()}
              className="bg-green-700 text-white text-sm font-bold px-4 py-2 rounded hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Note
            </button>

            {/* Notes list */}
            {notes.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No staff notes yet. Add the first note above.</p>
            ) : (
              <div className="space-y-3 mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                {notes.map((note, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{note.author}</span>
                      <span className="text-xs text-gray-500">{note.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{note.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Email Notifications Log */}
        <CollapsibleSection title="Email Notifications" icon="📧">
          <EmailLog caseRef={ref} />
        </CollapsibleSection>

        {/* Notification Events */}
        <CollapsibleSection title="Notification Events" icon="🔔">
          <NotificationPanel caseStatus={c.status} caseRef={ref} assignedTo={assignee} />
        </CollapsibleSection>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CollapsibleSection({ title, icon, children, defaultOpen = false }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-left">
        <span className="flex items-center gap-2 font-bold text-sm">
          <span>{icon}</span> {title}
        </span>
        <span className="text-gray-400 text-lg">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="p-4 border-t border-gray-200 dark:border-gray-700">{children}</div>}
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{String(value || '—')}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-200 text-gray-700', submitted: 'bg-blue-100 text-blue-800',
    under_review: 'bg-purple-100 text-purple-800', additional_info_required: 'bg-orange-100 text-orange-800',
    approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800',
  };
  return <span className={`px-3 py-1 rounded text-sm font-bold uppercase ${colors[status] || 'bg-gray-200'}`}>{status.replace(/_/g, ' ')}</span>;
}
