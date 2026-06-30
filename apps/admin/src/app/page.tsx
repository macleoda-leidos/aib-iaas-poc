'use client';

import { useState, useEffect } from 'react';

interface ApplicationSummary {
  id: string;
  referenceNumber: string;
  status: string;
  createdAt: string;
  submittedAt?: string;
  summary: { applicantName: string; totalDebt?: number };
}

const STATUS_COLOURS: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-purple-100 text-purple-800',
  additional_info_required: 'bg-orange-100 text-orange-800',
  recommendation_issued: 'bg-green-100 text-green-800',
  accepted: 'bg-green-200 text-green-900',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-500',
};

// Synthetic demo data for the admin portal
const DEMO_APPLICATIONS: ApplicationSummary[] = [
  // Submitted (awaiting review)
  { id: '1', referenceNumber: 'IAAS-2026-00012', status: 'submitted', createdAt: '2026-06-29T10:30:00Z', submittedAt: '2026-06-29T11:45:00Z', summary: { applicantName: 'Alistair Morrison', totalDebt: 18400 } },
  { id: '2', referenceNumber: 'IAAS-2026-00011', status: 'submitted', createdAt: '2026-06-28T14:00:00Z', submittedAt: '2026-06-28T15:20:00Z', summary: { applicantName: 'Brenda Campbell', totalDebt: 9200 } },
  { id: '3', referenceNumber: 'IAAS-2026-00010', status: 'submitted', createdAt: '2026-06-27T09:15:00Z', submittedAt: '2026-06-27T10:00:00Z', summary: { applicantName: 'Craig Stewart', totalDebt: 23100 } },
  { id: '4', referenceNumber: 'IAAS-2026-00009', status: 'submitted', createdAt: '2026-06-26T16:30:00Z', submittedAt: '2026-06-26T17:00:00Z', summary: { applicantName: 'Donna Murray', totalDebt: 6800 } },
  // Under review
  { id: '5', referenceNumber: 'IAAS-2026-00008', status: 'under_review', createdAt: '2026-06-25T11:00:00Z', submittedAt: '2026-06-25T12:00:00Z', summary: { applicantName: 'John Testerton', totalDebt: 12700 } },
  { id: '6', referenceNumber: 'IAAS-2026-00007', status: 'under_review', createdAt: '2026-06-24T10:00:00Z', submittedAt: '2026-06-24T10:30:00Z', summary: { applicantName: 'Eilidh MacKenzie', totalDebt: 31500 } },
  { id: '7', referenceNumber: 'IAAS-2026-00006', status: 'under_review', createdAt: '2026-06-23T08:45:00Z', submittedAt: '2026-06-23T09:15:00Z', summary: { applicantName: 'Fraser MacDonald', totalDebt: 7600 } },
  // Additional info required
  { id: '8', referenceNumber: 'IAAS-2026-00005', status: 'additional_info_required', createdAt: '2026-06-20T13:00:00Z', submittedAt: '2026-06-20T14:00:00Z', summary: { applicantName: 'Gavin Robertson', totalDebt: 14200 } },
  { id: '9', referenceNumber: 'IAAS-2026-00004', status: 'additional_info_required', createdAt: '2026-06-18T09:30:00Z', submittedAt: '2026-06-18T10:00:00Z', summary: { applicantName: 'Helen Douglas', totalDebt: 52000 } },
  // Recommendation issued
  { id: '10', referenceNumber: 'IAAS-2026-00003', status: 'recommendation_issued', createdAt: '2026-06-15T11:00:00Z', submittedAt: '2026-06-15T12:00:00Z', summary: { applicantName: 'Sarah Lowdebt', totalDebt: 3200 } },
  { id: '11', referenceNumber: 'IAAS-2026-00002', status: 'recommendation_issued', createdAt: '2026-06-14T10:00:00Z', submittedAt: '2026-06-14T11:00:00Z', summary: { applicantName: 'Ian Wallace', totalDebt: 28900 } },
  { id: '12', referenceNumber: 'IAAS-2026-00001', status: 'recommendation_issued', createdAt: '2026-06-12T14:30:00Z', submittedAt: '2026-06-12T15:00:00Z', summary: { applicantName: 'Margaret Highdebt', totalDebt: 45000 } },
  // Accepted
  { id: '13', referenceNumber: 'IAAS-2026-00015', status: 'accepted', createdAt: '2026-06-10T09:00:00Z', submittedAt: '2026-06-10T10:00:00Z', summary: { applicantName: 'James Midrange', totalDebt: 15600 } },
  { id: '14', referenceNumber: 'IAAS-2026-00014', status: 'accepted', createdAt: '2026-06-08T11:30:00Z', submittedAt: '2026-06-08T12:00:00Z', summary: { applicantName: 'Karen Thomson', totalDebt: 8900 } },
  // Rejected
  { id: '15', referenceNumber: 'IAAS-2026-00016', status: 'rejected', createdAt: '2026-06-05T14:00:00Z', submittedAt: '2026-06-05T15:00:00Z', summary: { applicantName: 'Lewis Brown', totalDebt: 900 } },
  // Draft
  { id: '16', referenceNumber: 'IAAS-2026-00017', status: 'draft', createdAt: '2026-06-30T08:00:00Z', summary: { applicantName: 'David Minimal', totalDebt: 8500 } },
  { id: '17', referenceNumber: 'IAAS-2026-00018', status: 'draft', createdAt: '2026-06-30T07:30:00Z', summary: { applicantName: 'Morag Patterson', totalDebt: 4200 } },
  { id: '18', referenceNumber: 'IAAS-2026-00019', status: 'draft', createdAt: '2026-06-29T16:00:00Z', summary: { applicantName: 'Neil Hamilton', totalDebt: 19800 } },
  // Withdrawn
  { id: '19', referenceNumber: 'IAAS-2026-00013', status: 'withdrawn', createdAt: '2026-06-01T10:00:00Z', submittedAt: '2026-06-01T11:00:00Z', summary: { applicantName: 'Fiona Existing', totalDebt: 11000 } },
];

