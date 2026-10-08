'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * The Statistics / Security / Admin main-menu items are internal AiB tools, so
 * they are shown only to signed-in AiB users — never to creditors, money
 * advisers, debtors or suppliers (or anonymous visitors). The role comes from the
 * session stored at login (iaas-current-user); re-read on navigation so the menu
 * updates after the post-login redirect without a full reload.
 */
function isAibStaff(role: string): boolean {
  const r = role.toLowerCase();
  return r === 'system_admin' || r.startsWith('aib') || r === 'statistician' || r === 'cyberops_analyst';
}

const linkClass =
  'block px-3 py-2.5 text-white/90 hover:text-white hover:bg-white/10 no-underline whitespace-nowrap text-sm transition-colors';

export function StaffNavItems() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      // Show during the scripted demo too, so the AiB tour has the menu items
      // visible (matches the RequireAibStaff route-guard bypass).
      if (localStorage.getItem('iaas-demo-active') === '1') { setShow(true); return; }
      const raw = localStorage.getItem('iaas-current-user') || sessionStorage.getItem('iaas-current-user');
      const role = raw ? String(JSON.parse(raw).role || '') : '';
      setShow(isAibStaff(role));
    } catch {
      setShow(false);
    }
  }, [pathname]);

  if (!show) return null;

  return (
    <>
      <li><Link href="/statistics" className={linkClass}>Statistics</Link></li>
      <li><Link href="/security" className={linkClass}>Security</Link></li>
      <li><Link href="/admin" className={linkClass}>Admin</Link></li>
    </>
  );
}

/**
 * The "Portal" menu item points at the portal appropriate to the signed-in role:
 * a creditor goes to the creditor portal, a money adviser to the adviser
 * workspace, and everyone else to the generic role-aware /portal shell.
 */
export function PortalNavItem() {
  const pathname = usePathname();
  const [href, setHref] = useState('/portal');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('iaas-current-user') || sessionStorage.getItem('iaas-current-user');
      const role = raw ? String(JSON.parse(raw).role || '').toLowerCase() : '';
      setHref(role === 'creditor' ? '/creditor-portal' : role === 'money_adviser' ? '/adviser-workspace' : '/portal');
    } catch {
      setHref('/portal');
    }
  }, [pathname]);

  return <li><Link href={href} className={linkClass}>Portal</Link></li>;
}
