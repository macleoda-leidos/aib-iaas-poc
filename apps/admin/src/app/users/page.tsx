'use client';

import { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  org: string;
  orgId: string;
  status: 'active' | 'suspended' | 'pending_approval' | 'deactivated';
  lastLogin: string;
}

const INITIAL_USERS: User[] = [
  { id: 'USR-001', name: 'System Administrator', email: 'admin@aib.example.gov.scot', role: 'System Administrator', org: 'Accountant in Bankruptcy', orgId: 'ORG-AIB-001', status: 'active', lastLogin: '2024-03-29' },
  { id: 'USR-002', name: 'Karen MacLeod', email: 'senior.officer@aib.example.gov.scot', role: 'AiB Senior Officer', org: 'Accountant in Bankruptcy', orgId: 'ORG-AIB-001', status: 'active', lastLogin: '2024-03-29' },
  { id: 'USR-003', name: 'James Wilson', email: 'officer@aib.example.gov.scot', role: 'AiB Case Officer', org: 'AiB - Case Administration', orgId: 'ORG-AIB-002', status: 'active', lastLogin: '2024-03-28' },
  { id: 'USR-004', name: 'Reporting User', email: 'readonly@aib.example.gov.scot', role: 'AiB Read-Only', org: 'AiB - Policy & Compliance', orgId: 'ORG-AIB-004', status: 'active', lastLogin: '2024-03-27' },
  { id: 'USR-005', name: 'Fiona Campbell', email: 'adviser@cas.example.org', role: 'Money Adviser', org: 'CAS - Edinburgh Bureau', orgId: 'ORG-MA-002', status: 'active', lastLogin: '2024-03-29' },
  { id: 'USR-006', name: 'David Thomson', email: 'adviser2@stepchange.example.org', role: 'Money Adviser', org: 'StepChange Scotland', orgId: 'ORG-MA-004', status: 'active', lastLogin: '2024-03-26' },
  { id: 'USR-007', name: 'Sarah Mitchell', email: 'collections@rbs.example.com', role: 'Creditor', org: 'Royal Bank of Scotland (Sample)', orgId: 'ORG-CR-001', status: 'active', lastLogin: '2024-03-25' },
  { id: 'USR-008', name: 'Robert Henderson', email: 'trustee@sample-ip.example.com', role: 'Supplier/Trustee', org: 'Sample Insolvency Practitioners LLP', orgId: 'ORG-TR-001', status: 'active', lastLogin: '2024-03-28' },
  { id: 'USR-009', name: 'John Testerton', email: 'john.testerton@example.com', role: 'Debtor', org: '—', orgId: '', status: 'active', lastLogin: '2024-03-15' },
  { id: 'USR-010', name: 'Margaret Highdebt', email: 'margaret.h@example.com', role: 'Debtor', org: '—', orgId: '', status: 'active', lastLogin: '2024-03-10' },
];

const ROLES = ['System Administrator', 'AiB Senior Officer', 'AiB Case Officer', 'AiB Read-Only', 'Money Adviser', 'Creditor', 'Supplier/Trustee', 'Debtor'];
const ORGS = [
  { id: 'ORG-AIB-001', name: 'Accountant in Bankruptcy' },
  { id: 'ORG-AIB-002', name: 'AiB - Case Administration' },
  { id: 'ORG-AIB-003', name: 'AiB - DAS Team' },
  { id: 'ORG-AIB-004', name: 'AiB - Policy & Compliance' },
  { id: 'ORG-MA-001', name: 'Citizens Advice Scotland' },
  { id: 'ORG-MA-002', name: 'CAS - Edinburgh Bureau' },
  { id: 'ORG-MA-003', name: 'CAS - Glasgow Bureau' },
  { id: 'ORG-MA-004', name: 'StepChange Scotland' },
  { id: 'ORG-CR-001', name: 'Royal Bank of Scotland (Sample)' },
  { id: 'ORG-CR-002', name: 'Barclays Bank (Sample)' },
  { id: 'ORG-TR-001', name: 'Sample Insolvency Practitioners LLP' },
  { id: 'ORG-SUP-001', name: 'Sample Payment Services Ltd' },
];

