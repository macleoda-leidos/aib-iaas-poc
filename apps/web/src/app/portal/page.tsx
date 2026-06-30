'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

const USERS: Record<string, any> = {
  karen: { name: 'Karen MacLeod', role: 'AiB Senior Officer', org: 'Accountant in Bankruptcy', realm: 'aib-internal' },
  james: { name: 'James Wilson', role: 'AiB Case Officer', org: 'AiB - Case Administration', realm: 'aib-internal' },
  fiona: { name: 'Fiona Campbell', role: 'Money Adviser', org: 'CAS - Edinburgh Bureau', realm: 'external-advisers' },
  sarah: { name: 'Sarah Mitchell', role: 'Creditor', org: 'Royal Bank of Scotland', realm: 'creditors' },
  robert: { name: 'Robert Henderson', role: 'Trustee', org: 'Sample Insolvency Practitioners', realm: 'external-advisers' },
  john: { name: 'John Testerton', role: 'Debtor', org: null, realm: 'public-debtors' },
};

const SYSTEMS = [
  { id: 'BASYS', name: 'Bankruptcy Administration', icon: '⚖️', colour: 'border-blue-500', tasks: 12 },
  { id: 'ASTRA', name: 'Strategy & Admin', icon: '📊', colour: 'border-purple-500', tasks: 5 },
  { id: 'eDEN', name: 'DAS Electronic System', icon: '💳', colour: 'border-green-500', tasks: 18 },
  { id: 'CFT', name: 'Creditor/Trustee', icon: '🏛️', colour: 'border-orange-500', tasks: 8 },
  { id: 'RoI', name: 'Register of Insolvencies', icon: '📋', colour: 'border-red-500', tasks: 3 },
  { id: 'IAAS', name: 'Application Advice', icon: '🎯', colour: 'border-teal-500', tasks: 15 },
];

const WORK_QUEUE = [
  { id: 1, system: 'IAAS', ref: 'IAAS-2024-00012', task: 'New application submitted', priority: 'high', assignee: 'Unassigned', due: '30 Jun', status: 'New' },
  { id: 2, system: 'BASYS', ref: 'SEQ-2024-00123', task: 'Annual review due — A. Brown', priority: 'high', assignee: 'James Wilson', due: '1 Jul', status: 'Overdue' },
  { id: 3, system: 'eDEN', ref: 'DAS-ARR-2024-001', task: 'Payment distribution overdue', priority: 'high', assignee: 'System', due: '28 Jun', status: 'Overdue' },
  { id: 4, system: 'IAAS', ref: 'IAAS-2024-00010', task: 'Awaiting additional information — C. Stewart', priority: 'medium', assignee: 'Karen MacLeod', due: '5 Jul', status: 'Pending' },
  { id: 5, system: 'CFT', ref: 'CFT-REG-2024-045', task: 'Provider registration renewal — Highland Debt', priority: 'medium', assignee: 'Policy Team', due: '15 Jul', status: 'Pending' },
  { id: 6, system: 'DAS', ref: 'DPP-2024-00456', task: 'New DPP application received', priority: 'medium', assignee: 'Unassigned', due: '3 Jul', status: 'New' },
  { id: 7, system: 'BASYS', ref: 'MAP-2024-00089', task: 'Discharge pending — D. Minimal', priority: 'low', assignee: 'James Wilson', due: '20 Jul', status: 'In Progress' },
  { id: 8, system: 'eDEN', ref: 'DAS-VAR-2024-023', task: 'DAS variation request — F. Existing', priority: 'medium', assignee: 'Fiona Campbell', due: '8 Jul', status: 'Pending' },
  { id: 9, system: 'RoI', ref: 'ROI-ENT-2024-067', task: 'New entry registration required', priority: 'low', assignee: 'System', due: '10 Jul', status: 'Pending' },
  { id: 10, system: 'CFT', ref: 'CFT-ANN-2024-012', task: 'Trustee annual return — Sample IP LLP', priority: 'low', assignee: 'Robert Henderson', due: '31 Jul', status: 'Not Started' },
  { id: 11, system: 'IAAS', ref: 'IAAS-2024-00011', task: 'Credit check review required — B. Campbell', priority: 'medium', assignee: 'James Wilson', due: '2 Jul', status: 'In Progress' },
  { id: 12, system: 'RoI', ref: 'ROI-QRY-2024-089', task: 'Public search query — response needed', priority: 'low', assignee: 'System', due: '4 Jul', status: 'New' },
  { id: 13, system: 'ASTRA', ref: 'ASTRA-RPT-2024-Q2', task: 'Q2 performance report due', priority: 'medium', assignee: 'Karen MacLeod', due: '15 Jul', status: 'Not Started' },
  { id: 14, system: 'eDEN', ref: 'DAS-REV-2024-015', task: 'DPP annual review — 3 programmes', priority: 'medium', assignee: 'Fiona Campbell', due: '12 Jul', status: 'Pending' },
  { id: 15, system: 'IAAS', ref: 'IAAS-2024-00009', task: 'Application approved — notify debtor', priority: 'low', assignee: 'System', due: '1 Jul', status: 'Pending' },
];

const PRIORITY_COLOURS: Record<string, string> = { high: 'bg-red-100 text-red-800', medium: 'bg-amber-100 text-amber-800', low: 'bg-green-100 text-green-800' };
const STATUS_COLOURS: Record<string, string> = { New: 'bg-blue-100 text-blue-800', Overdue: 'bg-red-100 text-red-800', Pending: 'bg-amber-100 text-amber-800', 'In Progress': 'bg-purple-100 text-purple-800', 'Not Started': 'bg-gray-200 text-gray-700' };

