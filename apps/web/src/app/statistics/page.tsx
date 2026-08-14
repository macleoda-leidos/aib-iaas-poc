'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, ComposedChart,
} from 'recharts';
import { apiGet } from '../../lib/apiClient';

// ─── Colour Palette (gov.scot inspired) ─────────────────────────────────────
const COLORS = {
  blue: '#1d70b8',
  darkBlue: '#003078',
  green: '#00703c',
  red: '#d4351c',
  yellow: '#ffdd00',
  orange: '#f47738',
  purple: '#4c2c92',
  pink: '#d53880',
  turquoise: '#28a197',
  lightGrey: '#f3f2f1',
};

const PIE_COLORS = [COLORS.blue, COLORS.green, COLORS.orange, COLORS.purple, COLORS.turquoise, COLORS.pink, COLORS.red, COLORS.darkBlue];
const STATUS_COLORS: Record<string, string> = {
  draft: '#b1b4b6', submitted: COLORS.blue, under_review: COLORS.orange,
  additional_info_required: COLORS.yellow, recommendation_issued: COLORS.purple,
  accepted: COLORS.green, rejected: COLORS.red, withdrawn: '#505a5f',
};

// ─── Fallback Data (shown when API unavailable) ──────────────────────────────

const FALLBACK = {
  summary: { totalApplications: 156, thisWeek: 12, thisMonth: 47, averageProcessingDays: 3.2 },
  byStatus: [
    { status: 'draft', count: 8 }, { status: 'submitted', count: 12 },
    { status: 'under_review', count: 15 }, { status: 'additional_info_required', count: 5 },
    { status: 'recommendation_issued', count: 28 }, { status: 'accepted', count: 72 },
    { status: 'rejected', count: 11 }, { status: 'withdrawn', count: 5 },
  ],
  byProduct: [
    { product: 'DAS', count: 45, percentage: 28.8 },
    { product: 'MAP', count: 32, percentage: 20.5 },
    { product: 'PTD', count: 28, percentage: 17.9 },
    { product: 'Sequestration', count: 18, percentage: 11.5 },
    { product: 'DPP', count: 15, percentage: 9.6 },
    { product: 'Moratorium', count: 8, percentage: 5.1 },
    { product: 'Signposting', count: 10, percentage: 6.4 },
  ],
  trends: {
    monthly: [
      { month: 'Sep 25', applications: 31, das: 9, map: 7, ptd: 5, other: 10 },
      { month: 'Oct 25', applications: 35, das: 10, map: 8, ptd: 6, other: 11 },
      { month: 'Nov 25', applications: 38, das: 11, map: 7, ptd: 7, other: 13 },
      { month: 'Dec 25', applications: 28, das: 8, map: 5, ptd: 5, other: 10 },
      { month: 'Jan 26', applications: 42, das: 12, map: 9, ptd: 8, other: 13 },
      { month: 'Feb 26', applications: 45, das: 13, map: 10, ptd: 8, other: 14 },
      { month: 'Mar 26', applications: 47, das: 14, map: 9, ptd: 9, other: 15 },
      { month: 'Apr 26', applications: 44, das: 13, map: 10, ptd: 7, other: 14 },
      { month: 'May 26', applications: 51, das: 15, map: 11, ptd: 9, other: 16 },
      { month: 'Jun 26', applications: 48, das: 14, map: 10, ptd: 8, other: 16 },
      { month: 'Jul 26', applications: 53, das: 16, map: 11, ptd: 10, other: 16 },
      { month: 'Aug 26', applications: 12, das: 4, map: 3, ptd: 2, other: 3 },
    ],
    weekly: [
      { week: 'W23', applications: 11 }, { week: 'W24', applications: 14 },
      { week: 'W25', applications: 12 }, { week: 'W26', applications: 13 },
      { week: 'W27', applications: 15 }, { week: 'W28', applications: 11 },
      { week: 'W29', applications: 13 }, { week: 'W30', applications: 16 },
      { week: 'W31', applications: 14 }, { week: 'W32', applications: 12 },
      { week: 'W33', applications: 15 }, { week: 'W34', applications: 8 },
    ],
  },
  performance: {
    averageTimeToRecommendation: '2.1 days',
    averageTimeToDecision: '5.4 days',
    creditCheckSuccessRate: 94,
    integrationUptime: 99.2,
    slaCompliance: 87,
  },
  products: [
    { product: 'DAS', active: 45, completed: 120, avgDebt: 15200, avgDuration: '4.2 yrs' },
    { product: 'MAP', active: 32, completed: 89, avgDebt: 7800, avgDuration: '6 mths' },
    { product: 'PTD', active: 28, completed: 65, avgDebt: 32000, avgDuration: '4 yrs' },
    { product: 'Sequestration', active: 18, completed: 42, avgDebt: 48000, avgDuration: '1 yr' },
    { product: 'DPP', active: 15, completed: 55, avgDebt: 3500, avgDuration: '2.1 yrs' },
    { product: 'Moratorium', active: 8, completed: 34, avgDebt: 12000, avgDuration: '6 wks' },
  ],
  organisations: [
    { name: 'Citizens Advice Scotland', applications: 34, approved: 28, rejected: 3, pending: 3 },
    { name: 'StepChange Scotland', applications: 22, approved: 18, rejected: 2, pending: 2 },
    { name: 'Money Advice Scotland', applications: 18, approved: 14, rejected: 2, pending: 2 },
    { name: 'Christians Against Poverty', applications: 12, approved: 10, rejected: 1, pending: 1 },
  ],
  geographic: [
    { region: 'Edinburgh & Lothians', applications: 38, percentage: 24.4 },
    { region: 'Glasgow & Clyde', applications: 42, percentage: 26.9 },
    { region: 'Aberdeen & NE', applications: 18, percentage: 11.5 },
    { region: 'Dundee & Tayside', applications: 15, percentage: 9.6 },
    { region: 'Highlands & Islands', applications: 12, percentage: 7.7 },
    { region: 'Fife', applications: 14, percentage: 9.0 },
    { region: 'Borders & South', applications: 17, percentage: 10.9 },
  ],
  financial: {
    totalDebtUnderManagement: 4850000,
    averageDebt: 18200,
    totalRecovered: 890000,
    debtBands: [
      { band: '<£5k', count: 28, percentage: 17.9 },
      { band: '£5k-£15k', count: 52, percentage: 33.3 },
      { band: '£15k-£25k', count: 42, percentage: 26.9 },
      { band: '£25k-£50k', count: 24, percentage: 15.4 },
      { band: '>£50k', count: 10, percentage: 6.4 },
    ],
  },
  processingTimes: {
    submissionToReview: { hours: 4.2, target: 8 },
    reviewToRecommendation: { hours: 48, target: 72 },
    recommendationToDecision: { hours: 72, target: 120 },
    totalEndToEnd: { hours: 124, target: 240 },
  },
};

