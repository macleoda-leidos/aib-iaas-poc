'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '../../lib/useNotifications';

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);

  // The nav bar that hosts this bell uses overflow-x-auto, which clips absolutely
  // positioned children regardless of z-index. Render the panel in a portal on
  // <body> and position it from the button's viewport rect instead.
  useEffect(() => {
    if (!open) return;

    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) setCoords({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    };
    place();

    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

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
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center text-white hover:text-yellow-200 transition-colors"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        🔔
        {unreadCount > 0 && (
          // Inset, not the usual negative offset: the host nav is overflow-x-auto, which
          // clips at its padding box on both axes and ignores z-index — the same trap the
          // dropdown escapes via a portal. A 16px badge plus its 2px ring, inset by 2px,
          // sits wholly inside this 32px button, so it cannot be cut off at any width.
          // The ring is the nav's own red so the badge separates from the bell it overlaps;
          // a bare red circle on the #a81b03 bar reads as a smudge. Counts cap at 9+ to
          // keep it a circle rather than squashing into a pill.
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white ring-2 ring-[#a81b03]"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && coords ? createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            style={{ top: coords.top, right: coords.right }}
            className="fixed w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[9999] overflow-hidden">
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
        </>,
        document.body
      ) : null}
    </div>
  );
}
