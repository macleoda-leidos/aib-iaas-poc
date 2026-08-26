'use client';

import { useState, useEffect, useRef } from 'react';
import { getRateLimitState, onRateLimitChange, type RateLimitState } from '../../lib/apiClient';
import { useDemoTools } from '../DemoTools';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY = 'iaas-api-call-log';
const WINDOW_START_KEY = 'iaas-rate-window-start';

// Only used before the first API response reveals the real figure. Matches the
// deployed `max` in services/consolidated-api/src/index.ts.
const DEFAULT_LIMIT = 500;

// Bottom-right is shared chrome: the demo narration bar is fixed to the bottom of
// the viewport, this indicator sits above it, and the Ask AiB launcher sits above
// that. Each element offsets by the measured height of what is below it rather
// than a hardcoded gap, because both the bar and this card reflow — the bar
// line-clamps to two lines, and this card switches between a compact indicator
// and a taller warning banner. Same approach DemoMode already uses for
// --demo-bar-height.
const BOTTOM_OFFSET = 'calc(1rem + var(--demo-bar-height, 0px))';
const HEIGHT_VAR = '--api-usage-height';

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
  // Developer diagnostics, so it is gated behind Demo Tools rather than shown to
  // every visitor. A citizen has no use for a request budget, and when the figures
  // are unavailable the widget's failure mode is actively alarming: it reported
  // "Rate limited - 0 / 0 requests used" against an API that was either healthy or
  // merely cold.
  //
  // Hiding it loses nothing, because a real outage is already reported
  // independently by ApiStatusBar (ApiStatus.tsx) — "backend waking up..." during a
  // cold start, "Service disruption detected" when offline. That is the signal a
  // user needs; this is the one an engineer needs.
  //
  // This must be rendered INSIDE DemoToolsProvider. It is mounted from layout.tsx
  // beside DemoToolsToggle for that reason: Providers sits outside the provider, so
  // mounting there made useDemoTools() read the default context and the widget
  // never appeared at all.
  const { enabled } = useDemoTools();
  const [callCount, setCallCount] = useState(0);
  const [timeUntilReset, setTimeUntilReset] = useState(WINDOW_MS);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // Null until the first API response arrives; the local tally is the fallback.
  const [serverLimit, setServerLimit] = useState<{ limit: number; used: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // The server's own figure when we have it. The previous hardcoded 100/200 bore
  // no relation to the deployed limit of 500 (see consolidated-api/src/index.ts),
  // so this banner warned "rate limited" at a fifth of the real budget — in front
  // of whoever was watching the demo.
  //
  // Tested for a positive limit rather than with `??`: a zero would pass a nullish
  // check and then satisfy `used >= limit` as 0 >= 0, pinning the banner to "Rate
  // limited" against a perfectly healthy API. apiClient now refuses to report a
  // zero limit, so this is defence in depth on the display side.
  const hasServerLimit = serverLimit !== null && serverLimit.limit > 0;
  const limit = hasServerLimit ? serverLimit.limit : DEFAULT_LIMIT;
  const used = hasServerLimit ? serverLimit.used : callCount;
  const warnThreshold = Math.floor(limit * 0.7);

  useEffect(() => {
    // Check auth status
    const token = localStorage.getItem('iaas-auth-token');
    setIsAuthenticated(!!token);

    const applyServerState = (state: RateLimitState) => {
      setServerLimit({ limit: state.limit, used: state.limit - state.remaining });
      setTimeUntilReset(Math.max(0, state.resetAtMs - Date.now()));
    };

    // Seed from whatever the client already knows, in case a request completed
    // before this mounted.
    const existing = getRateLimitState();
    if (existing) applyServerState(existing);
    const unsubscribe = onRateLimitChange(applyServerState);

    // The local tally still drives the countdown between responses, and is the
    // only source at all until the first API call completes.
    const check = () => {
      setCallCount(getApiCallCount());
      setServerLimit((current) => {
        if (!current) setTimeUntilReset(getTimeUntilReset());
        return current;
      });
    };
    check();
    const interval = setInterval(check, 1000);
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // Always show the compact usage indicator
  const percentage = Math.min(100, Math.round((used / limit) * 100));
  const isLimited = used >= limit;
  const isWarning = used >= warnThreshold;

  // Publish this card's height so the Ask AiB launcher can sit clear of it.
  // Declared before the early returns below: hooks cannot be conditional, and the
  // card has three shapes (compact, warning banner, dismissed-to-nothing) that
  // each need a different figure published. Measured via ResizeObserver rather
  // than assumed, because the warning banner is roughly three times the height of
  // the compact indicator.
  useEffect(() => {
    const root = document.documentElement;
    const clear = () => root.style.removeProperty(HEIGHT_VAR);
    const el = cardRef.current;
    if (!el) {
      // Dismissed: nothing is rendered, so the launcher returns to its own gap.
      clear();
      return;
    }

    const publish = () => root.style.setProperty(HEIGHT_VAR, `${el.offsetHeight}px`);
    publish();

    // ResizeObserver is absent in jsdom, and this component mounts in Providers
    // on every page, so an unguarded constructor would throw in any test that
    // renders a page. The publish above has already run; the observer only keeps
    // the figure current as the card reflows.
    if (typeof ResizeObserver === 'undefined') return clear;

    const observer = new ResizeObserver(publish);
    observer.observe(el);

    return () => {
      observer.disconnect();
      clear();
    };
    // `enabled` included so gating the widget off clears the variable via the
    // null-ref path above, dropping the Ask AiB launcher back to its own offset.
  }, [dismissed, isWarning, enabled]);

  // Gated off: render nothing at all. Placed after every hook so hook order is
  // identical on both paths — an early return above the effects would reorder them
  // between renders, which is the React error #310 class of bug already documented
  // in CaseDetail.tsx.
  if (!enabled) return null;

  // Full banner only shows at warning/limited
  if (!isWarning && !dismissed) {
    // Show compact mini indicator in bottom right
    return (
      <div ref={cardRef} className="fixed right-4 z-50" style={{ bottom: BOTTOM_OFFSET }}>
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
              {used} / {limit}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            Resets in {formatTime(timeUntilReset)} • {limit} req/15min
          </p>
        </div>
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <div
      ref={cardRef}
      style={{ bottom: BOTTOM_OFFSET }}
      className={`fixed right-4 z-50 max-w-sm rounded-lg shadow-lg border p-4 ${
        isLimited
          ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800'
          : 'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800'
      }`}
    >
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
                {used} / {limit} requests used (15 min window)
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
            {hasServerLimit ? `Server limit: ${limit} requests per 15 minutes` : `Assumed limit: ${limit} requests per 15 minutes`}
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
