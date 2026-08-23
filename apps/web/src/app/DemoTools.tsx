'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const DemoToolsContext = createContext({ enabled: false, toggle: () => {} });

export function DemoToolsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEnabled(localStorage.getItem('iaas-demo-tools') === 'true');
    }
  }, []);
  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (typeof window !== 'undefined') localStorage.setItem('iaas-demo-tools', String(next));
  };
  return <DemoToolsContext.Provider value={{ enabled, toggle }}>{children}</DemoToolsContext.Provider>;
}

export function useDemoTools() { return useContext(DemoToolsContext); }

export function DemoToolsToggle() {
  const { enabled, toggle } = useDemoTools();
  return (
    <button onClick={toggle} className={`fixed top-20 right-4 z-40 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all print:hidden ${enabled ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 opacity-60 hover:opacity-100'}`}>
      {enabled ? '🛠 Demo Tools ON' : '🛠'}
    </button>
  );
}