// ─── Page Component ──────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const [data, setData] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('year');
  const [chartView, setChartView] = useState<'line' | 'area' | 'stacked'>('area');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboard, products, orgs, times] = await Promise.allSettled([
          apiGet<any>('/api/reports/dashboard'),
          apiGet<any>('/api/reports/by-product'),
          apiGet<any>('/api/reports/organisation-activity'),
          apiGet<any>('/api/reports/processing-times'),
        ]);

        // Merge API data with fallbacks
        if (dashboard.status === 'fulfilled' && dashboard.value.data) {
          const d = dashboard.value.data;
          setData(prev => ({
            ...prev,
            summary: d.summary || prev.summary,
            byStatus: d.byStatus || prev.byStatus,
            byProduct: d.byProduct || prev.byProduct,
            performance: { ...prev.performance, ...d.performance },
          }));
        }
      } catch {
        // Use fallback data — already set
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const formatCurrency = (n: number) => `£${(n / 1000000).toFixed(1)}M`;
  const formatNumber = (n: number) => n.toLocaleString();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Statistics & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">AiB IAAS — Real-time application intelligence</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          {(['week', 'month', 'quarter', 'year'] as const).map(range => (
            <button key={range} onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-bold rounded ${timeRange === range ? 'bg-gov-blue text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`}>
              {range === 'week' ? '7d' : range === 'month' ? '30d' : range === 'quarter' ? '90d' : '12m'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Section A: KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <KpiCard label="Total Applications" value={formatNumber(data.summary.totalApplications)} trend="+12% vs last month" icon="📊" color="blue" />
        <KpiCard label="This Week" value={String(data.summary.thisWeek)} trend="+3 today" icon="📈" color="green" />
        <KpiCard label="This Month" value={String(data.summary.thisMonth)} trend="on track" icon="📅" color="purple" />
        <KpiCard label="Avg Processing" value={`${data.summary.averageProcessingDays}d`} trend="↓ 0.3d improvement" icon="⚡" color="orange" />
        <KpiCard label="SLA Compliance" value={`${data.performance.slaCompliance}%`} trend="above 85% target" icon="✅" color="green" />
      </div>

      {/* ─── Section B: Application Volume Over Time ───────────────────── */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Application Volume</h2>
          <div className="flex gap-1">
            {(['line', 'area', 'stacked'] as const).map(v => (
              <button key={v} onClick={() => setChartView(v)}
                className={`px-2 py-1 text-xs rounded ${chartView === v ? 'bg-gov-blue text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'}`}>
                {v === 'line' ? '📈 Line' : v === 'area' ? '📊 Area' : '📚 Stacked'}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          {chartView === 'stacked' ? (
            <AreaChart data={data.trends.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="das" stackId="1" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.8} name="DAS" />
              <Area type="monotone" dataKey="map" stackId="1" stroke={COLORS.green} fill={COLORS.green} fillOpacity={0.8} name="MAP" />
              <Area type="monotone" dataKey="ptd" stackId="1" stroke={COLORS.orange} fill={COLORS.orange} fillOpacity={0.8} name="PTD" />
              <Area type="monotone" dataKey="other" stackId="1" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.8} name="Other" />
            </AreaChart>
          ) : chartView === 'area' ? (
            <AreaChart data={data.trends.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="applications" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.3} name="Applications" />
            </AreaChart>
          ) : (
            <LineChart data={data.trends.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="applications" stroke={COLORS.blue} strokeWidth={2} dot={{ r: 4 }} name="Applications" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* ─── Section C + D: Status Distribution + Product Breakdown ────── */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution - Pie */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Status Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ status, count }) => `${status.replace(/_/g, ' ')} (${count})`} labelLine={false}>
                {data.byStatus.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] || PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any, name: any) => [value, name.replace(/_/g, ' ')]} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend below */}
          <div className="grid grid-cols-2 gap-1 mt-2">
            {data.byStatus.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[s.status] || PIE_COLORS[i] }}></span>
                <span className="capitalize">{s.status.replace(/_/g, ' ')}</span>
                <span className="ml-auto font-bold">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Breakdown - Bar */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">By Recommended Product</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.byProduct} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="product" type="category" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.blue} radius={[0, 4, 4, 0]}>
                {data.byProduct.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Section E: Processing Performance (SLA Gauges) ────────────── */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Processing Performance & SLA</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <SlaGauge label="Submission → Review" actual={data.processingTimes.submissionToReview.hours} target={data.processingTimes.submissionToReview.target} unit="hrs" />
          <SlaGauge label="Review → Recommendation" actual={data.processingTimes.reviewToRecommendation.hours} target={data.processingTimes.reviewToRecommendation.target} unit="hrs" />
          <SlaGauge label="Recommendation → Decision" actual={data.processingTimes.recommendationToDecision.hours} target={data.processingTimes.recommendationToDecision.target} unit="hrs" />
          <SlaGauge label="Total End-to-End" actual={data.processingTimes.totalEndToEnd.hours} target={data.processingTimes.totalEndToEnd.target} unit="hrs" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center"><p className="text-2xl font-bold text-green-700">{data.performance.creditCheckSuccessRate}%</p><p className="text-xs text-gray-500">Credit Check Success</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-blue-700">{data.performance.integrationUptime}%</p><p className="text-xs text-gray-500">Integration Uptime</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-purple-700">{data.performance.slaCompliance}%</p><p className="text-xs text-gray-500">SLA Compliance</p></div>
        </div>
      </div>

      {/* ─── Section F: Organisation Activity ──────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Money Adviser Activity</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.organisations}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="approved" fill={COLORS.green} name="Approved" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rejected" fill={COLORS.red} name="Rejected" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" fill={COLORS.orange} name="Pending" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ─── Section G + H: Financial + Geographic ────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Financial — Debt distribution */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-2">Debt Distribution</h2>
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded">
              <p className="text-lg font-bold text-blue-700">{formatCurrency(data.financial.totalDebtUnderManagement)}</p>
              <p className="text-xs text-gray-500">Total Under Management</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-2 rounded">
              <p className="text-lg font-bold text-green-700">£{(data.financial.averageDebt / 1000).toFixed(1)}k</p>
              <p className="text-xs text-gray-500">Average Debt</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 p-2 rounded">
              <p className="text-lg font-bold text-purple-700">{formatCurrency(data.financial.totalRecovered)}</p>
              <p className="text-xs text-gray-500">Total Recovered</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.financial.debtBands}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="band" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any) => [`${value} applications`]} />
              <Bar dataKey="count" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Geographic */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Applications by Region</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.geographic} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="region" type="category" tick={{ fontSize: 11 }} width={130} />
              <Tooltip formatter={(value: any) => [`${value} applications`]} />
              <Bar dataKey="applications" fill={COLORS.turquoise} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Product Detail Table ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Product Performance Detail</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left p-3 font-bold">Product</th>
                <th className="text-right p-3 font-bold">Active</th>
                <th className="text-right p-3 font-bold">Completed</th>
                <th className="text-right p-3 font-bold">Avg Debt</th>
                <th className="text-right p-3 font-bold">Avg Duration</th>
                <th className="text-left p-3 font-bold">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.products.map((p, i) => {
                const rate = Math.round((p.completed / (p.active + p.completed)) * 100);
                return (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3 font-medium">{p.product}</td>
                    <td className="p-3 text-right">{p.active}</td>
                    <td className="p-3 text-right">{p.completed}</td>
                    <td className="p-3 text-right">£{p.avgDebt.toLocaleString()}</td>
                    <td className="p-3 text-right">{p.avgDuration}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: `${rate}%` }}></div>
                        </div>
                        <span className="text-xs font-bold w-8">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Weekly Trend (small) ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">Weekly Application Trend (Last 12 Weeks)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data.trends.weekly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="applications" fill={COLORS.blue} fillOpacity={0.15} stroke="none" />
            <Line type="monotone" dataKey="applications" stroke={COLORS.blue} strokeWidth={2} dot={{ r: 4, fill: COLORS.blue }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 mt-6 text-center">
        Data refreshed from API endpoints. Synthetic demonstration data — not connected to live AiB systems.
        Last updated: {new Date().toLocaleString()}.
      </p>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ label, value, trend, icon, color }: { label: string; value: string; trend: string; icon: string; color: string }) {
  const bg = color === 'blue' ? 'bg-blue-50 dark:bg-blue-950 border-blue-200' :
    color === 'green' ? 'bg-green-50 dark:bg-green-950 border-green-200' :
    color === 'purple' ? 'bg-purple-50 dark:bg-purple-950 border-purple-200' :
    color === 'orange' ? 'bg-orange-50 dark:bg-orange-950 border-orange-200' :
    'bg-gray-50 border-gray-200';

  return (
    <div className={`${bg} border rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{trend}</p>
    </div>
  );
}

function SlaGauge({ label, actual, target, unit }: { label: string; actual: number; target: number; unit: string }) {
  const percentage = Math.min(100, Math.round((actual / target) * 100));
  const isGood = percentage <= 70;
  const isWarn = percentage > 70 && percentage <= 90;
  const color = isGood ? 'text-green-700' : isWarn ? 'text-amber-600' : 'text-red-700';
  const bgColor = isGood ? 'bg-green-100' : isWarn ? 'bg-amber-100' : 'bg-red-100';
  const barColor = isGood ? 'bg-green-500' : isWarn ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="text-center">
      <div className={`w-20 h-20 mx-auto rounded-full ${bgColor} flex items-center justify-center mb-2`}>
        <span className={`text-lg font-bold ${color}`}>{actual}{unit === 'hrs' ? 'h' : unit}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mb-1">
        <div className={`${barColor} h-1.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
      <p className="text-xs font-medium">{label}</p>
      <p className="text-xs text-gray-400">Target: {target}{unit}</p>
    </div>
  );
}
