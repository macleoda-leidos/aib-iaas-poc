'use client';

import { useState } from 'react';
import { useNotifications } from '../../lib/useNotifications';

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const typeIcon: Record<string, string> = {
    application: '📋', system: '⚙️', decision: '✅', sla: '⏰',
  };

  const timeAgo = (dateStr: string) => {
    const secs = Math.round((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return `${Math.floor(secs / 3600)}h ago`;
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-1 text-white hover:text-yellow-200 transition-colors" aria-label="Notifications">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="font-bold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Mark all read</button>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-gray-400 text-center">No notifications</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} onClick={() => markRead(n.id)}
                    className={`px-3 py-2 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 ${!n.read ? 'bg-blue-50 dark:bg-blue-950' : ''}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-sm">{typeIcon[n.type] || '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate ${!n.read ? 'font-bold' : ''}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 truncate">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0"></span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
