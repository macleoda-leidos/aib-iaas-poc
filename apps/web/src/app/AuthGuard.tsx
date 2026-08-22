'use client';

import { useEffect, useState } from 'react';
import { getAuthToken } from '../lib/apiClient';
import Link from 'next/link';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
}

interface StoredUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasRole, setHasRole] = useState<boolean>(true);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    // Check for token in memory or localStorage
    const memToken = getAuthToken();
    const storedToken = localStorage.getItem('iaas-auth-token');
    const token = memToken || storedToken;

    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    setIsAuthenticated(true);

    // Check role if required
    if (requiredRole) {
      const userStr = localStorage.getItem('iaas-current-user') || sessionStorage.getItem('iaas-current-user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr) as StoredUser;
          setUser(userData);
          const userRole = (userData.role || '').toLowerCase();
          const required = requiredRole.toLowerCase();

          // Role matching logic
          const isStaff = userRole.includes('admin') || userRole.includes('officer') || userRole.includes('system_admin') || userRole.includes('aib');
          const isAdviser = userRole.includes('adviser') || userRole.includes('advisor');

          if (required === 'staff' && !isStaff) {
            setHasRole(false);
          } else if (required === 'adviser' && !isAdviser && !isStaff) {
            setHasRole(false);
          } else if (required !== 'staff' && required !== 'adviser' && !userRole.includes(required)) {
            setHasRole(false);
          }
        } catch {
          setHasRole(false);
        }
      } else {
        // No user info available to check role
        setHasRole(false);
      }
    }
  }, [requiredRole]);

  // Still loading
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 shadow-sm">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">&#128274;</span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please log in to access this page.</p>
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white font-bold py-2.5 px-6 rounded hover:bg-blue-700 transition-colors no-underline"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated but wrong role
  if (!hasRole) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 shadow-sm">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">&#9888;</span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need <strong>{requiredRole}</strong> access to view this page.
            Please log in with a staff account.
          </p>
          {user && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              Current role: <span className="font-medium">{user.role}</span>
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <Link href="/login" className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition-colors no-underline text-sm">
              Switch Account
            </Link>
            <Link href="/dashboard" className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded hover:bg-gray-300 transition-colors no-underline text-sm">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // All checks passed
  return <>{children}</>;
}
