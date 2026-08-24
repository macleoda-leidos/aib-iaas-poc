// Scroll geometry shared between the two halves of demo mode.
//
// DemoChoreographer owns the generic DOM actions; /apply owns its own form
// state and scrolls itself. Both need to land a target in the *visible* part of
// the viewport, and both were getting it wrong independently — /apply had its
// own copy that ignored the narration banner entirely. Sharing the geometry is
// what keeps "scroll to the field being filled" meaning the same thing on every
// page.

// The narration panel is fixed to the bottom of the viewport, so the bottom
// ~96px of the window is not really visible. Every scroll target is offset by
// this much, otherwise a scrolled-to element lands underneath the banner and the
// audience sees nothing happen.
export const BANNER_HEIGHT = 96;

/** Ease-in-out so a long scroll starts and ends gently rather than jerking. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Scroll an element into view, keeping it clear of the narration banner. */
export function scrollToElement(el: Element, block: ScrollLogicalPosition = 'center') {
  const rect = el.getBoundingClientRect();
  const visibleHeight = window.innerHeight - BANNER_HEIGHT;

  // 'center' centres within the *visible* area rather than the whole window.
  const targetOffset =
    block === 'start' ? 24 : Math.max(24, (visibleHeight - rect.height) / 2);

  window.scrollTo({
    top: Math.max(0, window.scrollY + rect.top - targetOffset),
    behavior: 'smooth',
  });
}
