'use client';

import { useState } from 'react';
import { setAuthToken } from '../../lib/apiClient';
import { navigateTo } from '../../lib/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://iaas-api.onrender.com';

const DEMO_ACCOUNTS = [
  { email: 'admin@aib-poc.example.com', role: 'System Admin', description: 'Full system access' },
  { email: 'demo@example.com', role: 'Case Officer', description: 'Case management & review' },
  { email: 'adviser@cas.example.org', role: 'Money Adviser', description: 'Client applications & advice' },
  { email: 'john.testerton@example.com', role: 'Debtor', description: 'Applicant self-service' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      // Store token
      const token = data.data?.token || data.token;
      if (token) {
        setAuthToken(token);
        localStorage.setItem('iaas-auth-token', token);
      }

      // Store user info
      const user = data.data?.user || data.user;
      if (user) {
        localStorage.setItem('iaas-current-user', JSON.stringify(user));
        sessionStorage.setItem('iaas-current-user', JSON.stringify(user));
      }

      setSuccess(true);
      setTimeout(() => {
        navigateTo('/dashboard');
      }, 1000);
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border dark:border-gray-700">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">AiB IAAS Portal</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Initial Application Advice Service</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-750 border-b dark:border-gray-700 px-6 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">Authentication</span>
            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded font-bold">Live API</span>
          </div>

          <div className="p-6">
            <h1 className="text-xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">Sign in to AiB Services</h1>

            {success ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">&#10003;</span>
                </div>
                <p className="font-bold text-green-800 dark:text-green-300 text-lg">Login Successful</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Redirecting to dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleLogin}>
                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-300">
                    {error}
                  </div>
                )}

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Password */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-4"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Signing in...
                    </span>
                  ) : 'Sign In'}
                </button>
              </form>
            )}

            {/* Demo Accounts */}
            {!success && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                  <span className="text-xs text-gray-400">Demo Accounts</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                </div>

                <div className="space-y-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => fillDemoAccount(acc.email)}
                      className="w-full flex items-center justify-between p-2.5 border border-gray-200 dark:border-gray-600 rounded hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{acc.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{acc.description}</p>
                      </div>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-bold flex-shrink-0">
                        {acc.role}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 text-center mt-3">All demo passwords: <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">demo</code></p>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-750 border-t dark:border-gray-700 px-6 py-3 text-center">
            <p className="text-xs text-gray-400">
              POC Authentication — connects to live API at iaas-api.onrender.com
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
