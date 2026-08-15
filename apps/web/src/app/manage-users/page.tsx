'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';

// Generate 500 synthetic users
const FIRST_NAMES = ['Alistair','Andrew','Angela','Brian','Brenda','Callum','Cameron','Carol','Craig','David','Donna','Douglas','Eilidh','Fiona','Fraser','Gavin','Graham','Helen','Ian','James','Janet','John','Karen','Kenneth','Laura','Lewis','Linda','Margaret','Mark','Moira','Neil','Nicola','Paul','Rachel','Robert','Ross','Sarah','Scott','Sharon','Stuart','Susan','Thomas','William','Yvonne','Alan','Alison','Colin','Derek','Elizabeth','Gordon'];
const LAST_NAMES = ['Smith','Brown','Wilson','Thomson','Robertson','Campbell','Stewart','Anderson','MacDonald','Scott','Murray','Reid','Clark','Ross','Young','Mitchell','Walker','Watson','Morrison','Paterson','Hamilton','Graham','Fraser','Gray','Douglas','Wallace','Henderson','Kennedy','Ferguson','MacLeod','Duncan','MacKenzie','Gordon','Burns','MacKay','Allan','Davidson','Johnston','Sinclair','Hunter','Bell','Grant','Crawford','Cunningham','Miller','Martin','Taylor','Adams','Black','Boyd'];

const ROLE_DEFS = [
  { role: 'System Administrator', level: 100, count: 2, orgs: ['AiB'] },
  { role: 'AiB Senior Officer', level: 90, count: 8, orgs: ['AiB'] },
  { role: 'AiB Case Officer', level: 80, count: 45, orgs: ['AiB','AiB Case Admin','AiB DAS Team'] },
  { role: 'AiB DAS Team', level: 75, count: 30, orgs: ['AiB DAS Team'] },
  { role: 'AiB Read-Only', level: 70, count: 35, orgs: ['AiB','AiB Policy'] },
  { role: 'Money Adviser', level: 50, count: 220, orgs: ['CAS Edinburgh','CAS Glasgow','StepChange','Highland Debt','Money Advice Trust','CAS HQ'] },
  { role: 'Creditor', level: 40, count: 80, orgs: ['RBS','Barclays','HMRC','Glasgow Council','Scottish Power'] },
  { role: 'Supplier/Trustee', level: 45, count: 50, orgs: ['Sample IP LLP','Test Trustees','Payment Services','DAS Admin'] },
  { role: 'Debtor', level: 10, count: 30, orgs: ['—'] },
];

interface User { id: string; name: string; email: string; role: string; level: number; org: string; status: 'active'|'suspended'|'pending'; lastLogin: string; }

function generateUsers(): User[] {
  const users: User[] = [];
  let id = 1;
  for (const def of ROLE_DEFS) {
    for (let i = 0; i < def.count; i++) {
      const first = FIRST_NAMES[id % FIRST_NAMES.length];
      const last = LAST_NAMES[(id * 7) % LAST_NAMES.length];
      const org = def.orgs[(id * 3) % def.orgs.length];
      const statusRoll = id % 20;
      users.push({
        id: `USR-${String(id).padStart(4, '0')}`,
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
        role: def.role, level: def.level, org,
        status: statusRoll === 0 ? 'suspended' : statusRoll === 19 ? 'pending' : 'active',
        lastLogin: `${(id * 13) % 30 || 1} days ago`,
      });
      id++;
    }
  }
  return users;
}

const ALL_USERS = generateUsers();
const ALL_ROLES = [...new Set(ROLE_DEFS.map(r => r.role))];
const ALL_ORGS = [...new Set(ALL_USERS.map(u => u.org))].sort();
const PAGE_SIZE = 25;

const ROLE_COLOURS: Record<string, string> = {
  'System Administrator': 'bg-red-100 text-red-800',
  'AiB Senior Officer': 'bg-blue-200 text-blue-900',
  'AiB Case Officer': 'bg-blue-100 text-blue-800',
  'AiB DAS Team': 'bg-indigo-100 text-indigo-800',
  'AiB Read-Only': 'bg-gray-200 text-gray-700',
  'Money Adviser': 'bg-green-100 text-green-800',
  'Creditor': 'bg-purple-100 text-purple-800',
  'Supplier/Trustee': 'bg-orange-100 text-orange-800',
  'Debtor': 'bg-teal-100 text-teal-800',
};

