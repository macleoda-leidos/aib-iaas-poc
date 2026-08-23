'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const INITIAL_FLAGS = [
  { id: 'ai-chatbot', name: 'AI Chatbot', description: 'Floating FAQ assistant', enabled: true, audience: 'All Users', modified: '22 Aug 2026' },
  { id: 'anomaly-detection', name: 'Anomaly Detection', description: 'AI-powered anomaly alerts on dashboard', enabled: true, audience: 'Staff Only', modified: '22 Aug 2026' },
  { id: 'policy-simulation', name: 'Policy Simulation', description: 'What-if rule threshold testing', enabled: true, audience: 'Admin Only', modified: '20 Aug 2026' },
  { id: 'multi-language', name: 'Multi-Language (GD)', description: 'Scottish Gaelic translation toggle', enabled: true, audience: 'All Users', modified: '22 Aug 2026' },
  { id: 'dark-mode', name: 'Dark Mode', description: 'System-wide dark theme', enabled: true, audience: 'All Users', modified: '19 Aug 2026' },
  { id: 'pdf-export', name: 'PDF Export', description: 'Print/download case as PDF', enabled: true, audience: 'Staff Only', modified: '21 Aug 2026' },
  { id: 'batch-processing', name: 'Batch Processing', description: 'Bulk approve/reject from dashboard', enabled: true, audience: 'Admin Only', modified: '22 Aug 2026' },
  { id: 'webhooks', name: 'Webhooks', description: 'External system event notifications', enabled: false, audience: 'Admin Only', modified: '22 Aug 2026' },
];

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState(INITIAL_FLAGS);
  const [backendUrl, setBackendUrl] = useState('');

  useEffect(() => {
    setBackendUrl(localStorage.getItem('iaas-backend-url') || 'https://iaas-api.onrender.com');
  }, []);

  const switchBackend = (url: string) => {
    localStorage.setItem('iaas-backend-url', url);
    window.location.reload();
  };

  const toggle = (id: string) => {
    setFlags(f => f.map(flag => flag.id === id ? { ...flag, enabled: !flag.enabled, modified: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) } : flag));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block">← Back to Admin</Link>
      <h1 className="text-3xl font-bold mb-2">Feature Flags</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Enable or disable features per role. Changes take effect immediately.</p>

      {/* Backend Selector */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-sm mb-2">🔄 Backend API</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Switch between Node.js (live on Render) and .NET 9 (local Docker). Same endpoints, same JSON contracts.</p>
        <div className="flex gap-2">
          <button onClick={() => switchBackend('https://iaas-api.onrender.com')}
            className={`px-3 py-1.5 rounded text-xs font-bold ${backendUrl === 'https://iaas-api.onrender.com' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            Node.js (Render) — Live
          </button>
          <button onClick={() => switchBackend('http://localhost:5001')}
            className={`px-3 py-1.5 rounded text-xs font-bold ${backendUrl === 'http://localhost:5001' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            .NET 9 (Local) — Docker
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Current: {backendUrl || '...'} &bull; Page reloads on switch</p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr><th className="text-left px-4 py-3">Feature</th><th className="text-left px-4 py-3">Description</th><th className="text-left px-4 py-3">Audience</th><th className="text-center px-4 py-3">Enabled</th><th className="text-left px-4 py-3">Modified</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {flags.map(flag => (
              <tr key={flag.id}>
                <td className="px-4 py-3 font-bold">{flag.name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{flag.description}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{flag.audience}</span></td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggle(flag.id)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${flag.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flag.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{flag.modified}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
        <strong>POC Note:</strong> In production, feature flags would be stored in database and changes would propagate to all connected clients in real-time via WebSocket.
      </div>
    </div>
  );
}
