'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ─── Demo Users (matching existing login page roles) ─────────────────────────

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'USR-ADMIN-001', name: 'Karen MacLeod', email: 'karen.macleod@aib.gov.uk', role: 'system_admin', roleLabel: 'System Admin' },
  { id: 'USR-SENIOR-001', name: 'David Henderson', email: 'david.henderson@aib.gov.uk', role: 'aib_senior_officer', roleLabel: 'Senior Officer' },
  { id: 'USR-OFFICER-001', name: 'Sarah Mitchell', email: 'sarah.mitchell@aib.gov.uk', role: 'aib_officer', roleLabel: 'Case Officer' },
  { id: 'USR-ADVISER-001', name: 'James Robertson', email: 'james.robertson@moneyadvice.org', role: 'money_adviser', roleLabel: 'Money Adviser' },
  { id: 'USR-CREDITOR-001', name: 'Margaret Wilson', email: 'margaret.wilson@bankofscotland.co.uk', role: 'creditor', roleLabel: 'Creditor' },
  { id: 'USR-SUPPLIER-001', name: 'Andrew Thomson', email: 'andrew.thomson@insolvencypractice.co.uk', role: 'supplier', roleLabel: 'Trustee/Supplier' },
  { id: 'USR-DEBTOR-001', name: 'John Testerton', email: 'john.testerton@email.com', role: 'debtor', roleLabel: 'Debtor' },
];

// ─── Context Types ───────────────────────────────────────────────────────────

interface ApplicationState {
  applicationId: string | null;
  referenceNumber: string | null;
  status: string | null;
}

interface AppContextType {
  // Current user (for role switching demo)
  currentUser: DemoUser | null;
  setCurrentUser: (user: DemoUser | null) => void;

  // Current application in progress
  application: ApplicationState;
  setApplication: (app: Partial<ApplicationState>) => void;
  clearApplication: () => void;

  // Recently submitted applications (for cross-role demo)
  recentApplicationIds: string[];
  addRecentApplication: (id: string) => void;

  // API connectivity status
  apiConnected: boolean;
  setApiConnected: (connected: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function ApplicationProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [application, setApplicationState] = useState<ApplicationState>({
    applicationId: null,
    referenceNumber: null,
    status: null,
  });
  const [recentApplicationIds, setRecentApplicationIds] = useState<string[]>([]);
  const [apiConnected, setApiConnected] = useState(false);

  const setApplication = useCallback((update: Partial<ApplicationState>) => {
    setApplicationState(prev => ({ ...prev, ...update }));
  }, []);

  const clearApplication = useCallback(() => {
    setApplicationState({ applicationId: null, referenceNumber: null, status: null });
  }, []);

  const addRecentApplication = useCallback((id: string) => {
    setRecentApplicationIds(prev => [id, ...prev.filter(x => x !== id)].slice(0, 20));
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        application,
        setApplication,
        clearApplication,
        recentApplicationIds,
        addRecentApplication,
        apiConnected,
        setApiConnected,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within ApplicationProvider');
  }
  return context;
}
