'use client';

import { useState, useEffect } from 'react';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const WARN_THRESHOLD = 80;
const LIMIT_THRESHOLD = 100;
const STORAGE_KEY = 'iaas-api-call-log';

/** Track an API call timestamp */
export function trackApiCall() {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const log: number[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  log.push(now);
  // Keep only calls within the window
  const filtered = log.filter((t) => now - t < WINDOW_MS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/** Get the current call count within the rate limit window */
export function getApiCallCount(): number {
  if (typeof window === 'undefined') return 0;
  const now = Date.now();
  const log: number[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return log.filter((t) => now - t < WINDOW_MS).length;
}

export default function RateLimitBanner() {
  const [callCount, setCallCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check count on mount and periodically
    const check = () => setCallCount(getApiCallCount());
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  if (dismissed || callCount < WARN_THRESHOLD) return null;

  const isLimited = callCount >= LIMIT_THRESHOLD;

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-lg shadow-lg border p-4 ${
      isLimited
        ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800'
        : 'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800'
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{isLimited ? '⛔' : '⚠'}</span>
        <div className="flex-1">
          <p className={`text-sm font-bold ${isLimited ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
            {isLimited ? 'Rate limited' : 'Approaching rate limit'}
          </p>
          <p className={`text-xs mt-0.5 ${isLimited ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
            {isLimited
              ? 'Please wait before making more requests.'
              : `You're approaching the rate limit (${callCount}/${LIMIT_THRESHOLD} calls in 15 min). Please slow down.`
            }
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 text-sm flex-shrink-0"
        >
          &#10005;
        </button>
      </div>
    </div>
  );
}
