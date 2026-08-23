'use client';

import { useState } from 'react';

export default function CreditorPortalPage() {
  const [showClaimForm, setShowClaimForm] = useState(false);

  const kpis = [
    { label: 'Active Cases', value: '23', icon: '📋' },
    { label: 'Pending Claims', value: '5', icon: '⏳' },
    { label: 'Dividends Due', value: '£4,230', icon: '💷' },
    { label: 'Proposals to Vote', value: '2', icon: '🗳️' },
  ];

  const cases = [
    { debtor: 'James Murray', ref: 'IAAS-2026-00045', debt: '£12,400', status: 'Active DAS', dividendRate: '45p/£' },
    { debtor: 'Sarah Henderson', ref: 'IAAS-2026-00052', debt: '£8,750', status: 'Active PTD', dividendRate: '32p/£' },
    { debtor: 'Robert MacPherson', ref: 'IAAS-2026-00061', debt: '£23,100', status: 'Sequestration', dividendRate: '18p/£' },
    { debtor: 'Linda Campbell', ref: 'IAAS-2026-00078', debt: '£5,200', status: 'Active DAS', dividendRate: '62p/£' },
    { debtor: 'Michael Stewart', ref: 'IAAS-2026-00084', debt: '£15,800', status: 'Active DAS', dividendRate: '38p/£' },
    { debtor: 'Karen Thomson', ref: 'IAAS-2026-00091', debt: '£9,300', status: 'Active PTD', dividendRate: '41p/£' },
  ];

  const proposals = [
    { debtor: 'David Wilson', ref: 'IAAS-2026-00098', type: 'DAS Payment Programme', proposedRate: '£180/month', duration: '8 years' },
    { debtor: 'Emma Robertson', ref: 'IAAS-2026-00103', type: 'PTD Proposal', proposedRate: '£250/month', duration: '4 years' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Creditor Portal</h1>
            <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full font-medium">
              Royal Bank of Scotland
            </span>
          </div>
          <span className="text-gray-400 text-sm">Creditor ID: CRD-RBS-001</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* My Cases Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Cases</h2>
            <button
              onClick={() => setShowClaimForm(!showClaimForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Submit New Claim
            </button>
          </div>

          {showClaimForm && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-medium mb-4">New Claim Submission</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Debtor Name</label>
                  <input type="text" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" placeholder="Enter debtor name" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Case Reference</label>
                  <input type="text" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" placeholder="IAAS-2026-XXXXX" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amount Owed</label>
                  <input type="text" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" placeholder="£0.00" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Debt Type</label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                    <option>Loan</option>
                    <option>Credit Card</option>
                    <option>Overdraft</option>
                    <option>Mortgage Shortfall</option>
                  </select>
                </div>
              </div>
              <p className="text-gray-500 text-sm mt-4 italic">This form is a placeholder for demonstration purposes.</p>
            </div>
          )}

          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Debtor Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Case Ref</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Debt Owed</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Dividend Rate</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.ref} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm text-white">{c.debtor}</td>
                    <td className="px-4 py-3 text-sm text-blue-400 font-mono">{c.ref}</td>
                    <td className="px-4 py-3 text-sm text-white">{c.debt}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        c.status === 'Active DAS' ? 'bg-green-900 text-green-300' :
                        c.status === 'Active PTD' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{c.dividendRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Vote on Proposals */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Vote on Proposals</h2>
          <div className="space-y-4">
            {proposals.map((p) => (
              <div key={p.ref} className="bg-gray-800 border border-gray-700 rounded-lg p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">{p.debtor} — {p.type}</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Ref: {p.ref} • Proposed: {p.proposedRate} for {p.duration}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      Accept
                    </button>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dividend Schedule */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Dividend Schedule</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-gray-400 text-sm">Next Payment Date</p>
                <p className="text-lg font-semibold text-white">15 September 2026</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Amount</p>
                <p className="text-lg font-semibold text-white">£4,230.00</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Frequency</p>
                <p className="text-lg font-semibold text-white">Quarterly</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              Dividends are calculated based on available funds in each case and distributed proportionally to registered creditors.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
