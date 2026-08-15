/**
 * Navigation helper for basePath-aware programmatic navigation.
 * When deployed to GitHub Pages, all routes need /aib-iaas-poc prefix.
 * Next.js <Link> handles this automatically, but window.location does not.
 */
export function navigateTo(path: string) {
  // Next.js stores basePath in __NEXT_DATA__ at runtime
  const basePath = (typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.basePath) || '';
  window.location.href = `${basePath}${path}`;
}
