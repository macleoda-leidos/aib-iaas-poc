'use client';

import { useState } from 'react';

const ORGS = [
  { id: 'ORG-AIB-001', name: 'Accountant in Bankruptcy', type: 'aib', status: 'active', parentId: null, children: ['ORG-AIB-002', 'ORG-AIB-003', 'ORG-AIB-004'], city: 'Kilwinning' },
  { id: 'ORG-AIB-002', name: 'AiB - Case Administration', type: 'aib', status: 'active', parentId: 'ORG-AIB-001', children: [], city: 'Kilwinning' },
  { id: 'ORG-AIB-003', name: 'AiB - DAS Team', type: 'aib', status: 'active', parentId: 'ORG-AIB-001', children: [], city: 'Kilwinning' },
  { id: 'ORG-AIB-004', name: 'AiB - Policy & Compliance', type: 'aib', status: 'active', parentId: 'ORG-AIB-001', children: [], city: 'Kilwinning' },
  { id: 'ORG-MA-001', name: 'Citizens Advice Scotland', type: 'money_adviser', status: 'active', parentId: null, children: ['ORG-MA-002', 'ORG-MA-003'], city: 'Edinburgh' },
  { id: 'ORG-MA-002', name: 'CAS - Edinburgh Bureau', type: 'money_adviser', status: 'active', parentId: 'ORG-MA-001', children: [], city: 'Edinburgh' },
  { id: 'ORG-MA-003', name: 'CAS - Glasgow Bureau', type: 'money_adviser', status: 'active', parentId: 'ORG-MA-001', children: [], city: 'Glasgow' },
  { id: 'ORG-MA-004', name: 'StepChange Scotland', type: 'money_adviser', status: 'active', parentId: null, children: [], city: 'Glasgow' },
  { id: 'ORG-MA-005', name: 'Highland Debt Solutions Ltd', type: 'money_adviser', status: 'suspended', parentId: null, children: [], city: 'Inverness' },
  { id: 'ORG-CR-001', name: 'Royal Bank of Scotland (Sample)', type: 'creditor', status: 'active', parentId: null, children: [], city: 'Edinburgh' },
  { id: 'ORG-CR-002', name: 'Barclays Bank (Sample)', type: 'creditor', status: 'active', parentId: null, children: [], city: 'London' },
  { id: 'ORG-TR-001', name: 'Sample Insolvency Practitioners LLP', type: 'trustee', status: 'active', parentId: null, children: [], city: 'Edinburgh' },
  { id: 'ORG-SUP-001', name: 'Sample Payment Services Ltd', type: 'payment_distributor', status: 'active', parentId: null, children: [], city: 'Edinburgh' },
];

const TYPE_LABELS: Record<string, string> = {
  aib: 'AiB Internal', money_adviser: 'Money Adviser', creditor: 'Creditor',
  trustee: 'Trustee', supplier: 'Supplier', payment_distributor: 'Payment Distributor',
};

const TYPE_COLOURS: Record<string, string> = {
  aib: 'bg-blue-100 text-blue-800', money_adviser: 'bg-green-100 text-green-800',
  creditor: 'bg-purple-100 text-purple-800', trustee: 'bg-orange-100 text-orange-800',
  supplier: 'bg-gray-200 text-gray-800', payment_distributor: 'bg-teal-100 text-teal-800',
};

