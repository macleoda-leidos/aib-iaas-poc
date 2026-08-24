'use client';

import { useState, useRef } from 'react';
import { setAuthToken } from '../../lib/apiClient';
import { navigateTo } from '../../lib/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://iaas-api.onrender.com';

const DEMO_ACCOUNTS = [
  { email: 'admin@aib-poc.example.com', role: 'System Admin', description: 'Full system access' },
  { email: 'demo@example.com', role: 'Case Officer', description: 'Case management & review' },
  { email: 'adviser@cas.example.org', role: 'Money Adviser', description: 'Client applications & advice' },
  // Seeded as user-creditor-01 / role-creditor in packages/database/src/seed-data/users.json —
  // without an entry here the creditor journey could not be reached through the UI at all.
  { email: 'debt.recovery@rbs.co.uk', role: 'Creditor', description: 'Case visibility & claims' },
  { email: 'john.testerton@example.com', role: 'Debtor', description: 'Applicant self-service' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // MFA state
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const mfaRefs = useRef<(HTMLInputElement | null)[]>([]);

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

      // Store token temporarily
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

      // Move to MFA step instead of redirecting
      setLoading(false);
      setMfaStep(true);
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      setLoading(false);
    }
  };

  const handleMfaInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...mfaCode];
    newCode[index] = value.slice(-1);
    setMfaCode(newCode);
    // Auto-focus next input
    if (value && index < 5) {
      mfaRefs.current[index + 1]?.focus();
    }
  };

  const handleMfaKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !mfaCode[index] && index > 0) {
      mfaRefs.current[index - 1]?.focus();
    }
  };

  const handleMfaPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newCode = [...mfaCode];
      for (let i = 0; i < pasted.length && i < 6; i++) {
        newCode[i] = pasted[i];
      }
      setMfaCode(newCode);
      e.preventDefault();
    }
  };

  const handleMfaVerify = () => {
    const code = mfaCode.join('');
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setMfaVerifying(true);
    setError('');
    // Simulate verification delay
    setTimeout(() => {
      setMfaVerifying(false);
      setSuccess(true);
      // Store session info
      localStorage.setItem('iaas-session-start', Date.now().toString());
      if (rememberDevice) {
        localStorage.setItem('iaas-remember-device', 'true');
      }
      setTimeout(() => {
        navigateTo('/dashboard');
      }, 1000);
    }, 1200);
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
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {mfaStep ? 'Multi-Factor Authentication' : 'Authentication'}
            </span>
            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded font-bold">Live API</span>
          </div>

          <div className="p-6">
            {success ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">&#10003;</span>
                </div>
                <p className="font-bold text-green-800 dark:text-green-300 text-lg">Login Successful</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Redirecting to dashboard...</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded px-3 py-2">
                  Session expires in 8 hours
                </p>
              </div>
            ) : mfaStep ? (
              /* MFA Step */
              <div>
                <h1 className="text-xl font-bold text-center mb-2 text-gray-800 dark:text-gray-100">Two-Factor Authentication</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                  Enter the 6-digit code from your authenticator app
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-300">
                    {error}
                  </div>
                )}

                {/* 6 digit code boxes */}
                <div className="flex justify-center gap-2 mb-6" onPaste={handleMfaPaste}>
                  {mfaCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { mfaRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleMfaInput(i, e.target.value)}
                      onKeyDown={e => handleMfaKeyDown(i, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors"
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Remember device */}
                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={e => setRememberDevice(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Remember this device for 30 days</span>
                </label>

                {/* Verify button */}
                <button
                  onClick={handleMfaVerify}
                  disabled={mfaVerifying || mfaCode.join('').length !== 6}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-4"
                >
                  {mfaVerifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Verifying...
                    </span>
                  ) : 'Verify'}
                </button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Lost access to your authenticator? <a href="#" className="text-blue-600 dark:text-blue-400 underline">Use a backup code</a>
                </p>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">Sign in to AiB Services</h1>

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

                {/* Demo Accounts */}
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

          {/* Footer — Keycloak badge */}
          <div className="bg-gray-50 dark:bg-gray-750 border-t dark:border-gray-700 px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              POC Authentication — connects to live API
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-[#4d4d4d] flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">K</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Powered by Keycloak</span>
            </div>
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
