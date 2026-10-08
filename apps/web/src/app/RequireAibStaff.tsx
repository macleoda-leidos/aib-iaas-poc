'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getAuthToken } from '../lib/apiClient';
import Link from 'next/link';

/**
 * Route guard for the internal AiB tools (Statistics / Security / Admin and all
 * their sub-pages). Defence-in-depth to match the menu gate in StaffNavItems: a
 * non-AiB user (creditor, money adviser, debtor, supplier) or an anonymous
 * visitor who navigates to one of these URLs directly is shown an unauthorised
 * notice instead of the page. The real staff APIs are RBAC-gated server-side; this
 * is the UI-level gate for the mostly-static internal screens.
 */
function isAibStaff(role: string): boolean {
  const r = role.toLowerCase();
  return r === 'system_admin' || r.startsWith('aib') || r === 'statistician' || r === 'cyberops_analyst';
}

export default function RequireAibStaff({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<'checking' | 'ok' | 'denied' | 'anon'>('checking');

  useEffect(() => {
    // The scripted demo tours these AiB-only screens; let it through regardless of
    // session (it's a controlled presentation, flagged by DemoMode).
    if (localStorage.getItem('iaas-demo-active') === '1') { setState('ok'); return; }

    const token = getAuthToken() || localStorage.getItem('iaas-auth-token');
    if (!token) { setState('anon'); return; }
    try {
      const raw = localStorage.getItem('iaas-current-user') || sessionStorage.getItem('iaas-current-user');
      const role = raw ? String(JSON.parse(raw).role || '') : '';
      setState(isAibStaff(role) ? 'ok' : 'denied');
    } catch {
      setState('denied');
    }
    // Re-evaluate on navigation so the post-login redirect / demo steps update it.
  }, [pathname]);

  if (state === 'checking') {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (state === 'ok') return <>{children}</>;

  // anon or denied → an unauthorised notice (never the page content).
  const anon = state === 'anon';
  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 shadow-sm">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl" aria-hidden="true">&#9888;</span>
        </div>
        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">
          {anon ? 'Authentication required' : 'Unauthorised'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {anon
            ? 'Please sign in with an AiB staff account to access this area.'
            : 'This area is restricted to Accountant in Bankruptcy staff. Your account does not have access.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Link href={anon ? '/login' : '/dashboard'} className="inline-block bg-blue-600 text-white font-bold py-2.5 px-6 rounded hover:bg-blue-700 transition-colors no-underline">
            {anon ? 'Go to login' : 'Back to dashboard'}
          </Link>
        </div>
      </div>
    </div>
  );
}
