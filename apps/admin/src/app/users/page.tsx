'use client';

import { useState } from 'react';

const USERS = [
  { id: 'USR-001', name: 'System Administrator', email: 'admin@aib.example.gov.scot', role: 'System Administrator', org: 'Accountant in Bankruptcy', status: 'active', lastLogin: '2024-03-29' },
  { id: 'USR-002', name: 'Karen MacLeod', email: 'senior.officer@aib.example.gov.scot', role: 'AiB Senior Officer', org: 'Accountant in Bankruptcy', status: 'active', lastLogin: '2024-03-29' },
  { id: 'USR-003', name: 'James Wilson', email: 'officer@aib.example.gov.scot', role: 'AiB Case Officer', org: 'AiB - Case Administration', status: 'active', lastLogin: '2024-03-28' },
  { id: 'USR-004', name: 'Reporting User', email: 'readonly@aib.example.gov.scot', role: 'AiB Read-Only', org: 'AiB - Policy & Compliance', status: 'active', lastLogin: '2024-03-27' },
  { id: 'USR-005', name: 'Fiona Campbell', email: 'adviser@cas.example.org', role: 'Money Adviser', org: 'CAS - Edinburgh Bureau', status: 'active', lastLogin: '2024-03-29' },
  { id: 'USR-006', name: 'David Thomson', email: 'adviser2@stepchange.example.org', role: 'Money Adviser', org: 'StepChange Scotland', status: 'active', lastLogin: '2024-03-26' },
  { id: 'USR-007', name: 'Sarah Mitchell', email: 'collections@rbs.example.com', role: 'Creditor', org: 'Royal Bank of Scotland (Sample)', status: 'active', lastLogin: '2024-03-25' },
  { id: 'USR-008', name: 'Robert Henderson', email: 'trustee@sample-ip.example.com', role: 'Supplier/Trustee', org: 'Sample Insolvency Practitioners LLP', status: 'active', lastLogin: '2024-03-28' },
  { id: 'USR-009', name: 'John Testerton', email: 'john.testerton@example.com', role: 'Debtor', org: '—', status: 'active', lastLogin: '2024-03-15' },
  { id: 'USR-010', name: 'Margaret Highdebt', email: 'margaret.h@example.com', role: 'Debtor', org: '—', status: 'active', lastLogin: '2024-03-10' },
];

const ROLES = ['System Administrator', 'AiB Senior Officer', 'AiB Case Officer', 'AiB Read-Only', 'Money Adviser', 'Creditor', 'Supplier/Trustee', 'Debtor'];

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
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  const filtered = USERS.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button className="bg-gov-blue text-white px-4 py-2 text-sm rounded hover:bg-gov-dark-blue">+ Add User</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-3 rounded">
          <p className="text-xl font-bold">{USERS.length}</p><p className="text-sm text-gray-600">Total Users</p>
        </div>
        <div className="bg-white border border-gray-200 p-3 rounded">
          <p className="text-xl font-bold">{USERS.filter(u => u.role.startsWith('AiB')).length}</p><p className="text-sm text-gray-600">AiB Staff</p>
        </div>
        <div className="bg-white border border-gray-200 p-3 rounded">
          <p className="text-xl font-bold">{USERS.filter(u => u.role === 'Money Adviser').length}</p><p className="text-sm text-gray-600">Advisers</p>
        </div>
        <div className="bg-white border border-gray-200 p-3 rounded">
          <p className="text-xl font-bold">{USERS.filter(u => u.status === 'active').length}</p><p className="text-sm text-gray-600">Active</p>
        </div>
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
                  <span className={`text-xs font-bold uppercase ${user.status === 'active' ? 'text-green-700' : 'text-red-700'}`}>● {user.status}</span>
                </td>
                <td className="p-3 text-sm text-gray-600">{user.lastLogin}</td>
                <td className="p-3 flex gap-2">
                  <button className="text-gov-blue text-xs underline">Edit</button>
                  <button className="text-gov-blue text-xs underline">Permissions</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RBAC Summary */}
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
                ['Create Application', '✓', '✗', '✗', '✗', '✓', '✗', '✗', '✓'],
                ['View All Applications', '✓', '✓', '✓', '✓', '✗', '✗', '✗', '✗'],
                ['View Own Applications', '✓', '✓', '✓', '✓', '✓', '✓', '✓', '✓'],
                ['Approve/Reject', '✓', '✓', '✗', '✗', '✗', '✗', '✗', '✗'],
                ['Run Credit Check', '✓', '✗', '✓', '✗', '✓', '✗', '✗', '✗'],
                ['Manage Users', '✓', '✓', '✗', '✗', '✗', '✗', '✗', '✗'],
                ['Manage Organisations', '✓', '✓', '✗', '✗', '✗', '✗', '✗', '✗'],
                ['View Audit Trail', '✓', '✓', '✓', '✓', '✗', '✗', '✗', '✗'],
                ['Export Data', '✓', '✓', '✗', '✓', '✗', '✗', '✗', '✗'],
              ].map(([perm, ...vals]) => (
                <tr key={perm} className="border-b border-gray-100">
                  <td className="p-2 font-bold">{perm}</td>
                  {vals.map((v, i) => (
                    <td key={i} className={`text-center p-2 ${v === '✓' ? 'text-green-700' : 'text-gray-300'}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
