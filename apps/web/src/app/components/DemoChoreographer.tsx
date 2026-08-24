'use client';

import { useEffect, useRef } from 'react';
import { onDemoAction, waitForElement, DemoAction } from '../../lib/demoEvents';
import { BANNER_HEIGHT, easeInOut, scrollToElement } from '../../lib/demoScroll';

/**
 * Handles the generic DOM half of demo mode.
 *
 * Page-local actions (FILL_*, RUN_CHECKS, SUBMIT, ...) are owned by the page
 * that holds the state — currently only /apply. Everything that is pure DOM
 * choreography lives here instead, so a new page can be added to the demo
 * script with no per-page listener code.
 *
 * Mounted once in the root layout beside <DemoMode />.
 */

// BANNER_HEIGHT, easeInOut and scrollToElement live in lib/demoScroll so that
// /apply — which owns its own form state and therefore scrolls itself — lands
// targets with exactly the same geometry as the choreographed pages.

export default function DemoChoreographer() {
  // A slow scroll runs for seconds, so a new action (or leaving the page) has to
  // be able to cancel the one in flight — otherwise two scrolls fight and the
  // page appears to stutter.
  const scrollRaf = useRef<number | null>(null);
  const highlightTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const cancelScroll = () => {
      if (scrollRaf.current !== null) {
        cancelAnimationFrame(scrollRaf.current);
        scrollRaf.current = null;
      }
    };

    /**
     * Scroll steadily from the top of the page to the bottom over durationMs.
     *
     * Used for the "walk the audience down the whole page" beats (Statistics,
     * Security, Carbon Tracker). scrollTo({behavior:'smooth'}) can't do this —
     * its duration is fixed by the browser — so the position is driven frame by
     * frame instead.
     */
    const slowScroll = (durationMs: number, selector?: string) => {
      cancelScroll();

      const container = selector ? document.querySelector(selector) : null;
      const startY = window.scrollY;

      const maxScroll = () =>
        (container
          ? container.getBoundingClientRect().bottom + window.scrollY
          : document.documentElement.scrollHeight) -
        window.innerHeight +
        BANNER_HEIGHT;

      const endY = Math.max(0, maxScroll());
      // Nothing to scroll (short page) — don't animate a no-op.
      if (Math.abs(endY - startY) < 8) return;

      const startTime = performance.now();

      const frame = (now: number) => {
        const t = Math.min(1, (now - startTime) / durationMs);
        window.scrollTo(0, startY + (endY - startY) * easeInOut(t));

        if (t < 1) {
          scrollRaf.current = requestAnimationFrame(frame);
        } else {
          scrollRaf.current = null;
        }
      };

      scrollRaf.current = requestAnimationFrame(frame);
    };

    /** Ring outline so the audience's eye is drawn to what is being discussed. */
    const highlight = (el: Element, durationMs: number) => {
      const target = el as HTMLElement;
      const previousOutline = target.style.outline;
      const previousOffset = target.style.outlineOffset;
      const previousTransition = target.style.transition;

      target.style.transition = 'outline-color 200ms ease';
      target.style.outline = '3px solid rgb(147 51 234)'; // purple-600, matches the demo banner
      target.style.outlineOffset = '3px';

      const timer = setTimeout(() => {
        target.style.outline = previousOutline;
        target.style.outlineOffset = previousOffset;
        target.style.transition = previousTransition;
      }, durationMs);

      highlightTimers.current.push(timer);
    };

    const cleanup = onDemoAction((action: DemoAction) => {
      switch (action.type) {
        case 'SCROLL_TO':
          // Await the element: the demo player pushes a route and fires the
          // step's actions on a timer, so this can land before React has
          // committed the new page.
          waitForElement(action.selector).then(el => {
            if (el) scrollToElement(el, action.block ?? 'center');
          });
          break;

        case 'SLOW_SCROLL':
          if (action.selector) {
            waitForElement(action.selector).then(el => {
              if (el) slowScroll(action.durationMs, action.selector);
            });
          } else {
            slowScroll(action.durationMs);
          }
          break;

        case 'CLICK':
          waitForElement(action.selector).then(el => {
            if (!el) return;
            // Scroll first so the audience sees *what* is being clicked, then
            // click once the smooth scroll has had time to land.
            scrollToElement(el, 'center');
            const timer = setTimeout(() => (el as HTMLElement).click?.(), 400);
            highlightTimers.current.push(timer);
          });
          break;

        case 'HIGHLIGHT':
          waitForElement(action.selector).then(el => {
            if (!el) return;
            scrollToElement(el, 'center');
            highlight(el, action.durationMs ?? 2000);
          });
          break;

        case 'APPROVE_CASE':
          // Case detail owns the approve modal; drive it through the UI rather
          // than reaching into its state, so the audience sees the real flow.
          waitForElement('[data-demo="approve-case"]').then(el => {
            if (!el) return;
            scrollToElement(el, 'center');
            const openTimer = setTimeout(() => {
              (el as HTMLElement).click?.();
              // Confirm in the modal that the click just opened.
              waitForElement('[data-demo="approve-confirm"]').then(confirm => {
                const confirmTimer = setTimeout(
                  () => (confirm as HTMLElement | null)?.click?.(),
                  900
                );
                highlightTimers.current.push(confirmTimer);
              });
            }, 400);
            highlightTimers.current.push(openTimer);
          });
          break;

        // Page-local actions are handled by the page that owns the state.
        default:
          break;
      }
    });

    return () => {
      cleanup();
      cancelScroll();
      highlightTimers.current.forEach(clearTimeout);
      highlightTimers.current = [];
    };
  }, []);

  return null;
}
