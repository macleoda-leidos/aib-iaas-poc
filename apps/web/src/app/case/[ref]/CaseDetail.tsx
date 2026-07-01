'use client';

import { useState, Suspense } from 'react';
import { useParams } from 'next/navigation';

const CASES: Record<string, any> = {
  'IAAS-2026-00012': { ref: 'IAAS-2026-00012', debtor: { name: 'Alistair Morrison', dob: '1988-11-22', nino: 'AB654321C', address: '15 Highland Road, Edinburgh, EH3 5AA', phone: '07700900012', email: 'a.morrison@example.com', employment: 'Employed', maritalStatus: 'Married', dependants: 1 }, status: 'submitted', product: 'DAS', assignedTo: 'Unassigned', totalDebt: 18400, submittedAt: '29 Jun 2026', creditScore: 620, creditResult: 'PASS',
    debts: [{ creditor: 'Royal Bank of Scotland', type: 'Personal Loan', amount: 8200, monthly: 180 }, { creditor: 'Barclays Card', type: 'Credit Card', amount: 5400, monthly: 120 }, { creditor: 'Glasgow Council', type: 'Council Tax', amount: 2800, monthly: 0 }, { creditor: 'ScotPower', type: 'Utility', amount: 2000, monthly: 85 }],
    documents: [{ name: 'payslip_june_2026.pdf', category: 'Income', size: '234 KB', uploaded: '29 Jun', status: 'Clean' }, { name: 'bank_statement_may.pdf', category: 'Income', size: '1.1 MB', uploaded: '29 Jun', status: 'Clean' }, { name: 'council_tax_notice.pdf', category: 'Debt', size: '89 KB', uploaded: '29 Jun', status: 'Clean' }],
    notes: [{ author: 'System', date: '29 Jun 14:32', content: 'Application submitted via IAAS portal', type: 'system' }, { author: 'System', date: '29 Jun 14:33', content: 'Credit check completed — score 620 (PASS)', type: 'system' }, { author: 'System', date: '29 Jun 14:34', content: 'Cross-system check: no duplicates found', type: 'system' }, { author: 'System', date: '29 Jun 14:35', content: 'Product recommendation: DAS (high confidence)', type: 'system' }],
    transactions: [{ date: '29 Jun 14:32', action: 'Application Created', actor: 'Alistair Morrison', status: 'ok' }, { date: '29 Jun 14:33', action: 'Credit Check Run (Equifax)', actor: 'System', status: 'ok' }, { date: '29 Jun 14:34', action: 'Integration Checks (6 systems)', actor: 'System', status: 'ok' }, { date: '29 Jun 14:35', action: 'Recommendation Generated', actor: 'System', status: 'ok' }, { date: '29 Jun 14:36', action: 'Notification: Email sent', actor: 'System', status: 'ok' }],
  },
  'IAAS-2026-00011': { ref: 'IAAS-2026-00011', debtor: { name: 'Brenda Campbell', dob: '1975-04-18', nino: 'CD987654B', address: '8 Castle Street, Glasgow, G2 1AB', phone: '07700900011', email: 'b.campbell@example.com', employment: 'Unemployed', maritalStatus: 'Single', dependants: 0 }, status: 'under_review', product: 'MAP', assignedTo: 'James Wilson', totalDebt: 9200, submittedAt: '28 Jun 2026', creditScore: 340, creditResult: 'FAIL',
    debts: [{ creditor: 'QuickLoans Ltd', type: 'Payday Loan', amount: 3500, monthly: 0 }, { creditor: 'Catalogue Co', type: 'Catalogue', amount: 2700, monthly: 45 }, { creditor: 'HMRC', type: 'Tax', amount: 1800, monthly: 0 }, { creditor: 'Water Board', type: 'Utility', amount: 1200, monthly: 0 }],
    documents: [{ name: 'benefit_letter.pdf', category: 'Income', size: '156 KB', uploaded: '28 Jun', status: 'Clean' }, { name: 'debt_letters.pdf', category: 'Debt', size: '445 KB', uploaded: '28 Jun', status: 'Clean' }],
    notes: [{ author: 'System', date: '28 Jun 15:20', content: 'Application submitted', type: 'system' }, { author: 'System', date: '28 Jun 15:21', content: 'Credit check — score 340 (FAIL). 2 defaults found.', type: 'system' }, { author: 'James Wilson', date: '29 Jun 09:15', content: 'Reviewing application. Credit score below threshold but MAP eligibility likely met.', type: 'staff' }],
    transactions: [{ date: '28 Jun 15:20', action: 'Application Created', actor: 'Brenda Campbell', status: 'ok' }, { date: '28 Jun 15:21', action: 'Credit Check (FAIL — 340)', actor: 'System', status: 'warn' }, { date: '29 Jun 09:00', action: 'Assigned to James Wilson', actor: 'Karen MacLeod', status: 'ok' }, { date: '29 Jun 09:15', action: 'Staff Note Added', actor: 'James Wilson', status: 'ok' }],
  },
};

