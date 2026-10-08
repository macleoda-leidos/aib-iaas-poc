'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { navigateTo } from '../../../lib/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://iaas-api.onrender.com';

/**
 * Set-password landing for the invite / forgotten-password flow. The signed,
 * single-purpose token arrives in the query string; the user chooses a password,
 * which is POSTed to /api/auth/set-password (a public endpoint — the token is the
 * authorisation). On success we send them to the login page.
 */
function SetPasswordInner() {
  const search = useSearchParams();
  const token = search?.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError('This link is missing its token. Please use the link from your invite or reset email.');
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error?.message || 'Could not set your password. The link may have expired.');
        setLoading(false);
        return;
      }
      setDone(true);
      setLoading(false);
      setTimeout(() => navigateTo('/login'), 1500);
    } catch {
      setError('Unable to connect to the server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">Set your password</h1>
        {done ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3"><span className="text-2xl">&#10003;</span></div>
            <p className="font-bold text-green-800 dark:text-green-300">Password set</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Redirecting you to sign in…</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-300">{error}</div>}
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">New password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2.5 text-sm mb-4" placeholder="At least 8 characters" />
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2.5 text-sm mb-6" placeholder="Re-enter your password" />
            <button type="submit" disabled={loading || !token}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition-colors disabled:opacity-60">
              {loading ? 'Setting password…' : 'Set password'}
            </button>
          </form>
        )}
        <div className="text-center mt-4">
          <Link href="/login" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">&larr; Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return <Suspense fallback={<div className="p-8 text-center">Loading…</div>}><SetPasswordInner /></Suspense>;
}
