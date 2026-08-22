'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type ApiConnectionStatus = 'connected' | 'waking' | 'offline';

interface ApiStatusContextValue {
  status: ApiConnectionStatus;
  isApiAvailable: boolean;
}

export const ApiStatusContext = createContext<ApiStatusContextValue>({
  status: 'offline',
  isApiAvailable: false,
});

export function useApiStatus() {
  return useContext(ApiStatusContext);
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://iaas-api.onrender.com';

export function ApiStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ApiConnectionStatus>('waking');

  const checkHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_URL}/api/health`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        setStatus('connected');
      } else {
        setStatus('waking');
      }
    } catch {
      setStatus((prev) => (prev === 'connected' ? 'waking' : 'offline'));
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <ApiStatusContext.Provider value={{ status, isApiAvailable: status === 'connected' }}>
      {children}
    </ApiStatusContext.Provider>
  );
}

export default function ApiStatusBar() {
  const { status } = useApiStatus();

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-1 flex items-center gap-2">
        {status === 'connected' && (
          <>
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-xs text-green-700 dark:text-green-400">Connected to live backend</span>
          </>
        )}
        {status === 'waking' && (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs text-amber-700 dark:text-amber-400">Demo mode — backend waking up...</span>
          </>
        )}
        {status === 'offline' && (
          <>
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Offline — showing demo data</span>
          </>
        )}
      </div>
    </div>
  );
}
