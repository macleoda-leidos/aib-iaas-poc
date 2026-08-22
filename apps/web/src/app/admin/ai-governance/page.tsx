'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CHART_COLORS = ['#1d70b8', '#00703c', '#f47738', '#d4351c', '#4c2c92', '#5694ca', '#28a197'];

const confidenceDistribution = [
  { range: '50-60%', count: 12 },
  { range: '60-70%', count: 45 },
  { range: '70-80%', count: 189 },
  { range: '80-90%', count: 412 },
  { range: '90-100%', count: 589 },
];

const acceptanceOverrideTrend = [
  { week: 'Wk 1', acceptance: 85.2, override: 12.1 },
  { week: 'Wk 2', acceptance: 85.8, override: 11.6 },
  { week: 'Wk 3', acceptance: 86.4, override: 11.2 },
  { week: 'Wk 4', acceptance: 87.1, override: 10.5 },
  { week: 'Wk 5', acceptance: 87.9, override: 9.8 },
  { week: 'Wk 6', acceptance: 88.3, override: 9.4 },
  { week: 'Wk 7', acceptance: 88.7, override: 9.1 },
  { week: 'Wk 8', acceptance: 89.2, override: 8.6 },
  { week: 'Wk 9', acceptance: 89.8, override: 8.2 },
  { week: 'Wk 10', acceptance: 90.4, override: 7.9 },
  { week: 'Wk 11', acceptance: 91.1, override: 7.6 },
  { week: 'Wk 12', acceptance: 91.8, override: 7.4 },
];

const overrideReasons = [
  { reason: 'Additional information received', count: 34 },
  { reason: 'Professional judgement', count: 28 },
  { reason: 'Applicant circumstances changed', count: 22 },
  { reason: 'Policy exception granted', count: 12 },
  { reason: 'Incorrect data input', count: 8 },
];

const biasMetrics = [
  { characteristic: 'Age', category: '18-30', total: 287, accepted: 88.2, overridden: 9.1, pValue: 0.42, status: 'no_bias' },
  { characteristic: 'Age', category: '31-45', total: 412, accepted: 89.8, overridden: 7.8, pValue: 0.67, status: 'no_bias' },
  { characteristic: 'Age', category: '46-60', total: 356, accepted: 89.3, overridden: 8.4, pValue: 0.71, status: 'no_bias' },
  { characteristic: 'Age', category: '60+', total: 192, accepted: 87.5, overridden: 9.9, pValue: 0.38, status: 'no_bias' },
  { characteristic: 'Gender', category: 'Male', total: 623, accepted: 89.4, overridden: 8.2, pValue: 0.82, status: 'no_bias' },
  { characteristic: 'Gender', category: 'Female', total: 624, accepted: 88.8, overridden: 8.5, pValue: 0.82, status: 'no_bias' },
  { characteristic: 'Region', category: 'Central Belt', total: 534, accepted: 90.1, overridden: 7.1, pValue: 0.45, status: 'no_bias' },
  { characteristic: 'Region', category: 'Highland & Islands', total: 143, accepted: 81.8, overridden: 18.2, pValue: 0.003, status: 'flagged' },
  { characteristic: 'Region', category: 'South Scotland', total: 298, accepted: 89.9, overridden: 8.1, pValue: 0.56, status: 'no_bias' },
  { characteristic: 'Region', category: 'North East', total: 272, accepted: 89.3, overridden: 8.5, pValue: 0.61, status: 'no_bias' },
  { characteristic: 'Employment', category: 'Employed', total: 687, accepted: 90.2, overridden: 7.5, pValue: 0.34, status: 'no_bias' },
  { characteristic: 'Employment', category: 'Unemployed/Retired', total: 560, accepted: 87.7, overridden: 9.5, pValue: 0.28, status: 'no_bias' },
];

const modelPerformance = [
  { product: 'DAS', accuracy: 94.2, cases: 412, lastEvaluated: '18 Aug 2026' },
  { product: 'MAP', accuracy: 91.0, cases: 198, lastEvaluated: '18 Aug 2026' },
  { product: 'PTD', accuracy: 78.4, cases: 156, lastEvaluated: '18 Aug 2026' },
  { product: 'Sequestration', accuracy: 82.1, cases: 87, lastEvaluated: '18 Aug 2026' },
  { product: 'Signposting', accuracy: 96.3, cases: 287, lastEvaluated: '18 Aug 2026' },
  { product: 'DPP', accuracy: 88.7, cases: 107, lastEvaluated: '18 Aug 2026' },
];

