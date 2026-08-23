'use client';

import { useState } from 'react';

export default function MIReportsPage() {
  const [dateRange, setDateRange] = useState('This Month');

  const dateRanges = ['This Week', 'This Month', 'This Quarter', 'This Year'];

  const kpis = [
    { label: 'Applications Received', value: '47', icon: '📥', trend: '+12%' },
    { label: 'Decisions Made', value: '38', icon: '✅', trend: '+8%' },
    { label: 'SLA Compliance', value: '94%', icon: '⏱️', trend: '+2%' },
    { label: 'Staff Utilisation', value: '82%', icon: '👥', trend: '+5%' },
  ];

  const productPerformance = [
    { product: 'DAS', cases: 24, avgDays: 4.2, completionRate: '92%' },
    { product: 'MAP', cases: 12, avgDays: 2.8, completionRate: '96%' },
    { product: 'PTD', cases: 8, avgDays: 6.1, completionRate: '88%' },
    { product: 'Sequestration', cases: 3, avgDays: 8.5, completionRate: '100%' },
  ];

  const staffPerformance = [
    { name: 'Karen MacLeod', decisions: 12, avgDays: 3.8, slaCompliance: '100%' },
    { name: 'James Wilson', decisions: 9, avgDays: 4.1, slaCompliance: '93%' },
    { name: 'Sarah Mitchell', decisions: 8, avgDays: 5.2, slaCompliance: '88%' },
  ];

  const slaBreaches = [
    { ref: 'IAAS-2026-00067', daysOver: 2, assignee: 'Sarah Mitchell', product: 'PTD' },
    { ref: 'IAAS-2026-00072', daysOver: 1, assignee: 'James Wilson', product: 'DAS' },
    { ref: 'IAAS-2026-00081', daysOver: 3, assignee: 'Sarah Mitchell', product: 'Sequestration' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Management Information</h1>
            <p className="text-gray-400 text-sm mt-1">Senior management reporting dashboard</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Export to PDF
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Export to CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Date Range Selector */}
        <div className="flex gap-2">
          {dateRanges.map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-gray-800 rounded-lg p-5 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{kpi.icon}</span>
                  <div>
                    <p className="text-gray-400 text-sm">{kpi.label}</p>
                    <p className="text-2xl font-bold text-white">{kpi.value}</p>
                  </div>
                </div>
                <span className="text-green-400 text-sm font-medium">{kpi.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Performance by Product */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Performance by Product</h2>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Product</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Cases</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Avg Processing (days)</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {productPerformance.map((p) => (
                  <tr key={p.product} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm font-medium text-white">{p.product}</td>
                    <td className="px-4 py-3 text-sm text-white">{p.cases}</td>
                    <td className="px-4 py-3 text-sm text-white">{p.avgDays}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        parseInt(p.completionRate) >= 95 ? 'bg-green-900 text-green-300' :
                        parseInt(p.completionRate) >= 90 ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {p.completionRate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Staff Performance */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Staff Performance</h2>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Officer</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Decisions</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Avg Processing (days)</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">SLA Compliance</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformance.map((s) => (
                  <tr key={s.name} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm font-medium text-white">{s.name}</td>
                    <td className="px-4 py-3 text-sm text-white">{s.decisions}</td>
                    <td className="px-4 py-3 text-sm text-white">{s.avgDays}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        parseInt(s.slaCompliance) >= 95 ? 'bg-green-900 text-green-300' :
                        parseInt(s.slaCompliance) >= 90 ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {s.slaCompliance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SLA Breaches */}
        <section>
          <h2 className="text-xl font-semibold mb-4">SLA Breaches This Period</h2>
          <div className="bg-gray-800 rounded-lg border border-red-900 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Case Ref</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Days Over SLA</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Assignee</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Product</th>
                </tr>
              </thead>
              <tbody>
                {slaBreaches.map((b) => (
                  <tr key={b.ref} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm text-blue-400 font-mono">{b.ref}</td>
                    <td className="px-4 py-3 text-sm text-red-400 font-bold">+{b.daysOver} days</td>
                    <td className="px-4 py-3 text-sm text-white">{b.assignee}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{b.product}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Monthly Trend */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Monthly Trend</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Applications received</span>
                <span className="text-green-400 text-sm font-medium">+12% vs last month</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Average processing time</span>
                <span className="text-green-400 text-sm font-medium">-0.8 days vs last month</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">SLA compliance</span>
                <span className="text-green-400 text-sm font-medium">+2% vs last month (94% from 92%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Customer satisfaction</span>
                <span className="text-green-400 text-sm font-medium">+4 points vs last month (4.3/5)</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
