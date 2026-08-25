import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { useVisiblePolling } from '../useVisiblePolling';

/**
 * These assert the rate-limit-relevant behaviour: a hidden tab must stop
 * spending the shared per-IP request budget.
 */

let hidden = false;

function setHidden(value: boolean) {
  hidden = value;
  document.dispatchEvent(new Event('visibilitychange'));
}

function Poller({ onTick, intervalMs = 1000 }: { onTick: () => void; intervalMs?: number }) {
  useVisiblePolling(onTick, intervalMs);
  return null;
}

describe('useVisiblePolling', () => {
  beforeEach(() => {
    hidden = false;
    // document.hidden is a read-only accessor on the prototype, so it has to be
    // redefined rather than assigned.
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('fires immediately on mount', () => {
    const onTick = vi.fn();
    render(<Poller onTick={onTick} />);
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it('polls on the interval while visible', () => {
    const onTick = vi.fn();
    render(<Poller onTick={onTick} intervalMs={1000} />);
    expect(onTick).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(3000);
    expect(onTick).toHaveBeenCalledTimes(4); // mount + 3 ticks
  });

  it('stops polling once the tab is hidden', () => {
    const onTick = vi.fn();
    render(<Poller onTick={onTick} intervalMs={1000} />);
    onTick.mockClear();

    setHidden(true);
    vi.advanceTimersByTime(60000); // a full minute in the background

    expect(onTick).not.toHaveBeenCalled();
  });

  it('refreshes once immediately on becoming visible again', () => {
    const onTick = vi.fn();
    render(<Poller onTick={onTick} intervalMs={1000} />);
    setHidden(true);
    vi.advanceTimersByTime(10000);
    onTick.mockClear();

    setHidden(false);
    // Exactly one catch-up call, not one per interval missed while hidden.
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it('resumes interval polling after becoming visible', () => {
    const onTick = vi.fn();
    render(<Poller onTick={onTick} intervalMs={1000} />);
    setHidden(true);
    setHidden(false);
    onTick.mockClear();

    vi.advanceTimersByTime(2000);
    expect(onTick).toHaveBeenCalledTimes(2);
  });

  it('does not stack intervals when visibility flaps', () => {
    const onTick = vi.fn();
    render(<Poller onTick={onTick} intervalMs={1000} />);

    // Repeated visible events must not each start their own interval — that
    // would multiply the request rate rather than restore it.
    setHidden(false);
    setHidden(false);
    setHidden(false);
    onTick.mockClear();

    vi.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it('still loads once when mounted in a hidden tab', () => {
    hidden = true;
    const onTick = vi.fn();
    render(<Poller onTick={onTick} intervalMs={1000} />);

    expect(onTick).toHaveBeenCalledTimes(1);
    onTick.mockClear();
    // ...but does not go on to poll.
    vi.advanceTimersByTime(5000);
    expect(onTick).not.toHaveBeenCalled();
  });

  it('stops polling after unmount', () => {
    const onTick = vi.fn();
    const { unmount } = render(<Poller onTick={onTick} intervalMs={1000} />);
    unmount();
    onTick.mockClear();

    vi.advanceTimersByTime(5000);
    expect(onTick).not.toHaveBeenCalled();
  });

  it('uses the latest callback without restarting the interval', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Poller onTick={first} intervalMs={1000} />);
    rerender(<Poller onTick={second} intervalMs={1000} />);

    vi.advanceTimersByTime(1000);
    // A re-render must not re-run the mount fetch, only redirect the tick.
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledTimes(1); // its own mount call only
  });
});