export default function PortalPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('user') || 'karen';
  const user = USERS[userId] || USERS.karen;

  const [systemFilter, setSystemFilter] = useState<string>('all');
  const [showSession, setShowSession] = useState(false);

  const filteredQueue = systemFilter === 'all' ? WORK_QUEUE : WORK_QUEUE.filter(t => t.system === systemFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SSO Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center"><span className="text-sm font-bold">K</span></div>
              <div>
                <p className="text-sm font-bold">AiB Unified Portal</p>
                <p className="text-xs text-blue-200">Keycloak SSO Active</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSession(!showSession)} className="text-xs bg-green-500/20 border border-green-400/40 px-3 py-1 rounded-full flex items-center gap-1.5 hover:bg-green-500/30">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              SSO Active — {SYSTEMS.length} systems
            </button>
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-blue-200">{user.role}</p>
            </div>
            <a href="/login" className="text-xs bg-white/10 px-3 py-1.5 rounded hover:bg-white/20">Sign Out</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Session Info Panel (toggled) */}
        {showSession && (
          <div className="bg-white border border-blue-200 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-sm mb-2">🔐 SSO Session Details</h3>
              <button onClick={() => setShowSession(false)} className="text-gray-400 text-xs">✕</button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Session ID</p>
                <p className="text-xs font-mono bg-gray-50 p-1 rounded">kc-sess-{userId}-{Date.now().toString(36)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Realm</p>
                <p className="text-sm font-medium">{user.realm}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Token Expires</p>
                <p className="text-sm font-medium">7:58:32 remaining</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500 mb-2">Authenticated systems:</p>
              <div className="flex flex-wrap gap-2">
                {SYSTEMS.map(sys => (
                  <span key={sys.id} className="text-xs bg-green-50 border border-green-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>{sys.id}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3 italic">This demonstrates Keycloak single sign-on: one authentication grants access to all AiB systems without re-login.</p>
          </div>
        )}

        {/* System Tiles */}
        <h2 className="text-lg font-bold mb-4">Connected Systems</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {SYSTEMS.map(sys => (
            <button key={sys.id} onClick={() => setSystemFilter(systemFilter === sys.id ? 'all' : sys.id)}
              className={`p-4 bg-white rounded-lg border-2 text-center transition-all hover:shadow-md ${systemFilter === sys.id ? `${sys.colour} shadow-md` : 'border-gray-200 hover:border-gray-400'}`}>
              <div className="text-2xl mb-1">{sys.icon}</div>
              <p className="text-xs font-bold">{sys.id}</p>
              <p className="text-xs text-gray-500 truncate">{sys.name}</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs font-bold text-gray-700">{sys.tasks}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Unified Work Queue */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="font-bold">Unified Work Queue</h2>
              <p className="text-xs text-gray-500">{filteredQueue.length} items {systemFilter !== 'all' ? `from ${systemFilter}` : 'across all systems'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSystemFilter('all')} className={`text-xs px-2 py-1 rounded ${systemFilter === 'all' ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-gray-100'}`}>All</button>
              {SYSTEMS.map(s => (
                <button key={s.id} onClick={() => setSystemFilter(s.id)} className={`text-xs px-2 py-1 rounded ${systemFilter === s.id ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-gray-100 hover:bg-gray-200'}`}>{s.id}</button>
              ))}
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 text-xs"><tr>
              <th className="text-left p-3">System</th>
              <th className="text-left p-3">Reference</th>
              <th className="text-left p-3">Task</th>
              <th className="text-left p-3">Priority</th>
              <th className="text-left p-3">Assignee</th>
              <th className="text-left p-3">Due</th>
              <th className="text-left p-3">Status</th>
            </tr></thead>
            <tbody>
              {filteredQueue.map(item => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50 text-sm">
                  <td className="p-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-bold">{item.system}</span></td>
                  <td className="p-3 font-mono text-xs">{item.ref}</td>
                  <td className="p-3 text-sm">{item.task}</td>
                  <td className="p-3"><span className={`text-xs px-1.5 py-0.5 rounded font-bold ${PRIORITY_COLOURS[item.priority]}`}>{item.priority}</span></td>
                  <td className="p-3 text-xs text-gray-600">{item.assignee}</td>
                  <td className="p-3 text-xs">{item.due}</td>
                  <td className="p-3"><span className={`text-xs px-1.5 py-0.5 rounded font-bold ${STATUS_COLOURS[item.status] || 'bg-gray-100'}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 border-l-4 border-l-red-500">
            <p className="text-2xl font-bold">3</p><p className="text-xs text-gray-600">Overdue tasks</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 border-l-4 border-l-blue-500">
            <p className="text-2xl font-bold">4</p><p className="text-xs text-gray-600">New (unassigned)</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 border-l-4 border-l-purple-500">
            <p className="text-2xl font-bold">6</p><p className="text-xs text-gray-600">In progress</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 border-l-4 border-l-green-500">
            <p className="text-2xl font-bold">6</p><p className="text-xs text-gray-600">Systems connected</p>
          </div>
        </div>

        {/* Navigation to other pages */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <a href="/dashboard" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition-all no-underline">
            <p className="font-bold text-sm text-gray-800">📊 Role Dashboard</p>
            <p className="text-xs text-gray-500">View your role-specific dashboard</p>
          </a>
          <a href="/apply" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition-all no-underline">
            <p className="font-bold text-sm text-gray-800">📝 New Application</p>
            <p className="text-xs text-gray-500">Start a new IAAS application</p>
          </a>
          <a href="/login" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition-all no-underline">
            <p className="font-bold text-sm text-gray-800">🔄 Switch User (Demo)</p>
            <p className="text-xs text-gray-500">Sign in as a different demo user</p>
          </a>
        </div>
      </div>
    </div>
  );
}
