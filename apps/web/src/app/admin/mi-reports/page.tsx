'use client';

import { useState, useMemo } from 'react';
import { buildMiData, DATE_RANGES, type PeriodSlug } from './miData';

export default function MIReportsPage() {
  const [dateRange, setDateRange] = useState<PeriodSlug>('month');

  const periodLabel = DATE_RANGES.find((r) => r.slug === dateRange)!.label;
  const data = useMemo(() => buildMiData(dateRange), [dateRange]);
  const { kpis, productPerformance, staffPerformance, slaBreaches } = data;

  const exportCSV = () => {
    const lines = [
      `IAAS Management Information — ${periodLabel}`,
      `Generated,${new Date().toISOString().slice(0, 10)}`,
      '',
      'KPI,Value,Trend',
      ...kpis.map((k) => `"${k.label}",${k.value},${k.trend}`),
      '',
      'Product,Cases,Avg Processing (days),Completion Rate',
      ...productPerformance.map((p) => `${p.product},${p.cases},${p.avgDays},${p.completionRate}`),
      '',
      'Officer,Decisions,Avg Processing (days),SLA Compliance',
      ...staffPerformance.map((s) => `"${s.name}",${s.decisions},${s.avgDays},${s.slaCompliance}`),
      '',
      'Case Ref,Days Over SLA,Assignee,Product',
      ...slaBreaches.map((b) => `${b.ref},${b.daysOver},"${b.assignee}",${b.product}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iaas-mi-report-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
      <head>
        <title>IAAS Management Information — ${periodLabel}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 3px solid #d32205; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #d32205; }
          .subtitle { color: #666; font-size: 14px; }
          h1 { font-size: 22px; margin-top: 30px; }
          h2 { font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
          .kpis { display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0; }
          .kpi { border: 1px solid #ddd; border-radius: 4px; padding: 12px 16px; min-width: 150px; }
          .kpi-label { color: #666; font-size: 12px; }
          .kpi-value { font-size: 24px; font-weight: bold; }
          .kpi-trend { color: #00703c; font-size: 12px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          td, th { padding: 8px; border: 1px solid #ddd; text-align: left; font-size: 13px; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Accountant in Bankruptcy</div>
          <div class="subtitle">Initial Application Advice Service — Management Information</div>
        </div>

        <h1>Management Information Report — ${periodLabel}</h1>
        <p><strong>Reporting period:</strong> ${periodLabel}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <h2>Key Performance Indicators</h2>
        <div class="kpis">
          ${kpis.map((k) => `
            <div class="kpi">
              <div class="kpi-label">${k.label}</div>
              <div class="kpi-value">${k.value}</div>
              <div class="kpi-trend">${k.trend} vs ${data.comparator}</div>
            </div>
          `).join('')}
        </div>

        <h2>Performance by Product</h2>
        <table>
          <tr><th>Product</th><th>Cases</th><th>Avg Processing (days)</th><th>Completion Rate</th></tr>
          ${productPerformance.map((p) => `<tr><td>${p.product}</td><td>${p.cases}</td><td>${p.avgDays}</td><td>${p.completionRate}</td></tr>`).join('')}
        </table>

        <h2>Staff Performance</h2>
        <table>
          <tr><th>Officer</th><th>Decisions</th><th>Avg Processing (days)</th><th>SLA Compliance</th></tr>
          ${staffPerformance.map((s) => `<tr><td>${s.name}</td><td>${s.decisions}</td><td>${s.avgDays}</td><td>${s.slaCompliance}</td></tr>`).join('')}
        </table>

        <h2>SLA Breaches This Period</h2>
        <table>
          <tr><th>Case Ref</th><th>Days Over SLA</th><th>Assignee</th><th>Product</th></tr>
          ${slaBreaches.map((b) => `<tr><td>${b.ref}</td><td>+${b.daysOver} days</td><td>${b.assignee}</td><td>${b.product}</td></tr>`).join('')}
        </table>

        <div class="footer">
          <p>Average processing time across all products: ${data.avgProcessingDays} days • SLA compliance ${data.slaCompliance}% (from ${data.priorSla}%) • Customer satisfaction ${data.satisfaction}</p>
          <p>Generated by IAAS Management Information • Accountant in Bankruptcy • Scottish Government</p>
          <p>Document ID: MI-${dateRange.toUpperCase()}-${Date.now()}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    // Small delay to ensure content renders before print dialog
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Management Information</h1>
            <p className="text-gray-400 text-sm mt-1">Senior management reporting dashboard</p>
          </div>
          <div className="flex gap-2">
            <button data-demo="mi-export-pdf" onClick={exportPDF} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Export to PDF
            </button>
            <button data-demo="mi-export-csv" onClick={exportCSV} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Export to CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Date Range Selector */}
        <div className="flex gap-2">
          {DATE_RANGES.map((range) => (
            <button
              key={range.slug}
              data-demo={`mi-period-${range.slug}`}
              onClick={() => setDateRange(range.slug)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dateRange === range.slug
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {range.label}
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

        {/* Period Trend */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Trend vs Previous Period</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Applications received</span>
                <span className="text-green-400 text-sm font-medium">{data.trends.applications} vs {data.comparator}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Average processing time</span>
                <span className="text-green-400 text-sm font-medium">{data.processingDelta} vs {data.comparator} ({data.avgProcessingDays} days)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">SLA compliance</span>
                <span className={`text-sm font-medium ${data.slaCompliance >= data.priorSla ? 'text-green-400' : 'text-red-400'}`}>
                  {data.trends.sla} vs {data.comparator} ({data.slaCompliance}% from {data.priorSla}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Customer satisfaction</span>
                <span className="text-green-400 text-sm font-medium">{data.satisfaction} average rating</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
