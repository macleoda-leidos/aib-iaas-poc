'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { navigateTo } from '../../lib/navigation';

const NOTIFICATION_CHANNELS = [
  { id: 'email', label: 'Email', description: 'Receive notifications to your registered email address' },
  { id: 'sms', label: 'SMS', description: 'Text message alerts to your mobile number' },
  { id: 'in_app', label: 'In-App', description: 'Notifications shown when you log in to IAAS' },
];

// Role-specific notification types
const NOTIFICATION_TYPES_BY_ROLE: Record<string, Array<{ id: string; label: string; description: string; defaultOn: boolean }>> = {
  // Debtors - care about their own case progress
  debtor: [
    { id: 'application_status', label: 'Application Status Changes', description: 'When your application moves to a new stage (submitted, under review, approved, etc.)', defaultOn: true },
    { id: 'document_requests', label: 'Document Requests', description: 'When additional documents or information are requested', defaultOn: true },
    { id: 'credit_check', label: 'Credit Check Results', description: 'When your credit check has been completed', defaultOn: true },
    { id: 'recommendation', label: 'Product Recommendation', description: 'When a debt solution recommendation is issued for your case', defaultOn: true },
    { id: 'adviser_assigned', label: 'Money Adviser Assignment', description: 'When a money adviser is assigned to your case', defaultOn: true },
    { id: 'case_updates', label: 'General Case Updates', description: 'Any other updates or notes added to your case', defaultOn: false },
    { id: 'weekly_digest', label: 'Weekly Summary', description: 'A weekly summary of activity on your case', defaultOn: false },
  ],
  // AiB Staff (admin, senior officer, case officer) - care about workload and system health
  staff: [
    { id: 'new_applications', label: 'New Applications Received', description: 'When new applications are submitted and enter the queue', defaultOn: true },
    { id: 'sla_warnings', label: 'SLA Breach Warnings', description: 'When cases are approaching or have breached processing targets', defaultOn: true },
    { id: 'assignments', label: 'Case Assignments', description: 'When cases are assigned to you or your team', defaultOn: true },
    { id: 'staff_actions', label: 'Staff Actions on Your Cases', description: 'When other staff take actions (approve, reject, add notes) on your assigned cases', defaultOn: true },
    { id: 'system_health', label: 'System Integration Alerts', description: 'When BASYS, eDEN, DAS or other integrations have issues', defaultOn: true },
    { id: 'weekly_report', label: 'Weekly Performance Report', description: 'Automated weekly KPI summary emailed every Monday', defaultOn: true },
    { id: 'security_alerts', label: 'Security Incidents', description: 'Critical security events requiring attention', defaultOn: true },
    { id: 'policy_changes', label: 'Policy & Regulation Updates', description: 'Changes to Scottish debt solution legislation or AiB procedures', defaultOn: false },
    { id: 'system_maintenance', label: 'Planned Maintenance', description: 'Scheduled downtime or deployment notifications', defaultOn: false },
  ],
  // Money Advisers - care about their clients
  money_adviser: [
    { id: 'client_applications', label: 'Client Application Updates', description: 'When applications you submitted change status', defaultOn: true },
    { id: 'new_referrals', label: 'New Client Referrals', description: 'When new clients are referred to you by AiB', defaultOn: true },
    { id: 'document_uploads', label: 'Client Document Uploads', description: 'When your clients upload documents to their applications', defaultOn: true },
    { id: 'decisions', label: 'Application Decisions', description: 'When decisions are made on your clients\' applications', defaultOn: true },
    { id: 'sla_reminders', label: 'Action Reminders', description: 'Reminders when client cases need your attention', defaultOn: true },
    { id: 'policy_changes', label: 'Policy Updates', description: 'Changes to debt solution policies affecting your clients', defaultOn: false },
    { id: 'weekly_digest', label: 'Weekly Client Summary', description: 'Summary of all client case activity this week', defaultOn: true },
  ],
  // CyberOps - care about security
  cyber_ops: [
    { id: 'critical_alerts', label: 'Critical Security Alerts', description: 'Immediate notification of critical threats or breaches', defaultOn: true },
    { id: 'incident_updates', label: 'Incident Status Changes', description: 'When security incidents are updated, escalated, or resolved', defaultOn: true },
    { id: 'vuln_scans', label: 'Vulnerability Scan Results', description: 'When Tenable scans complete with new findings', defaultOn: true },
    { id: 'endpoint_alerts', label: 'Endpoint Protection Alerts', description: 'Sophos malware detections, quarantine events', defaultOn: true },
    { id: 'access_anomalies', label: 'Access Anomalies', description: 'Failed MFA, account lockouts, unusual login patterns', defaultOn: true },
    { id: 'waf_blocks', label: 'WAF Attack Blocks', description: 'SQL injection, XSS, and other attack attempts blocked', defaultOn: false },
    { id: 'compliance_reports', label: 'Compliance Reports', description: 'Weekly security posture and compliance summaries', defaultOn: true },
  ],
  // Statistician - care about data and reports
  statistician: [
    { id: 'report_ready', label: 'Scheduled Reports Ready', description: 'When weekly/monthly/quarterly reports are generated', defaultOn: true },
    { id: 'data_anomalies', label: 'Data Anomalies Detected', description: 'When statistical outliers or data quality issues are found', defaultOn: true },
    { id: 'threshold_breaches', label: 'KPI Threshold Breaches', description: 'When key performance indicators fall outside targets', defaultOn: true },
    { id: 'trend_alerts', label: 'Significant Trend Changes', description: 'When application volumes or patterns shift significantly', defaultOn: false },
    { id: 'data_exports', label: 'Data Export Completions', description: 'When large data extracts or exports are ready for download', defaultOn: true },
    { id: 'system_maintenance', label: 'Reporting System Maintenance', description: 'Planned downtime affecting reporting databases', defaultOn: true },
  ],
  // Creditors - care about their cases and dividends
  creditor: [
    { id: 'case_involvement', label: 'New Case Involvement', description: 'When you are listed as a creditor in a new application', defaultOn: true },
    { id: 'dividend_notifications', label: 'Dividend Payments', description: 'When dividend payments are scheduled or made', defaultOn: true },
    { id: 'voting_required', label: 'Voting Required', description: 'When trust deed proposals require your vote', defaultOn: true },
    { id: 'claim_updates', label: 'Claim Status Updates', description: 'When your filed claims are adjudicated or updated', defaultOn: true },
    { id: 'annual_statements', label: 'Annual Statements', description: 'When annual case statements are available', defaultOn: true },
    { id: 'case_closures', label: 'Case Closures', description: 'When cases involving your organisation are discharged or closed', defaultOn: false },
  ],
  // Trustees/Suppliers - care about case management
  supplier: [
    { id: 'new_assignments', label: 'New Case Assignments', description: 'When new cases are assigned to you as trustee', defaultOn: true },
    { id: 'distribution_due', label: 'Distributions Due', description: 'When creditor distributions are scheduled', defaultOn: true },
    { id: 'report_deadlines', label: 'Report Deadlines', description: 'Reminders for annual reports and regulatory filings', defaultOn: true },
    { id: 'case_milestones', label: 'Case Milestones', description: 'Discharge dates, review periods, key deadlines', defaultOn: true },
    { id: 'regulatory_updates', label: 'Regulatory Updates', description: 'AiB regulatory changes affecting trustees', defaultOn: false },
    { id: 'weekly_digest', label: 'Weekly Case Summary', description: 'Summary of all case activity under your management', defaultOn: true },
  ],
};

