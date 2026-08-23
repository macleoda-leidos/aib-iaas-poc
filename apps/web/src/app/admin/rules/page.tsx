'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { RULES, RuleDefinition } from './data/rules-data';

function StatusBadge({ status }: { status: RuleDefinition['status'] }) {
  const styles = {
    active: 'bg-green-100 text-green-800 border border-green-300',
    draft: 'bg-amber-100 text-amber-800 border border-amber-300',
    archived: 'bg-gray-100 text-gray-600 border border-gray-300',
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function RulesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const activeCount = RULES.filter(r => r.status === 'active').length;
  const draftCount = RULES.filter(r => r.status === 'draft').length;
  const lastUpdated = RULES.reduce((latest, r) => r.lastUpdated > latest ? r.lastUpdated : latest, '');
  const avgCoverage = Math.round(RULES.filter(r => r.status === 'active').reduce((sum, r) => sum + r.testResults.coverage, 0) / activeCount);

  const filteredRules = useMemo(() => {
    let rules = [...RULES];

    if (statusFilter !== 'all') {
      rules = rules.filter(r => r.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rules = rules.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.product.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }

    rules.sort((a, b) => sortAsc ? a.priority - b.priority : b.priority - a.priority);

    return rules;
  }, [statusFilter, searchQuery, sortAsc]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rules Engine Management</h1>
          <p className="mt-1 text-gray-600">Configure and test recommendation rules &bull; Engine v2.3</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-green-600">
            <p className="text-sm font-medium text-gray-500">Active Rules</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{activeCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-amber-500">
            <p className="text-sm font-medium text-gray-500">Draft Rules</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{draftCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-gray-400">
            <p className="text-sm font-medium text-gray-500">Last Updated</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatDate(lastUpdated)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-green-600">
            <p className="text-sm font-medium text-gray-500">Test Coverage</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{avgCoverage}%</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search rules by name, product, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Rules Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th
                    className="text-left px-4 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => setSortAsc(!sortAsc)}
                  >
                    Priority {sortAsc ? '▲' : '▼'}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Rule Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Version</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Conditions</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule, index) => (
                  <tr
                    key={rule.id}
                    className={`border-b border-gray-100 hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-4 py-3 font-mono text-gray-600">{rule.priority}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/rules/${rule.id}`} className="text-blue-700 hover:underline font-medium">
                        {rule.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">v{rule.version}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={rule.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">{rule.product}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                      {rule.conditions[0]?.displayText || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/rules/${rule.id}`} className="text-blue-700 hover:underline text-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRules.length === 0 && (
            <div className="text-center py-8 text-gray-500">No rules match your filters.</div>
          )}
        </div>

        {/* POC Notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong className="font-semibold">Proof of Concept Notice:</strong>{' '}
                In production, rules would be editable by policy officers without developer involvement. Changes would go through an approval workflow (Draft → Review → Active) with full audit trail and automated regression testing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
