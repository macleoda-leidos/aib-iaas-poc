'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Replaces the static "Sign In" nav link.
 * When a user is "logged in" (stored in sessionStorage after login flow),
 * shows their name linking to /account. Otherwise shows "Sign In" → /login.
 */
export function UserNavItem() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    // Check sessionStorage for logged-in user (set by login page)
    const stored = sessionStorage.getItem('iaas-current-user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  if (user) {
    return (
      <li>
        <Link href="/account" className="block px-3 py-2.5 text-white hover:bg-white/10 no-underline whitespace-nowrap text-sm transition-colors">
          👤 {user.name.split(' ')[0]}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link href="/login" className="block px-3 py-2.5 text-white/90 hover:text-white hover:bg-white/10 no-underline whitespace-nowrap text-sm transition-colors">
        Sign In
      </Link>
    </li>
  );
}
