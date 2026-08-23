'use client';

import { useState } from 'react';
import Link from 'next/link';

// Demo data from CASES['IAAS-2026-00012']
const APPLICATION = {
  ref: 'IAAS-2026-00012',
  status: 'under_review',
  product: 'Debt Arrangement Scheme (DAS)',
  submittedAt: '29 Jun 2026',
  debtor: { firstName: 'Alistair', lastName: 'Morrison' },
  totalDebt: 18400,
  proposedPayment: '£320/month',
  estimatedDuration: '~48 months',
};

const STEPS = [
  { id: 'applied', label: 'Applied', complete: true },
  { id: 'review', label: 'Under Review', complete: false, current: true },
  { id: 'decision', label: 'Decision', complete: false },
  { id: 'complete', label: 'Complete', complete: false },
];

const MESSAGES = [
  {
    id: 1,
    from: 'AiB Case Team',
    date: '30 Jun 2026, 09:15',
    subject: 'Application received',
    body: 'Thank you for submitting your application. We have received all your documents and your case has been assigned for review. You will hear from us within 5 working days.',
    unread: false,
  },
  {
    id: 2,
    from: 'James Wilson (Case Officer)',
    date: '1 Jul 2026, 14:20',
    subject: 'Credit check complete',
    body: 'Your credit check has been completed successfully. Score: 620 (PASS). No further action is needed from you at this stage. We are now reviewing your income and expenditure information.',
    unread: false,
  },
  {
    id: 3,
    from: 'AiB Notification Service',
    date: '2 Jul 2026, 10:00',
    subject: 'Case update - under review',
    body: 'Your case is now being actively reviewed by a case officer. Based on your financial profile, the Debt Arrangement Scheme (DAS) has been recommended. A decision is expected within 3 working days.',
    unread: true,
  },
];

const DOCUMENTS = [
  { name: 'payslip_june_2026.pdf', category: 'Income', size: '234 KB', status: 'Verified', uploadedAt: '29 Jun' },
  { name: 'bank_statement_may.pdf', category: 'Income', size: '1.1 MB', status: 'Verified', uploadedAt: '29 Jun' },
  { name: 'council_tax_notice.pdf', category: 'Debt', size: '89 KB', status: 'Verified', uploadedAt: '29 Jun' },
];

const TIMELINE_EVENTS = [
  { date: '29 Jun 2026', label: 'Application submitted', description: 'Your application was received and a reference number assigned.' },
  { date: '29 Jun 2026', label: 'System checks completed', description: 'Automated cross-system checks complete. No existing cases found.' },
  { date: '30 Jun 2026', label: 'Credit check passed', description: 'Your credit check returned a score of 620 (PASS).' },
  { date: '1 Jul 2026', label: 'Case assigned', description: 'Your case has been assigned to James Wilson for review.' },
  { date: '5 Jul 2026', label: 'Expected decision', description: 'Estimated date for a decision on your application.', upcoming: true },
  { date: '8 Jul 2026', label: 'Money adviser contact', description: 'If approved, a qualified money adviser will contact you.', upcoming: true },
];

// ─── Collapsible Section component ──────────────────────────────────────────
function CollapsibleSection({ title, icon, children, defaultOpen = false }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-left">
        <span className="flex items-center gap-2 font-bold text-sm">
          <span>{icon}</span> {title}
        </span>
        <span className="text-gray-400 text-lg">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="p-4 border-t border-gray-200 dark:border-gray-700">{children}</div>}
    </div>
  );
}

