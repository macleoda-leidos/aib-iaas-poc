'use client';

import { useState } from 'react';

const DEMO_ACCOUNTS = [
  { id: 'karen', name: 'Karen MacLeod', email: 'senior.officer@aib.example.gov.scot', role: 'AiB Senior Officer', realm: 'aib-internal' },
  { id: 'james', name: 'James Wilson', email: 'officer@aib.example.gov.scot', role: 'AiB Case Officer', realm: 'aib-internal' },
  { id: 'fiona', name: 'Fiona Campbell', email: 'adviser@cas.example.org', role: 'Money Adviser', realm: 'external-advisers' },
  { id: 'sarah', name: 'Sarah Mitchell', email: 'collections@rbs.example.com', role: 'Creditor', realm: 'creditors' },
  { id: 'robert', name: 'Robert Henderson', email: 'trustee@sample-ip.example.com', role: 'Trustee', realm: 'external-advisers' },
  { id: 'john', name: 'John Testerton', email: 'john.testerton@example.com', role: 'Debtor', realm: 'public-debtors' },
];

export default function LoginPage() {
  const [selectedAccount, setSelectedAccount] = useState(DEMO_ACCOUNTS[0]);
  const [authenticating, setAuthenticating] = useState(false);
  const [sessionEstablished, setSessionEstablished] = useState(false);

  const handleLogin = () => {
    setAuthenticating(true);
    setTimeout(() => {
      setAuthenticating(false);
      setSessionEstablished(true);
      // Redirect after showing session message
      setTimeout(() => {
        window.location.href = `/portal?user=${selectedAccount.id}`;
      }, 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Keycloak Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">K</span>
            </div>
            <span className="text-sm font-bold text-gray-700">AiB Identity Service</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Powered by Keycloak • Single Sign-On</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Realm indicator */}
          <div className="bg-gray-50 border-b px-6 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Realm: <strong>{selectedAccount.realm}</strong></span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">OpenID Connect</span>
          </div>

          <div className="p-6">
            <h1 className="text-xl font-bold text-center mb-6 text-gray-800">Sign in to AiB Services</h1>

            {!authenticating && !sessionEstablished && (
              <>
                {/* Demo account selector */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Demo Account</label>
                  <select value={selectedAccount.id} onChange={e => setSelectedAccount(DEMO_ACCOUNTS.find(a => a.id === e.target.value)!)}
                    className="w-full border border-gray-300 rounded p-2.5 text-sm bg-white">
                    {DEMO_ACCOUNTS.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} — {acc.role}</option>
                    ))}
                  </select>
                </div>

                {/* Username */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Username or email</label>
                  <input type="text" value={selectedAccount.email} readOnly
                    className="w-full border border-gray-300 rounded p-2.5 text-sm bg-gray-50" />
                </div>

                {/* Password */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                  <input type="password" defaultValue="••••••••"
                    className="w-full border border-gray-300 rounded p-2.5 text-sm" />
                </div>

                {/* Sign In Button */}
                <button onClick={handleLogin}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition-colors mb-4">
                  Sign In
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-400">Or sign in with</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* Social login buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleLogin} className="flex items-center justify-center gap-2 p-2.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <span>🏴󠁧󠁢󠁳󠁣󠁴󠁿</span>
                    <span className="text-sm font-medium">ScotAccount</span>
                  </button>
                  <button onClick={handleLogin} className="flex items-center justify-center gap-2 p-2.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <span>🇬🇧</span>
                    <span className="text-sm font-medium">GOV.UK Login</span>
                  </button>
                </div>
              </>
            )}

            {/* Authenticating state */}
            {authenticating && (
              <div className="text-center py-8">
                <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="font-bold text-gray-800">Authenticating...</p>
                <p className="text-sm text-gray-500 mt-1">Verifying credentials with Keycloak</p>
              </div>
            )}

            {/* Session established */}
            {sessionEstablished && (
              <div className="py-6">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">✓</span>
                  </div>
                  <p className="font-bold text-green-800 text-lg">Authentication Successful</p>
                  <p className="text-sm text-gray-600 mt-1">Welcome, {selectedAccount.name}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                  <p className="text-sm font-bold text-blue-800 mb-2">🔗 SSO Session Established Across:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['BASYS', 'ASTRA', 'eDEN', 'CFT', 'RoI', 'IAAS'].map(sys => (
                      <div key={sys} className="flex items-center gap-1 text-xs">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="font-medium">{sys}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center">Redirecting to unified portal...</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t px-6 py-3 text-center">
            <p className="text-xs text-gray-400">
              Keycloak 24.x • OIDC • SAML 2.0 • Multi-realm federation
            </p>
          </div>
        </div>

        {/* POC Notice */}
        <p className="text-xs text-gray-400 text-center mt-4">
          POC Demonstration — This simulates the Keycloak SSO login experience.
          In production, this would be a real Keycloak instance with AD/ScotAccount federation.
        </p>
      </div>
    </div>
  );
}
