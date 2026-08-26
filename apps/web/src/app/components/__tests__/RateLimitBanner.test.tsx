import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * The display half of the false "Rate limited" defect, plus the Demo Tools gate
 * and the bottom-right stacking that keeps this card clear of the Ask AiB
 * launcher.
 *
 * rateLimitHeaders.test.ts covers the parsing side — that an absent or zero
 * header never becomes a reading. These cover what the user actually saw on
 * screen: `0 / 0 requests used` and `Server limit: 0 requests per 15 minutes`
 * against an API that was either healthy or merely cold.
 *
 * The widget is gated behind Demo Tools, which reads localStorage at mount, so the
 * display tests render through `renderGated` to turn the gate on. Going through the
 * real provider rather than stubbing the context keeps the two honest: a change
 * that broke the gate would show up here rather than passing against a stub.
 */

function seedCallLog(count: number) {
  const now = Date.now();
  const log = Array.from({ length: count }, () => now);
  localStorage.setItem('iaas-api-call-log', JSON.stringify(log));
}

/**
 * Render the banner inside a real DemoToolsProvider.
 *
 * Both modules are imported here, AFTER the per-test vi.resetModules(), so they
 * come from the same module graph. Importing DemoTools statically at the top of the
 * file instead gives the provider a different React context object from the one the
 * freshly-imported banner consumes — two contexts, so the consumer silently falls
 * back to the default `{ enabled: false }` and the widget never renders. That is
 * the same failure the production code hit by mounting outside the provider.
 */
async function renderBanner({ demoTools }: { demoTools: boolean }) {
  if (demoTools) localStorage.setItem('iaas-demo-tools', 'true');
  const [{ default: Banner }, { DemoToolsProvider }] = await Promise.all([
    import('../RateLimitBanner'),
    import('../../DemoTools'),
  ]);
  return render(
    <DemoToolsProvider>
      <Banner />
    </DemoToolsProvider>
  );
}

const renderGated = () => renderBanner({ demoTools: true });
const renderUngated = () => renderBanner({ demoTools: false });

