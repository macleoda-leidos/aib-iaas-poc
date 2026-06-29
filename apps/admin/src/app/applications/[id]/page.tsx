'use client';

import { useState } from 'react';

// Synthetic application detail for POC
const APP_DETAIL = {
  id: '1',
  referenceNumber: 'IAAS-2024-00001',
  status: 'under_review',
  createdAt: '2024-03-15T10:30:00Z',
  submittedAt: '2024-03-15T11:45:00Z',
  debtor: { title: 'Mr', firstName: 'John', lastName: 'Testerton', dateOfBirth: '1985-03-15', nino: 'AB123456C', maritalStatus: 'Married', dependants: 2, employment: 'Employed' },
  address: { line1: '42 Example Street', city: 'Edinburgh', postcode: 'EH1 1AA', residenceSince: '2018-06-01' },
  contact: { email: 'john.testerton@example.com', phone: '07700900001', preferred: 'Email' },
  debts: {
    total: 12700,
    creditors: 3,
    items: [
      { creditor: 'Sample Bank PLC', type: 'Bank', outstanding: 7200, monthly: 150, arrears: true },
      { creditor: 'TestCard Services', type: 'Credit Card', outstanding: 3400, monthly: 85, arrears: false },
      { creditor: 'QuickLoans Ltd', type: 'Loan', outstanding: 2100, monthly: 80, arrears: true },
    ],
  },
  income: { wages: 1800, benefits: 200, pension: 0, other: 50, total: 2050 },
  expenditure: { rent: 650, councilTax: 120, utilities: 180, food: 350, transport: 150, insurance: 80, childcare: 200, other: 100, total: 1830 },
  disposableIncome: 220,
  creditCheck: { score: 520, band: 'Fair', defaults: 1, ccjs: 0, provider: 'SyntheticCredit Ltd', checkedAt: '2024-03-15T11:50:00Z' },
  systemChecks: [
    { system: 'BASYS', found: false, status: 'No record' },
    { system: 'eDEN/DASH', found: false, status: 'No arrangement' },
    { system: 'DAS', found: false, status: 'No programme' },
    { system: 'CFT', found: true, status: '3 providers available' },
    { system: 'Moratorium', found: false, status: 'No moratorium' },
    { system: 'RoI', found: false, status: 'No entry' },
  ],
  recommendation: { product: 'Debt Arrangement Scheme', confidence: 'High', reasoning: ['Debt within DAS range', 'Has disposable income', 'No existing cases'] },
  documents: [
    { name: 'payslip_march_2024.pdf', size: '245 KB', category: 'Income Evidence', status: 'Clean' },
    { name: 'bank_statement.pdf', size: '1.2 MB', category: 'Income Evidence', status: 'Clean' },
    { name: 'council_tax_bill.pdf', size: '89 KB', category: 'Debt Evidence', status: 'Clean' },
  ],
  staffNotes: [
    { author: 'James Wilson', date: '2024-03-16 09:15', type: 'Review', content: 'Application complete. All documents verified. Debtor eligible for DAS based on income and debt levels.' },
  ],
  auditTrail: [
    { timestamp: '2024-03-15 10:30', action: 'Application Created', actor: 'John Testerton', actorType: 'Applicant' },
    { timestamp: '2024-03-15 11:45', action: 'Application Submitted', actor: 'John Testerton', actorType: 'Applicant' },
    { timestamp: '2024-03-15 11:46', action: 'System Checks Initiated', actor: 'System', actorType: 'System' },
    { timestamp: '2024-03-15 11:50', action: 'Credit Check Completed', actor: 'System', actorType: 'System' },
    { timestamp: '2024-03-15 11:51', action: 'Recommendation Generated', actor: 'System', actorType: 'System' },
    { timestamp: '2024-03-16 09:00', action: 'Assigned to James Wilson', actor: 'Karen MacLeod', actorType: 'Staff' },
    { timestamp: '2024-03-16 09:15', action: 'Review Note Added', actor: 'James Wilson', actorType: 'Staff' },
  ],
};

