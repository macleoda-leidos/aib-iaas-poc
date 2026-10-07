'use client';

import { useEffect, useState } from 'react';
import { setAuthToken } from '../../../lib/apiClient';
import { navigateTo } from '../../../lib/navigation';
import Link from 'next/link';

/**
 * GOV.UK One Login (OIDC) callback landing page.
 *
 * The gateway's /api/auth/oidc/callback finishes the authorization-code flow and
 * redirects here with the finished session in the URL FRAGMENT
 * (`#token=…&user=…`). A fragment is deliberate: it is never sent to any server
 * and so never lands in access logs or the backend, unlike a query string.
 *
 * This page stores the token and user under the exact same keys the password
 * login uses (setAuthToken + localStorage), so from here on the session is
 * indistinguishable from a password sign-in, then forwards to the dashboard.
 */
export default function OidcCallbackPage() {
  const [error, setError] = useState('');

  useEffect(() => {
    const raw = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(raw);
    const token = params.get('token');
    const userRaw = params.get('user');

    if (!token) {
      setError('Sign-in did not complete. No session was returned. Please try again.');
      return;
    }

    // Same keys and order as the password path (login/page.tsx completeSignIn).
    setAuthToken(token);
    localStorage.setItem('iaas-auth-token', token);
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        localStorage.setItem('iaas-current-user', JSON.stringify(user));
        sessionStorage.setItem('iaas-current-user', JSON.stringify(user));
      } catch {
        /* malformed user payload — the token alone is enough to proceed */
      }
    }
    localStorage.setItem('iaas-session-start', Date.now().toString());

    // Strip the fragment so a refresh or Back doesn't re-expose the token in the
    // address bar, then land on the dashboard exactly as a password login does.
    history.replaceState(null, '', window.location.pathname + window.location.search);
    navigateTo('/dashboard');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        {error ? (
          <>
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl" aria-hidden="true">&#9888;</span>
            </div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Sign-in incomplete</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Link
              href="/login"
              className="inline-block bg-blue-600 text-white font-bold py-2.5 px-6 rounded hover:bg-blue-700 transition-colors no-underline"
            >
              Back to login
            </Link>
          </>
        ) : (
          <>
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Completing sign-in…</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Verifying your GOV.UK One Login identity.</p>
          </>
        )}
      </div>
    </div>
  );
}
