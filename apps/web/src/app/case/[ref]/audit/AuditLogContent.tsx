'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import CaseTimeline from '../components/CaseTimeline';
import { TIMELINE_DATA } from '../data/timeline-data';

export default function AuditLogContent() {
  const params = useParams()!;
  const ref = params.ref as string;
  const events = TIMELINE_DATA[ref];

  if (!events) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          Audit Log Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No audit data available for reference{' '}
          <code className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
            {ref}
          </code>
        </p>
        <Link href="/dashboard" className="text-blue-700 dark:text-blue-400 underline">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href={`/case/${ref}`}
        className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block"
      >
        ← Back to case
      </Link>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Audit Log — <span className="font-mono">{ref}</span>
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Complete chronological record of all system and user actions for this case.
          Showing {events.length} events.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase self-center">Legend:</span>
        <span className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> System
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Staff
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Applicant
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Auth
        </span>
      </div>

      {/* Full timeline (no compact) */}
      <CaseTimeline events={events} compact={false} caseRef={ref} />
    </div>
  );
}