export default function ApplicationDetailPage() {
  const app = APP_DETAIL;
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <a href="/" className="text-gov-blue text-sm underline mb-2 inline-block">← Back to dashboard</a>
          <h1 className="text-2xl font-bold">{app.referenceNumber}</h1>
          <p className="text-gray-600">{app.debtor.firstName} {app.debtor.lastName} — Submitted {new Date(app.submittedAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm font-bold uppercase">{app.status.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Action bar */}
      <div className="bg-white border border-gray-200 rounded p-4 mb-6 flex flex-wrap gap-3">
        <button className="bg-gov-green text-white text-sm font-bold px-4 py-2 rounded hover:bg-green-800">✓ Approve</button>
        <button className="bg-gov-red text-white text-sm font-bold px-4 py-2 rounded hover:bg-red-800">✗ Reject</button>
        <button className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded hover:bg-orange-600">⚠ Request More Info</button>
        <button className="bg-gov-blue text-white text-sm font-bold px-4 py-2 rounded hover:bg-gov-dark-blue">↗ Reassign</button>
        <button className="bg-gray-200 text-gray-800 text-sm font-bold px-4 py-2 rounded hover:bg-gray-300">📋 Export PDF</button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        {['overview', 'financial', 'checks', 'documents', 'notes', 'audit'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 mr-1 ${activeTab === tab ? 'border-gov-blue text-gov-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Section title="Personal Details">
            <Field label="Name" value={`${app.debtor.title} ${app.debtor.firstName} ${app.debtor.lastName}`} />
            <Field label="Date of Birth" value={app.debtor.dateOfBirth} />
            <Field label="NI Number" value={app.debtor.nino} />
            <Field label="Marital Status" value={app.debtor.maritalStatus} />
            <Field label="Dependants" value={String(app.debtor.dependants)} />
            <Field label="Employment" value={app.debtor.employment} />
          </Section>
          <Section title="Address & Contact">
            <Field label="Address" value={`${app.address.line1}, ${app.address.city}, ${app.address.postcode}`} />
            <Field label="Resident Since" value={app.address.residenceSince} />
            <Field label="Email" value={app.contact.email} />
            <Field label="Phone" value={app.contact.phone} />
            <Field label="Preferred Contact" value={app.contact.preferred} />
          </Section>
          <Section title="Recommendation">
            <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
              <p className="font-bold text-green-800">{app.recommendation.product}</p>
              <p className="text-sm text-green-700">Confidence: {app.recommendation.confidence}</p>
            </div>
            <ul className="text-sm space-y-1">
              {app.recommendation.reasoning.map((r, i) => <li key={i}>• {r}</li>)}
            </ul>
          </Section>
          <Section title="Summary">
            <Field label="Total Debt" value={`£${app.debts.total.toLocaleString()}`} />
            <Field label="Creditors" value={String(app.debts.creditors)} />
            <Field label="Monthly Income" value={`£${app.income.total}`} />
            <Field label="Monthly Expenditure" value={`£${app.expenditure.total}`} />
            <Field label="Disposable Income" value={`£${app.disposableIncome}/month`} highlight />
          </Section>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="space-y-6">
          <Section title="Debts">
            <table className="w-full text-sm">
              <thead><tr className="border-b-2 border-gray-900">
                <th className="text-left py-2">Creditor</th><th className="text-left py-2">Type</th>
                <th className="text-right py-2">Outstanding</th><th className="text-right py-2">Monthly</th><th className="text-left py-2">Arrears</th>
              </tr></thead>
              <tbody>
                {app.debts.items.map((d, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="py-2 font-bold">{d.creditor}</td><td className="py-2">{d.type}</td>
                    <td className="py-2 text-right">£{d.outstanding.toLocaleString()}</td>
                    <td className="py-2 text-right">£{d.monthly}</td>
                    <td className="py-2">{d.arrears ? <span className="text-red-700 font-bold">Yes</span> : 'No'}</td>
                  </tr>
                ))}
                <tr className="font-bold border-t-2 border-gray-900">
                  <td className="py-2">TOTAL</td><td></td>
                  <td className="py-2 text-right">£{app.debts.total.toLocaleString()}</td>
                  <td className="py-2 text-right">£{app.debts.items.reduce((s, d) => s + d.monthly, 0)}</td><td></td>
                </tr>
              </tbody>
            </table>
          </Section>
          <div className="grid md:grid-cols-2 gap-6">
            <Section title="Monthly Income">
              <Field label="Wages/Salary" value={`£${app.income.wages}`} />
              <Field label="Benefits" value={`£${app.income.benefits}`} />
              <Field label="Pension" value={`£${app.income.pension}`} />
              <Field label="Other" value={`£${app.income.other}`} />
              <Field label="TOTAL" value={`£${app.income.total}`} highlight />
            </Section>
            <Section title="Monthly Expenditure">
              <Field label="Rent" value={`£${app.expenditure.rent}`} />
              <Field label="Council Tax" value={`£${app.expenditure.councilTax}`} />
              <Field label="Utilities" value={`£${app.expenditure.utilities}`} />
              <Field label="Food" value={`£${app.expenditure.food}`} />
              <Field label="Transport" value={`£${app.expenditure.transport}`} />
              <Field label="TOTAL" value={`£${app.expenditure.total}`} highlight />
            </Section>
          </div>
        </div>
      )}

      {activeTab === 'checks' && (
        <div className="space-y-6">
          <Section title="Credit Check">
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded"><p className="text-2xl font-bold">{app.creditCheck.score}</p><p className="text-xs text-gray-500">Score (0-999)</p></div>
              <div className="text-center p-3 bg-gray-50 rounded"><p className="text-2xl font-bold">{app.creditCheck.band}</p><p className="text-xs text-gray-500">Band</p></div>
              <div className="text-center p-3 bg-gray-50 rounded"><p className="text-2xl font-bold">{app.creditCheck.defaults}</p><p className="text-xs text-gray-500">Defaults</p></div>
              <div className="text-center p-3 bg-gray-50 rounded"><p className="text-2xl font-bold">{app.creditCheck.ccjs}</p><p className="text-xs text-gray-500">CCJs</p></div>
            </div>
            <p className="text-xs text-gray-500">Provider: {app.creditCheck.provider} | Checked: {new Date(app.creditCheck.checkedAt).toLocaleString()}</p>
          </Section>
          <Section title="System Integration Checks">
            <table className="w-full text-sm">
              <thead><tr className="border-b-2"><th className="text-left py-2">System</th><th className="text-left py-2">Result</th><th className="text-left py-2">Details</th></tr></thead>
              <tbody>
                {app.systemChecks.map(c => (
                  <tr key={c.system} className="border-b border-gray-200">
                    <td className="py-2 font-bold">{c.system}</td>
                    <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs font-bold ${c.found ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>{c.found ? 'Found' : 'Clear'}</span></td>
                    <td className="py-2 text-gray-600">{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {activeTab === 'documents' && (
        <Section title="Uploaded Documents">
          <table className="w-full text-sm">
            <thead><tr className="border-b-2"><th className="text-left py-2">File</th><th className="text-left py-2">Category</th><th className="text-left py-2">Size</th><th className="text-left py-2">Scan Status</th><th className="text-left py-2">Action</th></tr></thead>
            <tbody>
              {app.documents.map((d, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-2 font-bold">📄 {d.name}</td>
                  <td className="py-2">{d.category}</td>
                  <td className="py-2">{d.size}</td>
                  <td className="py-2"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">{d.status}</span></td>
                  <td className="py-2"><button className="text-gov-blue underline text-xs">Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-6">
          <Section title="Staff Notes">
            {app.staffNotes.map((note, i) => (
              <div key={i} className="border-l-4 border-gov-blue pl-4 mb-4">
                <p className="text-sm font-bold">{note.author} <span className="font-normal text-gray-500">— {note.date}</span></p>
                <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">{note.type}</span>
                <p className="text-sm mt-1">{note.content}</p>
              </div>
            ))}
          </Section>
          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="font-bold mb-2">Add Note</h3>
            <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={3}
              className="w-full border-2 border-gray-900 p-2 text-sm mb-2" placeholder="Enter staff note..." />
            <div className="flex gap-2">
              <select className="border border-gray-300 p-2 text-sm rounded">
                <option>General</option><option>Review</option><option>Decision</option><option>Follow-up</option>
              </select>
              <button className="bg-gov-blue text-white text-sm px-4 py-2 rounded hover:bg-gov-dark-blue">Add Note</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <Section title="Audit Trail">
          <div className="space-y-3">
            {app.auditTrail.map((event, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-xs text-gray-400 w-36 flex-shrink-0">{event.timestamp}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0 ${event.actorType === 'System' ? 'bg-gray-100 text-gray-700' : event.actorType === 'Staff' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                  {event.actorType}
                </span>
                <span><strong>{event.action}</strong> — {event.actor}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded p-4 mb-4">
      <h3 className="font-bold mb-3 pb-2 border-b border-gray-200">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between py-1 text-sm ${highlight ? 'font-bold border-t border-gray-200 pt-2 mt-2' : ''}`}>
      <span className="text-gray-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}
