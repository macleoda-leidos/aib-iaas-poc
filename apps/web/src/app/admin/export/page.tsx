'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { seedApplications } from '../../../lib/seedData';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'additional_info_required', label: 'Additional Info Required' },
];

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  under_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  additional_info_required: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

type SortKey = 'ref' | 'name' | 'status' | 'debt' | 'product' | 'date';
type SortDir = 'asc' | 'desc';

function parseDate(dateStr: string): Date {
  // Handles "29 Jun 2026" format
  return new Date(dateStr);
}

export default function ExportPage() {
  const [nameFilter, setNameFilter] = useState('');
  const [refFilter, setRefFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('ref');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [exported, setExported] = useState(false);

  // Filter and sort
  const filtered = useMemo(() => {
    let results = seedApplications.filter(app => {
      if (nameFilter && !`${app.firstName} ${app.lastName}`.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (refFilter && !app.ref.toLowerCase().includes(refFilter.toLowerCase())) return false;
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (dateFrom) {
        const appDate = parseDate(app.date);
        const from = new Date(dateFrom);
        if (appDate < from) return false;
      }
      if (dateTo) {
        const appDate = parseDate(app.date);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        if (appDate > to) return false;
      }
      return true;
    });

    // Sort
    results.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'ref': cmp = a.ref.localeCompare(b.ref); break;
        case 'name': cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'debt': cmp = a.debt - b.debt; break;
        case 'product': cmp = a.product.localeCompare(b.product); break;
        case 'date': cmp = parseDate(a.date).getTime() - parseDate(b.date).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return results;
  }, [nameFilter, refFilter, statusFilter, dateFrom, dateTo, sortKey, sortDir]);

  const resetAll = () => {
    setNameFilter('');
    setRefFilter('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return '↕';
    return sortDir === 'asc' ? '↑' : '↓';
  };

  const exportCSV = () => {
    const header = 'Reference,First Name,Last Name,Status,Total Debt,Product,Date,City,Postcode,Email,NI Number,Employment,Source\n';
    const rows = filtered.map(r =>
      `${r.ref},"${r.firstName}","${r.lastName}",${r.status},${r.debt},${r.product},"${r.date}","${r.city}","${r.postcode}","${r.email}","${r.ni}","${r.employment}","${r.source}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iaas-export-${filtered.length}-records-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const hasFilters = nameFilter || refFilter || statusFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block print:hidden">← Back to Admin</Link>
      <h1 className="text-3xl font-bold mb-2">Data Export</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6 print:hidden">Search, filter, and export application data. CSV and PDF exports contain only filtered results.</p>

      {/* Search Panel */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 print:hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">🔍 Search & Filter</h3>
          {hasFilters && (
            <button onClick={resetAll} className="text-xs text-red-600 dark:text-red-400 font-bold hover:underline">
              ✕ Reset All Filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Debtor Name</label>
            <input
              type="text"
              value={nameFilter}
              onChange={e => setNameFilter(e.target.value)}
              placeholder="e.g. Smith, John"
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Case Reference</label>
            <input
              type="text"
              value={refFilter}
              onChange={e => setRefFilter(e.target.value)}
              placeholder="e.g. IAAS-2026-00012"
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-900"
            >
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Actions + Results Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 print:hidden">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-bold text-gray-900 dark:text-white">{filtered.length}</span> of {seedApplications.length} records
          {hasFilters && <span className="ml-1 text-blue-600 dark:text-blue-400">(filtered)</span>}
        </p>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="bg-green-700 hover:bg-green-800 text-white font-bold px-4 py-2 rounded text-sm">
            📥 Export CSV ({filtered.length})
          </button>
          <button onClick={() => window.print()} className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded text-sm">
            🖨 Print / PDF ({filtered.length})
          </button>
        </div>
      </div>

      {exported && <p className="text-green-700 dark:text-green-400 text-sm mb-4 font-bold print:hidden">✓ CSV downloaded — {filtered.length} records exported</p>}

      {/* Print Header (visible only when printing) */}
      <div className="hidden print:block mb-4">
        <h2 className="text-xl font-bold">AiB IAAS — Data Export Report</h2>
        <p className="text-sm text-gray-600">{filtered.length} records • Generated {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
        {hasFilters && (
          <p className="text-xs text-gray-500 mt-1">
            Filters: {nameFilter && `Name="${nameFilter}" `}{refFilter && `Ref="${refFilter}" `}{statusFilter !== 'all' && `Status="${statusFilter}" `}{dateFrom && `From=${dateFrom} `}{dateTo && `To=${dateTo}`}
          </p>
        )}
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden print:border-0">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No records match your search criteria</p>
            <button onClick={resetAll} className="text-blue-700 dark:text-blue-400 text-sm underline">Reset all filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-3 py-3 font-semibold cursor-pointer hover:text-blue-700 select-none" onClick={() => handleSort('ref')}>Reference {sortIcon('ref')}</th>
                  <th className="text-left px-3 py-3 font-semibold cursor-pointer hover:text-blue-700 select-none" onClick={() => handleSort('name')}>Applicant {sortIcon('name')}</th>
                  <th className="text-left px-3 py-3 font-semibold cursor-pointer hover:text-blue-700 select-none" onClick={() => handleSort('status')}>Status {sortIcon('status')}</th>
                  <th className="text-right px-3 py-3 font-semibold cursor-pointer hover:text-blue-700 select-none" onClick={() => handleSort('debt')}>Total Debt {sortIcon('debt')}</th>
                  <th className="text-left px-3 py-3 font-semibold cursor-pointer hover:text-blue-700 select-none" onClick={() => handleSort('product')}>Product {sortIcon('product')}</th>
                  <th className="text-left px-3 py-3 font-semibold cursor-pointer hover:text-blue-700 select-none" onClick={() => handleSort('date')}>Date {sortIcon('date')}</th>
                  <th className="text-left px-3 py-3 font-semibold print:hidden">City</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(r => (
                  <tr key={r.ref} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-3 py-2 font-mono text-xs">{r.ref}</td>
                    <td className="px-3 py-2 font-medium">{r.firstName} {r.lastName}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-700'}`}>
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">£{r.debt.toLocaleString()}</td>
                    <td className="px-3 py-2">{r.product}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{r.date}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs print:hidden">{r.city}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filtered.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{filtered.length}</p>
            <p className="text-xs text-gray-500">Total Records</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">£{Math.round(filtered.reduce((s, r) => s + r.debt, 0) / 1000)}k</p>
            <p className="text-xs text-gray-500">Total Debt</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">£{Math.round(filtered.reduce((s, r) => s + r.debt, 0) / filtered.length).toLocaleString()}</p>
            <p className="text-xs text-gray-500">Avg Debt</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{filtered.filter(r => r.status === 'approved').length}</p>
            <p className="text-xs text-gray-500">Approved</p>
          </div>
        </div>
      )}
    </div>
  );
}
