'use client';

import { useState } from 'react';

export default function CorrespondenceSchedulerPage() {
  const [paused, setPaused] = useState(false);

  const upcomingSends = [
    { date: '24 Aug', items: '3 follow-up reminders', detail: '14-day deadline approaching' },
    { date: '25 Aug', items: '1 system maintenance notification', detail: 'Planned downtime 02:00–04:00' },
    { date: '27 Aug', items: '2 decision notifications', detail: 'DAS approval + MAP rejection' },
    { date: '29 Aug', items: '5 monthly payment confirmations', detail: 'DAS payment plan reminders' },
  ];

  const automationRules = [
    { trigger: 'Application submitted', template: 'Acknowledgement', delay: 'Immediate', channel: 'Email' },
    { trigger: '14 days no response', template: 'Reminder', delay: 'Auto', channel: 'Email + Post' },
    { trigger: 'Decision made', template: 'Decision Notification', delay: 'Immediate', channel: 'Email + Post' },
    { trigger: 'Payment due', template: 'Payment Reminder', delay: '3 days before', channel: 'SMS' },
  ];

  const stats = [
    { label: 'Scheduled this week', value: '14' },
    { label: 'Sent today', value: '6' },
    { label: 'Delivery rate', value: '99.2%' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Correspondence Scheduler</h1>
            <p className="text-gray-400 text-sm mt-1">Automated letter and notification scheduling</p>
          </div>
          <button
            onClick={() => setPaused(!paused)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              paused
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {paused ? 'Resume All' : 'Pause All'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Paused Banner */}
        {paused && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 flex items-center gap-3">
            <span className="text-red-400 text-lg">⚠️</span>
            <span className="text-red-300 font-medium">All automated correspondence is currently paused.</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-gray-800 rounded-lg p-5 border border-gray-700 text-center">
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Upcoming Sends */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Upcoming Sends — Next 7 Days</h2>
          <div className="space-y-3">
            {upcomingSends.map((send, i) => (
              <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-900 text-blue-300 px-3 py-2 rounded-lg text-center min-w-[70px]">
                    <span className="text-sm font-bold">{send.date}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{send.items}</p>
                    <p className="text-gray-400 text-sm">{send.detail}</p>
                  </div>
                </div>
                <span className="text-gray-500 text-sm">📧</span>
              </div>
            ))}
          </div>
        </section>

        {/* Automation Rules */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Automation Rules</h2>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Trigger</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Template</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Delay</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Channel</th>
                </tr>
              </thead>
              <tbody>
                {automationRules.map((rule, i) => (
                  <tr key={i} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm text-white">{rule.trigger}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">{rule.template}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{rule.delay}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rule.channel === 'Email' ? 'bg-blue-900 text-blue-300' :
                        rule.channel === 'SMS' ? 'bg-purple-900 text-purple-300' :
                        'bg-indigo-900 text-indigo-300'
                      }`}>
                        {rule.channel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
