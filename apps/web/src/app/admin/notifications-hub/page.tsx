'use client';

import Link from 'next/link';

const templates = [
  { name: 'Application Received', channel: 'Email', lastSent: '19 Aug 2026, 14:32', deliveryRate: '99.2%' },
  { name: 'Decision Made', channel: 'Both', lastSent: '19 Aug 2026, 11:15', deliveryRate: '98.8%' },
  { name: 'Document Required', channel: 'Email', lastSent: '18 Aug 2026, 16:45', deliveryRate: '97.5%' },
  { name: 'Payment Confirmed', channel: 'SMS', lastSent: '18 Aug 2026, 09:20', deliveryRate: '100%' },
  { name: 'Case Closed', channel: 'Both', lastSent: '17 Aug 2026, 13:00', deliveryRate: '99.1%' },
];

const recentDeliveries = [
  { recipient: 'a.morrison@email.com', template: 'Application Received', channel: 'Email', status: 'Delivered', timestamp: '19 Aug 2026, 14:32' },
  { recipient: '+44 7700 900123', template: 'Decision Made', channel: 'SMS', status: 'Delivered', timestamp: '19 Aug 2026, 14:28' },
  { recipient: 'j.campbell@email.com', template: 'Document Required', channel: 'Email', status: 'Delivered', timestamp: '19 Aug 2026, 13:55' },
  { recipient: '+44 7700 900456', template: 'Payment Confirmed', channel: 'SMS', status: 'Pending', timestamp: '19 Aug 2026, 13:40' },
  { recipient: 'r.stewart@email.com', template: 'Decision Made', channel: 'Email', status: 'Delivered', timestamp: '19 Aug 2026, 12:10' },
  { recipient: 's.macleod@email.com', template: 'Application Received', channel: 'Email', status: 'Failed', timestamp: '19 Aug 2026, 11:45' },
  { recipient: '+44 7700 900789', template: 'Case Closed', channel: 'SMS', status: 'Delivered', timestamp: '19 Aug 2026, 10:30' },
  { recipient: 'k.thomson@email.com', template: 'Case Closed', channel: 'Email', status: 'Delivered', timestamp: '19 Aug 2026, 09:15' },
];

export default function NotificationsHubPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            ← Back to Admin
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">GOV.UK Notify Hub</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Notification template management and delivery monitoring</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Sent Today</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">23</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Delivery Rate</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">98.7%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Failed</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">1</p>
          </div>
        </div>

        {/* Templates Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notification Templates</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Template Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Channel</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Last Sent</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Delivery Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {templates.map((t) => (
                  <tr key={t.name} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{t.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {t.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.lastSent}</td>
                    <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">{t.deliveryRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Deliveries</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Recipient</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Template</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Channel</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentDeliveries.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-mono text-xs">{d.recipient}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{d.template}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{d.channel}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        d.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        d.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{d.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
