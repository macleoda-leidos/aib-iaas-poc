'use client';

export function SkeletonCard() {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden animate-pulse">
      {/* Header */}
      <div className="bg-gray-100 dark:bg-gray-800 p-3 flex gap-4">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/5"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-3 flex gap-4 border-t border-gray-100 dark:border-gray-700">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-gray-200 dark:bg-gray-700 rounded"
          style={{ width: i === lines - 1 ? '60%' : `${85 + Math.random() * 15}%` }}
        ></div>
      ))}
    </div>
  );
}
