'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdviserWorkspacePage() {
  const [searchTerm, setSearchTerm] = useState('');

  const clients = [
    { name: 'Margaret Douglas', ref: 'IAAS-2026-00012', product: 'DAS', status: 'Active', lastContact: '18 Aug 2026', nextAction: 'Annual review' },
    { name: 'Steven Clark', ref: 'IAAS-2026-00034', product: 'MAP', status: 'Submitted', lastContact: '17 Aug 2026', nextAction: 'Await decision' },
    { name: 'Jennifer Wallace', ref: 'IAAS-2026-00056', product: 'DAS', status: 'Draft', lastContact: '16 Aug 2026', nextAction: 'Complete income section' },
    { name: 'Andrew Mitchell', ref: 'IAAS-2026-00067', product: 'PTD', status: 'Under Review', lastContact: '15 Aug 2026', nextAction: 'Provide bank statements' },
    { name: 'Fiona Robertson', ref: 'IAAS-2026-00071', product: 'DAS', status: 'Active', lastContact: '14 Aug 2026', nextAction: 'Payment review' },
    { name: 'Thomas Graham', ref: 'IAAS-2026-00083', product: 'Sequestration', status: 'Submitted', lastContact: '13 Aug 2026', nextAction: 'Await trustee appointment' },
    { name: 'Patricia Young', ref: 'IAAS-2026-00089', product: 'MAP', status: 'Complete', lastContact: '12 Aug 2026', nextAction: 'Case closed' },
    { name: 'William Henderson', ref: 'IAAS-2026-00095', product: 'DAS', status: 'Draft', lastContact: '11 Aug 2026', nextAction: 'Schedule initial meeting' },
  ];

  const appointments = [
    { name: 'Jennifer Wallace', date: '20 Aug 2026', time: '10:00', type: 'Initial' },
    { name: 'Andrew Mitchell', date: '21 Aug 2026', time: '14:30', type: 'Review' },
    { name: 'William Henderson', date: '22 Aug 2026', time: '09:00', type: 'Follow-up' },
  ];

  const recentActivity = [
    { action: 'Submitted case for Steven Clark', time: '2 hours ago', icon: '📤' },
    { action: 'Uploaded bank statements for Andrew Mitchell', time: '4 hours ago', icon: '📎' },
    { action: 'Completed income section for Jennifer Wallace', time: 'Yesterday', icon: '✏️' },
    { action: 'Annual review completed for Fiona Robertson', time: 'Yesterday', icon: '✅' },
    { action: 'New client registered: William Henderson', time: '2 days ago', icon: '👤' },
  ];

  // Derived from the arrays above so the headline figures can never drift from the rows
  // rendered underneath them — the previous hardcoded "42" contradicted an 8-row table.
  const kpis = [
    { label: 'Active Clients', value: String(clients.length), icon: '👥' },
    { label: 'Pending Submissions', value: String(clients.filter((c) => c.status === 'Submitted').length), icon: '📤' },
    { label: 'Appointments This Week', value: String(appointments.length), icon: '📅' },
    { label: 'Success Rate', value: '89%', icon: '✅' },
  ];

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Money Adviser Workspace</h1>
            <p className="text-gray-400 text-sm mt-1">Fiona MacRae, Citizens Advice Scotland</p>
          </div>
          <span className="bg-purple-600 text-white text-sm px-3 py-1 rounded-full font-medium">
            Money Adviser
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Honesty notice — this screen is a static mock, so say so rather than let the
            chrome imply a working caseload system. */}
        <div data-demo="adviser-notice" className="bg-gray-800 border border-gray-700 border-l-4 border-l-blue-500 rounded-lg p-4">
          <p className="text-sm font-semibold text-white">Interface demonstration</p>
          <p className="text-sm text-gray-300 mt-1">
            This screen shows the intended money adviser interface using synthetic data. Client
            records, appointments and activity are illustrative only. Creating clients and
            submitting an application on behalf of a named client with a recorded declaration of
            authority are not yet implemented.
          </p>
        </div>

        {/* KPI Cards */}
        <div data-demo="adviser-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-gray-800 rounded-lg p-5 border border-gray-700">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{kpi.icon}</span>
                <div>
                  <p className="text-gray-400 text-sm">{kpi.label}</p>
                  <p className="text-2xl font-bold text-white">{kpi.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* My Clients */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Clients</h2>
            <div className="flex gap-3">
              <Link
                href="/apply"
                title="Opens the standard application wizard. It does not yet carry client context or an authority declaration."
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Submit on Behalf
              </Link>
              {/* Kept visible but disabled: the capability is part of the intended design, and
                  hiding it would lose that from the demonstration. Removing the handler-less
                  button entirely was the alternative. */}
              <button
                data-demo="adviser-new-client"
                type="button"
                disabled
                title="Not implemented — client records are synthetic in this demonstration."
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium opacity-50 cursor-not-allowed"
              >
                New Client
              </button>
            </div>
          </div>

          {/* Client Search */}
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search clients by name, reference, or product..."
              className="w-full md:w-96 bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div data-demo="adviser-clients" className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Client Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Case Ref</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Product</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Last Contact</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Next Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c) => (
                  <tr key={c.ref} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm text-white">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-blue-400 font-mono">{c.ref}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">{c.product}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        c.status === 'Active' ? 'bg-green-900 text-green-300' :
                        c.status === 'Submitted' ? 'bg-blue-900 text-blue-300' :
                        c.status === 'Draft' ? 'bg-gray-700 text-gray-300' :
                        c.status === 'Under Review' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-purple-900 text-purple-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{c.lastContact}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{c.nextAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
            <div className="space-y-3">
              {appointments.map((appt, i) => (
                <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{appt.name}</p>
                    <p className="text-gray-400 text-sm">{appt.date} at {appt.time}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    appt.type === 'Initial' ? 'bg-blue-900 text-blue-300' :
                    appt.type === 'Review' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-green-900 text-green-300'
                  }`}>
                    {appt.type}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center gap-3">
                  <span className="text-lg">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
