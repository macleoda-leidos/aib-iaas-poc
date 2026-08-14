'use client';

import { ReactNode } from 'react';
import { ApplicationProvider } from '../lib/ApplicationContext';
import { CookieBanner } from '../components/CookieBanner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApplicationProvider>
      <CookieBanner />
      {children}
    </ApplicationProvider>
  );
}
