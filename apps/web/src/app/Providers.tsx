'use client';

import { ReactNode, useEffect, useState } from 'react';
import { ApplicationProvider } from '../lib/ApplicationContext';
import { CookieBanner } from '../components/CookieBanner';
import { onSessionExpired, logout } from '../lib/apiClient';
import Link from 'next/link';

function SessionExpiredToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setShow(true);
    });
    return unsubscribe;
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-lg shadow-xl p-4 animate-[fadeIn_0.3s_ease-in]">
      <div className="flex items-start gap-3">
        <span className="text-red-600 text-lg flex-shrink-0">&#9888;</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-red-800 dark:text-red-300">Session expired</p>
          <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">Please log in again to continue.</p>
          <div className="flex gap-2 mt-3">
            <Link
              href="/login"
              onClick={() => { setShow(false); logout(); }}
              className="text-xs bg-red-700 text-white font-bold px-3 py-1.5 rounded hover:bg-red-800 no-underline"
            >
              Log In
            </Link>
            <button
              onClick={() => setShow(false)}
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApplicationProvider>
      <CookieBanner />
      {children}
      {/* RateLimitBanner is deliberately NOT here. It is gated behind Demo Tools,
          and this component renders outside DemoToolsProvider, so useDemoTools()
          would read the default context and the widget would never appear. It is
          mounted in layout.tsx beside DemoToolsToggle instead. */}
      <SessionExpiredToast />
    </ApplicationProvider>
  );
}
