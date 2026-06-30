'use client';

import { useState, useMemo } from 'react';

// ===== SYNTHETIC USER GENERATION (500 users across 12 orgs) =====

const FIRST_NAMES = ['Alistair','Andrew','Angela','Brian','Brenda','Callum','Cameron','Carol','Craig','David','Donna','Douglas','Eilidh','Fiona','Fraser','Gavin','Graham','Helen','Ian','James','Janet','John','Karen','Kenneth','Laura','Lewis','Linda','Margaret','Mark','Moira','Neil','Nicola','Paul','Rachel','Robert','Ross','Sarah','Scott','Sharon','Stuart','Susan','Thomas','William','Yvonne','Alan','Alison','Colin','Derek','Elizabeth','Gordon','Hamish','Iain','Jacqueline','Kevin','Lorraine','Malcolm','Murray','Pamela','Richard','Sheila'];
const LAST_NAMES = ['Smith','Brown','Wilson','Thomson','Robertson','Campbell','Stewart','Anderson','MacDonald','Scott','Murray','Reid','Clark','Ross','Young','Mitchell','Walker','Watson','Morrison','Paterson','Hamilton','Graham','Fraser','Gray','Douglas','Wallace','Henderson','Kennedy','Ferguson','MacLeod','Duncan','MacKenzie','Gordon','Burns','MacKay','Allan','Davidson','Johnston','Sinclair','Hunter','Bell','Grant','Crawford','Cunningham','Miller','Martin','Taylor','Adams','Black','Boyd'];

interface User {
  id: string; name: string; email: string; role: string; roleLevel: number; org: string; orgId: string; status: 'active' | 'suspended' | 'pending_approval' | 'deactivated'; lastLogin: string;
}

const ROLE_DEFS = [
  { role: 'System Administrator', level: 100, count: 2, orgPool: ['ORG-AIB-001'] },
  { role: 'AiB Senior Officer', level: 90, count: 8, orgPool: ['ORG-AIB-001'] },
  { role: 'AiB Case Officer', level: 80, count: 45, orgPool: ['ORG-AIB-001', 'ORG-AIB-002', 'ORG-AIB-003'] },
  { role: 'AiB DAS Team', level: 75, count: 30, orgPool: ['ORG-AIB-003'] },
  { role: 'AiB Read-Only', level: 70, count: 35, orgPool: ['ORG-AIB-001', 'ORG-AIB-004'] },
  { role: 'Money Adviser', level: 50, count: 220, orgPool: ['ORG-MA-001', 'ORG-MA-002', 'ORG-MA-003', 'ORG-MA-004', 'ORG-MA-005', 'ORG-MA-006'] },
  { role: 'Creditor', level: 40, count: 80, orgPool: ['ORG-CR-001', 'ORG-CR-002', 'ORG-CR-003', 'ORG-CR-004', 'ORG-CR-005'] },
  { role: 'Supplier/Trustee', level: 45, count: 50, orgPool: ['ORG-TR-001', 'ORG-TR-002', 'ORG-SUP-001', 'ORG-SUP-002'] },
  { role: 'Debtor', level: 10, count: 30, orgPool: [''] },
];

const ORGS: Record<string, string> = {
  'ORG-AIB-001': 'Accountant in Bankruptcy', 'ORG-AIB-002': 'AiB - Case Administration', 'ORG-AIB-003': 'AiB - DAS Team', 'ORG-AIB-004': 'AiB - Policy & Compliance',
  'ORG-MA-001': 'Citizens Advice Scotland', 'ORG-MA-002': 'CAS - Edinburgh', 'ORG-MA-003': 'CAS - Glasgow', 'ORG-MA-004': 'StepChange Scotland', 'ORG-MA-005': 'Highland Debt Solutions', 'ORG-MA-006': 'Money Advice Trust',
  'ORG-CR-001': 'Royal Bank of Scotland', 'ORG-CR-002': 'Barclays Bank', 'ORG-CR-003': 'HMRC Scotland', 'ORG-CR-004': 'Glasgow City Council', 'ORG-CR-005': 'Scottish Power',
  'ORG-TR-001': 'Sample Insolvency Practitioners', 'ORG-TR-002': 'Test Trustees & Co', 'ORG-SUP-001': 'Sample Payment Services', 'ORG-SUP-002': 'DAS Admin Systems',
  '': '— (Individual)',
};