const ROLE_COLOURS: Record<string, string> = {
  'System Administrator': 'bg-red-100 text-red-800',
  'AiB Senior Officer': 'bg-blue-200 text-blue-900',
  'AiB Case Officer': 'bg-blue-100 text-blue-800',
  'AiB Read-Only': 'bg-gray-200 text-gray-700',
  'Money Adviser': 'bg-green-100 text-green-800',
  'Creditor': 'bg-purple-100 text-purple-800',
  'Supplier/Trustee': 'bg-orange-100 text-orange-800',
  'Debtor': 'bg-teal-100 text-teal-800',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', role: '', orgId: '' });

  const filtered = users.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const addUser = () => {
    if (!newUser.email || !newUser.firstName || !newUser.role) return;
    const org = ORGS.find(o => o.id === newUser.orgId);
    const user: User = {
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      name: `${newUser.firstName} ${newUser.lastName}`,
      email: newUser.email,
      role: newUser.role,
      org: org?.name || '—',
      orgId: newUser.orgId,
      status: 'active',
      lastLogin: 'Never',
    };
    setUsers([...users, user]);
    setNewUser({ firstName: '', lastName: '', email: '', role: '', orgId: '' });
    setShowAddModal(false);
  };

  const updateUserStatus = (userId: string, status: User['status']) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status } : u));
  };

  const updateUserRole = (userId: string, role: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
    setEditingUser(null);
  };

  const downloadReport = () => {
    // Trigger report download from API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    window.open(`${apiUrl}/api/reports/export/weekly-report`, '_blank');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <button onClick={downloadReport} className="bg-gray-700 text-white px-4 py-2 text-sm rounded hover:bg-gray-800">
            📊 Generate Weekly Report
          </button>
          <button onClick={() => setShowAddModal(true)} className="bg-blue-700 text-white px-4 py-2 text-sm rounded hover:bg-blue-800">
            + Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Users" value={users.length} />
        <StatCard label="AiB Staff" value={users.filter(u => u.role.startsWith('AiB') || u.role === 'System Administrator').length} />
        <StatCard label="Advisers" value={users.filter(u => u.role === 'Money Adviser').length} />
        <StatCard label="Active" value={users.filter(u => u.status === 'active').length} />
        <StatCard label="Suspended" value={users.filter(u => u.status === 'suspended').length} colour="red" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 p-2 text-sm rounded w-64" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border border-gray-300 p-2 text-sm rounded">
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Users table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left p-3 text-sm">User</th>
            <th className="text-left p-3 text-sm">Role</th>
            <th className="text-left p-3 text-sm">Organisation</th>
            <th className="text-left p-3 text-sm">Status</th>
            <th className="text-left p-3 text-sm">Last Login</th>
            <th className="text-left p-3 text-sm">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3">
                  <p className="text-sm font-bold">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${ROLE_COLOURS[user.role] || 'bg-gray-100'}`}>{user.role}</span>
                </td>
                <td className="p-3 text-sm">{user.org}</td>
                <td className="p-3">
                  <span className={`text-xs font-bold uppercase ${user.status === 'active' ? 'text-green-700' : user.status === 'suspended' ? 'text-red-700' : 'text-gray-500'}`}>
                    ● {user.status}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-600">{user.lastLogin}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button onClick={() => setEditingUser(user)} className="text-blue-700 text-xs underline">Edit</button>
                    {user.status === 'active' ? (
                      <button onClick={() => updateUserStatus(user.id, 'suspended')} className="text-red-600 text-xs underline ml-2">Suspend</button>
                    ) : (
                      <button onClick={() => updateUserStatus(user.id, 'active')} className="text-green-600 text-xs underline ml-2">Activate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RBAC Matrix */}
      <div className="mt-8 bg-white border border-gray-200 rounded p-4">
        <h2 className="font-bold mb-4">Role-Based Access Control Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr>
              <th className="text-left p-2 border-b">Permission</th>
              {ROLES.map(r => <th key={r} className="text-center p-2 border-b whitespace-nowrap">{r.replace('AiB ', '').replace('System ', 'Sys ')}</th>)}
            </tr></thead>
            <tbody>
              {[
                ['Create Application', true, false, false, false, true, false, false, true],
                ['View All Applications', true, true, true, true, false, false, false, false],
                ['View Own Applications', true, true, true, true, true, true, true, true],
                ['Approve/Reject', true, true, false, false, false, false, false, false],
                ['Run Credit Check', true, false, true, false, true, false, false, false],
                ['Manage Users', true, true, false, false, false, false, false, false],
                ['Manage Organisations', true, true, false, false, false, false, false, false],
                ['View Audit Trail', true, true, true, true, false, false, false, false],
                ['Export Data', true, true, false, true, false, false, false, false],
                ['Generate Reports', true, true, false, true, false, false, false, false],
              ].map(([perm, ...vals]) => (
                <tr key={String(perm)} className="border-b border-gray-100">
                  <td className="p-2 font-bold">{String(perm)}</td>
                  {(vals as boolean[]).map((v, i) => (
                    <td key={i} className={`text-center p-2 ${v ? 'text-green-700' : 'text-gray-300'}`}>{v ? '✓' : '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add New User</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-bold mb-1">First Name *</label>
                  <input value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} className="border border-gray-300 p-2 w-full text-sm rounded" /></div>
                <div><label className="block text-sm font-bold mb-1">Last Name *</label>
                  <input value={newUser.lastName} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} className="border border-gray-300 p-2 w-full text-sm rounded" /></div>
              </div>
              <div><label className="block text-sm font-bold mb-1">Email *</label>
                <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="border border-gray-300 p-2 w-full text-sm rounded" /></div>
              <div><label className="block text-sm font-bold mb-1">Role *</label>
                <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="border border-gray-300 p-2 w-full text-sm rounded">
                  <option value="">Select role</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select></div>
              <div><label className="block text-sm font-bold mb-1">Organisation</label>
                <select value={newUser.orgId} onChange={e => setNewUser({ ...newUser, orgId: e.target.value })} className="border border-gray-300 p-2 w-full text-sm rounded">
                  <option value="">None (individual)</option>
                  {ORGS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select></div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={addUser} className="px-4 py-2 text-sm bg-blue-700 text-white rounded hover:bg-blue-800">Create User</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Edit User: {editingUser.name}</h2>
            <div className="space-y-3">
              <div><label className="block text-sm font-bold mb-1">Email</label>
                <p className="text-sm text-gray-600">{editingUser.email}</p></div>
              <div><label className="block text-sm font-bold mb-1">Change Role</label>
                <select defaultValue={editingUser.role} onChange={e => updateUserRole(editingUser.id, e.target.value)}
                  className="border border-gray-300 p-2 w-full text-sm rounded">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select></div>
              <div><label className="block text-sm font-bold mb-1">Organisation</label>
                <select defaultValue={editingUser.orgId} className="border border-gray-300 p-2 w-full text-sm rounded">
                  <option value="">None</option>
                  {ORGS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select></div>
              <div><label className="block text-sm font-bold mb-1">Status</label>
                <div className="flex gap-2">
                  {['active', 'suspended', 'deactivated'].map(s => (
                    <button key={s} onClick={() => { updateUserStatus(editingUser.id, s as User['status']); setEditingUser(null); }}
                      className={`px-3 py-1 text-xs rounded border ${editingUser.status === s ? 'bg-blue-100 border-blue-500' : 'border-gray-300 hover:border-gray-500'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, colour }: { label: string; value: number; colour?: string }) {
  return (
    <div className="bg-white border border-gray-200 p-3 rounded">
      <p className={`text-xl font-bold ${colour === 'red' ? 'text-red-700' : ''}`}>{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
