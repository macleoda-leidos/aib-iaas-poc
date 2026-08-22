'use client';

import { useState } from 'react';

interface EmailEntry {
  id: string;
  subject: string;
  recipient: string;
  sentAt: string;
  status: 'delivered' | 'pending' | 'failed';
  type: string;
}

const STATUS_STYLES: Record<string, string> = {
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

function generateEmails(caseRef: string): EmailEntry[] {
  // Simulated email log based on case reference
  const baseEmails: EmailEntry[] = [
    {
      id: '1',
      subject: 'Application Acknowledgement',
      recipient: 'a.morrison@example.com',
      sentAt: '29 Jun 14:36',
      status: 'delivered',
      type: 'Applicant Notification',
    },
    {
      id: '2',
      subject: 'Case Assigned notification',
      recipient: 'james.wilson@aib.gov.uk',
      sentAt: '29 Jun 09:00',
      status: 'delivered',
      type: 'Staff Notification',
    },
    {
      id: '3',
      subject: 'Credit Check Complete - Score 620',
      recipient: 'a.morrison@example.com',
      sentAt: '29 Jun 14:34',
      status: 'delivered',
      type: 'System Alert',
    },
    {
      id: '4',
      subject: 'Product Recommendation Available',
      recipient: 'a.morrison@example.com',
      sentAt: '29 Jun 14:37',
      status: 'delivered',
      type: 'Applicant Notification',
    },
    {
      id: '5',
      subject: 'Weekly Case Summary',
      recipient: 'karen.macleod@aib.gov.uk',
      sentAt: '30 Jun 09:00',
      status: 'pending',
      type: 'Digest',
    },
  ];

  // Vary by case to make it look realistic
  if (caseRef.includes('00011')) {
    return [
      { id: '1', subject: 'Application Acknowledgement', recipient: 'b.campbell@example.com', sentAt: '28 Jun 15:22', status: 'delivered', type: 'Applicant Notification' },
      { id: '2', subject: 'Case Assigned to James Wilson', recipient: 'james.wilson@aib.gov.uk', sentAt: '29 Jun 09:00', status: 'delivered', type: 'Staff Notification' },
      { id: '3', subject: 'Additional Information Requested', recipient: 'b.campbell@example.com', sentAt: '29 Jun 10:30', status: 'failed', type: 'Applicant Notification' },
    ];
  }
  if (caseRef.includes('00010')) {
    return [
      { id: '1', subject: 'Application Acknowledgement', recipient: 'c.stewart@example.com', sentAt: '26 Jun 10:48', status: 'delivered', type: 'Applicant Notification' },
      { id: '2', subject: 'Documents Required - Bank Statements', recipient: 'c.stewart@example.com', sentAt: '28 Jun 11:32', status: 'delivered', type: 'Applicant Notification' },
    ];
  }

  return baseEmails;
}

export default function EmailLog({ caseRef }: { caseRef: string }) {
  const emails = generateEmails(caseRef);
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">{emails.length} emails sent for this case</p>
        {emails.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {expanded ? 'Show less' : 'Show all'}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {(expanded ? emails : emails.slice(0, 3)).map((email) => (
          <div
            key={email.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{email.subject}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">({email.type})</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Sent to <span className="font-mono">{email.recipient}</span> &mdash; {email.sentAt}
              </p>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 ml-3 ${STATUS_STYLES[email.status]}`}>
              {email.status === 'delivered' && '&#10003; Delivered'}
              {email.status === 'pending' && '&#9679; Pending'}
              {email.status === 'failed' && '&#10007; Failed'}
            </span>
          </div>
        ))}
      </div>
      {emails.some(e => e.status === 'failed') && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
          <p className="text-xs text-red-700 dark:text-red-300">
            <strong>Note:</strong> Failed emails will be retried automatically. Contact support if the issue persists.
          </p>
        </div>
      )}
    </div>
  );
}
