'use client';

import Link from 'next/link';

const retentionPolicies = [
  { recordType: 'Applications', period: '6 years', autoArchive: true, recordsHeld: '1,247' },
  { recordType: 'Audit Events', period: '7 years', autoArchive: true, recordsHeld: '15,420' },
  { recordType: 'Documents', period: '6 years', autoArchive: true, recordsHeld: '3,891' },
  { recordType: 'User Accounts', period: 'Account lifetime + 2 years', autoArchive: false, recordsHeld: '156' },
  { recordType: 'Payment Records', period: '6 years', autoArchive: true, recordsHeld: '892' },
];

const dueForArchival = [
  { id: 'IAAS-2020-00342', type: 'Application', created: '12 Sep 2020', deadline: '12 Sep 2026' },
  { id: 'IAAS-2020-00358', type: 'Application', created: '28 Sep 2020', deadline: '28 Sep 2026' },
  { id: 'DOC-2020-01245', type: 'Document', created: '5 Oct 2020', deadline: '5 Oct 2026' },
];

export default function DataRetentionPage() {
  const storageUsed = 2.3;
  const storageTotal = 10;
  const storagePercent = (storageUsed / storageTotal) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            ← Back to Admin
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Data Retention</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Manage retention policies and automated archival schedules</p>

        {/* Storage Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Storage Usage</h2>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{storageUsed}GB / {storageTotal}GB</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{storagePercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-4 rounded-full transition-all"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>

        {/* Policy Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Retention Policies</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Record Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Retention Period</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Auto-Archive</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Records Held</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {retentionPolicies.map((p) => (
                  <tr key={p.recordType} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{p.recordType}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.period}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        p.autoArchive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {p.autoArchive ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">{p.recordsHeld}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Due for Archival */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Due for Archival</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Records approaching retention deadline</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Record ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Created</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Archival Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {dueForArchival.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-mono text-xs">{r.id}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{r.type}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.created}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        {r.deadline}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
