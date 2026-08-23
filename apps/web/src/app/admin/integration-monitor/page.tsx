'use client';

export default function IntegrationMonitorPage() {
  const systems = [
    { name: 'BASYS', status: 'Connected', lastCall: '2s ago', latency: '145ms', todayCalls: 234, errors: 0 },
    { name: 'eDEN', status: 'Connected', lastCall: '5s ago', latency: '210ms', todayCalls: 189, errors: 1 },
    { name: 'DAS Register', status: 'Connected', lastCall: '12s ago', latency: '98ms', todayCalls: 156, errors: 0 },
    { name: 'CFT', status: 'Connected', lastCall: '8s ago', latency: '67ms', todayCalls: 142, errors: 0 },
    { name: 'Moratorium', status: 'Connected', lastCall: '15s ago', latency: '180ms', todayCalls: 98, errors: 0 },
    { name: 'RoI', status: 'Connected', lastCall: '3s ago', latency: '122ms', todayCalls: 167, errors: 0 },
  ];

  const recentErrors = [
    {
      system: 'eDEN',
      time: '14:32 today',
      type: 'Timeout',
      detail: 'Connection timeout after 5000ms. Auto-retried successfully after 200ms.',
      resolution: 'Resolved',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Integration Health Monitor</h1>
            <p className="text-gray-400 text-sm mt-1">Real-time status of AiB system connections</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Refreshing every 10 seconds
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Overall Banner */}
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-block w-3 h-3 bg-green-400 rounded-full"></span>
            <span className="text-green-300 font-medium">All 6 systems connected</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-300">
            <span>Average latency: <strong className="text-white">137ms</strong></span>
            <span>Error rate: <strong className="text-white">0.01%</strong></span>
          </div>
        </div>

        {/* System Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {systems.map((sys) => (
            <div key={sys.name} className="bg-gray-800 border border-gray-700 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 bg-green-400 rounded-full"></span>
                  <h3 className="font-semibold text-white text-lg">{sys.name}</h3>
                </div>
                <span className="text-green-400 text-xs font-medium bg-green-900/50 px-2 py-1 rounded">
                  {sys.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Last call</span>
                  <span className="text-white">{sys.lastCall}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Latency</span>
                  <span className={`font-medium ${
                    parseInt(sys.latency) < 100 ? 'text-green-400' :
                    parseInt(sys.latency) < 200 ? 'text-yellow-400' :
                    'text-orange-400'
                  }`}>{sys.latency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Today</span>
                  <span className="text-white">{sys.todayCalls} calls</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Errors</span>
                  <span className={sys.errors > 0 ? 'text-yellow-400' : 'text-green-400'}>
                    {sys.errors}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Errors */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Recent Errors</h2>
          <div className="space-y-3">
            {recentErrors.map((err, i) => (
              <div key={i} className="bg-gray-800 border border-yellow-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-yellow-900 text-yellow-300 text-xs px-2 py-1 rounded font-medium">
                      {err.system}
                    </span>
                    <span className="text-gray-400 text-sm">{err.time}</span>
                    <span className="text-yellow-400 text-sm font-medium">{err.type}</span>
                  </div>
                  <span className="bg-green-900 text-green-300 text-xs px-2 py-1 rounded font-medium">
                    {err.resolution}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{err.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
