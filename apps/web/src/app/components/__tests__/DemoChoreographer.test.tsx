import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import DemoChoreographer from '../DemoChoreographer';
import { dispatchDemoAction, DEMO_EVENT, type DemoAction } from '../../../lib/demoEvents';

// The component reads geometry and drives the scroll position, none of which
// jsdom implements. These stand-ins are the minimum needed for the maths in the
// component to be exercised for real rather than mocked away.
let scrollTo: ReturnType<typeof vi.fn>;
let rafCallbacks: FrameRequestCallback[];

function stubGeometry(el: Element, rect: Partial<DOMRect>) {
  el.getBoundingClientRect = () =>
    ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}), ...rect }) as DOMRect;
}

/**
 * Fire a demo action and let the waitForElement promise chain settle.
 *
 * Every branch in the choreographer goes through waitForElement, so the
 * side-effect happens a microtask (or an observer tick) after dispatch — the
 * assertion has to wait or it races the implementation.
 */
async function fireAction(action: DemoAction) {
  await act(async () => {
    dispatchDemoAction(action);
    // Two turns: one for the querySelector fast path, one for .then().
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  // Real timers while the component mounts: React schedules the useEffect that
  // installs the demo listener via a task, and a fake clock installed before
  // render swallows it — the component then never subscribes and every
  // assertion in the test silently sees zero activity.
  vi.useRealTimers();
  scrollTo = vi.fn();
  rafCallbacks = [];

  vi.stubGlobal('scrollTo', scrollTo);
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo;

  // Deterministic viewport/scroll position so the offset maths is checkable.
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true, writable: true });
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });

  // Capture rAF callbacks instead of running them, so a test can step frames.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafCallbacks.push(cb);
    return rafCallbacks.length;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('DemoChoreographer — mounting', () => {
  it('renders nothing (it is a behaviour-only component)', () => {
    const { container } = render(<DemoChoreographer />);
    expect(container.innerHTML).toBe('');
  });

  it('subscribes to the demo event channel on mount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    render(<DemoChoreographer />);

    expect(addSpy.mock.calls.some(([name]) => name === DEMO_EVENT)).toBe(true);
    addSpy.mockRestore();
  });
});

