'use client';

import { useState, useEffect } from 'react';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY = 'iaas-api-call-log';
const WINDOW_START_KEY = 'iaas-rate-window-start';

/** Track an API call timestamp */
export function trackApiCall() {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const log: number[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  log.push(now);
  // Keep only calls within the window
  const filtered = log.filter((t) => now - t < WINDOW_MS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  // Track window start
  if (!localStorage.getItem(WINDOW_START_KEY) || filtered.length === 1) {
    localStorage.setItem(WINDOW_START_KEY, now.toString());
  }
}

/** Get the current call count within the rate limit window */
export function getApiCallCount(): number {
  if (typeof window === 'undefined') return 0;
  const now = Date.now();
  const log: number[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return log.filter((t) => now - t < WINDOW_MS).length;
}

/** Get the time until reset in ms */
function getTimeUntilReset(): number {
  if (typeof window === 'undefined') return 0;
  const now = Date.now();
  const log: number[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const validCalls = log.filter((t) => now - t < WINDOW_MS);
  if (validCalls.length === 0) return WINDOW_MS;
  const oldest = Math.min(...validCalls);
  const resetTime = oldest + WINDOW_MS;
  return Math.max(0, resetTime - now);
}

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

export default function RateLimitBanner() {
  const [callCount, setCallCount] = useState(0);
  const [timeUntilReset, setTimeUntilReset] = useState(WINDOW_MS);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const limit = isAuthenticated ? 200 : 100;
  const warnThreshold = Math.floor(limit * 0.7);

  useEffect(() => {
    // Check auth status
    const token = localStorage.getItem('iaas-auth-token');
    setIsAuthenticated(!!token);

    // Check count on mount and periodically
    const check = () => {
      setCallCount(getApiCallCount());
      setTimeUntilReset(getTimeUntilReset());
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  // Always show the compact usage indicator
  const percentage = Math.min(100, Math.round((callCount / limit) * 100));
  const isLimited = callCount >= limit;
  const isWarning = callCount >= warnThreshold;

  // Full banner only shows at warning/limited
  if (!isWarning && !dismissed) {
    // Show compact mini indicator in bottom right
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-3 min-w-[220px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">API Usage</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isAuthenticated ? 'Authenticated' : 'Anonymous'}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percentage < 70 ? 'bg-green-500' : percentage < 90 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-mono text-gray-600 dark:text-gray-400 min-w-[60px] text-right">
              {callCount} / {limit}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            Resets in {formatTime(timeUntilReset)} • {isAuthenticated ? '200' : '100'} req/15min
          </p>
        </div>
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-lg shadow-lg border p-4 ${
      isLimited
        ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800'
        : 'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800'
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{isLimited ? '⛔' : '⚠️'}</span>
        <div className="flex-1">
          <p className={`text-sm font-bold ${isLimited ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
            {isLimited ? 'Rate limited' : 'Approaching rate limit'}
          </p>

          {/* Usage bar */}
          <div className="mt-2 mb-1.5">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={isLimited ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}>
                {callCount} / {limit} requests used (15 min window)
              </span>
            </div>
            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isLimited ? 'bg-red-500' : 'bg-amber-500'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Tier info */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {isAuthenticated ? 'Authenticated user: 200 requests' : 'Anonymous user: 100 requests'}
          </p>

          {/* Reset countdown */}
          <p className={`text-xs font-medium ${isLimited ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
            Resets in {formatTime(timeUntilReset)}
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