function getNotificationTypesForRole(role: string): typeof NOTIFICATION_TYPES_BY_ROLE['debtor'] {
  if (role === 'Debtor') return NOTIFICATION_TYPES_BY_ROLE.debtor;
  if (role === 'Money Adviser') return NOTIFICATION_TYPES_BY_ROLE.money_adviser;
  if (role === 'CyberOps Analyst') return NOTIFICATION_TYPES_BY_ROLE.cyber_ops;
  if (role === 'AiB Statistician') return NOTIFICATION_TYPES_BY_ROLE.statistician;
  if (role === 'Creditor') return NOTIFICATION_TYPES_BY_ROLE.creditor;
  if (role === 'Trustee' || role === 'Supplier/Trustee') return NOTIFICATION_TYPES_BY_ROLE.supplier;
  // Default: staff (admin, senior officer, case officer)
  return NOTIFICATION_TYPES_BY_ROLE.staff;
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [channels, setChannels] = useState<Record<string, boolean>>({ email: true, sms: false, in_app: true });
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('iaas-current-user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        // Initialize subscriptions from role-specific defaults
        const types = getNotificationTypesForRole(parsed.role);
        const defaults: Record<string, boolean> = {};
        types.forEach(t => { defaults[t.id] = t.defaultOn; });
        setSubscriptions(defaults);
      } catch { /* ignore */ }
    }
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
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose which events you want to be notified about. These are tailored to your role as <strong>{user.role}</strong>.</p>
        <div className="space-y-2">
          {getNotificationTypesForRole(user.role).map(type => (
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
