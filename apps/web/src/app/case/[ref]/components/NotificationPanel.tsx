'use client';

interface NotificationEvent {
  stage: string;
  recipient: string;
  subject: string;
  channel: 'email' | 'sms' | 'system';
  sent: boolean;
}

function getNotificationsForCase(status: string, assignedTo: string): NotificationEvent[] {
  const events: NotificationEvent[] = [];

  // Application submitted stage
  events.push({
    stage: 'Application Submitted',
    recipient: 'Applicant',
    subject: 'Application Acknowledgement — Your reference number has been created',
    channel: 'email',
    sent: true,
  });

  events.push({
    stage: 'Application Submitted',
    recipient: 'AiB Queue',
    subject: 'New application received — awaiting assignment',
    channel: 'system',
    sent: true,
  });

  // Case assigned stage
  if (assignedTo && assignedTo !== 'Unassigned') {
    events.push({
      stage: 'Case Assigned',
      recipient: assignedTo,
      subject: `New case assigned — review required within SLA`,
      channel: 'email',
      sent: true,
    });

    events.push({
      stage: 'Case Assigned',
      recipient: 'Applicant',
      subject: 'Your case has been assigned to a case officer',
      channel: 'email',
      sent: true,
    });
  } else {
    events.push({
      stage: 'Case Assigned',
      recipient: 'Case Officer',
      subject: 'New case assigned — review required within SLA',
      channel: 'email',
      sent: false,
    });
  }

  // Under review stage
  if (['under_review', 'additional_info_required', 'approved', 'rejected'].includes(status)) {
    events.push({
      stage: 'Under Review',
      recipient: 'Applicant',
      subject: 'Your application is being reviewed',
      channel: 'email',
      sent: true,
    });
  }

  // Additional info requested
  if (['additional_info_required'].includes(status)) {
    events.push({
      stage: 'Information Requested',
      recipient: 'Applicant',
      subject: 'Additional information required — please respond within 14 days',
      channel: 'email',
      sent: true,
    });

    events.push({
      stage: 'Information Requested',
      recipient: 'Applicant',
      subject: 'Reminder: documents still needed for your application',
      channel: 'sms',
      sent: true,
    });
  }

  // Decision stage
  if (['approved', 'rejected'].includes(status)) {
    events.push({
      stage: 'Decision Made',
      recipient: 'Applicant',
      subject: status === 'approved'
        ? 'Decision Notification — Your application has been approved'
        : 'Decision Notification — Your application outcome',
      channel: 'email',
      sent: true,
    });

    events.push({
      stage: 'Decision Made',
      recipient: 'Money Adviser',
      subject: 'Case decision issued — client notification sent',
      channel: 'email',
      sent: true,
    });
  } else {
    events.push({
      stage: 'Decision Made',
      recipient: 'Applicant',
      subject: 'Decision Notification',
      channel: 'email',
      sent: false,
    });
  }

  return events;
}

function ChannelIcon({ channel }: { channel: 'email' | 'sms' | 'system' }) {
  if (channel === 'email') {
    return (
      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }
  if (channel === 'sms') {
    return (
      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

export default function NotificationPanel({ caseStatus, caseRef, assignedTo }: { caseStatus: string; caseRef: string; assignedTo: string }) {
  const events = getNotificationsForCase(caseStatus, assignedTo);

  // Group by stage
  const stages = Array.from(new Set(events.map(e => e.stage)));

  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Notifications that have been (or will be) sent at each stage of this case.</p>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

        {stages.map((stage, stageIdx) => {
          const stageEvents = events.filter(e => e.stage === stage);
          const allSent = stageEvents.every(e => e.sent);

          return (
            <div key={stage} className="relative pl-10 pb-4">
              {/* Timeline dot */}
              <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${allSent ? 'bg-green-500 border-green-600' : 'bg-gray-300 border-gray-400 dark:bg-gray-600 dark:border-gray-500'}`}></div>

              {/* Stage label */}
              <div className="mb-2">
                <span className={`text-xs font-bold uppercase tracking-wide ${allSent ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {stage}
                </span>
              </div>

              {/* Events in this stage */}
              <div className="space-y-1.5">
                {stageEvents.map((event, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded text-sm ${event.sent ? 'bg-green-50 dark:bg-green-950/30' : 'bg-gray-50 dark:bg-gray-800 opacity-60'}`}>
                    <ChannelIcon channel={event.channel} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${event.sent ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}`}>
                          {event.sent ? 'Sent' : 'Pending'}
                        </span>
                        <span className="text-xs text-gray-500">to {event.recipient}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 uppercase font-mono">
                          {event.channel}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 truncate">{event.subject}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
