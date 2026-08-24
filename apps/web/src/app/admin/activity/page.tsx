'use client';

import { useMemo, useState, useRef } from 'react';
import Link from 'next/link';

interface DayData {
  date: string;
  dateLabel: string;
  dayName: string;
  total: number;
  systems: { basys: number; eden: number; das: number; iaas: number; cft: number; roi: number };
}

function generateHeatmapData(): DayData[][] {
  const data: DayData[][] = [];
  const now = new Date(2026, 7, 24); // Aug 24 2026
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (52 * 7));

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let week = 0; week < 52; week++) {
    const weekData: DayData[] = [];
    for (let day = 0; day < 7; day++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + week * 7 + day);
      const isWeekend = day === 0 || day === 6;
      const maxCases = isWeekend ? 2 : 8;
      const baseCases = isWeekend ? 0 : Math.floor(Math.random() * maxCases);

      const systems = {
        basys: Math.floor(Math.random() * Math.max(1, baseCases * 0.3)),
        eden: Math.floor(Math.random() * Math.max(1, baseCases * 0.25)),
        das: Math.floor(Math.random() * Math.max(1, baseCases * 0.25)),
        iaas: Math.floor(Math.random() * Math.max(1, baseCases * 0.15)),
        cft: Math.floor(Math.random() * Math.max(1, baseCases * 0.1)),
        roi: Math.floor(Math.random() * Math.max(1, baseCases * 0.05)),
      };
      const total = Object.values(systems).reduce((s, v) => s + v, 0) || (isWeekend && Math.random() > 0.85 ? 1 : 0);

      weekData.push({
        date: d.toISOString().slice(0, 10),
        dateLabel: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
        dayName: dayNames[day],
        total,
        systems: total > 0 ? systems : { basys: 0, eden: 0, das: 0, iaas: 0, cft: 0, roi: 0 },
      });
    }
    data.push(weekData);
  }
  return data;
}

function getColour(count: number): string {
  if (count === 0) return 'bg-gray-200 dark:bg-gray-700';
  if (count <= 2) return 'bg-green-200 dark:bg-green-900';
  if (count <= 4) return 'bg-green-400 dark:bg-green-700';
  if (count <= 6) return 'bg-green-500 dark:bg-green-600';
  return 'bg-green-700 dark:bg-green-500';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ActivityPage() {
  const data = useMemo(generateHeatmapData, []);
  const total = data.flat().reduce((s, d) => s + d.total, 0);
  const [tooltip, setTooltip] = useState<{ day: DayData; x: number; y: number } | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate month labels positions
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIdx: number }[] = [];
    let lastMonth = -1;
    data.forEach((week, wi) => {
      const firstDay = new Date(week[0].date);
      if (firstDay.getMonth() !== lastMonth) {
        lastMonth = firstDay.getMonth();
        labels.push({ month: MONTHS[lastMonth], weekIdx: wi });
      }
    });
    return labels;
  }, [data]);

  const handleMouseEnter = (day: DayData, e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({ day, x: e.clientX - rect.left, y: e.clientY - rect.top - 80 });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block">← Back to Admin</Link>
      <h1 className="text-3xl font-bold mb-2">Activity Heatmap</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-2"><strong>{total.toLocaleString()}</strong> cases processed in the last 12 months</p>
      <p className="text-xs text-gray-400 mb-6">Hover for details • Click any day to drill down</p>

      <div ref={containerRef} className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 overflow-x-auto">
        {/* Month labels */}
        <div className="flex gap-[3px] ml-8 mb-1">
          {data.map((_, wi) => {
            const label = monthLabels.find(l => l.weekIdx === wi);
            return <div key={wi} className="w-[15px] text-center"><span className="text-[10px] text-gray-400">{label?.month || ''}</span></div>;
          })}
        </div>

        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-1 justify-center">
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
              <div key={i} className="h-[15px] flex items-center"><span className="text-[10px] text-gray-400 w-6 text-right">{label}</span></div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]">
            {data.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-[15px] h-[15px] rounded-sm cursor-pointer border border-transparent hover:border-gray-500 transition-all ${getColour(day.total)}`}
                    onMouseEnter={e => handleMouseEnter(day, e)}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => setSelectedDay(day)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
          <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
          <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
          <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
          <div className="w-3 h-3 rounded-sm bg-green-700 dark:bg-green-500" />
          <span>More</span>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none"
            style={{ left: tooltip.x - 60, top: tooltip.y }}>
            <p className="font-bold mb-1">{tooltip.day.dateLabel}</p>
            <p className="text-green-300 font-bold">{tooltip.day.total} cases</p>
            {tooltip.day.total > 0 && (
              <div className="mt-1 border-t border-gray-700 pt-1 space-y-0.5">
                {tooltip.day.systems.basys > 0 && <p>BASYS: {tooltip.day.systems.basys}</p>}
                {tooltip.day.systems.eden > 0 && <p>eDEN: {tooltip.day.systems.eden}</p>}
                {tooltip.day.systems.das > 0 && <p>DAS: {tooltip.day.systems.das}</p>}
                {tooltip.day.systems.iaas > 0 && <p>IAAS: {tooltip.day.systems.iaas}</p>}
                {tooltip.day.systems.cft > 0 && <p>CFT: {tooltip.day.systems.cft}</p>}
                {tooltip.day.systems.roi > 0 && <p>RoI: {tooltip.day.systems.roi}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drill-down panel */}
      {selectedDay && (
        <div className="mt-4 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">{selectedDay.dateLabel} — {selectedDay.total} cases</h3>
            <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕ Close</button>
          </div>
          {selectedDay.total === 0 ? (
            <p className="text-sm text-gray-500">No cases processed on this day.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(selectedDay.systems).filter(([, v]) => v > 0).map(([system, count]) => (
                <div key={system} className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-3 text-center">
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">{count}</p>
                  <p className="text-xs text-gray-500 uppercase">{system}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
