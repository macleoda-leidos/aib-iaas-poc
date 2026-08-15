'use client';

import { useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

export default function CaseDetail() {
  return <Suspense fallback={<div className="p-8">Loading case...</div>}><CaseContent /></Suspense>;
}

function CaseContent() {
  const params = useParams();
  const ref = params.ref as string;
  const c = CASES[ref];

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <Link href="/dashboard" className="text-blue-700 text-sm underline mb-3 inline-block">← Back to Dashboard</Link>
      <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono">{c.ref}</h1>
          <p className="text-gray-600 dark:text-gray-400">{c.debtor.firstName} {c.debtor.lastName} • {c.product} • Submitted {c.submittedAt}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={c.status} />
          <span className={`px-3 py-1 rounded text-sm font-bold ${c.creditResult === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>Credit: {c.creditResult}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <button className="bg-green-700 text-white text-sm font-bold px-4 py-2 rounded hover:bg-green-800">✓ Approve</button>
        <button className="bg-red-700 text-white text-sm font-bold px-4 py-2 rounded hover:bg-red-800">✗ Reject</button>
        <button className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded hover:bg-orange-600">⚠ Request Info</button>
        <Link href="/correspondence" className="bg-gray-200 dark:bg-gray-700 text-sm font-bold px-4 py-2 rounded hover:bg-gray-300 no-underline text-gray-800 dark:text-gray-200">📧 Send Letter</Link>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-3">
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

        <CollapsibleSection title="Recommendation" icon="✅">
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 rounded p-4">
            <p className="font-bold text-green-800 dark:text-green-300 text-lg">{c.recommendation.product}</p>
            <p className="text-sm text-green-700 dark:text-green-400 mb-2">Confidence: {c.recommendation.confidence}</p>
            <p className="text-sm">{c.recommendation.reasoning}</p>
          </div>
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
          <div className="space-y-3">
            {c.timeline.map((t: any, i: number) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm">{t.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.action}</p>
                  <p className="text-xs text-gray-500">{t.actor} • {t.date}</p>
                </div>
              </div>
            ))}
          </div>
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