const DEFAULT_CASE = { ref: 'Unknown', debtor: { name: 'Case not found', dob: '', nino: '', address: '', phone: '', email: '', employment: '', maritalStatus: '', dependants: 0 }, status: 'draft', product: '—', assignedTo: '—', totalDebt: 0, submittedAt: '—', creditScore: 0, creditResult: '—', debts: [], documents: [], notes: [], transactions: [] };

export default function CaseDetail() {
  return <Suspense fallback={<div className="p-8">Loading case...</div>}><CaseContent /></Suspense>;
}

function CaseContent() {
  const params = useParams();
  const ref = params.ref as string;
  const caseData = CASES[ref] || { ...DEFAULT_CASE, ref };
  const [activeTab, setActiveTab] = useState('overview');
  const tabs = ['overview', 'debts', 'documents', 'notes', 'transactions', 'credit'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <a href="/dashboard" className="text-blue-700 text-sm underline mb-3 inline-block">← Back to Dashboard</a>
      <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{caseData.ref}</h1>
          <p className="text-gray-600">{caseData.debtor.name} • {caseData.product} • Submitted {caseData.submittedAt}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded text-sm font-bold uppercase ${caseData.status === 'submitted' ? 'bg-blue-100 text-blue-800' : caseData.status === 'under_review' ? 'bg-purple-100 text-purple-800' : 'bg-gray-200 text-gray-700'}`}>{caseData.status.replace(/_/g, ' ')}</span>
          <span className={`px-3 py-1 rounded text-sm font-bold ${caseData.creditResult === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>Credit: {caseData.creditResult}</span>
        </div>
      </div>
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="font-bold mb-3">Debtor Details</h3>
            <dl className="space-y-2 text-sm">
              {Object.entries({ Name: caseData.debtor.name, 'Date of Birth': caseData.debtor.dob, 'NI Number': caseData.debtor.nino, Address: caseData.debtor.address, Phone: caseData.debtor.phone, Email: caseData.debtor.email, Employment: caseData.debtor.employment, 'Marital Status': caseData.debtor.maritalStatus, Dependants: caseData.debtor.dependants }).map(([k, v]) => (
                <div key={k} className="flex justify-between"><dt className="text-gray-500">{k}</dt><dd className="font-medium text-right max-w-[200px]">{String(v)}</dd></div>
              ))}
            </dl>
          </div>
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded p-4">
              <h3 className="font-bold mb-3">Case Summary</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Total Debt</dt><dd className="font-bold text-lg">£{caseData.totalDebt.toLocaleString()}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Product</dt><dd className="font-bold">{caseData.product}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Assigned To</dt><dd>{caseData.assignedTo}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Credit Score</dt><dd>{caseData.creditScore}/999</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Creditors</dt><dd>{caseData.debts.length}</dd></div>
              </dl>
            </div>
            <div className="flex gap-2"><button className="bg-green-700 text-white text-sm font-bold px-4 py-2 rounded">✓ Approve</button><button className="bg-red-700 text-white text-sm font-bold px-4 py-2 rounded">✗ Reject</button><button className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded">⚠ Request Info</button></div>
          </div>
        </div>
      )}
      {activeTab === 'debts' && (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="text-left p-3">Creditor</th><th className="text-left p-3">Type</th><th className="text-right p-3">Amount</th><th className="text-right p-3">Monthly</th></tr></thead>
            <tbody>{caseData.debts.map((d: any, i: number) => (<tr key={i} className="border-b"><td className="p-3 font-medium">{d.creditor}</td><td className="p-3">{d.type}</td><td className="p-3 text-right font-bold">£{d.amount.toLocaleString()}</td><td className="p-3 text-right">£{d.monthly}</td></tr>))}
              <tr className="bg-gray-50 font-bold"><td className="p-3">TOTAL</td><td></td><td className="p-3 text-right">£{caseData.totalDebt.toLocaleString()}</td><td className="p-3 text-right">£{caseData.debts.reduce((s: number, d: any) => s + d.monthly, 0)}</td></tr></tbody></table>
        </div>
      )}
      {activeTab === 'documents' && (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="text-left p-3">File</th><th className="text-left p-3">Category</th><th className="text-left p-3">Size</th><th className="text-left p-3">Uploaded</th><th className="text-left p-3">Scan</th></tr></thead>
            <tbody>{caseData.documents.map((d: any, i: number) => (<tr key={i} className="border-b"><td className="p-3">📄 {d.name}</td><td className="p-3">{d.category}</td><td className="p-3">{d.size}</td><td className="p-3">{d.uploaded}</td><td className="p-3"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">{d.status}</span></td></tr>))}</tbody></table>
        </div>
      )}
      {activeTab === 'notes' && (
        <div className="space-y-3">{caseData.notes.map((n: any, i: number) => (
          <div key={i} className={`p-3 rounded border-l-4 ${n.type === 'staff' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
            <div className="flex justify-between text-xs text-gray-500 mb-1"><span className="font-bold">{n.author}</span><span>{n.date}</span></div>
            <p className="text-sm">{n.content}</p>
          </div>
        ))}</div>
      )}
      {activeTab === 'transactions' && (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="text-left p-3">Date</th><th className="text-left p-3">Action</th><th className="text-left p-3">Actor</th><th className="text-left p-3">Status</th></tr></thead>
            <tbody>{caseData.transactions.map((t: any, i: number) => (<tr key={i} className="border-b"><td className="p-3 text-xs">{t.date}</td><td className="p-3 font-medium">{t.action}</td><td className="p-3">{t.actor}</td><td className="p-3"><span className={`text-xs font-bold ${t.status === 'ok' ? 'text-green-700' : 'text-amber-700'}`}>{t.status === 'ok' ? '✓' : '⚠'}</span></td></tr>))}</tbody></table>
        </div>
      )}
      {activeTab === 'credit' && (
        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded"><p className={`text-2xl font-bold ${caseData.creditScore >= 500 ? 'text-green-700' : 'text-red-700'}`}>{caseData.creditScore}</p><p className="text-xs text-gray-500">Score</p></div>
            <div className="text-center p-3 bg-gray-50 rounded"><p className="text-2xl font-bold">{caseData.creditResult}</p><p className="text-xs text-gray-500">Result</p></div>
            <div className="text-center p-3 bg-gray-50 rounded"><p className="text-2xl font-bold">{caseData.creditScore < 400 ? 2 : 0}</p><p className="text-xs text-gray-500">Defaults</p></div>
            <div className="text-center p-3 bg-gray-50 rounded"><p className="text-2xl font-bold">{caseData.creditScore < 350 ? 1 : 0}</p><p className="text-xs text-gray-500">CCJs</p></div>
          </div>
          <p className="text-xs text-gray-500">Provider: Equifax (Sandbox) • Checked: {caseData.submittedAt}</p>
        </div>
      )}
    </div>
  );
}
