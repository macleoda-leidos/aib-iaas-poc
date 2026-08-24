'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { seedApplications } from '../../../lib/seedData';

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  additional_info_required: 'bg-orange-100 text-orange-800',
};

const QUICK_REPORTS = [
  { icon: '📊', label: 'All Applications', product: 'all', status: 'all', debtMin: 0 },
  { icon: '✅', label: 'Approved Cases', product: 'all', status: 'approved', debtMin: 0 },
  { icon: '📋', label: 'Pending Review', product: 'all', status: 'under_review', debtMin: 0 },
  { icon: '🏴', label: 'DAS Applications', product: 'DAS', status: 'all', debtMin: 0 },
  { icon: '⚠️', label: 'Rejected', product: 'all', status: 'rejected', debtMin: 0 },
  { icon: '💰', label: 'High Debt (>£20k)', product: 'all', status: 'all', debtMin: 20000 },
];

export default function ReportsPage() {
  const [product, setProduct] = useState('all');
  const [status, setStatus] = useState('all');
  const [region, setRegion] = useState('all');
  const [debtMin, setDebtMin] = useState(0);
  const [generated, setGenerated] = useState(false);

  const filtered = useMemo(() => seedApplications.filter(c => {
    if (product !== 'all' && c.product !== product) return false;
    if (status !== 'all' && c.status !== status) return false;
    if (region !== 'all' && c.city !== region) return false;
    if (debtMin > 0 && c.debt < debtMin) return false;
    return true;
  }), [product, status, region, debtMin]);

  const totalDebt = filtered.reduce((s, c) => s + c.debt, 0);
  const avgDebt = filtered.length ? Math.round(totalDebt / filtered.length) : 0;
  const approvalRate = filtered.length ? Math.round(filtered.filter(c => c.status === 'approved').length / filtered.length * 100) : 0;
  const mostCommon = filtered.length
    ? Object.entries(filtered.reduce((acc, c) => { acc[c.product] = (acc[c.product] || 0) + 1; return acc; }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
    : '—';

  // Status breakdown for bar chart
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, [filtered]);

  const regions = useMemo(() => [...new Set(seedApplications.map(a => a.city))].sort(), []);

  const applyQuickReport = (qr: typeof QUICK_REPORTS[0]) => {
    setProduct(qr.product);
    setStatus(qr.status);
    setDebtMin(qr.debtMin);
    setRegion('all');
    setGenerated(true);
  };

  const exportCSV = () => {
    const header = 'Reference,Name,Product,Status,Debt,City,Date\n';
    const rows = filtered.map(r => `${r.ref},"${r.firstName} ${r.lastName}",${r.product},${r.status},${r.debt},"${r.city}","${r.date}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iaas-report-${filtered.length}-cases-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reportTitle = `${product !== 'all' ? product + ' ' : ''}${status !== 'all' ? status.replace(/_/g, ' ') + ' ' : ''}${region !== 'all' ? region + ' ' : ''}${debtMin > 0 ? `>£${(debtMin / 1000).toFixed(0)}k ` : ''}Applications`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block">← Back to Admin</Link>
      <h1 className="text-3xl font-bold mb-2">Report Builder</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Generate reports from {seedApplications.length} applications. Click a tile for quick access or customise filters.</p>

      {/* Quick Report Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
        {QUICK_REPORTS.map(qr => (
          <button key={qr.label} onClick={() => applyQuickReport(qr)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all">
            <p className="text-xl mb-1">{qr.icon}</p>
            <p className="text-xs font-bold">{qr.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={product} onChange={e => setProduct(e.target.value)} className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded px-3 py-2 text-sm">
          <option value="all">All Products</option>
          <option value="DAS">DAS</option>
          <option value="MAP">MAP</option>
          <option value="PTD">PTD</option>
          <option value="Sequestration">Sequestration</option>
          <option value="DPP">DPP</option>
          <option value="Signposting">Signposting</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="additional_info_required">Additional Info Required</option>
        </select>
        <select value={region} onChange={e => setRegion(e.target.value)} className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded px-3 py-2 text-sm">
          <option value="all">All Regions</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={() => setGenerated(true)} className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded text-sm">
          📊 Generate Report ({filtered.length} cases)
        </button>
        {(product !== 'all' || status !== 'all' || region !== 'all' || debtMin > 0) && (
          <button onClick={() => { setProduct('all'); setStatus('all'); setRegion('all'); setDebtMin(0); setGenerated(false); }}
            className="text-red-600 dark:text-red-400 text-sm font-bold hover:underline">✕ Clear</button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{filtered.length}</p>
          <p className="text-xs text-gray-500">Total Cases</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">£{avgDebt.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Avg Debt</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{approvalRate}%</p>
          <p className="text-xs text-gray-500">Approval Rate</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{mostCommon}</p>
          <p className="text-xs text-gray-500">Top Product</p>
        </div>
      </div>

      {/* Generated Report */}
      {generated && (
        <div className="mb-6 border-2 border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-lg">📄 IAAS Report: {reportTitle}</h2>
              <p className="text-xs text-gray-500">Generated {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} • {filtered.length} records</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-green-800">📥 CSV</button>
              <button onClick={() => window.print()} className="bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-gray-800">🖨 Print</button>
            </div>
          </div>

          {/* Status Breakdown Bar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold mb-2">Status Breakdown</h3>
            <div className="flex h-6 rounded overflow-hidden">
              {Object.entries(statusCounts).map(([s, count]) => (
                <div key={s} title={`${s.replace(/_/g, ' ')}: ${count}`}
                  style={{ width: `${(count / filtered.length) * 100}%` }}
                  className={`flex items-center justify-center text-xs font-bold ${
                    s === 'approved' ? 'bg-green-500 text-white' :
                    s === 'submitted' ? 'bg-blue-500 text-white' :
                    s === 'under_review' ? 'bg-purple-500 text-white' :
                    s === 'rejected' ? 'bg-red-500 text-white' :
                    s === 'draft' ? 'bg-gray-400 text-white' :
                    'bg-orange-400 text-white'
                  }`}>
                  {count > 2 ? `${s.replace(/_/g, ' ')} (${count})` : count}
                </div>
              ))}
            </div>
          </div>

          {/* Report Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                <tr>
                  <th className="text-left px-3 py-2">Reference</th>
                  <th className="text-left px-3 py-2">Applicant</th>
                  <th className="text-left px-3 py-2">Product</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Debt</th>
                  <th className="text-left px-3 py-2">City</th>
                  <th className="text-left px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(c => (
                  <tr key={c.ref}>
                    <td className="px-3 py-2 font-mono text-xs">{c.ref}</td>
                    <td className="px-3 py-2 font-medium">{c.firstName} {c.lastName}</td>
                    <td className="px-3 py-2">{c.product}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[c.status] || ''}`}>{c.status.replace(/_/g, ' ')}</span></td>
                    <td className="px-3 py-2 text-right font-mono">£{c.debt.toLocaleString()}</td>
                    <td className="px-3 py-2 text-xs">{c.city}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Report Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 p-3 text-xs text-gray-500 flex justify-between">
            <span>Total debt: £{totalDebt.toLocaleString()} across {filtered.length} applications</span>
            <span>AiB IAAS • Automated Report</span>
          </div>
        </div>
      )}

      {/* Data preview (when not generated) */}
      {!generated && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b text-sm text-gray-500">
            Preview: {filtered.length} cases match current filters. Click "Generate Report" for full output.
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b">
              <tr><th className="text-left px-4 py-2">Ref</th><th className="text-left px-4 py-2">Name</th><th className="text-left px-4 py-2">Product</th><th className="text-left px-4 py-2">Status</th><th className="text-right px-4 py-2">Debt</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.slice(0, 5).map(c => (
                <tr key={c.ref}><td className="px-4 py-2 font-mono text-xs">{c.ref}</td><td className="px-4 py-2">{c.firstName} {c.lastName}</td><td className="px-4 py-2">{c.product}</td><td className="px-4 py-2">{c.status.replace(/_/g, ' ')}</td><td className="px-4 py-2 text-right">£{c.debt.toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 5 && <p className="p-3 text-xs text-gray-400 text-center">...and {filtered.length - 5} more</p>}
        </div>
      )}
    </div>
  );
}
