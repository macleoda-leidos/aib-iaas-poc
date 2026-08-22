'use client';

import { useState, Suspense } from 'react';
import { useParams } from 'next/navigation';

// Synthetic application detail for POC
const DEMO_APPS: Record<string, any> = {
  '1': { id: '1', ref: 'IAAS-2024-00001', debtor: { title: 'Mr', firstName: 'John', lastName: 'Testerton', dob: '1985-03-15', nino: 'AB123456C', maritalStatus: 'Married', dependants: 2, employment: 'Employed' }, status: 'under_review', submitted: '2024-03-15', totalDebt: 12700 },
  '2': { id: '2', ref: 'IAAS-2024-00002', debtor: { title: 'Mrs', firstName: 'Sarah', lastName: 'Lowdebt', dob: '1990-07-22', nino: 'CD789012A', maritalStatus: 'Single', dependants: 0, employment: 'Employed' }, status: 'recommendation_issued', submitted: '2024-03-14', totalDebt: 3200 },
  '3': { id: '3', ref: 'IAAS-2024-00003', debtor: { title: 'Ms', firstName: 'Margaret', lastName: 'Highdebt', dob: '1978-11-03', nino: 'EF345678B', maritalStatus: 'Divorced', dependants: 1, employment: 'Self-employed' }, status: 'submitted', submitted: '2024-03-13', totalDebt: 45000 },
  '4': { id: '4', ref: 'IAAS-2024-00004', debtor: { title: 'Mr', firstName: 'David', lastName: 'Minimal', dob: '1995-02-28', nino: 'GH901234C', maritalStatus: 'Single', dependants: 0, employment: 'Unemployed' }, status: 'draft', submitted: null, totalDebt: 8500 },
  '5': { id: '5', ref: 'IAAS-2024-00005', debtor: { title: 'Mr', firstName: 'James', lastName: 'Midrange', dob: '1982-09-15', nino: 'IJ567890A', maritalStatus: 'Married', dependants: 3, employment: 'Employed' }, status: 'accepted', submitted: '2024-03-10', totalDebt: 15600 },
};

const STATUS_COLOURS: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-purple-100 text-purple-800',
  recommendation_issued: 'bg-green-100 text-green-800',
  accepted: 'bg-green-200 text-green-900',
  rejected: 'bg-red-100 text-red-800',
  additional_info_required: 'bg-orange-100 text-orange-800',
};

export default function ApplicationDetailPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading application...</div>}>
      <ApplicationDetailContent />
    </Suspense>
  );
}

