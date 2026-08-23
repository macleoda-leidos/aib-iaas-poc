'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'application' | 'system' | 'ai' | 'document' | 'sla' | 'decision' | 'credit';
  read: boolean;
  timestamp: string;
  timeAgo: string;
  link?: string;
  icon: string;
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'Application IAAS-2026-00012 submitted',
    description: 'New application received from Sarah Mitchell for debt relief assessment.',
    type: 'application',
    read: false,
    timestamp: '2026-08-19T14:58:00Z',
    timeAgo: '2 min ago',
    link: '/applications/IAAS-2026-00012',
    icon: '📋',
  },
  {
    id: '2',
    title: 'Credit check completed — Score 620',
    description: 'Credit bureau returned results for IAAS-2026-00012. Score: 620 (Fair).',
    type: 'credit',
    read: false,
    timestamp: '2026-08-19T14:55:00Z',
    timeAgo: '5 min ago',
    link: '/applications/IAAS-2026-00012/credit',
    icon: '📊',
  },
  {
    id: '3',
    title: 'Case IAAS-2026-00011 assigned to you',
    description: 'You have been assigned as case officer for James Robertson\'s application.',
    type: 'application',
    read: false,
    timestamp: '2026-08-19T13:00:00Z',
    timeAgo: '1 hour ago',
    link: '/applications/IAAS-2026-00011',
    icon: '👤',
  },
  {
    id: '4',
    title: 'Decision approved: IAAS-2026-00008',
    description: 'Sequestration recommendation approved by senior officer. Notification sent to applicant.',
    type: 'decision',
    read: false,
    timestamp: '2026-08-19T11:00:00Z',
    timeAgo: '3 hours ago',
    link: '/applications/IAAS-2026-00008',
    icon: '✅',
  },
  {
    id: '5',
    title: 'Document classified: Court Decree (94%)',
    description: 'AI document classifier identified uploaded file as Court Decree with 94% confidence.',
    type: 'document',
    read: false,
    timestamp: '2026-08-18T16:30:00Z',
    timeAgo: 'yesterday',
    link: '/applications/IAAS-2026-00009/documents',
    icon: '📄',
  },
  {
    id: '6',
    title: 'AI anomaly detected: income discrepancy',
    description: 'Declared income £1,200/month but bank statements show £2,400/month average for IAAS-2026-00007.',
    type: 'ai',
    read: false,
    timestamp: '2026-08-18T14:15:00Z',
    timeAgo: 'yesterday',
    link: '/applications/IAAS-2026-00007/anomalies',
    icon: '⚠️',
  },
  {
    id: '7',
    title: 'SLA warning: IAAS-2026-00010 overdue',
    description: 'Application has exceeded 5-day processing target. Escalation required.',
    type: 'sla',
    read: true,
    timestamp: '2026-08-17T09:00:00Z',
    timeAgo: '2 days ago',
    link: '/applications/IAAS-2026-00010',
    icon: '🕐',
  },
  {
    id: '8',
    title: 'New creditor objection received',
    description: 'Royal Bank of Scotland has filed an objection to IAAS-2026-00006 DAS application.',
    type: 'application',
    read: true,
    timestamp: '2026-08-17T08:30:00Z',
    timeAgo: '2 days ago',
    link: '/applications/IAAS-2026-00006/objections',
    icon: '🏦',
  },
  {
    id: '9',
    title: 'System maintenance scheduled',
    description: 'Planned maintenance window: Sunday 24 Aug, 02:00–06:00. Services may be intermittent.',
    type: 'system',
    read: true,
    timestamp: '2026-08-16T12:00:00Z',
    timeAgo: '3 days ago',
    link: undefined,
    icon: '🔧',
  },
  {
    id: '10',
    title: 'Bulk import completed: 23 applications',
    description: 'CSV batch import completed successfully. 23 applications created, 0 errors.',
    type: 'system',
    read: true,
    timestamp: '2026-08-16T10:00:00Z',
    timeAgo: '3 days ago',
    link: '/applications',
    icon: '📥',
  },
  {
    id: '11',
    title: 'Quality check passed: IAAS-2026-00005',
    description: 'AI quality assessment score: 92/100. All required fields complete.',
    type: 'ai',
    read: true,
    timestamp: '2026-08-15T15:45:00Z',
    timeAgo: '4 days ago',
    link: '/applications/IAAS-2026-00005/quality',
    icon: '🎯',
  },
  {
    id: '12',
    title: 'Payment received: £90.00',
    description: 'Application fee payment confirmed for IAAS-2026-00004 via GOV.UK Pay.',
    type: 'application',
    read: true,
    timestamp: '2026-08-15T11:20:00Z',
    timeAgo: '4 days ago',
    link: '/applications/IAAS-2026-00004/payments',
    icon: '💳',
  },
  {
    id: '13',
    title: 'Moratorium granted: IAAS-2026-00003',
    description: '6-week moratorium on debt enforcement actions has been registered.',
    type: 'decision',
    read: true,
    timestamp: '2026-08-14T14:00:00Z',
    timeAgo: '5 days ago',
    link: '/applications/IAAS-2026-00003',
    icon: '🛡️',
  },
  {
    id: '14',
    title: 'BASYS sync completed',
    description: 'Nightly synchronisation with BASYS completed. 147 records updated, 3 conflicts flagged.',
    type: 'system',
    read: true,
    timestamp: '2026-08-14T06:00:00Z',
    timeAgo: '5 days ago',
    link: undefined,
    icon: '🔄',
  },
  {
    id: '15',
    title: 'New user registered: Money Adviser',
    description: 'Angela Crawford (StepChange) has registered and is pending approval.',
    type: 'system',
    read: true,
    timestamp: '2026-08-13T09:30:00Z',
    timeAgo: '6 days ago',
    link: '/admin/users',
    icon: '👥',
  },
];

type TabType = 'all' | 'unread' | 'applications' | 'system';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    switch (activeTab) {
      case 'unread':
        return !n.read;
      case 'applications':
        return ['application', 'decision', 'credit', 'document', 'ai', 'sla'].includes(n.type);
      case 'system':
        return n.type === 'system';
      default:
        return true;
    }
  });

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'applications', label: 'Applications' },
    { key: 'system', label: 'System' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notification Centre
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                {unreadCount} unread
              </span>
            )}
          </div>
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Mark all as read
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8" aria-label="Notification tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Notification list */}
        <div className="space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">No notifications</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                {activeTab === 'unread' ? 'All caught up!' : 'Nothing to show here.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const content = (
                <div
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                    notification.read
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 text-2xl mt-0.5" aria-hidden="true">
                    {notification.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm font-medium ${
                          notification.read
                            ? 'text-gray-900 dark:text-gray-100'
                            : 'text-blue-900 dark:text-blue-100'
                        }`}
                      >
                        {notification.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {notification.timeAgo}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" aria-label="Unread" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {notification.description}
                    </p>
                  </div>
                </div>
              );

              if (notification.link) {
                return (
                  <Link
                    key={notification.id}
                    href={notification.link}
                    className="block"
                    onClick={() => markAsRead(notification.id)}
                  >
                    {content}
                  </Link>
                );
              }

              return <div key={notification.id}>{content}</div>;
            })
          )}
        </div>
      </div>
    </div>
  );
}
