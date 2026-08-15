import { Section } from '../page';

const SYSTEMS = [
  { id: 'BASYS', name: 'Bankruptcy Administration', icon: '⚖️', colour: 'border-blue-500', tasks: 12 },
  { id: 'ASTRA', name: 'Strategy & Admin', icon: '📊', colour: 'border-purple-500', tasks: 5 },
  { id: 'eDEN', name: 'DAS Electronic System', icon: '💳', colour: 'border-green-500', tasks: 18 },
  { id: 'CFT', name: 'Creditor/Trustee', icon: '🏛️', colour: 'border-orange-500', tasks: 8 },
  { id: 'RoI', name: 'Register of Insolvencies', icon: '📋', colour: 'border-red-500', tasks: 3 },
  { id: 'IAAS', name: 'Application Advice', icon: '🎯', colour: 'border-teal-500', tasks: 15 },
];

const WORK_QUEUE_FULL = [
  { ref: 'IAAS-2024-00012', task: 'New application submitted', priority: 'high', assignee: 'Unassigned', due: '30 Jun', status: 'New' },
  { ref: 'SEQ-2024-00123', task: 'Annual review due — A. Brown', priority: 'high', assignee: 'James Wilson', due: '1 Jul', status: 'Overdue' },
  { ref: 'DAS-ARR-2024-001', task: 'Payment distribution overdue', priority: 'high', assignee: 'System', due: '28 Jun', status: 'Overdue' },
  { ref: 'IAAS-2024-00010', task: 'Awaiting additional information — C. Stewart', priority: 'medium', assignee: 'Karen MacLeod', due: '5 Jul', status: 'Pending' },
  { ref: 'CFT-REG-2024-045', task: 'Provider registration renewal — Highland Debt', priority: 'medium', assignee: 'Policy Team', due: '15 Jul', status: 'Pending' },
  { ref: 'DPP-2024-00456', task: 'New DPP application received', priority: 'medium', assignee: 'Unassigned', due: '3 Jul', status: 'New' },
  { ref: 'MAP-2024-00089', task: 'Discharge pending — D. Minimal', priority: 'low', assignee: 'James Wilson', due: '20 Jul', status: 'In Progress' },
  { ref: 'DAS-VAR-2024-023', task: 'DAS variation request — F. Existing', priority: 'medium', assignee: 'Fiona Campbell', due: '8 Jul', status: 'Pending' },
];

const OFFICER_QUEUE = [
  { ref: 'IAAS-2024-00012', task: 'New application submitted', priority: 'high', assignee: 'Unassigned', due: '30 Jun', status: 'New' },
  { ref: 'SEQ-2024-00123', task: 'Annual review due — A. Brown', priority: 'high', assignee: 'James Wilson', due: '1 Jul', status: 'Overdue' },
  { ref: 'MAP-2024-00089', task: 'Discharge pending — D. Minimal', priority: 'low', assignee: 'James Wilson', due: '20 Jul', status: 'In Progress' },
  { ref: 'IAAS-2024-00011', task: 'Credit check review — B. Campbell', priority: 'medium', assignee: 'James Wilson', due: '2 Jul', status: 'In Progress' },
];

const ADVISER_QUEUE = [
  { ref: 'IAAS-2024-00012', task: 'New client application submitted', priority: 'high', assignee: 'Unassigned', due: '30 Jun', status: 'New' },
  { ref: 'DAS-VAR-2024-023', task: 'DAS variation request — F. Existing', priority: 'medium', assignee: 'Fiona Campbell', due: '8 Jul', status: 'Pending' },
  { ref: 'DAS-REV-2024-015', task: 'DPP annual review — 3 programmes', priority: 'medium', assignee: 'Fiona Campbell', due: '12 Jul', status: 'Pending' },
];

const DEBTOR_QUEUE = [
  { ref: 'IAAS-2024-00001', task: 'Your application was submitted', priority: 'low', assignee: 'You', due: '15 Mar', status: 'Complete' },
  { ref: 'IAAS-2024-00001', task: 'System checks completed', priority: 'low', assignee: 'System', due: '15 Mar', status: 'Complete' },
  { ref: 'IAAS-2024-00001', task: 'Credit check completed', priority: 'low', assignee: 'System', due: '15 Mar', status: 'Complete' },
  { ref: 'IAAS-2024-00001', task: 'Recommendation issued: DAS', priority: 'medium', assignee: 'System', due: '16 Mar', status: 'Complete' },
  { ref: 'IAAS-2024-00001', task: 'Action required: Accept or review recommendation', priority: 'high', assignee: 'You', due: '5 Jul', status: 'Pending' },
];

const PRIORITY_COLOURS: Record<string, string> = { high: 'bg-red-100 text-red-800', medium: 'bg-amber-100 text-amber-800', low: 'bg-green-100 text-green-800' };
const STATUS_COLOURS: Record<string, string> = { New: 'bg-blue-100 text-blue-800', Overdue: 'bg-red-100 text-red-800', Pending: 'bg-amber-100 text-amber-800', 'In Progress': 'bg-purple-100 text-purple-800', 'Not Started': 'bg-gray-200 text-gray-700', Complete: 'bg-green-100 text-green-800' };