function ApplicationDetailContent() {
  const params = useParams();
  const id = params.id as string;
  const app = DEMO_APPS[id];
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');

  if (!app) {
    return (
      <div className="p-8">
        <a href="/" className="text-blue-600 underline text-sm mb-4 inline-block">← Back to dashboard</a>
        <h1 className="text-2xl font-bold mb-4">Application Not Found</h1>
        <p className="text-gray-600">Application with ID {id} does not exist in the demo dataset.</p>
        <p className="text-sm text-gray-500 mt-2">Available demo IDs: 1, 2, 3, 4, 5</p>
      </div>
    );
  }

  const tabs = ['overview', 'financial', 'checks', 'documents', 'notes', 'audit'];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <a href="/" className="text-blue-600 underline text-sm mb-2 inline-block">← Back to dashboard</a>
          <h1 className="text-2xl font-bold">{app.ref}</h1>
          <p className="text-gray-600">
            {app.debtor.title} {app.debtor.firstName} {app.debtor.lastName} —
            {app.submitted ? ` Submitted ${app.submitted}` : ' Draft (not submitted)'}
          </p>
        </div>
        <span className={`px-3 py-1 rounded text-sm font-bold uppercase ${STATUS_COLOURS[app.status] || 'bg-gray-100'}`}>
          {app.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Action bar */}
      <div className="bg-white border border-gray-200 rounded p-4 mb-6 flex flex-wrap gap-3">
        <button className="bg-green-700 text-white text-sm font-bold px-4 py-2 rounded hover:bg-green-800">✓ Approve</button>
        <button className="bg-red-700 text-white text-sm font-bold px-4 py-2 rounded hover:bg-red-800">✗ Reject</button>
        <button className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded hover:bg-orange-600">⚠ Request More Info</button>
        <button className="bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded hover:bg-blue-800">↗ Reassign</button>
        <button className="bg-gray-200 text-gray-800 text-sm font-bold px-4 py-2 rounded hover:bg-gray-300">📋 Export PDF</button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 mr-1 ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Panel title="Personal Details">
            <Field label="Name" value={`${app.debtor.title} ${app.debtor.firstName} ${app.debtor.lastName}`} />
            <Field label="Date of Birth" value={app.debtor.dob} />
            <Field label="NI Number" value={app.debtor.nino} />
            <Field label="Marital Status" value={app.debtor.maritalStatus} />
            <Field label="Dependants" value={String(app.debtor.dependants)} />
            <Field label="Employment" value={app.debtor.employment} />
          </Panel>
          <Panel title="Financial Summary">
            <Field label="Total Debt" value={`£${app.totalDebt.toLocaleString()}`} />
            <Field label="Creditors" value="3" />
            <Field label="Monthly Income" value="£2,050" />
            <Field label="Monthly Expenditure" value="£1,830" />
            <Field label="Disposable Income" value="£220/month" highlight />
          </Panel>
          <Panel title="Recommendation">
            <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
              <p className="font-bold text-green-800">Debt Arrangement Scheme (DAS)</p>
              <p className="text-sm text-green-700">Confidence: High</p>
            </div>
            <ul className="text-sm space-y-1">
              <li>• Debt within DAS eligibility range</li>
              <li>• Has sufficient disposable income</li>
              <li>• No existing insolvency cases</li>
            </ul>
          </Panel>
          <Panel title="Application Timeline">
            <div className="space-y-2 text-sm">
              <TimelineItem time="15 Mar 10:30" event="Application created" actor="Applicant" />
              <TimelineItem time="15 Mar 11:45" event="Submitted" actor="Applicant" />
              <TimelineItem time="15 Mar 11:46" event="System checks run" actor="System" />
              <TimelineItem time="15 Mar 11:50" event="Credit check complete" actor="System" />
              <TimelineItem time="16 Mar 09:00" event="Assigned to officer" actor="Karen MacLeod" />
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="space-y-6">
          <Panel title="Debts">
            <table className="w-full text-sm">
              <thead><tr className="border-b-2 border-gray-900">
                <th className="text-left py-2">Creditor</th><th className="text-left py-2">Type</th>
                <th className="text-right py-2">Outstanding</th><th className="text-right py-2">Monthly</th>
              </tr></thead>
              <tbody>
                <tr className="border-b"><td className="py-2">Sample Bank PLC</td><td>Bank</td><td className="text-right">£7,200</td><td className="text-right">£150</td></tr>
                <tr className="border-b"><td className="py-2">TestCard Services</td><td>Credit Card</td><td className="text-right">£3,400</td><td className="text-right">£85</td></tr>
                <tr className="border-b"><td className="py-2">QuickLoans Ltd</td><td>Loan</td><td className="text-right">£2,100</td><td className="text-right">£80</td></tr>
                <tr className="font-bold border-t-2"><td className="py-2">TOTAL</td><td></td><td className="text-right">£{app.totalDebt.toLocaleString()}</td><td className="text-right">£315</td></tr>
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {activeTab === 'checks' && (
        <div className="space-y-6">
          <Panel title="System Integration Checks">
            <table className="w-full text-sm">
              <thead><tr className="border-b-2"><th className="text-left py-2">System</th><th className="text-left py-2">Result</th><th className="text-left py-2">Details</th></tr></thead>
              <tbody>
                {[
                  { sys: 'BASYS', found: false, detail: 'No record' },
                  { sys: 'eDEN/DASH', found: false, detail: 'No arrangement' },
                  { sys: 'DAS', found: false, detail: 'No programme' },
                  { sys: 'CFT', found: true, detail: '3 providers available' },
                  { sys: 'Moratorium', found: false, detail: 'No moratorium' },
                  { sys: 'RoI', found: false, detail: 'No entry' },
                ].map(c => (
                  <tr key={c.sys} className="border-b">
                    <td className="py-2 font-bold">{c.sys}</td>
                    <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs font-bold ${c.found ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>{c.found ? 'Found' : 'Clear'}</span></td>
                    <td className="py-2 text-gray-600">{c.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title="Credit Check">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded"><p className="text-xl font-bold">520</p><p className="text-xs text-gray-500">Score</p></div>
              <div className="text-center p-3 bg-gray-50 rounded"><p className="text-xl font-bold">Fair</p><p className="text-xs text-gray-500">Band</p></div>
              <div className="text-center p-3 bg-gray-50 rounded"><p className="text-xl font-bold">1</p><p className="text-xs text-gray-500">Defaults</p></div>
              <div className="text-center p-3 bg-gray-50 rounded"><p className="text-xl font-bold">0</p><p className="text-xs text-gray-500">CCJs</p></div>
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'documents' && (
        <Panel title="Uploaded Documents">
          <table className="w-full text-sm">
            <thead><tr className="border-b-2"><th className="text-left py-2">File</th><th className="text-left py-2">Category</th><th className="text-left py-2">Size</th><th className="text-left py-2">Scan</th></tr></thead>
            <tbody>
              <tr className="border-b"><td className="py-2">📄 payslip_march.pdf</td><td>Income Evidence</td><td>245 KB</td><td><span className="bg-green-100 text-green-800 px-2 py-0.5 text-xs rounded font-bold">Clean</span></td></tr>
              <tr className="border-b"><td className="py-2">📄 bank_statement.pdf</td><td>Income Evidence</td><td>1.2 MB</td><td><span className="bg-green-100 text-green-800 px-2 py-0.5 text-xs rounded font-bold">Clean</span></td></tr>
              <tr className="border-b"><td className="py-2">📄 council_tax_bill.pdf</td><td>Debt Evidence</td><td>89 KB</td><td><span className="bg-green-100 text-green-800 px-2 py-0.5 text-xs rounded font-bold">Clean</span></td></tr>
            </tbody>
          </table>
        </Panel>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-6">
          <Panel title="Staff Notes">
            <div className="border-l-4 border-blue-600 pl-4 mb-4">
              <p className="text-sm font-bold">James Wilson <span className="font-normal text-gray-500">— 16 Mar 09:15</span></p>
              <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Review</span>
              <p className="text-sm mt-1">Application complete. All documents verified. Debtor eligible for DAS based on income and debt levels.</p>
            </div>
          </Panel>
          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="font-bold mb-2">Add Note</h3>
            <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={3}
              className="w-full border-2 border-gray-900 p-2 text-sm mb-2" placeholder="Enter staff note..." />
            <div className="flex gap-2">
              <select className="border border-gray-300 p-2 text-sm rounded">
                <option>General</option><option>Review</option><option>Decision</option><option>Follow-up</option>
              </select>
              <button className="bg-blue-700 text-white text-sm px-4 py-2 rounded hover:bg-blue-800">Add Note</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <Panel title="Audit Trail">
          <div className="space-y-3">
            {[
              { time: '15 Mar 10:30', event: 'Application Created', actor: 'John Testerton', type: 'Applicant' },
              { time: '15 Mar 11:45', event: 'Application Submitted', actor: 'John Testerton', type: 'Applicant' },
              { time: '15 Mar 11:46', event: 'System Checks Initiated', actor: 'System', type: 'System' },
              { time: '15 Mar 11:50', event: 'Credit Check Completed', actor: 'System', type: 'System' },
              { time: '15 Mar 11:51', event: 'Recommendation Generated', actor: 'System', type: 'System' },
              { time: '16 Mar 09:00', event: 'Assigned to James Wilson', actor: 'Karen MacLeod', type: 'Staff' },
              { time: '16 Mar 09:15', event: 'Review Note Added', actor: 'James Wilson', type: 'Staff' },
            ].map((e, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-xs text-gray-400 w-28 flex-shrink-0">{e.time}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0 ${e.type === 'System' ? 'bg-gray-100' : e.type === 'Staff' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{e.type}</span>
                <span><strong>{e.event}</strong> — {e.actor}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded p-4">
      <h3 className="font-bold mb-3 pb-2 border-b border-gray-200">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between py-1 text-sm ${highlight ? 'font-bold border-t pt-2 mt-2' : ''}`}>
      <span className="text-gray-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function TimelineItem({ time, event, actor }: { time: string; event: string; actor: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs text-gray-400 w-24 flex-shrink-0">{time}</span>
      <span className="text-sm"><strong>{event}</strong> — {actor}</span>
    </div>
  );
}
