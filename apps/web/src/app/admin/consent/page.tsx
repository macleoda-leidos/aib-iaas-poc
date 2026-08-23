'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ConsentType {
  name: string;
  description: string;
  legalBasis: string;
  required: boolean;
  defaultEnabled: boolean;
}

const consentTypes: ConsentType[] = [
  { name: 'Data Processing', description: 'Processing personal data for application assessment', legalBasis: 'Contract', required: true, defaultEnabled: true },
  { name: 'Marketing', description: 'Receiving updates about AiB services and news', legalBasis: 'Consent', required: false, defaultEnabled: false },
  { name: 'Third-Party Sharing', description: 'Sharing data with credit reference agencies and partners', legalBasis: 'Legitimate Interest', required: false, defaultEnabled: false },
  { name: 'Analytics', description: 'Using anonymised data to improve our services', legalBasis: 'Consent', required: false, defaultEnabled: true },
  { name: 'Research', description: 'Participation in anonymised research studies', legalBasis: 'Consent', required: false, defaultEnabled: false },
];

const consentHistory = [
  { date: '15 Aug 2026, 10:30', type: 'Data Processing', action: 'Granted', method: 'Application form' },
  { date: '15 Aug 2026, 10:30', type: 'Analytics', action: 'Granted', method: 'Application form' },
  { date: '16 Aug 2026, 14:15', type: 'Marketing', action: 'Granted', method: 'Account settings' },
  { date: '18 Aug 2026, 09:00', type: 'Marketing', action: 'Withdrawn', method: 'Account settings' },
  { date: '19 Aug 2026, 11:20', type: 'Third-Party Sharing', action: 'Granted', method: 'Account settings' },
];

export default function ConsentPage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(consentTypes.map(c => [c.name, c.defaultEnabled]))
  );

  const handleToggle = (name: string, required: boolean) => {
    if (required) return;
    setToggles(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            ← Back to Admin
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Consent Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">GDPR-compliant consent tracking and data subject rights</p>

        {/* Privacy Notice Version */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
          <p className="text-blue-800 dark:text-blue-300 text-sm">
            <span className="font-medium">Privacy Notice:</span> Version 2.3 — Last updated 1 Aug 2026
          </p>
        </div>

        {/* Consent Types Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Consent Preferences</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {consentTypes.map((c) => (
              <div key={c.name} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 dark:text-white font-medium">{c.name}</p>
                    {c.required && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{c.description}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Legal basis: {c.legalBasis}</p>
                </div>
                <button
                  onClick={() => handleToggle(c.name, c.required)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    toggles[c.name] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  } ${c.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={c.required}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      toggles[c.name] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Consent History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Consent History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Consent Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {consentHistory.map((h, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{h.date}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{h.type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        h.action === 'Granted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {h.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{h.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Subject Rights */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Data Subject Rights</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Exercise your rights under GDPR Articles 15-22
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
              Request My Data
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm">
              Delete My Data
            </button>
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
              Restrict Processing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
