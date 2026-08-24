import { Section } from '../Section';

/* ─── Shared Helpers ─── */

function KpiCard({ value, label, colour = 'border-blue-500' }: { value: string; label: string; colour?: string }) {
  return (
    <div className={`border-l-4 ${colour} bg-white rounded shadow-sm p-3 flex-1`}>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}

function QuickAction({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} className="flex-1 text-center py-2 px-3 bg-gov-blue text-white text-xs font-bold rounded hover:bg-blue-800 no-underline">
      {label}
    </a>
  );
}

function StatusDot({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-700">
      <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
      {name}
    </span>
  );
}

/* ─── Screen 1: System Admin Dashboard ─── */

function AdminDashboard() {
  const applications = [
    { ref: 'IAAS-2024-00012', link: '#case-detail-pass', applicant: 'John Testerton', debt: '£12,700', status: 'Submitted', action: 'Review' },
    { ref: 'IAAS-2024-00011', link: '#case-detail-fail', applicant: 'B. Campbell', debt: '£8,200', status: 'Credit Check Failed', action: 'Review' },
    { ref: 'IAAS-2024-00010', link: '#dashboard-admin', applicant: 'C. Stewart', debt: '£15,400', status: 'Awaiting Info', action: 'Chase' },
    { ref: 'IAAS-2024-00009', link: '#dashboard-admin', applicant: 'D. Minimal', debt: '£3,800', status: 'Approved', action: 'Notify' },
  ];

  return (
    <Section id="dashboard-admin" title="Dashboard — System Admin" screenNumber={21}>
      <h2 className="text-lg font-bold mb-4 border-b-4 border-black pb-2">AiB System Admin Dashboard</h2>

      {/* KPI Row */}
      <div className="flex gap-3 mb-4">
        <KpiCard value="4" label="Pending Review" colour="border-amber-500" />
        <KpiCard value="2" label="Awaiting Info" colour="border-blue-500" />
        <KpiCard value="7" label="Approved This Week" colour="border-green-500" />
        <KpiCard value="38" label="Total Active" colour="border-purple-500" />
      </div>

      {/* AI Anomaly Alert */}
      <div className="bg-amber-50 border border-amber-400 rounded p-3 mb-4">
        <p className="text-sm font-bold text-amber-800">
          ⚠ AI anomaly detection: <span className="font-normal">High-value application (£45,200) flagged for review — 94% confidence outlier score</span>
        </p>
      </div>

      {/* Applications Table */}
      <h3 className="font-bold text-sm mb-2">Applications Requiring Action</h3>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 font-bold border-b">Ref</th>
              <th className="text-left p-2 font-bold border-b">Applicant</th>
              <th className="text-left p-2 font-bold border-b">Total Debt</th>
              <th className="text-left p-2 font-bold border-b">Status</th>
              <th className="text-left p-2 font-bold border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-blue-50">
                <td className="p-2"><a href={app.link} className="text-gov-blue font-medium">{app.ref}</a></td>
                <td className="p-2 text-gray-700">{app.applicant}</td>
                <td className="p-2 text-gray-700">{app.debt}</td>
                <td className="p-2"><span className="text-xs px-2 py-0.5 rounded font-bold bg-gray-100 text-gray-700">{app.status}</span></td>
                <td className="p-2"><a href={app.link} className="text-gov-blue font-bold text-xs">{app.action} →</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <QuickAction label="Integration Health" href="#admin-dashboard" />
        <QuickAction label="Audit Log" href="#admin-dashboard" />
        <QuickAction label="User Management" href="#admin-dashboard" />
        <QuickAction label="Reports" href="#admin-dashboard" />
      </div>

      {/* System Status */}
      <div className="bg-gray-50 border border-gray-200 rounded p-3">
        <h4 className="font-bold text-xs mb-2">System Status</h4>
        <div className="flex gap-4 flex-wrap">
          <StatusDot name="BASYS" />
          <StatusDot name="ASTRA" />
          <StatusDot name="eDEN" />
          <StatusDot name="CFT" />
          <StatusDot name="RoI" />
          <StatusDot name="IAAS" />
        </div>
      </div>
    </Section>
  );
}

/* ─── Screen 2: Case Officer Dashboard ─── */

