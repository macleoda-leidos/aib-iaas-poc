'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  RadialBarChart,
  RadialBar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { RECOMMENDATION_DATA, EnhancedRecommendation } from '../data/recommendation-data';

function getConfidenceColor(percent: number): string {
  if (percent >= 80) return '#16a34a'; // green-600
  if (percent >= 60) return '#d97706'; // amber-600
  return '#dc2626'; // red-600
}

function getConfidenceBgClass(level: EnhancedRecommendation['confidenceLevel']): string {
  switch (level) {
    case 'high':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'medium':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'low':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
}

function getStatusBadgeClass(status: 'received' | 'pending' | 'error'): string {
  switch (status) {
    case 'received':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
}

export default function RecommendationContent() {
  const params = useParams()!;
  const ref = params.ref as string;
  const data = RECOMMENDATION_DATA[ref];

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          Recommendation Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No recommendation data available for reference{' '}
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

  const confidenceColor = getConfidenceColor(data.confidencePercent);

  // Radial chart data
  const radialData = [
    {
      name: 'confidence',
      value: data.confidencePercent,
      fill: confidenceColor,
    },
  ];

  // Bar chart data for alternatives
  const barChartData = [
    { product: data.productShort, score: data.confidencePercent, isRecommended: true },
    ...data.alternatives.map((alt) => ({
      product: alt.product.length > 20 ? alt.product.substring(0, 18) + '...' : alt.product,
      score: alt.score,
      isRecommended: false,
    })),
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href={`/case/${ref}`}
        className="text-blue-700 dark:text-blue-400 text-sm underline mb-4 inline-block"
      >
        ← Back to case {ref}
      </Link>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Recommendation Explanation
      </h1>

      {/* ─── Hero Section ─── */}
      <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Left: Radial gauge */}
          <div className="relative w-48 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="100%"
                barSize={14}
                data={radialData}
                startAngle={225}
                endAngle={-45}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={8}
                  background={{ fill: '#e5e7eb' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-3xl font-bold"
                style={{ color: confidenceColor }}
              >
                {data.confidencePercent}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                confidence
              </span>
            </div>
          </div>

          {/* Right: Product info */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {data.product}
            </h2>
            <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-start mb-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getConfidenceBgClass(
                  data.confidenceLevel
                )}`}
              >
                {data.confidenceLevel} confidence
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Engine: Rules v{data.engineVersion}
              </span>
              {data.aiAssistEnabled && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  AI Assist Enabled
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generated: {data.generatedAt}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Decision Factors ─── */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Decision Factors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.factors.map((factor, idx) => (
            <div
              key={idx}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <span className="flex-shrink-0 mt-0.5 text-lg">
                  {factor.met && factor.impact === 'positive' && (
                    <span className="text-green-600">&#10003;</span>
                  )}
                  {factor.impact === 'negative' && (
                    <span className="text-red-600">&#10007;</span>
                  )}
                  {factor.impact === 'neutral' && (
                    <span className="text-gray-400">&#9675;</span>
                  )}
                  {!factor.met && factor.impact === 'positive' && (
                    <span className="text-gray-400">&#9675;</span>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {factor.factor}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {factor.value}
                  </p>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      factor.impact === 'positive'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : factor.impact === 'negative'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {factor.impact}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Alternatives Considered ─── */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Alternatives Considered
        </h2>

        {/* Bar chart */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={barChartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="product"
                tick={{ fontSize: 11 }}
                width={75}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                }}
                formatter={(value: number) => [`${value}%`, 'Score']}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {barChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isRecommended ? '#16a34a' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alternative cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.alternatives.map((alt, idx) => (
            <div
              key={idx}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {alt.product}
                </h3>
                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                  {alt.score}%
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {alt.reason}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Evidence Sources ─── */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Evidence Sources
        </h2>
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                  Source
                </th>
                <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                  System
                </th>
                <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                  Time
                </th>
                <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                  Contribution
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.evidenceSources.map((source, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                    {source.source}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs font-medium">
                      {source.system}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-nowrap">
                    {source.timestamp}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusBadgeClass(
                        source.status
                      )}`}
                    >
                      {source.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-600 dark:text-gray-400 max-w-xs">
                    {source.contribution}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Explanation ─── */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Explanation
        </h2>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
          {data.explanation.split('\n\n').map((paragraph, idx) => (
            <p
              key={idx}
              className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4 last:mb-0"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* ─── Regulatory Disclaimer ─── */}
      <section className="mb-8">
        <div className="bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-300 dark:border-yellow-700 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <span className="text-yellow-600 dark:text-yellow-400 text-xl flex-shrink-0">
              ⚠
            </span>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 italic leading-relaxed">
              {data.regulatoryDisclaimer}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
