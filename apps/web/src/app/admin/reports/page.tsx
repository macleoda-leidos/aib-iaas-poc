'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

const ALL_CASES = [
  { ref: 'IAAS-2026-00012', name: 'Alistair Morrison', product: 'DAS', status: 'submitted', debt: 18400, region: 'Edinburgh', days: 3 },
  { ref: 'IAAS-2026-00011', name: 'Brenda Campbell', product: 'MAP', status: 'under_review', debt: 9200, region: 'Glasgow', days: 4 },
  { ref: 'IAAS-2026-00010', name: 'Craig Stewart', product: 'PTD', status: 'additional_info_required', debt: 23100, region: 'Aberdeen', days: 6 },
  { ref: 'IAAS-2026-00009', name: 'Diana Murray', product: 'Sequestration', status: 'submitted', debt: 6800, region: 'Dundee', days: 7 },
  { ref: 'IAAS-2026-00008', name: 'Eleanor MacPherson', product: 'DAS', status: 'approved', debt: 14200, region: 'Edinburgh', days: 5 },
  { ref: 'IAAS-2026-00007', name: 'Fiona MacDonald', product: 'MAP', status: 'approved', debt: 8900, region: 'Glasgow', days: 4 },
  { ref: 'IAAS-2026-00006', name: 'Craig Henderson', product: 'PTD', status: 'approved', debt: 28500, region: 'Edinburgh', days: 8 },
  { ref: 'IAAS-2026-00005', name: 'Alistair Robertson', product: 'DAS', status: 'rejected', debt: 19800, region: 'Glasgow', days: 3 },
];

export default function ReportsPage() {
  const [product, setProduct] = useState('all');
  const [status, setStatus] = useState('all');
  const [generated, setGenerated] = useState(false);

  const filtered = useMemo(() => ALL_CASES.filter(c => {
    if (product !== 'all' && c.product !== product) return false;
    if (status !== 'all' && c.status !== status) return false;
    return true;
  }), [product, status]);

  const avgDebt = filtered.length ? Math.round(filtered.reduce((s, c) => s + c.debt, 0) / filtered.length) : 0;
  const avgDays = filtered.length ? (filtered.reduce((s, c) => s + c.days, 0) / filtered.length).toFixed(1) : '0';
  const mostCommon = filtered.length ? [...filtered].sort((a, b) => filtered.filter(x => x.product === b.product).length - filtered.filter(x => x.product === a.product).length)[0]?.product : '—';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block">← Back to Admin</Link>
      <h1 className="text-3xl font-bold mb-2">Report Builder</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Generate custom reports with filters.</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={product} onChange={e => setProduct(e.target.value)} className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded px-3 py-2 text-sm">
          <option value="all">All Products</option>
          <option value="DAS">DAS</option>
          <option value="MAP">MAP</option>
          <option value="PTD">PTD</option>
          <option value="Sequestration">Sequestration</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={() => setGenerated(true)} className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded text-sm">Generate Report</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"><p className="text-2xl font-bold">{filtered.length}</p><p className="text-xs text-gray-500">Total Cases</p></div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"><p className="text-2xl font-bold">£{avgDebt.toLocaleString()}</p><p className="text-xs text-gray-500">Avg Debt</p></div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"><p className="text-2xl font-bold">{mostCommon}</p><p className="text-xs text-gray-500">Most Common</p></div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"><p className="text-2xl font-bold">{avgDays}d</p><p className="text-xs text-gray-500">Avg Processing</p></div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b"><tr><th className="text-left px-4 py-3">Ref</th><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Product</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Debt</th><th className="text-left px-4 py-3">Region</th></tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(c => <tr key={c.ref}><td className="px-4 py-3 font-mono text-xs">{c.ref}</td><td className="px-4 py-3">{c.name}</td><td className="px-4 py-3">{c.product}</td><td className="px-4 py-3">{c.status}</td><td className="px-4 py-3 text-right">£{c.debt.toLocaleString()}</td><td className="px-4 py-3">{c.region}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
