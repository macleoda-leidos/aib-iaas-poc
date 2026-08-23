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