describe('DemoChoreographer — SCROLL_TO', () => {
  it('scrolls the window to bring the target element into view', async () => {
    const target = document.createElement('div');
    target.id = 'goal';
    document.body.appendChild(target);
    // 600px down the page, 100px tall.
    stubGeometry(target, { top: 600, height: 100 });

    render(<DemoChoreographer />);
    await fireAction({ type: 'SCROLL_TO', selector: '#goal' });

    expect(scrollTo).toHaveBeenCalledTimes(1);
    const arg = scrollTo.mock.calls[0][0];
    expect(arg.behavior).toBe('smooth');

    // Centre within the *visible* area (viewport minus the 96px banner):
    // offset = (800-96-100)/2 = 302, so top = 0 + 600 - 302 = 298.
    expect(arg.top).toBe(298);
  });

  it("block: 'start' pins the element near the top instead of centring it", async () => {
    const target = document.createElement('div');
    target.id = 'top-aligned';
    document.body.appendChild(target);
    stubGeometry(target, { top: 600, height: 100 });

    render(<DemoChoreographer />);
    await fireAction({ type: 'SCROLL_TO', selector: '#top-aligned', block: 'start' });

    // 24px gutter only: 0 + 600 - 24 = 576. Further down than the centred case,
    // which is what "start" means.
    expect(scrollTo.mock.calls[0][0].top).toBe(576);
  });

  it('never scrolls to a negative offset for an element above the fold', async () => {
    const target = document.createElement('div');
    target.id = 'near-top';
    document.body.appendChild(target);
    stubGeometry(target, { top: 10, height: 40 });

    render(<DemoChoreographer />);
    await fireAction({ type: 'SCROLL_TO', selector: '#near-top' });

    // Centring a near-top element computes a negative top; it must be clamped,
    // or the browser ignores the call and the beat silently does nothing.
    expect(scrollTo.mock.calls[0][0].top).toBe(0);
  });

  it('accounts for the current scroll position, not just the element rect', async () => {
    const target = document.createElement('div');
    target.id = 'scrolled';
    document.body.appendChild(target);
    stubGeometry(target, { top: 100, height: 100 });
    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true, writable: true });

    render(<DemoChoreographer />);
    await fireAction({ type: 'SCROLL_TO', selector: '#scrolled' });

    // getBoundingClientRect().top is viewport-relative, so scrollY must be
    // added to get a document offset: 500 + 100 - 302 = 298.
    expect(scrollTo.mock.calls[0][0].top).toBe(298);
  });

  it('does not throw or scroll when the selector matches nothing', async () => {
    render(<DemoChoreographer />);
    vi.useFakeTimers();

    // No element, so waitForElement goes to its observer and times out.
    dispatchDemoAction({ type: 'SCROLL_TO', selector: '#absent' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('scrolls to an element that only mounts after the action fires', async () => {
    render(<DemoChoreographer />);

    dispatchDemoAction({ type: 'SCROLL_TO', selector: '#late' });

    const late = document.createElement('div');
    late.id = 'late';
    stubGeometry(late, { top: 600, height: 100 });

    await act(async () => {
      document.body.appendChild(late);
      await Promise.resolve();
      await Promise.resolve();
    });

    // This is the whole point of the MutationObserver: a routed page commits
    // after the step's actions have already been dispatched.
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
});

describe('DemoChoreographer — HIGHLIGHT', () => {
  it('applies a visible outline, then restores the original style when it expires', async () => {
    const target = document.createElement('div');
    target.id = 'highlight-me';
    target.style.outline = 'none';
    document.body.appendChild(target);
    stubGeometry(target, { top: 100, height: 50 });

    render(<DemoChoreographer />);
    vi.useFakeTimers();


    await act(async () => {
      dispatchDemoAction({ type: 'HIGHLIGHT', selector: '#highlight-me', durationMs: 1500 });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(target.style.outline).toContain('3px solid');
    expect(target.style.outlineOffset).toBe('3px');

    // Still highlighted just before the duration elapses.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1400);
    });
    expect(target.style.outline).toContain('3px solid');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    // Restored to what it was, not blanket-cleared.
    expect(target.style.outline).toBe('none');
    expect(target.style.outlineOffset).toBe('');
  });

  it('defaults to a 2s highlight when no duration is given', async () => {
    const target = document.createElement('div');
    target.id = 'default-duration';
    document.body.appendChild(target);
    stubGeometry(target, { top: 100, height: 50 });

    render(<DemoChoreographer />);
    vi.useFakeTimers();

    await act(async () => {
      dispatchDemoAction({ type: 'HIGHLIGHT', selector: '#default-duration' });
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1900);
    });
    expect(target.style.outline).toContain('3px solid');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(target.style.outline).toBe('');
  });

  it('scrolls the highlighted element into view as well as ringing it', async () => {
    const target = document.createElement('div');
    target.id = 'highlight-scroll';
    document.body.appendChild(target);
    stubGeometry(target, { top: 600, height: 100 });

    render(<DemoChoreographer />);
    await fireAction({ type: 'HIGHLIGHT', selector: '#highlight-scroll' });

    // No use ringing something off-screen.
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the highlight target is missing', async () => {
    render(<DemoChoreographer />);
    vi.useFakeTimers();

    // A rejected waitForElement chain would surface as an unhandled rejection
    // here rather than a thrown error, so watch for that explicitly.
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);

    dispatchDemoAction({ type: 'HIGHLIGHT', selector: '.no-such-thing' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe('DemoChoreographer — CLICK', () => {
  it('clicks the target element after scrolling to it', async () => {
    const button = document.createElement('button');
    button.id = 'click-me';
    const onClick = vi.fn();
    button.addEventListener('click', onClick);
    document.body.appendChild(button);
    stubGeometry(button, { top: 300, height: 40 });

    render(<DemoChoreographer />);
    vi.useFakeTimers();

    await act(async () => {
      dispatchDemoAction({ type: 'CLICK', selector: '#click-me' });
      await Promise.resolve();
      await Promise.resolve();
    });

    // Scroll happens immediately, the click is deferred so the audience sees
    // what is about to be clicked.
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not click anything when the selector matches nothing', async () => {
    const decoy = document.createElement('button');
    const onClick = vi.fn();
    decoy.addEventListener('click', onClick);
    document.body.appendChild(decoy);

    render(<DemoChoreographer />);
    vi.useFakeTimers();

    dispatchDemoAction({ type: 'CLICK', selector: '#not-here' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(onClick).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe('DemoChoreographer — SLOW_SCROLL', () => {
  it('drives the scroll position frame by frame and ends at the target', async () => {
    // A tall document so there is somewhere to scroll to.
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 3000,
      configurable: true,
    });

    render(<DemoChoreographer />);
    await fireAction({ type: 'SLOW_SCROLL', durationMs: 1000 });

    expect(rafCallbacks.length).toBeGreaterThan(0);

    const nowSpy = vi.spyOn(performance, 'now');

    // Frame at the midpoint.
    const start = performance.now();
    nowSpy.mockReturnValue(start + 500);
    act(() => {
      rafCallbacks.shift()!(start + 500);
    });

    // Final frame, past the duration, so t clamps to 1.
    act(() => {
      rafCallbacks.shift()!(start + 2000);
    });

    // endY = 3000 - 800 + 96 = 2296. The last frame must land exactly there,
    // not overshoot, because easeInOut(1) === 1.
    const last = scrollTo.mock.calls[scrollTo.mock.calls.length - 1];
    expect(last[0]).toBe(0);
    expect(last[1]).toBeCloseTo(2296, 0);

    nowSpy.mockRestore();
  });

  it('does not animate when the page is too short to scroll', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 700,
      configurable: true,
    });

    render(<DemoChoreographer />);
    await fireAction({ type: 'SLOW_SCROLL', durationMs: 1000 });

    // endY clamps to 0 and startY is 0, so the <8px guard should bail out
    // rather than scheduling a pointless animation.
    expect(rafCallbacks).toHaveLength(0);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('cancels an in-flight slow scroll when a second one starts', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 3000,
      configurable: true,
    });
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);

    render(<DemoChoreographer />);
    await fireAction({ type: 'SLOW_SCROLL', durationMs: 1000 });
    await fireAction({ type: 'SLOW_SCROLL', durationMs: 1000 });

    // Otherwise two animations fight over scrollY and the page stutters.
    expect(cancel).toHaveBeenCalled();
  });
});

describe('DemoChoreographer — unknown actions', () => {
  it('ignores page-local actions without throwing', async () => {
    render(<DemoChoreographer />);

    // FILL_* / SUBMIT etc. belong to the page that owns the state.
    for (const action of [
      { type: 'SUBMIT' },
      { type: 'RUN_CHECKS' },
      { type: 'NEXT_STEP' },
      { type: 'FILL_PERSONAL', data: {} },
    ] as DemoAction[]) {
      await fireAction(action);
    }

    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe('DemoChoreographer — cleanup on unmount', () => {
  it('stops responding to demo actions after unmount', async () => {
    const target = document.createElement('div');
    target.id = 'after-unmount';
    document.body.appendChild(target);
    stubGeometry(target, { top: 600, height: 100 });

    const { unmount } = render(<DemoChoreographer />);
    await fireAction({ type: 'SCROLL_TO', selector: '#after-unmount' });
    expect(scrollTo).toHaveBeenCalledTimes(1);

    unmount();
    await fireAction({ type: 'SCROLL_TO', selector: '#after-unmount' });

    // Still 1: the listener was removed, so navigating away from the demo
    // cannot leave a stale choreographer scrolling the next page.
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('removes its listener from the demo event channel', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<DemoChoreographer />);
    unmount();

    expect(removeSpy.mock.calls.some(([name]) => name === DEMO_EVENT)).toBe(true);
    removeSpy.mockRestore();
  });

  it('cancels a pending highlight timer, leaving the element untouched', async () => {
    const target = document.createElement('div');
    target.id = 'unmount-highlight';
    target.style.outline = 'none';
    document.body.appendChild(target);
    stubGeometry(target, { top: 100, height: 50 });

    const { unmount } = render(<DemoChoreographer />);
    vi.useFakeTimers();

    await act(async () => {
      dispatchDemoAction({ type: 'HIGHLIGHT', selector: '#unmount-highlight', durationMs: 2000 });
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(target.style.outline).toContain('3px solid');

    unmount();
    const outlineAtUnmount = target.style.outline;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    // The restore timer was cleared, so the outline is frozen as it was rather
    // than a stray timer firing against a detached tree later.
    expect(target.style.outline).toBe(outlineAtUnmount);
  });

  it('cancels an in-flight slow scroll on unmount', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 3000,
      configurable: true,
    });
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);

    const { unmount } = render(<DemoChoreographer />);
    await fireAction({ type: 'SLOW_SCROLL', durationMs: 5000 });
    expect(rafCallbacks.length).toBeGreaterThan(0);

    unmount();

    expect(cancel).toHaveBeenCalled();
  });

  it('cancels a pending CLICK timer so nothing is clicked after unmount', async () => {
    const button = document.createElement('button');
    button.id = 'unmount-click';
    const onClick = vi.fn();
    button.addEventListener('click', onClick);
    document.body.appendChild(button);
    stubGeometry(button, { top: 300, height: 40 });

    const { unmount } = render(<DemoChoreographer />);
    vi.useFakeTimers();

    await act(async () => {
      dispatchDemoAction({ type: 'CLICK', selector: '#unmount-click' });
      await Promise.resolve();
      await Promise.resolve();
    });

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Clicking a button on a page the user has already left would fire a real
    // mutation against the wrong screen.
    expect(onClick).not.toHaveBeenCalled();
  });
});
