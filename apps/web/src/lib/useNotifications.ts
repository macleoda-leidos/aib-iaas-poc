'use client';

import { useState, useCallback } from 'react';
import { apiGet } from './apiClient';
import { useVisiblePolling } from './useVisiblePolling';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'application' | 'system' | 'decision' | 'sla';
  read: boolean;
  createdAt: string;
}

// Generates realistic notifications from seed data patterns
function generateNotifications(): NotificationItem[] {
  const now = Date.now();
  return [
    { id: 'n1', title: 'New application submitted', message: 'IAAS-2026-00098 — Margaret Paterson submitted DAS application', type: 'application', read: false, createdAt: new Date(now - 120000).toISOString() },
    { id: 'n2', title: 'Credit check completed', message: 'IAAS-2026-00095 — Automated credit check passed (Score: 620)', type: 'system', read: false, createdAt: new Date(now - 300000).toISOString() },
    { id: 'n3', title: 'SLA warning', message: 'IAAS-2026-00042 — 4 days since submission, SLA target is 5 days', type: 'sla', read: false, createdAt: new Date(now - 600000).toISOString() },
    { id: 'n4', title: 'Decision required', message: 'IAAS-2026-00067 — Recommendation issued, awaiting officer decision', type: 'decision', read: false, createdAt: new Date(now - 1800000).toISOString() },
    { id: 'n5', title: 'System check complete', message: 'IAAS-2026-00089 — All 6 integration checks clear', type: 'system', read: true, createdAt: new Date(now - 3600000).toISOString() },
    { id: 'n6', title: 'Application approved', message: 'IAAS-2026-00034 — Karen MacLeod approved DAS application', type: 'decision', read: true, createdAt: new Date(now - 7200000).toISOString() },
  ];
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const refresh = useCallback(() => {
    // Try API first, fall back to generated data
    apiGet<any>('/api/notifications/user/user-demo')
      .then(res => {
        if (res.data?.notifications?.length > 0) {
          setNotifications(res.data.notifications);
        } else {
          setNotifications(generateNotifications());
        }
      })
      .catch(() => {
        setNotifications(generateNotifications());
      });
    setLastUpdated(new Date());
  }, []);

  // Initial load + poll every 30 seconds while the tab is visible. This runs
  // globally via the header's notification bell, so before the visibility guard
  // every open tab polled whether or not anyone was watching it.
  useVisiblePolling(refresh, 30000);

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markRead, markAllRead, lastUpdated, refresh };
}
