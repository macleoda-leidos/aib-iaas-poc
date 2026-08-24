'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RetentionPolicy {
  recordType: string;
  periodYears: number;
  periodLabel?: string;
  autoArchive: boolean;
  recordsHeld: string;
  editable: boolean;
  maxPeriod?: number;
  minPeriod?: number;
}

const DEFAULT_POLICIES: RetentionPolicy[] = [
  { recordType: 'Applications', periodYears: 6, autoArchive: true, recordsHeld: '1,247', editable: true, minPeriod: 1, maxPeriod: 10 },
  { recordType: 'Audit Events', periodYears: 7, autoArchive: true, recordsHeld: '15,420', editable: true, minPeriod: 1, maxPeriod: 10 },
  { recordType: 'Documents', periodYears: 6, autoArchive: true, recordsHeld: '3,891', editable: true, minPeriod: 1, maxPeriod: 10 },
  { recordType: 'User Accounts', periodYears: 0, periodLabel: 'Account lifetime + 2 years', autoArchive: false, recordsHeld: '156', editable: true, minPeriod: 0, maxPeriod: 0 },
  { recordType: 'Payment Records', periodYears: 6, autoArchive: true, recordsHeld: '892', editable: true, minPeriod: 1, maxPeriod: 10 },
];

const CREDIT_CHECK_POLICY: RetentionPolicy = {
  recordType: 'Credit Checks',
  periodYears: 3,
  autoArchive: true,
  recordsHeld: '500',
  editable: true,
  minPeriod: 1,
  maxPeriod: 3,
};

const STORAGE_KEY = 'iaas-retention-policies';

const dueForArchival = [
  { id: 'IAAS-2020-00342', type: 'Application', created: '12 Sep 2020', deadline: '12 Sep 2026' },
  { id: 'IAAS-2020-00358', type: 'Application', created: '28 Sep 2020', deadline: '28 Sep 2026' },
  { id: 'DOC-2020-01245', type: 'Document', created: '5 Oct 2020', deadline: '5 Oct 2026' },
];

export default function DataRetentionPage() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>(DEFAULT_POLICIES);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editPeriod, setEditPeriod] = useState(0);
  const [editAutoArchive, setEditAutoArchive] = useState(true);
  const [toast, setToast] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setPolicies(parsed);
      } catch {}
    }
  }, []);

  const save = (updated: RetentionPolicy[]) => {
    setPolicies(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setToast('✓ Policy saved');
    setTimeout(() => setToast(''), 2500);
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditPeriod(policies[idx].periodYears);
    setEditAutoArchive(policies[idx].autoArchive);
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    const updated = [...policies];
    updated[editingIdx] = { ...updated[editingIdx], periodYears: editPeriod, autoArchive: editAutoArchive };
    save(updated);
    setEditingIdx(null);
  };

  const addCreditChecks = () => {
    const updated = [...policies, { ...CREDIT_CHECK_POLICY }];
    save(updated);
  };

  const hasCreditChecks = policies.some(p => p.recordType === 'Credit Checks');

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

        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold animate-pulse">
            {toast}
          </div>
        )}

        {/* Storage Usage */}
        <div data-demo="retention-storage" className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Storage Usage</h2>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{storageUsed}GB / {storageTotal}GB</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{storagePercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div className="bg-blue-600 dark:bg-blue-500 h-4 rounded-full transition-all" style={{ width: `${storagePercent}%` }} />
          </div>
        </div>

        {/* Policy Table */}
        <div data-demo="retention-policies" className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Retention Policies</h2>
            {!hasCreditChecks && (
              <button onClick={addCreditChecks} className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-3 py-1.5 rounded">
                + Add Retention Policy
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Record Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Retention Period</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Auto-Archive</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Records Held</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {policies.map((p, idx) => (
                  <tr key={p.recordType} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{p.recordType}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {editingIdx === idx ? (
                        p.periodLabel ? (
                          <span className="text-gray-500 italic">{p.periodLabel}</span>
                        ) : (
                          <select value={editPeriod} onChange={e => setEditPeriod(Number(e.target.value))}
                            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded px-2 py-1 text-sm w-24">
                            {Array.from({ length: (p.maxPeriod || 10) - (p.minPeriod || 1) + 1 }, (_, i) => (p.minPeriod || 1) + i).map(y => (
                              <option key={y} value={y}>{y} year{y !== 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        )
                      ) : (
                        p.periodLabel || `${p.periodYears} years`
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingIdx === idx ? (
                        <button onClick={() => setEditAutoArchive(!editAutoArchive)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editAutoArchive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editAutoArchive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          p.autoArchive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {p.autoArchive ? 'Yes' : 'No'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">{p.recordsHeld}</td>
                    <td className="px-4 py-3 text-center">
                      {editingIdx === idx ? (
                        <div className="flex gap-1 justify-center">
                          <button onClick={saveEdit} className="bg-green-700 text-white text-xs font-bold px-2 py-1 rounded hover:bg-green-800">Save</button>
                          <button onClick={() => setEditingIdx(null)} className="bg-gray-300 dark:bg-gray-600 text-xs font-bold px-2 py-1 rounded">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          {p.editable && !p.periodLabel && (
                            <button onClick={() => startEdit(idx)} className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline">Edit</button>
                          )}
                          {p.recordType === 'Credit Checks' && (
                            <button onClick={() => { const updated = policies.filter((_, i) => i !== idx); save(updated); }}
                              className="text-red-600 dark:text-red-400 text-xs font-bold hover:underline">🗑 Delete</button>
                          )}
                        </div>
                      )}
                    </td>
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
