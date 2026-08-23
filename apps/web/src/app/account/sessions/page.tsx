'use client';

import { useState } from 'react';
import Link from 'next/link';

const MOCK_SESSIONS = [
  { id: 'sess-1', browser: 'Chrome 127', os: 'Windows 11', ip: '86.12.45.xxx', location: 'Edinburgh, UK', lastActive: 'Now', current: true },
  { id: 'sess-2', browser: 'Safari 18', os: 'iPhone 15', ip: '86.12.45.xxx', location: 'Edinburgh, UK', lastActive: '2 hours ago', current: false },
  { id: 'sess-3', browser: 'Firefox 128', os: 'macOS Sonoma', ip: '194.68.12.xxx', location: 'Glasgow, UK', lastActive: '1 day ago', current: false },
];

export default function SessionsPage() {
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [signingOut, setSigningOut] = useState(false);

  const signOutOthers = () => {
    setSigningOut(true);
    setTimeout(() => {
      setSessions(s => s.filter(sess => sess.current));
      setSigningOut(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/account" className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block">← Back to Account</Link>
      <h1 className="text-3xl font-bold mb-2">Active Sessions</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Manage your active login sessions across devices.</p>

      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6 text-sm">
        <p className="text-amber-800 dark:text-amber-200">⏱ <strong>Session expires in 7h 42m</strong> — you will be prompted to re-authenticate after expiry.</p>
      </div>

      <div className="space-y-3 mb-6">
        {sessions.map(sess => (
          <div key={sess.id} className={`border rounded-lg p-4 ${sess.current ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{sess.browser}</span>
                  <span className="text-gray-500 text-xs">on {sess.os}</span>
                  {sess.current && <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded text-xs font-bold">Current</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">📍 {sess.location} • IP: {sess.ip}</p>
                <p className="text-xs text-gray-400 mt-0.5">Last active: {sess.lastActive}</p>
              </div>
              {!sess.current && (
                <button className="text-xs text-red-600 hover:text-red-800 font-medium" onClick={() => setSessions(s => s.filter(x => x.id !== sess.id))}>
                  Revoke
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {sessions.length > 1 && (
        <button onClick={signOutOthers} disabled={signingOut}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded text-sm disabled:opacity-50">
          {signingOut ? 'Signing out...' : 'Sign out all other devices'}
        </button>
      )}

      <div className="mt-8 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
        <p><strong>Security:</strong> Sessions are managed by Keycloak with MFA enforcement. Inactive sessions expire after 8 hours. Suspicious login attempts trigger account lockout after 3 failures.</p>
      </div>
    </div>
  );
}
