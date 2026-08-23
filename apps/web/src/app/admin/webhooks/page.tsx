'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: 'Active' | 'Disabled';
  lastTriggered: string;
  secret: string;
}

interface DeliveryLog {
  id: string;
  timestamp: string;
  event: string;
  url: string;
  httpStatus: number;
  responseTime: string;
}

const MOCK_WEBHOOKS: Webhook[] = [
  { id: 'wh-001', url: 'https://basys.aib.gov.uk/webhooks/iaas', events: ['application.submitted', 'case.approved'], status: 'Active', lastTriggered: '2 hours ago', secret: 'whsec_kJ7mN2pQ...' },
  { id: 'wh-002', url: 'https://eden.aib.gov.uk/api/notifications', events: ['application.submitted', 'case.approved', 'case.rejected'], status: 'Active', lastTriggered: '45 minutes ago', secret: 'whsec_xR4tY8wZ...' },
  { id: 'wh-003', url: 'https://reporting.aib.gov.uk/ingest', events: ['application.submitted', 'recommendation.generated'], status: 'Active', lastTriggered: '1 hour ago', secret: 'whsec_bN6vC3dF...' },
  { id: 'wh-004', url: 'https://old-system.example.com/hook', events: ['case.approved'], status: 'Disabled', lastTriggered: '3 weeks ago', secret: 'whsec_qW9eR1tY...' },
];

const MOCK_DELIVERY_LOG: DeliveryLog[] = [
  { id: 'del-001', timestamp: '2024-01-20 14:32:15', event: 'application.submitted', url: 'https://eden.aib.gov.uk/api/notifications', httpStatus: 200, responseTime: '142ms' },
  { id: 'del-002', timestamp: '2024-01-20 14:32:15', event: 'application.submitted', url: 'https://basys.aib.gov.uk/webhooks/iaas', httpStatus: 200, responseTime: '89ms' },
  { id: 'del-003', timestamp: '2024-01-20 14:32:16', event: 'application.submitted', url: 'https://reporting.aib.gov.uk/ingest', httpStatus: 200, responseTime: '203ms' },
  { id: 'del-004', timestamp: '2024-01-20 13:15:42', event: 'case.approved', url: 'https://eden.aib.gov.uk/api/notifications', httpStatus: 200, responseTime: '97ms' },
  { id: 'del-005', timestamp: '2024-01-20 13:15:42', event: 'case.approved', url: 'https://basys.aib.gov.uk/webhooks/iaas', httpStatus: 500, responseTime: '5012ms' },
  { id: 'del-006', timestamp: '2024-01-20 12:45:00', event: 'recommendation.generated', url: 'https://reporting.aib.gov.uk/ingest', httpStatus: 200, responseTime: '118ms' },
  { id: 'del-007', timestamp: '2024-01-20 11:30:22', event: 'application.submitted', url: 'https://old-system.example.com/hook', httpStatus: 0, responseTime: 'timeout' },
];

const EVENT_TYPES = [
  'application.submitted',
  'application.updated',
  'case.approved',
  'case.rejected',
  'recommendation.generated',
  'document.uploaded',
  'payment.received',
  'credit_check.completed',
];

export default function WebhooksPage() {
  const [webhooks] = useState<Webhook[]>(MOCK_WEBHOOKS);
  const [showRegister, setShowRegister] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);

  const toggleEvent = (event: string) => {
    setNewEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Webhook Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure event-driven notifications to external systems.</p>
        </div>
        <Link href="/admin" className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 no-underline text-gray-700 dark:text-gray-300">
          &larr; Admin
        </Link>
      </div>

      {/* Registered Webhooks */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-bold text-lg">Registered Webhooks</h2>
          <button
            onClick={() => setShowRegister(!showRegister)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition-colors"
          >
            + Register Webhook
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-750">
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">URL</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Events</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Last Triggered</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map(wh => (
                <tr key={wh.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded break-all">{wh.url}</code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {wh.events.map(ev => (
                        <span key={ev} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">{ev}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      wh.status === 'Active' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>{wh.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{wh.lastTriggered}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-red-600 hover:underline">Disable</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Form */}
      {showRegister && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-6">
          <h3 className="font-bold text-lg mb-4">Register New Webhook</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Endpoint URL</label>
              <input
                type="url"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://your-system.example.com/webhooks"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Event Types</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {EVENT_TYPES.map(ev => (
                  <label key={ev} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEvents.includes(ev)}
                      onChange={() => toggleEvent(ev)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-gray-700 dark:text-gray-300 text-xs">{ev}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Signing Secret</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm font-mono">whsec_mK9nB4xQ7rT2wE5yU8iO</code>
                <button className="text-xs text-blue-600 hover:underline">Regenerate</button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Use this secret to verify webhook signatures (HMAC-SHA256).</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-green-700 text-white text-sm font-bold rounded hover:bg-green-800">Register Webhook</button>
              <button onClick={() => setShowRegister(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Log */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-lg">Delivery Log</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Recent webhook deliveries (last 24 hours)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-750">
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Timestamp</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Event</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">URL</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Response Time</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_DELIVERY_LOG.map(log => (
                <tr key={log.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{log.timestamp}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">{log.event}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{log.url}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      log.httpStatus === 200 ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                      log.httpStatus === 500 ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                      'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                    }`}>{log.httpStatus === 0 ? 'Timeout' : log.httpStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{log.responseTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POC Note */}
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>POC Note:</strong> In production, webhooks would be delivered via an async message queue (AWS SNS/SQS or Azure Service Bus) with retry logic, dead-letter queues, and delivery guarantees. Secrets would be stored in AWS Secrets Manager / Azure Key Vault.
        </p>
      </div>
    </div>
  );
}
