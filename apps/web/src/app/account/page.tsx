'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { navigateTo } from '../../lib/navigation';

const NOTIFICATION_CHANNELS = [
  { id: 'email', label: 'Email', description: 'Receive notifications to your registered email address' },
  { id: 'sms', label: 'SMS', description: 'Text message alerts to your mobile number' },
  { id: 'in_app', label: 'In-App', description: 'Notifications shown when you log in to IAAS' },
];

const NOTIFICATION_TYPES = [
  { id: 'application_status', label: 'Application Status Changes', description: 'When your application moves to a new stage (submitted, under review, approved, etc.)', defaultOn: true },
  { id: 'document_requests', label: 'Document Requests', description: 'When additional documents or information are requested by AiB staff', defaultOn: true },
  { id: 'credit_check', label: 'Credit Check Results', description: 'When your credit check has been completed', defaultOn: true },
  { id: 'recommendation', label: 'Product Recommendation', description: 'When a debt solution recommendation is issued for your case', defaultOn: true },
  { id: 'adviser_assigned', label: 'Money Adviser Assignment', description: 'When a money adviser is assigned to your case', defaultOn: true },
  { id: 'case_updates', label: 'General Case Updates', description: 'Any other updates or notes added to your case', defaultOn: false },
  { id: 'system_maintenance', label: 'System Maintenance', description: 'Planned downtime or maintenance windows affecting IAAS', defaultOn: false },
  { id: 'policy_changes', label: 'Policy & Regulation Changes', description: 'Changes to Scottish debt solution policies that may affect you', defaultOn: false },
  { id: 'weekly_digest', label: 'Weekly Digest', description: 'A weekly summary of all activity on your case(s)', defaultOn: false },
];

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [channels, setChannels] = useState<Record<string, boolean>>({ email: true, sms: false, in_app: true });
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('iaas-current-user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    // Initialize subscriptions from defaults
    const defaults: Record<string, boolean> = {};
    NOTIFICATION_TYPES.forEach(t => { defaults[t.id] = t.defaultOn; });
    setSubscriptions(defaults);
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSignOut = () => {
    sessionStorage.removeItem('iaas-current-user');
    navigateTo('/login');
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Account</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">You are not signed in.</p>
        <Link href="/login" className="bg-[#d32205] text-white font-bold py-3 px-6 rounded hover:bg-red-800 no-underline">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">My Account</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Manage your profile and notification preferences.</p>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#d32205] flex items-center justify-center text-white text-xl font-bold">
            {user.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.role}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <button onClick={handleSignOut} className="ml-auto text-sm text-red-600 hover:underline">
            Sign Out
          </button>
        </div>
      </div>

      {/* Notification Channels */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">📬 Notification Channels</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose how you'd like to receive notifications about your IAAS applications.</p>
        <div className="space-y-3">
          {NOTIFICATION_CHANNELS.map(ch => (
            <label key={ch.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650">
              <div>
                <p className="font-bold text-sm">{ch.label}</p>
                <p className="text-xs text-gray-500">{ch.description}</p>
              </div>
              <div className="relative">
                <input type="checkbox" checked={channels[ch.id] || false}
                  onChange={e => setChannels(prev => ({ ...prev, [ch.id]: e.target.checked }))}
                  className="sr-only peer" />
                <div className="w-10 h-6 bg-gray-300 peer-checked:bg-green-600 rounded-full transition-colors"></div>
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform"></div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Notification Subscriptions */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">🔔 Notification Subscriptions</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose which events you want to be notified about. You can change these at any time.</p>
        <div className="space-y-2">
          {NOTIFICATION_TYPES.map(type => (
            <label key={type.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650">
              <input type="checkbox" checked={subscriptions[type.id] || false}
                onChange={e => setSubscriptions(prev => ({ ...prev, [type.id]: e.target.checked }))}
                className="mt-0.5 w-5 h-5 rounded border-gray-300" />
              <div>
                <p className="font-bold text-sm">{type.label}</p>
                <p className="text-xs text-gray-500">{type.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} className="bg-green-700 text-white font-bold py-3 px-8 rounded hover:bg-green-800">
          {saved ? '✓ Preferences Saved!' : 'Save Preferences'}
        </button>
        {saved && <span className="text-sm text-green-700 font-medium">Your notification preferences have been updated.</span>}
      </div>

      {/* Security Section */}
      <div className="mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">🔒 Security</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div><p className="font-bold">Multi-Factor Authentication</p><p className="text-xs text-gray-500">TOTP Authenticator enabled</p></div>
            <span className="text-green-600 font-bold text-xs">Active ✓</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div><p className="font-bold">Last Login</p><p className="text-xs text-gray-500">Today via ScotAccount (LOA2)</p></div>
            <span className="text-xs text-gray-500">Edinburgh, UK</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div><p className="font-bold">Active Sessions</p><p className="text-xs text-gray-500">1 active session</p></div>
            <button className="text-xs text-red-600 hover:underline">Revoke all</button>
          </div>
        </div>
      </div>
    </div>
  );
}