export default function OrganisationsPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [view, setView] = useState<'list' | 'tree'>('list');
  const [selectedOrg, setSelectedOrg] = useState<any>(null);

  const filtered = typeFilter ? ORGS.filter(o => o.type === typeFilter) : ORGS;
  const topLevel = filtered.filter(o => !o.parentId);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Organisation Management</h1>
        <button className="bg-gov-blue text-white px-4 py-2 text-sm rounded hover:bg-gov-dark-blue">
          + Add Organisation
        </button>
      </div>

      {/* Filters and view toggle */}
      <div className="flex items-center gap-4 mb-6">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-gray-300 p-2 text-sm rounded">
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="flex border border-gray-300 rounded">
          <button onClick={() => setView('list')} className={`px-3 py-1 text-sm ${view === 'list' ? 'bg-gov-blue text-white' : 'bg-white'}`}>List</button>
          <button onClick={() => setView('tree')} className={`px-3 py-1 text-sm ${view === 'tree' ? 'bg-gov-blue text-white' : 'bg-white'}`}>Hierarchy</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {view === 'list' ? (
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b"><tr>
                  <th className="text-left p-3 text-sm">Organisation</th>
                  <th className="text-left p-3 text-sm">Type</th>
                  <th className="text-left p-3 text-sm">Location</th>
                  <th className="text-left p-3 text-sm">Status</th>
                  <th className="text-left p-3 text-sm">Parent</th>
                </tr></thead>
                <tbody>
                  {filtered.map(org => (
                    <tr key={org.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrg(org)}>
                      <td className="p-3">
                        <p className="text-sm font-bold">{org.name}</p>
                        <p className="text-xs text-gray-500">{org.id}</p>
                      </td>
                      <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded font-bold ${TYPE_COLOURS[org.type]}`}>{TYPE_LABELS[org.type]}</span></td>
                      <td className="p-3 text-sm">{org.city}</td>
                      <td className="p-3"><span className={`text-xs font-bold uppercase ${org.status === 'active' ? 'text-green-700' : 'text-red-700'}`}>{org.status}</span></td>
                      <td className="p-3 text-xs text-gray-500">{org.parentId ? ORGS.find(o => o.id === org.parentId)?.name : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded p-4">
              <h3 className="font-bold mb-4">Organisation Hierarchy</h3>
              {topLevel.map(org => (
                <TreeNode key={org.id} org={org} allOrgs={ORGS} level={0} onSelect={setSelectedOrg} />
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="bg-white border border-gray-200 rounded p-4">
          {selectedOrg ? (
            <div>
              <h3 className="font-bold text-lg mb-1">{selectedOrg.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${TYPE_COLOURS[selectedOrg.type]}`}>{TYPE_LABELS[selectedOrg.type]}</span>
              <dl className="mt-4 space-y-3 text-sm">
                <div><dt className="text-gray-500">ID</dt><dd className="font-mono">{selectedOrg.id}</dd></div>
                <div><dt className="text-gray-500">Status</dt><dd className="font-bold">{selectedOrg.status}</dd></div>
                <div><dt className="text-gray-500">Location</dt><dd>{selectedOrg.city}</dd></div>
                <div><dt className="text-gray-500">Parent</dt><dd>{selectedOrg.parentId ? ORGS.find(o => o.id === selectedOrg.parentId)?.name : 'None (top-level)'}</dd></div>
                <div><dt className="text-gray-500">Children</dt><dd>{selectedOrg.children.length > 0 ? selectedOrg.children.length + ' sub-organisations' : 'None'}</dd></div>
              </dl>
              <div className="mt-4 space-y-2">
                <button className="w-full text-left p-2 text-sm border border-gray-200 rounded hover:bg-gray-50">✏️ Edit Organisation</button>
                <button className="w-full text-left p-2 text-sm border border-gray-200 rounded hover:bg-gray-50">👥 View Users</button>
                <button className="w-full text-left p-2 text-sm border border-gray-200 rounded hover:bg-gray-50">🔗 Manage Relationships</button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Select an organisation to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TreeNode({ org, allOrgs, level, onSelect }: { org: any; allOrgs: any[]; level: number; onSelect: (o: any) => void }) {
  const children = allOrgs.filter(o => o.parentId === org.id);
  return (
    <div style={{ marginLeft: `${level * 20}px` }} className="mb-1">
      <button onClick={() => onSelect(org)} className="flex items-center gap-2 p-2 w-full text-left hover:bg-gray-50 rounded text-sm">
        <span className="text-gray-400">{children.length > 0 ? '▼' : '•'}</span>
        <span className="font-bold">{org.name}</span>
        <span className={`text-xs px-1 rounded ${TYPE_COLOURS[org.type]}`}>{org.type}</span>
      </button>
      {children.map(child => <TreeNode key={child.id} org={child} allOrgs={allOrgs} level={level + 1} onSelect={onSelect} />)}
    </div>
  );
}
