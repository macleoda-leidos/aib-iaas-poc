'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuditEvent } from '../data/timeline-data';

type CategoryFilter = 'all' | 'application' | 'check' | 'decision' | 'communication' | 'review';

interface CaseTimelineProps {
  events: AuditEvent[];
  compact?: boolean;
  maxItems?: number;
  caseRef?: string;
}

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All',
  application: 'Application',
  check: 'Checks',
  decision: 'Decisions',
  communication: 'Communications',
  review: 'Review',
};

const CATEGORY_COLORS: Record<CategoryFilter, string> = {
  all: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  application: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  check: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  decision: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  communication: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  review: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

const ACTOR_DOT_COLORS: Record<AuditEvent['actorType'], string> = {
  system: 'bg-blue-500',
  staff: 'bg-amber-500',
  applicant: 'bg-green-500',
  auth: 'bg-purple-500',
};

const ACTOR_TYPE_BADGES: Record<AuditEvent['actorType'], { label: string; className: string }> = {
  system: { label: 'System', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  staff: { label: 'Staff', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  applicant: { label: 'Applicant', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  auth: { label: 'Auth', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
};

export default function CaseTimeline({ events, compact = false, maxItems = 8, caseRef }: CaseTimelineProps) {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filteredEvents = activeFilter === 'all'
    ? events
    : events.filter((e) => e.category === activeFilter);

  // Reverse chronological (newest first)
  const sortedEvents = [...filteredEvents].reverse();

  const displayedEvents = compact ? sortedEvents.slice(0, maxItems) : sortedEvents;
  const hasMore = compact && sortedEvents.length > maxItems;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="w-full">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((cat) => {
          const isActive = activeFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? `${CATEGORY_COLORS[cat]} ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {CATEGORY_LABELS[cat]}
              {cat !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  ({events.filter((e) => e.category === cat).length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-0">
          {displayedEvents.map((event) => {
            const isExpanded = expandedIds.has(event.id);
            const hasDetail = !!event.detail;

            return (
              <div key={event.id} className="relative pl-8 pb-6 group">
                {/* Dot */}
                <div
                  className={`absolute left-[5px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 shadow-sm ${ACTOR_DOT_COLORS[event.actorType]}`}
                />

                {/* Event content */}
                <div
                  className={`${
                    hasDetail ? 'cursor-pointer' : ''
                  } rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                  onClick={() => hasDetail && toggleExpand(event.id)}
                >
                  {/* Timestamp */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-mono">
                    {event.timestamp}
                  </p>

                  {/* Action */}
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
                    {event.action}
                    {hasDetail && (
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                        {isExpanded ? '▾' : '▸'}
                      </span>
                    )}
                  </p>

                  {/* Meta row: actor, type badge, system chip */}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {event.actor}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        ACTOR_TYPE_BADGES[event.actorType].className
                      }`}
                    >
                      {ACTOR_TYPE_BADGES[event.actorType].label}
                    </span>
                    {event.system && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-[10px] font-medium">
                        {event.system}
                      </span>
                    )}
                  </div>

                  {/* Expandable detail */}
                  {hasDetail && isExpanded && (
                    <div className="mt-2 p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      {event.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact mode: View full log link */}
      {hasMore && caseRef && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <Link
            href={`/case/${caseRef}/audit`}
            className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline"
          >
            View full audit log ({sortedEvents.length} events) →
          </Link>
        </div>
      )}

      {/* Empty state */}
      {displayedEvents.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No events match the selected filter.</p>
        </div>
      )}
    </div>
  );
}
