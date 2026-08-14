'use client';

import { ReactNode } from 'react';
import { ApplicationProvider } from '../lib/ApplicationContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApplicationProvider>
      {children}
    </ApplicationProvider>
  );
}
