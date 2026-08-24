import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  DEMO_EVENT,
  dispatchDemoAction,
  onDemoAction,
  waitForElement,
  type DemoAction,
} from '../demoEvents';

afterEach(() => {
  // Restore first: a test that stubbed document/window to undefined would make
  // the DOM reset below throw.
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('dispatchDemoAction / onDemoAction', () => {
  it('delivers the dispatched action object to a subscriber', () => {
    const received: DemoAction[] = [];
    const unsubscribe = onDemoAction((a) => received.push(a));

    dispatchDemoAction({ type: 'NEXT_STEP' });
    dispatchDemoAction({ type: 'SCROLL_TO', selector: '#target', block: 'start' });

    unsubscribe();

    // Round-trip: the detail payload must survive the CustomEvent intact,
    // including the discriminant and every extra field the choreographer reads.
    expect(received).toEqual([
      { type: 'NEXT_STEP' },
      { type: 'SCROLL_TO', selector: '#target', block: 'start' },
    ]);
  });

  it('broadcasts to every subscriber, not just the most recent one', () => {
    const first = vi.fn();
    const second = vi.fn();
    const off1 = onDemoAction(first);
    const off2 = onDemoAction(second);

    dispatchDemoAction({ type: 'SUBMIT' });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    off1();
    off2();
  });

  it('stops delivering after unsubscribe, and leaves other subscribers working', () => {
    const staying = vi.fn();
    const leaving = vi.fn();
    const offStaying = onDemoAction(staying);
    const offLeaving = onDemoAction(leaving);

    dispatchDemoAction({ type: 'RUN_CHECKS' });
    offLeaving();
    dispatchDemoAction({ type: 'RUN_CHECKS' });

    // The unsubscribed listener must be frozen at one call while the other
    // continues — i.e. removeEventListener removed the right handler.
    expect(leaving).toHaveBeenCalledTimes(1);
    expect(staying).toHaveBeenCalledTimes(2);

    offStaying();
  });

  it('unsubscribing twice is harmless', () => {
    const cb = vi.fn();
    const off = onDemoAction(cb);
    off();
    expect(() => off()).not.toThrow();

    dispatchDemoAction({ type: 'NEXT_STEP' });
    expect(cb).not.toHaveBeenCalled();
  });

  it('uses an event name the choreographer and pages agree on', () => {
    const raw = vi.fn();
    window.addEventListener(DEMO_EVENT, raw);

    dispatchDemoAction({ type: 'DOWNLOAD_PDF' });

    expect(raw).toHaveBeenCalledTimes(1);
    window.removeEventListener(DEMO_EVENT, raw);
  });

  it('onDemoAction returns a no-op unsubscribe when there is no window (SSR)', () => {
    vi.stubGlobal('window', undefined);

    const cb = vi.fn();
    const off = onDemoAction(cb);

    expect(typeof off).toBe('function');
    expect(() => off()).not.toThrow();
    expect(cb).not.toHaveBeenCalled();
  });

  it('dispatchDemoAction is a no-op when there is no window (SSR)', () => {
    vi.stubGlobal('window', undefined);
    expect(() => dispatchDemoAction({ type: 'NEXT_STEP' })).not.toThrow();
  });
});

describe('waitForElement', () => {
  it('resolves synchronously-available elements with the matching node', async () => {
    document.body.innerHTML = '<div id="already-here">content</div>';

    const el = await waitForElement('#already-here');

    expect(el).not.toBeNull();
    expect(el).toBe(document.getElementById('already-here'));
  });

  it('resolves the first match when several elements satisfy the selector', async () => {
    document.body.innerHTML = `
      <p class="row" data-n="1"></p>
      <p class="row" data-n="2"></p>
    `;

    const el = await waitForElement('.row');

    expect((el as HTMLElement).dataset.n).toBe('1');
  });

  it('resolves once a matching element is added later (MutationObserver path)', async () => {
    // Nothing matches at call time, so this must go through the observer rather
    // than the fast path.
    const pending = waitForElement('#appears-later', 5000);

    let settled = false;
    void pending.then(() => {
      settled = true;
    });

    // Give the microtask queue a turn — a wrong implementation that resolved
    // eagerly with null would already have settled here.
    await Promise.resolve();
    expect(settled).toBe(false);

    const late = document.createElement('section');
    late.id = 'appears-later';
    document.body.appendChild(late);

    const el = await pending;
    expect(el).toBe(late);
  });

  it('resolves when the element appears nested deep inside an added subtree', async () => {
    // subtree:true is what makes this work; a childList-only observer on body
    // would miss a match that arrives inside a wrapper.
    const pending = waitForElement('[data-demo="deep"]', 5000);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<div><div><button data-demo="deep">Go</button></div></div>';
    document.body.appendChild(wrapper);

    const el = await pending;
    expect(el).not.toBeNull();
    expect(el!.tagName).toBe('BUTTON');
  });

  it('resolves null when the element never appears, after the timeout elapses', async () => {
    vi.useFakeTimers();

    const pending = waitForElement('#never', 2500);

    // Not resolved before the deadline.
    let settled = false;
    void pending.then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(2499);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(2);
    await expect(pending).resolves.toBeNull();
  });

  it('honours a custom (shorter) timeout', async () => {
    vi.useFakeTimers();

    const pending = waitForElement('#never-either', 100);
    await vi.advanceTimersByTimeAsync(150);

    await expect(pending).resolves.toBeNull();
  });

  it('does not fire the timeout path once the element has been found', async () => {
    vi.useFakeTimers();

    const pending = waitForElement('#found-then-wait', 1000);

    const el = document.createElement('div');
    el.id = 'found-then-wait';
    document.body.appendChild(el);

    // Let the observer callback run.
    await vi.advanceTimersByTimeAsync(0);
    expect(await pending).toBe(el);

    // Push well past the deadline: the promise is already settled, so the
    // clearTimeout/settled guard must keep it from being re-resolved to null.
    await vi.advanceTimersByTimeAsync(5000);
    expect(await pending).toBe(el);
  });

  it('disconnects the observer after resolving, so later mutations are not watched', async () => {
    const disconnect = vi.fn();
    const observe = vi.fn();
    const RealObserver = globalThis.MutationObserver;

    class SpyObserver extends RealObserver {
      constructor(cb: MutationCallback) {
        super(cb);
      }
      observe(...args: Parameters<MutationObserver['observe']>) {
        observe(...args);
        return super.observe(...args);
      }
      disconnect() {
        disconnect();
        return super.disconnect();
      }
    }
    vi.stubGlobal('MutationObserver', SpyObserver);

    const pending = waitForElement('#watch-me', 5000);
    expect(observe).toHaveBeenCalledTimes(1);
    // Must watch the whole subtree of body, or nested mounts are missed.
    expect(observe.mock.calls[0][1]).toMatchObject({ childList: true, subtree: true });

    const el = document.createElement('div');
    el.id = 'watch-me';
    document.body.appendChild(el);
    await pending;

    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('resolves null when document is undefined (server render)', async () => {
    vi.stubGlobal('document', undefined);

    await expect(waitForElement('#anything')).resolves.toBeNull();
  });
});
