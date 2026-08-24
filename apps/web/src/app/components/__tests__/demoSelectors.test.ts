import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guards the demo against its most common and most invisible failure: a step
 * pointing at a `data-demo` hook that no longer exists in the markup.
 *
 * waitForElement resolves null on timeout rather than throwing, precisely so a
 * missing selector degrades to "that beat did nothing" instead of crashing a
 * live client demo. The trade-off is that nothing tells you it broke — a
 * restructured page silently drops a scroll, a highlight or a click. This test
 * is the thing that tells you.
 *
 * It works on source text rather than by rendering, because the hooks are spread
 * across ~15 pages that each need their own data, auth and API state to mount.
 * Rendering all of them to check for an attribute would cost far more than it
 * catches.
 */

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

const files = sourceFiles(SRC).map(path => ({
  path: relative(SRC, path),
  text: readFileSync(path, 'utf8'),
}));

// A hook reaches the DOM three ways, and all three have to be recognised or a
// live hook reads as dead.
//
// `data-demo="foo"` — written directly on the element. The lookbehind matters:
// without it this also matches inside `[data-demo="foo"]`, so every reference
// would register as its own definition and the test would pass unconditionally.
const HOOK = /(?<!\[)data-demo="([^"${]+)"/g;
// `demo="foo"` — forwarded as a prop by a wrapper that renders data-demo={demo},
// which is how the shared Input on /apply carries its hook. Excluding `-` and
// word characters before `demo` is what keeps this from re-matching data-demo.
const HOOK_PROP = /(?<![-\w])demo="([^"${]+)"/g;
// data-demo={`foo-${x}`} — one hook per row of data (mailroom tabs, MI periods,
// report tiles). Only the static prefix is knowable from source.
const HOOK_PREFIX = /data-demo=\{`([^`$]*)\$\{/g;

// `[data-demo="foo"]` in a step or an action — a reference to a hook.
const REFERENCE = /\[data-demo="([^"\]]+)"\]/g;

function matchAll(text: string, re: RegExp): string[] {
  return [...text.matchAll(new RegExp(re))].map(m => m[1]);
}

const defined = new Set(
  files.flatMap(f => [...matchAll(f.text, HOOK), ...matchAll(f.text, HOOK_PROP)])
);
const definedPrefixes = files.flatMap(f => matchAll(f.text, HOOK_PREFIX));

const referenced = files.flatMap(f =>
  matchAll(f.text, REFERENCE).map(selector => ({ selector, from: f.path }))
);

/**
 * Does this selector correspond to a hook in the markup?
 *
 * Generated hooks can only be checked as far as their prefix — the suffix comes
 * from data this test does not evaluate. So `mailroom-tab-typo` would pass while
 * `mailroom-tab-*` exists at all. That still catches the failure mode worth
 * catching: markup restructured so the hook is gone entirely.
 */
function resolves(selector: string): boolean {
  if (defined.has(selector)) return true;
  return definedPrefixes.some(p => p.length > 0 && selector.startsWith(p) && selector !== p);
}

describe('demo selectors', () => {
  it('finds hooks and references to check', () => {
    // A regex that silently stopped matching would make every assertion below
    // vacuously true, so pin a floor on both sides.
    expect(defined.size).toBeGreaterThan(20);
    expect(referenced.length).toBeGreaterThan(20);
  });

  it.each(referenced.filter(r => !r.selector.includes('${')))(
    'resolves [data-demo="$selector"] referenced from $from',
    ({ selector }) => {
      expect(resolves(selector)).toBe(true);
    }
  );

  // A few references are themselves built at runtime — FILL_ASSETS scrolls to
  // `asset-category-${category}`. The full selector cannot be compared, so
  // assert its static prefix still matches a hook rather than skipping it.
  it.each(referenced.filter(r => r.selector.includes('${')))(
    'resolves the static prefix of [data-demo="$selector"] from $from',
    ({ selector }) => {
      const prefix = selector.slice(0, selector.indexOf('${'));
      expect(prefix.length).toBeGreaterThan(0);
      expect([...defined].some(d => d.startsWith(prefix))).toBe(true);
    }
  );
});

describe('demo script', () => {
  const demoMode = files.find(f => f.path.endsWith(join('components', 'DemoMode.tsx')));

  it('is present', () => {
    expect(demoMode).toBeDefined();
  });

  it('leaves every action room to run before its step ends', () => {
    // A step whose last action fires after its own duration is a beat the
    // audience never sees. Duration is seconds, delays are milliseconds.
    const steps = [...demoMode!.text.matchAll(/duration:\s*(\d+),([\s\S]*?)\n    \},/g)];
    expect(steps.length).toBeGreaterThan(20);

    const tooTight = steps
      .map(([, duration, body]) => {
        const delays = matchAll(body, /delay:\s*(\d+)/g).map(Number);
        const title = body.match(/title:\s*['"`](.+?)['"`]/)?.[1] ?? '(untitled)';
        return { title, duration: Number(duration) * 1000, last: Math.max(0, ...delays) };
      })
      .filter(s => s.last >= s.duration);

    expect(tooTight).toEqual([]);
  });
});