export default function ManageUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name'|'role'|'level'|'org'>('name');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User|null>(null);

  const filtered = useMemo(() => {
    let result = ALL_USERS.filter(u => {
      if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase()) && !u.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (roleFilter && u.role !== roleFilter) return false;
      if (orgFilter && u.org !== orgFilter) return false;
      if (statusFilter && u.status !== statusFilter) return false;
      return true;
    });
    result.sort((a, b) => {
      const av = a[sortBy] as string | number;
      const bv = b[sortBy] as string | number;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [search, roleFilter, orgFilter, statusFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => { const n = new Set(selectedIds); n.has(id) ? n.delete(id) : n.add(id); setSelectedIds(n); };
  const toggleAll = () => { if (selectedIds.size === pageUsers.length) setSelectedIds(new Set()); else setSelectedIds(new Set(pageUsers.map(u => u.id))); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link href="/dashboard" className="text-blue-700 text-sm underline mb-2 inline-block">← Back to Dashboard</Link>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-gray-500">{ALL_USERS.length} users across {ALL_ORGS.length} organisations • {ALL_ROLES.length} role levels</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-blue-700 text-white px-4 py-2 text-sm rounded hover:bg-blue-800 min-h-[44px]">+ Add User</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <Stat label="Total" value={ALL_USERS.length} />
        <Stat label="AiB Staff" value={ALL_USERS.filter(u => u.role.startsWith('AiB') || u.role === 'System Administrator').length} />
        <Stat label="Advisers" value={ALL_USERS.filter(u => u.role === 'Money Adviser').length} />
        <Stat label="Creditors" value={ALL_USERS.filter(u => u.role === 'Creditor').length} />
        <Stat label="Active" value={ALL_USERS.filter(u => u.status === 'active').length} colour="text-green-700" />
        <Stat label="Suspended" value={ALL_USERS.filter(u => u.status === 'suspended').length} colour="text-red-700" />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Search name, email, or ID..."
            className="border border-gray-300 p-2 text-sm rounded w-64 min-h-[44px]" />
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="border border-gray-300 p-2 text-sm rounded min-h-[44px]">
            <option value="">All Roles</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={orgFilter} onChange={e => { setOrgFilter(e.target.value); setPage(1); }} className="border border-gray-300 p-2 text-sm rounded min-h-[44px]">
            <option value="">All Organisations</option>
            {ALL_ORGS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border border-gray-300 p-2 text-sm rounded min-h-[44px]">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
          {(search || roleFilter || orgFilter || statusFilter) && (
            <button onClick={() => { setSearch(''); setRoleFilter(''); setOrgFilter(''); setStatusFilter(''); setPage(1); }} className="text-sm text-blue-700 underline">Clear all</button>
          )}
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} of {ALL_USERS.length} users</span>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
          <span className="text-sm font-bold">{selectedIds.size} selected</span>
          <button className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700">Suspend Selected</button>
          <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">Change Role</button>
          <button className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">Activate Selected</button>
          <button className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700">Export CSV</button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-500 ml-auto underline">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b text-xs">
              <tr>
                <th className="p-2 w-8"><input type="checkbox" checked={selectedIds.size === pageUsers.length && pageUsers.length > 0} onChange={toggleAll} /></th>
                <th className="text-left p-2 cursor-pointer hover:text-blue-700" onClick={() => toggleSort('name')}>Name {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</th>
                <th className="text-left p-2 cursor-pointer hover:text-blue-700" onClick={() => toggleSort('role')}>Role {sortBy === 'role' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</th>
                <th className="text-left p-2 cursor-pointer hover:text-blue-700" onClick={() => toggleSort('level')}>Level {sortBy === 'level' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</th>
                <th className="text-left p-2 cursor-pointer hover:text-blue-700" onClick={() => toggleSort('org')}>Organisation {sortBy === 'org' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Last Login</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageUsers.map(u => (
                <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 text-sm ${selectedUser?.id === u.id ? 'bg-blue-50' : ''}`}>
                  <td className="p-2"><input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} /></td>
                  <td className="p-2">
                    <p className="font-bold text-xs">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="p-2"><span className={`text-xs px-1.5 py-0.5 rounded font-bold ${ROLE_COLOURS[u.role] || 'bg-gray-100'}`}>{u.role}</span></td>
                  <td className="p-2 font-mono text-xs text-gray-500">L{u.level}</td>
                  <td className="p-2 text-xs">{u.org}</td>
                  <td className="p-2"><span className={`text-xs font-bold ${u.status === 'active' ? 'text-green-700' : u.status === 'suspended' ? 'text-red-700' : 'text-amber-600'}`}>● {u.status}</span></td>
                  <td className="p-2 text-xs text-gray-500">{u.lastLogin}</td>
                  <td className="p-2"><button onClick={() => setSelectedUser(u)} className="text-blue-700 text-xs underline">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-gray-500">Page {page} of {totalPages} ({filtered.length} users)</p>
        <div className="flex gap-1">
          <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 text-xs border rounded disabled:opacity-40 min-h-[32px]">First</button>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-2 py-1 text-xs border rounded disabled:opacity-40 min-h-[32px]">←</button>
          {Array.from({length: Math.min(7, totalPages)}, (_, i) => {
            const p = Math.max(1, Math.min(page - 3, totalPages - 6)) + i;
            return p <= totalPages ? <button key={p} onClick={() => setPage(p)} className={`px-2 py-1 text-xs border rounded min-h-[32px] ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>{p}</button> : null;
          })}
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="px-2 py-1 text-xs border rounded disabled:opacity-40 min-h-[32px]">→</button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 text-xs border rounded disabled:opacity-40 min-h-[32px]">Last</button>
        </div>
      </div>

      {/* User Detail Panel */}
      {selectedUser && (
        <div className="mt-6 bg-white border-2 border-blue-600 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold">{selectedUser.name}</h3>
              <p className="text-sm text-gray-500">{selectedUser.email} • {selectedUser.id}</p>
            </div>
            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-800">✕</button>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div><label className="text-xs text-gray-500">Role</label><p className="font-bold text-sm">{selectedUser.role}</p></div>
            <div><label className="text-xs text-gray-500">Level</label><p className="font-bold text-sm">L{selectedUser.level}</p></div>
            <div><label className="text-xs text-gray-500">Organisation</label><p className="font-bold text-sm">{selectedUser.org}</p></div>
            <div><label className="text-xs text-gray-500">Status</label><p className={`font-bold text-sm ${selectedUser.status === 'active' ? 'text-green-700' : 'text-red-700'}`}>● {selectedUser.status}</p></div>
            <div><label className="text-xs text-gray-500">Last Login</label><p className="font-bold text-sm">{selectedUser.lastLogin}</p></div>
            <div><label className="text-xs text-gray-500">MFA</label><p className="font-bold text-sm">Enabled (TOTP)</p></div>
          </div>
          <div className="flex gap-2">
            <button className="bg-blue-700 text-white text-xs px-3 py-2 rounded hover:bg-blue-800">Edit Role</button>
            <button className="bg-orange-500 text-white text-xs px-3 py-2 rounded hover:bg-orange-600">Reset Password</button>
            {selectedUser.status === 'active' ? (
              <button className="bg-red-700 text-white text-xs px-3 py-2 rounded hover:bg-red-800">Suspend</button>
            ) : (
              <button className="bg-green-700 text-white text-xs px-3 py-2 rounded hover:bg-green-800">Activate</button>
            )}
            <button className="bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded hover:bg-gray-300">View Audit Log</button>
          </div>
        </div>
      )}

      {/* RBAC Matrix */}
      <div className="mt-8 bg-white border border-gray-200 rounded p-4">
        <h2 className="font-bold mb-3">Role Hierarchy & Permissions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr>
              <th className="text-left p-2 border-b">Permission</th>
              {ALL_ROLES.map(r => <th key={r} className="text-center p-1.5 border-b whitespace-nowrap">{r.replace('AiB ','')}</th>)}
            </tr></thead>
            <tbody>
              {[
                ['Create Application',true,false,false,false,false,true,false,false,true],
                ['View All Applications',true,true,true,true,true,false,false,false,false],
                ['Approve / Reject',true,true,false,false,false,false,false,false,false],
                ['Run Credit Check',true,false,true,true,false,true,false,false,false],
                ['Manage Users',true,true,false,false,false,false,false,false,false],
                ['Manage Organisations',true,true,false,false,false,false,false,false,false],
                ['View Audit Trail',true,true,true,true,true,false,false,false,false],
                ['Generate Reports',true,true,false,false,true,false,false,false,false],
                ['File Claims',true,false,false,false,false,false,true,false,false],
                ['Manage Trust Deeds',true,true,false,false,false,false,false,true,false],
                ['Submit Applications',true,false,false,false,false,true,false,false,true],
              ].map(([perm,...vals]) => (
                <tr key={String(perm)} className="border-b border-gray-100">
                  <td className="p-1.5 font-bold">{String(perm)}</td>
                  {(vals as boolean[]).map((v,i) => <td key={i} className={`text-center p-1.5 ${v ? 'text-green-700' : 'text-gray-300'}`}>{v ? '✓' : '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add New User</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-bold mb-1">First Name</label><input className="border p-2 w-full text-sm rounded min-h-[44px]" /></div>
                <div><label className="block text-sm font-bold mb-1">Last Name</label><input className="border p-2 w-full text-sm rounded min-h-[44px]" /></div>
              </div>
              <div><label className="block text-sm font-bold mb-1">Email</label><input type="email" className="border p-2 w-full text-sm rounded min-h-[44px]" /></div>
              <div><label className="block text-sm font-bold mb-1">Role</label>
                <select className="border p-2 w-full text-sm rounded min-h-[44px]"><option value="">Select...</option>{ALL_ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
              <div><label className="block text-sm font-bold mb-1">Organisation</label>
                <select className="border p-2 w-full text-sm rounded min-h-[44px]"><option value="">Select...</option>{ALL_ORGS.map(o => <option key={o}>{o}</option>)}</select></div>
              <div><label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Send welcome email with password reset link</label></div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm border rounded min-h-[44px]">Cancel</button>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm bg-blue-700 text-white rounded min-h-[44px]">Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, colour }: { label: string; value: number; colour?: string }) {
  return (
    <div className="bg-white border border-gray-200 p-3 rounded">
      <p className={`text-xl font-bold ${colour || ''}`}>{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}