export default function MyApplicationPage() {
  const [selectedMessage, setSelectedMessage] = useState<typeof MESSAGES[0] | null>(null);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">My Application</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Track the progress of your debt advice application</p>

      {/* Progress Tracker — horizontal steps */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between relative">
          {/* Connecting line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 mx-12"></div>
          <div className="absolute top-5 left-0 h-0.5 bg-green-500 mx-12" style={{ width: '25%' }}></div>

          {STEPS.map((step, i) => (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                step.complete ? 'bg-green-600 border-green-600 text-white' :
                step.current ? 'bg-blue-600 border-blue-600 text-white animate-pulse' :
                'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
              }`}>
                {step.complete ? '✓' : i + 1}
              </div>
              <span className={`mt-2 text-xs font-medium ${step.current ? 'text-blue-700 dark:text-blue-400 font-bold' : step.complete ? 'text-green-700 dark:text-green-400' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Application Card */}
      <div className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold">Your Application</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Submitted {APPLICATION.submittedAt}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded text-sm font-bold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 uppercase">Under Review</span>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-xs text-gray-500 dark:text-gray-400">Reference</p>
            <p className="font-bold font-mono">{APPLICATION.ref}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-xs text-gray-500 dark:text-gray-400">Recommended Product</p>
            <p className="font-bold">{APPLICATION.product}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Debt</p>
            <p className="font-bold">£{APPLICATION.totalDebt.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-xs text-gray-500 dark:text-gray-400">Proposed Payment</p>
            <p className="font-bold">{APPLICATION.proposedPayment}</p>
          </div>
        </div>
      </div>

      {/* What Happens Next */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">What Happens Next</h2>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
          <div className="space-y-4">
            {TIMELINE_EVENTS.map((event, i) => (
              <div key={i} className="flex gap-4 relative">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center z-10 ${
                  event.upcoming ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400'
                }`}>
                  {event.upcoming ? '○' : '✓'}
                </div>
                <div className={`flex-1 pb-2 ${event.upcoming ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{event.label}</span>
                    {event.upcoming && <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">Upcoming</span>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{event.date}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Your Application Details — collapsible sections */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold mb-2">Your Application Details</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Reference: <Link href="/case/IAAS-2026-00012" className="font-mono text-blue-700 dark:text-blue-400 underline hover:text-blue-900">IAAS-2026-00012</Link>
        </p>
        <div className="space-y-3">
          <CollapsibleSection title="Personal Details" icon="👤">
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500">Title</span><span className="font-medium">Mr</span></div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500">First Name</span><span className="font-medium">Alistair</span></div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500">Last Name</span><span className="font-medium">Morrison</span></div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500">Date of Birth</span><span className="font-medium">22/11/1988</span></div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500">National Insurance</span><span className="font-medium">AB654321C</span></div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500">Marital Status</span><span className="font-medium">Married</span></div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500">Dependants</span><span className="font-medium">1</span></div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500">Employment</span><span className="font-medium">Employed</span></div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Address History" icon="🏠">
            <div className="text-sm">
              <h4 className="font-bold text-xs text-gray-500 uppercase mb-1">Current Address</h4>
              <p className="font-medium">15 Highland Road, Edinburgh, EH3 5AA</p>
              <p className="text-gray-500">Resident since: March 2019</p>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-xs text-gray-500 uppercase mb-1">Previous Address</h4>
                <p className="text-gray-600 dark:text-gray-400">42 Leith Walk, Edinburgh, EH6 8PA (2016 — 2019)</p>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Debts (4 creditors — £18,400)" icon="💳">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr><th className="text-left p-2">Creditor</th><th className="text-left p-2">Type</th><th className="text-right p-2">Amount</th><th className="text-right p-2">Monthly</th></tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-700"><td className="p-2 font-medium">Royal Bank of Scotland</td><td className="p-2">Personal Loan</td><td className="p-2 text-right">£8,200</td><td className="p-2 text-right">£180</td></tr>
                <tr className="border-b border-gray-100 dark:border-gray-700"><td className="p-2 font-medium">Barclays Card</td><td className="p-2">Credit Card</td><td className="p-2 text-right">£5,400</td><td className="p-2 text-right">£120</td></tr>
                <tr className="border-b border-gray-100 dark:border-gray-700"><td className="p-2 font-medium">Glasgow Council</td><td className="p-2">Council Tax</td><td className="p-2 text-right">£2,800</td><td className="p-2 text-right">£0</td></tr>
                <tr className="border-b border-gray-100 dark:border-gray-700"><td className="p-2 font-medium">ScotPower</td><td className="p-2">Utility</td><td className="p-2 text-right">£2,000</td><td className="p-2 text-right">£85</td></tr>
                <tr className="font-bold bg-gray-50 dark:bg-gray-700"><td className="p-2">TOTAL</td><td></td><td className="p-2 text-right">£18,400</td><td className="p-2 text-right">£385</td></tr>
              </tbody>
            </table>
          </CollapsibleSection>

          <CollapsibleSection title="Income & Expenditure" icon="💰">
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-bold mb-2">Monthly Income</h4>
                <div className="flex justify-between py-1"><span className="text-gray-600">Wages</span><span className="font-medium">£2,600</span></div>
                <div className="flex justify-between py-1 border-t mt-1 font-bold"><span>Total Income</span><span>£2,600</span></div>
              </div>
              <div>
                <h4 className="font-bold mb-2">Monthly Expenditure</h4>
                <div className="flex justify-between py-1"><span className="text-gray-600">Rent/Mortgage</span><span className="font-medium">£850</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Council Tax</span><span className="font-medium">£130</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Utilities</span><span className="font-medium">£140</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Food</span><span className="font-medium">£380</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Transport</span><span className="font-medium">£120</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Insurance</span><span className="font-medium">£60</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Childcare</span><span className="font-medium">£200</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Other</span><span className="font-medium">£50</span></div>
                <div className="flex justify-between py-1 border-t mt-1 font-bold"><span>Total Expenditure</span><span>£1,930</span></div>
              </div>
            </div>
            <div className="mt-3 p-3 rounded text-center font-bold bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-300">
              Disposable Income: £670/month
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Assets" icon="🏡">
            <div className="text-sm space-y-3">
              <div>
                <h4 className="font-bold text-xs text-gray-500 uppercase mb-1">Vehicles</h4>
                <p>2019 Volkswagen Golf — Value: £8,500, Finance: £3,200 (Essential for work)</p>
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-500 uppercase mb-1">Savings</h4>
                <p>Bank savings (Nationwide) — £1,200</p>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Documents" icon="📄">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span>📄 payslip_june_2026.pdf</span>
                <span className="text-xs font-bold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">✓ Verified</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span>📄 bank_statement_may.pdf</span>
                <span className="text-xs font-bold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">✓ Verified</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span>📄 council_tax_notice.pdf</span>
                <span className="text-xs font-bold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">✓ Verified</span>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Recommendation" icon="✅">
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-4">
              <p className="font-bold text-green-800 dark:text-green-300 text-lg">Debt Arrangement Scheme (DAS)</p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">94% confidence</p>
              <p className="text-sm text-green-800 dark:text-green-300 mt-2">Debt level within DAS range, disposable income supports structured repayment, no existing insolvency proceedings.</p>
              <Link href="/case/IAAS-2026-00012/recommendation" className="inline-flex items-center gap-1 text-sm font-bold text-green-700 dark:text-green-400 hover:text-green-900 underline mt-3">
                View full recommendation explanation →
              </Link>
            </div>
          </CollapsibleSection>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Messages */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-bold">Messages</h2>
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
              {MESSAGES.filter(m => m.unread).length} new
            </span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {MESSAGES.map(msg => (
              <button
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${msg.unread ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''}`}
              >
                <div className="flex items-start gap-2">
                  {msg.unread && <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>}
                  {!msg.unread && <span className="w-2 h-2 bg-transparent rounded-full mt-1.5 flex-shrink-0"></span>}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className={`text-sm ${msg.unread ? 'font-bold' : ''} truncate`}>{msg.subject}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{msg.from} - {msg.date}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-bold">Your Documents</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {DOCUMENTS.map((doc, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📄</span>
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{doc.category} - {doc.size} - Uploaded {doc.uploadedAt}</p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/apply" className="text-sm text-blue-700 dark:text-blue-400 underline hover:text-blue-900">
              Upload additional documents →
            </Link>
          </div>
        </div>
      </div>

      {/* Message Detail Modal (inline) */}
      {selectedMessage && (
        <div className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg">{selectedMessage.subject}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">From: {selectedMessage.from} - {selectedMessage.date}</p>
            </div>
            <button onClick={() => setSelectedMessage(null)} className="text-gray-400 hover:text-gray-600 text-sm border border-gray-300 dark:border-gray-600 px-2 py-1 rounded">
              Close
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selectedMessage.body}</p>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h2 className="font-bold mb-3">Need Help?</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-bold">Phone</p>
            <p className="text-gray-600 dark:text-gray-400">0300 200 2600</p>
            <p className="text-xs text-gray-500">Mon-Fri 8:30am - 5pm</p>
          </div>
          <div>
            <p className="font-bold">Email</p>
            <p className="text-gray-600 dark:text-gray-400">aib@aib.gov.uk</p>
            <p className="text-xs text-gray-500">Response within 2 working days</p>
          </div>
          <div>
            <p className="font-bold">Free Advice</p>
            <p className="text-gray-600 dark:text-gray-400">Citizens Advice Scotland</p>
            <p className="text-xs text-gray-500">0800 028 1456 (free)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
