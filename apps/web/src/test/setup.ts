// Test setup for the jsdom (frontend) half of the suite.
//
// Registered via test.setupFiles in the root vitest.config.ts. vitest applies
// setupFiles to every test file, so everything here guards on the presence of a
// DOM and no-ops under the node environment used by every backend suite. That
// keeps @testing-library out of the backend runs entirely.
import { afterEach } from 'vitest';

if (typeof document !== 'undefined') {
  // Resolved at setup time, before any test body runs. Awaiting the import
  // inside afterEach instead would deadlock in tests that install fake timers:
  // the microtask never gets flushed, cleanup silently never happens, and
  // components leak from one test into the next as duplicate event listeners.
  const { cleanup } = await import('@testing-library/react');

  // Unmount anything a test rendered. Without this, RTL appends each render to
  // the same document.body and queries like getByText start matching leftovers
  // from a previous test, which shows up as spurious "found multiple elements".
  afterEach(() => {
    cleanup();
  });
}