function OfficerDashboard() {
  const cases = [
    { ref: 'IAAS-2024-00012', task: 'New application — John Testerton', debt: '£12,700', status: 'Submitted', due: '30 Jun' },
    { ref: 'SEQ-2024-00123', task: 'Annual review — A. Brown', debt: '£22,400', status: 'Overdue', due: '1 Jul' },
    { ref: 'MAP-2024-00089', task: 'Discharge pending — D. Minimal', debt: '£3,800', status: 'In Progress', due: '20 Jul' },
  ];

  const statusColours: Record<string, string> = {
    Submitted: 'bg-blue-100 text-blue-800',
    Overdue: 'bg-red-100 text-red-800',
    'In Progress': 'bg-purple-100 text-purple-800',
  };

  return (
    <Section id="dashboard-officer" title="Dashboard — Case Officer" screenNumber={22}>
      <h2 className="text-lg font-bold mb-4 border-b-4 border-black pb-2">Case Officer Dashboard — James Wilson</h2>

      {/* KPI Row */}
      <div className="flex gap-3 mb-4">
        <KpiCard value="3" label="My Cases" colour="border-blue-500" />
        <KpiCard value="1" label="Unassigned" colour="border-amber-500" />
        <KpiCard value="2" label="Due This Week" colour="border-red-500" />
      </div>

      {/* Cases Table */}
      <h3 className="font-bold text-sm mb-2">My Assigned Cases</h3>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 font-bold border-b">Ref</th>
              <th className="text-left p-2 font-bold border-b">Task</th>
              <th className="text-left p-2 font-bold border-b">Total Debt</th>
              <th className="text-left p-2 font-bold border-b">Status</th>
              <th className="text-left p-2 font-bold border-b">Due</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-blue-50">
                <td className="p-2"><a href="#case-detail-pass" className="text-gov-blue font-medium">{c.ref}</a></td>
                <td className="p-2 text-gray-700">{c.task}</td>
                <td className="p-2 text-gray-700">{c.debt}</td>
                <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded font-bold ${statusColours[c.status] || 'bg-gray-100'}`}>{c.status}</span></td>
                <td className="p-2 text-gray-600">{c.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notifications */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <h4 className="font-bold text-xs mb-2">Notifications</h4>
        <ul className="text-sm space-y-1">
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
            New application <a href="#case-detail-pass" className="text-gov-blue font-medium">IAAS-2024-00012</a> requires assignment
          </li>
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0"></span>
            <span className="text-red-700 font-medium">SLA warning:</span> SEQ-2024-00123 overdue
          </li>
        </ul>
      </div>
    </Section>
  );
}

/* ─── Screen 3: Money Adviser Dashboard ─── */

function AdviserDashboard() {
  const clients = [
    { name: 'John Testerton', ref: 'IAAS-2024-00001', recommendation: 'DAS Recommended', debt: '£12,700', status: 'Awaiting decision', statusColour: 'bg-amber-100 text-amber-800' },
    { name: 'David Minimal', ref: 'IAAS-2024-00003', recommendation: 'MAP Recommended', debt: '£3,800', status: 'Under review', statusColour: 'bg-blue-100 text-blue-800' },
    { name: 'Sarah Lowdebt', ref: 'IAAS-2024-00005', recommendation: 'DPP Recommended', debt: '£5,100', status: 'DPP active', statusColour: 'bg-green-100 text-green-800' },
  ];

  return (
    <Section id="dashboard-adviser" title="Dashboard — Money Adviser" screenNumber={23}>
      <h2 className="text-lg font-bold mb-4 border-b-4 border-black pb-2">Money Adviser Dashboard — Fiona Campbell</h2>

      <h3 className="font-bold text-sm mb-3">My Client Applications</h3>

      {/* Client Cards */}
      <div className="space-y-3 mb-4">
        {clients.map((client, i) => (
          <div key={i} className="border border-gray-200 rounded p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-sm text-gray-900">{client.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${client.statusColour}`}>{client.status}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span><a href="#case-detail-pass" className="text-gov-blue font-medium">{client.ref}</a></span>
              <span>{client.recommendation}</span>
              <span>Debt: {client.debt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <QuickAction label="New Application" href="#apply-intro" />
        <QuickAction label="Upload Documents" href="#dashboard-adviser" />
        <QuickAction label="Run Credit Check" href="#dashboard-adviser" />
        <QuickAction label="View DAS Eligibility" href="#dashboard-adviser" />
      </div>

      {/* Upcoming Meetings */}
      <div className="bg-gray-50 border border-gray-200 rounded p-3">
        <h4 className="font-bold text-xs mb-2">Upcoming Client Meetings</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-bold text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">10 Jul</span>
            <div>
              <p className="font-medium text-gray-900">John Testerton — DAS options review</p>
              <p className="text-xs text-gray-500">Prep: Confirm income/expenditure, review DPP draft</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">14 Jul</span>
            <div>
              <p className="font-medium text-gray-900">David Minimal — MAP completion review</p>
              <p className="text-xs text-gray-500">Prep: Confirm asset schedule, gather discharge docs</p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ─── Screen 4: Creditor Dashboard ─── */

function CreditorDashboard() {
  const claims = [
    { caseRef: 'SEQ-2024-00045', debtor: 'A. Brown', amount: '£4,200', solution: 'Sequestration', status: 'Active' },
    { caseRef: 'DAS-2024-00089', debtor: 'F. Existing', amount: '£3,100', solution: 'DAS', status: 'Payment in progress' },
    { caseRef: 'PTD-2024-00023', debtor: 'G. Hamilton', amount: '£6,800', solution: 'Trust Deed', status: 'Year 2 of 4' },
  ];

  return (
    <Section id="dashboard-creditor" title="Dashboard — Creditor" screenNumber={24}>
      <h2 className="text-lg font-bold mb-1 border-b-4 border-black pb-2">Creditor Dashboard</h2>
      <p className="text-sm text-gray-600 mb-4">Sarah Mitchell — Royal Bank of Scotland</p>

      {/* Summary Cards */}
      <div className="flex gap-3 mb-4">
        <KpiCard value="3" label="Active Claims" colour="border-blue-500" />
        <KpiCard value="1" label="Pending" colour="border-amber-500" />
        <KpiCard value="£2,450" label="Dividends Due" colour="border-green-500" />
      </div>

      {/* Active Claims Table */}
      <h3 className="font-bold text-sm mb-2">Active Claims</h3>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 font-bold border-b">Case</th>
              <th className="text-left p-2 font-bold border-b">Debtor</th>
              <th className="text-left p-2 font-bold border-b">Amount Owed</th>
              <th className="text-left p-2 font-bold border-b">Solution</th>
              <th className="text-left p-2 font-bold border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-blue-50">
                <td className="p-2"><a href="#dashboard-creditor" className="text-gov-blue font-medium">{claim.caseRef}</a></td>
                <td className="p-2 text-gray-700">{claim.debtor}</td>
                <td className="p-2 text-gray-700">{claim.amount}</td>
                <td className="p-2 text-gray-700">{claim.solution}</td>
                <td className="p-2"><span className="text-xs px-2 py-0.5 rounded font-bold bg-gray-100 text-gray-700">{claim.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Proposals to Vote On */}
      <div className="bg-amber-50 border border-amber-200 rounded p-3">
        <h4 className="font-bold text-xs mb-2">Proposals to Vote On</h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">DAS-2024-00089 — Dividend Proposal</p>
            <p className="text-xs text-gray-600">F. Existing proposes £52/month over 60 months (total recovery: £3,120)</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded">Accept</button>
            <button className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded">Reject</button>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ─── Screen 5: Trustee/Supplier Dashboard ─── */

function TrusteeDashboard() {
  const cases = [
    { ref: 'SEQ-2024-00045', debtor: 'A. Brown', type: 'Sequestration', startDate: 'Jan 2024', status: 'Active' },
    { ref: 'PTD-2024-00023', debtor: 'G. Hamilton', type: 'Trust Deed', startDate: 'Mar 2023', status: 'Year 2 of 4' },
    { ref: 'SEQ-2024-00078', debtor: 'M. Thomson', type: 'Sequestration', startDate: 'Nov 2023', status: 'Pending discharge' },
  ];

  return (
    <Section id="dashboard-trustee" title="Dashboard — Trustee/Supplier" screenNumber={25}>
      <h2 className="text-lg font-bold mb-1 border-b-4 border-black pb-2">Trustee Dashboard</h2>
      <p className="text-sm text-gray-600 mb-4">Robert Henderson — Sample Insolvency Practitioners</p>

      {/* Cases Under Management */}
      <h3 className="font-bold text-sm mb-2">Cases Under Management</h3>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 font-bold border-b">Ref</th>
              <th className="text-left p-2 font-bold border-b">Debtor</th>
              <th className="text-left p-2 font-bold border-b">Type</th>
              <th className="text-left p-2 font-bold border-b">Start Date</th>
              <th className="text-left p-2 font-bold border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-blue-50">
                <td className="p-2"><a href="#dashboard-trustee" className="text-gov-blue font-medium">{c.ref}</a></td>
                <td className="p-2 text-gray-700">{c.debtor}</td>
                <td className="p-2 text-gray-700">{c.type}</td>
                <td className="p-2 text-gray-600">{c.startDate}</td>
                <td className="p-2"><span className="text-xs px-2 py-0.5 rounded font-bold bg-gray-100 text-gray-700">{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Annual Returns */}
      <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
        <h4 className="font-bold text-xs mb-2">Annual Returns</h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">SEQ-2024-00045 — Annual return due</p>
            <p className="text-xs text-gray-600">Due: 30 Jun 2024</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded font-bold bg-red-100 text-red-800">Overdue</span>
        </div>
      </div>

      {/* Record Distribution */}
      <div className="flex gap-2">
        <a href="#dashboard-trustee" className="px-4 py-2 bg-gov-blue text-white text-sm font-bold rounded hover:bg-blue-800 no-underline">
          Record Distribution
        </a>
      </div>
    </Section>
  );
}

/* ─── Screen 6: Debtor Dashboard ─── */

function DebtorDashboard() {
  const timeline = [
    { done: true, label: 'Application submitted', date: '15 Mar' },
    { done: true, label: 'System checks completed', date: '15 Mar' },
    { done: true, label: 'Credit check completed', date: '15 Mar' },
    { done: true, label: 'Recommendation issued', date: '16 Mar' },
    { done: false, label: 'Awaiting your decision', date: 'current', current: true },
    { done: false, label: 'Adviser assigned', date: '' },
    { done: false, label: 'DPP created', date: '' },
  ];

  return (
    <Section id="dashboard-debtor" title="Dashboard — Debtor" screenNumber={26}>
      <h2 className="text-lg font-bold mb-4 border-b-4 border-black pb-2">My Application</h2>

      {/* Application Summary Card */}
      <div className="border-l-4 border-gov-blue bg-blue-50 rounded p-4 mb-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 font-bold">Reference</p>
            <p className="font-bold text-gray-900">IAAS-2024-00001</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold">Recommendation</p>
            <p className="font-bold text-gray-900">Debt Arrangement Scheme (DAS)</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold">Total Debt</p>
            <p className="font-bold text-gray-900">£12,700</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold">Disposable Income</p>
            <p className="font-bold text-gray-900">£580/month</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500 font-bold">Estimated Repayment</p>
            <p className="font-bold text-gray-900">~22 months</p>
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <h3 className="font-bold text-sm mb-3">Application Progress</h3>
      <div className="mb-4 pl-2">
        {timeline.map((step, i) => (
          <div key={i} className="flex items-start gap-3 relative">
            {/* Vertical line */}
            {i < timeline.length - 1 && (
              <div className={`absolute left-[7px] top-5 w-0.5 h-6 ${step.done ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            )}
            {/* Dot */}
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${step.done ? 'bg-green-500 border-green-500' : step.current ? 'bg-white border-blue-500' : 'bg-white border-gray-300'}`}>
              {step.done && <span className="text-white text-[8px] font-bold">✓</span>}
            </div>
            {/* Label */}
            <div className="pb-4">
              <p className={`text-sm ${step.current ? 'font-bold text-blue-700' : step.done ? 'text-gray-700' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {step.date && <p className="text-xs text-gray-400">{step.date}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap mb-4">
        <QuickAction label="Upload Documents" href="#dashboard-debtor" />
        <QuickAction label="Update Contact" href="#dashboard-debtor" />
        <QuickAction label="View Recommendation" href="#dashboard-debtor" />
        <QuickAction label="Contact Adviser" href="#dashboard-debtor" />
      </div>

      {/* Help Panel */}
      <div className="bg-gray-50 border border-gray-200 rounded p-3">
        <h4 className="font-bold text-xs mb-1">Need help?</h4>
        <p className="text-sm text-gray-700">
          Speak to a money adviser for free, confidential debt advice:
          <span className="font-bold ml-1">0800 138 1111</span> (Mon–Fri, 9am–5pm)
        </p>
      </div>
    </Section>
  );
}

/* ─── Export ─── */

export function DashboardScreens() {
  return (
    <>
      <AdminDashboard />
      <OfficerDashboard />
      <AdviserDashboard />
      <CreditorDashboard />
      <TrusteeDashboard />
      <DebtorDashboard />
    </>
  );
}
