'use client';

export default function WorkflowEnginePage() {
  const states = [
    { name: 'Draft', count: 2, color: 'bg-gray-600' },
    { name: 'Submitted', count: 5, color: 'bg-blue-600' },
    { name: 'Under Review', count: 3, color: 'bg-yellow-600' },
    { name: 'Decision', count: 1, color: 'bg-purple-600' },
    { name: 'Complete', count: 38, color: 'bg-green-600' },
  ];

  const transitions = [
    { from: 'Draft', to: 'Submitted', trigger: 'Applicant clicks Submit', conditions: 'All sections complete' },
    { from: 'Submitted', to: 'Under Review', trigger: 'Auto-assigned to officer', conditions: 'Credit check passed' },
    { from: 'Under Review', to: 'Decision', trigger: 'Officer clicks Approve/Reject', conditions: 'Quality check passed' },
    { from: 'Decision', to: 'Complete', trigger: 'Decision letter sent', conditions: 'All notifications dispatched' },
  ];

  const slaTimers = [
    { state: 'Submitted', maxTime: '2 days', escalateTo: 'Team Lead' },
    { state: 'Under Review', maxTime: '5 days', escalateTo: 'Senior Officer' },
    { state: 'Decision', maxTime: '1 day', escalateTo: 'Operations Manager' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Case Workflow Engine</h1>
          <p className="text-gray-400 text-sm mt-1">Visual case lifecycle state machine</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Visual Flow Diagram */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Case Lifecycle</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
            <div className="flex items-center justify-between overflow-x-auto gap-2">
              {states.map((state, i) => (
                <div key={state.name} className="flex items-center">
                  {/* State Box */}
                  <div className="flex flex-col items-center">
                    <div className={`${state.color} rounded-xl px-6 py-4 min-w-[140px] text-center shadow-lg`}>
                      <p className="font-semibold text-white">{state.name}</p>
                    </div>
                    <span className="mt-2 bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                      {state.count} cases
                    </span>
                  </div>
                  {/* Arrow */}
                  {i < states.length - 1 && (
                    <div className="flex items-center mx-2">
                      <div className="w-8 h-0.5 bg-gray-500"></div>
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-gray-500"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Transition Rules */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Transition Rules</h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors opacity-50 cursor-not-allowed">
              Add Transition
            </button>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">From State</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">To State</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Trigger</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Conditions</th>
                </tr>
              </thead>
              <tbody>
                {transitions.map((t, i) => (
                  <tr key={i} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded">{t.from}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded">{t.to}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{t.trigger}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{t.conditions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SLA Timers */}
        <section>
          <h2 className="text-xl font-semibold mb-4">SLA Timers</h2>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">State</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Max Time Before Escalation</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Escalate To</th>
                </tr>
              </thead>
              <tbody>
                {slaTimers.map((sla, i) => (
                  <tr key={i} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm text-white">{sla.state}</td>
                    <td className="px-4 py-3 text-sm text-yellow-400 font-medium">{sla.maxTime}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{sla.escalateTo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* POC Note */}
        <div className="bg-gray-800 border border-blue-700 rounded-lg p-4">
          <p className="text-blue-400 text-sm">
            <strong>POC Note:</strong> In production, workflows would be configurable without code changes via an admin UI with drag-and-drop state management and rule builders.
          </p>
        </div>
      </main>
    </div>
  );
}
