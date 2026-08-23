'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  scopes: string[];
  created: string;
  lastUsed: string;
  status: 'Active' | 'Revoked';
}

const MOCK_KEYS: ApiKey[] = [
  {
    id: 'key-001', name: 'BASYS Integration', key: 'iaas_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    maskedKey: 'iaas_****...****o5p6', scopes: ['read:applications', 'write:applications', 'read:audit'],
    created: '2024-01-05', lastUsed: '2 minutes ago', status: 'Active',
  },
  {
    id: 'key-002', name: 'eDEN Sync', key: 'iaas_live_q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
    maskedKey: 'iaas_****...****e1f2', scopes: ['read:applications', 'read:organisations'],
    created: '2024-01-08', lastUsed: '15 minutes ago', status: 'Active',
  },
  {
    id: 'key-003', name: 'Credit Bureau', key: 'iaas_live_g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8',
    maskedKey: 'iaas_****...****u7v8', scopes: ['read:applications', 'write:credit_checks'],
    created: '2024-01-10', lastUsed: '1 hour ago', status: 'Active',
  },
  {
    id: 'key-004', name: 'Payment Provider', key: 'iaas_live_w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4',
    maskedKey: 'iaas_****...****k3l4', scopes: ['read:applications', 'write:payments'],
    created: '2024-01-12', lastUsed: '3 hours ago', status: 'Active',
  },
  {
    id: 'key-005', name: 'Reporting Dashboard', key: 'iaas_live_m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0',
    maskedKey: 'iaas_****...****a9b0', scopes: ['read:applications', 'read:audit', 'read:statistics'],
    created: '2024-01-15', lastUsed: '30 minutes ago', status: 'Active',
  },
];

const ALL_SCOPES = [
  'read:applications', 'write:applications',
  'read:audit', 'write:audit',
  'read:organisations', 'write:organisations',
  'read:users', 'write:users',
  'read:statistics',
  'write:credit_checks',
  'write:payments',
  'read:recommendations',
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(MOCK_KEYS);
  const [showGenerate, setShowGenerate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const toggleScope = (scope: string) => {
    setNewKeyScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
  };

  const generateKey = () => {
    if (!newKeyName.trim()) return;
    const randomPart = Array.from({ length: 32 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
    const fullKey = `iaas_live_${randomPart}`;
    const masked = `iaas_****...****${randomPart.slice(-4)}`;
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      key: fullKey,
      maskedKey: masked,
      scopes: newKeyScopes.length > 0 ? newKeyScopes : ['read:applications'],
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      status: 'Active',
    };
    setKeys(prev => [newKey, ...prev]);
    setGeneratedKey(fullKey);
    setNewKeyName('');
    setNewKeyScopes([]);
  };

  const revokeKey = (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'Revoked' as const } : k));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">API Key Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage API keys for external system integrations.</p>
        </div>
        <Link href="/admin" className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 no-underline text-gray-700 dark:text-gray-300">
          &larr; Admin
        </Link>
      </div>

      {/* Generated Key Alert */}
      {generatedKey && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-bold text-green-800 dark:text-green-300 mb-2">New API Key Generated</p>
          <p className="text-xs text-green-700 dark:text-green-400 mb-2">Copy this key now. You will not be able to see it again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded px-3 py-2 text-sm font-mono text-green-800 dark:text-green-200 break-all">{generatedKey}</code>
            <button onClick={() => { navigator.clipboard.writeText(generatedKey); }} className="px-3 py-2 bg-green-700 text-white text-xs font-bold rounded hover:bg-green-800">Copy</button>
          </div>
          <button onClick={() => setGeneratedKey(null)} className="mt-2 text-xs text-green-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Keys Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-bold text-lg">API Keys ({keys.filter(k => k.status === 'Active').length} active)</h2>
          <button
            onClick={() => setShowGenerate(!showGenerate)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition-colors"
          >
            + Generate New Key
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-750">
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Name</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Key</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Scopes</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Created</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Last Used</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} className={`border-t border-gray-100 dark:border-gray-700 ${k.status === 'Revoked' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{k.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <code className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {revealedKey === k.id ? k.key : k.maskedKey}
                      </code>
                      {k.status === 'Active' && (
                        <button
                          onClick={() => setRevealedKey(revealedKey === k.id ? null : k.id)}
                          className="text-xs text-blue-600 hover:underline ml-1"
                        >
                          {revealedKey === k.id ? 'Hide' : 'Show'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {k.scopes.map(s => (
                        <span key={s} className="text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{k.created}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{k.lastUsed}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      k.status === 'Active' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                    }`}>{k.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {k.status === 'Active' && (
                      <button onClick={() => revokeKey(k.id)} className="text-xs text-red-600 hover:underline font-bold">Revoke</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Form */}
      {showGenerate && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-6">
          <h3 className="font-bold text-lg mb-4">Generate New API Key</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="e.g., DAS Register Integration"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Scopes</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {ALL_SCOPES.map(scope => (
                  <label key={scope} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newKeyScopes.includes(scope)}
                      onChange={() => toggleScope(scope)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-gray-700 dark:text-gray-300 text-xs">{scope}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={generateKey} disabled={!newKeyName.trim()} className="px-4 py-2 bg-green-700 text-white text-sm font-bold rounded hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed">Generate Key</button>
              <button onClick={() => setShowGenerate(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* POC Note */}
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>POC Note:</strong> In production, API keys would be stored hashed (bcrypt/argon2) in a secure vault (AWS Secrets Manager / Azure Key Vault). Key rotation would be enforced every 90 days with automated expiry notifications. All key usage is logged to the audit trail.
        </p>
      </div>
    </div>
  );
}
