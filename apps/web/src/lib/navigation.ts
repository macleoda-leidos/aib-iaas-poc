/**
 * Navigation helper for basePath-aware programmatic navigation.
 * When deployed to GitHub Pages, all routes need /aib-iaas-poc prefix.
 * Next.js <Link> handles this automatically, but window.location does not.
 */

function getBasePath(): string {
  if (typeof window !== 'undefined') {
    return (window as any).__NEXT_DATA__?.basePath || '';
  }
  return '';
}

export function navigateTo(path: string) {
  window.location.href = `${getBasePath()}${path}`;
}

/** Returns the full href for an internal path (use in <a> tags where <Link> isn't available) */
export function internalHref(path: string): string {
  return `${getBasePath()}${path}`;
}