function generateUsers(): User[] {
  const users: User[] = [];
  let id = 1;
  for (const def of ROLE_DEFS) {
    for (let i = 0; i < def.count; i++) {
      const first = FIRST_NAMES[id % FIRST_NAMES.length];
      const last = LAST_NAMES[(id * 7) % LAST_NAMES.length];
      const orgId = def.orgPool[(id * 3) % def.orgPool.length];
      const statusRoll = id % 20;
      const status: User['status'] = statusRoll === 0 ? 'suspended' : statusRoll === 19 ? 'pending_approval' : 'active';
      const daysAgo = (id * 13) % 30;
      users.push({
        id: `USR-${String(id).padStart(4, '0')}`,
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@${orgId ? orgId.replace('ORG-', '').toLowerCase() + '.example.com' : 'personal.example.com'}`,
        role: def.role,
        roleLevel: def.level,
        org: ORGS[orgId] || '—',
        orgId,
        status,
        lastLogin: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`,
      });
      id++;
    }
  }
  return users;
}

const ALL_USERS = generateUsers();
const ALL_ROLES = [...new Set(ROLE_DEFS.map(r => r.role))];
const ALL_ORGS_LIST = Object.entries(ORGS).filter(([k]) => k).map(([id, name]) => ({ id, name }));
const PAGE_SIZE = 20;

