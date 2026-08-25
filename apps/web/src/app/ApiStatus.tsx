'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

type ApiConnectionStatus = 'connected' | 'waking' | 'offline';

interface ApiStatusContextValue {
  status: ApiConnectionStatus;
  isApiAvailable: boolean;
  responseTimeMs: number | null;
  isSlow: boolean;
}

export const ApiStatusContext = createContext<ApiStatusContextValue>({
  status: 'offline',
  isApiAvailable: false,
  responseTimeMs: null,
  isSlow: false,
});

export function useApiStatus() {
  return useContext(ApiStatusContext);
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://iaas-api.onrender.com';

export function ApiStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ApiConnectionStatus>('waking');
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [isSlow, setIsSlow] = useState(false);
  const responseTimes = useRef<number[]>([]);
  const failCount = useRef(0);
  const connectedSince = useRef<Date | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const start = performance.now();
      const res = await fetch(`${API_URL}/api/health`, { signal: controller.signal });
      const elapsed = Math.round(performance.now() - start);
      clearTimeout(timeout);

      if (res.ok) {
        setStatus('connected');
        setResponseTimeMs(elapsed);
        failCount.current = 0;

        if (!connectedSince.current) {
          connectedSince.current = new Date();
        }

        // Track last 5 response times
        responseTimes.current.push(elapsed);
        if (responseTimes.current.length > 5) {
          responseTimes.current.shift();
        }

        // Check if degrading (average > 1000ms)
        const avg = responseTimes.current.reduce((a, b) => a + b, 0) / responseTimes.current.length;
        setIsSlow(avg > 1000);
      } else {
        failCount.current++;
        if (failCount.current >= 3) {
          setStatus('offline');
        } else {
          setStatus('waking');
        }
      }
    } catch {
      failCount.current++;
      if (failCount.current >= 3) {
        setStatus('offline');
        connectedSince.current = null;
      } else {
        // 'waking', not a prev-dependent choice. The initial state is already
        // 'waking', so testing for 'connected' sent the very first failure
        // straight to 'offline' — and a first failure is the normal case on
        // Render's free tier, where the container has spun down and the cold
        // start outlasts the 8s abort above. The sibling !res.ok branch already
        // did this correctly.
        setStatus('waking');
      }
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    // Back off while the API is unreachable instead of retrying at a flat 30s
    // forever. A sleeping free-tier instance can take a minute or more to wake,
    // and hammering it neither speeds that up nor tells the user anything new.
    // Reset to the base interval as soon as a probe succeeds.
    const delayFor = (failures: number) => {
      if (failures === 0) return 30000;
      const backedOff = 30000 * 2 ** Math.min(failures, 4); // 60s, 120s, 240s, 480s
      return Math.min(backedOff, 300000); // cap at 5 minutes
    };

    const scheduleNext = () => {
      if (cancelled) return;
      timer = setTimeout(run, delayFor(failCount.current));
    };

    const run = async () => {
      // Skip the probe entirely in a hidden tab: nothing is rendering the status
      // indicator, so the only effect would be keeping a sleeping instance awake.
      if (!document.hidden) await checkHealth();
      scheduleNext();
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        // Re-probe immediately so a returning viewer sees the true state rather
        // than whatever was left on screen.
        void checkHealth();
      }
    };

    void run();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (timer !== null) clearTimeout(timer);
    };
  }, [checkHealth]);

  return (
    <ApiStatusContext.Provider value={{ status, isApiAvailable: status === 'connected', responseTimeMs, isSlow }}>
      {children}
    </ApiStatusContext.Provider>
  );
}

export default function ApiStatusBar() {
  const { status, responseTimeMs, isSlow } = useApiStatus();
  const [upSince, setUpSince] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'connected') {
      // Set the "up since" time on first connection
      const stored = sessionStorage.getItem('iaas-connected-since');
      if (stored) {
        setUpSince(stored);
      } else {
        const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        sessionStorage.setItem('iaas-connected-since', now);
        setUpSince(now);
      }
    }
  }, [status]);

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-1 flex items-center gap-2">
        {status === 'connected' && (
          <>
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-xs text-green-700 dark:text-green-400">
              Connected
              {responseTimeMs !== null && !isSlow && (
                <> &middot; {responseTimeMs}ms</>
              )}
              {isSlow && responseTimeMs !== null && (
                <> &middot; <span className="text-amber-600 dark:text-amber-400 font-bold">Slow ({(responseTimeMs / 1000).toFixed(1)}s)</span></>
              )}
            </span>
            {upSince && (
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 hidden sm:inline">
                Up since: {upSince}
              </span>
            )}
          </>
        )}
        {status === 'waking' && (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs text-amber-700 dark:text-amber-400">Demo mode &mdash; backend waking up...</span>
          </>
        )}
        {status === 'offline' && (
          <>
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">Service disruption detected &mdash; showing demo data</span>
          </>
        )}
      </div>
    </div>
  );
}
