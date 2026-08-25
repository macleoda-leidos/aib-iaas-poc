// Demo mode communicates with pages via custom events.
//
// Two families of action:
//  - Page-local actions (FILL_*, RUN_CHECKS, SUBMIT, ...) are handled by a
//    listener inside the page that owns the state — currently /apply and /login.
//  - Generic DOM actions (SCROLL_TO, SLOW_SCROLL, CLICK, HIGHLIGHT) are handled
//    centrally by DemoChoreographer, so any page can be driven from a step
//    definition with no per-page listener code.
export type DemoAction =
  | { type: 'FILL_PERSONAL'; data: any }
  | { type: 'NEXT_STEP' }
  | { type: 'FILL_ADDRESS'; data: any }
  | { type: 'FILL_DEBTS'; data: any }
  | { type: 'FILL_INCOME'; data: any }
  | { type: 'FILL_EXPENDITURE'; data: any }
  | { type: 'FILL_ASSETS'; data: any }
  | { type: 'FILL_MFA_CODE'; code: string }
  | { type: 'RUN_CHECKS' }
  | { type: 'SUBMIT' }
  | { type: 'APPROVE_CASE' }
  | { type: 'UPLOAD_DOCUMENT'; data: { filename: string; size: number } }
  | { type: 'CLICK_RECOMMEND' }
  | { type: 'DOWNLOAD_PDF' }
  | { type: 'SELECT_PAYMENT'; method: string }
  | { type: 'CONFIRM_PAYMENT' }
  // Generic DOM choreography — handled by DemoChoreographer
  | { type: 'SCROLL_TO'; selector: string; block?: ScrollLogicalPosition }
  | { type: 'SLOW_SCROLL'; durationMs: number; selector?: string }
  | { type: 'CLICK'; selector: string }
  | { type: 'HIGHLIGHT'; selector: string; durationMs?: number };

export const DEMO_EVENT = 'iaas-demo-action';

export function dispatchDemoAction(action: DemoAction) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DEMO_EVENT, { detail: action }));
  }
}

export function onDemoAction(callback: (action: DemoAction) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => callback((e as CustomEvent).detail);
  window.addEventListener(DEMO_EVENT, handler);
  return () => window.removeEventListener(DEMO_EVENT, handler);
}

/**
 * Resolve a selector to an element, waiting for it to be mounted if necessary.
 *
 * The demo player pushes a route and fires that step's actions on a timer, so an
 * action can easily fire before React has committed the new page. Polling with a
 * fixed delay is what the original /apply implementation did (a flat 350ms) and
 * it is both too slow for fast machines and too fast for slow ones. A
 * MutationObserver waits exactly as long as needed and no longer.
 *
 * Resolves null on timeout rather than throwing — a missing selector should
 * degrade to "that beat did nothing", never break the rest of the run.
 */
export function waitForElement(
  selector: string,
  timeoutMs = 2500
): Promise<Element | null> {
  if (typeof document === 'undefined') return Promise.resolve(null);

  const existing = document.querySelector(selector);
  if (existing) return Promise.resolve(existing);

  return new Promise(resolve => {
    let settled = false;
    const finish = (el: Element | null) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      resolve(el);
    };

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) finish(el);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timer = setTimeout(() => finish(null), timeoutMs);
  });
}