const auditLog = [
  { time: '19 Aug 2026, 09:42', caseRef: 'IAAS-2026-04821', recommended: 'DAS', confidence: 94.1, action: 'Accepted', officer: 'Karen MacLeod', overrideReason: '' },
  { time: '19 Aug 2026, 09:38', caseRef: 'DAS-2026-01187', recommended: 'DAS', confidence: 91.7, action: 'Accepted', officer: 'James Wilson', overrideReason: '' },
  { time: '19 Aug 2026, 09:15', caseRef: 'IAAS-2026-04819', recommended: 'MAP', confidence: 87.3, action: 'Overridden', officer: 'Sarah Mitchell', overrideReason: 'Additional info: applicant now employed' },
  { time: '19 Aug 2026, 08:54', caseRef: 'IAAS-2026-04817', recommended: 'Sequestration', confidence: 83.6, action: 'Accepted', officer: 'Karen MacLeod', overrideReason: '' },
  { time: '19 Aug 2026, 08:31', caseRef: 'DAS-2026-01185', recommended: 'DAS', confidence: 96.2, action: 'Accepted', officer: 'James Wilson', overrideReason: '' },
  { time: '19 Aug 2026, 08:12', caseRef: 'IAAS-2026-04815', recommended: 'PTD', confidence: 72.4, action: 'Overridden', officer: 'Sarah Mitchell', overrideReason: 'Professional judgement: PTD more appropriate given property' },
  { time: '18 Aug 2026, 17:45', caseRef: 'IAAS-2026-04812', recommended: 'DAS', confidence: 89.5, action: 'Accepted', officer: 'Karen MacLeod', overrideReason: '' },
  { time: '18 Aug 2026, 17:22', caseRef: 'IAAS-2026-04810', recommended: 'MAP', confidence: 90.1, action: 'Accepted', officer: 'James Wilson', overrideReason: '' },
  { time: '18 Aug 2026, 16:58', caseRef: 'DAS-2026-01182', recommended: 'DAS', confidence: 93.8, action: 'Accepted', officer: 'Sarah Mitchell', overrideReason: '' },
  { time: '18 Aug 2026, 16:33', caseRef: 'IAAS-2026-04808', recommended: 'Signposting', confidence: 97.1, action: 'Accepted', officer: 'Karen MacLeod', overrideReason: '' },
  { time: '18 Aug 2026, 16:01', caseRef: 'IAAS-2026-04806', recommended: 'DPP', confidence: 85.9, action: 'Accepted', officer: 'James Wilson', overrideReason: '' },
  { time: '18 Aug 2026, 15:44', caseRef: 'IAAS-2026-04804', recommended: 'DAS', confidence: 88.2, action: 'Overridden', officer: 'Karen MacLeod', overrideReason: 'Circumstances changed: moratorium now active' },
  { time: '18 Aug 2026, 15:18', caseRef: 'IAAS-2026-04802', recommended: 'PTD', confidence: 76.8, action: 'Accepted', officer: 'Sarah Mitchell', overrideReason: '' },
  { time: '18 Aug 2026, 14:55', caseRef: 'DAS-2026-01179', recommended: 'DAS', confidence: 92.4, action: 'Accepted', officer: 'James Wilson', overrideReason: '' },
  { time: '18 Aug 2026, 14:30', caseRef: 'IAAS-2026-04800', recommended: 'Sequestration', confidence: 81.3, action: 'Accepted', officer: 'Karen MacLeod', overrideReason: '' },
];

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 90) return 'text-green-700';
  if (accuracy >= 80) return 'text-amber-700';
  return 'text-red-700';
}

function getAccuracyBg(accuracy: number): string {
  if (accuracy >= 90) return 'bg-green-50';
  if (accuracy >= 80) return 'bg-amber-50';
  return 'bg-red-50';
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'no_bias') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        No Bias Detected
      </span>
    );
  }
  if (status === 'flagged') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Flagged for Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
      Under Review
    </span>
  );
}

