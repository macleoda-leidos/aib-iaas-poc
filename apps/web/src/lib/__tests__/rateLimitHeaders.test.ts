import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Regression tests for a false "Rate limited" banner shown against a healthy API.
 *
 * The deployed API sends RateLimit-* headers, but did not name them in
 * Access-Control-Expose-Headers — and browsers withhold every response header
 * from script bar seven safelisted ones. So `res.headers.get('RateLimit-Limit')`
 * returned null in the browser, `Number(null)` gave 0, `Number.isFinite(0)` was
 * true, and a limit of 0 was recorded as real. The banner then evaluated
 * `used >= limit` as `0 >= 0` and reported the service as rate limited while it
 * was serving requests with 483 of 500 remaining.
 *
 * These exercise the real fetch path rather than calling the parser directly, so
 * they would have caught the original defect.
 */

const API_URL = 'https://iaas-api.onrender.com';

function respondWith(headers: Record<string, string>) {
  return vi.fn(async () =>
    new Response(JSON.stringify({ success: true, data: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...headers },
    })
  );
}

describe('rate limit header parsing', () => {
  beforeEach(() => {
    // Fresh module per test: rateLimitState is module-level, so a reading from
    // one test would otherwise leak into the next.
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_API_URL', API_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('records the server figures when the headers are exposed', async () => {
    vi.stubGlobal(
      'fetch',
      respondWith({
        'RateLimit-Limit': '500',
        'RateLimit-Remaining': '483',
        'RateLimit-Reset': '176',
      })
    );

    const { apiGet, getRateLimitState } = await import('../apiClient');
    await apiGet('/api/applications');

    const state = getRateLimitState();
    expect(state).not.toBeNull();
    expect(state!.limit).toBe(500);
    expect(state!.remaining).toBe(483);
  });

  it('reports NO state when the headers are absent, rather than a zero limit', async () => {
    // The exact browser condition: server sent them, CORS hid them.
    vi.stubGlobal('fetch', respondWith({}));

    const { apiGet, getRateLimitState } = await import('../apiClient');
    await apiGet('/api/applications');

    // Must be null, NOT { limit: 0, remaining: 0 } — a zero limit is what drove
    // the false "Rate limited" banner.
    expect(getRateLimitState()).toBeNull();
  });

  it('rejects a zero limit even if a header explicitly says zero', async () => {
    // No legitimate state of this API has a budget of zero, so a literal 0 is
    // treated as garbage rather than propagated to the UI.
    vi.stubGlobal(
      'fetch',
      respondWith({ 'RateLimit-Limit': '0', 'RateLimit-Remaining': '0' })
    );

    const { apiGet, getRateLimitState } = await import('../apiClient');
    await apiGet('/api/applications');

    expect(getRateLimitState()).toBeNull();
  });

  it('ignores unparseable header values', async () => {
    vi.stubGlobal(
      'fetch',
      respondWith({ 'RateLimit-Limit': 'unknown', 'RateLimit-Remaining': '12' })
    );

    const { apiGet, getRateLimitState } = await import('../apiClient');
    await apiGet('/api/applications');

    expect(getRateLimitState()).toBeNull();
  });

  it('ignores an empty header value', async () => {
    vi.stubGlobal(
      'fetch',
      respondWith({ 'RateLimit-Limit': '', 'RateLimit-Remaining': '' })
    );

    const { apiGet, getRateLimitState } = await import('../apiClient');
    await apiGet('/api/applications');

    expect(getRateLimitState()).toBeNull();
  });

  it('accepts a remaining count of zero — a genuinely exhausted budget', async () => {
    // Zero REMAINING is real and must be reported; only a zero LIMIT is nonsense.
    vi.stubGlobal(
      'fetch',
      respondWith({ 'RateLimit-Limit': '500', 'RateLimit-Remaining': '0' })
    );

    const { apiGet, getRateLimitState } = await import('../apiClient');
    await apiGet('/api/applications');

    expect(getRateLimitState()).toMatchObject({ limit: 500, remaining: 0 });
  });

  it('keeps the last good reading when a later response omits the headers', async () => {
    const withHeaders = respondWith({
      'RateLimit-Limit': '500',
      'RateLimit-Remaining': '400',
    });
    vi.stubGlobal('fetch', withHeaders);

    const { apiGet, getRateLimitState } = await import('../apiClient');
    await apiGet('/api/applications');
    expect(getRateLimitState()!.remaining).toBe(400);

    // A cached asset or a proxy that strips headers must not erase what we know.
    vi.stubGlobal('fetch', respondWith({}));
    await apiGet('/api/applications');
    expect(getRateLimitState()!.remaining).toBe(400);
  });

  it('notifies subscribers on a new reading', async () => {
    vi.stubGlobal(
      'fetch',
      respondWith({ 'RateLimit-Limit': '500', 'RateLimit-Remaining': '499' })
    );

    const { apiGet, onRateLimitChange } = await import('../apiClient');
    const seen: number[] = [];
    onRateLimitChange((state) => seen.push(state.remaining));

    await apiGet('/api/applications');
    expect(seen).toEqual([499]);
  });

  it('does not notify subscribers when the headers are hidden', async () => {
    vi.stubGlobal('fetch', respondWith({}));

    const { apiGet, onRateLimitChange } = await import('../apiClient');
    const listener = vi.fn();
    onRateLimitChange(listener);

    await apiGet('/api/applications');
    expect(listener).not.toHaveBeenCalled();
  });

  it('reads the headers from a 429 response too', async () => {
    // The most important reading of all: parsing happens before the ok check.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many' } }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'RateLimit-Limit': '500',
              'RateLimit-Remaining': '0',
            },
          }
        )
      )
    );

    const { apiGet, getRateLimitState } = await import('../apiClient');
    await expect(apiGet('/api/applications')).rejects.toThrow();

    expect(getRateLimitState()).toMatchObject({ limit: 500, remaining: 0 });
  });
});
