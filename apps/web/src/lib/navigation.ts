/**
 * Navigation helper for basePath-aware programmatic navigation.
 * When deployed to GitHub Pages, all routes need /aib-iaas-poc prefix.
 * Next.js <Link> handles this automatically, but window.location does not.
 *
 * NEXT_PUBLIC_ env vars are inlined at build time by Next.js.
 */

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function navigateTo(path: string) {
  window.location.href = `${BASE_PATH}${path}`;
}

/** Returns the full href for an internal path */
export function internalHref(path: string): string {
  return `${BASE_PATH}${path}`;
}
