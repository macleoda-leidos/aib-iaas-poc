'use client';

import { useState } from 'react';
import Link from 'next/link';

const MOCK_DATA = [
  { ref: 'IAAS-2026-00012', name: 'Alistair Morrison', status: 'submitted', debt: 18400, product: 'DAS', date: '29 Jun 2026' },
  { ref: 'IAAS-2026-00011', name: 'Brenda Campbell', status: 'under_review', debt: 9200, product: 'MAP', date: '28 Jun 2026' },
  { ref: 'IAAS-2026-00010', name: 'Craig Stewart', status: 'additional_info_required', debt: 23100, product: 'PTD', date: '26 Jun 2026' },
  { ref: 'IAAS-2026-00009', name: 'Diana Murray', status: 'submitted', debt: 6800, product: 'Sequestration', date: '25 Jun 2026' },
  { ref: 'IAAS-2026-00008', name: 'Eleanor MacPherson', status: 'approved', debt: 14200, product: 'DAS', date: '20 Jun 2026' },
];

export default function ExportPage() {
  const [exported, setExported] = useState(false);

  const exportCSV = () => {
    const header = 'Reference,Applicant,Status,Total Debt,Product,Date\n';
    const rows = MOCK_DATA.map(r => `${r.ref},${r.name},${r.status},${r.debt},${r.product},${r.date}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'iaas-applications-export.csv';
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block">← Back to Admin</Link>
      <h1 className="text-3xl font-bold mb-2">Data Export</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Export application data and audit trails for reporting and compliance.</p>

      <div className="flex gap-3 mb-6">
        <button onClick={exportCSV} className="bg-green-700 hover:bg-green-800 text-white font-bold px-4 py-2 rounded text-sm">📥 Export CSV</button>
        <button onClick={() => window.print()} className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded text-sm">🖨 Print / PDF</button>
      </div>

      {exported && <p className="text-green-700 dark:text-green-400 text-sm mb-4 font-bold">✓ CSV downloaded successfully</p>}

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Reference</th>
              <th className="text-left px-4 py-3 font-semibold">Applicant</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Total Debt</th>
              <th className="text-left px-4 py-3 font-semibold">Product</th>
              <th className="text-left px-4 py-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {MOCK_DATA.map(r => (
              <tr key={r.ref}>
                <td className="px-4 py-3 font-mono text-xs">{r.ref}</td>
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">{r.status}</span></td>
                <td className="px-4 py-3 text-right">£{r.debt.toLocaleString()}</td>
                <td className="px-4 py-3">{r.product}</td>
                <td className="px-4 py-3 text-gray-500">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
