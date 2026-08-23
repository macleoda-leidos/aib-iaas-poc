'use client';

import { useMemo } from 'react';
import Link from 'next/link';

function generateHeatmapData() {
  const data: number[][] = [];
  for (let week = 0; week < 52; week++) {
    const weekData: number[] = [];
    for (let day = 0; day < 7; day++) {
      const isWeekend = day === 0 || day === 6;
      if (isWeekend) {
        weekData.push(Math.random() > 0.85 ? 1 : 0);
      } else {
        weekData.push(Math.floor(Math.random() * 9));
      }
    }
    data.push(weekData);
  }
  return data;
}

function getColour(count: number, dark: boolean) {
  if (count === 0) return dark ? 'bg-gray-700' : 'bg-gray-200';
  if (count <= 2) return dark ? 'bg-green-900' : 'bg-green-200';
  if (count <= 4) return dark ? 'bg-green-700' : 'bg-green-400';
  return dark ? 'bg-green-500' : 'bg-green-600';
}

export default function ActivityPage() {
  const data = useMemo(generateHeatmapData, []);
  const total = data.flat().reduce((s, v) => s + v, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block">← Back to Admin</Link>
      <h1 className="text-3xl font-bold mb-2">Activity Heatmap</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-2">{total.toLocaleString()} cases processed in the last 12 months</p>
      <p className="text-xs text-gray-400 mb-6">Each square represents one day. Darker = more cases processed.</p>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 overflow-x-auto">
        <div className="flex gap-[3px]">
          {data.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((count, di) => (
                <div key={di} className={`w-3 h-3 rounded-sm ${getColour(count, false)} dark:${getColour(count, true)}`} title={`${count} cases`} />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
          <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
          <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
          <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