function PortalHeader({ name, role, org }: { name: string; role: string; org: string }) {
  return (
    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-t-lg">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
            <span className="text-sm font-bold">K</span>
          </div>
          <div>
            <p className="text-sm font-bold">{name}</p>
            <p className="text-xs text-blue-200">{role} • {org}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          <span className="text-xs">Session active</span>
        </div>
      </div>
    </div>
  );
}

function SystemTiles({ systems, dashboardLink }: { systems: typeof SYSTEMS; dashboardLink: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {systems.map(sys => (
        <a key={sys.id} href={dashboardLink} className="block border-l-4 p-3 bg-white rounded shadow-sm no-underline hover:shadow-md transition-shadow" style={{ borderLeftColor: sys.colour.replace('border-', '').includes('blue') ? '#3b82f6' : sys.colour.includes('purple') ? '#8b5cf6' : sys.colour.includes('green') ? '#22c55e' : sys.colour.includes('orange') ? '#f97316' : sys.colour.includes('red') ? '#ef4444' : '#14b8a6' }}>
          <div className="flex items-center justify-between">
            <span className="text-lg">{sys.icon}</span>
            <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded">{sys.tasks}</span>
          </div>
          <p className="font-bold text-sm mt-1 text-gray-900">{sys.id}</p>
          <p className="text-xs text-gray-500">{sys.name}</p>
        </a>
      ))}
    </div>
  );
}

function WorkQueue({ title, items, caseLink }: { title: string; items: typeof WORK_QUEUE_FULL; caseLink: string }) {
  return (
    <div>
      <h3 className="font-bold text-sm mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 font-bold border-b">Ref</th>
              <th className="text-left p-2 font-bold border-b">Task</th>
              <th className="text-left p-2 font-bold border-b">Priority</th>
              <th className="text-left p-2 font-bold border-b">Assignee</th>
              <th className="text-left p-2 font-bold border-b">Due</th>
              <th className="text-left p-2 font-bold border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-blue-50">
                <td className="p-2"><a href={caseLink} className="text-gov-blue font-medium">{item.ref}</a></td>
                <td className="p-2 text-gray-700">{item.task}</td>
                <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded font-bold ${PRIORITY_COLOURS[item.priority]}`}>{item.priority}</span></td>
                <td className="p-2 text-gray-600">{item.assignee}</td>
                <td className="p-2 text-gray-600">{item.due}</td>
                <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded font-bold ${STATUS_COLOURS[item.status] || 'bg-gray-100'}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PortalScreens() {
  return (
    <>
      {/* Portal: System Admin */}
      <Section id="portal-admin" title="Portal — System Admin" screenNumber={8}>
        <PortalHeader name="Admin User" role="System Admin" org="Accountant in Bankruptcy" />
        <div className="bg-white rounded-b-lg shadow p-4">
          <SystemTiles systems={SYSTEMS} dashboardLink="#dashboard-admin" />
          <WorkQueue title="System Administration — All Queues" items={WORK_QUEUE_FULL} caseLink="#case-detail-pass" />
        </div>
      </Section>

      {/* Portal: Case Officer */}
      <Section id="portal-officer" title="Portal — Case Officer" screenNumber={9}>
        <PortalHeader name="James Wilson" role="AiB Case Officer" org="AiB - Case Administration" />
        <div className="bg-white rounded-b-lg shadow p-4">
          <SystemTiles systems={SYSTEMS} dashboardLink="#dashboard-officer" />
          <WorkQueue title="My Work Queue" items={OFFICER_QUEUE} caseLink="#case-detail-pass" />
        </div>
      </Section>

      {/* Portal: Money Adviser */}
      <Section id="portal-adviser" title="Portal — Money Adviser" screenNumber={10}>
        <PortalHeader name="Fiona Campbell" role="Money Adviser" org="CAS - Edinburgh Bureau" />
        <div className="bg-white rounded-b-lg shadow p-4">
          <SystemTiles systems={SYSTEMS.filter(s => ['eDEN', 'IAAS'].includes(s.id))} dashboardLink="#dashboard-adviser" />
          <WorkQueue title="My Client Cases" items={ADVISER_QUEUE} caseLink="#case-detail-pass" />
        </div>
      </Section>

      {/* Portal: Debtor */}
      <Section id="portal-debtor" title="Portal — Debtor" screenNumber={11}>
        <PortalHeader name="John Testerton" role="Debtor" org="Personal Account" />
        <div className="bg-white rounded-b-lg shadow p-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
            <h3 className="font-bold text-sm mb-1">Your Application: <a href="#dashboard-debtor" className="text-gov-blue">IAAS-2024-00001</a></h3>
            <p className="text-sm text-gray-600">Status: Recommendation issued — awaiting your decision</p>
          </div>
          <WorkQueue title="My Application Updates" items={DEBTOR_QUEUE} caseLink="#dashboard-debtor" />
        </div>
      </Section>
    </>
  );
}
