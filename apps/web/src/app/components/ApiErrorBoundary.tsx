'use client';

import { useState, useCallback } from 'react';

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper for API-dependent content.
 * Shows offline banner with retry when API is unreachable.
 */
export function ApiErrorFallback({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg p-6 text-center bg-amber-50 dark:bg-amber-950">
      <p className="text-lg mb-2">⚠️ Service Temporarily Unavailable</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error || 'The backend API is waking up (free tier spins down after 15 minutes of inactivity). This usually takes 20-30 seconds.'}</p>
      <button onClick={onRetry} className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded text-sm">
        🔄 Retry Now
      </button>
      <p className="text-xs text-gray-400 mt-2">Data shown below is from local cache until the service responds.</p>
    </div>
  );
}

/**
 * Offline detection banner — shown at top of page when no network
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  if (typeof window !== 'undefined') {
    window.addEventListener('offline', () => setIsOffline(true));
    window.addEventListener('online', () => setIsOffline(false));
  }

  if (!isOffline) return null;

  return (
    <div className="bg-red-600 text-white text-center py-2 text-sm font-bold">
      📡 You are offline — showing cached data. Changes will sync when connection restores.
    </div>
  );
}

/**
 * Hook for API calls with error state + retry
 */
export function useApiCall<T>(apiFn: () => Promise<T>, fallbackData: T) {
  const [data, setData] = useState<T>(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'API unavailable');
    }
    setLoading(false);
  }, [apiFn]);

  return { data, loading, error, retry: execute };
}