export default function AdminDashboard() {
  const [applications, setApplications] = useState<ApplicationSummary[]>(DEMO_APPLICATIONS);
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = statusFilter ? applications.filter(a => a.status === statusFilter) : applications;

  const statusCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Application Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total', count: applications.length, colour: 'bg-white' },
          { label: 'Submitted', count: statusCounts['submitted'] || 0, colour: 'bg-blue-50' },
          { label: 'Under Review', count: statusCounts['under_review'] || 0, colour: 'bg-purple-50' },
          { label: 'Recommendation', count: statusCounts['recommendation_issued'] || 0, colour: 'bg-green-50' },
          { label: 'Accepted', count: statusCounts['accepted'] || 0, colour: 'bg-green-100' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.colour} border border-gray-200 p-4 rounded`}>
            <p className="text-2xl font-bold">{stat.count}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-4">
        <label className="font-bold text-sm">Filter by status:</label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 p-2 text-sm rounded">
          <option value="">All</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="recommendation_issued">Recommendation Issued</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Applications table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-3 text-sm font-bold">Reference</th>
              <th className="text-left p-3 text-sm font-bold">Applicant</th>
              <th className="text-left p-3 text-sm font-bold">Total Debt</th>
              <th className="text-left p-3 text-sm font-bold">Status</th>
              <th className="text-left p-3 text-sm font-bold">Submitted</th>
              <th className="text-left p-3 text-sm font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(app => (
              <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 text-sm font-mono">{app.referenceNumber}</td>
                <td className="p-3 text-sm">{app.summary.applicantName}</td>
                <td className="p-3 text-sm">{app.summary.totalDebt ? `£${app.summary.totalDebt.toLocaleString()}` : '-'}</td>
                <td className="p-3">
                  <span className={`inline-block px-2 py-0.5 text-xs font-bold uppercase rounded ${STATUS_COLOURS[app.status] || 'bg-gray-100'}`}>
                    {app.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '-'}
                </td>
                <td className="p-3">
                  <a href={`/applications/${app.id}`} className="text-gov-blue underline text-sm hover:text-gov-dark-blue">
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          <strong>POC Note:</strong> This admin portal demonstrates the internal review workflow.
          In production, it would integrate with AiB staff authentication (Active Directory / OIDC)
          and provide full case management capabilities.
        </p>
      </div>
    </div>
  );
}