export default function AIGovernancePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Governance Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Oversight of AI-powered recommendation decisions — Accountant in Bankruptcy
        </p>
      </div>

      {/* Section 1: Active Alerts */}
      <div className="space-y-3">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-600">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
              CRITICAL
            </span>
            <p className="text-sm text-gray-900">
              PTD recommendation confidence has dropped below 80% threshold for 3 consecutive weeks. Review triggered — assigned to Robert Anderson.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-amber-500">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
              WARNING
            </span>
            <p className="text-sm text-gray-900">
              Geographic bias flag: Highland &amp; Islands region override rate (18.2%) is 2.1x the national average (8.7%). Investigation pending.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
          <p className="text-sm text-gray-600">Recommendations Generated</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">1,247</p>
          <p className="text-xs text-gray-500 mt-1">Last 12 weeks</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
          <p className="text-sm text-gray-600">Staff Accepted</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">89.1%</p>
          <p className="text-xs text-gray-500 mt-1">1,111 recommendations</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-amber-500">
          <p className="text-sm text-gray-600">Overridden</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">8.3%</p>
          <p className="text-xs text-gray-500 mt-1">104 recommendations</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-gray-400">
          <p className="text-sm text-gray-600">Pending Review</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">2.6%</p>
          <p className="text-xs text-gray-500 mt-1">32 recommendations</p>
        </div>
      </div>

      {/* Section 3: Two-column chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Confidence Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={confidenceDistribution}>
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1d70b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Acceptance & Override Trend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acceptance &amp; Override Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={acceptanceOverrideTrend}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
              <Line type="monotone" dataKey="acceptance" stroke="#00703c" strokeWidth={2} name="Acceptance %" dot={false} />
              <Line type="monotone" dataKey="override" stroke="#f47738" strokeWidth={2} name="Override %" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section 4: Override Reasons */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Override Reasons</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={overrideReasons} layout="vertical" margin={{ left: 180 }}>
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="reason" tick={{ fontSize: 12 }} width={170} />
            <Tooltip />
            <Bar dataKey="count" fill="#f47738" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Section 5: Bias / Fairness Metrics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bias / Fairness Metrics</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Characteristic</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Total</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Accepted %</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Overridden %</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">p-Value</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {biasMetrics.map((row, idx) => (
                <tr key={idx} className={`border-t border-gray-100 ${row.status === 'flagged' ? 'bg-red-50' : ''}`}>
                  <td className="py-3 px-4 text-gray-900">{row.characteristic}</td>
                  <td className="py-3 px-4 text-gray-900">{row.category}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{row.total}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{row.accepted}%</td>
                  <td className="py-3 px-4 text-right text-gray-900">{row.overridden}%</td>
                  <td className="py-3 px-4 text-right text-gray-900">{row.pValue}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 6: Model Performance */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Model Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Accuracy</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Cases Evaluated</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Last Evaluated</th>
              </tr>
            </thead>
            <tbody>
              {modelPerformance.map((row, idx) => (
                <tr key={idx} className={`border-t border-gray-100 ${getAccuracyBg(row.accuracy)}`}>
                  <td className="py-3 px-4 font-medium text-gray-900">{row.product}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${getAccuracyColor(row.accuracy)}`}>
                    {row.accuracy}%
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">{row.cases}</td>
                  <td className="py-3 px-4 text-gray-900">{row.lastEvaluated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 7: Model Registry */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Model Registry</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Current Version</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">Rules v2.3</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">AI Assist</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">Enabled</p>
            <p className="text-xs text-gray-500">Anomaly detection + confidence calibration</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Last Updated</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">14 Aug 2026</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Next Scheduled Review</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">14 Nov 2026</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Responsible Officer</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">Karen MacLeod</p>
            <p className="text-xs text-gray-500">Senior Officer</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Approval Status</p>
            <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Approved
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Approved By</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">Robert Anderson</p>
            <p className="text-xs text-gray-500">Head of Digital</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Approval Date</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">12 Aug 2026</p>
          </div>
        </div>
      </div>

      {/* Section 8: Decision Audit Log */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Decision Audit Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Case Ref</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Recommended</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Confidence</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Staff Action</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Officer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Override Reason</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((row, idx) => (
                <tr key={idx} className={`border-t border-gray-100 ${row.action === 'Overridden' ? 'bg-amber-50' : ''}`}>
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{row.time}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-900">{row.caseRef}</td>
                  <td className="py-3 px-4 text-gray-900">{row.recommended}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{row.confidence}%</td>
                  <td className="py-3 px-4">
                    {row.action === 'Accepted' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Accepted
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        Overridden
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.officer}</td>
                  <td className="py-3 px-4 text-gray-600 text-xs">{row.overrideReason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
