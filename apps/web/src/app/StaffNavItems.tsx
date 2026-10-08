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
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('iaas-current-user') || sessionStorage.getItem('iaas-current-user');
      setRole(raw ? String(JSON.parse(raw).role || '') : null);
    } catch {
      setRole(null);
    }
  }, [pathname]);

  if (!role || !isAibStaff(role)) return null;

  return (
    <>
      <li><Link href="/statistics" className={linkClass}>Statistics</Link></li>
      <li><Link href="/security" className={linkClass}>Security</Link></li>
      <li><Link href="/admin" className={linkClass}>Admin</Link></li>
    </>
  );
}