describe('RateLimitBanner', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    document.documentElement.style.removeProperty('--api-usage-height');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  describe('a zero limit can never reach the screen', () => {
    it('shows the assumed limit, not a server limit of zero', async () => {
      // The exact shape of the reported bug. A limit of 0 must not produce
      // "Server limit: 0 requests per 15 minutes", and must not put the card into
      // its "Rate limited" state via `used >= limit` as 0 >= 0.
      vi.doMock('../../../lib/apiClient', () => ({
        getRateLimitState: () => ({ limit: 0, remaining: 0, resetAtMs: Date.now() + 900_000 }),
        onRateLimitChange: () => () => {},
      }));

      await renderGated();

      expect(screen.queryByText(/Rate limited/)).toBeNull();
      expect(screen.queryByText(/Server limit: 0 requests/)).toBeNull();
      expect(screen.queryByText('0 / 0')).toBeNull();
      // Falls back to the assumed budget instead. Asserted exactly: a loose /500/
      // also matches the "500 req/15min" footnote.
      expect(screen.getByText('0 / 500')).toBeTruthy();
    });

    it('reports a real server limit as the server limit', async () => {
      vi.doMock('../../../lib/apiClient', () => ({
        getRateLimitState: () => ({ limit: 500, remaining: 499, resetAtMs: Date.now() + 900_000 }),
        onRateLimitChange: () => () => {},
      }));

      await renderGated();

      // 500 - 499 = 1 request used, the healthy case that read as 0 / 0 before.
      expect(screen.getByText('1 / 500')).toBeTruthy();
      expect(screen.queryByText(/Rate limited/)).toBeNull();
    });

    it('still reports a genuinely exhausted budget', async () => {
      // The fix must not make the banner unable to warn. A real limit with zero
      // remaining is a true "rate limited" state.
      vi.doMock('../../../lib/apiClient', () => ({
        getRateLimitState: () => ({ limit: 500, remaining: 0, resetAtMs: Date.now() + 900_000 }),
        onRateLimitChange: () => () => {},
      }));

      await renderGated();

      expect(screen.getByText('Rate limited')).toBeTruthy();
      expect(screen.getByText(/Server limit: 500 requests per 15 minutes/)).toBeTruthy();
    });

    it('describes an unknown limit as assumed rather than as the server figure', async () => {
      // No reading at all — the CORS case, where the headers never reach script.
      vi.doMock('../../../lib/apiClient', () => ({
        getRateLimitState: () => null,
        onRateLimitChange: () => () => {},
      }));
      seedCallLog(400); // past the 70% warning threshold, so the full banner shows

      await renderGated();

      expect(screen.getByText(/Assumed limit: 500 requests per 15 minutes/)).toBeTruthy();
      expect(screen.queryByText(/Server limit/)).toBeNull();
    });
  });

  describe('bottom-right stacking', () => {
    beforeEach(() => {
      vi.doMock('../../../lib/apiClient', () => ({
        getRateLimitState: () => null,
        onRateLimitChange: () => () => {},
      }));
    });

    it('publishes its height so the Ask AiB launcher can clear it', async () => {
      await renderGated();

      // jsdom reports offsetHeight as 0, so the assertion is that the variable is
      // set at all — the launcher's calc() then resolves rather than falling back.
      expect(document.documentElement.style.getPropertyValue('--api-usage-height')).toBe('0px');
    });

    it('clears the variable on unmount so the launcher drops back down', async () => {
      const { unmount } = await renderGated();
      unmount();

      expect(document.documentElement.style.getPropertyValue('--api-usage-height')).toBe('');
    });

    it('offsets itself by the demo bar height rather than sitting on top of it', async () => {
      const { container } = await renderGated();

      const card = container.firstElementChild as HTMLElement;
      expect(card.style.bottom).toContain('--demo-bar-height');
    });

    it('renders without a ResizeObserver', async () => {
      // jsdom provides none, and this component mounts on every page via the root
      // layout, so an unguarded constructor would break unrelated page tests.
      expect(typeof ResizeObserver).toBe('undefined');

      await expect(renderGated()).resolves.toBeTruthy();
    });
  });

  describe('the Demo Tools gate', () => {
    beforeEach(() => {
      vi.doMock('../../../lib/apiClient', () => ({
        getRateLimitState: () => ({ limit: 500, remaining: 499, resetAtMs: Date.now() + 900_000 }),
        onRateLimitChange: () => () => {},
      }));
    });

    it('renders nothing for an ordinary visitor', async () => {
      // The default. A citizen has no use for a request budget, and when the
      // figures were unavailable this widget's failure mode was actively alarming.
      const { container } = await renderUngated();

      expect(container.firstChild).toBeNull();
      expect(screen.queryByText('API Usage')).toBeNull();
    });

    it('publishes no height when gated off, so Ask AiB keeps its own position', async () => {
      await renderUngated();
      expect(document.documentElement.style.getPropertyValue('--api-usage-height')).toBe('');
    });

    it('renders once Demo Tools is on', async () => {
      await renderGated();
      expect(screen.getByText('API Usage')).toBeTruthy();
      expect(screen.getByText('1 / 500')).toBeTruthy();
    });

    it('stays hidden even at a limit that would otherwise raise the red banner', async () => {
      // Gating must beat the warning state: an exhausted budget is an engineer's
      // problem, and ApiStatusBar already tells a user when the service is unwell.
      vi.resetModules();
      vi.doMock('../../../lib/apiClient', () => ({
        getRateLimitState: () => ({ limit: 500, remaining: 0, resetAtMs: Date.now() + 900_000 }),
        onRateLimitChange: () => () => {},
      }));

      const { container } = await renderUngated();

      expect(container.firstChild).toBeNull();
      expect(screen.queryByText('Rate limited')).toBeNull();
    });
  });
});
