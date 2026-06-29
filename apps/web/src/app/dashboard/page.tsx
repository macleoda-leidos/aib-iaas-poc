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
            <ActionButton label="Generate Weekly Report" icon="📊" />
            <ActionButton label="Manage Users" icon="👥" />
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
  return (
    <div>
      <h1>Money Adviser Dashboard</h1>
      <p className="text-gray-600 mb-6">{user.org} — {user.name}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="My Active Cases" value="8" colour="blue" />
        <KpiCard label="Pending Submission" value="3" colour="orange" />
        <KpiCard label="Approved" value="14" trend="this month" colour="green" />
        <KpiCard label="Client Meetings" value="4" trend="this week" colour="purple" />
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
              <ActionButton label="Upload Documents" icon="📄" />
              <ActionButton label="Run Credit Check" icon="🔍" />
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
    </div>
  );
}

function CreditorDashboard({ user }: { user: any }) {
  return (
    <div>
      <h1>Creditor Portal</h1>
      <p className="text-gray-600 mb-6">{user.org}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Active Cases" value="23" colour="blue" />
        <KpiCard label="Pending Claims" value="5" colour="orange" />
        <KpiCard label="Dividends Due" value="£4,230" colour="green" />
        <KpiCard label="Proposals to Vote" value="2" colour="red" />
      </div>

      <div className="bg-white border border-gray-200 rounded mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold">Cases Involving Your Organisation</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="text-left p-3 text-sm">Reference</th><th className="text-left p-3 text-sm">Debtor</th>
            <th className="text-left p-3 text-sm">Type</th><th className="text-left p-3 text-sm">Our Claim</th>
            <th className="text-left p-3 text-sm">Status</th><th className="text-left p-3 text-sm">Action</th>
          </tr></thead>
          <tbody>
            {[
              { ref: 'DAS-2023-00456', debtor: 'J. Morrison', type: 'DAS', claim: '£8,200', status: 'Active', action: 'Vote' },
              { ref: 'SEQ-2024-00123', debtor: 'P. Thomson', type: 'Sequestration', claim: '£15,000', status: 'Claim Filed', action: 'View' },
              { ref: 'PTD-2024-00045', debtor: 'M. MacDonald', type: 'Trust Deed', claim: '£6,400', status: 'Proposal', action: 'Vote' },
            ].map(c => (
              <tr key={c.ref} className="border-b border-gray-100">
                <td className="p-3 text-sm font-mono">{c.ref}</td>
                <td className="p-3 text-sm">{c.debtor}</td>
                <td className="p-3 text-sm">{c.type}</td>
                <td className="p-3 text-sm font-bold">{c.claim}</td>
                <td className="p-3"><StatusBadge status={c.status} /></td>
                <td className="p-3"><button className="text-gov-blue text-sm underline">{c.action}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="font-bold mb-3">Dividend Schedule</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>DAS-2023-00456</span><span className="font-bold text-green-700">£285 (Jul)</span></div>
            <div className="flex justify-between"><span>SEQ-2024-00123</span><span className="text-gray-500">Pending adjudication</span></div>
            <div className="flex justify-between"><span>PTD-2024-00045</span><span className="text-gray-500">Awaiting acceptance</span></div>
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
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold">Cases Under Management</h2>
        </div>
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

      <div className="bg-white border border-gray-200 rounded p-4">
        <h3 className="font-bold mb-3">Compliance & Reporting</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <ActionButton label="Submit Annual Report" icon="📊" />
          <ActionButton label="Record Distribution" icon="💰" />
          <ActionButton label="Upload Case Documents" icon="📄" />
        </div>
      </div>
    </div>
  );
}

function DebtorDashboard({ user }: { user: any }) {
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
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="font-bold mb-3">Your Actions</h3>
          <div className="space-y-2">
            <ActionButton label="Upload Additional Documents" icon="📄" />
            <ActionButton label="Update Contact Details" icon="✏️" />
            <ActionButton label="View Full Recommendation" icon="📋" />
            <ActionButton label="Contact Money Adviser" icon="📞" />
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

function ActionButton({ label, icon }: { label: string; icon: string }) {
  return (
    <button className="w-full text-left p-2 text-sm border border-gray-200 rounded hover:bg-gray-50 hover:border-gov-blue flex items-center gap-2">
      <span>{icon}</span> {label}
    </button>
  );
}