const ROLE_COLOURS: Record<string, string> = {
  'System Administrator': 'bg-red-100 text-red-800', 'AiB Senior Officer': 'bg-blue-200 text-blue-900',
  'AiB Case Officer': 'bg-blue-100 text-blue-800', 'AiB DAS Team': 'bg-indigo-100 text-indigo-800',
  'AiB Read-Only': 'bg-gray-200 text-gray-700', 'Money Adviser': 'bg-green-100 text-green-800',
  'Creditor': 'bg-purple-100 text-purple-800', 'Supplier/Trustee': 'bg-orange-100 text-orange-800',
  'Debtor': 'bg-teal-100 text-teal-800',
};

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => ALL_USERS.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (orgFilter && u.orgId !== orgFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [roleFilter, orgFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === pageUsers.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(pageUsers.map(u => u.id)));
  };

  const uniqueOrgs = new Set(ALL_USERS.map(u => u.orgId).filter(Boolean));

  const downloadReport = () => { window.open((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/reports/export/weekly-report', '_blank'); };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-gray-500">{ALL_USERS.length} users across {uniqueOrgs.size} external organisations • {ALL_ROLES.length} role levels</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadReport} className="bg-gray-700 text-white px-3 py-2 text-xs rounded hover:bg-gray-800">📊 Weekly Report</button>
          <button onClick={() => setShowAddModal(true)} className="bg-blue-700 text-white px-3 py-2 text-xs rounded hover:bg-blue-800">+ Add User</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-white border border-gray-200 p-3 rounded"><p className="text-xl font-bold">{ALL_USERS.length}</p><p className="text-xs text-gray-600">Total Users</p></div>
        <div className="bg-white border border-gray-200 p-3 rounded"><p className="text-xl font-bold">{ALL_USERS.filter(u => u.role.startsWith('AiB')).length}</p><p className="text-xs text-gray-600">AiB Staff</p></div>
        <div className="bg-white border border-gray-200 p-3 rounded"><p className="text-xl font-bold">{ALL_USERS.filter(u => u.role === 'Money Adviser').length}</p><p className="text-xs text-gray-600">Advisers</p></div>
        <div className="bg-white border border-gray-200 p-3 rounded"><p className="text-xl font-bold">{ALL_USERS.filter(u => u.role === 'Creditor').length}</p><p className="text-xs text-gray-600">Creditors</p></div>
        <div className="bg-white border border-gray-200 p-3 rounded"><p className="text-xl font-bold text-green-700">{ALL_USERS.filter(u => u.status === 'active').length}</p><p className="text-xs text-gray-600">Active</p></div>
        <div className="bg-white border border-gray-200 p-3 rounded"><p className="text-xl font-bold text-red-700">{ALL_USERS.filter(u => u.status === 'suspended').length}</p><p className="text-xs text-gray-600">Suspended</p></div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input type="text" placeholder="Search name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-300 p-2 text-sm rounded w-56" />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="border border-gray-300 p-2 text-sm rounded">
          <option value="">All Roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={orgFilter} onChange={e => { setOrgFilter(e.target.value); setPage(1); }} className="border border-gray-300 p-2 text-sm rounded">
          <option value="">All Organisations</option>
          {ALL_ORGS_LIST.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <span className="text-xs text-gray-500 ml-auto">Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}</span>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
          <span className="text-sm font-bold">{selectedIds.size} selected</span>
          <button className="text-xs bg-red-600 text-white px-2 py-1 rounded">Suspend Selected</button>
          <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Change Role</button>
          <button className="text-xs bg-gray-600 text-white px-2 py-1 rounded">Export Selected</button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-500 ml-auto">Clear selection</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b text-xs"><tr>
            <th className="p-2 w-8"><input type="checkbox" checked={selectedIds.size === pageUsers.length && pageUsers.length > 0} onChange={toggleSelectAll} /></th>
            <th className="text-left p-2">User</th>
            <th className="text-left p-2">Role</th>
            <th className="text-left p-2">Level</th>
            <th className="text-left p-2">Organisation</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Last Login</th>
            <th className="text-left p-2">Actions</th>
          </tr></thead>
          <tbody>
            {pageUsers.map(user => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                <td className="p-2"><input type="checkbox" checked={selectedIds.has(user.id)} onChange={() => toggleSelect(user.id)} /></td>
                <td className="p-2">
                  <p className="font-bold text-xs">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </td>
                <td className="p-2"><span className={`text-xs px-1.5 py-0.5 rounded font-bold ${ROLE_COLOURS[user.role] || 'bg-gray-100'}`}>{user.role}</span></td>
                <td className="p-2 text-xs text-gray-500 font-mono">L{user.roleLevel}</td>
                <td className="p-2 text-xs">{user.org}</td>
                <td className="p-2"><span className={`text-xs font-bold ${user.status === 'active' ? 'text-green-700' : user.status === 'suspended' ? 'text-red-700' : 'text-amber-600'}`}>● {user.status}</span></td>
                <td className="p-2 text-xs text-gray-500">{user.lastLogin}</td>
                <td className="p-2"><button className="text-blue-700 text-xs underline">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
        <div className="flex gap-1">
          <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 text-xs border rounded disabled:opacity-40">First</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 text-xs border rounded disabled:opacity-40">← Prev</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return p <= totalPages ? <button key={p} onClick={() => setPage(p)} className={`px-2 py-1 text-xs border rounded ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>{p}</button> : null;
          })}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 text-xs border rounded disabled:opacity-40">Next →</button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 text-xs border rounded disabled:opacity-40">Last</button>
        </div>
      </div>

      {/* RBAC Matrix */}
      <div className="mt-8 bg-white border border-gray-200 rounded p-4">
        <h2 className="font-bold mb-2">Role Hierarchy & Permissions ({ALL_ROLES.length} levels)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr>
              <th className="text-left p-2 border-b">Permission</th>
              {ALL_ROLES.map(r => <th key={r} className="text-center p-1.5 border-b whitespace-nowrap text-xs">{r.replace('AiB ', '')}</th>)}
            </tr></thead>
            <tbody>
              {[
                ['Create Application', true, false, false, false, false, true, false, false, true],
                ['View All Applications', true, true, true, true, true, false, false, false, false],
                ['Approve/Reject', true, true, false, false, false, false, false, false, false],
                ['Run Credit Check', true, false, true, true, false, true, false, false, false],
                ['Manage Users', true, true, false, false, false, false, false, false, false],
                ['Manage Organisations', true, true, false, false, false, false, false, false, false],
                ['View Audit Trail', true, true, true, true, true, false, false, false, false],
                ['Generate Reports', true, true, false, false, true, false, false, false, false],
                ['View DAS Cases', true, true, true, true, false, true, false, false, false],
                ['File Claims', true, false, false, false, false, false, true, false, false],
                ['Manage Trust Deeds', true, true, false, false, false, false, false, true, false],
              ].map(([perm, ...vals]) => (
                <tr key={String(perm)} className="border-b border-gray-100">
                  <td className="p-1.5 font-bold">{String(perm)}</td>
                  {(vals as boolean[]).map((v, i) => (
                    <td key={i} className={`text-center p-1.5 ${v ? 'text-green-700' : 'text-gray-300'}`}>{v ? '✓' : '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal (simplified) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add New User</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-bold mb-1">First Name</label><input className="border p-2 w-full text-sm rounded" /></div>
                <div><label className="block text-sm font-bold mb-1">Last Name</label><input className="border p-2 w-full text-sm rounded" /></div>
              </div>
              <div><label className="block text-sm font-bold mb-1">Email</label><input type="email" className="border p-2 w-full text-sm rounded" /></div>
              <div><label className="block text-sm font-bold mb-1">Role</label>
                <select className="border p-2 w-full text-sm rounded"><option value="">Select role...</option>{ALL_ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
              <div><label className="block text-sm font-bold mb-1">Organisation</label>
                <select className="border p-2 w-full text-sm rounded"><option value="">Select org...</option>{ALL_ORGS_LIST.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm border rounded">Cancel</button>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm bg-blue-700 text-white rounded">Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
