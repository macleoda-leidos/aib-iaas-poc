'use client';

import { useState } from 'react';

// Role selection for POC demo purposes
const DEMO_USERS = [
  { id: 'USR-002', name: 'Karen MacLeod', role: 'aib_senior_officer', roleDisplay: 'AiB Senior Officer', org: 'Accountant in Bankruptcy' },
  { id: 'USR-003', name: 'James Wilson', role: 'aib_officer', roleDisplay: 'AiB Case Officer', org: 'AiB - Case Administration' },
  { id: 'USR-005', name: 'Fiona Campbell', role: 'money_adviser', roleDisplay: 'Money Adviser', org: 'CAS - Edinburgh Bureau' },
  { id: 'USR-007', name: 'Sarah Mitchell', role: 'creditor', roleDisplay: 'Creditor', org: 'Royal Bank of Scotland (Sample)' },
  { id: 'USR-008', name: 'Robert Henderson', role: 'supplier', roleDisplay: 'Supplier/Trustee', org: 'Sample Insolvency Practitioners LLP' },
  { id: 'USR-009', name: 'John Testerton', role: 'debtor', roleDisplay: 'Debtor', org: null },
];

export default function DashboardPage() {
  const [selectedUser, setSelectedUser] = useState(DEMO_USERS[0]);

  return (
    <div className="gov-main">
      {/* POC Role Switcher */}
      <div className="bg-yellow-50 border border-yellow-300 p-4 mb-6 rounded">
        <p className="text-sm font-bold mb-2">POC Demo: Switch User Role</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_USERS.map(user => (
            <button key={user.id} onClick={() => setSelectedUser(user)}
              className={`text-xs px-3 py-1.5 rounded border ${selectedUser.id === user.id ? 'bg-gov-blue text-white border-gov-blue' : 'bg-white border-gray-300 hover:border-gov-blue'}`}>
              {user.roleDisplay}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Logged in as: <strong>{selectedUser.name}</strong> ({selectedUser.roleDisplay})
          {selectedUser.org && <> — {selectedUser.org}</>}
        </p>
      </div>

      {/* Render appropriate dashboard */}
      {selectedUser.role.startsWith('aib') && <AibDashboard user={selectedUser} />}
      {selectedUser.role === 'money_adviser' && <AdviserDashboard user={selectedUser} />}
      {selectedUser.role === 'creditor' && <CreditorDashboard user={selectedUser} />}
      {selectedUser.role === 'supplier' && <SupplierDashboard user={selectedUser} />}
      {selectedUser.role === 'debtor' && <DebtorDashboard user={selectedUser} />}
    </div>
  );
}

function AibDashboard({ user }: { user: any }) {
  return (
    <div>
      <h1>AiB Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome back, {user.name}</p>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Pending Review" value="12" trend="+3 today" colour="blue" />
        <KpiCard label="Awaiting Info" value="5" trend="2 overdue" colour="orange" />
        <KpiCard label="Approved This Week" value="28" trend="↑ 12%" colour="green" />
        <KpiCard label="Total Active" value="156" trend="across all products" colour="purple" />
      </div>

      {/* Recent Applications */}
      <div className="bg-white border border-gray-200 rounded mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold">Applications Requiring Action</h2>
          <a href="/admin" className="text-gov-blue text-sm underline">View all →</a>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="text-left p-3 text-sm">Reference</th><th className="text-left p-3 text-sm">Applicant</th>
            <th className="text-left p-3 text-sm">Product</th><th className="text-left p-3 text-sm">Status</th>
            <th className="text-left p-3 text-sm">Submitted</th>
          </tr></thead>
          <tbody>
            {[
              { ref: 'IAAS-2024-00012', name: 'A. Morrison', product: 'DAS', status: 'Submitted', date: '28 Jun' },
              { ref: 'IAAS-2024-00011', name: 'B. Campbell', product: 'MAP', status: 'Under Review', date: '27 Jun' },
              { ref: 'IAAS-2024-00010', name: 'C. Stewart', product: 'PTD', status: 'Awaiting Info', date: '26 Jun' },
              { ref: 'IAAS-2024-00009', name: 'D. Murray', product: 'Sequestration', status: 'Submitted', date: '25 Jun' },
            ].map(app => (
              <tr key={app.ref} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 text-sm font-mono">{app.ref}</td>
                <td className="p-3 text-sm">{app.name}</td>
                <td className="p-3 text-sm">{app.product}</td>
                <td className="p-3"><StatusBadge status={app.status} /></td>
                <td className="p-3 text-sm text-gray-600">{app.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Actions & Reports */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="font-bold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <ActionButton label="Run Integration Health Check" icon="🔍" />
            <ActionButton label="View Audit Log" icon="📋" />
            <ActionButton label="Generate Weekly Report" icon="📊" onClick={() => window.open((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/reports/export/weekly-report', '_blank')} />
            <ActionButton label="Manage Users (500)" icon="👥" onClick={() => window.open('http://localhost:3010/users', '_blank')} />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="font-bold mb-3">System Status</h3>
          <div className="space-y-2">
            {['BASYS', 'eDEN/DASH', 'DAS', 'CFT', 'Moratorium', 'RoI'].map(sys => (
              <div key={sys} className="flex justify-between items-center text-sm py-1">
                <span>{sys}</span>
                <span className="text-green-700 font-bold">● Online</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdviserDashboard({ user }: { user: any }) {
  const [activePanel, setActivePanel] = useState<'none' | 'upload' | 'credit' | 'calendar'>('none');

  return (
    <div>
      <h1>Money Adviser Dashboard</h1>
      <p className="text-gray-600 mb-6">{user.org} — {user.name}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="My Active Cases" value="8" colour="blue" />
        <KpiCard label="Pending Submission" value="3" colour="orange" />
        <KpiCard label="Approved" value="14" trend="this month" colour="green" />
        <button onClick={() => setActivePanel(activePanel === 'calendar' ? 'none' : 'calendar')} className="text-left bg-white border border-gray-200 rounded p-4 border-l-4 border-purple-600 hover:bg-purple-50 transition-colors">
          <p className="text-2xl font-bold">4</p>
          <p className="text-sm text-gray-600">Client Meetings</p>
          <p className="text-xs text-gray-400 mt-1">this week — click to view</p>
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white border border-gray-200 rounded">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold">My Client Applications</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { name: 'John Testerton', ref: 'IAAS-2024-00001', product: 'DAS', status: 'Recommendation Issued', debt: '£12,700' },
              { name: 'David Minimal', ref: 'IAAS-2024-00004', product: 'MAP', status: 'Draft', debt: '£8,500' },
              { name: 'Sarah Lowdebt', ref: 'IAAS-2024-00002', product: 'DPP', status: 'Under Review', debt: '£3,200' },
            ].map(client => (
              <div key={client.ref} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p className="font-bold text-sm">{client.name}</p>
                  <p className="text-xs text-gray-600">{client.ref} — {client.product} — Total debt: {client.debt}</p>
                </div>
                <StatusBadge status={client.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="font-bold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <ActionButton label="New Application" icon="➕" />
              <ActionButton label="Upload Documents" icon="📄" onClick={() => setActivePanel(activePanel === 'upload' ? 'none' : 'upload')} />
              <ActionButton label="Run Credit Check" icon="🔍" onClick={() => setActivePanel(activePanel === 'credit' ? 'none' : 'credit')} />
              <ActionButton label="View DAS Eligibility" icon="📋" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-bold text-sm mb-2">Upcoming Reviews</h3>
            <p className="text-sm">3 DPP annual reviews due in July</p>
            <p className="text-sm">1 Trust Deed 4-year review pending</p>
          </div>
        </div>
      </div>

      {/* Active Panel */}
      {activePanel !== 'none' && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">
              {activePanel === 'upload' && '📄 Upload Documents'}
              {activePanel === 'credit' && '🔍 Credit Check Report'}
              {activePanel === 'calendar' && '📅 Client Meetings'}
            </h2>
            <button onClick={() => setActivePanel('none')} className="text-gray-500 hover:text-gray-800 text-sm">✕ Close</button>
          </div>
          {activePanel === 'upload' && <UploadDocsPanel />}
          {activePanel === 'credit' && <CreditCheckPanel />}
          {activePanel === 'calendar' && <CalendarPanel />}
        </div>
      )}
    </div>
  );
}

// ===== UPLOAD DOCUMENTS PANEL =====
function UploadDocsPanel() {
  const [files, setFiles] = useState<Array<{ name: string; size: number; status: 'pending' | 'uploading' | 'scanning' | 'clean' | 'quarantined' }>>([]);
  const [selectedClient, setSelectedClient] = useState('');

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size, status: 'pending' as const }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const simulateUpload = () => {
    // Simulate upload progress then virus scan
    setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })));
    setTimeout(() => {
      setFiles(prev => prev.map(f => ({ ...f, status: 'scanning' as const })));
    }, 1000);
    setTimeout(() => {
      setFiles(prev => prev.map(f => ({
        ...f,
        status: (f.name.toLowerCase().includes('virus') || f.name.toLowerCase().includes('eicar'))
          ? 'quarantined' as const
          : 'clean' as const,
      })));
    }, 3000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded p-6">
      <div className="mb-4">
        <label className="block text-sm font-bold mb-1">Upload for client:</label>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="border border-gray-300 p-2 text-sm rounded w-full max-w-sm">
          <option value="">Select client...</option>
          <option value="john">John Testerton (IAAS-2024-00001)</option>
          <option value="david">David Minimal (IAAS-2024-00004)</option>
          <option value="sarah">Sarah Lowdebt (IAAS-2024-00002)</option>
        </select>
      </div>

      <div className="border-2 border-dashed border-gray-400 rounded p-8 text-center bg-gray-50 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer mb-4"
        onClick={() => document.getElementById('adviser-file-input')?.click()}>
        <p className="text-lg mb-2">📂 Drag and drop files here</p>
        <p className="text-sm text-gray-600 mb-2">or click to browse</p>
        <p className="text-xs text-gray-500">Accepted: PDF, JPG, PNG, DOC, DOCX (max 10MB each)</p>
        <input id="adviser-file-input" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handleFiles} />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 flex items-center gap-2">
        <span className="text-lg">🛡️</span>
        <p className="text-sm"><strong>Virus Scanning:</strong> All uploaded files are automatically scanned using ClamAV antivirus before being accepted into the system.</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 mb-4">
          <h4 className="font-bold text-sm">Selected Files ({files.length})</h4>
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-lg">{file.name.endsWith('.pdf') ? '📕' : file.name.match(/\.(jpg|jpeg|png)$/) ? '🖼️' : '📄'}</span>
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {file.status === 'pending' && <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">Ready</span>}
                {file.status === 'uploading' && <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded animate-pulse">⬆ Uploading...</span>}
                {file.status === 'scanning' && <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded animate-pulse">🔍 Virus scanning...</span>}
                {file.status === 'clean' && <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded font-bold">✓ Clean</span>}
                {file.status === 'quarantined' && <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded font-bold">⚠ QUARANTINED</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && files.some(f => f.status === 'pending') && (
        <button onClick={simulateUpload} disabled={!selectedClient} className="bg-green-700 text-white font-bold py-2 px-6 text-sm hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed">
          Upload & Scan All Files
        </button>
      )}
      {files.length > 0 && files.every(f => f.status === 'clean' || f.status === 'quarantined') && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm text-green-800 font-bold">✓ All files processed. {files.filter(f => f.status === 'clean').length} accepted, {files.filter(f => f.status === 'quarantined').length} quarantined.</p>
        </div>
      )}
    </div>
  );
}

// ===== CREDIT CHECK REPORT PANEL =====
function CreditCheckPanel() {
  const [selectedClient, setSelectedClient] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const runCheck = () => {
    setLoading(true);
    setTimeout(() => {
      setReport({
        provider: 'Equifax',
        reference: `EQ-${Date.now().toString(36).toUpperCase()}`,
        date: new Date().toISOString().split('T')[0],
        subject: selectedClient === 'john' ? 'John Testerton' : selectedClient === 'david' ? 'David Minimal' : 'Sarah Lowdebt',
        score: 520,
        scoreBand: 'Fair',
        scoreColour: 'text-amber-600',
        defaults: 1,
        ccjs: 0,
        bankruptcyFlag: false,
        activeAccounts: 5,
        totalLimit: 18500,
        totalBalance: 12700,
        utilisation: 69,
        recentSearches: 2,
        accounts: [
          { type: 'Current Account', provider: 'Sample Bank PLC', limit: 1500, balance: 320, monthly: 0, status: 'Active', opened: '2016-03' },
          { type: 'Credit Card', provider: 'TestCard Services', limit: 5000, balance: 3400, monthly: 85, status: 'Active', opened: '2019-07' },
          { type: 'Personal Loan', provider: 'QuickLoans Ltd', limit: null, balance: 7200, monthly: 150, status: 'In Arrears', opened: '2021-01' },
          { type: 'Utility', provider: 'ScotPower (Sample)', limit: null, balance: 280, monthly: 85, status: 'Active', opened: '2018-09' },
          { type: 'Mobile Phone', provider: 'TestMobile Ltd', limit: null, balance: 45, monthly: 45, status: 'Active', opened: '2022-03' },
        ],
        addresses: [
          { address: '42 Example Street, Edinburgh, EH1 1AA', from: '2018-06', to: 'Present', confirmed: true },
          { address: '15 Previous Road, Glasgow, G2 3AB', from: '2015-01', to: '2018-05', confirmed: true },
        ],
        riskIndicators: [
          { severity: 'medium', category: 'Payment History', desc: '1 default recorded in last 6 years' },
          { severity: 'medium', category: 'Credit Utilisation', desc: 'Utilisation at 69% across accounts' },
          { severity: 'low', category: 'Search Frequency', desc: '2 credit searches in last 6 months' },
        ],
        publicRecords: { ccjs: 0, bankruptcies: 0, ivals: 0, trustDeeds: 0 },
      });
      setLoading(false);
    }, 2000);
  };

  if (!report) {
    return (
      <div className="bg-white border border-gray-200 rounded p-6">
        <div className="mb-4">
          <label className="block text-sm font-bold mb-1">Run credit check for:</label>
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="border border-gray-300 p-2 text-sm rounded w-full max-w-sm">
            <option value="">Select client...</option>
            <option value="john">John Testerton (IAAS-2024-00001)</option>
            <option value="david">David Minimal (IAAS-2024-00004)</option>
            <option value="sarah">Sarah Lowdebt (IAAS-2024-00002)</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={consentGiven} onChange={e => setConsentGiven(e.target.checked)} className="mt-1" />
            <span className="text-sm">I confirm that the data subject has given explicit consent for a credit check to be carried out. I understand this will be recorded for audit purposes.</span>
          </label>
        </div>
        <button onClick={runCheck} disabled={!selectedClient || !consentGiven || loading}
          className="bg-blue-700 text-white font-bold py-2 px-6 text-sm hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? '⏳ Running credit check...' : '🔍 Run Credit Check'}
        </button>
        {loading && <div className="mt-4 flex items-center gap-2"><div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div><span className="text-sm">Contacting Equifax...</span></div>}
      </div>
    );
  }

  // Render Equifax-style report
  return (
    <div className="bg-white border border-gray-200 rounded overflow-hidden">
      {/* Report Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-900 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white">Equifax Credit Report</h3>
            <p className="text-red-200 text-sm">Consumer Credit File</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-red-200">Reference: {report.reference}</p>
            <p className="text-red-200">Date: {report.date}</p>
            <p className="text-white font-bold mt-1">Subject: {report.subject}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Credit Score */}
        <div className="flex items-center gap-8 p-4 bg-gray-50 rounded">
          <div className="text-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#d97706" strokeWidth="8" strokeDasharray={`${(report.score / 999) * 251} 251`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{report.score}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">out of 999</p>
          </div>
          <div>
            <p className="text-lg font-bold">Score Band: <span className={report.scoreColour}>{report.scoreBand}</span></p>
            <div className="flex gap-1 mt-2">
              {['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'].map((band, i) => (
                <div key={band} className={`h-2 flex-1 rounded ${i === 2 ? 'bg-amber-500' : 'bg-gray-200'}`} title={band}></div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span><span>999</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded text-center"><p className="text-xl font-bold">{report.defaults}</p><p className="text-xs text-gray-500">Defaults</p></div>
          <div className="p-3 bg-gray-50 rounded text-center"><p className="text-xl font-bold">{report.ccjs}</p><p className="text-xs text-gray-500">CCJs</p></div>
          <div className="p-3 bg-gray-50 rounded text-center"><p className="text-xl font-bold">{report.activeAccounts}</p><p className="text-xs text-gray-500">Active Accounts</p></div>
          <div className="p-3 bg-gray-50 rounded text-center"><p className="text-xl font-bold">{report.utilisation}%</p><p className="text-xs text-gray-500">Utilisation</p></div>
        </div>

        {/* Account Details */}
        <div>
          <h4 className="font-bold mb-2 text-sm uppercase text-gray-600">Account Information</h4>
          <table className="w-full text-sm">
            <thead className="bg-gray-100"><tr>
              <th className="text-left p-2">Type</th><th className="text-left p-2">Provider</th>
              <th className="text-right p-2">Limit</th><th className="text-right p-2">Balance</th>
              <th className="text-right p-2">Monthly</th><th className="text-left p-2">Status</th>
            </tr></thead>
            <tbody>
              {report.accounts.map((acc: any, i: number) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="p-2">{acc.type}</td>
                  <td className="p-2">{acc.provider}</td>
                  <td className="p-2 text-right">{acc.limit ? `£${acc.limit.toLocaleString()}` : '—'}</td>
                  <td className="p-2 text-right font-bold">£{acc.balance.toLocaleString()}</td>
                  <td className="p-2 text-right">£{acc.monthly}</td>
                  <td className="p-2"><span className={`text-xs px-1.5 py-0.5 rounded font-bold ${acc.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{acc.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Address History */}
        <div>
          <h4 className="font-bold mb-2 text-sm uppercase text-gray-600">Address Links</h4>
          <div className="space-y-2">
            {report.addresses.map((addr: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <span>{addr.address}</span>
                <span className="text-xs text-gray-500">{addr.from} — {addr.to} {addr.confirmed && '✓'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Indicators */}
        <div>
          <h4 className="font-bold mb-2 text-sm uppercase text-gray-600">Risk Indicators</h4>
          <div className="space-y-2">
            {report.riskIndicators.map((ri: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2 border rounded">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${ri.severity === 'high' ? 'bg-red-100 text-red-800' : ri.severity === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>{ri.severity}</span>
                <span className="text-sm"><strong>{ri.category}:</strong> {ri.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Public Records */}
        <div>
          <h4 className="font-bold mb-2 text-sm uppercase text-gray-600">Public Records</h4>
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div className="p-2 bg-green-50 rounded"><p className="font-bold">{report.publicRecords.ccjs}</p><p className="text-xs">CCJs</p></div>
            <div className="p-2 bg-green-50 rounded"><p className="font-bold">{report.publicRecords.bankruptcies}</p><p className="text-xs">Bankruptcies</p></div>
            <div className="p-2 bg-green-50 rounded"><p className="font-bold">{report.publicRecords.ivals}</p><p className="text-xs">IVAs</p></div>
            <div className="p-2 bg-green-50 rounded"><p className="font-bold">{report.publicRecords.trustDeeds}</p><p className="text-xs">Trust Deeds</p></div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t pt-4 mt-4">
          <p className="text-xs text-gray-500 italic">SIMULATED REPORT — No real credit data has been accessed. This is a demonstration of the credit check report format for the AiB IAAS POC. In production, this would connect to the Equifax ConsumerView API with proper data sharing agreements and ICO compliance.</p>
        </div>
      </div>
    </div>
  );
}

// ===== CALENDAR PANEL =====
function CalendarPanel() {
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const appointments = [
    { id: 1, day: 2, time: '09:30', duration: '1 hour', client: 'John Testerton', ref: 'IAAS-2024-00001', type: 'DAS Initial Assessment', location: 'Microsoft Teams', notes: 'Review financial statement, discuss DAS eligibility criteria, explain process.', prep: ['Print financial summary', 'Check credit report', 'Prepare DAS information pack'] },
    { id: 2, day: 5, time: '14:00', duration: '45 mins', client: 'David Minimal', ref: 'IAAS-2024-00004', type: 'MAP Eligibility Review', location: 'Office - Room 3', notes: 'Assess MAP criteria, verify minimal assets, discuss implications.', prep: ['Verify asset declaration', 'Check benefit entitlements', 'MAP application form ready'] },
    { id: 3, day: 12, time: '10:00', duration: '30 mins', client: 'Sarah Lowdebt', ref: 'IAAS-2024-00002', type: 'DPP Annual Review', location: 'Microsoft Teams', notes: 'Annual review of Debt Payment Programme. Check payments on track.', prep: ['Pull payment history', 'Check for missed payments', 'Review income changes'] },
    { id: 4, day: 18, time: '11:30', duration: '1 hour', client: 'Fiona Existing', ref: 'DAS-2022-00456', type: 'DAS Variation Discussion', location: 'Office - Room 1', notes: 'Client income has changed. Discuss variation to DPP.', prep: ['Current DPP terms', 'New income evidence', 'Variation application form'] },
  ];

  const daysInMonth = 31; // July
  const startDayOfWeek = 1; // Monday (0=Sun, 1=Mon, ...)
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const appointmentDays = appointments.map(a => a.day);

  return (
    <div className="bg-white border border-gray-200 rounded p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">July 2026</h3>
        <div className="flex gap-2 text-sm">
          <button className="px-2 py-1 border rounded hover:bg-gray-50">← Prev</button>
          <button className="px-2 py-1 border rounded hover:bg-gray-50">Next →</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDays.map(d => <div key={d} className="text-center text-xs font-bold text-gray-500 py-2">{d}</div>)}
        {/* Empty cells before month starts */}
        {Array.from({ length: startDayOfWeek }, (_, i) => <div key={`empty-${i}`} className="p-2"></div>)}
        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const hasAppt = appointmentDays.includes(day);
          const appt = appointments.find(a => a.day === day);
          const isToday = day === 2; // Simulate "today"
          return (
            <button key={day} onClick={() => appt && setSelectedAppointment(appt)}
              className={`p-2 text-center rounded text-sm relative transition-colors
                ${isToday ? 'bg-blue-100 border-2 border-blue-500 font-bold' : ''}
                ${hasAppt ? 'bg-purple-50 hover:bg-purple-100 cursor-pointer font-medium' : 'hover:bg-gray-50'}
                ${!hasAppt && !isToday ? 'text-gray-700' : ''}`}>
              {day}
              {hasAppt && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-600"></div>}
            </button>
          );
        })}
      </div>

      {/* Appointments List */}
      <div className="border-t pt-4">
        <h4 className="font-bold text-sm mb-2">This Week's Appointments</h4>
        <div className="space-y-2">
          {appointments.map(appt => (
            <button key={appt.id} onClick={() => setSelectedAppointment(appt)}
              className={`w-full text-left p-3 rounded border transition-colors ${selectedAppointment?.id === appt.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'}`}>
              <div className="flex justify-between">
                <span className="text-sm font-bold">{appt.client}</span>
                <span className="text-xs text-gray-500">{appt.day} Jul, {appt.time}</span>
              </div>
              <p className="text-xs text-gray-600">{appt.type}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Appointment Detail */}
      {selectedAppointment && (
        <div className="border-t pt-4 mt-4">
          <div className="bg-purple-50 border border-purple-200 rounded p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold">{selectedAppointment.client}</h4>
                <p className="text-sm text-gray-600">{selectedAppointment.type}</p>
              </div>
              <button onClick={() => setSelectedAppointment(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div><span className="text-gray-500">Case Ref:</span> <span className="font-medium">{selectedAppointment.ref}</span></div>
              <div><span className="text-gray-500">Date:</span> <span className="font-medium">{selectedAppointment.day} Jul 2026, {selectedAppointment.time}</span></div>
              <div><span className="text-gray-500">Duration:</span> <span className="font-medium">{selectedAppointment.duration}</span></div>
              <div><span className="text-gray-500">Location:</span> <span className="font-medium">{selectedAppointment.location}</span></div>
            </div>
            <div className="mb-3">
              <p className="text-sm font-bold mb-1">Notes:</p>
              <p className="text-sm text-gray-700">{selectedAppointment.notes}</p>
            </div>
            <div className="mb-3">
              <p className="text-sm font-bold mb-1">Preparation Checklist:</p>
              <ul className="text-sm space-y-1">
                {selectedAppointment.prep.map((item: string, i: number) => (
                  <li key={i} className="flex items-center gap-2"><input type="checkbox" className="rounded" /><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <button className="bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded hover:bg-purple-800">
                {selectedAppointment.location.includes('Teams') ? '📹 Join Meeting' : '📍 Get Directions'}
              </button>
              <button className="bg-gray-200 text-gray-800 text-sm font-bold px-4 py-2 rounded hover:bg-gray-300">📋 View Case</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreditorDashboard({ user }: { user: any }) {
  const [activePanel, setActivePanel] = useState<'none' | 'vote' | 'claim' | 'statement'>('none');
  const [voted, setVoted] = useState(false);

  return (
    <div>
      <h1>Creditor Portal</h1>
      <p className="text-gray-600 mb-6">{user.org}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Active Cases" value="23" colour="blue" />
        <KpiCard label="Pending Claims" value="5" colour="orange" />
        <KpiCard label="Dividends Due" value="£4,230" colour="green" />
        <button onClick={() => setActivePanel('vote')} className="text-left bg-white border border-gray-200 rounded p-4 border-l-4 border-red-500 hover:bg-red-50">
          <p className="text-2xl font-bold">2</p><p className="text-sm text-gray-600">Proposals to Vote</p><p className="text-xs text-red-600 mt-1">Action required</p>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded mb-6">
        <div className="p-4 border-b border-gray-200"><h2 className="font-bold">Cases Involving Your Organisation</h2></div>
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="text-left p-3 text-sm">Reference</th><th className="text-left p-3 text-sm">Debtor</th>
            <th className="text-left p-3 text-sm">Type</th><th className="text-left p-3 text-sm">Our Claim</th>
            <th className="text-left p-3 text-sm">Status</th><th className="text-left p-3 text-sm">Action</th>
          </tr></thead>
          <tbody>
            {[
              { ref: 'DAS-2023-00456', debtor: 'J. Morrison', type: 'DAS', claim: '£8,200', status: 'Active', action: 'statement' },
              { ref: 'SEQ-2024-00123', debtor: 'P. Thomson', type: 'Sequestration', claim: '£15,000', status: 'Claim Filed', action: 'claim' },
              { ref: 'PTD-2024-00045', debtor: 'M. MacDonald', type: 'Trust Deed', claim: '£6,400', status: 'Proposal', action: 'vote' },
            ].map(c => (
              <tr key={c.ref} className="border-b border-gray-100">
                <td className="p-3 text-sm font-mono">{c.ref}</td>
                <td className="p-3 text-sm">{c.debtor}</td>
                <td className="p-3 text-sm">{c.type}</td>
                <td className="p-3 text-sm font-bold">{c.claim}</td>
                <td className="p-3"><StatusBadge status={c.status} /></td>
                <td className="p-3"><button onClick={() => setActivePanel(c.action as any)} className="text-gov-blue text-sm underline">{c.action === 'vote' ? '🗳 Vote' : c.action === 'claim' ? '📋 View Claim' : '📊 Statement'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active Panel */}
      {activePanel !== 'none' && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">{activePanel === 'vote' ? '🗳 Vote on Proposal' : activePanel === 'claim' ? '📋 Claim Details' : '📊 Annual Statement'}</h2>
            <button onClick={() => setActivePanel('none')} className="text-sm border border-gray-300 px-2 py-1 rounded">✕ Close</button>
          </div>

          {activePanel === 'vote' && (
            <div className="bg-white border border-gray-200 rounded p-6">
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                <p className="font-bold text-red-800">Protected Trust Deed Proposal — PTD-2024-00045</p>
                <p className="text-sm text-red-700">Voting deadline: 15 July 2026</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                <div><span className="text-gray-500">Debtor:</span> <strong>M. MacDonald</strong></div>
                <div><span className="text-gray-500">Your claim:</span> <strong>£6,400</strong></div>
                <div><span className="text-gray-500">Total debt:</span> <strong>£32,000</strong></div>
                <div><span className="text-gray-500">Proposed dividend:</span> <strong>22p in £</strong></div>
                <div><span className="text-gray-500">Duration:</span> <strong>48 months</strong></div>
                <div><span className="text-gray-500">Trustee:</span> <strong>Sample Insolvency Practitioners LLP</strong></div>
              </div>
              <div className="border-t pt-4 mb-4">
                <p className="font-bold text-sm mb-2">Your estimated recovery: <span className="text-green-700">£1,408</span></p>
                <p className="text-xs text-gray-500">Based on proposed 22p dividend on your claim of £6,400</p>
              </div>
              {voted ? (
                <div className="bg-green-50 border border-green-200 rounded p-3"><p className="text-green-800 font-bold">✓ Vote recorded. Thank you for participating.</p></div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setVoted(true)} className="bg-green-700 text-white font-bold py-2 px-6 text-sm rounded hover:bg-green-800">✓ Accept Proposal</button>
                  <button onClick={() => setVoted(true)} className="bg-red-700 text-white font-bold py-2 px-6 text-sm rounded hover:bg-red-800">✗ Reject Proposal</button>
                </div>
              )}
            </div>
          )}

          {activePanel === 'claim' && (
            <div className="bg-white border border-gray-200 rounded p-6">
              <h3 className="font-bold mb-3">Claim: SEQ-2024-00123 — P. Thomson</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                <div><span className="text-gray-500">Claim amount:</span> <strong>£15,000</strong></div>
                <div><span className="text-gray-500">Claim type:</span> <strong>Unsecured credit</strong></div>
                <div><span className="text-gray-500">Filed:</span> <strong>14 March 2024</strong></div>
                <div><span className="text-gray-500">Status:</span> <StatusBadge status="Claim Filed" /></div>
                <div><span className="text-gray-500">Trustee:</span> <strong>Sample Insolvency Practitioners LLP</strong></div>
                <div><span className="text-gray-500">Adjudication due:</span> <strong>28 July 2026</strong></div>
              </div>
              <div className="bg-blue-50 p-3 rounded text-sm"><p>Your claim is awaiting adjudication by the trustee. You will be notified of the outcome.</p></div>
            </div>
          )}

          {activePanel === 'statement' && (
            <div className="bg-white border border-gray-200 rounded p-6">
              <h3 className="font-bold mb-3">Annual Statement — DAS-2023-00456</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                <div className="p-3 bg-gray-50 rounded text-center"><p className="text-xl font-bold">£8,200</p><p className="text-xs">Original Claim</p></div>
                <div className="p-3 bg-green-50 rounded text-center"><p className="text-xl font-bold text-green-700">£2,280</p><p className="text-xs">Received to Date</p></div>
                <div className="p-3 bg-blue-50 rounded text-center"><p className="text-xl font-bold">£5,920</p><p className="text-xs">Remaining</p></div>
              </div>
              <table className="w-full text-sm border border-gray-200 mb-4">
                <thead className="bg-gray-50"><tr><th className="p-2 text-left">Date</th><th className="p-2 text-right">Payment</th><th className="p-2 text-right">Running Total</th></tr></thead>
                <tbody>
                  {[['Apr 2024','£285','£285'],['Jul 2024','£285','£570'],['Oct 2024','£285','£855'],['Jan 2025','£285','£1,140'],['Apr 2025','£285','£1,425'],['Jul 2025','£285','£1,710'],['Oct 2025','£285','£1,995'],['Jan 2026','£285','£2,280']].map(([d,p,t]) => (
                    <tr key={d} className="border-t"><td className="p-2">{d}</td><td className="p-2 text-right">{p}</td><td className="p-2 text-right font-bold">{t}</td></tr>
                  ))}
                </tbody>
              </table>
              <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 text-sm rounded hover:bg-gray-300">📥 Download Statement (PDF)</button>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="font-bold mb-3">Dividend Schedule</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>DAS-2023-00456</span><span className="font-bold text-green-700">£285 (Jul)</span></div>
            <div className="flex justify-between"><span>SEQ-2024-00123</span><span className="text-gray-500">Pending adjudication</span></div>
            <div className="flex justify-between"><span>PTD-2024-00045</span><span className="text-gray-500">Awaiting vote</span></div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="font-bold mb-3">Notifications</h3>
          <div className="space-y-2 text-sm">
            <p>📩 New trust deed proposal — vote by 15 Jul</p>
            <p>💰 Dividend payment of £285 scheduled for 1 Jul</p>
            <p>📋 Annual statement available for DAS-2023-00456</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupplierDashboard({ user }: { user: any }) {
  const [activePanel, setActivePanel] = useState<'none' | 'report' | 'distribution' | 'upload'>('none');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [distRecorded, setDistRecorded] = useState(false);

  return (
    <div>
      <h1>Trustee / Supplier Dashboard</h1>
      <p className="text-gray-600 mb-6">{user.org} — {user.name}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Active Cases" value="34" colour="blue" />
        <KpiCard label="New Assignments" value="3" colour="orange" />
        <KpiCard label="Distributions Due" value="12" colour="green" />
        <KpiCard label="Reports Overdue" value="1" colour="red" />
      </div>

      <div className="bg-white border border-gray-200 rounded mb-6">
        <div className="p-4 border-b border-gray-200"><h2 className="font-bold">Cases Under Management</h2></div>
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="text-left p-3 text-sm">Case Ref</th><th className="text-left p-3 text-sm">Debtor</th>
            <th className="text-left p-3 text-sm">Type</th><th className="text-left p-3 text-sm">Total Estate</th>
            <th className="text-left p-3 text-sm">Next Action</th><th className="text-left p-3 text-sm">Due</th>
          </tr></thead>
          <tbody>
            {[
              { ref: 'SEQ-2023-00789', debtor: 'A. Brown', type: 'Sequestration', estate: '£45,000', action: 'Annual Report', due: '15 Jul' },
              { ref: 'PTD-2024-00034', debtor: 'B. Green', type: 'Trust Deed', estate: '£28,000', action: 'Distribution', due: '1 Jul' },
              { ref: 'SEQ-2024-00156', debtor: 'C. White', type: 'Sequestration', estate: '£12,500', action: 'Asset Realisation', due: '30 Jun' },
            ].map(c => (
              <tr key={c.ref} className="border-b border-gray-100">
                <td className="p-3 text-sm font-mono">{c.ref}</td>
                <td className="p-3 text-sm">{c.debtor}</td>
                <td className="p-3 text-sm">{c.type}</td>
                <td className="p-3 text-sm font-bold">{c.estate}</td>
                <td className="p-3 text-sm">{c.action}</td>
                <td className="p-3 text-sm text-gray-600">{c.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded p-4 mb-6">
        <h3 className="font-bold mb-3">Compliance & Reporting</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <ActionButton label="Submit Annual Report" icon="📊" onClick={() => setActivePanel(activePanel === 'report' ? 'none' : 'report')} />
          <ActionButton label="Record Distribution" icon="💰" onClick={() => setActivePanel(activePanel === 'distribution' ? 'none' : 'distribution')} />
          <ActionButton label="Upload Case Documents" icon="📄" onClick={() => setActivePanel(activePanel === 'upload' ? 'none' : 'upload')} />
        </div>
      </div>

      {activePanel !== 'none' && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">
              {activePanel === 'report' && '📊 Submit Annual Report'}
              {activePanel === 'distribution' && '💰 Record Distribution'}
              {activePanel === 'upload' && '📄 Upload Case Documents'}
            </h2>
            <button onClick={() => setActivePanel('none')} className="text-sm border border-gray-300 px-2 py-1 rounded">✕ Close</button>
          </div>

          {activePanel === 'report' && (
            <div className="bg-white border border-gray-200 rounded p-6">
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm text-red-800"><strong>⚠ Overdue:</strong> Annual report for SEQ-2023-00789 (A. Brown) was due 30 June 2026</p>
              </div>
              <div className="mb-4"><label className="block text-sm font-bold mb-1">Select case:</label>
                <select className="border border-gray-300 p-2 w-full max-w-sm text-sm rounded">
                  <option>SEQ-2023-00789 — A. Brown (OVERDUE)</option>
                  <option>PTD-2024-00034 — B. Green (due 15 Jul)</option>
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                <div><label className="block font-bold mb-1">Reporting period</label><input type="text" defaultValue="Jul 2025 — Jun 2026" className="border border-gray-300 p-2 w-full rounded" /></div>
                <div><label className="block font-bold mb-1">Total ingathered this period</label><input type="text" defaultValue="£12,450" className="border border-gray-300 p-2 w-full rounded" /></div>
                <div><label className="block font-bold mb-1">Distributions made</label><input type="text" defaultValue="£8,200" className="border border-gray-300 p-2 w-full rounded" /></div>
                <div><label className="block font-bold mb-1">Trustee fees claimed</label><input type="text" defaultValue="£2,100" className="border border-gray-300 p-2 w-full rounded" /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-bold mb-1">Summary notes</label>
                <textarea rows={3} defaultValue="Asset realisation ongoing. Property valued at £95,000, marketing commenced. Debtor cooperating." className="border border-gray-300 p-2 w-full text-sm rounded"></textarea>
              </div>
              {reportSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded p-3"><p className="text-green-800 font-bold">✓ Annual report submitted successfully. AiB will review within 14 days.</p></div>
              ) : (
                <button onClick={() => setReportSubmitted(true)} className="bg-green-700 text-white font-bold py-2 px-6 text-sm hover:bg-green-800">Submit Report to AiB</button>
              )}
            </div>
          )}

          {activePanel === 'distribution' && (
            <div className="bg-white border border-gray-200 rounded p-6">
              <div className="mb-4"><label className="block text-sm font-bold mb-1">Case:</label>
                <select className="border border-gray-300 p-2 w-full max-w-sm text-sm rounded">
                  <option>PTD-2024-00034 — B. Green (Trust Deed)</option>
                  <option>SEQ-2023-00789 — A. Brown (Sequestration)</option>
                </select>
              </div>
              <h4 className="font-bold text-sm mb-2">Creditor Distribution</h4>
              <table className="w-full text-sm border border-gray-200 mb-4">
                <thead className="bg-gray-50"><tr><th className="p-2 text-left">Creditor</th><th className="p-2 text-right">Claim</th><th className="p-2 text-right">% Share</th><th className="p-2 text-right">Distribution</th></tr></thead>
                <tbody>
                  <tr className="border-t"><td className="p-2">Royal Bank of Scotland</td><td className="p-2 text-right">£12,000</td><td className="p-2 text-right">42.9%</td><td className="p-2 text-right font-bold">£1,286</td></tr>
                  <tr className="border-t"><td className="p-2">Barclays Bank</td><td className="p-2 text-right">£8,000</td><td className="p-2 text-right">28.6%</td><td className="p-2 text-right font-bold">£857</td></tr>
                  <tr className="border-t"><td className="p-2">HMRC</td><td className="p-2 text-right">£5,000</td><td className="p-2 text-right">17.9%</td><td className="p-2 text-right font-bold">£536</td></tr>
                  <tr className="border-t"><td className="p-2">Glasgow City Council</td><td className="p-2 text-right">£3,000</td><td className="p-2 text-right">10.7%</td><td className="p-2 text-right font-bold">£321</td></tr>
                  <tr className="border-t-2 font-bold"><td className="p-2">TOTAL</td><td className="p-2 text-right">£28,000</td><td className="p-2 text-right">100%</td><td className="p-2 text-right">£3,000</td></tr>
                </tbody>
              </table>
              {distRecorded ? (
                <div className="bg-green-50 border border-green-200 rounded p-3"><p className="text-green-800 font-bold">✓ Distribution recorded. Payment instructions sent to payment distributor.</p></div>
              ) : (
                <button onClick={() => setDistRecorded(true)} className="bg-green-700 text-white font-bold py-2 px-6 text-sm hover:bg-green-800">Record Distribution & Instruct Payment</button>
              )}
            </div>
          )}

          {activePanel === 'upload' && <DebtorUploadPanel />}
        </div>
      )}
    </div>
  );
}

function DebtorDashboard({ user }: { user: any }) {
  const [activePanel, setActivePanel] = useState<'none' | 'upload' | 'contact' | 'recommendation' | 'adviser'>('none');
  const [contactSaved, setContactSaved] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  return (
    <div>
      <h1>My Applications</h1>
      <p className="text-gray-600 mb-6">Welcome, {user.name}</p>

      {/* Active Application Card */}
      <div className="bg-white border-2 border-gov-blue rounded p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold">Application IAAS-2024-00001</h2>
            <p className="text-sm text-gray-600">Submitted 15 March 2024</p>
          </div>
          <StatusBadge status="Recommendation Issued" />
        </div>
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
          <p className="font-bold text-green-800 mb-1">Recommendation: Debt Arrangement Scheme (DAS)</p>
          <p className="text-sm text-green-700">Based on your circumstances, DAS allows repayment in full with creditor protection.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-600">Total Debt:</span> <span className="font-bold">£12,700</span></div>
          <div><span className="text-gray-600">Proposed Payment:</span> <span className="font-bold">£265/month</span></div>
          <div><span className="text-gray-600">Duration:</span> <span className="font-bold">~48 months</span></div>
        </div>
        <div className="mt-4 flex gap-3">
          <button className="bg-gov-green text-white font-bold py-2 px-4 text-sm border-b-2 border-green-900">Accept Recommendation</button>
          <button className="bg-gray-200 text-gray-900 font-bold py-2 px-4 text-sm border-b-2 border-gray-400">Request Review</button>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white border border-gray-200 rounded p-6 mb-6">
        <h2 className="font-bold mb-4">Application Progress</h2>
        <div className="space-y-4">
          {[
            { step: 'Application Submitted', date: '15 Mar 2024', done: true },
            { step: 'System Checks Complete', date: '15 Mar 2024', done: true },
            { step: 'Credit Check Complete', date: '15 Mar 2024', done: true },
            { step: 'Recommendation Issued', date: '16 Mar 2024', done: true },
            { step: 'Awaiting Your Decision', date: '', done: false, current: true },
            { step: 'Money Adviser Assigned', date: '', done: false },
            { step: 'DPP Created', date: '', done: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${step.done ? 'bg-gov-green text-white' : step.current ? 'bg-gov-blue text-white animate-pulse' : 'bg-gray-200 text-gray-500'}`}>
                {step.done ? '✓' : i + 1}
              </div>
              <div className="flex-1">
                <p className={`text-sm ${step.current ? 'font-bold' : ''}`}>{step.step}</p>
                {step.date && <p className="text-xs text-gray-500">{step.date}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions & Help */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="font-bold mb-3">Your Actions</h3>
          <div className="space-y-2">
            <ActionButton label="Upload Additional Documents" icon="📄" onClick={() => setActivePanel(activePanel === 'upload' ? 'none' : 'upload')} />
            <ActionButton label="Update Contact Details" icon="✏️" onClick={() => setActivePanel(activePanel === 'contact' ? 'none' : 'contact')} />
            <ActionButton label="View Full Recommendation" icon="📋" onClick={() => setActivePanel(activePanel === 'recommendation' ? 'none' : 'recommendation')} />
            <ActionButton label="Contact Money Adviser" icon="📞" onClick={() => setActivePanel(activePanel === 'adviser' ? 'none' : 'adviser')} />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="font-bold mb-3">Need Help?</h3>
          <p className="text-sm mb-3">Free money advice is available:</p>
          <ul className="text-sm space-y-1">
            <li>📞 Citizens Advice Scotland: 0800 028 1456</li>
            <li>📞 National Debtline: 0808 808 4000</li>
            <li>💬 Online chat available Mon-Fri 9-5</li>
          </ul>
        </div>
      </div>

      {/* Active Panel */}
      {activePanel !== 'none' && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">
              {activePanel === 'upload' && '📄 Upload Documents'}
              {activePanel === 'contact' && '✏️ Update Contact Details'}
              {activePanel === 'recommendation' && '📋 Your Recommendation'}
              {activePanel === 'adviser' && '📞 Contact Your Adviser'}
            </h2>
            <button onClick={() => setActivePanel('none')} className="text-gray-500 hover:text-gray-800 text-sm border border-gray-300 px-2 py-1 rounded">✕ Close</button>
          </div>

          {/* Upload Documents */}
          {activePanel === 'upload' && <DebtorUploadPanel />}

          {/* Update Contact Details */}
          {activePanel === 'contact' && (
            <div className="bg-white border border-gray-200 rounded p-6">
              <p className="text-sm text-gray-600 mb-4">Update your contact information below. Changes will take effect within 24 hours.</p>
              <p className="text-xs text-gray-400 mb-6">Last updated: 15 March 2024</p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-bold mb-1">Email address</label><input defaultValue="john.testerton@example.com" className="border-2 border-gray-900 p-2 w-full text-sm" /></div>
                <div><label className="block text-sm font-bold mb-1">Primary phone</label><input defaultValue="07700900001" className="border-2 border-gray-900 p-2 w-full text-sm" /></div>
                <div><label className="block text-sm font-bold mb-1">Secondary phone (optional)</label><input defaultValue="" placeholder="e.g. home landline" className="border-2 border-gray-900 p-2 w-full text-sm" /></div>
                <div>
                  <label className="block text-sm font-bold mb-1">Preferred contact method</label>
                  <div className="flex gap-4 mt-2">
                    {['Email', 'Phone', 'Post'].map(m => (
                      <label key={m} className="flex items-center gap-1 text-sm"><input type="radio" name="contactPref" defaultChecked={m === 'Email'} /> {m}</label>
                    ))}
                  </div>
                </div>
              </div>
              <h4 className="font-bold text-sm mt-6 mb-3">Current Address</h4>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-bold mb-1">Address line 1</label><input defaultValue="42 Example Street" className="border-2 border-gray-900 p-2 w-full text-sm" /></div>
                <div><label className="block text-sm font-bold mb-1">City</label><input defaultValue="Edinburgh" className="border-2 border-gray-900 p-2 w-full text-sm" /></div>
                <div><label className="block text-sm font-bold mb-1">Postcode</label>
                  <div className="flex gap-2"><input defaultValue="EH1 1AA" className="border-2 border-gray-900 p-2 text-sm w-32" /><button className="bg-blue-700 text-white text-xs px-3 py-2 hover:bg-blue-800">Find address</button></div>
                </div>
                <div><label className="block text-sm font-bold mb-1">Resident since</label><input type="date" defaultValue="2018-06-01" className="border-2 border-gray-900 p-2 w-full text-sm" /></div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
                <p className="text-sm"><strong>Moving home?</strong> If you are changing address, please provide your new address and move date. Your case officer will be notified.</p>
              </div>
              {contactSaved ? (
                <div className="bg-green-50 border border-green-200 rounded p-3"><p className="text-sm text-green-800 font-bold">✓ Contact details updated successfully. Changes will be reflected within 24 hours.</p></div>
              ) : (
                <button onClick={() => setContactSaved(true)} className="bg-gov-green text-white font-bold py-2 px-6 text-sm border-b-2 border-green-900 hover:bg-green-800">Save Changes</button>
              )}
            </div>
          )}

          {/* View Full Recommendation */}
          {activePanel === 'recommendation' && (
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <div className="bg-gradient-to-r from-green-700 to-green-900 text-white p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white">Debt Arrangement Scheme (DAS)</h3>
                    <p className="text-green-200">Recommended for your circumstances</p>
                  </div>
                  <span className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold">HIGH CONFIDENCE</span>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-bold mb-2">Why we recommend DAS</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Your total debt of £12,700 falls within the DAS eligibility range</li>
                    <li>You have disposable income of £220/month for structured repayment</li>
                    <li>No existing insolvency proceedings found in our system checks</li>
                    <li>DAS provides statutory protection — creditors cannot take enforcement action</li>
                    <li>You can repay your debts in full over an extended period</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-2">What DAS means for you</h4>
                  <p className="text-sm text-gray-700 mb-3">The Debt Arrangement Scheme allows you to repay your debts in full over an extended period through a Debt Payment Programme (DPP). While in the programme, your creditors cannot take enforcement action against you, and interest and charges are frozen.</p>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-green-50 rounded">✓ Single affordable monthly payment</div>
                    <div className="p-3 bg-green-50 rounded">✓ Interest and charges frozen</div>
                    <div className="p-3 bg-green-50 rounded">✓ Protection from creditor action</div>
                    <div className="p-3 bg-green-50 rounded">✓ Keep your assets</div>
                    <div className="p-3 bg-green-50 rounded">✓ No impact on most professions</div>
                    <div className="p-3 bg-green-50 rounded">✓ Repay in full — no write-off</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2">How DAS compares</h4>
                  <table className="w-full text-sm border border-gray-200">
                    <thead className="bg-gray-50"><tr><th className="p-2 text-left">Feature</th><th className="p-2 text-center">DAS</th><th className="p-2 text-center">Trust Deed</th><th className="p-2 text-center">Sequestration</th></tr></thead>
                    <tbody>
                      <tr className="border-t"><td className="p-2">Repay in full</td><td className="p-2 text-center text-green-700 font-bold">Yes</td><td className="p-2 text-center">Partial</td><td className="p-2 text-center">No</td></tr>
                      <tr className="border-t"><td className="p-2">Keep assets</td><td className="p-2 text-center text-green-700 font-bold">Yes</td><td className="p-2 text-center">Maybe</td><td className="p-2 text-center">No</td></tr>
                      <tr className="border-t"><td className="p-2">Duration</td><td className="p-2 text-center">~4 years</td><td className="p-2 text-center">4 years</td><td className="p-2 text-center">1 year</td></tr>
                      <tr className="border-t"><td className="p-2">Public register</td><td className="p-2 text-center text-green-700 font-bold">No</td><td className="p-2 text-center">Yes</td><td className="p-2 text-center">Yes</td></tr>
                      <tr className="border-t"><td className="p-2">Credit impact</td><td className="p-2 text-center">6 years</td><td className="p-2 text-center">6 years</td><td className="p-2 text-center">6 years</td></tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h4 className="font-bold mb-2">What happens next</h4>
                  <ol className="list-decimal pl-5 text-sm space-y-2">
                    <li><strong>Accept this recommendation</strong> — Click "Accept Recommendation" above</li>
                    <li><strong>Money adviser assigned</strong> — A qualified adviser will contact you within 3 days</li>
                    <li><strong>DPP proposal created</strong> — Your adviser prepares a formal payment plan</li>
                    <li><strong>Creditors notified</strong> — Your creditors are told about the proposed arrangement</li>
                    <li><strong>DPP approved</strong> — Once approved, you make a single monthly payment</li>
                  </ol>
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 text-sm rounded hover:bg-gray-300">📥 Download as PDF</button>
                  <button onClick={() => setActivePanel('adviser')} className="bg-blue-700 text-white font-bold py-2 px-4 text-sm rounded hover:bg-blue-800">💬 Discuss with Adviser</button>
                </div>
                <p className="text-xs text-gray-500 italic">This is an automated recommendation for information purposes only. It does not constitute financial or legal advice. Speak with a qualified money adviser before making any decisions.</p>
              </div>
            </div>
          )}

          {/* Contact Money Adviser */}
          {activePanel === 'adviser' && (
            <div className="bg-white border border-gray-200 rounded p-6">
              {/* Adviser Card */}
              <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded mb-6">
                <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg">FC</div>
                <div className="flex-1">
                  <p className="font-bold">Fiona Campbell</p>
                  <p className="text-sm text-gray-600">Money Adviser — CAS Edinburgh Bureau</p>
                  <p className="text-xs text-gray-500">Citizens Advice Scotland</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-xs text-green-700">Available Mon–Fri, 9:00–17:00</span>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p>📞 0131 555 0001</p>
                  <p className="text-xs text-gray-500">adviser@cas.example.org</p>
                </div>
              </div>

              {/* Message History */}
              <h4 className="font-bold text-sm mb-3">Message History</h4>
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                <div className="flex gap-3"><div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">FC</div><div className="bg-gray-100 rounded-lg p-3 flex-1"><p className="text-xs text-gray-500 mb-1">Fiona Campbell — 16 Mar, 10:30</p><p className="text-sm">Hello John, I have reviewed your application and recommendation. DAS looks like a very suitable option for your circumstances. Would you like to schedule a call to discuss the next steps?</p></div></div>
                <div className="flex gap-3 justify-end"><div className="bg-blue-50 rounded-lg p-3 max-w-md"><p className="text-xs text-gray-500 mb-1">You — 16 Mar, 14:15</p><p className="text-sm">Hi Fiona, thank you. Yes I would like to discuss this. I am available most mornings next week. Is there anything I should prepare?</p></div><div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">JT</div></div>
                <div className="flex gap-3"><div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">FC</div><div className="bg-gray-100 rounded-lg p-3 flex-1"><p className="text-xs text-gray-500 mb-1">Fiona Campbell — 17 Mar, 09:00</p><p className="text-sm">I have booked us a Teams call for Wednesday 2 July at 09:30. Please have your latest bank statement and payslip handy. We will go through the DAS application together. Looking forward to speaking with you.</p></div></div>
              </div>

              {/* Send Message */}
              <h4 className="font-bold text-sm mb-2">Send a message</h4>
              <div className="space-y-3">
                <select className="border border-gray-300 p-2 text-sm rounded w-full"><option>General enquiry</option><option>About my recommendation</option><option>Upload help needed</option><option>Change appointment</option><option>Urgent matter</option></select>
                <textarea rows={3} className="border-2 border-gray-900 p-2 text-sm w-full" placeholder="Type your message here..."></textarea>
                {messageSent ? (
                  <div className="bg-green-50 border border-green-200 rounded p-3"><p className="text-sm text-green-800 font-bold">✓ Message sent. Your adviser will respond within 1 working day.</p></div>
                ) : (
                  <button onClick={() => setMessageSent(true)} className="bg-blue-700 text-white font-bold py-2 px-6 text-sm hover:bg-blue-800">Send Message</button>
                )}
              </div>

              {/* Alternative contact */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-bold text-sm mb-2">Other ways to reach us</h4>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 border rounded"><p className="font-bold">📞 Phone</p><p className="text-gray-600">0131 555 0001</p><p className="text-xs text-gray-400">Mon-Fri 9-5</p></div>
                  <div className="p-3 border rounded"><p className="font-bold">🏢 Office</p><p className="text-gray-600">1 Advice Square, Edinburgh EH3</p><p className="text-xs text-gray-400">Walk-in available</p></div>
                  <div className="p-3 border rounded"><p className="font-bold">🚨 Urgent?</p><p className="text-gray-600">National Debtline</p><p className="text-xs text-gray-400">0808 808 4000 (free)</p></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== DEBTOR UPLOAD PANEL =====
function DebtorUploadPanel() {
  const [files, setFiles] = useState<Array<{ name: string; size: number; category: string; status: 'pending' | 'uploading' | 'scanning' | 'clean' | 'quarantined' }>>([]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size, category: 'other', status: 'pending' as const }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const updateCategory = (i: number, category: string) => {
    setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, category } : f));
  };

  const uploadAll = () => {
    setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })));
    setTimeout(() => setFiles(prev => prev.map(f => ({ ...f, status: 'scanning' as const }))), 1200);
    setTimeout(() => setFiles(prev => prev.map(f => ({
      ...f, status: (f.name.toLowerCase().includes('virus') || f.name.toLowerCase().includes('eicar')) ? 'quarantined' as const : 'clean' as const,
    }))), 3500);
  };

  return (
    <div className="bg-white border border-gray-200 rounded p-6">
      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 flex items-center gap-2">
        <span>📎</span>
        <p className="text-sm">Uploading for: <strong>Application IAAS-2024-00001</strong></p>
      </div>

      {/* Previously uploaded */}
      <h4 className="font-bold text-sm mb-2">Previously uploaded documents</h4>
      <div className="space-y-1 mb-6">
        {[
          { name: 'payslip_march_2024.pdf', cat: 'Income Evidence', date: '15 Mar' },
          { name: 'bank_statement_feb.pdf', cat: 'Income Evidence', date: '15 Mar' },
          { name: 'council_tax_bill.pdf', cat: 'Debt Evidence', date: '15 Mar' },
        ].map((doc, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
            <span>📄 {doc.name} <span className="text-xs text-gray-500">({doc.cat})</span></span>
            <span className="text-xs text-green-700 font-bold">✓ Verified — {doc.date}</span>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <h4 className="font-bold text-sm mb-2">Add new documents</h4>
      <div className="border-2 border-dashed border-gray-400 rounded p-6 text-center bg-gray-50 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer mb-4"
        onClick={() => document.getElementById('debtor-file-input')?.click()}>
        <p className="text-lg mb-1">📂 Drop files here or click to browse</p>
        <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC, DOCX — max 10MB each — multiple files allowed</p>
        <input id="debtor-file-input" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handleFiles} />
      </div>

      {/* ClamAV notice */}
      <div className="bg-green-50 border border-green-200 rounded p-3 mb-4 flex items-center gap-2">
        <span>🛡️</span>
        <div>
          <p className="text-sm font-bold text-green-800">Secure Upload</p>
          <p className="text-xs text-green-700">All files are automatically virus-scanned (ClamAV) and encrypted at rest. Your documents are stored securely.</p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2 mb-4">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
              <span className="text-lg">{file.name.endsWith('.pdf') ? '📕' : '📄'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              {file.status === 'pending' && (
                <select value={file.category} onChange={e => updateCategory(i, e.target.value)} className="border border-gray-300 p-1 text-xs rounded">
                  <option value="other">Category...</option>
                  <option value="identification">Identification</option>
                  <option value="proof_of_address">Proof of Address</option>
                  <option value="income_evidence">Income Evidence</option>
                  <option value="debt_evidence">Debt Evidence</option>
                  <option value="other">Other</option>
                </select>
              )}
              <div>
                {file.status === 'pending' && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">Ready</span>}
                {file.status === 'uploading' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded animate-pulse">Uploading...</span>}
                {file.status === 'scanning' && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded animate-pulse">🔍 Scanning...</span>}
                {file.status === 'clean' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">✓ Accepted</span>}
                {file.status === 'quarantined' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">⚠ Rejected</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && files.some(f => f.status === 'pending') && (
        <button onClick={uploadAll} className="bg-gov-green text-white font-bold py-2 px-6 text-sm hover:bg-green-800">Upload & Scan All</button>
      )}
      {files.length > 0 && files.every(f => f.status === 'clean' || f.status === 'quarantined') && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm text-green-800 font-bold">✓ Upload complete. {files.filter(f => f.status === 'clean').length} document(s) added to your application.</p>
        </div>
      )}
    </div>
  );
}

// Shared components
function KpiCard({ label, value, trend, colour }: { label: string; value: string; trend?: string; colour: string }) {
  const colours: Record<string, string> = {
    blue: 'border-l-4 border-gov-blue',
    green: 'border-l-4 border-gov-green',
    orange: 'border-l-4 border-orange-500',
    red: 'border-l-4 border-gov-red',
    purple: 'border-l-4 border-purple-600',
  };
  return (
    <div className={`bg-white border border-gray-200 rounded p-4 ${colours[colour]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
      {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    'Submitted': 'bg-blue-100 text-blue-800',
    'Under Review': 'bg-purple-100 text-purple-800',
    'Recommendation Issued': 'bg-green-100 text-green-800',
    'Awaiting Info': 'bg-orange-100 text-orange-800',
    'Draft': 'bg-gray-200 text-gray-700',
    'Active': 'bg-green-100 text-green-800',
    'Claim Filed': 'bg-blue-100 text-blue-800',
    'Proposal': 'bg-yellow-100 text-yellow-800',
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${colours[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

function ActionButton({ label, icon, onClick }: { label: string; icon: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left p-2 text-sm border border-gray-200 rounded hover:bg-gray-50 hover:border-gov-blue flex items-center gap-2">
      <span>{icon}</span> {label}
    </button>
  );
}
