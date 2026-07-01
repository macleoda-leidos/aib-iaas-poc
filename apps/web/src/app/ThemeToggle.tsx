'use client';

import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button onClick={toggle} className="text-white hover:bg-white/10 px-2 py-1 rounded text-xs flex items-center gap-1 min-h-[32px] min-w-[32px]" title={dark ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle dark mode">
      {dark ? '☀️' : '🌙'}
      <span className="hidden md:inline">{dark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
