'use client';

import { useEffect, useRef } from 'react';

/**
 * Run `callback` on an interval, but only while the tab is visible.
 *
 * Every poll in this app used a bare setInterval, which browsers keep running in
 * background tabs (throttled to roughly once a minute, but never stopped). During
 * a demo tabs accumulate, and each forgotten one kept spending the shared
 * per-IP rate-limit budget on data nobody was looking at.
 *
 * On becoming visible again the callback fires immediately rather than waiting
 * out the remaining interval, so a tab switched back to is never showing stale
 * data while it waits.
 */
export function useVisiblePolling(callback: () => void, intervalMs: number) {
  // Held in a ref so a caller passing an inline function does not tear down and
  // rebuild the interval on every render.
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (interval !== null) {
        clearInterval(interval);
        interval = null;
      }
    };

    const start = () => {
      if (interval !== null) return; // already running
      interval = setInterval(() => callbackRef.current(), intervalMs);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        callbackRef.current();
        start();
      }
    };

    // Initial fetch happens regardless: a tab opened in the background still
    // needs its first load, and this matches the previous behaviour.
    callbackRef.current();
    if (!document.hidden) start();

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stop();
    };
  }, [intervalMs]);
}
