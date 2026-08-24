'use client';

import { useState, type ReactElement } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { MOCK_DOCUMENTS } from './data/mock-documents';
import { WORKFLOWS } from './data/mock-workflows';
import { DAILY_STATS, DOC_TYPE_ACCURACY, PROCESSING_TIME_BY_STAGE } from './data/mock-stats';
import { MailroomDocument, NEREntity } from './data/types';

const CHART_COLORS = ['#1d70b8', '#00703c', '#f47738', '#d4351c', '#4c2c92', '#5694ca', '#28a197'];

// --- Helpers ---

function getStatusColor(status: string): string {
  switch (status) {
    case 'complete': return 'bg-green-100 text-green-800';
    case 'scanning':
    case 'ocr_processing':
    case 'classifying':
    case 'routing': return 'bg-amber-100 text-amber-800';
    case 'human_review': return 'bg-purple-100 text-purple-800';
    case 'failed': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return 'bg-green-100 text-green-800';
  if (confidence >= 75) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

function getPriorityBadge(priority: string) {
  if (priority === 'urgent') return <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800">URGENT</span>;
  if (priority === 'high') return <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">HIGH</span>;
  return null;
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + formatTime(isoString);
}

function getNERColor(type: string): string {
  switch (type) {
    case 'person_name': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'ni_number': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'amount': return 'bg-green-100 text-green-800 border-green-300';
    case 'date': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'address': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'court_name': return 'bg-pink-100 text-pink-800 border-pink-300';
    case 'case_reference': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

function getNERLabel(type: string): string {
  switch (type) {
    case 'person_name': return 'Person Name';
    case 'ni_number': return 'NI Number';
    case 'amount': return 'Amount';
    case 'date': return 'Date';
    case 'address': return 'Address';
    case 'court_name': return 'Court Name';
    case 'case_reference': return 'Case Reference';
    default: return type;
  }
}

// --- Main Page Component ---

export default function DigitalMailroomPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'workflows' | 'stats' | 'outbound'>('dashboard');

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard' },
    { id: 'queue' as const, label: 'Document Queue' },
    { id: 'workflows' as const, label: 'Workflows & Rules' },
    { id: 'stats' as const, label: 'Processing Stats' },
    { id: 'outbound' as const, label: '📤 Outbound' },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Digital Mailroom</h1>
        <p className="text-gray-600 mt-1">Automated document ingestion, classification, and routing pipeline</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-[#1d70b8] text-[#1d70b8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'queue' && <DocumentQueueTab />}
      {activeTab === 'workflows' && <WorkflowsTab />}
      {activeTab === 'stats' && <ProcessingStatsTab />}
      {activeTab === 'outbound' && <OutboundTab />}
    </div>
  );
}

// =====================================================
// TAB 1: Dashboard
// =====================================================

function DashboardTab() {
  const todayDocs = MOCK_DOCUMENTS.filter(d => d.receivedAt.startsWith('2026-08-21'));
  const documentsToday = todayDocs.length;
  const completeDocs = MOCK_DOCUMENTS.filter(d => d.status === 'complete');
  const processingRate = ((completeDocs.length / MOCK_DOCUMENTS.length) * 100).toFixed(1);
  const autoRouted = MOCK_DOCUMENTS.filter(d => d.pipeline.routing.status === 'routed').length;
  const autoRoutedPct = ((autoRouted / MOCK_DOCUMENTS.length) * 100).toFixed(0);
  const humanReviewCount = MOCK_DOCUMENTS.filter(d => d.status === 'human_review').length;

  // Pipeline stage counts
  const scanningCount = MOCK_DOCUMENTS.filter(d => d.status === 'scanning').length;
  const ocrCount = MOCK_DOCUMENTS.filter(d => d.status === 'ocr_processing').length;
  const classifyingCount = MOCK_DOCUMENTS.filter(d => d.status === 'classifying').length;
  const routingCount = MOCK_DOCUMENTS.filter(d => d.status === 'routing').length;
  const completeCount = completeDocs.length;

  // Doc type distribution
  const typeDistribution = MOCK_DOCUMENTS
    .filter(d => d.pipeline.classification.docType)
    .reduce((acc, d) => {
      const type = d.pipeline.classification.docType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  const pieData = Object.entries(typeDistribution).map(([name, value]) => ({ name, value }));

  // Confidence distribution
  const confBuckets = [
    { range: '50-60%', count: 0 },
    { range: '60-70%', count: 0 },
    { range: '70-80%', count: 0 },
    { range: '80-90%', count: 0 },
    { range: '90-100%', count: 0 },
  ];
  MOCK_DOCUMENTS.forEach(d => {
    const c = d.pipeline.ocr.confidence;
    if (c >= 90) confBuckets[4].count++;
    else if (c >= 80) confBuckets[3].count++;
    else if (c >= 70) confBuckets[2].count++;
    else if (c >= 60) confBuckets[1].count++;
    else if (c >= 50) confBuckets[0].count++;
  });

  // Recent activity (last 8)
  const recentDocs = [...MOCK_DOCUMENTS]
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-[#1d70b8]">
          <p className="text-sm text-gray-500">Documents Today</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{documentsToday}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-[#00703c]">
          <p className="text-sm text-gray-500">Processing Rate</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{processingRate}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-[#00703c]">
          <p className="text-sm text-gray-500">Auto-Routed</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{autoRoutedPct}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-[#f47738]">
          <p className="text-sm text-gray-500">Human Review Queue</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{humanReviewCount}</p>
        </div>
      </div>

      {/* Pipeline Visualizer */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Status</h3>
        <div className="flex items-center justify-between px-4">
          {[
            { name: 'Scanning', count: scanningCount },
            { name: 'OCR', count: ocrCount },
            { name: 'Classifying', count: classifyingCount },
            { name: 'Routing', count: routingCount },
            { name: 'Complete', count: completeCount },
          ].map((stage, idx, arr) => (
            <div key={stage.name} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  stage.count === 0 ? 'bg-green-500' : idx === arr.length - 1 ? 'bg-green-500' : 'bg-[#1d70b8]'
                }`}>
                  {stage.count}
                </div>
                <span className="text-xs text-gray-600 mt-2 font-medium">{stage.name}</span>
              </div>
              {idx < arr.length - 1 && (
                <div className="w-12 h-0.5 bg-gray-300 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Type Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Type Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name} (${value})`}
                labelLine={true}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">OCR Confidence Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={confBuckets}>
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#1d70b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {recentDocs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-4 min-w-0">
                <span className="text-sm text-gray-500 w-12 flex-shrink-0">{formatTime(doc.receivedAt)}</span>
                <span className="text-sm font-medium text-gray-900 truncate">{doc.filename}</span>
                {getPriorityBadge(doc.priority)}
              </div>
              <div className="flex items-center space-x-3 flex-shrink-0">
                {doc.pipeline.classification.docType && (
                  <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700">{doc.pipeline.classification.docType}</span>
                )}
                {doc.pipeline.ocr.confidence > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded ${getConfidenceColor(doc.pipeline.ocr.confidence)}`}>
                    {doc.pipeline.ocr.confidence}%
                  </span>
                )}
                <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(doc.status)}`}>
                  {doc.status.replace('_', ' ')}
                </span>
                {doc.pipeline.routing.destination && (
                  <span className="text-xs text-gray-500">→ {doc.pipeline.routing.destination}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// TAB 2: Document Queue
// =====================================================

function DocumentQueueTab() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [confFilter, setConfFilter] = useState<string>('all');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const filteredDocs = MOCK_DOCUMENTS.filter(doc => {
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
    if (typeFilter !== 'all' && doc.pipeline.classification.docType !== typeFilter) return false;
    if (sourceFilter !== 'all' && doc.source !== sourceFilter) return false;
    if (confFilter === 'high' && doc.pipeline.ocr.confidence < 90) return false;
    if (confFilter === 'medium' && (doc.pipeline.ocr.confidence < 75 || doc.pipeline.ocr.confidence >= 90)) return false;
    if (confFilter === 'low' && doc.pipeline.ocr.confidence >= 75) return false;
    return true;
  });

  const docTypes = [...new Set(MOCK_DOCUMENTS.map(d => d.pipeline.classification.docType).filter(Boolean))];

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d70b8]"
            >
              <option value="all">All Statuses</option>
              <option value="scanning">Scanning</option>
              <option value="ocr_processing">OCR Processing</option>
              <option value="classifying">Classifying</option>
              <option value="routing">Routing</option>
              <option value="complete">Complete</option>
              <option value="human_review">Human Review</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Document Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d70b8]"
            >
              <option value="all">All Types</option>
              {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d70b8]"
            >
              <option value="all">All Sources</option>
              <option value="post">Post</option>
              <option value="email">Email</option>
              <option value="fax">Fax</option>
              <option value="portal_upload">Portal Upload</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confidence</label>
            <select
              value={confFilter}
              onChange={(e) => setConfFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d70b8]"
            >
              <option value="all">All</option>
              <option value="high">High (&gt;90%)</option>
              <option value="medium">Medium (75-90%)</option>
              <option value="low">Low (&lt;75%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Received</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Filename</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Confidence</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Routed To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDocs.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                isExpanded={expandedDoc === doc.id}
                onToggle={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
              />
            ))}
          </tbody>
        </table>
        {filteredDocs.length === 0 && (
          <div className="text-center py-8 text-gray-500">No documents match the current filters.</div>
        )}
      </div>
    </div>
  );
}

function DocumentRow({ doc, isExpanded, onToggle }: { doc: MailroomDocument; isExpanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-gray-500">{formatDateTime(doc.receivedAt)}</td>
        <td className="px-4 py-3 font-medium text-gray-900">
          {doc.filename}
          {getPriorityBadge(doc.priority)}
        </td>
        <td className="px-4 py-3">
          {doc.pipeline.classification.docType ? (
            <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700">{doc.pipeline.classification.docType}</span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-gray-600 capitalize">{doc.source.replace('_', ' ')}</td>
        <td className="px-4 py-3">
          {doc.pipeline.ocr.confidence > 0 ? (
            <span className={`px-2 py-0.5 text-xs rounded font-medium ${getConfidenceColor(doc.pipeline.ocr.confidence)}`}>
              {doc.pipeline.ocr.confidence}%
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 text-xs rounded font-medium ${getStatusColor(doc.status)}`}>
            {doc.status.replace('_', ' ')}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-600">
          {doc.pipeline.routing.destination || '—'}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="px-4 py-0">
            <DocumentDetail doc={doc} />
          </td>
        </tr>
      )}
    </>
  );
}

function DocumentDetail({ doc }: { doc: MailroomDocument }) {
  const pipelineStages = [
    { name: 'Virus Scan', status: doc.pipeline.virusScan.status, completedAt: doc.pipeline.virusScan.completedAt },
    { name: 'OCR', status: doc.pipeline.ocr.status, completedAt: doc.pipeline.ocr.completedAt },
    { name: 'NER', status: doc.pipeline.ner.status, completedAt: doc.pipeline.ner.completedAt },
    { name: 'Classification', status: doc.pipeline.classification.status, completedAt: doc.pipeline.classification.completedAt },
    { name: 'Routing', status: doc.pipeline.routing.status, completedAt: doc.pipeline.routing.completedAt },
  ];

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 my-3 space-y-5">
      {/* Pipeline Stepper */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Pipeline Progress</h4>
        <div className="flex items-center space-x-2">
          {pipelineStages.map((stage, idx) => (
            <div key={stage.name} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  stage.status === 'pass' || stage.status === 'complete' || stage.status === 'routed'
                    ? 'bg-green-500 text-white'
                    : stage.status === 'fail' || stage.status === 'failed'
                    ? 'bg-red-500 text-white'
                    : stage.status === 'manual'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {stage.status === 'pass' || stage.status === 'complete' || stage.status === 'routed' ? '✓' :
                   stage.status === 'fail' || stage.status === 'failed' ? '✗' :
                   stage.status === 'manual' ? '!' : '·'}
                </div>
                <span className="text-xs text-gray-600 mt-1">{stage.name}</span>
                {stage.completedAt && (
                  <span className="text-xs text-gray-400">{formatTime(stage.completedAt)}</span>
                )}
              </div>
              {idx < pipelineStages.length - 1 && <div className="w-8 h-0.5 bg-gray-300 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* OCR Text with NER Highlighting */}
      {doc.pipeline.ocr.extractedText && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Extracted Text (OCR)</h4>
          <div className="bg-white border border-gray-200 rounded p-3 text-sm text-gray-700 leading-relaxed">
            <HighlightedText text={doc.pipeline.ocr.extractedText} entities={doc.pipeline.ner.entities} />
          </div>
          {/* NER Legend */}
          <div className="flex flex-wrap gap-2 mt-2">
            {['person_name', 'ni_number', 'amount', 'date', 'address', 'court_name', 'case_reference'].map(type => (
              <span key={type} className={`px-2 py-0.5 text-xs rounded border ${getNERColor(type)}`}>
                {getNERLabel(type)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Classification */}
      {doc.pipeline.classification.docType && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Classification</h4>
          <p className="text-sm text-gray-700">
            Classified as: <span className="font-semibold">{doc.pipeline.classification.docType}</span>{' '}
            <span className={`px-2 py-0.5 text-xs rounded ${getConfidenceColor(doc.pipeline.classification.confidence)}`}>
              {doc.pipeline.classification.confidence}%
            </span>
          </p>
          {doc.pipeline.classification.alternatives && doc.pipeline.classification.alternatives.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Alternative classifications:</p>
              <div className="flex flex-wrap gap-2">
                {doc.pipeline.classification.alternatives.map((alt, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                    {alt.type} ({alt.score}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NER Entities Table */}
      {doc.pipeline.ner.entities.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Named Entities Extracted</h4>
          <table className="w-full text-sm border border-gray-200 rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Type</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Value</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Confidence</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Mapped Field</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doc.pipeline.ner.entities.map((entity, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 text-xs rounded border ${getNERColor(entity.type)}`}>
                      {getNERLabel(entity.type)}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-800">{entity.value}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${getConfidenceColor(entity.confidence * 100)}`}>
                      {(entity.confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{getMappedField(entity.type)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Routing */}
      {doc.pipeline.routing.destination && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Routing Decision</h4>
          <div className="bg-white border border-gray-200 rounded p-3 text-sm">
            <p>
              <span className="text-gray-500">Routed to:</span>{' '}
              <span className="font-semibold text-[#1d70b8]">{doc.pipeline.routing.destination}</span>
              {doc.pipeline.routing.caseRef && (
                <>
                  {' '}<span className="text-gray-500">•</span>{' '}
                  <span className="text-gray-500">Case:</span>{' '}
                  <span className="font-mono font-semibold">{doc.pipeline.routing.caseRef}</span>
                </>
              )}
            </p>
            <p className="text-gray-600 mt-1">
              <span className="text-gray-500">Reason:</span> {doc.pipeline.routing.reason}
            </p>
          </div>
        </div>
      )}

      {/* Workflow */}
      {doc.workflowTriggered && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Workflow Triggered</h4>
          <div className="bg-white border border-green-200 rounded p-3">
            <p className="text-sm font-semibold text-green-800 mb-2">{doc.workflowTriggered.name}</p>
            <ol className="space-y-1">
              {doc.workflowTriggered.actions.map((action, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ol>
            <p className="text-xs text-gray-400 mt-2">Triggered at {formatDateTime(doc.workflowTriggered.triggeredAt)}</p>
          </div>
        </div>
      )}

      {/* Case Allocation */}
      {doc.caseAllocation && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Case Allocation</h4>
          <div className="bg-white border border-gray-200 rounded p-3 text-sm">
            <p>
              {doc.caseAllocation.matched ? (
                <>
                  <span className="text-green-700 font-medium">Matched</span> to case{' '}
                  <span className="font-mono font-semibold">{doc.caseAllocation.caseRef}</span>{' '}
                  via <span className="italic">{doc.caseAllocation.method}</span>{' '}
                  <span className={`px-2 py-0.5 text-xs rounded ${getConfidenceColor(doc.caseAllocation.confidence)}`}>
                    {doc.caseAllocation.confidence}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-gray-600">{doc.caseAllocation.method}</span>
                  {doc.caseAllocation.caseRef && (
                    <> — New case: <span className="font-mono font-semibold">{doc.caseAllocation.caseRef}</span></>
                  )}
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function HighlightedText({ text, entities }: { text: string; entities: NEREntity[] }) {
  if (!entities || entities.length === 0) {
    return <span>{text}</span>;
  }

  // For entities with positions, highlight them; for those without, show text as-is
  // We'll highlight by matching entity values in text
  let highlighted = text;
  const replacements: Array<{ value: string; type: string }> = [];

  // Sort entities by value length (longest first) to avoid partial replacements
  const sortedEntities = [...entities]
    .filter(e => e.value.length > 1)
    .sort((a, b) => b.value.length - a.value.length);

  // Build segments
  const segments: Array<{ text: string; type?: string }> = [];
  let remaining = text;

  // Simple approach: find and highlight entity values in text
  const entityValues = sortedEntities.map(e => ({ value: e.value, type: e.type }));

  // Create a map of positions
  type Segment = { start: number; end: number; type: string };
  const positions: Segment[] = [];

  entityValues.forEach(({ value, type }) => {
    let searchFrom = 0;
    while (true) {
      const idx = text.indexOf(value, searchFrom);
      if (idx === -1) break;
      // Check for overlap
      const overlaps = positions.some(p => idx < p.end && idx + value.length > p.start);
      if (!overlaps) {
        positions.push({ start: idx, end: idx + value.length, type });
      }
      searchFrom = idx + 1;
    }
  });

  // Sort positions by start
  positions.sort((a, b) => a.start - b.start);

  // Build output
  const parts: ReactElement[] = [];
  let lastEnd = 0;

  positions.forEach((pos, i) => {
    if (pos.start > lastEnd) {
      parts.push(<span key={`t-${i}`}>{text.slice(lastEnd, pos.start)}</span>);
    }
    parts.push(
      <span key={`e-${i}`} className={`px-0.5 rounded border ${getNERColor(pos.type)}`}>
        {text.slice(pos.start, pos.end)}
      </span>
    );
    lastEnd = pos.end;
  });

  if (lastEnd < text.length) {
    parts.push(<span key="end">{text.slice(lastEnd)}</span>);
  }

  return <>{parts}</>;
}

function getMappedField(type: string): string {
  switch (type) {
    case 'person_name': return 'Debtor Name';
    case 'ni_number': return 'National Insurance No.';
    case 'amount': return 'Financial Amount';
    case 'date': return 'Key Date';
    case 'address': return 'Debtor Address';
    case 'court_name': return 'Court / Jurisdiction';
    case 'case_reference': return 'Case Reference';
    default: return '—';
  }
}

// =====================================================
// TAB 3: Workflows & Rules
// =====================================================

function WorkflowsTab() {
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);

  const activeCount = WORKFLOWS.filter(w => w.active).length;
  const triggeredToday = 12;
  const autoActionsToday = 34;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5 text-center">
          <p className="text-sm text-gray-500">Active Workflows</p>
          <p className="text-3xl font-bold text-[#1d70b8] mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 text-center">
          <p className="text-sm text-gray-500">Triggered Today</p>
          <p className="text-3xl font-bold text-[#00703c] mt-1">{triggeredToday}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 text-center">
          <p className="text-sm text-gray-500">Auto-Actions Today</p>
          <p className="text-3xl font-bold text-[#00703c] mt-1">{autoActionsToday}</p>
        </div>
      </div>

      {/* Workflow Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Workflow Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Document Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Trigger Condition</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Last Triggered</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">This Month</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {WORKFLOWS.map((wf) => (
              <>
                <tr
                  key={wf.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setExpandedWorkflow(expandedWorkflow === wf.id ? null : wf.id)}
                >
                  <td className="px-4 py-3">
                    <span className={`w-3 h-3 rounded-full inline-block ${wf.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{wf.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700">{wf.docType}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-[280px]">{wf.triggerCondition}</td>
                  <td className="px-4 py-3 text-gray-600">{wf.actions.length} steps</td>
                  <td className="px-4 py-3 text-gray-500">{wf.lastTriggered}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{wf.triggeredThisMonth}</td>
                </tr>
                {expandedWorkflow === wf.id && (
                  <tr key={`${wf.id}-detail`}>
                    <td colSpan={7} className="px-4 py-0">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-3">
                        <h4 className="font-semibold text-gray-900 mb-3">Action Steps</h4>
                        <div className="space-y-2">
                          {wf.actions.map((action) => (
                            <div key={action.step} className="flex items-center">
                              <span className="w-6 h-6 rounded-full bg-[#1d70b8] text-white text-xs flex items-center justify-center mr-3 flex-shrink-0">
                                {action.step}
                              </span>
                              <span className="text-sm text-gray-700 flex-1">{action.action}</span>
                              <span className="px-2 py-0.5 text-xs rounded bg-indigo-50 text-indigo-700 ml-3">
                                {action.target}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <span className="font-semibold">Note:</span> Workflows execute automatically when document classification confidence meets threshold. Low-confidence documents bypass automation and enter the human review queue.
        </p>
      </div>
    </div>
  );
}

// =====================================================
// TAB 4: Processing Stats
// =====================================================

function ProcessingStatsTab() {
  // Auto-route success rate data (derived from daily stats)
  const autoRouteRate = DAILY_STATS.map(d => ({
    date: d.date,
    rate: d.received > 0 ? Math.round((d.autoRouted / d.received) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Daily Volume Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Document Volume (30 days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={DAILY_STATS}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="received" stroke="#1d70b8" strokeWidth={2} name="Received" dot={false} />
            <Line type="monotone" dataKey="processed" stroke="#00703c" strokeWidth={2} name="Processed" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Processing Time by Stage */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Processing Time by Stage</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={PROCESSING_TIME_BY_STAGE} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11 }} unit="ms" />
            <YAxis type="category" dataKey="stage" width={100} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [`${value}ms`, 'Avg Time']} />
            <Bar dataKey="avgMs" radius={[0, 4, 4, 0]}>
              {PROCESSING_TIME_BY_STAGE.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Auto-Route Success Rate */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-Route Success Rate (30 days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={autoRouteRate}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis domain={[75, 100]} unit="%" />
            <Tooltip formatter={(value: number) => [`${value}%`, 'Auto-Route Rate']} />
            <Line type="monotone" dataKey="rate" stroke="#00703c" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Classification Accuracy Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification Accuracy by Document Type</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Document Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Total Classified</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Correct</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Overridden</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Accuracy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {DOC_TYPE_ACCURACY.map((row) => (
              <tr key={row.type} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{row.type}</td>
                <td className="px-4 py-3 text-gray-600">{row.total}</td>
                <td className="px-4 py-3 text-gray-600">{row.correct}</td>
                <td className="px-4 py-3 text-gray-600">{row.overridden}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                    row.accuracy >= 95 ? 'bg-green-100 text-green-800' :
                    row.accuracy >= 90 ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {row.accuracy}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =====================================================
// TAB 5: Outbound Correspondence
// =====================================================

const TEMPLATES = [
  { id: 'ack', name: 'Application Acknowledgement', desc: 'Confirms receipt of application and outlines next steps', sentThisMonth: 47, avgTime: '< 1 min' },
  { id: 'info', name: 'Request for Additional Information', desc: 'Requests missing documents with 14-day deadline', sentThisMonth: 23, avgTime: '< 1 min' },
  { id: 'approved', name: 'Decision Notification — Approved', desc: 'Informs applicant of successful recommendation and assigned adviser', sentThisMonth: 31, avgTime: '< 1 min' },
  { id: 'rejected', name: 'Decision Notification — Rejected', desc: 'Explains rejection reasons and alternative options', sentThisMonth: 8, avgTime: '< 1 min' },
  { id: 'referral', name: 'Referral to Money Adviser', desc: 'Refers applicant to accredited money adviser organisation', sentThisMonth: 19, avgTime: '< 1 min' },
];

const SENT_LOG = [
  { ref: 'CORR-2026-00412', template: 'Application Acknowledgement', recipient: 'Alistair Morrison', caseRef: 'IAAS-2026-00012', sentAt: '21 Aug 2026 09:14', officer: 'Karen MacLeod', channel: 'Email' },
  { ref: 'CORR-2026-00411', template: 'Decision Notification — Approved', recipient: 'Margaret Wilson', caseRef: 'IAAS-2026-00003', sentAt: '21 Aug 2026 08:52', officer: 'James Wilson', channel: 'Email + Post' },
  { ref: 'CORR-2026-00410', template: 'Request for Additional Information', recipient: 'Craig Stewart', caseRef: 'IAAS-2026-00010', sentAt: '20 Aug 2026 16:30', officer: 'Sarah Mitchell', channel: 'Email' },
  { ref: 'CORR-2026-00409', template: 'Referral to Money Adviser', recipient: 'Diana Murray', caseRef: 'IAAS-2026-00009', sentAt: '20 Aug 2026 14:15', officer: 'Karen MacLeod', channel: 'Email + Post' },
  { ref: 'CORR-2026-00408', template: 'Application Acknowledgement', recipient: 'Brenda Campbell', caseRef: 'IAAS-2026-00011', sentAt: '20 Aug 2026 11:20', officer: 'James Wilson', channel: 'Email' },
  { ref: 'CORR-2026-00407', template: 'Decision Notification — Rejected', recipient: 'Derek Smith', caseRef: 'IAAS-2026-00004', sentAt: '19 Aug 2026 15:45', officer: 'Sarah Mitchell', channel: 'Email + Post' },
  { ref: 'CORR-2026-00406', template: 'Decision Notification — Approved', recipient: 'Eleanor MacPherson', caseRef: 'IAAS-2026-00008', sentAt: '19 Aug 2026 10:30', officer: 'Karen MacLeod', channel: 'Email' },
  { ref: 'CORR-2026-00405', template: 'Request for Additional Information', recipient: 'Craig Henderson', caseRef: 'IAAS-2026-00006', sentAt: '18 Aug 2026 14:00', officer: 'James Wilson', channel: 'Email' },
];

function OutboundTab() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-[#1d70b8]">
          <p className="text-2xl font-bold text-gray-900">128</p>
          <p className="text-sm text-gray-600">Sent This Month</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-[#00703c]">
          <p className="text-2xl font-bold text-gray-900">12</p>
          <p className="text-sm text-gray-600">Sent Today</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-[#4c2c92]">
          <p className="text-2xl font-bold text-gray-900">67%</p>
          <p className="text-sm text-gray-600">Email Only</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-[#f47738]">
          <p className="text-2xl font-bold text-gray-900">33%</p>
          <p className="text-sm text-gray-600">Email + Post</p>
        </div>
      </div>

      {/* Template Library */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Letter Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map(t => (
            <div key={t.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#1d70b8] transition-colors">
              <h4 className="font-bold text-sm text-gray-900 mb-1">{t.name}</h4>
              <p className="text-xs text-gray-600 mb-3">{t.desc}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Sent this month: <strong>{t.sentThisMonth}</strong></span>
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sent Correspondence */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sent Correspondence</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Reference</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Template</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Recipient</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Case</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Sent</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Officer</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Channel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {SENT_LOG.map(entry => (
                <tr key={entry.ref} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{entry.ref}</td>
                  <td className="px-4 py-3 text-gray-900">{entry.template}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{entry.recipient}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#1d70b8]">{entry.caseRef}</td>
                  <td className="px-4 py-3 text-gray-600">{entry.sentAt}</td>
                  <td className="px-4 py-3 text-gray-600">{entry.officer}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${entry.channel === 'Email' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {entry.channel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POC Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>POC Note:</strong> In production, outbound correspondence would integrate with GOV.UK Notify for email/SMS delivery
          and Royal Mail API for physical post. Templates would support personalisation tokens, multi-language variants,
          and scheduled sending with delivery tracking.
        </p>
      </div>
    </div>
  );
}
